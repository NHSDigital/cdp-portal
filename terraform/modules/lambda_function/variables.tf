locals {
  handler_zip  = replace(var.zip_file_path, "/.*/build//", "")
  handler_root = replace(local.handler_zip, ".zip", "")
}

variable "name" { type = string }
variable "zip_file_path" { type = string }
variable "timeout" { default = 3 }
variable "runtime" { default = "python3.9" }
variable "memory_size" { default = "512" }
variable "env_vars" {
  type    = map(string)
  default = null
}
variable "alert_on_error" { default = true }
variable "cloudwatch_log_kms_key_arn" { type = string }
variable "dare_management_account_id" { type = string }
variable "environment" { type = string }

variable "vpc_config" {
  type    = object({ security_group_ids = list(string), subnet_ids = list(string) })
  default = null
}

variable "sns_alert_topic" {
  type = string
}