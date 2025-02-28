resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  tags   = var.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_ownership_controls" "this" {
  depends_on = [aws_s3_bucket.this]
  bucket     = aws_s3_bucket.this.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "this" {
  depends_on = [aws_s3_bucket_ownership_controls.this]
  bucket     = aws_s3_bucket.this.id
  acl        = var.acl
}

resource "aws_s3_bucket_versioning" "this" {
  count = var.versioning_enabled ? 1 : 0

  bucket = aws_s3_bucket.this.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "this" {
  bucket        = aws_s3_bucket.this.id
  target_bucket = aws_s3_bucket.log_bucket.id
  target_prefix = "log/"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.s3_kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.id
  policy = data.aws_iam_policy_document.combined.json
}

data "aws_iam_policy_document" "allow_ssl_requests_only" {
  statement {
    sid       = "AllowSSLRequestsOnly"
    actions   = ["s3:*"]
    effect    = "Deny"
    resources = [aws_s3_bucket.this.arn, "${aws_s3_bucket.this.arn}/*"]

    condition {
      test     = "Bool"
      values   = ["false"]
      variable = "aws:SecureTransport"
    }

    principals {
      type        = "*"
      identifiers = ["*"]
    }
  }
}

# data.aws_iam_policy_document.combined merges the allow_ssl_requests_only policy above 
# with whatever policies are supplied via var.policies variable. 
# It's fine if var.policies is not supplied, 
# then the merged policy will just be equivalent to allow_ssl_requests_only.
data "aws_iam_policy_document" "combined" {
  override_policy_documents = concat(
    [data.aws_iam_policy_document.allow_ssl_requests_only.json],
    var.policies,
  )
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

#trivy:ignore:aws-s3-enable-logging We probably don't need to log access to logs
#trivy:ignore:aws-s3-enable-versioning We probably don't need to version logs
resource "aws_s3_bucket" "log_bucket" {
  bucket = "${var.bucket_name}-log-bucket"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_ownership_controls" "log_bucket" {
  depends_on = [aws_s3_bucket.log_bucket]
  bucket     = aws_s3_bucket.log_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "log_bucket" {
  depends_on = [aws_s3_bucket_ownership_controls.log_bucket]
  bucket     = aws_s3_bucket.log_bucket.id
  acl        = "log-delivery-write"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_bucket" {
  bucket = aws_s3_bucket.log_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.s3_kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "log_bucket" {
  bucket = aws_s3_bucket.log_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "log_bucket" {
  bucket = aws_s3_bucket.log_bucket.id
  policy = data.aws_iam_policy_document.log_bucket_allow_ssl_requests_only.json
}

data "aws_iam_policy_document" "log_bucket_allow_ssl_requests_only" {
  statement {
    sid       = "AllowSSLRequestsOnly"
    actions   = ["s3:*"]
    effect    = "Deny"
    resources = [aws_s3_bucket.log_bucket.arn, "${aws_s3_bucket.log_bucket.arn}/*"]

    condition {
      test     = "Bool"
      values   = ["false"]
      variable = "aws:SecureTransport"
    }

    principals {
      type        = "*"
      identifiers = ["*"]
    }
  }
}
