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
  database_cluster_id           = var.database_mode == "express" ? data.aws_rds_cluster.express[0].id : module.database[0].cluster_id
  database_endpoint             = var.database_mode == "express" ? data.aws_rds_cluster.express[0].endpoint : module.database[0].cluster_endpoint
  database_reader_endpoint      = var.database_mode == "express" ? data.aws_rds_cluster.express[0].reader_endpoint : module.database[0].reader_endpoint
  database_secret_name          = var.database_mode == "express" ? data.aws_secretsmanager_secret.express[0].name : module.database[0].secret_name
  database_secret_arn           = var.database_mode == "express" ? data.aws_secretsmanager_secret.express[0].arn : module.database[0].secret_arn
  database_db_subnet_group_name = var.database_mode == "express" ? null : module.database[0].db_subnet_group_name
  smoke_app_source_dir          = "${path.root}/../../../ansible/files/phase4-smoke-app"
}

data "aws_rds_cluster" "express" {
  count = var.database_mode == "express" ? 1 : 0

  cluster_identifier = var.external_aurora_cluster_identifier
}

data "aws_secretsmanager_secret" "express" {
  count = var.database_mode == "express" ? 1 : 0

  name = var.external_aurora_secret_name
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
  external_database_egress_cidrs         = var.external_database_egress_cidrs
  redis_port                             = var.redis_port
  tags                                   = local.common_tags
}

module "storage" {
  source = "../../modules/storage"

  bucket_name            = var.app_bucket_name
  force_destroy          = var.bucket_force_destroy
  versioning_enabled     = var.bucket_versioning_enabled
  app_config_secret_name = var.app_config_secret_name
  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-assets"
      Tier = "storage"
    }
  )
}

resource "aws_s3_object" "smoke_app_package" {
  bucket       = module.storage.bucket_id
  key          = "phase4-smoke-app/package.json"
  source       = "${local.smoke_app_source_dir}/package.json"
  etag         = filemd5("${local.smoke_app_source_dir}/package.json")
  content_type = "application/json"
}

resource "aws_s3_object" "smoke_app_server" {
  bucket       = module.storage.bucket_id
  key          = "phase4-smoke-app/server.js"
  source       = "${local.smoke_app_source_dir}/server.js"
  etag         = filemd5("${local.smoke_app_source_dir}/server.js")
  content_type = "application/javascript"
}

module "database" {
  count  = var.database_mode == "standard" ? 1 : 0
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

module "compute" {
  source = "../../modules/compute"

  enabled                    = var.enable_test_instance
  name                       = "${local.name_prefix}-test-ec2"
  subnet_id                  = module.networking.private_subnet_ids[0]
  security_group_ids         = [module.security_base.security_group_ids.ec2]
  instance_profile_name      = module.security_base.ec2_instance_profile_name
  instance_role_name         = module.security_base.ec2_iam_role_name
  instance_type              = var.test_instance_type
  ami_id                     = var.test_instance_ami_id
  root_volume_size           = var.test_instance_root_volume_size
  root_volume_type           = var.test_instance_root_volume_type
  enable_detailed_monitoring = var.test_instance_enable_detailed_monitoring
  nodejs_major_version       = var.test_instance_nodejs_major_version
  app_base_dir               = var.test_instance_app_base_dir
  app_port                   = var.test_instance_app_port
  aws_region                 = var.aws_region
  secret_arns                = compact(concat([local.database_secret_arn], var.enable_redis ? [module.cache.secret_arn] : [], [module.storage.app_config_secret_arn]))
  artifact_bucket_arn        = module.storage.bucket_arn
  db_connect_resource_arns   = var.db_connect_resource_arns
  tags                       = local.common_tags
}

module "edge" {
  source = "../../modules/edge"

  enabled                    = var.enable_load_balancer
  name                       = "${local.name_prefix}-app"
  vpc_id                     = module.networking.vpc_id
  public_subnet_ids          = module.networking.public_subnet_ids
  security_group_id          = module.security_base.security_group_ids.alb
  listener_port              = var.load_balancer_listener_port
  target_port                = var.load_balancer_target_port
  health_check_path          = var.load_balancer_health_check_path
  health_check_matcher       = var.load_balancer_health_check_matcher
  attach_test_instance       = var.enable_test_instance
  target_instance_id         = module.compute.instance_id
  enable_deletion_protection = false
  tags                       = local.common_tags
}

module "auth" {
  count  = var.enable_auth ? 1 : 0
  source = "../../modules/auth"

  enabled      = var.enable_auth
  name         = local.name_prefix
  project_name = var.project_name
  environment  = var.environment
  tags         = local.common_tags
}

module "api_gateway" {
  source = "../../modules/api_gateway"

  enabled               = var.enable_api_gateway && var.enable_load_balancer
  name                  = "${local.name_prefix}-api"
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_listener_arn      = module.edge.listener_arn
  alb_security_group_id = module.security_base.security_group_ids.alb
  enable_jwt_authorizer = var.enable_jwt_authorizer

  cognito_user_pool_endpoint  = var.enable_auth && var.enable_jwt_authorizer ? module.auth[0].user_pool_endpoint : null
  cognito_user_pool_client_id = var.enable_auth && var.enable_jwt_authorizer ? module.auth[0].user_pool_client_id : null

  tags = local.common_tags
}

module "compute_group" {
  source = "../../modules/compute_group"

  enabled                    = var.enable_compute_group
  name                       = "${local.name_prefix}-app"
  private_subnet_ids         = module.networking.private_subnet_ids
  security_group_ids         = [module.security_base.security_group_ids.ec2]
  instance_profile_name      = module.security_base.ec2_instance_profile_name
  instance_role_name         = module.security_base.ec2_iam_role_name
  instance_type              = var.autoscaling_instance_type
  ami_id                     = var.autoscaling_ami_id
  root_volume_size           = var.autoscaling_root_volume_size
  root_volume_type           = var.autoscaling_root_volume_type
  enable_detailed_monitoring = var.autoscaling_enable_detailed_monitoring
  nodejs_major_version       = var.autoscaling_nodejs_major_version
  app_base_dir               = var.autoscaling_app_base_dir
  app_port                   = var.autoscaling_app_port
  app_service_name           = var.autoscaling_service_name
  app_artifact_prefix        = var.autoscaling_artifact_prefix
  artifact_bucket_name       = module.storage.bucket_id
  artifact_bucket_arn        = module.storage.bucket_arn
  database_secret_name       = local.database_secret_name
  aws_region                 = var.aws_region
  secret_arns                = compact(concat([local.database_secret_arn], var.enable_redis ? [module.cache.secret_arn] : [], [module.storage.app_config_secret_arn]))
  db_connect_resource_arns   = var.db_connect_resource_arns
  desired_capacity           = var.autoscaling_desired_capacity
  min_size                   = var.autoscaling_min_size
  max_size                   = var.autoscaling_max_size
  health_check_grace_period  = var.autoscaling_health_check_grace_period
  target_group_arns          = var.enable_load_balancer ? [module.edge.target_group_arn] : []
  tags                       = local.common_tags

  depends_on = [
    aws_s3_object.smoke_app_package,
    aws_s3_object.smoke_app_server
  ]
}

module "perimeter" {
  source = "../../modules/perimeter"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  enabled                = var.enable_perimeter && var.enable_load_balancer
  name                   = "${local.name_prefix}-public"
  origin_domain_name     = module.edge.alb_dns_name
  origin_http_port       = var.load_balancer_listener_port
  origin_protocol_policy = var.perimeter_origin_protocol_policy
  custom_domain_name     = var.perimeter_custom_domain_name
  enable_acm_certificate = var.perimeter_enable_acm_certificate
  manage_route53_records = var.perimeter_manage_route53_records
  route53_zone_id        = var.perimeter_route53_zone_id
  price_class            = var.perimeter_price_class
  enable_regional_waf    = var.enable_regional_waf
  api_gateway_stage_arn  = var.enable_regional_waf ? module.api_gateway.stage_arn : null
  tags                   = local.common_tags
}

module "observability" {
  source = "../../modules/observability"

  name                  = local.name_prefix
  project_name          = var.project_name
  environment           = var.environment
  db_cluster_id         = local.database_cluster_id
  instance_id           = module.compute.instance_id
  enable_ec2_alarms     = var.enable_test_instance
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
