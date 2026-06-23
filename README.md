# Infra_Proyecto

Repositorio de infraestructura y despliegue para un entorno en AWS con `Terraform`, `Ansible` y `GitHub Actions`. Incluye automatización para `dev` y `prod`, una base mínima de observabilidad y un perímetro público con `CloudFront` y `WAF`.

## Estructura

```text
.
├── .github/workflows/      # CI/CD con GitHub Actions
├── ansible/                # Bootstrap y despliegue de la app
├── api-sistema-cotizacion/ # Backend y frontend de ejemplo
├── terraform/              # Módulos y ambientes de infraestructura
└── docs/                   # Diagramas y apoyo visual
```

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

## Flujo rápido en `dev`

### 1. Clonar el repositorio

```bash
git clone https://github.com/Darli963/Infra_Proyecto.git
cd Infra_Proyecto
```

### 2. Inicializar Terraform

```bash
cd terraform/environments/dev
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

Si usarás `SSM` localmente, instala también `session-manager-plugin`.

### 6. Ejecutar bootstrap y despliegue

```bash
export AWS_REGION="us-east-1"
ansible-playbook -i ansible/inventory/aws_ec2.yml ansible/playbooks/bootstrap.yml
ansible-playbook \
  -i ansible/inventory/aws_ec2.yml \
  ansible/playbooks/deploy_app.yml \
  -e phase4_aurora_secret_name="$(cd terraform/environments/dev && terraform output -raw aurora_secret_name)"
```

### 7. Validar aplicación

```bash
aws ssm start-session \
  --region us-east-1 \
  --target "$(cd terraform/environments/dev && terraform output -raw test_instance_id)"
```

Dentro de la instancia:

```bash
curl http://127.0.0.1:3000/healthz
curl http://127.0.0.1:3000/db-check
sudo systemctl status phase4-smoke-app --no-pager
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
- `CI_AWS_ROLE_ARN`
- `TF_STATE_BUCKET`
- `TF_LOCK_TABLE`

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
