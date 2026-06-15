output "repository_name" {
  description = "Nombre del repositorio de infraestructura."
  value       = local.repository_name
}

output "managed_by" {
  description = "Herramienta que administra la infraestructura."
  value       = local.managed_by
}
