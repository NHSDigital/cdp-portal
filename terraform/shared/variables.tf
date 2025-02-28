/* Variables required by this module to allow configuration of the provisioned resources */
/* The source of truth for this file is terraform/shared/variables.tf it's symlinked elsewhere */

variable "environment" {
  type        = string
  description = "The identifier for the path to live aws accounts (dev|ref|int|prod)"
}

variable "environment_prefix" {
  default = ""
}

variable "admin_roles" {
  type = list(string)
}

variable "cidr_range" {
  type = string
}

variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "dare_management_account_id" {
  type = string
}

variable "dare_orchestration_account_id" {
  type = string
}

variable "dare_access_account_id" {
  type = string
}

variable "image_tag" {
  type = string
}

variable "keycloak_endpoint_service_name" {
  type        = string
  description = "Interface endpoint service name for keycloak"
}

variable "access_s3_kms_key_id" {
  type        = string
  description = "The id of the kms key used to encrypt s3 buckets in access"
}

variable "sso_admin_role_names" {
  type        = list(string)
  description = "The names of the SSO roles to give KMS admin to, like 'Admin' or 'datarefinery_developer'"
}

variable "permissions_api_gateway_id" {
  type        = string
  description = "The id of the api gateway"
}

variable "portal_hosted_zone_id" {
  default = ""
}

variable "env_portal_subdomain_name" {
  default = ""
}

variable "ses_domain_identity_arn" {
  default = ""
}

variable "ecr_replication_source" {
  default = false
}

variable "ecr_replication_destination" {
  default = false
}

variable "maintenance_mode" {
  description = "Enable or disable maintenance mode for the portal"
  type        = bool
  default     = false
}

variable "keycloak_url" {
  type        = string
  description = "Keycloak URL which holds portal credentials"
}

variable "log_delivery_bucket_name" {
  type        = string
  description = "Bucket name for where logs will be stored"
}