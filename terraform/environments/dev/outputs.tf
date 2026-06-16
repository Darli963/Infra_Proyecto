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
  value       = module.database.cluster_id
}

output "aurora_endpoint" {
  description = "Endpoint principal del cluster Aurora."
  value       = module.database.cluster_endpoint
}

output "aurora_reader_endpoint" {
  description = "Endpoint de lectura del cluster Aurora."
  value       = module.database.reader_endpoint
}

output "aurora_db_subnet_group_name" {
  description = "Nombre del DB subnet group usado por Aurora."
  value       = module.database.db_subnet_group_name
}

output "aurora_secret_name" {
  description = "Nombre del secreto de Aurora en Secrets Manager."
  value       = module.database.secret_name
}

output "aurora_secret_arn" {
  description = "ARN del secreto de Aurora en Secrets Manager."
  value       = module.database.secret_arn
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
