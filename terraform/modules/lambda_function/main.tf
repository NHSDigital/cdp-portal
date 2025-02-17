data "aws_iam_policy_document" "lambda_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      identifiers = ["lambda.amazonaws.com"]
      type        = "Service"
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "${var.name}_lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json
  tags               = { Name = "${var.name}_lambda" }
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution_role" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

module "func_log_group" {
  source = "../../modules/cloudwatch_log_group"

  name                       = "/aws/lambda/${var.name}" # Even when we create it ourselves, lambda will log to the group that matches this pattern
  kms_key_arn                = var.cloudwatch_log_kms_key_arn
  dare_management_account_id = var.dare_management_account_id
  environment                = var.environment
}

resource "aws_lambda_function" "func" {
  runtime          = var.runtime
  function_name    = var.name
  role             = aws_iam_role.lambda_role.arn
  filename         = var.zip_file_path
  source_code_hash = filebase64sha256(var.zip_file_path)
  handler          = "${local.handler_root}.lambda_handler"
  timeout          = var.timeout
  memory_size      = var.memory_size
  tags             = { Name = var.name }

  dynamic "vpc_config" {
    for_each = var.vpc_config[*]
    content {
      security_group_ids = vpc_config.value.security_group_ids
      subnet_ids         = vpc_config.value.subnet_ids
    }
  }

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = merge({ POWERTOOLS_SERVICE_NAME = var.name, LOG_LEVEL = "INFO" }, var.env_vars == null ? {} : var.env_vars)
  }

  depends_on = [module.func_log_group] # Just to ensure that we create it, not AWS
}

resource "aws_cloudwatch_log_metric_filter" "errors_metric_filter" {
  count = var.alert_on_error ? 1 : 0

  name           = "errors-metric-filter-${aws_lambda_function.func.function_name}"
  pattern        = "?\"ERROR\" ?\"EXCEPTION\" ?\"Task timed out after\""
  log_group_name = module.func_log_group.log_group_name

  metric_transformation {
    name      = "errors-${aws_lambda_function.func.function_name}"
    namespace = "vdi/lambda"
    value     = "1"
  }
}

# The below is removed until the implementation of slack alerts in the repo
resource "aws_cloudwatch_metric_alarm" "cloudwatch_metric_alarm" {
  count = var.alert_on_error ? 1 : 0

  alarm_name          = "${aws_lambda_function.func.function_name}_lambda_alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "errors-${aws_lambda_function.func.function_name}"
  namespace           = "vdi/lambda"
  period              = 10
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.sns_alert_topic]
}
