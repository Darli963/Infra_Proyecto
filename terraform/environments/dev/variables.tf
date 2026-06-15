variable "aws_region" {
  description = "Region AWS donde se desplegara el ambiente dev."
  type        = string
}

variable "skip_aws_validation" {
  description = "Omite validaciones AWS del provider para CI con credenciales dummy."
  type        = bool
  default     = false
}

variable "project_name" {
  description = "Nombre base del proyecto."
  type        = string
}

variable "environment" {
  description = "Ambiente objetivo."
  type        = string
  default     = "dev"
}

variable "common_tags" {
  description = "Etiquetas adicionales para el ambiente."
  type        = map(string)
  default     = {}
}

# --- Networking ---

variable "vpc_cidr" {
  description = "CIDR principal de la VPC."
  type        = string
}

variable "availability_zones" {
  description = "Availability Zones usadas por el ambiente dev."
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDRs de las subnets públicas."
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDRs de las subnets privadas."
  type        = list(string)
}

variable "map_public_ip_on_launch" {
  description = "Si las subnets públicas deben asignar IP pública automáticamente."
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Usa un solo NAT Gateway para el ambiente dev."
  type        = bool
  default     = true
}

# --- Security Groups ---

variable "alb_ingress_cidrs" {
  description = "CIDRs externos autorizados hacia el ALB."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "alb_ingress_ports" {
  description = "Puertos externos publicados por el ALB."
  type        = list(number)
  default     = [80, 443]
}

variable "ec2_ingress_ports" {
  description = "Puertos de aplicacion expuestos por EC2 solo al ALB."
  type        = list(number)
  default     = [80]
}

variable "aurora_port" {
  description = "Puerto de Aurora habilitado desde EC2."
  type        = number
  default     = 3306
}

variable "redis_port" {
  description = "Puerto de Redis habilitado desde EC2."
  type        = number
  default     = 6379
}
