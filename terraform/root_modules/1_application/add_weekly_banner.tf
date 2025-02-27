module "add_weekly_banner_lambda" {
  source = "../../modules/lambda_function"

  name          = "${var.environment_prefix}add_weekly_banner"
  zip_file_path = "${path.module}/../../../build/add_weekly_banner.zip"

  cloudwatch_log_kms_key_arn = module.cloudwatch_log_kms_key.key_arn
  sns_alert_topic            = aws_sns_topic.slack_alert_topic_errors.arn
  dare_management_account_id = var.dare_management_account_id
  environment                = var.environment
  env_vars = {
    DDB_NOTICES_TABLE_NAME = "${var.environment_prefix}Notices"
  }
}

resource "aws_iam_role_policy_attachment" "add_weekly_banner" {
  policy_arn = aws_iam_policy.write_to_notices_db.arn
  role       = module.add_weekly_banner_lambda.iam_role_name
}

resource "aws_cloudwatch_event_rule" "trigger_weekly_on_thursday" {
  name        = "${var.environment_prefix}trigger_weekly_on_thursday"
  description = "Schedule for triggering Lambda function"

  schedule_expression = "cron(0 3 ? * 5 *)" # This triggers the Lambda every Thursday at 3AM
}

resource "aws_lambda_permission" "allow_eventbridge_to_invoke_add_weekly_banner" {
  statement_id  = "AllowEventBridgeToInvokeAddWeeklyBanner"
  action        = "lambda:InvokeFunction"
  function_name = module.add_weekly_banner_lambda.function_arn
  principal     = "events.amazonaws.com"

  source_arn = aws_cloudwatch_event_rule.trigger_weekly_on_thursday.arn
}

resource "aws_cloudwatch_event_target" "weekly_banner" {
  rule      = aws_cloudwatch_event_rule.trigger_weekly_on_thursday.name
  target_id = "WeeklyBanner"
  arn       = module.add_weekly_banner_lambda.function_arn
}
