# Módulos Terraform

Este directorio concentra los módulos reutilizables del repositorio.

Módulos disponibles:

- `networking` - VPC, subnets, route tables, NAT Gateway, Internet Gateway
- `security_base` - Security Groups, NACLs
- `compute` - Instancias EC2, Auto Scaling Groups
- `compute_group` - Grupos de Auto Scaling adicionales
- `database` - Clusters Aurora PostgreSQL, RDS
- `cache` - ElastiCache Redis
- `storage` - Buckets S3, Secrets Manager
- `observability` - CloudWatch, SNS, alarms
- `perimeter` - CloudFront, WAF, ALB
- `edge` - CloudFront distributions adicionales
- `api_gateway` - API Gateway REST APIs
- `auth` - Cognito User Pools, Identity Pools
