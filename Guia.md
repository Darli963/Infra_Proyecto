# Plan detallado de programación (IaC + App) — AWS + Terraform + Ansible + GitHub Actions (Node.js)

Basado en tu guía secuencial del proyecto, en el sílabo del curso y en tu diagrama AWS:

`Route 53 → CloudFront → WAF / API Gateway → VPC Link → ALB → ASG / EC2 → Aurora / ElastiCache`

Más los servicios complementarios:

- `S3`
- `Secrets Manager`
- `CloudWatch`
- `SNS`
- `Cognito`
- `IAM`
- `ACM`
- `Glacier`

Este documento no está pensado como teoría general. Está pensado como una hoja de ruta real para que sepas qué hacer primero, qué dejar para después y cómo convertir ese diagrama grande en entregables concretos dentro de tu repositorio.

## 0. Objetivo y resultado esperado

Al final del proyecto deberías poder hacer una demo donde ocurra lo siguiente:

1. Un `terraform apply` por ambiente despliega la infraestructura principal del diagrama de forma reproducible.
2. Un `ansible-playbook` configura los servidores y deja la app Node.js lista para correr.
3. GitHub Actions ejecuta validación en `Pull Request` y despliegue controlado en ramas permitidas.
4. La app responde por HTTPS, idealmente por `CloudFront + WAF` y, como mínimo viable, por `ALB`.
5. La app se conecta correctamente a `Aurora` y, si aplica, a `Redis`.
6. La solución tiene seguridad y observabilidad mínimas: `Secrets Manager`, `IAM` con privilegio mínimo, logs y alarmas en `CloudWatch`, y notificaciones con `SNS`.

## 1. La decisión más importante antes de empezar

La decisión correcta para tu caso es esta:

**La infraestructura debe vivir en un repositorio separado del código principal de la app.**

Eso no significa abandonar tu proyecto actual. Significa que debes tratar tu app como una carga de trabajo que será desplegada encima de la infraestructura.

### Traducción práctica

- el repo de infraestructura describe AWS
- el repo de aplicación describe tu sistema Node.js
- ambos se conectan en el despliegue

### Qué sí debes llevar desde tu proyecto actual

- el código fuente
- el `package.json`
- las variables de entorno
- el comando de arranque
- el procedimiento de build si existe
- la configuración de conexión a base de datos
- los archivos estáticos o assets

### Qué no debes mezclar dentro de `terraform/`

- controladores
- rutas
- servicios de negocio
- modelos de aplicación
- secretos reales
- configuraciones manuales copiadas desde consola sin documentar

## 2. Supuestos y decisiones para que el plan sea ejecutable

## 2.1 Ambientes

Debes trabajar al menos con:

- `dev` como obligatorio
- `prod` como ideal

Si el curso solo te permite uno por tiempo o presupuesto, trabaja solo `dev`, pero deja la estructura pensada como multiambiente.

### Regla base

**Infraestructura y aplicación deben desplegarse por ambiente, no manualmente en consola.**

## 2.2 Estrategia de despliegue de app recomendada

La estrategia más coherente para tu caso es:

- aplicación Node.js en `EC2`
- detrás de un `ALB`
- con crecimiento posterior hacia `Auto Scaling Group`

La app puede correr como:

- servicio `systemd`
- o con `PM2`

Para este curso, lo más práctico es:

- artefacto `ZIP`
- despliegue con `Ansible`
- servicio `systemd` o `PM2`

Docker queda recomendado, pero no debe ser el primer bloqueo si todavía estás resolviendo red, seguridad y conectividad.

## 2.3 Seguridad de secretos

Las variables sensibles no deben quedar en el repositorio.

Debes manejar al menos:

- credenciales de base de datos
- cadenas de conexión
- tokens
- claves privadas

La recomendación principal es:

- `AWS Secrets Manager` para secretos
- `IAM Role` en EC2 para acceso controlado

Alternativa aceptable para un primer corte:

- Ansible recupera secretos y genera un `.env` en el servidor

## 2.4 Validación de necesidad de servicios avanzados

No todo lo que aparece en el diagrama tiene que entrar el primer día.

### En el camino base sí deben entrar

- `Terraform`
- `Ansible`
- `GitHub Actions`
- `VPC`
- `subnets`
- `ALB`
- `EC2`
- `Aurora`
- `IAM`
- `Secrets Manager`
- `CloudWatch`

### Pueden entrar después

- `ElastiCache`
- `CloudFront`
- `WAF`
- `Cognito`
- `API Gateway + VPC Link`
- `Glacier`
- `Prometheus`
- `Grafana`

### No deben estar en el camino principal

- `Kubernetes`
- `Puppet`
- `Jenkins` como pipeline principal

## 3. Estructura recomendada del repositorio

Mantén IaC separado del código de la app. Para tu repo de infraestructura, esta estructura es recomendable:

```text
repo-infra/
  README.md
  docs/
    diagrama_aws.png
    decisiones.md
    runbooks.md
  terraform/
    environments/
      dev/
        main.tf
        providers.tf
        backend.tf
        variables.tf
        dev.tfvars
        outputs.tf
      prod/
        main.tf
        providers.tf
        backend.tf
        variables.tf
        prod.tfvars
        outputs.tf
    modules/
      networking/
      security/
      compute/
      database/
      cache/
      storage/
      edge/
      apigw/
      observability/
    shared/
      locals.tf
      outputs.tf
      versions.tf
  ansible/
    inventory/
      aws_ec2.yml
    group_vars/
      all.yml
    roles/
      base/
      node/
      app/
      monitoring/
    playbooks/
      bootstrap.yml
      deploy_app.yml
  .github/
    workflows/
      ci.yml
      deploy_dev.yml
      deploy_prod.yml
```

## 4. Mapa del diagrama a entregables reales

Tu diagrama no debe quedarse como una imagen bonita. Cada bloque debe convertirse en módulos, archivos o tareas concretas.

## 4.1 AWS Managed Services

### Route 53

Entregable esperado:

- registros DNS hacia `CloudFront` o `ALB`

### CloudFront

Entregable esperado:

- distribución
- origins
- behaviors
- integración con `ACM`

### ACM

Entregable esperado:

- certificado SSL/TLS

### WAF

Entregable esperado:

- `WebACL`
- asociación con `CloudFront` o `API Gateway`

### Cognito

Entregable esperado:

- `User Pool`
- `App Client`

Solo si realmente tu app necesita auth administrada por AWS.

### IAM

Entregable esperado:

- roles para `EC2`
- permisos para leer secretos
- permisos para logs
- permisos para GitHub Actions si usas `OIDC`

### Secrets Manager

Entregable esperado:

- secretos de base de datos
- secretos de Redis
- parámetros sensibles de la app

### S3 + Glacier

Entregable esperado:

- buckets para assets, backups o contenido estático
- políticas de acceso
- lifecycle hacia Glacier si vas a demostrar archivado

### CloudWatch + SNS

Entregable esperado:

- log groups
- alarmas
- notificaciones

## 4.2 VPC y red

Entregables esperados:

- `VPC`
- 2 `Availability Zones`
- subnets públicas
- subnets privadas
- `Internet Gateway`
- `NAT Gateways`
- route tables
- Security Groups por capa

## 4.3 Cómputo y datos

Entregables esperados:

- `ALB`
- `Target Group`
- health checks
- `EC2`
- `Launch Template`
- `Auto Scaling Group`
- `Aurora`
- `ElastiCache Redis`

## 4.4 API Gateway + VPC Link

Tu diagrama lo muestra, pero debes decidir si entra en el primer alcance.

### Úsalo si necesitas

- una capa API administrada
- throttling
- usage plans
- auth específica a nivel API Gateway

### Si no lo necesitas

Puedes simplificar así:

`CloudFront / WAF → ALB`

Y dejar `API Gateway + VPC Link` como expansión posterior.

## 5. Tecnologías: cuáles usar y cuándo

## 5.1 Obligatorias

### Terraform

Úsalo para crear infraestructura AWS.

Debe cubrir al menos:

- VPC
- subnets
- IAM
- Security Groups
- EC2
- ALB
- Aurora
- S3
- CloudWatch
- SNS

### Ansible

Úsalo para la configuración de servidores y despliegue de la app.

Debe cubrir al menos:

- paquetes base
- runtime Node.js
- variables de entorno
- despliegue del artefacto
- reinicio del servicio

### GitHub Actions

Úsalo como pipeline principal.

Debe cubrir al menos:

- `fmt`
- `validate`
- `plan`
- `apply` controlado

### CloudWatch

Úsalo para observabilidad mínima.

## 5.2 Recomendadas

### Docker

Úsalo si tu app necesita un empaquetado más reproducible. Si estás comenzando, puedes dejarlo fuera del primer despliegue funcional.

### Secrets Manager

Muy recomendable desde temprano para no terminar con secretos en archivos inseguros.

### Checkov

Recomendado para elevar el nivel de seguridad del Terraform.

## 5.3 Opcionales

### Prometheus y Grafana

Buenos para una demo más profesional de monitoreo, pero no deben bloquearte.

### Cognito

Útil solo si tu aplicación realmente requiere esa integración.

### API Gateway + VPC Link

Solo si tu caso necesita una capa API formal.

## 5.4 No recomendadas para el arranque

### Kubernetes

Es complejidad extra y no es necesaria para demostrar el objetivo principal del curso.

### Puppet

Duplicaría el rol de Ansible.

### Jenkins

Puedes mencionarlo por contexto del sílabo, pero GitHub Actions debe ser tu implementación principal.

## 6. Qué hacer primero si hoy quieres empezar

Si ahora mismo quieres arrancar el despliegue del diagrama, no intentes hacer todo. Tu orden real debe ser este:

1. ordenar el repositorio
2. completar el ambiente `dev`
3. crear el módulo `networking`
4. desplegar la red
5. crear la seguridad base
6. lanzar una sola `EC2` privada de prueba
7. probar que la app arranca ahí
8. recién después pasar a `ALB`, `ASG`, `Aurora` y automatización avanzada

### Tu primer objetivo real

**No es desplegar todo el diagrama.**

**Es lograr una red funcional y una sola EC2 privada de prueba donde tu app Node.js corra correctamente.**

Cuando logres eso, el resto deja de verse imposible.

## 7. Orden cronológico de implementación por fases

## Fase 1. Los cimientos: la red

Antes de lanzar servidores o bases de datos, necesitas el terreno donde vivirán.

### Qué haces

- crear `VPC`
- crear subnets públicas
- crear subnets privadas
- crear `Internet Gateway`
- crear `NAT Gateway`
- crear route tables

### Qué módulos o archivos toca

- `terraform/modules/networking/`
- `terraform/environments/dev/main.tf`
- `terraform/environments/dev/variables.tf`
- `terraform/environments/dev/dev.tfvars`

### Qué recursos mínimos crear

- `aws_vpc`
- `aws_subnet`
- `aws_internet_gateway`
- `aws_eip`
- `aws_nat_gateway`
- `aws_route_table`
- `aws_route_table_association`

### Criterio de aceptación

- la VPC existe
- las subnets públicas tienen salida a internet
- las privadas salen por NAT
- el `terraform plan` se entiende
- el `terraform apply` termina sin errores

### Resultado de la fase

Tienes la base física del diagrama. Nada más se debe montar antes de esto.

---

## Fase 2. Seguridad base: IAM y Security Groups

Con la red lista, defines permisos y muros de fuego.

### Qué haces

- crear rol IAM para administración segura
- crear Security Groups separados por capa

### Qué debes construir

1. rol IAM para EC2 con `AmazonSSMManagedInstanceCore`
2. SG para `ALB`
3. SG para `EC2`
4. SG para `Aurora`
5. SG para `Redis`

### Regla de conectividad

- `ALB` recibe tráfico externo
- `EC2` recibe tráfico solo desde `ALB`
- `Aurora` recibe tráfico solo desde `EC2`
- `Redis` recibe tráfico solo desde `EC2`

### Criterio de aceptación

- no hay puertos sensibles abiertos a internet
- EC2 puede administrarse por Session Manager
- la matriz de conectividad está clara

### Resultado de la fase

Ya tienes la red protegida lo suficiente para seguir.

---

## Fase 3. Almacenamiento y datos

Ahora despliegas lo que la app necesita para guardar información.

### Qué haces

- crear `S3`
- crear `Aurora`
- crear `Secrets Manager`
- dejar `ElastiCache` como opcional si hace falta

### Orden recomendado dentro de la fase

1. bucket `S3`
2. subnet group de base de datos
3. `Aurora`
4. secretos
5. `Redis` si aplica

### Criterio de aceptación

- Aurora queda en subnets privadas
- su SG solo acepta conexiones desde EC2
- existe un bucket S3 funcional
- los secretos no están hardcodeados

### Resultado de la fase

La capa de datos está lista para que la app se conecte.

---

## Fase 4. Una sola EC2 de prueba

Esta fase es crítica y mucha gente se la salta. No deberías hacerlo.

### Qué haces

Antes de meter `ASG`, lanzas una sola `EC2` privada de prueba.

### Por qué esto es tan importante

Porque depurar una sola instancia es infinitamente más fácil que depurar un despliegue escalable completo.

### Qué debes probar

1. acceso por Session Manager
2. instalación de Node.js
3. despliegue manual inicial de la app
4. conexión a Aurora
5. lectura de variables o secretos
6. arranque correcto del servidor

### Criterio de aceptación

- la instancia arranca
- puedes entrar por SSM
- la app responde localmente en la instancia
- la app se conecta a Aurora

### Regla de oro

**Si no logras hacer correr una sola EC2 de prueba, no avances todavía a ALB, Auto Scaling, CloudFront ni WAF.**

### Resultado de la fase

Ya comprobaste que tu aplicación realmente puede vivir dentro de AWS.

---

## Fase 5. Computación y balanceo

Cuando la EC2 de prueba funciona, conviertes ese aprendizaje en infraestructura repetible.

### Qué haces

- crear `ALB`
- crear `Target Group`
- definir health checks
- crear `Launch Template`
- crear `Auto Scaling Group`

### Orden recomendado

1. crear `ALB`
2. asociarlo a subnets públicas
3. crear `Target Group`
4. apuntarlo a la EC2 de prueba
5. validar health checks
6. crear `Launch Template`
7. crear `Auto Scaling Group`

### Criterio de aceptación

- el ALB enruta a la app
- el health check pasa
- el ASG puede lanzar instancias válidas

### Resultado de la fase

La app ya no depende de una sola máquina y empieza a verse como una solución escalable.

---

## Fase 6. Configuración y despliegue con Ansible

Ahora conviertes lo manual en algo reproducible.

### Qué haces

- bootstrap del servidor
- instalación de Node.js
- despliegue del artefacto
- escritura del `.env` o consumo de secretos
- reinicio del servicio

### Estructura recomendada

- `ansible/roles/base/`
- `ansible/roles/node/`
- `ansible/roles/app/`
- `ansible/roles/monitoring/`
- `ansible/playbooks/bootstrap.yml`
- `ansible/playbooks/deploy_app.yml`

### Criterio de aceptación

- puedes repetir la configuración sin rehacerla a mano
- el playbook instala y despliega
- la app queda funcionando después del playbook

### Resultado de la fase

Tu operación básica ya es automatizable y demostrable.

---

## Fase 7. CI/CD con GitHub Actions

Aquí tomas la idea del laboratorio de saludo y la conviertes en un flujo real.

### Qué hace el pipeline de CI

En `Pull Request`:

- `terraform fmt -check`
- `terraform validate`
- `terraform plan`

### Qué puede hacer el pipeline de CD

En merge controlado:

- `terraform apply`
- despliegue de app

### Archivos esperados

- `.github/workflows/ci.yml`
- `.github/workflows/deploy_dev.yml`
- `.github/workflows/deploy_prod.yml`

### Criterio de aceptación

- un PR roto falla
- un PR correcto valida
- el despliegue no depende solo de acciones manuales

### Resultado de la fase

La infraestructura empieza a administrarse con disciplina profesional.

---

## Fase 8. Observabilidad mínima

Aquí completas la capa mínima profesional de monitoreo.

### Qué haces

- logs en CloudWatch
- alarmas
- notificaciones SNS

### Qué deberías implementar sí o sí

1. una alarma de CPU o health check
2. una suscripción SNS
3. logs mínimos del sistema o aplicación

### Qué puede quedar como mejora

- Prometheus
- Grafana
- dashboards avanzados

### Criterio de aceptación

- existe al menos una alarma real
- puedes demostrar una notificación

### Resultado de la fase

Tu sistema ya no solo corre: también puede ser observado.

---

## Fase 9. Perímetro y usuarios

Solo cuando todo lo interno funciona de punta a punta, expones la solución hacia fuera.

### Qué haces

- `ACM`
- `Route 53`
- `CloudFront`
- `WAF`
- opcionalmente `API Gateway + VPC Link`
- opcionalmente `Cognito`

### Orden recomendado

1. certificado en ACM
2. dominio y registros
3. distribución CloudFront
4. WAF
5. API Gateway solo si de verdad lo necesitas

### Criterio de aceptación

- la app responde por HTTPS
- el dominio apunta bien
- el perímetro está protegido

### Resultado de la fase

Tu arquitectura ya se parece mucho a la del diagrama completo.

## 8. Backlog recomendado con épicas, historias y tareas

Esto te sirve para convertir el documento en issues o tareas reales.

## Épica A — Base del proyecto

### Historia A1. Estructura inicial y documentación mínima

#### Tareas

- crear carpetas base
- agregar `README.md`
- agregar `.gitignore`
- guardar diagrama en `docs/`

#### Aceptación

- un tercero entiende cómo navegar el repo

### Historia A2. Calidad y CI inicial

#### Tareas

- crear `ci.yml`
- validar `fmt`
- validar `validate`
- agregar `plan`

#### Aceptación

- un PR con errores falla

## Épica B — Networking

### Historia B1. Módulo `networking`

#### Tareas

- VPC
- subnets
- IGW
- NAT
- route tables

#### Aceptación

- red multi-AZ funcional

### Historia B2. Security Groups base

#### Tareas

- SG de ALB
- SG de EC2
- SG de Aurora
- SG de Redis

#### Aceptación

- no hay puertos críticos abiertos al exterior

## Épica C — Datos

### Historia C1. S3 y secretos

#### Tareas

- bucket S3
- secretos

#### Aceptación

- almacenamiento listo y secretos fuera del código

### Historia C2. Aurora

#### Tareas

- subnet group
- cluster
- SG

#### Aceptación

- base privada y accesible solo desde la app

## Épica D — Cómputo

### Historia D1. EC2 de prueba

#### Tareas

- lanzar EC2 privada
- entrar por SSM
- probar app

#### Aceptación

- la app corre y se conecta a la base

### Historia D2. ALB y Target Group

#### Tareas

- crear ALB
- crear health checks
- enrutar a EC2

#### Aceptación

- la app responde por ALB

### Historia D3. Auto Scaling

#### Tareas

- launch template
- ASG

#### Aceptación

- el grupo crea instancias correctas

## Épica E — Configuración de app

### Historia E1. Bootstrap con Ansible

#### Tareas

- paquetes base
- Node.js
- PM2 o systemd

#### Aceptación

- el servidor queda listo sin pasos manuales extra

### Historia E2. Deploy de aplicación

#### Tareas

- copiar build
- escribir env
- reiniciar servicio

#### Aceptación

- la app queda desplegada con playbook

## Épica F — CI/CD y observabilidad

### Historia F1. Deploy automatizado

#### Tareas

- pipeline de apply
- pipeline de deploy

#### Aceptación

- el flujo base queda automatizado

### Historia F2. Observabilidad

#### Tareas

- logs
- alarmas
- SNS

#### Aceptación

- existe monitoreo mínimo funcional

## 9. Flujo profesional con Git

Tu profesor ya te dio la pauta: no debes empujar cambios directamente a producción.

### Ramas mínimas

- `main`
- `develop`
- `feat/*`

### Flujo recomendado

1. creas `feat/networking`
2. implementas el módulo
3. haces `Pull Request` hacia `develop`
4. GitHub Actions valida
5. si pasa, haces merge
6. cuando `develop` esté estable, integras a `main`

### Relación con el laboratorio

Tu laboratorio de saludo fue la versión más simple del concepto.

Ahora la evolución correcta es:

- antes: `echo "Hola..."`
- ahora: `terraform fmt`, `validate`, `plan` y luego despliegue controlado

## 10. Errores de enfoque que debes evitar

### Error 1. Intentar desplegar todo el diagrama al mismo tiempo

Eso te bloquea, porque mezcla red, seguridad, cómputo, datos y edge sin una base estable.

### Error 2. Empezar por CloudFront, WAF o Cognito

Esos servicios no sirven si todavía no tienes una app funcional detrás.

### Error 3. Saltarte la EC2 de prueba

Eso hace que escales errores en lugar de escalar una solución validada.

### Error 4. Meter Kubernetes por querer hacerlo más profesional

En tu caso actual, solo añade complejidad.

### Error 5. Dejar Ansible para el final

Si configuras todo a mano primero, luego será más difícil volverlo repetible.

### Error 6. Trabajar sin ramas ni PRs

Eso contradice el enfoque profesional que tu profesor está pidiendo.

## 11. Qué deberías hacer esta semana si quieres empezar ya

Si quieres arrancar sin perderte, tu secuencia inmediata debería ser esta:

1. ordenar el repo
2. definir `dev`
3. completar `terraform/environments/dev/`
4. crear `terraform/modules/networking/`
5. hacer `terraform init`
6. hacer `terraform plan`
7. corregir hasta que la red quede limpia
8. crear IAM base y Security Groups
9. lanzar una sola EC2 privada
10. probar tu aplicación allí

## 12. Definition of Done realista

Considera el proyecto bien encaminado cuando puedas demostrar:

1. red desplegada con Terraform
2. SG correctos
3. una EC2 privada funcional
4. app Node.js corriendo dentro de AWS
5. conexión a Aurora
6. ALB operativo
7. Auto Scaling Group válido
8. Ansible automatizando configuración
9. GitHub Actions validando cambios
10. CloudWatch y SNS funcionando al menos a nivel básico

## 13. Checklist final

- [ ] El repositorio está ordenado y documentado
- [ ] Existe ambiente `dev`
- [ ] El módulo `networking` funciona
- [ ] Los Security Groups están separados por capa
- [ ] La EC2 de prueba funciona por Session Manager
- [ ] La app arranca dentro de AWS
- [ ] Aurora está desplegada en privado
- [ ] El ALB enruta correctamente
- [ ] El Auto Scaling Group usa una plantilla válida
- [ ] Ansible configura la instancia o el grupo
- [ ] GitHub Actions valida `fmt`, `validate` y `plan`
- [ ] CloudWatch tiene al menos una alarma
- [ ] SNS tiene al menos una notificación
- [ ] El README y el diagrama están alineados con lo implementado

## 14. Recomendación final: por dónde empezar hoy

Si me preguntas qué debes hacer primero, mi recomendación concreta es esta:

### Paso 1

Completa la estructura del repo de infraestructura.

### Paso 2

Llena `terraform/environments/dev/` con provider, variables, backend y llamado a módulos.

### Paso 3

Implementa `terraform/modules/networking/`.

### Paso 4

Despliega:

- VPC
- subnets
- IGW
- NAT

### Paso 5

Crea:

- IAM base
- Security Groups

### Paso 6

Lanza una sola EC2 privada de prueba.

### Paso 7

Valida que tu aplicación puede correr allí y conectarse a la base.

### Traducción final

**Tu primer gran objetivo no es desplegar todo el diagrama.**

**Tu primer gran objetivo es lograr una red funcional y una EC2 privada de prueba donde tu app encienda correctamente.**

Después de eso, el diagrama deja de ser una imagen enorme y se convierte en una serie de capas que ya sabes construir.
