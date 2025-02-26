data "aws_iam_policy_document" "canary_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"

    principals {
      identifiers = ["lambda.amazonaws.com"]
      type        = "Service"
    }
  }
}

data "aws_iam_policy_document" "canary_policy_document" {
  statement {
    actions = [
      "ec2:DescribeNetworkInterfaces",
      "ec2:CreateNetworkInterface",
      "ec2:DeleteNetworkInterface"
    ]
    effect    = "Allow"
    resources = ["*"] #tfsec:ignore:aws-iam-no-policy-wildcards
  }

  statement {
    sid    = "CanaryS3BucketPermission"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject"
    ]
    #tfsec:ignore:aws-iam-no-policy-wildcards Wildcard is necessary to give access to all files in the specified buckets
    resources = [
      "${var.canary_artifacts_bucket_arn}/*"
    ]
  }

  statement {
    sid    = "CanaryS3BucketPermission2"
    effect = "Allow"
    actions = [
      "s3:GetBucketLocation"
    ]
    resources = [
      var.canary_artifacts_bucket_arn
    ]
  }

  statement {
    sid    = "CanaryS3ListBucketPermission"
    effect = "Allow"
    actions = [
      "s3:ListAllMyBuckets",
      "xray:PutTraceSegments"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CanaryCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    #tfsec:ignore:aws-iam-no-policy-wildcards Wildcard is necessary to create logs
    resources = ["*"]
  }

  statement {
    sid    = "CanaryCloudWatchAlarm"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData"
    ]
    resources = [
      "*"
    ]
    condition {
      test     = "StringEquals"
      values   = ["CloudWatchSynthetics"]
      variable = "cloudwatch:namespace"
    }
  }
}

resource "aws_iam_role" "canary_role" {
  name               = "${var.name}_role"
  assume_role_policy = data.aws_iam_policy_document.canary_assume_role_policy.json
  description        = "IAM role for AWS Synthetic Monitoring Canaries"

  tags = {
    Name = "${var.name}_role"
  }
}

resource "aws_iam_policy" "canary_policy" {
  name   = "${var.name}_policy"
  policy = data.aws_iam_policy_document.canary_policy_document.json
}
resource "aws_iam_role_policy_attachment" "canary_role_policy_attachment" {
  role       = aws_iam_role.canary_role.name
  policy_arn = aws_iam_policy.canary_policy.arn
}

resource "aws_synthetics_canary" "canary" {
  name                 = var.name
  artifact_s3_location = var.canary_artifacts_bucket
  execution_role_arn   = aws_iam_role.canary_role.arn
  handler              = var.handler
  runtime_version      = var.runtime_version
  zip_file             = var.zip_file
  start_canary         = var.start_canary

  schedule {
    expression          = var.canary_frequency
    duration_in_seconds = 0
  }

  run_config {
    timeout_in_seconds    = var.timeout_in_seconds
    environment_variables = var.env_vars
  }

  tags = {
    Name = var.name
  }
}

resource "aws_cloudwatch_metric_alarm" "canary_metric_alarm" {
  count = var.alert_on_error ? 1 : 0

  alarm_name          = "${var.name}_alarm"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SuccessPercent"
  namespace           = "CloudWatchSynthetics"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.sns_alert_topic]

  dimensions = {
    CanaryName = aws_synthetics_canary.canary.name
  }
}

resource "aws_cloudwatch_log_subscription_filter" "canary_subscription_filter" {
  name            = "${var.name}-subscription-filter"
  log_group_name  = "/aws/lambda/${element(split(":", aws_synthetics_canary.canary.engine_arn), 6)}"
  filter_pattern  = ""
  destination_arn = "arn:aws:logs:eu-west-2:${var.dare_management_account_id}:destination:ops-logs-destination-${local.account_env}"
}
