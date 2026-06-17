variable "enabled" {
  description = "Crea o no la EC2 de prueba."
  type        = bool
  default     = true
}

variable "name" {
  description = "Nombre base de la instancia."
  type        = string
}

variable "subnet_id" {
  description = "Subnet privada donde se desplegara la EC2."
  type        = string
}

variable "security_group_ids" {
  description = "Security Groups asociados a la instancia."
  type        = list(string)
}

variable "instance_profile_name" {
  description = "Instance profile IAM usado por la EC2."
  type        = string
}

variable "instance_role_name" {
  description = "Nombre del rol IAM asociado a la EC2."
  type        = string
}

variable "instance_type" {
  description = "Tipo de instancia para la EC2 de prueba."
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "AMI a usar. Si es null, se resuelve la ultima Amazon Linux 2023 desde SSM."
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
  description = "Activa detailed monitoring en la instancia."
  type        = bool
  default     = false
}

variable "nodejs_major_version" {
  description = "Version mayor de Node.js a instalar durante el bootstrap."
  type        = number
  default     = 20
}

variable "app_base_dir" {
  description = "Directorio base preparado para el despliegue manual inicial."
  type        = string
  default     = "/opt/phase4-app"
}

variable "app_port" {
  description = "Puerto local esperado para la aplicacion de prueba."
  type        = number
  default     = 3000
}

variable "aws_region" {
  description = "Region usada por los scripts de soporte dentro de la instancia."
  type        = string
}

variable "secret_arns" {
  description = "ARNs de secretos que la instancia podra leer."
  type        = list(string)
  default     = []
}

variable "artifact_bucket_arn" {
  description = "ARN del bucket S3 desde donde la EC2 puede leer artefactos."
  type        = string
  default     = null
  nullable    = true
}

variable "db_connect_resource_arns" {
  description = "ARNs permitidos para rds-db:connect cuando la app usa autenticacion IAM."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags adicionales para la instancia."
  type        = map(string)
  default     = {}
}
