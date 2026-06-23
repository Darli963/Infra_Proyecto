variable "enabled" {
  description = "Activa el despliegue opcional de Redis."
  type        = bool
  default     = false
}

variable "name" {
  description = "Prefijo nominal para los recursos del modulo."
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs de subnets privadas para Redis."
  type        = list(string)
}

variable "redis_security_group_id" {
  description = "Security Group existente de Redis que solo acepta trafico desde EC2."
  type        = string
}

variable "node_type" {
  description = "Tipo de nodo de Redis."
  type        = string
  default     = "cache.t4g.micro"
}

variable "port" {
  description = "Puerto de Redis."
  type        = number
  default     = 6379
}

variable "engine_version" {
  description = "Version del motor Redis."
  type        = string
  default     = "7.0"
}

variable "num_cache_clusters" {
  description = "Cantidad de nodos del replication group."
  type        = number
  default     = 1
}

variable "secret_name" {
  description = "Nombre del secreto de Redis en Secrets Manager."
  type        = string
  default     = null
}

variable "tags" {
  description = "Etiquetas para los recursos del modulo."
  type        = map(string)
  default     = {}
}
