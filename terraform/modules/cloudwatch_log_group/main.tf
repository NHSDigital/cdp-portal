resource "aws_cloudwatch_log_group" "this" {
  name       = var.name
  kms_key_id = var.kms_key_arn

  tags = {
    Name = var.name
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cloudwatch_log_subscription_filter" "subscription_filter" {
  name            = "${aws_cloudwatch_log_group.this.name}-subscription-filter"
  log_group_name  = aws_cloudwatch_log_group.this.name
  filter_pattern  = var.filter_pattern
  destination_arn = "arn:aws:logs:eu-west-2:${var.dare_management_account_id}:destination:app-logs-destination-${local.account_env}"
}
