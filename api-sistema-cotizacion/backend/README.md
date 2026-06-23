# Backend — Sistema de Cotización de Motocicletas

API REST construida con Node.js + Express + TypeScript + Prisma + PostgreSQL.

## Requisitos

- Node.js >= 20
- PostgreSQL >= 14

## Instalación

```bash
cp .env.example .env
# Edita .env con tus valores reales
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Prisma

```bash
npm run prisma:generate   # genera el cliente
npm run prisma:migrate    # aplica migraciones
```

## Endpoint disponible (Fase 1)

| Método | Ruta          | Descripción   |
|--------|---------------|---------------|
| GET    | /api/healthz  | Health check  |

## Estructura

```
src/
  config/       variables de entorno
  controllers/  handlers HTTP
  routes/       definición de rutas
  services/     lógica de negocio
  middlewares/  middlewares Express
  utils/        utilidades compartidas
prisma/
  schema.prisma
```
