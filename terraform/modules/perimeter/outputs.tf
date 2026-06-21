output "cloudfront_distribution_id" {
  description = "ID de la distribucion CloudFront."
  value       = try(aws_cloudfront_distribution.this[0].id, null)
}

output "cloudfront_domain_name" {
  description = "Dominio generado por CloudFront."
  value       = try(aws_cloudfront_distribution.this[0].domain_name, null)
}

output "cloudfront_hosted_zone_id" {
  description = "Hosted zone ID administrado por CloudFront."
  value       = try(aws_cloudfront_distribution.this[0].hosted_zone_id, null)
}

output "web_acl_arn" {
  description = "ARN del Web ACL asociado a CloudFront."
  value       = try(aws_wafv2_web_acl.this[0].arn, null)
}

output "acm_certificate_arn" {
  description = "ARN del certificado ACM solicitado para dominio personalizado."
  value       = try(aws_acm_certificate.this[0].arn, null)
}

output "custom_domain_name" {
  description = "Dominio personalizado configurado para el perimetro."
  value       = var.custom_domain_name
}

output "custom_domain_status" {
  description = "Estado resumido del dominio personalizado."
  value = !local.custom_domain_requested ? "not_requested" : (
    local.route53_ready ? "managed_in_route53" : "certificate_or_dns_pending"
  )
}

output "route53_alias_fqdn" {
  description = "FQDN del alias A creado en Route 53 para CloudFront."
  value       = try(aws_route53_record.cloudfront_alias[0].fqdn, null)
}

output "https_endpoint" {
  description = "Endpoint HTTPS sugerido para validar el perimetro."
  value = try(
    local.route53_ready ? "https://${var.custom_domain_name}" : "https://${aws_cloudfront_distribution.this[0].domain_name}",
    null
  )
}

