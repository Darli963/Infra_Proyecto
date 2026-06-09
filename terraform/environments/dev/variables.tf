variable "aws_region" {
  description = "Región AWS donde se desplegará el ambiente dev."
  type        = string
}

variable "project_name" {
  description = "Nombre del proyecto usado como prefijo de recursos."
  type        = string
}

variable "environment" {
  description = "Nombre del ambiente."
  type        = string
  default     = "dev"
}

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
