module "ecs_logs" {
  source = "../../modules/cloudwatch_log_group"

  name                       = "/${var.environment_prefix}portal/portal-docker-logs"
  kms_key_arn                = module.cloudwatch_log_kms_key.key_arn
  dare_management_account_id = var.dare_management_account_id
  environment                = var.environment
}

data "aws_iam_policy_document" "allow_cloudwatch_logs_kms_access" {
  statement {
    actions = [
      "kms:GenerateDataKey*",
      "kms:DescribeKey",
      "kms:Decrypt",
      "kms:Encrypt"
    ]

    principals {
      type        = "Service"
      identifiers = ["logs.amazonaws.com"]
    }

    resources = [
      "*"
    ]
  }
}

module "cloudwatch_log_kms_key" {
  source = "../../modules/kms_key"

  alias_name  = "alias/${var.environment_prefix}portal/cloudwatch_log_kms_key"
  environment = var.environment
  policies    = [data.aws_iam_policy_document.allow_cloudwatch_logs_kms_access.json]

  admin_role_arns      = local.kms_key_owner_arns
  sso_admin_role_names = var.sso_admin_role_names
}
