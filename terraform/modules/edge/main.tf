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
      Module = "edge"
    },
    var.tags
  )
}

resource "aws_lb" "this" {
  count = var.enabled ? 1 : 0

  name               = substr("${var.name}-alb", 0, 32)
  internal           = var.internal
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.internal ? var.private_subnet_ids : var.public_subnet_ids

  enable_deletion_protection = var.enable_deletion_protection

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-alb"
      Tier = "edge"
    }
  )
}

resource "aws_lb_target_group" "this" {
  count = var.enabled ? 1 : 0

  name        = substr("${var.name}-tg", 0, 32)
  port        = var.target_port
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = var.vpc_id

  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = var.health_check_path
    matcher             = var.health_check_matcher
    protocol            = "HTTP"
    port                = "traffic-port"
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.healthy_threshold
    unhealthy_threshold = var.unhealthy_threshold
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-tg"
      Tier = "edge"
    }
  )
}

resource "aws_lb_listener" "http" {
  count = var.enabled ? 1 : 0

  load_balancer_arn = aws_lb.this[0].arn
  port              = var.listener_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this[0].arn
  }
}

resource "aws_lb_target_group_attachment" "test_instance" {
  count = var.enabled && var.attach_test_instance ? 1 : 0

  target_group_arn = aws_lb_target_group.this[0].arn
  target_id        = var.target_instance_id
  port             = var.target_port
}
