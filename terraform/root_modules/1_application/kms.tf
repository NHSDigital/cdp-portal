# KMS Key for AWS S3
data "aws_iam_policy_document" "allow_s3_kms_access" {
  statement {
    actions = [
      "kms:GenerateDataKey*",
      "kms:Encrypt"
    ]

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.portal_task.arn]
    }

    resources = [
      "*"
    ]
  }

  statement {
    actions = [
      "kms:GenerateDataKey*",
      "kms:Decrypt",
      "kms:Encrypt"
    ]

    principals {
      type        = "AWS"
      identifiers = [module.data_in_forwarder_lambda.iam_role_arn]
    }

    resources = [
      "*"
    ]
  }

}

module "s3_kms_key" {
  source = "../../modules/kms_key"

  alias_name  = "alias/${var.environment_prefix}portal/s3_kms_key" //NOSONAR
  policies    = [data.aws_iam_policy_document.allow_s3_kms_access.json]
  environment = var.environment

  admin_role_arns      = local.kms_key_owner_arns
  sso_admin_role_names = var.sso_admin_role_names
}
