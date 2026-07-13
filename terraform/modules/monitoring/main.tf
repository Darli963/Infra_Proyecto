data "aws_region" "current" {}

data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_secretsmanager_secret" "grafana" {
  name                    = var.grafana_secret_name
  recovery_window_in_days = 0
  tags = {
    Name        = var.grafana_secret_name
    Environment = var.environment
  }
}

resource "random_password" "grafana" {
  length           = 16
  special          = true
  override_special = "!#$%*-_=+?"
}

resource "aws_secretsmanager_secret_version" "grafana" {
  secret_id = aws_secretsmanager_secret.grafana.id
  secret_string = jsonencode({
    admin_password = random_password.grafana.result
  })
}

data "aws_security_group" "app_ec2" {
  vpc_id = var.vpc_id
  filter {
    name   = "tag:Tier"
    values = ["compute"]
  }
  filter {
    name   = "tag:Environment"
    values = [var.environment]
  }
}

# --- Security Group para Instancia de Monitoreo ---
resource "aws_security_group" "monitoring" {
  name        = "${var.environment}-monitoring-sg"
  description = "Security Group para la instancia de monitoreo (Grafana, Prometheus, Loki, Alloy)"
  vpc_id      = var.vpc_id

  # Grafana accesible solo desde el CIDR admin
  ingress {
    description = "Grafana de admin"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  # Loki y Alloy recibiendo logs desde las instancias de aplicacion
  ingress {
    description     = "Loki de app"
    from_port       = 3100
    to_port         = 3100
    protocol        = "tcp"
    security_groups = [data.aws_security_group.app_ec2.id]
  }

  ingress {
    description     = "Alloy de app"
    from_port       = 12345
    to_port         = 12345
    protocol        = "tcp"
    security_groups = [data.aws_security_group.app_ec2.id]
  }

  # Trafico interno ilimitado (self-SG) para contenedores Docker
  ingress {
    description = "Self traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  # Egress total para descargas
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-monitoring-sg"
    Environment = var.environment
  }
}

# --- Regla en el SG de la app para permitir scrape de node_exporter ---
resource "aws_security_group_rule" "allow_prometheus_to_node_exporter" {
  type                     = "ingress"
  description              = "Prometheus desde monitoring hacia node_exporter"
  from_port                = 9100
  to_port                  = 9100
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.monitoring.id
  security_group_id        = data.aws_security_group.app_ec2.id
}

# --- IAM Role e Instance Profile para Monitoreo ---
resource "aws_iam_role" "monitoring" {
  name = "${var.environment}-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.environment}-monitoring-role"
    Environment = var.environment
  }
}

resource "aws_iam_policy" "monitoring" {
  name        = "${var.environment}-monitoring-policy"
  description = "Permisos minimos de observabilidad para Grafana, Loki y Alloy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchMetrics"
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:FilterLogEvents",
          "logs:GetLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      },
      {
        Sid    = "SecretsManager"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.grafana.arn
        ]
      },
      {
        Sid    = "EC2Discovery"
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "monitoring" {
  role       = aws_iam_role.monitoring.name
  policy_arn = aws_iam_policy.monitoring.arn
}

resource "aws_iam_role_policy_attachment" "monitoring_ssm" {
  role       = aws_iam_role.monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "monitoring" {
  name = "${var.environment}-monitoring-profile"
  role = aws_iam_role.monitoring.name
}

# --- Instancia EC2 de Monitoreo ---
resource "aws_instance" "this" {
  ami                  = data.aws_ssm_parameter.al2023_ami.value
  instance_type        = "t3.small"
  subnet_id            = var.private_subnet_ids[0]
  key_name             = var.key_pair_name
  security_groups      = [aws_security_group.monitoring.id]
  iam_instance_profile = aws_iam_instance_profile.monitoring.name

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    grafana_secret_name    = var.grafana_secret_name
    aws_region             = data.aws_region.current.name
    docker_compose_content = file("${path.module}/files/docker-compose.yml")
    prometheus_content = templatefile("${path.module}/files/prometheus/prometheus.yml", {
      aws_region  = data.aws_region.current.name
      environment = var.environment
    })
    loki_content = file("${path.module}/files/loki/loki-config.yml")
    alloy_content = templatefile("${path.module}/files/alloy/config.alloy", {
      aws_region     = data.aws_region.current.name
      log_group_name = var.log_group_name
    })
    grafana_datasources = templatefile("${path.module}/files/grafana/provisioning/datasources/datasources.yml", {
      aws_region = data.aws_region.current.name
    })
    grafana_dashboards = file("${path.module}/files/grafana/provisioning/dashboards/dashboards.yml")
    grafana_dashboard_json = templatefile("${path.module}/files/grafana/provisioning/dashboards/main-dashboard.json", {
      alb_arn_suffix    = var.alb_arn_suffix
      aurora_cluster_id = var.aurora_cluster_id
      aws_region        = data.aws_region.current.name
    })
  }))

  tags = {
    Name        = "${var.environment}-monitoring-ec2"
    Role        = "monitoring"
    Environment = var.environment
  }

  lifecycle {
    ignore_changes = [ami]
  }
}

# --- Alarma CloudWatch de ejemplo para el ASG de aplicacion ---
resource "aws_cloudwatch_metric_alarm" "asg_cpu" {
  alarm_name          = "${var.environment}-asg-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Esta alarma monitorea la utilizacion de CPU promedio del ASG de aplicacion."
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    AutoScalingGroupName = var.app_asg_name
  }
}
