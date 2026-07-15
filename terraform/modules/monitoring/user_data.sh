#!/bin/bash
set -euxo pipefail

# Actualizar dnf
dnf update -y

# Instalar docker
dnf install -y docker jq

# Iniciar y habilitar el servicio de docker
systemctl start docker
systemctl enable docker

# Instalar docker-compose v2 como plugin
mkdir -p /usr/libexec/docker/cli-plugins/
curl -SL "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# Directorio de trabajo
mkdir -p /opt/monitoring
cd /opt/monitoring

# Obtener la contrasena de Grafana desde Secrets Manager
SECRET_VAL=$(aws secretsmanager get-secret-value --secret-id "${grafana_secret_name}" --region "${aws_region}" --query SecretString --output text)
if echo "$SECRET_VAL" | jq -e . >/dev/null 2>&1; then
  GF_SECURITY_ADMIN_PASSWORD=$(echo "$SECRET_VAL" | jq -r '.admin_password // .password // .')
else
  GF_SECURITY_ADMIN_PASSWORD="$SECRET_VAL"
fi

# Guardar la contrasena en el archivo .env para docker-compose
echo "GF_SECURITY_ADMIN_PASSWORD=$GF_SECURITY_ADMIN_PASSWORD" > /opt/monitoring/.env
chmod 600 /opt/monitoring/.env
export GF_SECURITY_ADMIN_PASSWORD

# Crear estructura de carpetas
mkdir -p prometheus loki alloy grafana/provisioning/datasources grafana/provisioning/dashboards

# Escribir archivos de configuracion
cat <<'EOF' > docker-compose.yml
${docker_compose_content}
EOF

cat <<'EOF' > prometheus/prometheus.yml
${prometheus_content}
EOF

cat <<'EOF' > loki/loki-config.yml
${loki_content}
EOF

cat <<'EOF' > alloy/config.alloy
${alloy_content}
EOF

cat <<'EOF' > grafana/provisioning/datasources/datasources.yml
${grafana_datasources}
EOF

cat <<'EOF' > grafana/provisioning/dashboards/dashboards.yml
${grafana_dashboards}
EOF

# Decompress main-dashboard.json
echo "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" | base64 -di | gunzip > grafana/provisioning/dashboards/main-dashboard.json

# Replace placeholders with evaluated template variables
sed -i "s/__ALB__/${alb_arn_suffix}/g" grafana/provisioning/dashboards/main-dashboard.json
sed -i "s/__AURORA__/${aurora_cluster_id}/g" grafana/provisioning/dashboards/main-dashboard.json
sed -i "s/__REGION__/${aws_region}/g" grafana/provisioning/dashboards/main-dashboard.json

# Levantar el stack docker-compose
docker compose up -d
