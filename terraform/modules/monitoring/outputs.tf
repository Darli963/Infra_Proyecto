output "grafana_private_ip" {
  description = "IP privada de la instancia de monitoreo."
  value       = aws_instance.this.private_ip
}

output "grafana_url" {
  description = "URL interna para acceder a Grafana."
  value       = "http://${aws_instance.this.private_ip}:3000"
}

output "monitoring_instance_id" {
  description = "ID de la instancia EC2 de monitoreo."
  value       = aws_instance.this.id
}

output "grafana_secret_name" {
  description = "Nombre del secreto en Secrets Manager con la contraseña de admin de Grafana"
  value       = aws_secretsmanager_secret.grafana.name
}

