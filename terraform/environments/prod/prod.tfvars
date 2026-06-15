skip_aws_validation = true

aws_region     = "us-east-1"
project_name   = "infra-proyecto"
environment    = "prod"

# Networking
vpc_cidr              = "10.100.0.0/16"
availability_zones    = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs   = ["10.100.1.0/24", "10.100.2.0/24", "10.100.3.0/24"]
private_subnet_cidrs  = ["10.100.10.0/24", "10.100.11.0/24", "10.100.12.0/24"]
map_public_ip_on_launch = false
single_nat_gateway    = false

# Security Groups
alb_ingress_cidrs  = ["0.0.0.0/0"]
alb_ingress_ports  = [80, 443]
ec2_ingress_ports  = [80]
aurora_port        = 3306
redis_port         = 6379

# Tags
common_tags = {
  Environment = "prod"
  ManagedBy   = "Terraform"
}
