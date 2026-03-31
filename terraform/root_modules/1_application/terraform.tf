provider "aws" {
  region = "eu-west-2"
  default_tags {
    tags = local.default_tags
  }
}

terraform {
  required_providers {
    aws = {
      version = "~> 6.32"
    }
  }
  backend "s3" {
    key     = "portal-base.tfstate"
    region  = "eu-west-2"
    encrypt = true
  }

  required_version = "~> 1.14"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
