# Changelog

## [2026-07-09] Fix: nombres únicos globalmente + variables de Ansible

### Problema encontrado

- `terraform plan` salió limpio, pero el `apply` real falló porque el bucket
  S3 de storage y el dominio de Cognito no eran únicos globalmente
  (colisionaban con otro recurso/cuenta existente).

### Cambios en Terraform

- Nueva variable opcional `cognito_domain_suffix` en el módulo `auth`
  (retrocompatible, `default = null`). Cuando se define, el domain prefix
  de Cognito se construye como `<project>-<env>-<suffix>`.
- `dev.tfvars` actualizado: bucket S3 y dominio Cognito ahora usan el
  Account ID (`138576548748`) como sufijo, mismo patrón que el bucket de
  Terraform state (`infra-proyecto-tfstate-darli963-138576548748`).

  | Recurso | Antes | Después |
  |---------|-------|---------|
  | Bucket S3 storage | `infra-proyecto-dev-storage-phase3-example` | `infra-proyecto-dev-storage-138576548748` |
  | Cognito domain | `infra-proyecto-dev` | `infra-proyecto-dev-138576548748` |

- Archivos modificados:
  - `terraform/modules/auth/main.tf`
  - `terraform/modules/auth/variables.tf`
  - `terraform/environments/dev/main.tf`
  - `terraform/environments/dev/variables.tf`
  - `terraform/environments/dev/dev.tfvars`

### Cambios en Ansible

- `ansible/inventory/group_vars/deploy_dev.yml` actualizado con outputs
  reales del `terraform apply` del 2026-07-09 (Aurora secret, bucket S3,
  CloudFront URL, Cognito User Pool ID y Client ID). Las variables que
  estaban comentadas con placeholders ahora tienen valores reales.
  Se añadieron también las variables `frontend_*` que `deploy_frontend.yml`
  requiere para no tener que pasarlas por `-e` en cada ejecución.
- Corregido bug en `ansible/roles/backend/tasks/main.yml`: la llamada al
  script `phase4-fetch-secret` solo pasaba 1 argumento (`<secret-name>`)
  pero el script espera 2 (`<region> <secret-name>`). Se corrigió usando
  `{{ backend_aws_region | default('us-east-1') }}` como primer argumento.

### Validación realizada

- `terraform apply` completo ejecutado con éxito: 97 recursos creados,
  0 errores en el apply final.
- Infraestructura destruida (96 recursos) después de validar, para no
  seguir generando costos.

### Nota sobre destroy con buckets versionados

Al destruir, el bucket de auditoría (`infra-proyecto-dev-audit-138576548748`)
falló en el primer intento con `BucketNotEmpty` porque CloudTrail había
escrito logs (54 versiones de objetos con versionado habilitado) durante el
tiempo activo. `force_destroy = false` es intencional para proteger los
logs en producción.

**Si esto vuelve a ocurrir**, vaciar manualmente antes de reintentar el
destroy:

```powershell
# Exportar credenciales primero
(aws configure export-credentials --profile develpOA --format powershell) | Invoke-Expression
$env:AWS_REGION = "us-east-1"

$bucket = "infra-proyecto-dev-audit-138576548748"

# Eliminar versiones
$versions = aws s3api list-object-versions --bucket $bucket `
  --query 'Versions[].{Key:Key,VersionId:VersionId}' `
  --output json | ConvertFrom-Json
foreach ($v in $versions) {
    aws s3api delete-object --bucket $bucket --key $v.Key --version-id $v.VersionId | Out-Null
}

# Eliminar delete markers
$markers = aws s3api list-object-versions --bucket $bucket `
  --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' `
  --output json | ConvertFrom-Json
foreach ($m in $markers) {
    aws s3api delete-object --bucket $bucket --key $m.Key --version-id $m.VersionId | Out-Null
}

# Reintentar el destroy
terraform -chdir=terraform/environments/dev destroy -no-color -var-file="dev.tfvars" -auto-approve
```

### Próximos pasos pendientes para el despliegue completo

1. Compilar el backend localmente antes de correr `deploy_backend.yml`:
   ```bash
   cd api-sistema-cotizacion/backend
   npm install
   npm run build
   ```

2. Instalar las colecciones de Ansible (una sola vez):
   ```bash
   ansible-galaxy collection install -r ansible/requirements.yml
   ```

3. Instalar el **AWS Session Manager plugin** en la máquina local —
   requerido para que Ansible se conecte a la instancia EC2 vía SSM sin
   SSH directo.
   Descarga: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

4. Levantar la infraestructura de nuevo:
   ```powershell
   (aws configure export-credentials --profile develpOA --format powershell) | Invoke-Expression
   $env:AWS_REGION = "us-east-1"; $env:AWS_DEFAULT_REGION = "us-east-1"
   $env:TF_STATE_BUCKET = "infra-proyecto-tfstate-darli963-138576548748"
   $env:TF_LOCK_TABLE = "infra-proyecto-tf-locks"
   terraform -chdir=terraform/environments/dev apply -no-color -var-file="dev.tfvars" -auto-approve
   ```

5. Correr los playbooks en orden:
   ```bash
   # 1. Inicializar servidor (Node.js + CloudWatch Agent + paquetes base)
   ansible-playbook -i ansible/inventory/aws_ec2.yml ansible/playbooks/bootstrap.yml \
     -e target_hosts=deploy_dev

   # 2. Desplegar smoke-app de fase 4 (valida respuesta en :3000)
   ansible-playbook -i ansible/inventory/aws_ec2.yml ansible/playbooks/deploy_app.yml \
     -e target_hosts=deploy_dev \
     -e phase4_aurora_secret_name=infra-proyecto/dev/aurora

   # 3. Desplegar backend real (cotizacion-app + Prisma migrations)
   ansible-playbook -i ansible/inventory/aws_ec2.yml ansible/playbooks/deploy_backend.yml

   # 4. Desplegar frontend al bucket S3 + invalidar CloudFront
   ansible-playbook -i ansible/inventory/aws_ec2.yml ansible/playbooks/deploy_frontend.yml

   # 5. Validación end-to-end vía CloudFront
   ansible-playbook -i ansible/inventory/aws_ec2.yml ansible/playbooks/validate_deployment.yml \
     -e cloudfront_domain=dv6xa36yi5uz2.cloudfront.net
   ```
   > **Nota:** el dominio de CloudFront cambia en cada nuevo `apply`.
   > Obtenerlo con: `terraform -chdir=terraform/environments/dev output -raw perimeter_cloudfront_domain_name`

6. (Opcional) Para reducir costos en dev, cambiar en `dev.tfvars`:
   ```hcl
   single_nat_gateway = true  # ahorra ~$32/mes vs 2 NAT GWs
   ```
