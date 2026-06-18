# Runbook Fase 4

## Objetivo

Validar que una sola `EC2` privada puede:

- arrancar correctamente
- administrarse por `Session Manager`
- ejecutar `Node.js`
- leer secretos desde `Secrets Manager`
- conectarse a `Aurora PostgreSQL`
- responder localmente dentro de la instancia

## Supuesto de Ruta A

La Fase 4 en `dev` usa `database_mode = "express"`.

- `Terraform` no crea un cluster Aurora estandar en este flujo
- el entorno consume un `Aurora Express` ya existente
- el secreto de base de datos se resuelve por `data.aws_secretsmanager_secret`
- la smoke app usa `IAM auth` contra PostgreSQL

## Desplegar infraestructura

```bash
cd terraform/environments/dev
terraform init
terraform apply -var-file="dev.tfvars"
```

Si todo esta alineado con el entorno real de `Ruta A`, el resultado esperado es:

```bash
Apply complete! Resources: X added, Y changed, Z destroyed.
```

En una segunda ejecucion (o con `terraform plan`) ya no deberias ver cambios inesperados.

## Obtener datos operativos

```bash
terraform output test_instance_id
terraform output test_instance_private_ip
terraform output test_instance_ssm_start_session_command
terraform output aurora_cluster_id
terraform output aurora_secret_name
```

## Entrar por Session Manager

```bash
aws ssm start-session --region us-east-1 --target "$(terraform output -raw test_instance_id)"
```

## Validaciones manuales minimas

Desde tu maquina local, copia el valor del secreto:

```bash
terraform output -raw aurora_secret_name
```

Dentro de la instancia:

```bash
node -v
which phase4-fetch-secret
phase4-fetch-secret us-east-1 "<nombre-del-secreto-de-aurora>"
```

## Bootstrap con Ansible

Desde tu maquina local:

```bash
export AWS_REGION=us-east-1
ansible-playbook -i ansible/inventory/aws_ec2.yml ansible/playbooks/bootstrap.yml
```

El `bootstrap.yml` instala paquetes base, prepara la estructura del servidor, asegura `amazon-ssm-agent`, instala Node.js y deja listo el rol de monitoreo si luego se activa `phase4_monitoring_enabled=true`.

## Desplegar la smoke app de validacion

```bash
export AWS_REGION=us-east-1
ansible-playbook \
  -i ansible/inventory/aws_ec2.yml \
  ansible/playbooks/deploy_app.yml \
  -e phase4_aurora_secret_name="$(cd terraform/environments/dev && terraform output -raw aurora_secret_name)"
```

El `deploy_app.yml` copia el artefacto, recrea el release activo, escribe el `.env`, instala dependencias, actualiza el servicio `systemd` y valida `http://127.0.0.1:3000/healthz` al terminar.

Si no tienes `ansible-playbook` instalado localmente, puedes validar la instancia con `aws ssm send-command` ejecutando los mismos chequeos de `node`, servicio y `curl` desde `Systems Manager`.

## Validar respuesta local

Dentro de la instancia:

```bash
curl http://127.0.0.1:3000/healthz
curl http://127.0.0.1:3000/db-check
sudo systemctl status phase4-smoke-app --no-pager
```

La respuesta esperada en `Ruta A` para `/db-check` incluye:

```json
{
  "status": "ok",
  "database": {
    "ok": true,
    "database": "postgres",
    "engine": "aurora-postgresql",
    "authType": "iam"
  }
}
```

## Criterio de aceptacion

La Fase 4 se considera validada cuando:

- `terraform apply` crea la `EC2` sin errores
- la instancia aparece como administrada en `Systems Manager`
- `node -v` responde dentro de la instancia
- `curl http://127.0.0.1:3000/healthz` responde `200`
- `curl http://127.0.0.1:3000/db-check` confirma conexion a `Aurora PostgreSQL` con `IAM auth`
- `terraform plan -var-file="dev.tfvars"` no propone cambios inesperados

## Regla de oro

No avances a `ALB`, `Auto Scaling`, `CloudFront` ni `WAF` hasta que esta instancia privada de prueba quede estable y validada.
