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
