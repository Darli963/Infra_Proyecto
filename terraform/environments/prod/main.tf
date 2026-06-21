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

  name                                   = local.name_prefix
  vpc_id                                 = module.networking.vpc_id
  vpc_cidr                               = var.vpc_cidr
  alb_ingress_cidrs                      = var.alb_ingress_cidrs
  alb_ingress_ports                      = var.alb_ingress_ports
  alb_ingress_use_cloudfront_prefix_list = var.alb_ingress_use_cloudfront_prefix_list
  ec2_ingress_ports                      = var.ec2_ingress_ports
  aurora_port                            = var.aurora_port
  redis_port                             = var.redis_port
  tags                                   = local.common_tags
}

module "storage" {
  source = "../../modules/storage"

  bucket_name        = var.app_bucket_name
  force_destroy      = var.bucket_force_destroy
  versioning_enabled = var.bucket_versioning_enabled
  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-assets"
      Tier = "storage"
    }
  )
}

module "database" {
  source = "../../modules/database"

  name                         = local.name_prefix
  private_subnet_ids           = module.networking.private_subnet_ids
  aurora_security_group_id     = module.security_base.security_group_ids.aurora
  database_name                = var.db_name
  master_username              = var.db_master_username
  port                         = var.aurora_port
  engine                       = var.db_engine
  engine_version               = var.db_engine_version
  instance_class               = var.db_instance_class
  instance_count               = var.db_instance_count
  backup_retention_period      = var.db_backup_retention_period
  preferred_backup_window      = var.db_preferred_backup_window
  preferred_maintenance_window = var.db_preferred_maintenance_window
  skip_final_snapshot          = var.db_skip_final_snapshot
  deletion_protection          = var.db_deletion_protection
  apply_immediately            = var.db_apply_immediately
  secret_name                  = var.db_secret_name
  tags                         = local.common_tags
}

module "cache" {
  source = "../../modules/cache"

  enabled                 = var.enable_redis
  name                    = local.name_prefix
  private_subnet_ids      = module.networking.private_subnet_ids
  redis_security_group_id = module.security_base.security_group_ids.redis
  node_type               = var.redis_node_type
  port                    = var.redis_port
  engine_version          = var.redis_engine_version
  num_cache_clusters      = var.redis_num_cache_clusters
  secret_name             = var.redis_secret_name
  tags                    = local.common_tags
}

module "perimeter" {
  source = "../../modules/perimeter"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  enabled                = var.enable_perimeter && var.perimeter_origin_domain_name != null
  name                   = "${local.name_prefix}-public"
  origin_domain_name     = var.perimeter_origin_domain_name
  origin_http_port       = var.perimeter_origin_http_port
  origin_https_port      = var.perimeter_origin_https_port
  origin_protocol_policy = var.perimeter_origin_protocol_policy
  custom_domain_name     = var.perimeter_custom_domain_name
  enable_acm_certificate = var.perimeter_enable_acm_certificate
  manage_route53_records = var.perimeter_manage_route53_records
  route53_zone_id        = var.perimeter_route53_zone_id
  price_class            = var.perimeter_price_class
  tags                   = local.common_tags
}

module "observability" {
  source = "../../modules/observability"

  name                  = local.name_prefix
  project_name          = var.project_name
  environment           = var.environment
  db_cluster_id         = module.database.cluster_id
  enable_ec2_alarms     = false
  sns_email_endpoint    = var.observability_sns_email_endpoint
  log_retention_in_days = var.observability_log_retention_in_days
  ec2_cpu_threshold     = var.observability_ec2_cpu_threshold
  rds_cpu_threshold     = var.observability_rds_cpu_threshold
  tags                  = local.common_tags
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
