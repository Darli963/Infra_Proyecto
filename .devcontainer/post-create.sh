#!/usr/bin/env bash
set -euo pipefail

echo "Instalando dependencias para Ansible..."
python3 -m pip install --upgrade pip
python3 -m pip install ansible "boto3>=1.35.0" "botocore>=1.35.0"

echo "Instalando colecciones de Ansible..."
ansible-galaxy collection install -r ansible/requirements.yml

echo "Instalando Session Manager Plugin..."
curl -fsSL "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o /tmp/session-manager-plugin.deb
sudo dpkg -i /tmp/session-manager-plugin.deb

echo "Validando herramientas instaladas..."
terraform version
aws --version
ansible --version
session-manager-plugin --version

echo "Entorno de Codespaces listo."
