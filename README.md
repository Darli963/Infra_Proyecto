# Infra_Proyecto

Guía operativa para desplegar el entorno `dev` usando `Terraform` y `Ansible`.

## Flujo de despliegue

El flujo soportado para este repositorio es:

1. Abrir el repositorio en GitHub Codespaces.
2. Configurar credenciales AWS en el Codespace.
3. Exportar variables requeridas.
4. Ejecutar el script `scripts/codespaces_deploy_dev.sh`.
5. Validar el endpoint publicado en CloudFront.

## Entorno de ejecución

Usa GitHub Codespaces.

Este repositorio incluye `.devcontainer/` para preparar automáticamente:
- `Terraform`
- `AWS CLI`
- `Ansible`
- colecciones de `ansible/requirements.yml`
- `session-manager-plugin`

## Credenciales y datos requeridos

Hay datos que no deben subirse al repositorio por seguridad. Debes cargarlos en tu entorno antes del despliegue.

Necesitas:
- credenciales AWS válidas en el Codespace
- `AWS_REGION`
- `AWS_DEFAULT_REGION`
- `TF_STATE_BUCKET`
- `TF_LOCK_TABLE`
- `ANSIBLE_AWS_SSM_BUCKET_NAME`

Ejemplo de variables requeridas:

```bash
export AWS_REGION="us-east-1"
export AWS_DEFAULT_REGION="us-east-1"
export TF_STATE_BUCKET="infra-proyecto-tfstate-darli963"
export TF_LOCK_TABLE="infra-proyecto-tf-locks"
export ANSIBLE_AWS_SSM_BUCKET_NAME="infra-proyecto-dev-terraform-state"
```

## Ejecución

### 1. Abrir Codespaces

Abre el repositorio en la rama `develop` usando GitHub Codespaces.

### 2. Configurar credenciales AWS

Configura tus credenciales AWS dentro del Codespace con el método autorizado por tu equipo.

Verifica acceso:

```bash
aws sts get-caller-identity
```

### 3. Exportar variables

Usa las variables necesarias para el despliegue:

```bash
export AWS_REGION="us-east-1"
export AWS_DEFAULT_REGION="us-east-1"
export TF_STATE_BUCKET="infra-proyecto-tfstate-darli963"
export TF_LOCK_TABLE="infra-proyecto-tf-locks"
export ANSIBLE_AWS_SSM_BUCKET_NAME="infra-proyecto-dev-terraform-state"
```

### 4. Ejecutar despliegue

```bash
bash scripts/codespaces_deploy_dev.sh
```

Este script ejecuta:
- `terraform init`
- `terraform validate`
- `terraform apply`
- `ansible/playbooks/bootstrap.yml`
- `ansible/playbooks/deploy_backend.yml`
- `ansible/playbooks/deploy_frontend.yml`
- `ansible/playbooks/validate_deployment.yml`

### 5. Validar despliegue

Al finalizar, el script imprime la URL del health check.

Formato esperado:

```bash
https://<cloudfront_domain>/api/healthz
```

También puedes validarlo manualmente:

```bash
curl -f "https://<cloudfront_domain>/api/healthz"
```

## Referencia

Si necesitas detalle de outputs o despliegue manual extendido, revisa [DEPLOY.md](file:///Users/dmedinasix/Desktop/Infra_Proyecto/api-sistema-cotizacion/DEPLOY.md).
