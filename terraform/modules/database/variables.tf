variable "name" {
  description = "Prefijo nominal para los recursos del modulo."
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs de subnets privadas para el DB subnet group."
  type        = list(string)
}

variable "aurora_security_group_id" {
  description = "Security Group existente de Aurora que solo acepta trafico desde EC2."
  type        = string
}

variable "database_name" {
  description = "Nombre inicial de la base de datos."
  type        = string
}

variable "master_username" {
  description = "Usuario administrador del cluster Aurora."
  type        = string
}

variable "port" {
  description = "Puerto del motor Aurora."
  type        = number
  default     = 3306
}

variable "engine" {
  description = "Motor de Aurora a desplegar."
  type        = string
  default     = "aurora-mysql"
}

variable "engine_version" {
  description = "Version del motor Aurora."
  type        = string
  default     = null
}

variable "instance_class" {
  description = "Clase de instancia usada por Aurora."
  type        = string
  default     = "db.t3.medium"
}

variable "instance_count" {
  description = "Cantidad de instancias del cluster Aurora."
  type        = number
  default     = 1
}

variable "backup_retention_period" {
  description = "Dias de retencion para los backups automáticos."
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Ventana de backup preferida."
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Ventana de mantenimiento preferida."
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "skip_final_snapshot" {
  description = "Evita el snapshot final al destruir el cluster."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Protege al cluster de borrados accidentales."
  type        = bool
  default     = true
}

variable "apply_immediately" {
  description = "Aplica cambios de forma inmediata."
  type        = bool
  default     = false
}

variable "storage_encrypted" {
  description = "Activa cifrado en almacenamiento."
  type        = bool
  default     = true
}

variable "secret_name" {
  description = "Nombre del secreto de Aurora en Secrets Manager."
  type        = string
}

variable "tags" {
  description = "Etiquetas para los recursos del modulo."
  type        = map(string)
  default     = {}
}
