terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region                      = var.aws_region
  skip_credentials_validation = var.skip_aws_validation
  skip_metadata_api_check     = var.skip_aws_validation
  skip_requesting_account_id  = var.skip_aws_validation
}

provider "aws" {
  alias                       = "us_east_1"
  region                      = "us-east-1"
  skip_credentials_validation = var.skip_aws_validation
  skip_metadata_api_check     = var.skip_aws_validation
  skip_requesting_account_id  = var.skip_aws_validation
}
