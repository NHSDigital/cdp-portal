variable "acl" {
  description = "(Optional) The canned ACL to apply. Defaults to 'private'."
  type        = string
  default     = "private"
}

variable "bucket_name" {
  description = "(Forces new resource) The name of the bucket."
  type        = string
}

variable "policies" {
  description = "(Optional) A list of valid bucket policy JSON documents. The documents will be merged into a single policy. Note that if the policy document is not specific enough (but still valid), Terraform may view the policy as constantly changing in a terraform plan. In this case, please make sure you use the verbose/specific version of the policy. For more information about building AWS IAM policy documents with Terraform, see the AWS IAM Policy Document Guide."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "(Optional) A mapping of tags to assign to the bucket."
  type        = map(string)
  default     = {}
}

variable "versioning_enabled" {
  description = "Defaults to true."
  type        = bool
  default     = true
}

variable "s3_kms_key_arn" {
  description = "The AWS KMS master key ID used for the SSE-KMS encryption."
  type        = string
}
