terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  common_tags = merge(
    {
      Module = "compute-group"
    },
    var.tags
  )

  selected_ami_id = var.ami_id != null ? var.ami_id : try(data.aws_ssm_parameter.al2023_ami[0].value, null)
  asg_tags = merge(
    local.common_tags,
    {
      Name  = "${var.name}-app"
      Phase = "balanceo-escalado"
      Role  = "app-server"
    }
  )
}

data "aws_ssm_parameter" "al2023_ami" {
  count = var.enabled && var.ami_id == null ? 1 : 0

  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_iam_role_policy" "instance_runtime" {
  count = var.enabled ? 1 : 0

  name = "${var.name}-runtime-access"
  role = var.instance_role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "ReadApplicationSecrets"
          Effect = "Allow"
          Action = [
            "secretsmanager:DescribeSecret",
            "secretsmanager:GetSecretValue"
          ]
          Resource = [for arn in var.secret_arns : arn if arn != null]
        },
        {
          Sid    = "ListArtifactBucket"
          Effect = "Allow"
          Action = [
            "s3:ListBucket"
          ]
          Resource = [var.artifact_bucket_arn]
        },
        {
          Sid    = "ReadWriteArtifactObjects"
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:PutObject"
          ]
          Resource = ["${var.artifact_bucket_arn}/*"]
        }
      ],
      length(var.db_connect_resource_arns) > 0 ? [
        {
          Sid    = "ConnectToRdsWithIamAuth"
          Effect = "Allow"
          Action = [
            "rds-db:connect"
          ]
          Resource = var.db_connect_resource_arns
        }
      ] : [],
      var.enable_node_exporter ? [
        {
          Sid    = "DescribeInstancesForMonitoring"
          Effect = "Allow"
          Action = [
            "ec2:DescribeInstances"
          ]
          Resource = "*"
        }
      ] : []
    )
  })
}

resource "aws_launch_template" "this" {
  count = var.enabled ? 1 : 0

  name                   = "${var.name}-lt"
  image_id               = local.selected_ami_id
  instance_type          = var.instance_type
  update_default_version = true

  iam_instance_profile {
    name = var.instance_profile_name
  }

  monitoring {
    enabled = var.enable_detailed_monitoring
  }

  vpc_security_group_ids = var.security_group_ids
  user_data = base64encode(templatefile("${path.module}/templates/bootstrap_app.sh.tftpl", {
    app_base_dir         = var.app_base_dir
    app_port             = var.app_port
    app_service_name     = var.app_service_name
    artifact_bucket_name = var.artifact_bucket_name
    artifact_prefix      = var.app_artifact_prefix
    aws_region           = var.aws_region
    database_secret_name = var.database_secret_name
    nodejs_major_version = var.nodejs_major_version
    enable_node_exporter = var.enable_node_exporter
  }))

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_type           = var.root_volume_type
      volume_size           = var.root_volume_size
      delete_on_termination = true
      encrypted             = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags          = local.asg_tags
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(
      local.common_tags,
      {
        Name = "${var.name}-volume"
        Tier = "compute"
      }
    )
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.name}-lt"
      Tier = "compute"
    }
  )

  depends_on = [aws_iam_role_policy.instance_runtime]
}

resource "aws_autoscaling_group" "this" {
  count = var.enabled ? 1 : 0

  name                      = "${var.name}-asg"
  min_size                  = var.min_size
  max_size                  = var.max_size
  desired_capacity          = var.desired_capacity
  health_check_type         = var.health_check_type
  health_check_grace_period = var.health_check_grace_period
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = var.target_group_arns
  force_delete              = false

  launch_template {
    id      = aws_launch_template.this[0].id
    version = "$Latest"
  }

  dynamic "tag" {
    for_each = local.asg_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

resource "aws_autoscaling_policy" "cpu_target_tracking" {
  count = var.enabled && var.enable_cpu_target_tracking ? 1 : 0

  name                   = "${var.name}-cpu-target-tracking"
  policy_type            = "TargetTrackingScaling"
  autoscaling_group_name = aws_autoscaling_group.this[0].name

  estimated_instance_warmup = var.cpu_estimated_instance_warmup

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }

    target_value     = var.cpu_target_value
    disable_scale_in = var.cpu_disable_scale_in
  }
}
