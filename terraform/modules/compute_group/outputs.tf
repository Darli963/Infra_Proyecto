output "launch_template_id" {
  description = "ID del Launch Template."
  value       = try(aws_launch_template.this[0].id, null)
}

output "launch_template_latest_version" {
  description = "Ultima version del Launch Template."
  value       = try(aws_launch_template.this[0].latest_version, null)
}

output "autoscaling_group_name" {
  description = "Nombre del Auto Scaling Group."
  value       = try(aws_autoscaling_group.this[0].name, null)
}

output "autoscaling_group_arn" {
  description = "ARN del Auto Scaling Group."
  value       = try(aws_autoscaling_group.this[0].arn, null)
}
