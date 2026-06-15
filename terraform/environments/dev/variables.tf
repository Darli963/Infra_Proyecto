variable "project_name" {
  description = "Nombre base del proyecto."
  type        = string
}

variable "environment" {
  description = "Ambiente objetivo."
  type        = string
}

variable "aws_region" {
  description = "Region de AWS."
  type        = string
}

variable "common_tags" {
  description = "Etiquetas adicionales para el ambiente."
  type        = map(string)
  default     = {}
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
