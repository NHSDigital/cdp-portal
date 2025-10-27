locals {
  allowed_cors_origins = local.dev_envs ? ["http://localhost:3000", "https://${local.portal_full_domain_name}"] : ["https://${local.portal_full_domain_name}"] //NOSONAR
}

module "data_in_landing" {
  source = "../../modules/s3_bucket"

  bucket_name    = "nhsd-${var.environment}-${local.data_in_landing_bucket_suffix}"
  s3_kms_key_arn = module.s3_kms_key.key_arn
  tags = {
    Description = "Landing bucket for data uploaded through the portal"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "data_in_landing_bucket" {
  bucket = module.data_in_landing.id
  rule {
    id     = "NoncurrentVersionExpirationRule"
    status = "Enabled"
    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    expiration {
      expired_object_delete_marker = true
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 30
    }
  }
  depends_on = [module.data_in_landing]
}
resource "aws_s3_bucket_cors_configuration" "data_in_landing" {
  bucket = module.data_in_landing.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["POST"]
    allowed_origins = local.allowed_cors_origins
  }
}

module "data_in_validation_rejected" {
  source = "../../modules/s3_bucket"

  bucket_name    = "nhsd-${var.environment}-${local.data_in_validation_rejected_bucket_suffix}"
  s3_kms_key_arn = module.s3_kms_key.key_arn
  tags = {
    Description = "Storage for uploaded data that fails automatic validation"
  }
}
