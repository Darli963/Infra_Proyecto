output "sns_topic_arn" {
  description = "ARN del topic SNS usado para las alertas."
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "Nombre del topic SNS usado para las alertas."
  value       = aws_sns_topic.alerts.name
}

output "sns_email_subscription_arn" {
  description = "ARN de la suscripcion por correo, o null si no se configuro."
  value       = try(aws_sns_topic_subscription.email[0].arn, null)
}

output "system_log_group_name" {
  description = "Nombre del log group para logs del sistema."
  value       = aws_cloudwatch_log_group.system.name
}

output "app_log_group_name" {
  description = "Nombre del log group para logs de la aplicacion."
  value       = aws_cloudwatch_log_group.app.name
}

output "alarm_names" {
  description = "Nombres de las alarmas creadas por el modulo."
  value = {
    rds_cpu_high            = aws_cloudwatch_metric_alarm.rds_cpu_high.alarm_name
    ec2_cpu_high            = try(aws_cloudwatch_metric_alarm.ec2_cpu_high[0].alarm_name, null)
    ec2_status_check_failed = try(aws_cloudwatch_metric_alarm.ec2_status_check_failed[0].alarm_name, null)
  }
}
