locals {
  common_tags = merge(
    {
      Module = "observability"
    },
    var.tags
  )

  create_email_subscription = var.sns_email_endpoint != null ? trimspace(var.sns_email_endpoint) != "" : false
  sns_topic_name            = "${var.name}-observability-alerts"
  system_log_group_name     = "/${var.project_name}/${var.environment}/system"
  app_log_group_name        = "/${var.project_name}/${var.environment}/app"
}

resource "aws_cloudwatch_log_group" "system" {
  name              = local.system_log_group_name
  retention_in_days = var.log_retention_in_days

  tags = merge(
    local.common_tags,
    {
      Name = local.system_log_group_name
      Tier = "observability"
    }
  )
}

resource "aws_cloudwatch_log_group" "app" {
  name              = local.app_log_group_name
  retention_in_days = var.log_retention_in_days

  tags = merge(
    local.common_tags,
    {
      Name = local.app_log_group_name
      Tier = "observability"
    }
  )
}

resource "aws_sns_topic" "alerts" {
  name = local.sns_topic_name

  tags = merge(
    local.common_tags,
    {
      Name = local.sns_topic_name
      Tier = "observability"
    }
  )
}

resource "aws_sns_topic_subscription" "email" {
  count = local.create_email_subscription ? 1 : 0

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.sns_email_endpoint
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.name}-rds-cpu-high"
  alarm_description   = "Avisa cuando el cluster Aurora supera el umbral de CPU configurado."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = var.db_cluster_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-rds-cpu-high"
      Tier = "observability"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  count = var.enable_ec2_alarms ? 1 : 0

  alarm_name          = "${var.name}-ec2-cpu-high"
  alarm_description   = "Avisa cuando la instancia EC2 supera el umbral de CPU configurado."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = var.ec2_cpu_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    InstanceId = var.instance_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-ec2-cpu-high"
      Tier = "observability"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "ec2_status_check_failed" {
  count = var.enable_ec2_alarms ? 1 : 0

  alarm_name          = "${var.name}-ec2-status-check-failed"
  alarm_description   = "Avisa cuando la instancia EC2 falla sus status checks."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    InstanceId = var.instance_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-ec2-status-check-failed"
      Tier = "observability"
    }
  )
}
