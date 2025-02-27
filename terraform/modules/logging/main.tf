#trivy:ignore:aws-s3-encryption-customer-key - ALB logging bucket must be S3 encrypted
#trivy:ignore:aws-s3-enable-logging
module "log_delivery" {
  source               = "../../../submodules/s3_bucket/terraform"
  name                 = var.log_delivery_bucket_name
  encryption_type      = "AES256"
  additional_s3_policy = data.aws_iam_policy_document.alb_logging_access.json
}

# https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html
data "aws_iam_policy_document" "alb_logging_access" {
  statement {
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.elb_account_id_eu_west_2}:root"]
    }

    actions = [
      "s3:PutObject",
    ]

    resources = [
      "arn:aws:s3:::${var.log_delivery_bucket_name}/${var.log_delivery_path}/AWSLogs/${var.account_id}/*",
    ]
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logging_billing" {
  bucket = module.log_delivery.name

  rule {
    # There is a minimum object charge for objects smaller than 128KB in the IA storage class
    # This rule will move objects larger than 100KB to IA ofter 30 days to reduce costs
    # Then Glacier after 60 days
    id = "Move larger objects to IA"

    filter {
      and {
        object_size_greater_than = 131072
        prefix                   = "${var.log_delivery_path}/"
      }
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER"
    }

    status = "Enabled"
  }
}

resource "aws_s3_bucket_ownership_controls" "log_delivery" {
  bucket = module.log_delivery.name
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

module "audit_logs_to_cloudwatch" {
  source = "../../../submodules/s3_to_cloudwatch_lambda/terraform"

  trigger_type           = "EVENT"
  resource_name_prefix   = "portal-audit-logs"
  environment            = var.environment
  bucket_name            = module.log_delivery.name
  bucket_prefix          = var.log_delivery_path
  bucket_encryption_type = "S3"
  bucket_kms_key_arn     = null
  central_log_type       = "ops"
}