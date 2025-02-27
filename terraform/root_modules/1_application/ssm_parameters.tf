resource "aws_ssm_parameter" "feature_flag_user_management" {
  name        = "/${var.environment_prefix}portal/feature-flags/user-management"
  description = "The feature flag dictating whether the user management feature is enabled. Possible values are on/off/off_without_cookie"
  type        = "String"
  value       = local.feature_flag_user_management

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "feature_flag_induction" {
  name        = "/${var.environment_prefix}portal/feature-flags/induction"
  description = "The feature flag dictating whether the induction feature is enabled. Possible values are on/off/off_without_cookie"
  type        = "String"
  value       = local.feature_flag_induction

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "feature_flag_password_setup_flow" {
  name        = "/${var.environment_prefix}portal/feature-flags/password_setup_flow"
  description = "The feature flag dictating whether the password setup flow feature is enabled. Possible values are on/off"
  type        = "String"
  value       = local.feature_flag_password_setup_flow

  lifecycle {
    ignore_changes = [value]
  }
}
