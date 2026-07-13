resource "random_password" "auth_token" {
  count            = var.enabled ? 1 : 0
  length           = 32
  special          = false
  override_special = ""
}

resource "aws_elasticache_subnet_group" "this" {
  count       = var.enabled ? 1 : 0
  name        = "${var.name}-redis-subnet-group"
  subnet_ids  = var.private_subnet_ids
  description = "Subnet group privado para Redis"
}

resource "aws_elasticache_replication_group" "this" {
  count                      = var.enabled ? 1 : 0
  replication_group_id       = "${var.name}-redis"
  description                = "Redis opcional para la aplicacion"
  engine                     = "redis"
  engine_version             = var.engine_version
  node_type                  = var.node_type
  port                       = var.port
  num_cache_clusters         = var.num_cache_clusters
  subnet_group_name          = aws_elasticache_subnet_group.this[0].name
  security_group_ids         = [var.redis_security_group_id]
  automatic_failover_enabled = var.num_cache_clusters > 1
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.auth_token[0].result

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-redis"
      Tier = "cache"
    }
  )
}

resource "aws_secretsmanager_secret" "redis" {
  count                   = var.enabled && var.secret_name != null ? 1 : 0
  name                    = var.secret_name
  recovery_window_in_days = 0

  tags = merge(
    var.tags,
    {
      Name = var.secret_name
      Tier = "cache"
    }
  )
}

resource "aws_secretsmanager_secret_version" "redis" {
  count     = var.enabled && var.secret_name != null ? 1 : 0
  secret_id = aws_secretsmanager_secret.redis[0].id
  secret_string = jsonencode({
    engine    = "redis"
    host      = aws_elasticache_replication_group.this[0].primary_endpoint_address
    reader    = aws_elasticache_replication_group.this[0].reader_endpoint_address
    port      = var.port
    authToken = random_password.auth_token[0].result
  })
}
