skip_aws_validation = true

aws_region     = "us-east-1"
project_name   = "infra-proyecto"
environment    = "dev"

# Networking
vpc_cidr              = "10.0.0.0/16"
availability_zones    = ["us-east-1a", "us-east-1b"]
public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs  = ["10.0.10.0/24", "10.0.11.0/24"]
map_public_ip_on_launch = true
single_nat_gateway    = true

# Security Groups
alb_ingress_cidrs  = ["0.0.0.0/0"]
alb_ingress_ports  = [80, 443]
ec2_ingress_ports  = [80]
aurora_port        = 3306
redis_port         = 6379

# Tags
common_tags = {
  Environment = "dev"
  ManagedBy   = "Terraform"
}
