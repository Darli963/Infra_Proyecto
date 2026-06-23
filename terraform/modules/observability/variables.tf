variable "name" {
  description = "Prefijo base usado para nombrar recursos de observabilidad."
  type        = string
}

variable "project_name" {
  description = "Nombre del proyecto usado en los log groups."
  type        = string
}

variable "environment" {
  description = "Nombre del ambiente objetivo."
  type        = string
}

variable "db_cluster_id" {
  description = "ID del cluster Aurora que sera monitoreado."
  type        = string
}

variable "instance_id" {
  description = "ID opcional de la instancia EC2 a monitorear."
  type        = string
  default     = null
  nullable    = true
}

variable "enable_ec2_alarms" {
  description = "Define si deben crearse alarmas asociadas a una instancia EC2."
  type        = bool
  default     = false
}

variable "sns_email_endpoint" {
  description = "Correo electronico que recibira las notificaciones SNS. Si es null no se crea la suscripcion."
  type        = string
  default     = null
  nullable    = true
}

variable "log_retention_in_days" {
  description = "Dias de retencion para los log groups administrados por Terraform."
  type        = number
  default     = 14
}

variable "ec2_cpu_threshold" {
  description = "Umbral de CPU para la alarma de la instancia EC2."
  type        = number
  default     = 80
}

variable "rds_cpu_threshold" {
  description = "Umbral de CPU para la alarma del cluster Aurora."
  type        = number
  default     = 80
}

variable "tags" {
  description = "Etiquetas comunes para los recursos del modulo."
  type        = map(string)
  default     = {}
}
