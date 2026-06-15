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

### 3. Inicializar Terraform

Para ambiente de desarrollo:

```
cd terraform/environments/dev
terraform init
```

Para ambiente de producción:

```
cd terraform/environments/prod
terraform init
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

## Orden recomendado

1. estructura base del repo
2. CI mínimo de IaC
3. Fase 1 de networking
4. validación manual en `dev`
5. pipeline `deploy_dev`
6. módulos restantes
7. pipeline `deploy_prod`
