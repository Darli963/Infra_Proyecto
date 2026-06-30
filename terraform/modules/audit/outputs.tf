output "log_bucket_name" {
  description = "Nombre del bucket S3 de logs de auditoria."
  value       = try(aws_s3_bucket.audit_logs[0].bucket, null)
}

output "log_bucket_arn" {
  description = "ARN del bucket S3 de logs de auditoria."
  value       = try(aws_s3_bucket.audit_logs[0].arn, null)
}

output "kms_key_arn" {
  description = "ARN de la clave KMS usada para cifrar los logs."
  value       = try(aws_kms_key.audit_logs[0].arn, null)
}

output "cloudtrail_name" {
  description = "Nombre del CloudTrail Trail."
  value       = try(aws_cloudtrail.this[0].name, null)
}

output "cloudtrail_arn" {
  description = "ARN del CloudTrail Trail."
  value       = try(aws_cloudtrail.this[0].arn, null)
}

output "config_recorder_name" {
  description = "Nombre del Configuration Recorder de AWS Config."
  value       = try(aws_config_configuration_recorder.this[0].name, null)
}
