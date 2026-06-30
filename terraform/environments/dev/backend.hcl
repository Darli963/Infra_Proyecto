# S3 Backend Configuration for Terraform State
# Usage: terraform init -backend-config=backend.hcl

bucket         = "infra-proyecto-tfstate-darli963"
key            = "dev/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "infra-proyecto-tf-locks"
encrypt        = true
