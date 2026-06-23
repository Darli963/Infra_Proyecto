# Frontend — Sistema de Cotización de Motocicletas

SPA construida con React + Vite + TypeScript + Tailwind CSS.

## Requisitos

- Node.js >= 20

## Instalación

```bash
cp .env.example .env
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor Vite corre en `http://localhost:5173`.  
Las llamadas a `/api/*` se redirigen al backend en `http://localhost:3000`.

## Build

```bash
npm run build
npm run preview
```

## Estructura

```
src/
  pages/        páginas de la aplicación
  components/   componentes reutilizables
  layouts/      layouts compartidos
  routes/       configuración de rutas
  services/     llamadas HTTP a la API
  hooks/        custom hooks
```
