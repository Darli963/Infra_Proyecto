aws_region   = "us-east-1"
project_name = "infra-proyecto"
environment  = "dev"

# Auditoria / Compliance
enable_audit = true

# Networking
vpc_cidr                = "10.0.0.0/16"
availability_zones      = ["us-east-1a", "us-east-1b"]
public_subnet_cidrs     = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs    = ["10.0.10.0/24", "10.0.11.0/24"]
map_public_ip_on_launch = true
single_nat_gateway      = true

# Security Groups
# NOTA: alb_ingress_cidrs NO se aplica cuando alb_ingress_use_cloudfront_prefix_list = true.
# security_base ignora estos CIDRs y usa el managed prefix list de CloudFront origin-facing.
# El valor se mantiene para no romper entornos donde alb_ingress_use_cloudfront_prefix_list = false.
alb_ingress_cidrs                      = ["0.0.0.0/0"]
alb_ingress_ports                      = [80]
alb_ingress_use_cloudfront_prefix_list = true
ec2_ingress_ports                      = [3000]
aurora_port                            = 5432
redis_port                             = 6379
external_database_egress_cidrs         = ["0.0.0.0/0"]

# Storage
app_bucket_name           = "infra-proyecto-dev-storage-phase3-example"
bucket_versioning_enabled = true
bucket_force_destroy      = false

# Database
database_mode                      = "express"
external_aurora_cluster_identifier = "database-1"
external_aurora_secret_name        = "infra-proyecto/dev/aurora-new"
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
enable_redis             = true
redis_node_type          = "cache.t4g.micro"
redis_engine_version     = "7.0"
redis_num_cache_clusters = 2
redis_secret_name        = "infra-proyecto/dev/redis"

# Compute / Phase 4
enable_test_instance                     = true
test_instance_type                       = "t3.micro"
test_instance_ami_id                     = null
test_instance_root_volume_size           = 16
test_instance_root_volume_type           = "gp3"
test_instance_enable_detailed_monitoring = true
test_instance_nodejs_major_version       = 20
test_instance_app_base_dir               = "/opt/phase4-app"
test_instance_app_port                   = 3000
db_connect_resource_arns                 = []

# Balanceo y escalado
enable_load_balancer                   = true
load_balancer_listener_port            = 80
load_balancer_target_port              = 3000
load_balancer_health_check_path        = "/healthz"
load_balancer_health_check_matcher     = "200"
enable_compute_group                   = true
autoscaling_instance_type              = "t3.micro"
autoscaling_ami_id                     = null
autoscaling_root_volume_size           = 16
autoscaling_root_volume_type           = "gp3"
autoscaling_enable_detailed_monitoring = false
autoscaling_nodejs_major_version       = 20
autoscaling_app_base_dir               = "/opt/phase4-app"
autoscaling_app_port                   = 3000
autoscaling_service_name               = "phase4-smoke-app"
autoscaling_artifact_prefix            = "phase4-smoke-app"
autoscaling_desired_capacity           = 1
autoscaling_min_size                   = 1
autoscaling_max_size                   = 2
autoscaling_health_check_grace_period  = 180

# API Gateway
enable_api_gateway    = true
enable_jwt_authorizer = false

# Auth (Cognito)
enable_auth = true

# Secrets Manager
app_config_secret_name = "infra-proyecto/dev/app-config"

# Perimetro publico
enable_perimeter                 = true
perimeter_origin_protocol_policy = "http-only"
perimeter_custom_domain_name     = null
perimeter_enable_acm_certificate = false
perimeter_manage_route53_records = false
perimeter_route53_zone_id        = null
perimeter_price_class            = "PriceClass_100"
# Observabilidad
observability_sns_email_endpoint    = "dali0987654321@gmail.com"
observability_log_retention_in_days = 14
observability_ec2_cpu_threshold     = 80
observability_rds_cpu_threshold     = 80

# Tags
common_tags = {
  Environment = "dev"
  ManagedBy   = "Terraform"
}
