output "user_pool_id" {
  description = "ID del Cognito User Pool."
  value       = try(aws_cognito_user_pool.this[0].id, null)
}

output "user_pool_arn" {
  description = "ARN del Cognito User Pool."
  value       = try(aws_cognito_user_pool.this[0].arn, null)
}

output "user_pool_client_id" {
  description = "ID del cliente SPA del User Pool."
  value       = try(aws_cognito_user_pool_client.this[0].id, null)
}

output "user_pool_domain" {
  description = "Prefijo de dominio del User Pool."
  value       = try(aws_cognito_user_pool_domain.this[0].domain, null)
}

output "user_pool_endpoint" {
  description = "Endpoint (issuer) del User Pool, usado para configurar JWT authorizers."
  value       = try("https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.this[0].id}", null)
}
