variable "enabled" {
  description = "Habilita la capa de auditoria (CloudTrail + AWS Config)."
  type        = bool
  default     = true
}

variable "name" {
  description = "Prefijo nominal para los recursos del modulo."
  type        = string
}

variable "log_bucket_name" {
  description = "Nombre globalmente unico del bucket S3 para logs de auditoria."
  type        = string
}

variable "access_logs_target_bucket_name" {
  description = "Nombre del bucket S3 destino para server access logs del bucket de auditoria."
  type        = string
}

variable "cloudtrail_is_multi_region" {
  description = "Si CloudTrail debe capturar eventos en multiples regiones."
  type        = bool
  default     = true
}

variable "cloudtrail_enable_log_file_validation" {
  description = "Habilita validacion de integridad de logs en CloudTrail."
  type        = bool
  default     = true
}

variable "config_record_all_supported" {
  description = "AWS Config registra todos los tipos de recursos soportados."
  type        = bool
  default     = true
}

variable "config_include_global_resource_types" {
  description = "AWS Config incluye recursos globales (IAM, etc.)."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Etiquetas aplicadas a los recursos del modulo."
  type        = map(string)
  default     = {}
}
