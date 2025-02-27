locals {
  account_env = contains(["int", "prod"], var.environment) ? var.environment : replace(var.environment, "/[[:digit:]]/", "")
}

variable "environment" {
  type = string
}

variable "name" {
  type = string
}

variable "canary_artifacts_bucket" {
  type = string
}

variable "canary_artifacts_bucket_arn" {
  type = string
}

variable "handler" {
  type = string
}

variable "runtime_version" {
  type    = string
  default = "syn-python-selenium-4.1"
}

variable "zip_file" {
  type = string
}

variable "start_canary" {
  type    = bool
  default = true
}

variable "canary_frequency" {
  type = string
}

variable "region" {
  type = string
}

variable "timeout_in_seconds" {
  type    = number
  default = 60
}

variable "s3_kms_key_arn" {
  type = string
}

variable "dare_management_account_id" {
  type = string
}

variable "cloudwatch_log_kms_key_arn" {
  type = string
}
variable "alert_on_error" {
  type    = bool
  default = true
}

variable "sns_alert_topic" {
  type = string
}

variable "vpc_config" {
  type    = object({ security_group_ids = list(string), subnet_ids = list(string) })
  default = null
}

variable "env_vars" {
  type    = map(string)
  default = null
}
