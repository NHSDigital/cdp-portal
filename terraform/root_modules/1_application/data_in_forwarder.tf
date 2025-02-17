locals {
  access_import_data_pending_bucket_arn = "arn:aws:s3:::${local.access_import_data_pending_bucket_name}"
  source_email_address                  = "noreply@${local.portal_full_domain_name}"
  access_s3_kms_key_arn                 = "arn:aws:kms:eu-west-2:${var.dare_access_account_id}:key/${var.access_s3_kms_key_id}"
}

module "data_in_forwarder_lambda" {
  source = "../../modules/lambda_function"

  name          = "${var.environment_prefix}data_in_forwarder"
  zip_file_path = "${path.module}/../../../build/data_in_forwarder.zip"

  cloudwatch_log_kms_key_arn = module.cloudwatch_log_kms_key.key_arn
  dare_management_account_id = var.dare_management_account_id
  sns_alert_topic            = aws_sns_topic.slack_alert_topic_errors.arn
  environment                = var.environment

  env_vars = {
    IMPORT_DATA_PENDING_BUCKET_NAME  = local.access_import_data_pending_bucket_name
    IMPORT_DATA_REJECTED_BUCKET_NAME = module.data_in_validation_rejected.id
    SOURCE_EMAIL_ADDRESS             = local.source_email_address
    MAX_DATA_SIZE_IN_BYTES           = "1048576"
  }
}

data "aws_iam_policy_document" "data_in_forwarder_policy" {
  statement {
    actions = [
      "s3:ListBucket",
      "s3:PutObject",
      "s3:PutObjectAcl"
    ]
    #trivy:ignore:aws-iam-no-policy-wildcards
    resources = [
      local.access_import_data_pending_bucket_arn,
      "${local.access_import_data_pending_bucket_arn}/*"
    ]
  }

  statement {
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:DeleteObject"
    ]
    #trivy:ignore:aws-iam-no-policy-wildcards
    resources = [
      module.data_in_landing.arn,
      "${module.data_in_landing.arn}/*"
    ]
  }

  statement {
    actions = [
      "s3:ListBucket",
      "s3:PutObject",
      "s3:PutObjectAcl"
    ]
    #trivy:ignore:aws-iam-no-policy-wildcards
    resources = [
      module.data_in_validation_rejected.arn,
      "${module.data_in_validation_rejected.arn}/*"
    ]
  }

  statement {
    actions = ["ses:SendEmail"]

    #trivy:ignore:aws-iam-no-policy-wildcards We might be able to remove this wildcard
    resources = local.all_aws_accounts ? [aws_ses_domain_identity.root_zone.0.arn, "${aws_ses_domain_identity.root_zone.0.arn}/*"] : [var.ses_domain_identity_arn, "${var.ses_domain_identity_arn}/*"]
  }

  statement {
    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:ReEncryptTo",
      "kms:ListAliases"
    ]

    resources = [local.access_s3_kms_key_arn]
  }
}

resource "aws_iam_policy" "data_in_forwarder" {
  name   = module.data_in_forwarder_lambda.iam_role_name
  policy = data.aws_iam_policy_document.data_in_forwarder_policy.json
}

resource "aws_iam_role_policy_attachment" "data_in_forwarder" {
  policy_arn = aws_iam_policy.data_in_forwarder.arn
  role       = module.data_in_forwarder_lambda.iam_role_name
}


resource "aws_lambda_permission" "data_in_forwarder_lambda" {
  statement_id   = "AllowExecutionFromS3Bucket"
  action         = "lambda:InvokeFunction"
  function_name  = module.data_in_forwarder_lambda.function_arn
  principal      = "s3.amazonaws.com"
  source_account = local.account_id # This might seem redundant, but we need it here to silence an AWS Security Hub alert
  source_arn     = module.data_in_landing.arn
}

resource "aws_s3_bucket_notification" "data_in_forwarder_lambda" {
  bucket = module.data_in_landing.id

  lambda_function {
    lambda_function_arn = module.data_in_forwarder_lambda.function_arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.data_in_forwarder_lambda]
}
