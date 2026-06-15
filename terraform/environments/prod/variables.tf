variable "project_name" {
  description = "Nombre base del proyecto."
  type        = string
}

variable "environment" {
  description = "Ambiente objetivo."
  type        = string
}

variable "aws_region" {
  description = "Region de AWS."
  type        = string
}

variable "common_tags" {
  description = "Etiquetas adicionales para el ambiente."
  type        = map(string)
  default     = {}
}
