# Decisiones de arquitectura

## Fase 4 - EC2 privada de prueba

### 1. Una sola instancia antes de ASG

Se agrega una sola `EC2` privada para validar la aplicacion antes de introducir `ALB`, `Launch Template` y `Auto Scaling Group`.

Motivo:

- reduce la superficie de error
- simplifica la depuracion inicial
- permite aislar problemas de red, IAM, secretos y base de datos

### 2. Session Manager como acceso administrativo

La instancia no expone `SSH` ni requiere `key pairs`.

Motivo:

- evita abrir el puerto `22`
- mantiene la administracion dentro del plano de control de AWS
- encaja con el rol `AmazonSSMManagedInstanceCore` ya definido en la seguridad base

### 3. Bootstrap minimo en `user_data`

La instancia instala `Node.js`, utilitarios base y deja preparado un directorio de trabajo para despliegue manual inicial.

Motivo:

- asegura que la instancia ya nace lista para pruebas
- mantiene la Fase 4 enfocada en validacion, no en despliegue escalable

### 4. Acceso a secretos y artefactos desde IAM Role

La EC2 obtiene permisos para leer el secreto de `Aurora` y el bucket de artefactos mediante el rol ya creado en la fase de seguridad base.

Motivo:

- evita credenciales embebidas
- permite validar lectura real desde `Secrets Manager`
- deja el camino listo para despliegues posteriores

### 5. Smoke app de validacion

Se agrega una aplicacion Node.js minima para verificar:

- que `Node.js` arranca en la instancia
- que la app responde localmente
- que puede leer el secreto de `Aurora`
- que puede abrir una conexion real a la base

Motivo:

- el repositorio de infraestructura no contiene la app productiva
- aun asi se necesita una prueba real de habitabilidad dentro de AWS

### 6. Ruta A con Aurora Express

Para cerrar la Fase 4 en esta cuenta se adopta `Ruta A`:

- `dev` consume un `Aurora Express` existente en vez de crear `Aurora` estandar
- `Terraform` lo referencia con `data sources`
- la `EC2` abre salida `5432` hacia destino externo controlado
- la smoke app usa `Secrets Manager` + `IAM auth` para conectarse

Motivo:

- la cuenta exige `Express configuration` para este escenario
- evita forzar un cambio de motor o rediseñar la fase
- mantiene la validacion enfocada en habitabilidad real de la app dentro de AWS
