output "instance_id" {
  description = "ID de la EC2 de prueba."
  value       = try(aws_instance.this[0].id, null)
}

output "private_ip" {
  description = "IP privada de la EC2 de prueba."
  value       = try(aws_instance.this[0].private_ip, null)
}

output "private_dns" {
  description = "DNS privado de la EC2 de prueba."
  value       = try(aws_instance.this[0].private_dns, null)
}

output "availability_zone" {
  description = "Availability Zone donde quedo la EC2 de prueba."
  value       = try(aws_instance.this[0].availability_zone, null)
}

output "ami_id" {
  description = "AMI resuelta para la EC2 de prueba."
  value       = try(aws_instance.this[0].ami, null)
}

output "ssm_start_session_command" {
  description = "Comando sugerido para entrar por Session Manager."
  value       = try(format("aws ssm start-session --region %s --target %s", var.aws_region, aws_instance.this[0].id), null)
}
