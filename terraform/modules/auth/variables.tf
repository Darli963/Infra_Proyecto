variable "enabled" {
  description = "Activa los recursos del modulo auth."
  type        = bool
  default     = true
}

variable "name" {
  description = "Prefijo nominal para los recursos del modulo."
  type        = string
}

variable "project_name" {
  description = "Nombre del proyecto, usado para construir el domain prefix de Cognito."
  type        = string
}

variable "environment" {
  description = "Ambiente objetivo, usado para construir el domain prefix de Cognito."
  type        = string
}

variable "tags" {
  description = "Etiquetas adicionales para el modulo."
  type        = map(string)
  default     = {}
}

variable "cognito_domain_suffix" {
  description = "Sufijo opcional que se añade al domain prefix de Cognito para garantizar unicidad global (ej. account ID). Si es null se usa el patrón por defecto project_name-environment."
  type        = string
  default     = null
  nullable    = true
}
