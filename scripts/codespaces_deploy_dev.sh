#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT_DIR}/terraform/environments/dev"

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Error: falta el comando requerido '${command_name}'."
    exit 1
  fi
}

require_env() {
  local variable_name="$1"
  if [[ -z "${!variable_name:-}" ]]; then
    echo "Error: la variable ${variable_name} no esta definida."
    exit 1
  fi
}

echo "Validando herramientas..."
require_command terraform
require_command aws
require_command ansible-playbook

echo "Validando variables de entorno..."
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-${AWS_REGION}}"
require_env TF_STATE_BUCKET
require_env TF_LOCK_TABLE
require_env ANSIBLE_AWS_SSM_BUCKET_NAME

echo "Validando credenciales AWS..."
aws sts get-caller-identity >/dev/null

echo "Inicializando Terraform..."
terraform -chdir="${TF_DIR}" init -reconfigure \
  -backend-config="bucket=${TF_STATE_BUCKET}" \
  -backend-config="key=dev/terraform.tfstate" \
  -backend-config="region=${AWS_REGION}" \
  -backend-config="dynamodb_table=${TF_LOCK_TABLE}" \
  -backend-config="encrypt=true"

echo "Validando Terraform..."
terraform -chdir="${TF_DIR}" validate

echo "Aplicando infraestructura dev..."
terraform -chdir="${TF_DIR}" apply -input=false -auto-approve -var-file="dev.tfvars"

echo "Resolviendo outputs de Terraform..."
AURORA_SECRET_NAME="$(terraform -chdir="${TF_DIR}" output -raw aurora_secret_name)"
S3_BUCKET_NAME="$(terraform -chdir="${TF_DIR}" output -raw storage_bucket_name)"
CLOUDFRONT_DOMAIN="$(terraform -chdir="${TF_DIR}" output -raw cloudfront_distribution_domain_name)"
CLOUDFRONT_DISTRIBUTION_ID="$(terraform -chdir="${TF_DIR}" output -raw cloudfront_distribution_id)"
COGNITO_USER_POOL_ID="$(terraform -chdir="${TF_DIR}" output -raw cognito_user_pool_id)"
COGNITO_CLIENT_ID="$(terraform -chdir="${TF_DIR}" output -raw cognito_client_id)"

echo "Instalando colecciones de Ansible..."
ansible-galaxy collection install -r "${ROOT_DIR}/ansible/requirements.yml"

echo "Ejecutando bootstrap..."
ansible-playbook \
  -i "${ROOT_DIR}/ansible/inventory/aws_ec2.yml" \
  "${ROOT_DIR}/ansible/playbooks/bootstrap.yml" \
  -e target_hosts=deploy_dev

echo "Desplegando backend..."
ansible-playbook \
  -i "${ROOT_DIR}/ansible/inventory/aws_ec2.yml" \
  "${ROOT_DIR}/ansible/playbooks/deploy_backend.yml" \
  -e target_hosts=deploy_dev \
  -e backend_aurora_secret_name="${AURORA_SECRET_NAME}" \
  -e backend_s3_bucket_name="${S3_BUCKET_NAME}" \
  -e backend_cloudfront_url="https://${CLOUDFRONT_DOMAIN}" \
  -e backend_aws_region="${AWS_REGION}" \
  -e backend_cognito_user_pool_id="${COGNITO_USER_POOL_ID}" \
  -e backend_cognito_client_id="${COGNITO_CLIENT_ID}"

echo "Desplegando frontend..."
ansible-playbook \
  "${ROOT_DIR}/ansible/playbooks/deploy_frontend.yml" \
  -e frontend_cloudfront_domain="${CLOUDFRONT_DOMAIN}" \
  -e frontend_cloudfront_distribution_id="${CLOUDFRONT_DISTRIBUTION_ID}" \
  -e frontend_s3_bucket="${S3_BUCKET_NAME}" \
  -e frontend_aws_region="${AWS_REGION}" \
  -e frontend_cognito_user_pool_id="${COGNITO_USER_POOL_ID}" \
  -e frontend_cognito_client_id="${COGNITO_CLIENT_ID}"

echo "Validando despliegue..."
ansible-playbook \
  "${ROOT_DIR}/ansible/playbooks/validate_deployment.yml" \
  -e cloudfront_domain="${CLOUDFRONT_DOMAIN}"

echo "Despliegue completado correctamente."
echo "Health check: https://${CLOUDFRONT_DOMAIN}/api/healthz"
