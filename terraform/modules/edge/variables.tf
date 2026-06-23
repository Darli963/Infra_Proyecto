variable "enabled" {
  description = "Activa los recursos de balanceo de carga."
  type        = bool
  default     = false
}

variable "name" {
  description = "Prefijo nominal para los recursos del modulo."
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC donde se crea el target group."
  type        = string
}

variable "public_subnet_ids" {
  description = "Subnets publicas donde se desplegara el ALB."
  type        = list(string)
}

variable "security_group_id" {
  description = "Security Group del ALB."
  type        = string
}

variable "listener_port" {
  description = "Puerto publicado por el listener HTTP."
  type        = number
  default     = 80
}

variable "target_port" {
  description = "Puerto de la aplicacion hacia donde enruta el target group."
  type        = number
}

variable "health_check_path" {
  description = "Ruta HTTP usada por el health check."
  type        = string
  default     = "/healthz"
}

variable "health_check_matcher" {
  description = "Codigos HTTP exitosos esperados por el health check."
  type        = string
  default     = "200"
}

variable "health_check_interval" {
  description = "Intervalo del health check en segundos."
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Timeout del health check en segundos."
  type        = number
  default     = 5
}

variable "healthy_threshold" {
  description = "Cantidad de checks exitosos para marcar un target como sano."
  type        = number
  default     = 2
}

variable "unhealthy_threshold" {
  description = "Cantidad de checks fallidos para marcar un target como no sano."
  type        = number
  default     = 2
}

variable "target_instance_id" {
  description = "Instancia existente a adjuntar inicialmente al target group."
  type        = string
  default     = null
  nullable    = true
}

variable "attach_test_instance" {
  description = "Adjunta o no la EC2 de prueba ya existente al target group."
  type        = bool
  default     = false
}

variable "enable_deletion_protection" {
  description = "Activa proteccion contra borrado en el ALB."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Etiquetas adicionales para el modulo."
  type        = map(string)
  default     = {}
}
