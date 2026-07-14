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
      Module = "compute"
    },
    var.tags
  )

  selected_ami_id = var.ami_id != null ? var.ami_id : try(data.aws_ssm_parameter.al2023_ami[0].value, null)
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
      [
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
      ]
    )
  })
}

resource "aws_instance" "this" {
  count = var.enabled ? 1 : 0

  ami                         = local.selected_ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = var.security_group_ids
  iam_instance_profile        = var.instance_profile_name
  associate_public_ip_address = false
  monitoring                  = var.enable_detailed_monitoring
  user_data = templatefile("${path.module}/templates/bootstrap.sh.tftpl", {
    app_base_dir         = var.app_base_dir
    app_port             = var.app_port
    aws_region           = var.aws_region
    nodejs_major_version = var.nodejs_major_version
  })

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    volume_type           = var.root_volume_type
    volume_size           = var.root_volume_size
    delete_on_termination = true
    encrypted             = true
  }

  tags = merge(
    local.common_tags,
    {
      Name  = var.name
      Phase = "phase4"
      Role  = "test-instance"
    }
  )

  depends_on = [aws_iam_role_policy.instance_runtime]
}
