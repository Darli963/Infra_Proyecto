output "alb_arn" {
  description = "ARN del Application Load Balancer."
  value       = try(aws_lb.this[0].arn, null)
}

output "alb_dns_name" {
  description = "DNS publico del ALB."
  value       = try(aws_lb.this[0].dns_name, null)
}

output "alb_zone_id" {
  description = "Hosted zone ID del ALB."
  value       = try(aws_lb.this[0].zone_id, null)
}

output "target_group_arn" {
  description = "ARN del target group HTTP."
  value       = try(aws_lb_target_group.this[0].arn, null)
}

output "listener_arn" {
  description = "ARN del listener HTTP."
  value       = try(aws_lb_listener.http[0].arn, null)
}
