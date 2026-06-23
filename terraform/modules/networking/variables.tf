variable "name" {
  description = "Prefijo de nombres para los recursos de networking."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR principal de la VPC."
  type        = string
}

variable "availability_zones" {
  description = "Lista de Availability Zones donde se crearán las subnets."
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDRs para las subnets públicas."
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDRs para las subnets privadas."
  type        = list(string)
}

variable "map_public_ip_on_launch" {
  description = "Asigna IP pública automáticamente a instancias lanzadas en subnets públicas."
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Mantiene un solo NAT Gateway para dev y reducir costo."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags adicionales para todos los recursos."
  type        = map(string)
  default     = {}
}
