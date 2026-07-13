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

cat <<'EOF' > grafana/provisioning/dashboards/main-dashboard.json
${grafana_dashboard_json}
EOF

# Levantar el stack docker-compose
docker compose up -d
