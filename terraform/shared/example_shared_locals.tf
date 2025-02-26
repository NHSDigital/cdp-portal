# Description: This is an example Terraform variable file (example_shared_locals.tf) with dummy values.
# It's used to demonstrate the structure and types of variables common across different modules.
data "aws_iam_account_alias" "this" {}
data "aws_caller_identity" "this" {}
data "aws_region" "this" {}
data "aws_canonical_user_id" "this" {}

locals {
  terraform_state_bucket_name               = "${data.aws_iam_account_alias.this.account_alias}-tfstate"
  account_id                                = data.aws_caller_identity.this.account_id
  region                                    = data.aws_region.this.name
  user_id                                   = data.aws_canonical_user_id.this.id
  project                                   = element(split("/", abspath(path.module)), length(split("/", abspath(path.module))) - 4)
  root_module                               = element(split("/", abspath(path.module)), length(split("/", abspath(path.module))) - 1)
  repo                                      = "https://github.com/NHSDigital/cdp-portal"
  canary_artifacts_bucket_prefix            = "example_bucket_prefix"
  data_in_landing_bucket_suffix             = "example_bucket_suffix"
  data_in_validation_rejected_bucket_suffix = "example_bucket_suffix"
  keycloak_url_suffix                       = "example_url_suffix"
  elb_account_id_eu_west_2                  = "example_aws_account_id"
  feature_flag_user_management              = "off"
  feature_flag_induction                    = "off"
  feature_flag_password_setup_flow          = "off"

  dare_portal_dev_account_id  = "example_aws_account_id"
  dare_portal_test_account_id = "example_aws_account_id"
  dare_portal_int_account_id  = "example_aws_account_id"
  dare_portal_prod_account_id = "example_aws_account_id"

  dev_envs = can(regex("dev", var.environment))
  dev_env  = contains(["dev"], var.environment)
  prod_env = contains(["prod"], var.environment)

  nonprod_aws_accounts = contains(["dev", "test", "int"], var.environment)
  all_aws_accounts     = contains(["dev", "test", "int", "prod"], var.environment)
  aws_account_env      = replace(var.environment, "/[[:digit:]]/", "")

  log_delivery_bucket_name = "example_bucket_prefix-${var.environment}-alb-audit-logs"
  log_delivery_path        = "audit-logs-${var.environment}"

  access_import_data_pending_bucket_name = "nhsd-${var.environment}-import-data-pending"

  # NB: We want to keep tags to a maximum of 10 as S3 Object tags cannot be greater than 10
  default_tags = {
    repo      = local.repo
    Service   = "example_service"
    Component = "Portal"
    Owner     = "Platform_Team"
    P-Env     = var.environment
    Role      = local.root_module
    Workload  = "Platform"
  }
}
