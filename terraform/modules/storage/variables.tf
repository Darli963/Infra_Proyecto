variable "bucket_name" {
  description = "Nombre globalmente unico del bucket S3."
  type        = string
}

variable "force_destroy" {
  description = "Permite destruir el bucket aunque tenga objetos."
  type        = bool
  default     = false
}

variable "versioning_enabled" {
  description = "Activa el versionado del bucket."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Etiquetas aplicadas al bucket."
  type        = map(string)
  default     = {}
}

variable "lifecycle_enabled" {
  description = "Activa la regla de lifecycle S3 con transiciones a IA y Glacier."
  type        = bool
  default     = true
}

variable "lifecycle_transition_standard_ia_days" {
  description = "Dias para transicionar objetos a STANDARD_IA."
  type        = number
  default     = 30
}

variable "lifecycle_transition_glacier_days" {
  description = "Dias para transicionar objetos a GLACIER."
  type        = number
  default     = 90
}

variable "app_config_secret_name" {
  description = "Nombre del secreto de configuracion de la app en Secrets Manager. Si es null no se crea."
  type        = string
  default     = null
  nullable    = true
}
