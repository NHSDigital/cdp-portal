resource "aws_wafv2_web_acl" "portal" {
  name  = "${var.environment_prefix}portal-acl"
  scope = "REGIONAL"

  default_action {
    block {}
  }

  rule {
    name     = "${var.environment_prefix}non-gb"
    priority = 1

    action {
      allow {}
    }
    statement {
      geo_match_statement {
        country_codes = ["GB"]
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.environment_prefix}non-gb"
      sampled_requests_enabled   = false
    }
  }

  rule {
    name     = "${var.environment_prefix}ddos-protection"
    priority = 2

    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit = 10000
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.environment_prefix}ddos-protection"
      sampled_requests_enabled   = false
    }
  }

  rule {
    name     = "${var.environment_prefix}bot-control"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesBotControlRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.environment_prefix}bot-control"
      sampled_requests_enabled   = false
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = false
    metric_name                = "${var.environment_prefix}portal-acl"
    sampled_requests_enabled   = false
  }
}

module "portal_waf" {
  source = "../../modules/cloudwatch_log_group"

  name                       = "aws-waf-logs-${var.environment_prefix}portal"
  kms_key_arn                = module.cloudwatch_log_kms_key.key_arn
  dare_management_account_id = var.dare_management_account_id
  environment                = var.environment
}

resource "aws_wafv2_web_acl_logging_configuration" "portal" {
  log_destination_configs = [module.portal_waf.log_group_arn]
  resource_arn            = aws_wafv2_web_acl.portal.arn
}
