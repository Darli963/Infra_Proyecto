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

variable "tags" {
  description = "Etiquetas adicionales para el modulo."
  type        = map(string)
  default     = {}
}

variable "enable_regional_waf" {
  description = "Crea un WebACL WAFv2 REGIONAL y lo asocia al stage del API Gateway."
  type        = bool
  default     = false
}

variable "api_gateway_id" {
  description = "ID del HTTP API Gateway al que se asociara el WAF regional."
  type        = string
  default     = null
  nullable    = true
}

variable "api_gateway_stage_name" {
  description = "Nombre del stage del HTTP API Gateway al que se asociara el WAF regional."
  type        = string
  default     = null
  nullable    = true
}
