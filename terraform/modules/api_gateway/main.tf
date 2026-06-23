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
  common_tags = merge({ Module = "api-gateway" }, var.tags)
}

# Security Group dedicado para el VPC Link — permite salida hacia el SG del ALB
resource "aws_security_group" "vpc_link" {
  count       = var.enabled ? 1 : 0
  name        = "${var.name}-apigw-vpc-link-sg"
  description = "Trafico de salida del VPC Link hacia el ALB"
  vpc_id      = var.vpc_id

  egress {
    description     = "VPC Link hacia ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = var.alb_security_group_id != null ? [var.alb_security_group_id] : null
    cidr_blocks     = var.alb_security_group_id == null ? ["0.0.0.0/0"] : null
  }

  tags = merge(local.common_tags, { Name = "${var.name}-apigw-vpc-link-sg" })
}

resource "aws_apigatewayv2_vpc_link" "this" {
  count              = var.enabled ? 1 : 0
  name               = "${var.name}-vpc-link"
  subnet_ids         = var.private_subnet_ids
  security_group_ids = [aws_security_group.vpc_link[0].id]

  tags = merge(local.common_tags, { Name = "${var.name}-vpc-link" })
}

resource "aws_apigatewayv2_api" "this" {
  count         = var.enabled ? 1 : 0
  name          = "${var.name}-http-api"
  protocol_type = "HTTP"

  tags = merge(local.common_tags, { Name = "${var.name}-http-api" })
}

# count depende solo de var.enabled (variable estática) para evitar
# el error "count depends on resource attributes unknown until apply"
resource "aws_apigatewayv2_integration" "alb" {
  count      = var.enabled ? 1 : 0
  api_id     = aws_apigatewayv2_api.this[0].id
  depends_on = [aws_apigatewayv2_vpc_link.this]

  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  integration_uri        = var.alb_listener_arn
  connection_type        = "VPC_LINK"
  connection_id          = aws_apigatewayv2_vpc_link.this[0].id
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  count            = var.enabled && var.enable_jwt_authorizer ? 1 : 0
  api_id           = aws_apigatewayv2_api.this[0].id
  name             = "${var.name}-jwt-authorizer"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    issuer   = var.cognito_user_pool_endpoint
    audience = [var.cognito_user_pool_client_id]
  }
}

resource "aws_apigatewayv2_route" "default" {
  count     = var.enabled ? 1 : 0
  api_id    = aws_apigatewayv2_api.this[0].id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.alb[0].id}"

  authorization_type = var.enable_jwt_authorizer ? "JWT" : "NONE"
  authorizer_id      = var.enable_jwt_authorizer ? aws_apigatewayv2_authorizer.jwt[0].id : null
}

resource "aws_apigatewayv2_stage" "default" {
  count       = var.enabled ? 1 : 0
  api_id      = aws_apigatewayv2_api.this[0].id
  name        = "$default"
  auto_deploy = true

  tags = merge(local.common_tags, { Name = "${var.name}-default-stage" })
}
