skip_aws_validation = true

aws_region   = "us-east-1"
project_name = "infra-proyecto"
environment  = "prod"

# Networking
vpc_cidr                = "10.100.0.0/16"
availability_zones      = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs     = ["10.100.1.0/24", "10.100.2.0/24", "10.100.3.0/24"]
private_subnet_cidrs    = ["10.100.10.0/24", "10.100.11.0/24", "10.100.12.0/24"]
map_public_ip_on_launch = false
single_nat_gateway      = false

# Security Groups
alb_ingress_cidrs                      = ["0.0.0.0/0"]
alb_ingress_ports                      = [80, 443]
alb_ingress_use_cloudfront_prefix_list = false
ec2_ingress_ports                      = [80]
aurora_port                            = 3306
redis_port                             = 6379

# Storage
app_bucket_name           = "infra-proyecto-prod-storage-phase3-example"
bucket_versioning_enabled = true
bucket_force_destroy      = false

# Database
db_name                         = "appdb"
db_master_username              = "appadmin"
db_engine                       = "aurora-mysql"
db_instance_class               = "db.r6g.large"
db_instance_count               = 2
db_backup_retention_period      = 14
db_preferred_backup_window      = "03:00-04:00"
db_preferred_maintenance_window = "sun:04:00-sun:05:00"
db_skip_final_snapshot          = false
db_deletion_protection          = true
db_apply_immediately            = false
db_secret_name                  = "infra-proyecto/prod/aurora"

# Cache opcional
enable_redis             = false
redis_node_type          = "cache.t4g.small"
redis_engine_version     = "7.0"
redis_num_cache_clusters = 2
redis_secret_name        = "infra-proyecto/prod/redis"

# Perimetro publico
enable_perimeter                 = false
perimeter_origin_domain_name     = null
perimeter_origin_http_port       = 80
perimeter_origin_https_port      = 443
perimeter_origin_protocol_policy = "http-only"
perimeter_custom_domain_name     = null
perimeter_enable_acm_certificate = false
perimeter_manage_route53_records = false
perimeter_route53_zone_id        = null
perimeter_price_class            = "PriceClass_100"

# Observabilidad
observability_sns_email_endpoint    = null
observability_log_retention_in_days = 14
observability_ec2_cpu_threshold     = 80
observability_rds_cpu_threshold     = 80

# Tags
common_tags = {
  Environment = "prod"
  ManagedBy   = "Terraform"
}
