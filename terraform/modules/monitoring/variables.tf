variable "vpc_id" {
  description = "ID de la VPC donde se despliega la instancia de monitoreo."
  type        = string
}

variable "private_subnet_ids" {
  description = "Lista de IDs de subnets privadas para desplegar la instancia de monitoreo."
  type        = list(string)
}

variable "key_pair_name" {
  description = "Nombre del key pair para acceder a la instancia por SSH."
  type        = string
}

variable "app_asg_name" {
  description = "Nombre del Auto Scaling Group de la aplicacion."
  type        = string
}

variable "alb_arn_suffix" {
  description = "Sufijo del ARN del ALB para obtener metricas de CloudWatch."
  type        = string
}

variable "aurora_cluster_id" {
  description = "Identificador del cluster de Aurora para obtener metricas de CloudWatch."
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN del topico SNS existente para notificar alertas."
  type        = string
}

variable "grafana_secret_name" {
  description = "Nombre del secreto en Secrets Manager que contiene la contrasena de Grafana."
  type        = string
}

variable "admin_cidr" {
  description = "CIDR de administracion autorizado para acceder a Grafana."
  type        = string
}

variable "environment" {
  description = "Ambiente objetivo (dev, staging, prod)."
  type        = string
}

variable "log_group_name" {
  description = "Nombre del Log Group de CloudWatch del cual Alloy recolectara logs."
  type        = string
}
