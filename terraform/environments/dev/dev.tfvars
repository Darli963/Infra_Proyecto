skip_aws_validation = true

aws_region   = "us-east-1"
project_name = "infra-proyecto"
environment  = "dev"

# Networking
vpc_cidr                = "10.0.0.0/16"
availability_zones      = ["us-east-1a", "us-east-1b"]
public_subnet_cidrs     = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs    = ["10.0.10.0/24", "10.0.11.0/24"]
map_public_ip_on_launch = true
single_nat_gateway      = true

# Security Groups
alb_ingress_cidrs              = ["0.0.0.0/0"]
alb_ingress_ports              = [80, 443]
ec2_ingress_ports              = [80]
aurora_port                    = 5432
redis_port                     = 6379
external_database_egress_cidrs = ["0.0.0.0/0"]

# Storage
app_bucket_name           = "infra-proyecto-dev-storage-phase3-example"
bucket_versioning_enabled = true
bucket_force_destroy      = false

# Database
database_mode                      = "express"
external_aurora_cluster_identifier = "infra-proyecto-dev-aurora-express"
external_aurora_secret_name        = "infra-proyecto/dev/aurora"
db_name                            = "postgres"
db_master_username                 = "postgres"
db_engine                          = "aurora-postgresql"
db_instance_class                  = "db.t3.medium"
db_instance_count                  = 1
db_backup_retention_period         = 1
db_preferred_backup_window         = "03:00-04:00"
db_preferred_maintenance_window    = "sun:04:00-sun:05:00"
db_skip_final_snapshot             = true
db_deletion_protection             = false
db_apply_immediately               = true
db_secret_name                     = "infra-proyecto/dev/aurora"

# Cache opcional
enable_redis             = false
redis_node_type          = "cache.t4g.micro"
redis_engine_version     = "7.0"
redis_num_cache_clusters = 1
redis_secret_name        = "infra-proyecto/dev/redis"

# Compute / Phase 4
enable_test_instance                     = true
test_instance_type                       = "t3.micro"
test_instance_ami_id                     = null
test_instance_root_volume_size           = 16
test_instance_root_volume_type           = "gp3"
test_instance_enable_detailed_monitoring = false
test_instance_nodejs_major_version       = 20
test_instance_app_base_dir               = "/opt/phase4-app"
test_instance_app_port                   = 3000
db_connect_resource_arns                 = ["arn:aws:rds-db:us-east-1:784055307801:dbuser:*/*"]

# Tags
common_tags = {
  Environment = "dev"
  ManagedBy   = "Terraform"
}
