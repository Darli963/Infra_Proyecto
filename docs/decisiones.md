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

## Fase 9 - Perimetro minimo profesional

### 1. CloudFront como entrada publica principal

La entrada pública se resuelve con `CloudFront` delante del origen HTTP realista que ya existe o puede existir en Terraform.

Motivo:

- aporta `HTTPS` administrado desde el borde
- habilita integración nativa con `WAF`
- evita introducir componentes innecesarios mientras el repositorio ya dispone de un camino natural con `ALB`

### 2. WAF asociado a CloudFront

La protección mínima se implementa con `WAFv2` sobre CloudFront, usando reglas administradas de AWS.

Motivo:

- protege el primer punto de entrada público
- reduce mantenimiento operativo frente a reglas completamente custom
- cubre reputación IP, patrones comunes y entradas maliciosas conocidas

### 3. ACM y Route 53 solo cuando exista dominio real

El código soporta `ACM` y `Route 53`, pero su activación depende de que exista un dominio real y una hosted zone pública.

Motivo:

- no inventa dominios inexistentes
- permite validar la fase primero con el dominio `cloudfront.net`
- deja el camino listo para dominio propio sin rehacer la arquitectura

### 4. Dev operativo, prod preparado

`dev` sí puede cerrar la fase con un origen realista porque ya cuenta con `EC2` y puede activar `ALB`. `prod` todavía no modela ese origen en Terraform.

Motivo:

- mantiene realismo respecto al estado actual del proyecto
- evita prometer un flujo público en `prod` que todavía no existe
- deja variables claras para activar el perímetro en `prod` cuando aparezca el origen público real

### 5. Sin API Gateway ni Cognito en esta fase

No se agrega `API Gateway + VPC Link` ni `Cognito` en esta iteración.

Motivo:

- `CloudFront -> ALB` ya resuelve el objetivo de perímetro mínimo
- agregar gateway o identidad ahora aumentaría complejidad sin necesidad funcional demostrada
- la autenticación de usuarios finales requiere un caso de uso más concreto que el alcance actual
