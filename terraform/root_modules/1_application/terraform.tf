provider "aws" {
  region = "eu-west-2"
  default_tags {
    tags = local.default_tags
  }
}

terraform {
  required_providers {
    aws = {
      version = "~> 6.0, != 6.14.0"
    }
  }
  backend "s3" {
    key     = "portal-base.tfstate"
    region  = "eu-west-2"
    encrypt = true
  }

  required_version = "~> 1.12"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
