# Sistema de Cotización de Motocicletas

Aplicación web completa para que concesionarias gestionen su catálogo de motocicletas y ofrezcan cotizaciones personalizadas al público, con integración opcional a AWS (Cognito, S3, CloudFront, Aurora).

---

## Estructura del proyecto

```
api-sistema-cotizacion/
├── backend/          Node.js + Express + TypeScript + Prisma
├── frontend/         React + Vite + TypeScript + Tailwind CSS
└── DEPLOY.md         Guía de despliegue en AWS
```

---

## Instalación local

### Prerrequisitos

- Node.js >= 20
- PostgreSQL >= 14

### Backend

```bash
cd backend
cp .env.example .env       # edita DATABASE_URL y JWT_SECRET
npm install
npm run prisma:migrate     # crea las tablas
npm run prisma:seed        # datos de ejemplo (opcional)
npm run dev                # http://localhost:3000
```

### Frontend

```bash
cd frontend
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:3000/api
npm install
npm run dev                # http://localhost:5173
```

---

## Variables de entorno

### Backend (`.env`)

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno | `development` |
| `DATABASE_URL` | URL de PostgreSQL | — |
| `AUTH_PROVIDER` | `local` o `cognito` | `local` |
| `JWT_SECRET` | Secreto JWT (solo local) | — |
| `JWT_EXPIRES_IN` | Expiración del token | `7d` |
| `AWS_REGION` | Región AWS | `us-east-1` |
| `COGNITO_USER_POOL_ID` | ID del User Pool | — |
| `COGNITO_CLIENT_ID` | ID del cliente SPA | — |
| `S3_BUCKET_NAME` | Bucket para imágenes | — |
| `CLOUDFRONT_URL` | Dominio CloudFront | — |
| `AURORA_SECRET_NAME` | Secreto de Aurora en Secrets Manager | — |

### Frontend (`.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_BASE_URL` | URL base de la API |
| `VITE_COGNITO_REGION` | Región de Cognito |
| `VITE_COGNITO_USER_POOL_ID` | ID del User Pool |
| `VITE_COGNITO_CLIENT_ID` | ID del cliente SPA |
| `VITE_CLOUDFRONT_URL` | URL de CloudFront |

---

## Arquitectura

```
Navegador
  │
  ├── / (público)         React SPA
  │     ├── /motorcycles/:id
  │     ├── /simulate/:id
  │     └── /quote/result
  │
  └── /dashboard (privado, JWT)
        ├── /motorcycles
        ├── /quote-rules
        └── /risk-questions

          ↓ fetch /api/*

Express :3000
  ├── GET  /api/healthz
  ├── POST /api/auth/dealership/register
  ├── POST /api/auth/dealership/login
  ├── GET|POST|PUT|DELETE /api/dealer/motorcycles
  ├── POST /api/dealer/motorcycles/upload-image  (S3)
  ├── GET|POST|PUT|DELETE /api/dealer/quote-rules
  ├── GET|POST|PUT|DELETE /api/dealer/risk-questions
  ├── GET  /api/public/motorcycles
  ├── GET  /api/public/motorcycles/:id
  ├── GET  /api/public/risk-questions
  ├── POST /api/public/quote/simulate
  └── GET  /api/public/quote/:id/pdf

          ↓

PostgreSQL (Prisma)
  dealerships · motorcycles · motorcycle_images
  quote_rules · risk_questions · risk_question_options
  quote_simulations · simulation_responses
```

---

## Flujo de cotización

```
1. Usuario visita /  →  catálogo de motos activas
2. Selecciona una moto  →  /motorcycles/:id
3. Pulsa "Cotizar"  →  /simulate/:id
4. Completa:
   - nombre y correo
   - cuestionario de riesgo (dinámico desde la BD)
5. Submit  →  POST /api/public/quote/simulate
   Motor calcula:
     finalPrice = (basePrice × ruleFactor + ruleCharge) × ∏riskFactor_i
6. Resultado en /quote/result
   - precio base, recargos, precio final, expiración
   - botón "Descargar PDF"  →  GET /api/public/quote/:id/pdf
```

---

## Panel de concesionarias

| Ruta | Función |
|---|---|
| `/login` | Acceso con email y contraseña |
| `/dashboard` | Estadísticas (placeholder) |
| `/motorcycles` | CRUD de motos + subida de imágenes |
| `/quote-rules` | Reglas de cotización (factor × precio + cargo fijo) |
| `/risk-questions` | Cuestionario de riesgo con opciones y factores |

---

## Modelo de datos

```
Dealership ──< Motorcycle ──< MotorcycleImage
     └──────── QuoteRule (global o específica por moto)
QuoteSimulation ──< SimulationResponse ──> RiskQuestion
                                               └──< RiskQuestionOption
```

---

## Autenticación

El sistema soporta dos modos seleccionables con `AUTH_PROVIDER`:

| Modo | Funcionamiento |
|---|---|
| `local` | JWT firmado con `JWT_SECRET`, contraseña con bcrypt |
| `cognito` | Token emitido por AWS Cognito, SDK en el backend |

La interfaz `AuthProvider` abstrae ambos modos. Los controladores y rutas no cambian entre modos.

---

## Generación de PDF

`GET /api/public/quote/:simulationId/pdf` devuelve un PDF con:
- Encabezado con nombre y email de la concesionaria
- Datos de la motocicleta
- Datos del solicitante
- Respuestas al cuestionario de riesgo
- Desglose: precio base → factor de regla → factor de riesgo → precio final
- Fecha de expiración

Generado con PDFKit en streaming, sin guardar en disco.

---

## Despliegue en AWS

Ver [`DEPLOY.md`](./DEPLOY.md) para instrucciones completas.

Resumen:
1. `terraform apply` (infraestructura ya existente)
2. `npm run build` en backend → `ansible-playbook deploy_app.yml`
3. `npm run build` en frontend → `aws s3 sync dist/ s3://BUCKET/frontend/`
