variable "enabled" {
  description = "Activa los recursos del modulo api_gateway."
  type        = bool
  default     = true
}

variable "name" {
  description = "Prefijo nominal para los recursos del modulo."
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC donde se crea el Security Group del VPC Link."
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs de subnets privadas para el VPC Link."
  type        = list(string)
}

variable "alb_listener_arn" {
  description = "ARN del listener HTTP del ALB que actua como backend de la integracion."
  type        = string
  default     = null
  nullable    = true
}

variable "alb_security_group_id" {
  description = "ID del Security Group del ALB al que el VPC Link necesita acceso."
  type        = string
  default     = null
  nullable    = true
}

variable "enable_jwt_authorizer" {
  description = "Agrega un JWT authorizer usando Cognito al route $default."
  type        = bool
  default     = false
}

variable "cognito_user_pool_endpoint" {
  description = "Endpoint (issuer) del User Pool de Cognito para el JWT authorizer."
  type        = string
  default     = null
  nullable    = true
}

variable "cognito_user_pool_client_id" {
  description = "Client ID del User Pool de Cognito para el JWT authorizer."
  type        = string
  default     = null
  nullable    = true
}

variable "tags" {
  description = "Etiquetas adicionales para el modulo."
  type        = map(string)
  default     = {}
}
