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

## Orden recomendado

1. estructura base del repo
2. CI mínimo de IaC
3. Fase 1 de networking
4. validación manual en `dev`
5. pipeline `deploy_dev`
6. módulos restantes
7. pipeline `deploy_prod`
