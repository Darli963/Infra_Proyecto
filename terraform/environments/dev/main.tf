locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = merge(
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = var.project_name
    },
    var.common_tags
  )
}

module "security_base" {
  source = "../../modules/security_base"

  name              = local.name_prefix
  vpc_id            = module.networking.vpc_id
  vpc_cidr          = var.vpc_cidr
  alb_ingress_cidrs = var.alb_ingress_cidrs
  alb_ingress_ports = var.alb_ingress_ports
  ec2_ingress_ports = var.ec2_ingress_ports
  aurora_port       = var.aurora_port
  redis_port        = var.redis_port
  tags              = local.common_tags
}

module "networking" {
  source = "../../modules/networking"

  name                    = local.name_prefix
  vpc_cidr                = var.vpc_cidr
  availability_zones      = var.availability_zones
  public_subnet_cidrs     = var.public_subnet_cidrs
  private_subnet_cidrs    = var.private_subnet_cidrs
  map_public_ip_on_launch = var.map_public_ip_on_launch
  single_nat_gateway      = var.single_nat_gateway
  tags                    = local.common_tags
}
