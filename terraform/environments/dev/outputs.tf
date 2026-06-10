output "ec2_instance_profile_name" {
  description = "Nombre del instance profile para EC2 administradas con Session Manager."
  value       = module.security_base.ec2_instance_profile_name
}

output "ec2_iam_role_name" {
  description = "Nombre del rol IAM usado por EC2."
  value       = module.security_base.ec2_iam_role_name
}

output "ec2_iam_role_arn" {
  description = "ARN del rol IAM usado por EC2."
  value       = module.security_base.ec2_iam_role_arn
}

output "security_group_ids" {
  description = "IDs de los Security Groups creados para la base de seguridad."
  value       = module.security_base.security_group_ids
}

output "connectivity_matrix" {
  description = "Matriz resumida de conectividad entre capas."
  value       = module.security_base.connectivity_matrix
}
