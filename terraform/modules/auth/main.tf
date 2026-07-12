terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  common_tags   = merge({ Module = "auth" }, var.tags)
  domain_prefix = var.cognito_domain_suffix != null ? "${var.project_name}-${var.environment}-${var.cognito_domain_suffix}" : "${var.project_name}-${var.environment}"
}

data "aws_region" "current" {}

resource "aws_cognito_user_pool" "this" {
  count = var.enabled ? 1 : 0
  name  = "${var.name}-user-pool"

  password_policy {
    minimum_length                   = 8
    require_uppercase                = true
    require_numbers                  = true
    require_lowercase                = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  auto_verified_attributes = ["email"]

  tags = merge(local.common_tags, { Name = "${var.name}-user-pool" })
}

resource "aws_cognito_user_pool_client" "this" {
  count        = var.enabled ? 1 : 0
  name         = "${var.name}-spa-client"
  user_pool_id = aws_cognito_user_pool.this[0].id

  # Sin secret — apto para uso desde SPA / frontend
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]
}

resource "aws_cognito_user_pool_domain" "this" {
  count        = var.enabled ? 1 : 0
  domain       = local.domain_prefix
  user_pool_id = aws_cognito_user_pool.this[0].id
}
