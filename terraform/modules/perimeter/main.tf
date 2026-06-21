terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

locals {
  custom_domain_requested = var.custom_domain_name != null && trimspace(var.custom_domain_name) != ""
  request_certificate     = var.enabled && local.custom_domain_requested && var.enable_acm_certificate
  route53_ready           = local.request_certificate && var.route53_zone_id != null && trimspace(var.route53_zone_id) != "" && var.manage_route53_records
  common_tags = merge(
    {
      Module = "perimeter"
    },
    var.tags
  )
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  provider = aws.us_east_1
  name     = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host_header" {
  provider = aws.us_east_1
  name     = "Managed-AllViewerExceptHostHeader"
}

resource "aws_wafv2_web_acl" "this" {
  provider = aws.us_east_1
  count    = var.enabled ? 1 : 0

  name  = "${var.name}-web-acl"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${replace(var.name, "-", "")}WebAcl"
    sampled_requests_enabled   = true
  }

  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${replace(var.name, "-", "")}IpReputation"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${replace(var.name, "-", "")}CommonRules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 30

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${replace(var.name, "-", "")}KnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-web-acl"
      Tier = "edge"
    }
  )
}

resource "aws_acm_certificate" "this" {
  provider = aws.us_east_1
  count    = local.request_certificate ? 1 : 0

  domain_name       = var.custom_domain_name
  validation_method = "DNS"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-viewer-cert"
      Tier = "edge"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "acm_validation" {
  for_each = local.route53_ready ? {
    for option in aws_acm_certificate.this[0].domain_validation_options :
    option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  } : {}

  zone_id         = var.route53_zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "this" {
  provider = aws.us_east_1
  count    = local.route53_ready ? 1 : 0

  certificate_arn         = aws_acm_certificate.this[0].arn
  validation_record_fqdns = [for record in aws_route53_record.acm_validation : record.fqdn]
}

resource "aws_cloudfront_distribution" "this" {
  provider = aws.us_east_1
  count    = var.enabled ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Perimetro publico para ${var.name}"
  price_class         = var.price_class
  wait_for_deployment = false
  aliases             = local.route53_ready ? [var.custom_domain_name] : []
  web_acl_id          = aws_wafv2_web_acl.this[0].arn

  origin {
    domain_name = var.origin_domain_name
    origin_id   = "${var.name}-origin"

    custom_origin_config {
      http_port              = var.origin_http_port
      https_port             = var.origin_https_port
      origin_protocol_policy = var.origin_protocol_policy
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${var.name}-origin"

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host_header.id
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = local.route53_ready ? aws_acm_certificate_validation.this[0].certificate_arn : null
    cloudfront_default_certificate = local.route53_ready ? false : true
    minimum_protocol_version       = "TLSv1.2_2021"
    ssl_support_method             = local.route53_ready ? "sni-only" : null
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-cloudfront"
      Tier = "edge"
    }
  )
}

resource "aws_route53_record" "cloudfront_alias" {
  count = local.route53_ready ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.custom_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.this[0].domain_name
    zone_id                = aws_cloudfront_distribution.this[0].hosted_zone_id
    evaluate_target_health = false
  }
}
