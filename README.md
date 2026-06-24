# Infra_Proyecto

Repositorio de infraestructura y despliegue para un entorno en AWS con `Terraform`, `Ansible` y `GitHub Actions`. Incluye automatización para `dev` y `prod`, una base mínima de observabilidad y un perímetro público con `CloudFront` y `WAF`.

## Despliegue rápido (recomendado)

La forma más simple y repetible para desplegar en `dev` es usando el workflow de GitHub Actions.

1. Configura las variables en el environment `dev` (Settings → Environments → `dev` → Variables):
   - `AWS_ROLE_ARN`
   - `TF_STATE_BUCKET`
   - `TF_LOCK_TABLE`
   - `ANSIBLE_AWS_SSM_BUCKET_NAME`
   - `AWS_REGION` (opcional, default: `us-east-1`)
2. Ejecuta el workflow: Actions → `Deploy Dev` → Run workflow (branch `develop`).
3. Validación:
   - El workflow valida el stack al final con un health check.
   - Health check esperado: `https://<cloudfront_domain>/api/healthz` (HTTP 200).
   - Para validación end-to-end adicional, puedes ejecutar `ansible/playbooks/validate_deployment.yml`.

Para más detalle de despliegue manual y outputs, ver [DEPLOY.md](file:///Users/dmedinasix/Desktop/Infra_Proyecto/api-sistema-cotizacion/DEPLOY.md).

## Qué resuelve

- aprovisionamiento de infraestructura en AWS con `Terraform`
- bootstrap y despliegue de aplicación con `Ansible`
- validación continua con `GitHub Actions`
- observabilidad base con `CloudWatch` y `SNS`
- exposición segura en `dev` con `CloudFront` y `WAF`

## Prerrequisitos

- `Terraform >= 1.0`
- `Ansible >= 2.10`
- `AWS CLI`
- `Git`
- credenciales AWS válidas o acceso por `OIDC`
- backend remoto de Terraform:
  - bucket `S3`
  - tabla `DynamoDB`

### Nota para macOS (Ansible/SSM)

En macOS pueden aparecer problemas al ejecutar Ansible con conexión `amazon.aws.aws_ssm` (dependencias del Session Manager Plugin y compatibilidad del entorno).

Recomendación práctica para evitar bloqueos: ejecutar Ansible desde un entorno Linux como GitHub Codespaces.

## Variables mínimas

Antes de desplegar, define o revisa:

```bash
export AWS_REGION="us-east-1"
export TF_STATE_BUCKET="tu-bucket-de-tfstate"
export TF_LOCK_TABLE="tu-tabla-de-locks"
```

También revisa:

- `terraform/environments/dev/dev.tfvars`
- `terraform/environments/prod/prod.tfvars`

Variables importantes:

- `app_bucket_name`
- `database_mode`
- `external_aurora_cluster_identifier`
- `external_aurora_secret_name`
- `enable_test_instance`
- `enable_perimeter`
- `perimeter_custom_domain_name`
- `perimeter_route53_zone_id`
- `observability_sns_email_endpoint`

## Despliegue manual en `dev` (Codespaces recomendado)

### 1. Abrir en Codespaces

Desde GitHub: Code → Codespaces → Create codespace on `develop`.

### 2. Inicializar Terraform

```bash
cd terraform/environments/dev
terraform init -backend-config=backend.hcl
```

Opcionalmente, puedes pasar los valores del backend mediante variables de entorno en CI/CD:

```bash
terraform init \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=dev/terraform.tfstate" \
  -backend-config="region=$AWS_REGION" \
  -backend-config="dynamodb_table=$TF_LOCK_TABLE" \
  -backend-config="encrypt=true"
```

### 3. Validar y planificar

```bash
terraform fmt -check
terraform validate
terraform plan -var-file="dev.tfvars"
```

### 4. Aplicar infraestructura

```bash
terraform apply -var-file="dev.tfvars"
```

### 5. Instalar dependencias de Ansible

```bash
ansible-galaxy collection install -r ansible/requirements.yml
```

### 6. Ejecutar bootstrap y despliegue

```bash
export AWS_REGION="us-east-1"
ansible-playbook \
  -i ansible/inventory/aws_ec2.yml \
  ansible/playbooks/bootstrap.yml \
  -e target_hosts=deploy_dev

ansible-playbook \
  -i ansible/inventory/aws_ec2.yml \
  ansible/playbooks/deploy_backend.yml \
  -e target_hosts=deploy_dev \
  -e backend_aurora_secret_name="$(cd terraform/environments/dev && terraform output -raw aurora_secret_name)" \
  -e backend_s3_bucket_name="$(cd terraform/environments/dev && terraform output -raw storage_bucket_name)" \
  -e backend_cloudfront_url="https://$(cd terraform/environments/dev && terraform output -raw cloudfront_distribution_domain_name)" \
  -e backend_aws_region="${AWS_REGION}" \
  -e backend_cognito_user_pool_id="$(cd terraform/environments/dev && terraform output -raw cognito_user_pool_id)" \
  -e backend_cognito_client_id="$(cd terraform/environments/dev && terraform output -raw cognito_client_id)"

ansible-playbook \
  ansible/playbooks/deploy_frontend.yml \
  -e frontend_cloudfront_domain="$(cd terraform/environments/dev && terraform output -raw cloudfront_distribution_domain_name)" \
  -e frontend_cloudfront_distribution_id="$(cd terraform/environments/dev && terraform output -raw cloudfront_distribution_id)" \
  -e frontend_s3_bucket="$(cd terraform/environments/dev && terraform output -raw storage_bucket_name)" \
  -e frontend_aws_region="${AWS_REGION}" \
  -e frontend_cognito_user_pool_id="$(cd terraform/environments/dev && terraform output -raw cognito_user_pool_id)" \
  -e frontend_cognito_client_id="$(cd terraform/environments/dev && terraform output -raw cognito_client_id)"

ansible-playbook \
  ansible/playbooks/validate_deployment.yml \
  -e cloudfront_domain="$(cd terraform/environments/dev && terraform output -raw cloudfront_distribution_domain_name)"
```

### 7. Validar aplicación

```bash
curl -f "https://$(cd terraform/environments/dev && terraform output -raw cloudfront_distribution_domain_name)/api/healthz"
```

### 8. Destruir `dev` si ya no lo necesitas

```bash
cd terraform/environments/dev
terraform destroy -var-file="dev.tfvars"
```

## CI/CD

El repositorio usa tres workflows principales:

- `.github/workflows/ci.yml`: valida `fmt`, `init`, `validate` y `plan` en `dev`
- `.github/workflows/deploy_dev.yml`: despliega infraestructura y app en `dev`
- `.github/workflows/deploy_prod.yml`: despliega infraestructura en `prod` y la app cuando hay hosts administrados por `SSM`

Variables relevantes en GitHub:

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `TF_STATE_BUCKET`
- `TF_LOCK_TABLE`
- `ANSIBLE_AWS_SSM_BUCKET_NAME`

Permisos mínimos:

- `id-token: write`
- `contents: read`

## Observabilidad y perímetro

El proyecto ya contempla una base operativa para:

- `CloudWatch Logs`
- alarmas de CPU para `Aurora` y, en `dev`, también para `EC2`
- notificaciones con `SNS`
- publicación HTTPS con `CloudFront`
- protección básica con `WAF`

En `prod`, el despliegue de aplicación sigue condicionado a que existan hosts administrados por `SSM`.

## Estrategia de ramas

- `main`: producción
- `develop`: integración
- `feat/*`: funcionalidades
- `fix/*`: correcciones
- `docs/*`: documentación
- `ci/*`: cambios de pipeline
- `infra/*`: cambios de infraestructura

Flujo recomendado:

```bash
git checkout develop
git pull origin develop
git checkout -b feat/nombre-del-cambio
git add .
git commit -m "feat: agrega modulo de networking"
git push origin feat/nombre-del-cambio
```

No trabajes directamente sobre `main`; parte siempre desde una `develop` actualizada.
