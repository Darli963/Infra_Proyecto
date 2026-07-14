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
  custom_domain_name_normalized     = var.custom_domain_name != null ? trimspace(var.custom_domain_name) : ""
  route53_zone_id_normalized        = var.route53_zone_id != null ? trimspace(var.route53_zone_id) : ""
  custom_domain_requested           = local.custom_domain_name_normalized != ""
  request_certificate               = var.enabled && local.custom_domain_requested && var.enable_acm_certificate
  route53_ready                     = local.request_certificate && local.route53_zone_id_normalized != "" && var.manage_route53_records
  geo_allowlist_enabled             = var.geo_allowlist_enabled && length(var.allowed_country_codes) > 0
  sensitive_path_rate_limit_enabled = var.enable_sensitive_path_rate_limit && length(var.sensitive_path_patterns) > 0
  frontend_origin_enabled           = var.enable_frontend_origin
  common_tags = merge(
    {
      Module = "perimeter"
    },
    var.tags
  )
}

data "aws_region" "current" {}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  provider = aws.us_east_1
  name     = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host_header" {
  provider = aws.us_east_1
  name     = "Managed-AllViewerExceptHostHeader"
}

resource "aws_cloudfront_origin_access_control" "frontend_s3" {
  provider = aws.us_east_1
  count    = var.enabled && local.frontend_origin_enabled ? 1 : 0

  name                              = "${var.name}-frontend-oac"
  description                       = "Acceso privado de CloudFront al bucket S3 del frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "spa_rewrite" {
  provider = aws.us_east_1
  count    = var.enabled && local.frontend_origin_enabled ? 1 : 0

  name    = replace("${var.name}-spa-rewrite", "-", "_")
  runtime = "cloudfront-js-1.0"
  comment = "Reescribe rutas SPA hacia index.html"
  publish = true
  code    = <<-EOT
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.startsWith('/api/')) {
    return request;
  }

  if (uri === '/' || uri === '') {
    request.uri = '/index.html';
    return request;
  }

  if (!uri.includes('.')) {
    request.uri = '/index.html';
  }

  return request;
}
EOT
}

resource "aws_wafv2_web_acl" "this" {
  provider = aws.us_east_1
  count    = var.enabled ? 1 : 0

  name  = "${var.name}-web-acl"
  scope = "CLOUDFRONT"

  default_action {
    dynamic "allow" {
      for_each = local.geo_allowlist_enabled ? [] : [1]
      content {}
    }

    dynamic "block" {
      for_each = local.geo_allowlist_enabled ? [1] : []
      content {}
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${replace(var.name, "-", "")}WebAcl"
    sampled_requests_enabled   = true
  }

  dynamic "rule" {
    for_each = var.enable_rate_limit ? [1] : []

    content {
      name     = "RateLimitBlock"
      priority = 5

      action {
        block {}
      }

      statement {
        rate_based_statement {
          limit              = var.rate_limit_requests
          aggregate_key_type = "IP"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${replace(var.name, "-", "")}RateLimit"
        sampled_requests_enabled   = true
      }
    }
  }

  dynamic "rule" {
    for_each = local.sensitive_path_rate_limit_enabled ? [1] : []

    content {
      name     = "SensitivePathRateLimit"
      priority = 8

      action {
        block {}
      }

      statement {
        rate_based_statement {
          limit              = var.sensitive_path_rate_limit_requests
          aggregate_key_type = "IP"

          scope_down_statement {
            dynamic "byte_match_statement" {
              for_each = length(var.sensitive_path_patterns) == 1 ? [var.sensitive_path_patterns[0]] : []

              content {
                positional_constraint = "STARTS_WITH"
                search_string         = byte_match_statement.value

                field_to_match {
                  uri_path {}
                }

                text_transformation {
                  priority = 0
                  type     = "NONE"
                }
              }
            }

            dynamic "or_statement" {
              for_each = length(var.sensitive_path_patterns) > 1 ? [1] : []

              content {
                dynamic "statement" {
                  for_each = var.sensitive_path_patterns

                  content {
                    byte_match_statement {
                      positional_constraint = "STARTS_WITH"
                      search_string         = statement.value

                      field_to_match {
                        uri_path {}
                      }

                      text_transformation {
                        priority = 0
                        type     = "NONE"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${replace(var.name, "-", "")}SensitiveRateLimit"
        sampled_requests_enabled   = true
      }
    }
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

        rule_action_override {
          name = "SizeRestrictions_BODY"
          action_to_use {
            count {}
          }
        }
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

  dynamic "rule" {
    for_each = local.geo_allowlist_enabled ? [1] : []

    content {
      name     = "GeoAllowlist"
      priority = 40

      action {
        allow {}
      }

      statement {
        geo_match_statement {
          country_codes = var.allowed_country_codes
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${replace(var.name, "-", "")}GeoAllowlist"
        sampled_requests_enabled   = true
      }
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

  dynamic "origin" {
    for_each = local.frontend_origin_enabled ? [1] : []

    content {
      domain_name              = var.frontend_bucket_regional_domain_name
      origin_id                = "${var.name}-frontend-origin"
      origin_access_control_id = aws_cloudfront_origin_access_control.frontend_s3[0].id
      origin_path              = var.frontend_origin_path
    }
  }

  dynamic "origin" {
    for_each = var.origin_domain_name != null ? [1] : []

    content {
      domain_name = var.origin_domain_name
      origin_id   = "${var.name}-origin"

      custom_origin_config {
        http_port              = var.origin_http_port
        https_port             = var.origin_https_port
        origin_protocol_policy = var.origin_protocol_policy
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  dynamic "origin" {
    for_each = var.api_gateway_domain_name != null ? [1] : []

    content {
      domain_name = var.api_gateway_domain_name
      origin_id   = "${var.name}-apigw-origin"

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  dynamic "ordered_cache_behavior" {
    for_each = var.api_gateway_domain_name != null ? [1] : []

    content {
      path_pattern     = "/api/*"
      target_origin_id = "${var.name}-apigw-origin"

      allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods         = ["GET", "HEAD"]
      viewer_protocol_policy = "redirect-to-https"
      compress               = true

      forwarded_values {
        query_string = true

        cookies {
          forward = "all"
        }

        headers = ["Authorization", "Content-Type", "Accept", "Origin"]
      }

      min_ttl     = 0
      default_ttl = 0
      max_ttl     = 0
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.frontend_origin_enabled ? "${var.name}-frontend-origin" : "${var.name}-origin"

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = local.frontend_origin_enabled ? null : data.aws_cloudfront_origin_request_policy.all_viewer_except_host_header.id
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true

    dynamic "function_association" {
      for_each = local.frontend_origin_enabled ? [1] : []

      content {
        event_type   = "viewer-request"
        function_arn = aws_cloudfront_function.spa_rewrite[0].arn
      }
    }
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

data "aws_iam_policy_document" "frontend_bucket_read" {
  count = var.enabled && local.frontend_origin_enabled ? 1 : 0

  statement {
    sid    = "AllowCloudFrontReadFrontendPrefix"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = ["s3:GetObject"]
    resources = [
      "${var.frontend_bucket_arn}/frontend/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this[0].arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend_private_read" {
  count  = var.enabled && local.frontend_origin_enabled ? 1 : 0
  bucket = replace(var.frontend_bucket_arn, "arn:aws:s3:::", "")
  policy = data.aws_iam_policy_document.frontend_bucket_read[0].json
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
