provider "aws" {
  region = "eu-west-2"
  default_tags {
    tags = {
      repo      = local.repo
      Service   = "Data Refinery"
      Component = "Portal"
      Owner     = "Platform Team"
      P-Env     = var.environment
      Role      = local.root_module
      Workload  = "Platform"
    }
  }
}

terraform {
  backend "s3" {
    key     = "portal-base.tfstate"
    region  = "eu-west-2"
    encrypt = true
  }

  required_version = "~> 1.10"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
