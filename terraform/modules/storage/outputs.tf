output "bucket_id" {
  description = "ID del bucket S3."
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "ARN del bucket S3."
  value       = aws_s3_bucket.this.arn
}

output "bucket_regional_domain_name" {
  description = "Dominio regional del bucket S3."
  value       = aws_s3_bucket.this.bucket_regional_domain_name
}

output "app_config_secret_arn" {
  description = "ARN del secreto de configuracion de la app en Secrets Manager."
  value       = try(aws_secretsmanager_secret.app_config[0].arn, null)
}
