# Infra_Proyecto

Guía operativa para desplegar el entorno `dev` usando `Terraform` y `Ansible` (flujo recomendado en GitHub Codespaces).

## Qué incluye DEV

- Red: VPC, subnets públicas/privadas, IGW, NAT (single), rutas
- Entrada: ALB + Target Group
- API: API Gateway (HTTP API) + VPC Link
- Perímetro: CloudFront + WAF
- Compute: Auto Scaling Group (privado) + instancia de prueba (privada) para fase 4
- Datos: Aurora (gestionada por Terraform), Redis (ElastiCache)
- Storage: S3 (assets/artefactos) + lifecycle hacia Glacier
- Observabilidad: CloudWatch log groups + alarmas + SNS
- Auditoría/Compliance: CloudTrail + AWS Config (logs cifrados en S3 con KMS)

## Auditoría / Compliance (CloudTrail + AWS Config)

El entorno `dev` incluye una capa de auditoría:
- CloudTrail (multi-region) para eventos de gestión y eventos globales
- AWS Config (configuration recorder + delivery channel)
- Logs en S3 cifrados con KMS (bucket dedicado de auditoría)

Outputs relevantes (Terraform):
- `audit_log_bucket_name`
- `cloudtrail_trail_arn`
- `aws_config_recorder_name`

## Base de datos (Aurora gestionada por Terraform)

En `dev` Aurora se crea dentro del stack (no depende de clúster/secreto externos).

Outputs relevantes (Terraform):
- `aurora_endpoint`
- `aurora_secret_name`

## Cómo desplegar DEV (Codespaces)

### Prerrequisitos

- Terraform `1.9.8` (o compatible con el repo)
- AWS CLI
- Credenciales AWS válidas en el Codespace (método autorizado por tu equipo)
- Backend remoto de Terraform (S3 + DynamoDB):
  - `TF_STATE_BUCKET`
  - `TF_LOCK_TABLE`
- Variables para Ansible (SSM):
  - `ANSIBLE_AWS_SSM_BUCKET_NAME` (usa el bucket de app de Terraform: `storage_bucket_name`)

```bash
export AWS_REGION="us-east-1"
export AWS_DEFAULT_REGION="us-east-1"
export TF_STATE_BUCKET="infra-proyecto-tfstate-darli963"
export TF_LOCK_TABLE="infra-proyecto-tf-locks"
```

Verifica acceso a AWS:

```bash
aws sts get-caller-identity
```

### Ejecución (script)

```bash
bash scripts/codespaces_deploy_dev.sh
```

El script aplica Terraform y ejecuta playbooks Ansible para bootstrap, backend, frontend y validación.

### Validación

Formato esperado del health check:

```bash
https://<cloudfront_domain>/api/healthz
```

También puedes validarlo manualmente:

```bash
curl -f "https://<cloudfront_domain>/api/healthz"
```

## Despliegue DEV (manual, sin script)

Terraform:

```bash
terraform fmt -check -recursive terraform

terraform -chdir=terraform/environments/dev init -reconfigure \
  -backend-config="bucket=${TF_STATE_BUCKET}" \
  -backend-config="key=dev/terraform.tfstate" \
  -backend-config="region=${AWS_REGION}" \
  -backend-config="dynamodb_table=${TF_LOCK_TABLE}" \
  -backend-config="encrypt=true"

terraform -chdir=terraform/environments/dev validate
terraform -chdir=terraform/environments/dev apply -input=false -auto-approve -var-file="dev.tfvars"
```

Ansible (instala colecciones y ejecuta playbooks):

```bash
ansible-galaxy collection install -r ansible/requirements.yml

export ANSIBLE_AWS_SSM_BUCKET_NAME="$(terraform -chdir=terraform/environments/dev output -raw storage_bucket_name)"

ansible-playbook -i ansible/inventory/aws_ec2.yml ansible/playbooks/bootstrap.yml -e target_hosts=deploy_dev
ansible-playbook -i ansible/inventory/aws_ec2.yml ansible/playbooks/deploy_backend.yml -e target_hosts=deploy_dev
ansible-playbook ansible/playbooks/deploy_frontend.yml
ansible-playbook ansible/playbooks/validate_deployment.yml
```

## CI/CD (GitHub Actions)

El workflow [deploy_dev.yml](file:///Users/dmedinasix/Desktop/Infra_Proyecto/.github/workflows/deploy_dev.yml) aplica Terraform y despliega la app con Ansible.

Requiere variables en GitHub Actions environment `dev`:
- `AWS_ROLE_ARN`
- `TF_STATE_BUCKET`
- `TF_LOCK_TABLE`
- `AWS_REGION` (opcional; default `us-east-1`)

## Troubleshooting

- `terraform init` falla por backend: valida `TF_STATE_BUCKET` y `TF_LOCK_TABLE`.
- Outputs no encontrados en deploy: ejecuta `terraform output -json` y verifica que existan `storage_bucket_name` y `cloudfront_distribution_domain_name`.
- Fallos de Ansible en SSM: valida que la instancia esté `Online` en Session Manager y que el rol EC2 tenga `AmazonSSMManagedInstanceCore`.

## Referencia

Si necesitas detalle de outputs o despliegue manual extendido, revisa [DEPLOY.md](file:///Users/dmedinasix/Desktop/Infra_Proyecto/api-sistema-cotizacion/DEPLOY.md).
