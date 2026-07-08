variable "enabled" {
  description = "Activa los recursos del perimetro publico."
  type        = bool
  default     = false
}

variable "name" {
  description = "Prefijo nominal para los recursos del modulo."
  type        = string
}

variable "origin_domain_name" {
  description = "Dominio DNS del origen que atendera CloudFront, por ejemplo un ALB."
  type        = string
  default     = null
  nullable    = true
}

variable "origin_http_port" {
  description = "Puerto HTTP del origen."
  type        = number
  default     = 80
}

variable "origin_https_port" {
  description = "Puerto HTTPS del origen."
  type        = number
  default     = 443
}

variable "origin_protocol_policy" {
  description = "Politica de protocolo usada por CloudFront hacia el origen."
  type        = string
  default     = "http-only"

  validation {
    condition     = contains(["http-only", "https-only", "match-viewer"], var.origin_protocol_policy)
    error_message = "origin_protocol_policy debe ser `http-only`, `https-only` o `match-viewer`."
  }
}

variable "custom_domain_name" {
  description = "Dominio personalizado opcional para publicar CloudFront."
  type        = string
  default     = null
  nullable    = true
}

variable "enable_acm_certificate" {
  description = "Solicita un certificado ACM en us-east-1 para el dominio personalizado."
  type        = bool
  default     = false
}

variable "manage_route53_records" {
  description = "Crea registros DNS y de validacion en Route 53 cuando exista una hosted zone."
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Hosted zone ID de Route 53 donde se publicara el dominio personalizado."
  type        = string
  default     = null
  nullable    = true
}

variable "price_class" {
  description = "Price class usada por la distribucion CloudFront."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.price_class)
    error_message = "price_class debe ser `PriceClass_100`, `PriceClass_200` o `PriceClass_All`."
  }
}

variable "enable_rate_limit" {
  description = "Activa una regla WAF de rate limiting basada en IP."
  type        = bool
  default     = false
}

variable "rate_limit_requests" {
  description = "Cantidad maxima de requests por IP antes de bloquear en WAF."
  type        = number
  default     = 2000

  validation {
    condition     = var.rate_limit_requests >= 100
    error_message = "rate_limit_requests debe ser mayor o igual a 100."
  }
}

variable "enable_sensitive_path_rate_limit" {
  description = "Activa un rate limit adicional sobre rutas sensibles del proyecto."
  type        = bool
  default     = false
}

variable "sensitive_path_rate_limit_requests" {
  description = "Cantidad maxima de requests por IP en rutas sensibles antes de bloquear en WAF."
  type        = number
  default     = 200

  validation {
    condition     = var.sensitive_path_rate_limit_requests >= 10
    error_message = "sensitive_path_rate_limit_requests debe ser mayor o igual a 10."
  }
}

variable "sensitive_path_patterns" {
  description = "Prefijos de URI sensibles a proteger con rate limit adicional."
  type        = list(string)
  default     = []
}

variable "geo_allowlist_enabled" {
  description = "Si es true, solo permite trafico desde los paises indicados en allowed_country_codes."
  type        = bool
  default     = false
}

variable "allowed_country_codes" {
  description = "Lista de codigos ISO 3166-1 alpha-2 permitidos por WAF."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Etiquetas adicionales para el modulo."
  type        = map(string)
  default     = {}
}

variable "api_gateway_domain_name" {
  description = "Hostname del API Gateway (sin protocolo) que se agregara como origin en CloudFront para /api/*."
  type        = string
  default     = null
  nullable    = true
}

variable "frontend_bucket_regional_domain_name" {
  description = "Dominio regional del bucket S3 que contiene el frontend."
  type        = string
  default     = null
  nullable    = true
}

variable "frontend_bucket_arn" {
  description = "ARN del bucket S3 que contiene el frontend."
  type        = string
  default     = null
  nullable    = true
}

variable "enable_frontend_origin" {
  description = "Activa el origen S3 para el frontend."
  type        = bool
  default     = false
}

variable "frontend_origin_path" {
  description = "Prefijo dentro del bucket S3 usado como origin del frontend."
  type        = string
  default     = "/frontend"
}
