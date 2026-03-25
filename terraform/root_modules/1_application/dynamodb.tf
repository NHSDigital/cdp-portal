resource "aws_dynamodb_table" "imports_workflow" {
  name             = "${var.environment_prefix}Imports"
  billing_mode     = "PAY_PER_REQUEST"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  hash_key = "requestId"

  attribute {
    name = "requestId"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = module.imports_dynamodb_kms_key.key_arn
  }

  point_in_time_recovery {
    enabled = true
  }

  lifecycle {
    prevent_destroy = false # This is set to fale so TF can destroy this table to update the hash_key. Will be updated to True in another ticket. 
  }
}

data "aws_iam_policy_document" "allow_dynamodb_kms_imports" {
  statement {
    sid    = "Allow access through Amazon DynamoDB for all principals in the account that are authorized to use Amazon DynamoDB"
    effect = "Allow"

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey",
      "kms:CreateGrant",
    ]

    principals {
      type        = "AWS"
      identifiers = [local.account_id]
    }

    resources = ["*"]

    condition {
      test     = "StringLike"
      variable = "kms:ViaService"

      values = ["dynamodb.*.amazonaws.com"]
    }
  }
}

module "imports_dynamodb_kms_key" {
  source = "../../modules/kms_key"

  environment              = var.environment
  alias_name               = "alias/${var.environment_prefix}portal/imports_dynamodb_kms_key"
  admin_role_arns          = local.kms_key_owner_arns
  sso_admin_role_names     = var.sso_admin_role_names
  sso_read_only_role_names = var.sso_read_only_role_names
  policies                 = [data.aws_iam_policy_document.allow_dynamodb_kms_imports.json]
}