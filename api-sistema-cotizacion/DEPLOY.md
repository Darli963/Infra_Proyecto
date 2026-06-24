# Guía de despliegue — Sistema de Cotización de Motocicletas

La infraestructura AWS (EC2, ALB, Aurora, Cognito, S3, CloudFront) ya existe
y es gestionada por Terraform + Ansible. Este documento cubre **únicamente**
los pasos necesarios para desplegar la aplicación sobre esa infraestructura.

---

## Arquitectura de referencia

```
Usuarios públicos
    │
    ▼
CloudFront (HTTPS) ──── WAF
    │
    ▼
ALB (HTTP :80)
    │
    ├── EC2 / ASG   ← backend Node.js :3000
    │       │
    │       ├── Aurora PostgreSQL  (Secrets Manager)
    │       ├── AWS Cognito        (SDK)
    │       └── S3                 (SDK — Instance Profile)
    │
    └── S3 static  ← frontend React (build)
```

---

## Prerrequisitos

- AWS CLI configurado con credenciales válidas
- Terraform aplicado (`terraform apply -var-file="dev.tfvars"`)
- Node.js 20 instalado localmente (para el build del frontend)

---

## 1. Obtener outputs de Terraform

```bash
cd terraform/environments/dev

export AURORA_SECRET=$(terraform output -raw aurora_secret_name)
export S3_BUCKET=$(terraform output -raw s3_bucket_name)
export CF_DOMAIN=$(terraform output -raw perimeter_cloudfront_domain_name)
export CF_HTTPS=$(terraform output -raw perimeter_https_endpoint)
export COGNITO_POOL=$(terraform output -raw auth_user_pool_id   2>/dev/null || echo "")
export COGNITO_CLIENT=$(terraform output -raw auth_user_pool_client_id 2>/dev/null || echo "")
export INSTANCE_ID=$(terraform output -raw test_instance_id)
```

---

## 2. Actualizar el secreto de configuración de la app

El módulo `storage` crea el secreto `infra-proyecto/dev/app-config` con
placeholders. Actualízalo antes del primer despliegue:

```bash
aws secretsmanager update-secret \
  --region us-east-1 \
  --secret-id "infra-proyecto/dev/app-config" \
  --secret-string "{
    \"jwt_secret\": \"$(openssl rand -hex 32)\",
    \"app_env\": \"production\"
  }"
```

---

## 3. Build del backend

```bash
cd api-sistema-cotizacion/backend
npm install
npm run build          # genera dist/
npm run prisma:generate
```

El artefacto de despliegue es:

```
backend/
  dist/          ← código compilado
  prisma/        ← schema + migraciones
  start.js       ← entry point de producción
  package.json
  package-lock.json
```

---

## 4. Ejecutar migraciones de base de datos

Desde local con acceso a la VPC (o desde la EC2 via SSM):

```bash
# Obtener DATABASE_URL desde el secreto
SECRET=$(aws secretsmanager get-secret-value \
  --region us-east-1 \
  --secret-id "$AURORA_SECRET" \
  --query SecretString --output text)

export DATABASE_URL="postgresql://$(echo $SECRET | jq -r .username):$(echo $SECRET | jq -r .password)@$(echo $SECRET | jq -r .host):$(echo $SECRET | jq -r .port)/$(echo $SECRET | jq -r .dbname)?sslmode=require"

cd api-sistema-cotizacion/backend
npm run prisma:migrate:prod   # prisma migrate deploy
```

---

## 5. Desplegar backend con Ansible

El playbook `deploy_backend.yml` copia archivos, instala dependencias, ejecuta
migraciones de Prisma y gestiona systemd:

```bash
export AWS_REGION=us-east-1

ansible-playbook \
  -i ansible/inventory/aws_ec2.yml \
  ansible/playbooks/deploy_backend.yml \
  -e target_hosts=deploy_dev \
  -e backend_aurora_secret_name="$AURORA_SECRET" \
  -e backend_s3_bucket_name="$S3_BUCKET" \
  -e backend_cloudfront_url="https://$CF_DOMAIN" \
  -e backend_aws_region="us-east-1" \
  -e backend_cognito_user_pool_id="$COGNITO_POOL" \
  -e backend_cognito_client_id="$COGNITO_CLIENT"
```

> **Nota:** El rol `app` ejecuta `ExecStart=/usr/bin/node server.js`.
> Para usar `start.js` (que resuelve el secreto de Aurora), actualiza la
> variable `phase4_app_start_cmd` o modifica localmente el template
> `app.service.j2` si tienes acceso. Alternativamente, pasa `DATABASE_URL`
> directamente en `phase4_env_vars`.

---

## 6. Build del frontend

```bash
cd api-sistema-cotizacion/frontend

# Crear .env de producción
cat > .env.production << EOF
VITE_API_BASE_URL=https://$CF_DOMAIN/api
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=$COGNITO_POOL
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT
VITE_CLOUDFRONT_URL=https://$CF_DOMAIN
EOF

npm install
npm run build    # genera dist/
```

---

## 7. Desplegar frontend con Ansible

El playbook `deploy_frontend.yml` construye y sube el frontend a S3:

```bash
export AWS_REGION=us-east-1

ansible-playbook \
  ansible/playbooks/deploy_frontend.yml \
  -e frontend_cloudfront_domain="$CF_DOMAIN" \
  -e frontend_cloudfront_distribution_id="$CF_DISTRIBUTION_ID" \
  -e frontend_s3_bucket="$S3_BUCKET" \
  -e frontend_aws_region="us-east-1" \
  -e frontend_cognito_user_pool_id="$COGNITO_POOL" \
  -e frontend_cognito_client_id="$COGNITO_CLIENT"
```

Alternativamente, subir manualmente a S3:

```bash
aws s3 sync api-sistema-cotizacion/frontend/dist/ \
  s3://$S3_BUCKET/frontend/ \
  --region us-east-1 \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

# index.html sin caché agresivo
aws s3 cp api-sistema-cotizacion/frontend/dist/index.html \
  s3://$S3_BUCKET/frontend/index.html \
  --region us-east-1 \
  --cache-control "no-cache,no-store,must-revalidate"
```

---

## 8. Validar el despliegue

```bash
# Health check local en la EC2
aws ssm start-session --region us-east-1 --target "$INSTANCE_ID"
# dentro de la instancia:
curl http://127.0.0.1:3000/api/healthz

# Health check externo (CloudFront)
curl https://$CF_DOMAIN/api/healthz

# Endpoint público de cotización
curl https://$CF_DOMAIN/api/public/risk-questions
```

---

## Variables de entorno de producción (backend)

| Variable | Origen | Requerida |
|---|---|---|
| `PORT` | fija `3000` | Sí |
| `NODE_ENV` | fija `production` | Sí |
| `AWS_REGION` | `us-east-1` | Sí |
| `AURORA_SECRET_NAME` | `terraform output aurora_secret_name` | Sí |
| `AUTH_PROVIDER` | `cognito` | Sí |
| `COGNITO_USER_POOL_ID` | `terraform output auth_user_pool_id` | Si Cognito |
| `COGNITO_CLIENT_ID` | `terraform output auth_user_pool_client_id` | Si Cognito |
| `S3_BUCKET_NAME` | `terraform output s3_bucket_name` | Si S3 |
| `CLOUDFRONT_URL` | `terraform output perimeter_cloudfront_domain_name` | No |
| `DATABASE_URL` | Alternativa a `AURORA_SECRET_NAME` | No |
| `JWT_SECRET` | Solo si `AUTH_PROVIDER=local` | Condicional |

> En EC2 con Instance Profile **no se necesitan** `AWS_ACCESS_KEY_ID` ni
> `AWS_SECRET_ACCESS_KEY`. El SDK los obtiene del metadata service.

---

## Variables de entorno de producción (frontend)

| Variable | Valor |
|---|---|
| `VITE_API_BASE_URL` | `https://<cloudfront-domain>/api` |
| `VITE_COGNITO_REGION` | `us-east-1` |
| `VITE_COGNITO_USER_POOL_ID` | output de Terraform |
| `VITE_COGNITO_CLIENT_ID` | output de Terraform |
| `VITE_CLOUDFRONT_URL` | `https://<cloudfront-domain>` |

---

## Problemas frecuentes y soluciones

### `Cannot connect to database`
- Verificar que `AURORA_SECRET_NAME` apunte al secreto correcto.
- Verificar que el Security Group de la EC2 tenga salida al puerto `5432` de Aurora.
- En modo `express`, el cluster Aurora externo debe estar activo.

### `Cognito: NotAuthorizedException`
- Confirmar que `COGNITO_CLIENT_ID` corresponde al cliente **SPA** (sin secret).
- El flujo debe ser `USER_PASSWORD_AUTH` — verificar que esté habilitado en el User Pool.

### `S3: AccessDenied al subir imágenes`
- El Instance Profile debe tener política `s3:PutObject` sobre el bucket.
- Verificar que `S3_BUCKET_NAME` coincide con `terraform output s3_bucket_name`.

### `ALB health check falla (503)`
- El backend debe responder `200` en `GET /api/healthz`.
- Verificar que el proceso `cotizacion-app` esté activo: `systemctl status cotizacion-app`.
- Revisar logs: `tail -f /var/log/cotizacion-app.log`.

### `CloudFront devuelve 403 en /api/*`
- Verificar que el behavior de CloudFront para `/api/*` apunta al ALB como origen.
- El ALB solo acepta tráfico desde el managed prefix list de CloudFront
  (`alb_ingress_use_cloudfront_prefix_list = true`).

### `Prisma: Migration failed`
- Ejecutar `prisma migrate deploy` (no `migrate dev`) en producción.
- El usuario de Aurora debe tener permisos `CREATE TABLE` en la base de datos.

---

## GitHub Actions Secrets requeridos

Para el workflow `.github/workflows/deploy_dev.yml`, configura las siguientes
variables en el environment `dev` de GitHub Actions:

| Variable | Descripción |
|---|---|
| `AWS_ROLE_ARN` | ARN del rol IAM para OIDC |
| `TF_STATE_BUCKET` | Nombre del bucket S3 para estado Terraform |
| `TF_LOCK_TABLE` | Nombre de la tabla DynamoDB para locks |
| `ANSIBLE_AWS_SSM_BUCKET_NAME` | Bucket S3 para Ansible SSM |
| `AWS_REGION` | Región AWS (default: us-east-1) |

---

## Flujo completo resumido

```
terraform apply
    │
    ├── obtener outputs (Aurora secret, S3, CloudFront, Cognito)
    ├── actualizar secreto app-config
    ├── npm run build  (backend)
    ├── ansible-playbook deploy_backend.yml  (backend → EC2, incluye migraciones)
    ├── ansible-playbook deploy_frontend.yml  (frontend → S3 + CloudFront)
    └── curl /api/healthz ✓
```
