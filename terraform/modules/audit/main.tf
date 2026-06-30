terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "aws_partition" "current" {}
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  common_tags            = merge({ Module = "audit" }, var.tags)
  account_id             = data.aws_caller_identity.current.account_id
  access_log_bucket_name = trim(lower(substr("${var.log_bucket_name}-access-logs", 0, 63)), "-")
}

resource "aws_kms_key" "audit_logs" {
  count = var.enabled ? 1 : 0

  description             = "KMS key para cifrado de logs de auditoria"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAccountAdministration"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudTrailUseOfTheKey"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowConfigUseOfTheKey"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, { Name = "${var.name}-audit-kms" })
}

resource "aws_kms_alias" "audit_logs" {
  count = var.enabled ? 1 : 0

  name          = "alias/${var.name}-audit-logs"
  target_key_id = aws_kms_key.audit_logs[0].key_id
}

resource "aws_s3_bucket" "audit_logs" {
  count = var.enabled ? 1 : 0

  bucket        = var.log_bucket_name
  force_destroy = false
  tags          = merge(local.common_tags, { Name = var.log_bucket_name })
}

resource "aws_s3_bucket" "audit_access_logs" {
  count = var.enabled ? 1 : 0

  bucket        = local.access_log_bucket_name
  force_destroy = false
  tags          = merge(local.common_tags, { Name = local.access_log_bucket_name })
}

resource "aws_s3_bucket_versioning" "audit_access_logs" {
  count = var.enabled ? 1 : 0

  bucket = aws_s3_bucket.audit_access_logs[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "audit_access_logs" {
  count = var.enabled ? 1 : 0

  bucket                  = aws_s3_bucket.audit_access_logs[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_access_logs" {
  count = var.enabled ? 1 : 0

  bucket = aws_s3_bucket.audit_access_logs[0].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_iam_policy_document" "audit_access_logs" {
  count = var.enabled ? 1 : 0

  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.audit_access_logs[0].arn,
      "${aws_s3_bucket.audit_access_logs[0].arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid    = "S3LogDeliveryAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logging.s3.amazonaws.com"]
    }

    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.audit_access_logs[0].arn]
  }

  statement {
    sid    = "S3LogDeliveryWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logging.s3.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.audit_access_logs[0].arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "audit_access_logs" {
  count = var.enabled ? 1 : 0

  bucket = aws_s3_bucket.audit_access_logs[0].id
  policy = data.aws_iam_policy_document.audit_access_logs[0].json
}

resource "aws_s3_bucket_logging" "audit_access_logs" {
  count = var.enabled ? 1 : 0

  bucket        = aws_s3_bucket.audit_access_logs[0].id
  target_bucket = aws_s3_bucket.audit_access_logs[0].id
  target_prefix = "s3-access-logs/"
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  count = var.enabled ? 1 : 0

  bucket = aws_s3_bucket.audit_logs[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  count = var.enabled ? 1 : 0

  bucket                  = aws_s3_bucket.audit_logs[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  count = var.enabled ? 1 : 0

  bucket = aws_s3_bucket.audit_logs[0].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.audit_logs[0].arn
    }
  }
}

resource "aws_s3_bucket_logging" "audit_logs" {
  count = var.enabled ? 1 : 0

  bucket        = aws_s3_bucket.audit_logs[0].id
  target_bucket = aws_s3_bucket.audit_access_logs[0].id
  target_prefix = "s3-access-logs/"
}

data "aws_iam_policy_document" "audit_logs" {
  count = var.enabled ? 1 : 0

  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.audit_logs[0].arn,
      "${aws_s3_bucket.audit_logs[0].arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.audit_logs[0].arn]
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.audit_logs[0].arn}/AWSLogs/${local.account_id}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }

  statement {
    sid    = "AWSConfigAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }

    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.audit_logs[0].arn]
  }

  statement {
    sid    = "AWSConfigWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.audit_logs[0].arn}/AWSLogs/${local.account_id}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "audit_logs" {
  count = var.enabled ? 1 : 0

  bucket = aws_s3_bucket.audit_logs[0].id
  policy = data.aws_iam_policy_document.audit_logs[0].json
}

resource "aws_cloudtrail" "this" {
  count = var.enabled ? 1 : 0

  name                          = "${var.name}-trail"
  s3_bucket_name                = aws_s3_bucket.audit_logs[0].id
  kms_key_id                    = aws_kms_key.audit_logs[0].arn
  is_multi_region_trail         = var.cloudtrail_is_multi_region
  include_global_service_events = true
  enable_log_file_validation    = var.cloudtrail_enable_log_file_validation

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  tags = merge(local.common_tags, { Name = "${var.name}-trail" })

  depends_on = [aws_s3_bucket_policy.audit_logs]
}

resource "aws_iam_role" "config" {
  count = var.enabled ? 1 : 0

  name = "${var.name}-aws-config-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, { Name = "${var.name}-aws-config-role" })
}

resource "aws_iam_role_policy_attachment" "config_managed" {
  count = var.enabled ? 1 : 0

  role       = aws_iam_role.config[0].name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSConfigRole"
}

resource "aws_iam_role_policy" "config_delivery" {
  count = var.enabled ? 1 : 0

  name = "${var.name}-aws-config-delivery"
  role = aws_iam_role.config[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ConfigS3Delivery"
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = [aws_s3_bucket.audit_logs[0].arn]
      },
      {
        Sid    = "ConfigS3PutObject"
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = ["${aws_s3_bucket.audit_logs[0].arn}/AWSLogs/${local.account_id}/*"]
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_config_configuration_recorder" "this" {
  count = var.enabled ? 1 : 0

  name     = "${var.name}-config-recorder"
  role_arn = aws_iam_role.config[0].arn

  recording_group {
    all_supported                 = var.config_record_all_supported
    include_global_resource_types = var.config_include_global_resource_types
  }
}

resource "aws_config_delivery_channel" "this" {
  count = var.enabled ? 1 : 0

  name           = "${var.name}-config-delivery"
  s3_bucket_name = aws_s3_bucket.audit_logs[0].bucket

  depends_on = [aws_config_configuration_recorder.this]
}

resource "aws_config_configuration_recorder_status" "this" {
  count = var.enabled ? 1 : 0

  name       = aws_config_configuration_recorder.this[0].name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.this]
}
