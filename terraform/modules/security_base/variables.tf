variable "name" {
  description = "Prefijo comun para nombrar los recursos de seguridad."
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC donde se crean los Security Groups."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR de la VPC usado para limitar el trafico interno entre capas."
  type        = string
}

variable "alb_ingress_cidrs" {
  description = "CIDRs externos autorizados a entrar al ALB."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "alb_ingress_ports" {
  description = "Puertos publicados por el ALB hacia el exterior."
  type        = list(number)
  default     = [80, 443]

  validation {
    condition     = length(var.alb_ingress_ports) > 0 && alltrue([for port in var.alb_ingress_ports : port >= 1 && port <= 65535])
    error_message = "Debes definir al menos un puerto valido para el ALB."
  }
}

variable "ec2_ingress_ports" {
  description = "Puertos de aplicacion que EC2 recibe unicamente desde el ALB."
  type        = list(number)
  default     = [80]

  validation {
    condition     = length(var.ec2_ingress_ports) > 0 && alltrue([for port in var.ec2_ingress_ports : port >= 1 && port <= 65535])
    error_message = "Debes definir al menos un puerto valido para EC2."
  }
}

variable "aurora_port" {
  description = "Puerto de Aurora permitido solo desde EC2."
  type        = number
  default     = 3306

  validation {
    condition     = var.aurora_port >= 1 && var.aurora_port <= 65535
    error_message = "El puerto de Aurora debe estar entre 1 y 65535."
  }
}

variable "redis_port" {
  description = "Puerto de Redis permitido solo desde EC2."
  type        = number
  default     = 6379

  validation {
    condition     = var.redis_port >= 1 && var.redis_port <= 65535
    error_message = "El puerto de Redis debe estar entre 1 y 65535."
  }
}

variable "tags" {
  description = "Tags adicionales para todos los recursos de seguridad."
  type        = map(string)
  default     = {}
}
