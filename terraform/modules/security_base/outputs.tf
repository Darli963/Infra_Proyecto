output "ec2_instance_profile_name" {
  description = "Nombre del instance profile para administrar EC2 con Session Manager."
  value       = aws_iam_instance_profile.ec2_ssm.name
}

output "ec2_iam_role_name" {
  description = "Nombre del rol IAM asociado a EC2."
  value       = aws_iam_role.ec2_ssm.name
}

output "ec2_iam_role_arn" {
  description = "ARN del rol IAM asociado a EC2."
  value       = aws_iam_role.ec2_ssm.arn
}

output "security_group_ids" {
  description = "IDs de los Security Groups por capa."
  value = {
    alb    = aws_security_group.alb.id
    ec2    = aws_security_group.ec2.id
    aurora = aws_security_group.aurora.id
    redis  = aws_security_group.redis.id
  }
}

output "connectivity_matrix" {
  description = "Resumen de conectividad esperada entre capas."
  value = {
    alb_external = [for port in var.alb_ingress_ports : "Internet -> ALB:${port}"]
    alb_to_ec2   = [for port in var.ec2_ingress_ports : "ALB -> EC2:${port}"]
    ec2_to_db    = "EC2 -> Aurora:${var.aurora_port}"
    ec2_to_redis = "EC2 -> Redis:${var.redis_port}"
    ec2_mgmt     = "EC2 -> HTTPS:443 para Session Manager"
  }
}
