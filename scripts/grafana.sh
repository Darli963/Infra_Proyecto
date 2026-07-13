#!/usr/bin/env bash
set -euo pipefail

# Obtener rutas absolutas
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$SCRIPT_DIR/../terraform/environments/dev"

# Verificar que session-manager-plugin esté instalado
if ! which session-manager-plugin &>/dev/null; then
  echo "Error: session-manager-plugin no está instalado."
  echo "Para instalarlo en macOS ejecute:"
  echo "  brew install --cask session-manager-plugin"
  exit 1
fi

# Leer outputs de Terraform
echo "Leyendo información del entorno desde Terraform..."
if [ ! -d "$TF_DIR" ]; then
  echo "Error: Directorio de Terraform no encontrado en $TF_DIR"
  exit 1
fi

instance_id=$(terraform -chdir="$TF_DIR" output -raw monitoring_instance_id 2>/dev/null || echo "")
secret_name=$(terraform -chdir="$TF_DIR" output -raw grafana_secret_name 2>/dev/null || echo "")

if [ -z "$instance_id" ] || [ "$instance_id" = "null" ]; then
  echo "Error: No se pudo obtener 'monitoring_instance_id' desde Terraform."
  exit 1
fi

if [ -z "$secret_name" ] || [ "$secret_name" = "null" ]; then
  echo "Error: No se pudo obtener 'grafana_secret_name' desde Terraform."
  exit 1
fi

# Verificar si la instancia está Online en SSM
echo "Verificando el estado de la instancia $instance_id en SSM..."
ping_status=$(aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=$instance_id" \
  --query 'InstanceInformationList[0].PingStatus' \
  --output text 2>/dev/null || echo "")

if [ "$ping_status" != "Online" ]; then
  echo "Error: La instancia $instance_id no está Online en SSM (Estado actual: ${ping_status:-Desconocido})."
  exit 1
fi
echo "Instancia está Online en SSM."

# Obtener la contraseña desde Secrets Manager
echo "Obteniendo la contraseña de Grafana desde Secrets Manager..."
secret_val=$(aws secretsmanager get-secret-value --secret-id "$secret_name" --query SecretString --output text 2>/dev/null || echo "")
if [ -z "$secret_val" ]; then
  echo "Error: No se pudo obtener el secreto $secret_name desde Secrets Manager."
  exit 1
fi

# Parsear contraseña si está en formato JSON o texto plano
if echo "$secret_val" | jq -e . &>/dev/null; then
  password=$(echo "$secret_val" | jq -r '.admin_password // .password // .')
else
  password="$secret_val"
fi

# Configurar el puerto basado en el argumento
SERVICE="${1:-grafana}"
PORT=3000

case "$SERVICE" in
  grafana)
    PORT=3000
    ;;
  prometheus)
    PORT=9090
    ;;
  loki)
    PORT=3100
    ;;
  *)
    if [[ "$SERVICE" =~ ^[0-9]+$ ]]; then
      PORT="$SERVICE"
      SERVICE="custom"
    else
      echo "Error: Servicio '$SERVICE' no reconocido."
      echo "Uso: $0 [grafana|prometheus|loki|puerto_num]"
      exit 1
    fi
    ;;
esac

echo "=============================================="
echo "Servicio seleccionado: $SERVICE"
if [ "$SERVICE" = "grafana" ]; then
  echo "Credenciales de acceso a Grafana:"
  echo "  Usuario:    admin"
  echo "  Contraseña: $password"
fi
echo "=============================================="
echo "Abriendo túnel SSM hacia el puerto $PORT..."
echo "Accede a: http://localhost:$PORT"
echo "Presione Ctrl+C para cerrar el túnel y terminar la sesión."

# Iniciar túnel en background
aws ssm start-session --target "$instance_id" \
  --document-name AWS-StartPortForwardingSession \
  --parameters "{\"portNumber\":[\"$PORT\"],\"localPortNumber\":[\"$PORT\"]}" &

TUNNEL_PID=$!

# Limpieza limpia al recibir señales
cleanup() {
  echo -e "\nCerrando el túnel SSM y terminando procesos..."
  if kill -0 "$TUNNEL_PID" 2>/dev/null; then
    kill "$TUNNEL_PID"
    wait "$TUNNEL_PID" 2>/dev/null
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM

wait "$TUNNEL_PID" 2>/dev/null
