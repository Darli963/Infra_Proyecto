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
  common_tags = merge(
    {
      Module = "security-base"
    },
    var.tags
  )

  alb_ingress_rules = flatten([
    for port in var.alb_ingress_ports : [
      for cidr in var.alb_ingress_cidrs : {
        port = port
        cidr = cidr
      }
    ]
  ])
}

data "aws_ec2_managed_prefix_list" "cloudfront_origin_facing" {
  count = var.alb_ingress_use_cloudfront_prefix_list ? 1 : 0

  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_iam_role" "ec2_ssm" {
  name = "${var.name}-ec2-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-ec2-ssm-role"
      Tier = "compute"
    }
  )
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_ssm" {
  name = "${var.name}-ec2-ssm-profile"
  role = aws_iam_role.ec2_ssm.name

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-ec2-ssm-profile"
      Tier = "compute"
    }
  )
}

resource "aws_security_group" "alb" {
  name        = "${var.name}-alb-sg"
  description = "Permite trafico externo hacia el ALB"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.alb_ingress_use_cloudfront_prefix_list ? [] : local.alb_ingress_rules
    content {
      description = "Internet hacia ALB puerto ${ingress.value.port}"
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = "tcp"
      cidr_blocks = [ingress.value.cidr]
    }
  }

  dynamic "ingress" {
    for_each = var.alb_ingress_use_cloudfront_prefix_list ? toset(var.alb_ingress_ports) : []
    content {
      description     = "CloudFront origin-facing hacia ALB puerto ${ingress.value}"
      from_port       = ingress.value
      to_port         = ingress.value
      protocol        = "tcp"
      prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront_origin_facing[0].id]
    }
  }

  dynamic "egress" {
    for_each = toset(var.ec2_ingress_ports)
    content {
      description = "ALB hacia aplicaciones EC2 puerto ${egress.value}"
      from_port   = egress.value
      to_port     = egress.value
      protocol    = "tcp"
      cidr_blocks = [var.vpc_cidr]
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-alb-sg"
      Tier = "edge"
    }
  )
}

resource "aws_security_group" "ec2" {
  name        = "${var.name}-ec2-sg"
  description = "Permite trafico de aplicacion unicamente desde el ALB"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = toset(var.ec2_ingress_ports)
    content {
      description     = "ALB hacia EC2 puerto ${ingress.value}"
      from_port       = ingress.value
      to_port         = ingress.value
      protocol        = "tcp"
      security_groups = [aws_security_group.alb.id]
    }
  }

  egress {
    description = "EC2 hacia Aurora"
    from_port   = var.aurora_port
    to_port     = var.aurora_port
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  dynamic "egress" {
    for_each = toset(var.external_database_egress_cidrs)
    content {
      description = "EC2 hacia bases de datos externas puerto ${var.aurora_port}"
      from_port   = var.aurora_port
      to_port     = var.aurora_port
      protocol    = "tcp"
      cidr_blocks = [egress.value]
    }
  }

  egress {
    description = "EC2 hacia Redis"
    from_port   = var.redis_port
    to_port     = var.redis_port
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "EC2 hacia servicios de gestion por HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-ec2-sg"
      Tier = "compute"
    }
  )
}

resource "aws_security_group" "aurora" {
  name        = "${var.name}-aurora-sg"
  description = "Permite acceso a Aurora solo desde EC2"
  vpc_id      = var.vpc_id
  egress      = []

  ingress {
    description     = "EC2 hacia Aurora"
    from_port       = var.aurora_port
    to_port         = var.aurora_port
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-aurora-sg"
      Tier = "data"
    }
  )
}

resource "aws_security_group" "redis" {
  name        = "${var.name}-redis-sg"
  description = "Permite acceso a Redis solo desde EC2"
  vpc_id      = var.vpc_id
  egress      = []

  ingress {
    description     = "EC2 hacia Redis"
    from_port       = var.redis_port
    to_port         = var.redis_port
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-redis-sg"
      Tier = "cache"
    }
  )
}
