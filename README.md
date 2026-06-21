# Infra_Proyecto
## Estrategia de ramas

El flujo de trabajo del repositorio se basa en estas ramas:

- `main`: rama estable de producción.
- `develop`: rama de integración para cambios validados.
- `feat/*`: ramas de trabajo para nuevas funcionalidades, mejoras o cambios específicos.

### Regla básica

- No trabajar directamente sobre `main`.
- Los cambios nuevos deben salir desde `develop`.
- Cada tarea debe desarrollarse en una rama `feat/*`.
- Cuando una funcionalidad esté lista, se crea un `Pull Request` hacia `develop`.
- Solo lo que esté probado y estable pasa de `develop` a `main`.

### Clonar el repositorio

```
git clone https://github.com/Darli963/Infra_Proyecto.git
cd Infra_Proyecto
```

### Actualizar la rama `develop`

```
git checkout develop
git pull origin develop
```

### Crear una rama de trabajo

```
git checkout -b feat/nombre-de-la-funcionalidad
```

### Guardar cambios

```
git add .
git commit -m "feat: agrega módulo de networking"
```
feat/ → nuevas funcionalidades

fix/ → corrección de errores

docs/ → documentación

refactor/ → reorganización o mejora del código sin cambiar funcionalidad

chore/ → tareas de mantenimiento

ci/ → cambios en CI/CD

infra/ → cambios de infraestructura

### Subir la rama al remoto

```
git push origin feat/nombre-de-la-funcionalidad
```

### Volver a `develop`

```
git checkout develop
```

## Nota importante

Si vas a iniciar una nueva tarea, asegúrate de partir siempre desde una rama actualizada de `develop`.

---

## Instrucciones de despliegue

### Prerrequisitos

- [Terraform](https://www.terraform.io/downloads) >= 1.0
- [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html) >= 2.10
- AWS CLI configurado con credenciales válidas
- Git

### 1. Clonar el repositorio

```
git clone https://github.com/Darli963/Infra_Proyecto.git
cd Infra_Proyecto
```

### 2. Configurar credenciales AWS

```
aws configure
```

O configurar variables de entorno:

```
export AWS_ACCESS_KEY_ID="tu_access_key"
export AWS_SECRET_ACCESS_KEY="tu_secret_key"
export AWS_DEFAULT_REGION="us-east-1"
```

Además, para trabajar con el backend remoto de Terraform:

```
export AWS_REGION="us-east-1"
export TF_STATE_BUCKET="tu-bucket-de-tfstate"
export TF_LOCK_TABLE="tu-tabla-de-locks"
```

### 3. Inicializar Terraform

Para ambiente de desarrollo:

```
cd terraform/environments/dev
terraform init \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=dev/terraform.tfstate" \
  -backend-config="region=$AWS_REGION" \
  -backend-config="dynamodb_table=$TF_LOCK_TABLE" \
  -backend-config="encrypt=true"
```

Para ambiente de producción:

```
cd terraform/environments/prod
terraform init \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=prod/terraform.tfstate" \
  -backend-config="region=$AWS_REGION" \
  -backend-config="dynamodb_table=$TF_LOCK_TABLE" \
  -backend-config="encrypt=true"
```

### 4. Validar y planificar cambios

```
terraform fmt -check
terraform validate
terraform plan -var-file="dev.tfvars"
```

### 5. Aplicar infraestructura

```
terraform apply -var-file="dev.tfvars"
```

**Importante:** Revisa el plan antes de aplicar cambios en producción

### 6. Instalar dependencias de Ansible

Este repositorio usa colecciones externas para inventario dinámico y conexión por `SSM`:

```bash
ansible-galaxy collection install -r ansible/requirements.yml
```

Si vas a ejecutar playbooks localmente por `SSM`, también necesitas `session-manager-plugin` instalado en tu máquina.

### 7. Ejecutar bootstrap del servidor

```bash
export AWS_REGION="us-east-1"
ansible-playbook \
  -i ansible/inventory/aws_ec2.yml \
  ansible/playbooks/bootstrap.yml
```

### 8. Desplegar la aplicación

```bash
export AWS_REGION="us-east-1"
ansible-playbook \
  -i ansible/inventory/aws_ec2.yml \
  ansible/playbooks/deploy_app.yml \
  -e phase4_aurora_secret_name="$(cd terraform/environments/dev && terraform output -raw aurora_secret_name)"
```

### 9. Validar la aplicación

```bash
aws ssm start-session \
  --region us-east-1 \
  --target "$(cd terraform/environments/dev && terraform output -raw test_instance_id)"
```

Dentro de la instancia:

```bash
curl http://127.0.0.1:3000/healthz
curl http://127.0.0.1:3000/db-check
sudo systemctl status phase4-smoke-app --no-pager
```

### 10. Destruir el ambiente cuando termines

Para no dejar costos innecesarios en `dev`:

```bash
cd terraform/environments/dev
terraform destroy -var-file="dev.tfvars"
```

Si el bucket tiene versionado y contiene objetos de pruebas de `Ansible`, vacíalo antes de repetir el `destroy`.

## Flujo completo recomendado en `dev`

Este es el orden sugerido si quieres levantar el proyecto desde cero y validarlo de punta a punta:

1. Clona el repositorio.
2. Configura credenciales AWS válidas.
3. Exporta `AWS_REGION`, `TF_STATE_BUCKET` y `TF_LOCK_TABLE`.
4. Revisa `terraform/environments/dev/dev.tfvars`.
5. Ejecuta `terraform init`.
6. Ejecuta `terraform validate` y `terraform plan -var-file="dev.tfvars"`.
7. Ejecuta `terraform apply -var-file="dev.tfvars"`.
8. Instala colecciones con `ansible-galaxy collection install -r ansible/requirements.yml`.
9. Ejecuta `ansible/playbooks/bootstrap.yml`.
10. Ejecuta `ansible/playbooks/deploy_app.yml`.
11. Valida `/healthz`, `/db-check` y el servicio `phase4-smoke-app`.
12. Si estás cerrando Fase 8, valida además `CloudWatch`, `SNS` y alarmas.
13. Destruye `dev` si no lo vas a seguir usando.

## Variables mínimas que debes revisar antes de desplegar

Antes de correr `terraform apply`, revisa estos archivos:

- `terraform/environments/dev/dev.tfvars`
- `terraform/environments/prod/prod.tfvars`

Variables especialmente importantes:

- `aws_region`: región donde se desplegará el ambiente.
- `app_bucket_name`: nombre globalmente único del bucket de artefactos.
- `database_mode`: en `dev` puede apuntar a un cluster externo tipo `express`.
- `external_aurora_cluster_identifier`: identificador del cluster externo usado en `dev`.
- `external_aurora_secret_name`: secreto de AWS Secrets Manager que usa la app en `dev`.
- `enable_test_instance`: define si se crea la EC2 de validación.
- `observability_sns_email_endpoint`: correo para confirmar la suscripción SNS si quieres cerrar Fase 8.

## Qué necesitas tener creado en AWS

Antes del primer despliegue desde una máquina local o desde GitHub Actions, asegúrate de tener:

- bucket `S3` para el backend remoto de Terraform
- tabla `DynamoDB` para el locking del estado
- credenciales AWS válidas o federación `OIDC` si usas GitHub Actions
- en `dev`, el cluster Aurora externo y su secreto si trabajas en modo `express`
- permisos suficientes para crear VPC, EC2, IAM, S3, CloudWatch y SNS

## Bootstrap mínimo del repositorio

Antes de automatizar despliegues, este repositorio debe mantener estas bases:

- estructura de `terraform/environments` y `terraform/modules`
- `ci.yml` con `terraform fmt -check`, `terraform init`, `terraform validate` y `terraform plan`
- variables por ambiente claras en `variables.tf` y `*.tfvars`
- versionado de providers con `.terraform.lock.hcl`
- reglas de `.gitignore` para no subir `.terraform/`, `terraform.tfstate*` ni archivos locales

## GitHub Actions CI/CD

La Fase 7 queda apoyada en tres workflows:

- `.github/workflows/ci.yml`: valida `fmt`, `validate` y `plan` sobre `terraform/environments/dev` en `pull_request` hacia `develop` y `main`
- `.github/workflows/deploy_dev.yml`: aplica infraestructura en `dev` al hacer merge hacia `develop` y luego ejecuta `bootstrap.yml` + `deploy_app.yml` por `SSM`
- `.github/workflows/deploy_prod.yml`: aplica infraestructura en `prod` al hacer merge hacia `main` y despliega la app solo si existen hosts administrados por `SSM`

### Variables y permisos requeridos en GitHub

Variables del repositorio:

- `AWS_REGION`: región AWS usada por Terraform, AWS CLI y Ansible
- `CI_AWS_ROLE_ARN`: rol IAM asumido por `ci.yml` vía `OIDC`
- `TF_STATE_BUCKET`: bucket `S3` que guarda el estado remoto de Terraform
- `TF_LOCK_TABLE`: tabla `DynamoDB` usada para locking del estado

Variables por environment (`dev` y `prod`):

- `AWS_ROLE_ARN`: rol IAM que asumen `deploy_dev.yml` y `deploy_prod.yml`
- `TF_STATE_BUCKET`: puedes heredarlo del repositorio o declararlo también por environment si quieres aislarlo
- `TF_LOCK_TABLE`: puedes heredarlo del repositorio o declararlo también por environment si quieres aislarlo
- `AWS_REGION`: puedes heredarlo del repositorio o declararlo también por environment

Permisos mínimos:

- `id-token: write` para federación `OIDC` con AWS
- `contents: read` para hacer checkout del repositorio

Secretos obligatorios:

- No se requieren claves estáticas de AWS si `OIDC` está configurado correctamente

### Prerrequisitos en AWS

- un proveedor `OIDC` de GitHub confiado por los roles IAM usados en CI/CD
- un bucket `S3` ya creado para el backend remoto de Terraform
- una tabla `DynamoDB` para locking del estado
- en `dev`, el cluster `Aurora Express` y el secreto externo definidos en `dev.tfvars`
- si quieres despliegue de app en `prod`, al menos una instancia administrada por `SSM` con tags `Project=infra-proyecto`, `Environment=prod` y `Role=app-server` o `Phase=phase4`

### Dependencias de Ansible en CI/CD

- `ansible/requirements.yml` instala `amazon.aws` y `community.aws`
- los playbooks usan `amazon.aws.aws_ssm`, por lo que el runner instala también `session-manager-plugin`

### Limitación actual de prod

- `terraform/environments/prod/main.tf` todavia no modela una capa de compute o Auto Scaling para la app
- por eso `deploy_prod.yml` aplica la infraestructura de `prod` siempre, pero solo ejecuta `bootstrap` y `deploy_app` cuando detecta hosts compatibles administrados por `SSM`

## Observabilidad minima - Fase 8

La Fase 8 agrega una base minima de observabilidad sin romper la Fase 7:

- log groups de CloudWatch para sistema y aplicacion
- topic SNS para notificaciones operativas
- alarma real de CPU sobre Aurora en `dev` y `prod`
- alarmas de CPU y `StatusCheckFailed` para la EC2 de prueba cuando exista en `dev`
- configuracion del `amazon-cloudwatch-agent` para enviar `/var/log/messages` y `/var/log/phase4-smoke-app.log`

### Recursos esperados

En cada ambiente Terraform crea:

- log group de sistema: `/<project_name>/<environment>/system`
- log group de aplicacion: `/<project_name>/<environment>/app`
- topic SNS: `<project_name>-<environment>-observability-alerts`
- alarma Aurora CPU alta: `<project_name>-<environment>-rds-cpu-high`

En `dev`, si `enable_test_instance = true`, tambien crea:

- alarma EC2 CPU alta: `<project_name>-<environment>-ec2-cpu-high`
- alarma EC2 `StatusCheckFailed`: `<project_name>-<environment>-ec2-status-check-failed`

### Variables nuevas

Debes revisar o definir estas variables en `terraform/environments/dev/*.tfvars` y `terraform/environments/prod/*.tfvars`:

- `observability_sns_email_endpoint`: correo que recibira la suscripcion SNS; si queda en `null`, el topic se crea pero la suscripcion no
- `observability_log_retention_in_days`: retencion de logs en CloudWatch
- `observability_ec2_cpu_threshold`: umbral de CPU para la alarma EC2 cuando exista instancia administrada
- `observability_rds_cpu_threshold`: umbral de CPU para la alarma de Aurora

### Consideraciones operativas

- el rol IAM de EC2 ahora adjunta `CloudWatchAgentServerPolicy` para permitir metricas y logs
- `bootstrap.yml` deja activado el rol `monitoring` por defecto
- la app escribe su salida en `/var/log/phase4-smoke-app.log`
- en `prod`, mientras no existan hosts administrados por `SSM`, veras topic SNS, alarmas y log groups, pero no flujo real de logs de app

### Validacion manual

1. Aplica Terraform en el ambiente objetivo:

```bash
cd terraform/environments/dev
terraform apply -var-file="dev.tfvars"
```

2. Si configuraste `observability_sns_email_endpoint`, acepta el correo de confirmacion que envia SNS.

3. Ejecuta `bootstrap.yml` y `deploy_app.yml` para que la instancia instale el agente y la app genere logs:

```bash
export AWS_REGION=us-east-1
ansible-playbook -i ansible/inventory/aws_ec2.yml ansible/playbooks/bootstrap.yml
ansible-playbook \
  -i ansible/inventory/aws_ec2.yml \
  ansible/playbooks/deploy_app.yml \
  -e phase4_aurora_secret_name="$(cd terraform/environments/dev && terraform output -raw aurora_secret_name)"
```

4. Verifica dentro de la instancia:

```bash
sudo systemctl status amazon-cloudwatch-agent --no-pager
sudo systemctl status phase4-smoke-app --no-pager
sudo tail -n 50 /var/log/phase4-smoke-app.log
curl http://127.0.0.1:3000/healthz
curl http://127.0.0.1:3000/db-check
```

5. Verifica en CloudWatch:

- que existan los log groups `/<project_name>/<environment>/system` y `/<project_name>/<environment>/app`
- que lleguen eventos nuevos desde la instancia
- que existan las alarmas listadas en `terraform output observability_alarm_names`

6. Demuestra la notificacion SNS:

```bash
aws sns publish \
  --region us-east-1 \
  --topic-arn "$(terraform output -raw observability_sns_topic_arn)" \
  --message "Prueba manual de observabilidad Fase 8"
```

7. Opcional para probar la alarma EC2 CPU en `dev`:

```bash
aws ssm start-session --region us-east-1 --target "$(terraform output -raw test_instance_id)"
```

Ya dentro de la instancia:

```bash
nohup bash -lc 'yes > /dev/null' >/tmp/cpu-burn-1.log 2>&1 &
nohup bash -lc 'yes > /dev/null' >/tmp/cpu-burn-2.log 2>&1 &
```

Mantelo unos minutos, confirma la transicion de la alarma en CloudWatch y luego detiene la carga:

```bash
pkill -f 'yes > /dev/null'
```

## Orden recomendado

1. estructura base del repo
2. CI mínimo de IaC
3. Fase 1 de networking
4. validación manual en `dev`
5. pipeline `deploy_dev`
6. módulos restantes
7. pipeline `deploy_prod`
