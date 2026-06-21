output "api_id" {
  description = "ID del HTTP API Gateway."
  value       = try(aws_apigatewayv2_api.this[0].id, null)
}

output "api_endpoint" {
  description = "Endpoint base del HTTP API Gateway."
  value       = try(aws_apigatewayv2_api.this[0].api_endpoint, null)
}

output "stage_arn" {
  description = "ARN del stage default del HTTP API Gateway (necesario para asociar WAF)."
  value       = try(aws_apigatewayv2_stage.default[0].arn, null)
}

output "stage_name" {
  description = "Nombre del stage default del HTTP API Gateway."
  value       = try(aws_apigatewayv2_stage.default[0].name, null)
}

output "vpc_link_sg_id" {
  description = "ID del Security Group creado para el VPC Link."
  value       = try(aws_security_group.vpc_link[0].id, null)
}
