output "cluster_id" {
  description = "ID del cluster Aurora."
  value       = aws_rds_cluster.this.id
}

output "cluster_endpoint" {
  description = "Endpoint principal del cluster Aurora."
  value       = aws_rds_cluster.this.endpoint
}

output "reader_endpoint" {
  description = "Endpoint de lectura del cluster Aurora."
  value       = aws_rds_cluster.this.reader_endpoint
}

output "port" {
  description = "Puerto del cluster Aurora."
  value       = aws_rds_cluster.this.port
}

output "db_subnet_group_name" {
  description = "Nombre del DB subnet group de Aurora."
  value       = aws_db_subnet_group.this.name
}

output "secret_name" {
  description = "Nombre del secreto de Aurora en Secrets Manager."
  value       = aws_secretsmanager_secret.aurora.name
}

output "secret_arn" {
  description = "ARN del secreto de Aurora en Secrets Manager."
  value       = aws_secretsmanager_secret.aurora.arn
}
