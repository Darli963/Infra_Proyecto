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

  name                           = local.name_prefix
  vpc_id                         = module.networking.vpc_id
  vpc_cidr                       = var.vpc_cidr
  alb_ingress_cidrs              = var.alb_ingress_cidrs
  alb_ingress_ports              = var.alb_ingress_ports
  ec2_ingress_ports              = var.ec2_ingress_ports
  aurora_port                    = var.aurora_port
  external_database_egress_cidrs = var.external_database_egress_cidrs
  redis_port                     = var.redis_port
  tags                           = local.common_tags
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
  secret_arns                = concat([local.database_secret_arn], var.enable_redis ? [module.cache.secret_arn] : [])
  artifact_bucket_arn        = module.storage.bucket_arn
  db_connect_resource_arns   = var.db_connect_resource_arns
  tags                       = local.common_tags
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
