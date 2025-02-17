locals {
  script_file_contents = file("${path.module}/src/portal-service-canary/portal-service-canary.py")
  //Ensures that canary is redeployed whenever script is modified
  zip = "${path.module}/files/portal-service-canary-${sha256(local.script_file_contents)}.zip"
}

data "archive_file" "portal_service_canary_src" {
  type        = "zip"
  output_path = local.zip

  source {
    content  = local.script_file_contents
    filename = "python/portal-service-canary.py"
  }
}

module "canary_artifacts_bucket" {
  source         = "../../modules/s3_bucket"
  bucket_name    = "${local.canary_artifacts_bucket_prefix}-${var.environment}"
  s3_kms_key_arn = module.s3_kms_key.key_arn
}

resource "aws_s3_bucket_lifecycle_configuration" "canary_artifacts_expiration" {
  bucket = module.canary_artifacts_bucket.id

  rule {
    id = "expire_all_canary_artifacts"

    filter {
      prefix = "canary/"
    }

    expiration {
      days = 31
    }

    status = "Enabled"
  }
}

module "portal_service_canary" {
  source                      = "../../modules/cloudwatch_synthetics_canary"
  environment                 = var.environment
  name                        = "portal_canary_${var.environment}"
  region                      = var.region
  canary_artifacts_bucket     = "s3://${module.canary_artifacts_bucket.id}"
  canary_artifacts_bucket_arn = module.canary_artifacts_bucket.arn
  handler                     = "portal-service-canary.handler"
  zip_file                    = local.zip
  s3_kms_key_arn              = module.s3_kms_key.key_arn
  cloudwatch_log_kms_key_arn  = module.cloudwatch_log_kms_key.key_arn
  dare_management_account_id  = var.dare_management_account_id
  canary_frequency            = "cron(*/5 * * * ? *)"
  sns_alert_topic             = aws_sns_topic.slack_alert_topic_errors.arn

  env_vars = {
    PORTAL_URL = "https://${aws_route53_record.portal.fqdn}"
  }
  depends_on = [module.canary_artifacts_bucket]
}
