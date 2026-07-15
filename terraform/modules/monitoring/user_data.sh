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
sed -i "s#__ALB__#${alb_arn_suffix}#g" grafana/provisioning/dashboards/main-dashboard.json
sed -i "s#__AURORA__#${aurora_cluster_id}#g" grafana/provisioning/dashboards/main-dashboard.json
sed -i "s#__REGION__#${aws_region}#g" grafana/provisioning/dashboards/main-dashboard.json

# Levantar el stack docker-compose
docker compose up -d
