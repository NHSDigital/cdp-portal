resource "aws_lambda_permission" "trigger_with_sns_errors" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = module.slack_alert.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.slack_alert_topic_errors.arn
}

data "aws_iam_policy_document" "allow_sns_topic_kms_access" {
  statement {
    actions = [
      "kms:GenerateDataKey*",
      "kms:DescribeKey",
      "kms:Decrypt",
      "kms:Encrypt"
    ]

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com", "events.amazonaws.com"]
    }

    resources = [
      "*"
    ]
  }
}

module "sns_topic_kms_key" {
  source = "../../modules/kms_key"

  alias_name  = "alias/${var.environment_prefix}portal/sns_topic_kms_key" // NOSONAR
  environment = var.environment
  policies    = [data.aws_iam_policy_document.allow_sns_topic_kms_access.json]

  admin_role_arns      = local.kms_key_owner_arns
  sso_admin_role_names = var.sso_admin_role_names
}

module "slack_alert" {
  source = "../../modules/lambda_function"

  name          = "${var.environment_prefix}slack_alert"
  zip_file_path = "${path.module}/../../../build/slack_alert.zip"

  cloudwatch_log_kms_key_arn = module.cloudwatch_log_kms_key.key_arn
  sns_alert_topic            = aws_sns_topic.slack_alert_topic_errors.arn
  alert_on_error             = false
  dare_management_account_id = var.dare_management_account_id
  environment                = var.environment

  env_vars = {
    SLACK_HOOK_URL = data.aws_secretsmanager_secret_version.slack_webhook.secret_string
  }
}

data "aws_iam_policy_document" "read_cloudwatch_events" {
  statement {
    actions = ["logs:DescribeMetricFilters", "logs:FilterLogEvents"]
    #tfsec:ignore:aws-iam-no-policy-wildcards Rather than enumerate all of the groups, just let the slack alerts lambda read all
    resources = ["arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:*"]
  }
}

resource "aws_iam_policy" "read_cloudwatch_events" {
  policy = data.aws_iam_policy_document.read_cloudwatch_events.json
  name   = "${var.environment_prefix}read_cloudwatch_events"
}

resource "aws_iam_role_policy_attachment" "read_cloudwatch_events" {
  role       = module.slack_alert.iam_role_name
  policy_arn = aws_iam_policy.read_cloudwatch_events.arn
}

resource "aws_secretsmanager_secret" "slack_webhook" {
  name       = "${var.environment_prefix}secret/slackalerts/webhook"
  kms_key_id = module.secrets_kms_key.key_arn
}

data "aws_secretsmanager_secret_version" "slack_webhook" {
  secret_id = aws_secretsmanager_secret.slack_webhook.id
}

resource "aws_sns_topic" "slack_alert_topic_errors" {
  name              = "${var.environment_prefix}slack-alert-topic-errors"
  kms_master_key_id = module.sns_topic_kms_key.alias
}

resource "aws_sns_topic_policy" "sns_topic_policy_linker" {
  arn    = aws_sns_topic.slack_alert_topic_errors.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}

data "aws_iam_policy_document" "sns_topic_policy" {
  statement {
    actions = [
      "sns:Publish"
    ]

    resources = [
      aws_sns_topic.slack_alert_topic_errors.arn
    ]

    principals {
      type = "Service"
      identifiers = [
        "cloudwatch.amazonaws.com",
        "events.amazonaws.com",
      ]
    }
  }
}

resource "aws_sns_topic_subscription" "slack_alert_errors" {
  topic_arn = aws_sns_topic.slack_alert_topic_errors.arn
  protocol  = "lambda"
  endpoint  = module.slack_alert.function_arn
}
