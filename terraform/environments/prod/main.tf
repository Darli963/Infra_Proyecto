locals {
  default_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = var.project_name
  }
}

module "security_base" {
  source = "../../modules/security_base"

  name              = "${var.project_name}-${var.environment}"
  vpc_id            = var.vpc_id
  vpc_cidr          = var.vpc_cidr
  alb_ingress_cidrs = var.alb_ingress_cidrs
  alb_ingress_ports = var.alb_ingress_ports
  ec2_ingress_ports = var.ec2_ingress_ports
  aurora_port       = var.aurora_port
  redis_port        = var.redis_port
  tags              = local.default_tags
}
