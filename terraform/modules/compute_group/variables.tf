variable "enabled" {
  description = "Activa el despliegue del Launch Template y el Auto Scaling Group."
  type        = bool
  default     = false
}

variable "name" {
  description = "Prefijo nominal para los recursos del modulo."
  type        = string
}

variable "private_subnet_ids" {
  description = "Subnets privadas donde se desplegaran las instancias del ASG."
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security Groups asociados a las instancias del ASG."
  type        = list(string)
}

variable "instance_profile_name" {
  description = "Instance profile IAM usado por las instancias."
  type        = string
}

variable "instance_role_name" {
  description = "Nombre del rol IAM asociado a las instancias."
  type        = string
}

variable "instance_type" {
  description = "Tipo de instancia usado por el Launch Template."
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "AMI opcional para las instancias. Si es null se resuelve desde SSM."
  type        = string
  default     = null
  nullable    = true
}

variable "root_volume_size" {
  description = "Tamano del volumen raiz en GB."
  type        = number
  default     = 16
}

variable "root_volume_type" {
  description = "Tipo de volumen EBS para la raiz."
  type        = string
  default     = "gp3"
}

variable "enable_detailed_monitoring" {
  description = "Activa detailed monitoring en las instancias."
  type        = bool
  default     = false
}

variable "nodejs_major_version" {
  description = "Version mayor de Node.js instalada durante el bootstrap."
  type        = number
  default     = 20
}

variable "app_base_dir" {
  description = "Directorio base donde se despliega la aplicacion."
  type        = string
  default     = "/opt/phase4-app"
}

variable "app_port" {
  description = "Puerto donde escuchara la aplicacion."
  type        = number
  default     = 3000
}

variable "app_service_name" {
  description = "Nombre del servicio systemd que ejecuta la aplicacion."
  type        = string
  default     = "phase4-smoke-app"
}

variable "app_artifact_prefix" {
  description = "Prefijo dentro del bucket S3 donde estan los artefactos de la app."
  type        = string
  default     = "phase4-smoke-app"
}

variable "artifact_bucket_name" {
  description = "Nombre del bucket S3 desde donde se descargan los artefactos."
  type        = string
}

variable "artifact_bucket_arn" {
  description = "ARN del bucket S3 desde donde se descargan los artefactos."
  type        = string
}

variable "database_secret_name" {
  description = "Nombre del secreto de Aurora consumido por la aplicacion."
  type        = string
}

variable "aws_region" {
  description = "Region usada por los scripts dentro de la instancia."
  type        = string
}

variable "secret_arns" {
  description = "ARNs de secretos que las instancias podran leer."
  type        = list(string)
  default     = []
}

variable "db_connect_resource_arns" {
  description = "ARNs permitidos para rds-db:connect cuando la app usa IAM."
  type        = list(string)
  default     = []
}

variable "desired_capacity" {
  description = "Cantidad deseada de instancias en el ASG."
  type        = number
  default     = 1
}

variable "min_size" {
  description = "Cantidad minima de instancias en el ASG."
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Cantidad maxima de instancias en el ASG."
  type        = number
  default     = 2
}

variable "health_check_type" {
  description = "Tipo de health check usado por el ASG."
  type        = string
  default     = "ELB"
}

variable "health_check_grace_period" {
  description = "Segundos de gracia antes de evaluar health checks del ASG."
  type        = number
  default     = 180
}

variable "target_group_arns" {
  description = "Target groups asociados al ASG."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Etiquetas adicionales para el modulo."
  type        = map(string)
  default     = {}
}
