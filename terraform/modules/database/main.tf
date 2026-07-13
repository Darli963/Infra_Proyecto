resource "random_password" "master_password" {
  length           = 24
  special          = true
  override_special = "!#$%*-_=+?"
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.name}-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-subnet-group"
      Tier = "data"
    }
  )
}

resource "aws_rds_cluster" "this" {
  cluster_identifier              = "${var.name}-aurora"
  engine                          = var.engine
  engine_version                  = var.engine_version
  database_name                   = var.database_name
  master_username                 = var.master_username
  master_password                 = random_password.master_password.result
  port                            = var.port
  db_subnet_group_name            = aws_db_subnet_group.this.name
  vpc_security_group_ids          = [var.aurora_security_group_id]
  storage_encrypted               = var.storage_encrypted
  backup_retention_period         = var.backup_retention_period
  preferred_backup_window         = var.preferred_backup_window
  preferred_maintenance_window    = var.preferred_maintenance_window
  skip_final_snapshot             = var.skip_final_snapshot
  deletion_protection             = var.deletion_protection
  apply_immediately               = var.apply_immediately
  copy_tags_to_snapshot           = true
  enabled_cloudwatch_logs_exports = var.engine == "aurora-postgresql" ? ["postgresql"] : ["audit", "error", "general", "slowquery"]

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-aurora"
      Tier = "data"
    }
  )
}

resource "aws_rds_cluster_instance" "this" {
  count                      = var.instance_count
  identifier                 = "${var.name}-aurora-${count.index + 1}"
  cluster_identifier         = aws_rds_cluster.this.id
  instance_class             = var.instance_class
  engine                     = aws_rds_cluster.this.engine
  engine_version             = aws_rds_cluster.this.engine_version
  publicly_accessible        = false
  auto_minor_version_upgrade = true
  apply_immediately          = var.apply_immediately

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-aurora-${count.index + 1}"
      Tier = "data"
    }
  )
}

resource "aws_secretsmanager_secret" "aurora" {
  name                    = var.secret_name
  recovery_window_in_days = 0

  tags = merge(
    var.tags,
    {
      Name = var.secret_name
      Tier = "data"
    }
  )
}

resource "aws_secretsmanager_secret_version" "aurora" {
  secret_id = aws_secretsmanager_secret.aurora.id
  secret_string = jsonencode({
    engine   = var.engine
    host     = aws_rds_cluster.this.endpoint
    reader   = aws_rds_cluster.this.reader_endpoint
    port     = var.port
    dbname   = var.database_name
    username = var.master_username
    password = random_password.master_password.result
  })
}
