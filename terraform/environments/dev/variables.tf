variable "aws_region" {
  description = "Region AWS donde se desplegara el ambiente dev."
  type        = string
}

variable "skip_aws_validation" {
  description = "Omite validaciones AWS del provider para CI con credenciales dummy."
  type        = bool
  default     = false
}

variable "project_name" {
  description = "Nombre base del proyecto."
  type        = string
}

variable "environment" {
  description = "Ambiente objetivo."
  type        = string
  default     = "dev"
}

variable "common_tags" {
  description = "Etiquetas adicionales para el ambiente."
  type        = map(string)
  default     = {}
}

# --- Networking ---

variable "vpc_cidr" {
  description = "CIDR principal de la VPC."
  type        = string
}

variable "availability_zones" {
  description = "Availability Zones usadas por el ambiente dev."
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDRs de las subnets públicas."
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDRs de las subnets privadas."
  type        = list(string)
}

variable "map_public_ip_on_launch" {
  description = "Si las subnets públicas deben asignar IP pública automáticamente."
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Usa un solo NAT Gateway para el ambiente dev."
  type        = bool
  default     = true
}

# --- Security Groups ---

variable "alb_ingress_cidrs" {
  description = "CIDRs externos autorizados hacia el ALB."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "alb_ingress_ports" {
  description = "Puertos externos publicados por el ALB."
  type        = list(number)
  default     = [80, 443]
}

variable "ec2_ingress_ports" {
  description = "Puertos de aplicacion expuestos por EC2 solo al ALB."
  type        = list(number)
  default     = [80]
}

variable "aurora_port" {
  description = "Puerto de Aurora habilitado desde EC2."
  type        = number
  default     = 3306
}

variable "redis_port" {
  description = "Puerto de Redis habilitado desde EC2."
  type        = number
  default     = 6379
}

# --- Storage ---

variable "app_bucket_name" {
  description = "Nombre globalmente unico del bucket S3 de la aplicacion."
  type        = string
}

variable "bucket_versioning_enabled" {
  description = "Activa versionado en el bucket S3."
  type        = bool
  default     = true
}

variable "bucket_force_destroy" {
  description = "Permite destruir el bucket aunque contenga objetos."
  type        = bool
  default     = false
}

# --- Database ---

variable "db_name" {
  description = "Nombre inicial de la base de datos Aurora."
  type        = string
  default     = "appdb"
}

variable "db_master_username" {
  description = "Usuario administrador del cluster Aurora."
  type        = string
  default     = "appadmin"
}

variable "db_engine" {
  description = "Motor Aurora a desplegar."
  type        = string
  default     = "aurora-mysql"
}

variable "db_engine_version" {
  description = "Version del motor Aurora."
  type        = string
  default     = null
}

variable "db_instance_class" {
  description = "Clase de instancia para Aurora."
  type        = string
  default     = "db.t3.medium"
}

variable "db_instance_count" {
  description = "Cantidad de instancias del cluster Aurora."
  type        = number
  default     = 1
}

variable "db_backup_retention_period" {
  description = "Dias de retencion de backups automatizados."
  type        = number
  default     = 7
}

variable "db_preferred_backup_window" {
  description = "Ventana horaria de backups."
  type        = string
  default     = "03:00-04:00"
}

variable "db_preferred_maintenance_window" {
  description = "Ventana horaria de mantenimiento."
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "db_skip_final_snapshot" {
  description = "Evita el snapshot final al destruir en dev."
  type        = bool
  default     = true
}

variable "db_deletion_protection" {
  description = "Activa proteccion contra borrado en Aurora."
  type        = bool
  default     = false
}

variable "db_apply_immediately" {
  description = "Aplica cambios de Aurora inmediatamente."
  type        = bool
  default     = true
}

variable "db_secret_name" {
  description = "Nombre del secreto de Aurora en Secrets Manager."
  type        = string
}

# --- Cache ---

variable "enable_redis" {
  description = "Activa Redis opcional para la aplicacion."
  type        = bool
  default     = false
}

variable "redis_node_type" {
  description = "Tipo de nodo para Redis."
  type        = string
  default     = "cache.t4g.micro"
}

variable "redis_engine_version" {
  description = "Version del motor Redis."
  type        = string
  default     = "7.0"
}

variable "redis_num_cache_clusters" {
  description = "Cantidad de nodos del replication group Redis."
  type        = number
  default     = 1
}

variable "redis_secret_name" {
  description = "Nombre del secreto opcional de Redis en Secrets Manager."
  type        = string
  default     = null
}
