variable "policies" {
  description = "(Optional) A list of valid bucket policy JSON documents. The documents will be merged into a single policy. Note that if the policy document is not specific enough (but still valid), Terraform may view the policy as constantly changing in a terraform plan. In this case, please make sure you use the verbose/specific version of the policy. For more information about building AWS IAM policy documents with Terraform, see the AWS IAM Policy Document Guide."
  type        = list(string)
  default     = []
}

variable "alias_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "admin_role_arns" {
  type = list(string)
}

variable "sso_admin_role_names" {
  type        = list(string)
  description = "The names of the SSO roles to give KMS admin to, like 'Admin' or 'datarefinery_developer'"
}
