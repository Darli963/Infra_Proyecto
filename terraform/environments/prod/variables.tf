variable "aws_region" {
  description = "Region AWS donde se desplegara el ambiente prod."
  type        = string
}

variable "project_name" {
  description = "Nombre del proyecto usado como prefijo de recursos."
  type        = string
}

variable "environment" {
  description = "Nombre del ambiente."
  type        = string
  default     = "prod"
}

variable "vpc_id" {
  description = "ID de la VPC existente donde se integrara la fase de seguridad."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR de la VPC existente para limitar trafico interno."
  type        = string
}

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
