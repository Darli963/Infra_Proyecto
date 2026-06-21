output "ec2_instance_profile_name" {
  description = "Nombre del instance profile para EC2 administradas con Session Manager."
  value       = module.security_base.ec2_instance_profile_name
}

output "ec2_iam_role_name" {
  description = "Nombre del rol IAM usado por EC2."
  value       = module.security_base.ec2_iam_role_name
}

output "ec2_iam_role_arn" {
  description = "ARN del rol IAM usado por EC2."
  value       = module.security_base.ec2_iam_role_arn
}

output "security_group_ids" {
  description = "IDs de los Security Groups creados para la base de seguridad."
  value       = module.security_base.security_group_ids
}

output "connectivity_matrix" {
  description = "Matriz resumida de conectividad entre capas."
  value       = module.security_base.connectivity_matrix
}

output "s3_bucket_name" {
  description = "Nombre del bucket S3 funcional de la aplicacion."
  value       = module.storage.bucket_id
}

output "s3_bucket_arn" {
  description = "ARN del bucket S3."
  value       = module.storage.bucket_arn
}

output "s3_bucket_regional_domain_name" {
  description = "Dominio regional del bucket S3."
  value       = module.storage.bucket_regional_domain_name
}

output "aurora_cluster_id" {
  description = "ID del cluster Aurora."
  value       = local.database_cluster_id
}

output "aurora_endpoint" {
  description = "Endpoint principal del cluster Aurora."
  value       = local.database_endpoint
}

output "aurora_reader_endpoint" {
  description = "Endpoint de lectura del cluster Aurora."
  value       = local.database_reader_endpoint
}

output "aurora_db_subnet_group_name" {
  description = "Nombre del DB subnet group usado por Aurora."
  value       = local.database_db_subnet_group_name
}

output "aurora_secret_name" {
  description = "Nombre del secreto de Aurora en Secrets Manager."
  value       = local.database_secret_name
}

output "aurora_secret_arn" {
  description = "ARN del secreto de Aurora en Secrets Manager."
  value       = local.database_secret_arn
  sensitive   = true
}

output "redis_enabled" {
  description = "Indica si Redis opcional fue habilitado."
  value       = module.cache.enabled
}

output "redis_primary_endpoint" {
  description = "Endpoint principal de Redis si aplica."
  value       = module.cache.primary_endpoint
}

output "redis_secret_arn" {
  description = "ARN del secreto de Redis si aplica."
  value       = module.cache.secret_arn
  sensitive   = true
}

output "test_instance_id" {
  description = "ID de la EC2 privada de prueba para la Fase 4."
  value       = module.compute.instance_id
}

output "test_instance_private_ip" {
  description = "IP privada de la EC2 de prueba."
  value       = module.compute.private_ip
}

output "test_instance_private_dns" {
  description = "DNS privado de la EC2 de prueba."
  value       = module.compute.private_dns
}

output "test_instance_ami_id" {
  description = "AMI usada por la EC2 privada de prueba."
  value       = nonsensitive(module.compute.ami_id)
}

output "test_instance_ssm_start_session_command" {
  description = "Comando sugerido para entrar por Session Manager a la EC2 de prueba."
  value       = module.compute.ssm_start_session_command
}

output "alb_dns_name" {
  description = "DNS publico del Application Load Balancer."
  value       = module.edge.alb_dns_name
}

output "alb_target_group_arn" {
  description = "ARN del target group asociado al ALB."
  value       = module.edge.target_group_arn
}

output "launch_template_id" {
  description = "ID del Launch Template usado por el Auto Scaling Group."
  value       = module.compute_group.launch_template_id
}

output "autoscaling_group_name" {
  description = "Nombre del Auto Scaling Group de la aplicacion."
  value       = module.compute_group.autoscaling_group_name
}

output "observability_sns_topic_arn" {
  description = "ARN del topic SNS que recibe las alertas operativas."
  value       = module.observability.sns_topic_arn
}

output "observability_log_groups" {
  description = "Log groups creados para logs del sistema y de la aplicacion."
  value = {
    system = module.observability.system_log_group_name
    app    = module.observability.app_log_group_name
  }
}

output "observability_alarm_names" {
  description = "Nombres de las alarmas activas de observabilidad."
  value       = module.observability.alarm_names
}
