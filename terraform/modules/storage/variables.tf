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
