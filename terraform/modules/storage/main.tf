resource "aws_s3_bucket" "this" {
  bucket        = var.bucket_name
  force_destroy = var.force_destroy

  tags = var.tags
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  count  = var.lifecycle_enabled ? 1 : 0
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "tiered-storage"
    status = "Enabled"

    # Aplica a todos los objetos del bucket (filter vacio = sin filtro de prefix)
    filter {}

    transition {
      days          = var.lifecycle_transition_standard_ia_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.lifecycle_transition_glacier_days
      storage_class = "GLACIER"
    }

    # Opcional: descomentar para expirar objetos o mover a DEEP_ARCHIVE a los 180 dias
    # transition {
    #   days          = 180
    #   storage_class = "DEEP_ARCHIVE"
    # }
  }
}

# Secreto de configuracion general de la app — valor inicial con placeholders.
# Actualiza el contenido real via consola o CLI; nunca hardcodees valores reales aqui.
resource "aws_secretsmanager_secret" "app_config" {
  count                   = var.app_config_secret_name != null ? 1 : 0
  name                    = var.app_config_secret_name
  recovery_window_in_days = 7

  tags = merge(
    var.tags,
    {
      Name = var.app_config_secret_name
      Tier = "secrets"
    }
  )
}

resource "aws_secretsmanager_secret_version" "app_config_initial" {
  count     = var.app_config_secret_name != null ? 1 : 0
  secret_id = aws_secretsmanager_secret.app_config[0].id
  # Placeholders — sustituir manualmente via consola o CLI antes de aplicar en produccion
  secret_string = jsonencode({
    jwt_secret = "CHANGE_ME"
    app_env    = "CHANGE_ME"
  })

  lifecycle {
    # Permite actualizar el secreto manualmente sin que Terraform lo sobreescriba
    ignore_changes = [secret_string]
  }
}
