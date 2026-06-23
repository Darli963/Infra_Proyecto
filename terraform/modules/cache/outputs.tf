output "enabled" {
  description = "Indica si Redis esta habilitado."
  value       = var.enabled
}

output "primary_endpoint" {
  description = "Endpoint principal de Redis."
  value       = var.enabled ? aws_elasticache_replication_group.this[0].primary_endpoint_address : null
}

output "reader_endpoint" {
  description = "Endpoint lector de Redis."
  value       = var.enabled ? aws_elasticache_replication_group.this[0].reader_endpoint_address : null
}

output "secret_name" {
  description = "Nombre del secreto de Redis si fue creado."
  value       = var.enabled && var.secret_name != null ? aws_secretsmanager_secret.redis[0].name : null
}

output "secret_arn" {
  description = "ARN del secreto de Redis si fue creado."
  value       = var.enabled && var.secret_name != null ? aws_secretsmanager_secret.redis[0].arn : null
}
