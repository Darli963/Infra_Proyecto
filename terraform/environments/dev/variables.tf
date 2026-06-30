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

# --- Auditoria / Compliance ---

variable "enable_audit" {
  description = "Habilita CloudTrail y AWS Config para auditoria/compliance."
  type        = bool
  default     = true
}

variable "audit_log_bucket_name" {
  description = "Nombre globalmente unico del bucket S3 donde se almacenan los logs de auditoria."
  type        = string
  default     = null
  nullable    = true
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

variable "alb_ingress_use_cloudfront_prefix_list" {
  description = "Restringe el ALB para aceptar trafico solo desde CloudFront."
  type        = bool
  default     = false
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

variable "external_database_egress_cidrs" {
  description = "CIDRs externos permitidos para conexiones de base de datos desde EC2."
  type        = list(string)
  default     = []
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

variable "database_mode" {
  description = "Modo de base de datos: `standard` para Aurora en VPC o `express` para Aurora Express administrada externamente."
  type        = string
  default     = "standard"

  validation {
    condition     = contains(["standard", "express"], var.database_mode)
    error_message = "database_mode debe ser `standard` o `express`."
  }
}

variable "external_aurora_cluster_identifier" {
  description = "Identificador de un cluster Aurora Express existente cuando database_mode = `express`."
  type        = string
  default     = null
  nullable    = true
}

variable "external_aurora_secret_name" {
  description = "Nombre de un secreto existente de Aurora cuando database_mode = `express`."
  type        = string
  default     = null
  nullable    = true
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

# --- Compute / Phase 4 ---

variable "enable_test_instance" {
  description = "Activa una sola EC2 privada de prueba para la Fase 4."
  type        = bool
  default     = false
}

variable "test_instance_type" {
  description = "Tipo de instancia para la EC2 privada de prueba."
  type        = string
  default     = "t3.micro"
}

variable "test_instance_ami_id" {
  description = "AMI opcional para la EC2 de prueba. Si es null se resuelve desde SSM."
  type        = string
  default     = null
  nullable    = true
}

variable "test_instance_root_volume_size" {
  description = "Tamano del volumen raiz de la EC2 de prueba."
  type        = number
  default     = 16
}

variable "test_instance_root_volume_type" {
  description = "Tipo de volumen raiz de la EC2 de prueba."
  type        = string
  default     = "gp3"
}

variable "test_instance_enable_detailed_monitoring" {
  description = "Activa detailed monitoring en la EC2 de prueba."
  type        = bool
  default     = false
}

variable "test_instance_nodejs_major_version" {
  description = "Version mayor de Node.js que se instala en el bootstrap inicial."
  type        = number
  default     = 20
}

variable "test_instance_app_base_dir" {
  description = "Directorio base preparado para el despliegue manual inicial."
  type        = string
  default     = "/opt/phase4-app"
}

variable "test_instance_app_port" {
  description = "Puerto local esperado para la app en la EC2 de prueba."
  type        = number
  default     = 3000
}

variable "db_connect_resource_arns" {
  description = "ARNs permitidos para autenticacion IAM hacia RDS desde la EC2 de prueba."
  type        = list(string)
  default     = []
}

# --- Balanceo y escalado ---

variable "enable_load_balancer" {
  description = "Activa el Application Load Balancer y su target group."
  type        = bool
  default     = false
}

variable "load_balancer_listener_port" {
  description = "Puerto HTTP publicado por el ALB."
  type        = number
  default     = 80
}

variable "load_balancer_target_port" {
  description = "Puerto de la aplicacion usado por el target group."
  type        = number
  default     = 3000
}

variable "load_balancer_health_check_path" {
  description = "Ruta HTTP usada por el health check del target group."
  type        = string
  default     = "/healthz"
}

variable "load_balancer_health_check_matcher" {
  description = "Codigos HTTP considerados exitosos por el target group."
  type        = string
  default     = "200"
}

variable "enable_compute_group" {
  description = "Activa el Launch Template y el Auto Scaling Group."
  type        = bool
  default     = false
}

variable "autoscaling_instance_type" {
  description = "Tipo de instancia para el Launch Template del ASG."
  type        = string
  default     = "t3.micro"
}

variable "autoscaling_ami_id" {
  description = "AMI opcional para el ASG. Si es null se resuelve desde SSM."
  type        = string
  default     = null
  nullable    = true
}

variable "autoscaling_root_volume_size" {
  description = "Tamano del volumen raiz para las instancias del ASG."
  type        = number
  default     = 16
}

variable "autoscaling_root_volume_type" {
  description = "Tipo de volumen raiz para las instancias del ASG."
  type        = string
  default     = "gp3"
}

variable "autoscaling_enable_detailed_monitoring" {
  description = "Activa detailed monitoring para las instancias del ASG."
  type        = bool
  default     = false
}

variable "autoscaling_nodejs_major_version" {
  description = "Version mayor de Node.js que se instala en las instancias del ASG."
  type        = number
  default     = 20
}

variable "autoscaling_app_base_dir" {
  description = "Directorio base donde se despliega la app en las instancias del ASG."
  type        = string
  default     = "/opt/phase4-app"
}

variable "autoscaling_app_port" {
  description = "Puerto local donde escuchara la app en las instancias del ASG."
  type        = number
  default     = 3000
}

variable "autoscaling_service_name" {
  description = "Nombre del servicio systemd usado por la app en las instancias del ASG."
  type        = string
  default     = "phase4-smoke-app"
}

variable "autoscaling_artifact_prefix" {
  description = "Prefijo S3 donde se publican los artefactos que consumira el ASG."
  type        = string
  default     = "phase4-smoke-app"
}

variable "autoscaling_desired_capacity" {
  description = "Cantidad deseada de instancias en el ASG."
  type        = number
  default     = 1
}

variable "autoscaling_min_size" {
  description = "Cantidad minima de instancias en el ASG."
  type        = number
  default     = 1
}

variable "autoscaling_max_size" {
  description = "Cantidad maxima de instancias en el ASG."
  type        = number
  default     = 2
}

variable "autoscaling_health_check_grace_period" {
  description = "Segundos de gracia antes de evaluar health checks del ASG."
  type        = number
  default     = 180
}

# --- Secrets Manager ---

variable "app_config_secret_name" {
  description = "Nombre del secreto de configuracion de la app en Secrets Manager."
  type        = string
  default     = null
  nullable    = true
}

# --- API Gateway ---

variable "enable_api_gateway" {
  description = "Activa el modulo api_gateway (HTTP API + VPC Link hacia el ALB)."
  type        = bool
  default     = true
}

# --- Auth (Cognito) ---

variable "enable_auth" {
  description = "Activa el modulo auth (Cognito User Pool)."
  type        = bool
  default     = true
}

variable "enable_jwt_authorizer" {
  description = "Asocia un JWT authorizer de Cognito al route $default del API Gateway."
  type        = bool
  default     = false
}

# --- Perimetro publico ---

variable "enable_perimeter" {
  description = "Activa CloudFront y WAF delante del endpoint publico del ambiente."
  type        = bool
  default     = false
}

variable "perimeter_origin_protocol_policy" {
  description = "Politica de protocolo entre CloudFront y el origen."
  type        = string
  default     = "http-only"

  validation {
    condition     = contains(["http-only", "https-only", "match-viewer"], var.perimeter_origin_protocol_policy)
    error_message = "perimeter_origin_protocol_policy debe ser `http-only`, `https-only` o `match-viewer`."
  }
}

variable "perimeter_custom_domain_name" {
  description = "Dominio personalizado opcional para CloudFront."
  type        = string
  default     = null
  nullable    = true
}

variable "perimeter_enable_acm_certificate" {
  description = "Solicita un certificado ACM en us-east-1 para el dominio personalizado."
  type        = bool
  default     = false
}

variable "perimeter_manage_route53_records" {
  description = "Crea registros DNS en Route 53 cuando exista hosted zone disponible."
  type        = bool
  default     = false
}

variable "perimeter_route53_zone_id" {
  description = "Hosted zone ID de Route 53 donde se publicara el dominio del perimetro."
  type        = string
  default     = null
  nullable    = true
}

variable "perimeter_price_class" {
  description = "Price class de CloudFront para el perimetro."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.perimeter_price_class)
    error_message = "perimeter_price_class debe ser `PriceClass_100`, `PriceClass_200` o `PriceClass_All`."
  }
}

# --- Observabilidad ---

variable "observability_sns_email_endpoint" {
  description = "Correo electronico que recibira las alertas SNS. Si es null no se crea la suscripcion."
  type        = string
  default     = null
  nullable    = true
}

variable "observability_log_retention_in_days" {
  description = "Dias de retencion para los log groups de CloudWatch."
  type        = number
  default     = 14
}

variable "observability_ec2_cpu_threshold" {
  description = "Umbral de CPU para la alarma de la instancia EC2."
  type        = number
  default     = 80
}

variable "observability_rds_cpu_threshold" {
  description = "Umbral de CPU para la alarma del cluster Aurora."
  type        = number
  default     = 80
}
