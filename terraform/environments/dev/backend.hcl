# S3 Backend Configuration for Terraform State
# Usage: terraform init -backend-config=backend.hcl

bucket         = "infra-proyecto-dev-terraform-state"
key            = "dev/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "infra-proyecto-dev-terraform-locks"
encrypt        = true
