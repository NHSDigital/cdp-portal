locals {
  account_env = contains(["int", "prod"], var.environment) ? var.environment : replace(var.environment, "/[[:digit:]]/", "")
}

variable "environment" { type = string }

variable "dare_management_account_id" {
  type = string
}

variable "name" {
  type = string
}

variable "kms_key_arn" {
  type = string
}

variable "filter_pattern" {
  type    = string
  default = ""
}
