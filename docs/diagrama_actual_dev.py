"""
Diagrama de arquitectura — ambiente dev (infra-proyecto)
Generado a partir de terraform/environments/dev/ y terraform/modules/

Flags activos en dev.tfvars:
  enable_test_instance      = true   → EC2 t3.micro (phase4-smoke-app)
  enable_load_balancer      = true   → ALB público
  enable_compute_group      = true   → ASG (1-2 × t3.micro)
  enable_redis              = true   → ElastiCache Redis 7.0 (2 nodos, cache.t4g.micro)
  enable_api_gateway        = true   → HTTP API Gateway v2 + VPC Link → ALB
  enable_jwt_authorizer     = false  → sin JWT authorizer (Cognito no conectado al APIGW)
  enable_auth               = true   → Cognito User Pool
  enable_perimeter          = true   → CloudFront + WAF CLOUDFRONT
  database_mode             = express → Aurora externo (cluster "database-1"), referenciado
  alb_ingress_use_cloudfront_prefix_list = true → ALB solo acepta tráfico de CloudFront
"""

import os
from diagrams import Diagram, Cluster, Edge
from diagrams.aws.network import (
    CloudFront, VPC, InternetGateway, NATGateway,
    ElasticLoadBalancing, APIGateway
)
from diagrams.aws.security import WAF, Cognito, SecretsManager
from diagrams.aws.compute import EC2, AutoScaling
from diagrams.aws.database import Aurora, ElastiCache
from diagrams.aws.storage import S3
from diagrams.aws.management import Cloudwatch
from diagrams.aws.integration import SNS
from diagrams.onprem.client import Users

OUTPUT = os.path.join(os.path.dirname(__file__), "diagrama_actual_dev")

graph_attr = {
    "fontsize": "13",
    "bgcolor": "white",
    "pad": "0.5",
    "splines": "ortho",
    "nodesep": "0.6",
    "ranksep": "1.0",
}

with Diagram(
    "Arquitectura dev — infra-proyecto",
    filename=OUTPUT,
    show=False,
    direction="TB",
    graph_attr=graph_attr,
):

    users = Users("Internet / Usuarios")

    # ── Secrets Manager (externo a la VPC, accedido por EC2 vía HTTPS) ────────
    with Cluster("Secrets Manager"):
        secret_aurora = SecretsManager("aurora-new\n(DB credentials)")
        secret_redis  = SecretsManager("redis\n(auth token)")
        secret_app    = SecretsManager("app-config")

    # ── Cognito (servicio regional, fuera de VPC) ──────────────────────────────
    with Cluster("Cognito (auth)\nenable_auth = true"):
        cognito = Cognito("User Pool\n+ SPA Client\n+ Domain")

    # ── Perimeter (global / us-east-1 scope CLOUDFRONT) ───────────────────────
    with Cluster("Perímetro público — CloudFront + WAF\nenable_perimeter = true"):
        waf_cf = WAF("WebACL CLOUDFRONT\n(IpReputation + CommonRules\n+ KnownBadInputs)")
        cf     = CloudFront("CloudFront\nd1mfeyeo2bl6ug.cloudfront.net\nPriceClass_100")
        waf_cf - cf

    # ── API Gateway (HTTP API v2, sin WAF directo) ─────────────────────────────
    with Cluster("API Gateway v2\nenable_api_gateway = true\n(sin JWT authorizer activo)"):
        apigw = APIGateway("HTTP API\n$default stage\nVPC Link → ALB")

    # ── VPC 10.0.0.0/16 ───────────────────────────────────────────────────────
    with Cluster("VPC — 10.0.0.0/16 (us-east-1)"):

        igw = InternetGateway("Internet Gateway")
        nat = NATGateway("NAT Gateway\n(single, us-east-1a)")

        with Cluster("Subnets públicas\n10.0.1.0/24 · 10.0.2.0/24\nus-east-1a · us-east-1b"):
            alb = ElasticLoadBalancing(
                "ALB\ninfra-proyecto-dev-app-alb\n:80 → EC2:3000\nSG: solo CloudFront prefix list"
            )

        with Cluster("Subnets privadas\n10.0.10.0/24 · 10.0.11.0/24\nus-east-1a · us-east-1b"):

            with Cluster("Compute\nenable_test_instance + enable_compute_group"):
                ec2  = EC2("EC2 t3.micro\n(phase4-smoke-app)\nAmazon Linux 2023")
                asg  = AutoScaling("ASG 1-2 × t3.micro\nLaunch Template\nAmazon Linux 2023")

            with Cluster("Data"):
                aurora = Aurora(
                    "Aurora PostgreSQL\n(modo express —\ncluster externo\n'database-1')"
                )
                redis  = ElastiCache(
                    "ElastiCache Redis 7.0\n2 × cache.t4g.micro\nencriptado en tránsito+reposo"
                )

        with Cluster("Storage"):
            s3 = S3("S3 Bucket\ninfra-proyecto-dev-storage-\nphase3-example\n(versioning ON)")

    # ── Observabilidad ─────────────────────────────────────────────────────────
    with Cluster("Observabilidad"):
        cw  = Cloudwatch(
            "CloudWatch\nLog groups:\n/infra-proyecto/dev/system\n/infra-proyecto/dev/app\n"
            "Alarmas: EC2 CPU, EC2 StatusCheck,\nAurora CPU (umbral 80%)"
        )
        sns = SNS("SNS Topic\nobservability-alerts\n(sin email subscriptor\nen dev.tfvars)")

    # ── Flujo de tráfico principal ─────────────────────────────────────────────
    users >> Edge(label="HTTPS") >> cf
    cf   >> Edge(label="HTTP :80\n(WAF inspecciona)") >> alb

    # API Gateway como path alternativo (no pasa por CloudFront)
    users >> Edge(label="HTTPS\n(sin WAF directo)", style="dashed", color="orange") >> apigw
    apigw >> Edge(label="VPC Link\nHTTP :80", style="dashed", color="orange") >> alb

    # ALB → computo
    alb >> Edge(label=":3000") >> ec2
    alb >> Edge(label=":3000") >> asg

    # NAT para salida privada
    ec2  >> Edge(label="egress\n:443 SSM / S3", style="dotted") >> nat
    asg  >> Edge(label="egress\n:443 SSM / S3", style="dotted") >> nat
    nat  >> igw

    # Computo → datos
    ec2  >> Edge(label=":5432") >> aurora
    ec2  >> Edge(label=":6379") >> redis
    asg  >> Edge(label=":5432") >> aurora
    asg  >> Edge(label=":6379") >> redis

    # Computo → S3 (artefactos / config)
    ec2  >> Edge(label="S3 GetObject\n(artefactos)") >> s3
    asg  >> Edge(label="S3 GetObject\n(artefactos)") >> s3

    # Computo → Secrets Manager
    ec2  >> Edge(label="GetSecretValue", style="dotted") >> secret_aurora
    ec2  >> Edge(label="GetSecretValue", style="dotted") >> secret_redis
    ec2  >> Edge(label="GetSecretValue", style="dotted") >> secret_app
    asg  >> Edge(label="GetSecretValue", style="dotted") >> secret_aurora
    asg  >> Edge(label="GetSecretValue", style="dotted") >> secret_redis

    # Observabilidad
    ec2  >> Edge(label="CloudWatch Agent\nlogs + métricas", style="dotted", color="gray") >> cw
    asg  >> Edge(label="métricas", style="dotted", color="gray") >> cw
    aurora >> Edge(label="CPUUtilization", style="dotted", color="gray") >> cw
    cw   >> Edge(label="alarmas") >> sns

    # Cognito — creado pero no conectado al APIGW (enable_jwt_authorizer=false)
    cognito  # referenciado pero sin flecha activa hacia APIGW en dev
