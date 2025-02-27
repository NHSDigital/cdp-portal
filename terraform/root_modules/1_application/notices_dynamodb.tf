# trivy:ignore:aws-dynamodb-enable-recovery not important to recover this database
resource "aws_dynamodb_table" "notices" {
  name         = "${var.environment_prefix}Notices"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "noticeId"

  attribute {
    name = "noticeId"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = module.dynamodb_kms_key.key_arn
  }

  lifecycle {
    prevent_destroy = true
  }

  ttl {
    attribute_name = "expiryPeriod"
    enabled        = true
  }

}

data "aws_iam_policy_document" "allow_dynamodb_kms_access" {
  statement {
    sid    = "Allow access through Amazon DynamoDB for all principals in the account that are authorized to use Amazon DynamoDB"
    effect = "Allow"

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey",
      "kms:CreateGrant"
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

module "dynamodb_kms_key" {
  source = "../../modules/kms_key"

  alias_name  = "alias/${var.environment_prefix}portal/dynamodb_kms_key" //NOSONAR
  policies    = [data.aws_iam_policy_document.allow_dynamodb_kms_access.json]
  environment = var.environment

  admin_role_arns      = local.kms_key_owner_arns
  sso_admin_role_names = var.sso_admin_role_names
}

data "aws_iam_policy_document" "use_notices_db_kms_key" {
  statement {
    sid    = "AllowUseOfNoticesDatabaseKey"
    effect = "Allow"
    resources = [
      module.dynamodb_kms_key.key_arn
    ]
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncryptFrom",
      "kms:ReEncryptTo",
      "kms:ReEncryptOnSameKey",
      "kms:GenerateDataKey",
      "kms:GenerateDataKeyPair",
      "kms:GenerateDataKeyPairWithoutPlaintext",
      "kms:GenerateDataKeyWithoutPlaintext",
      "kms:DescribeKey",
      "kms:CreateGrant"
    ]
  }
}

data "aws_iam_policy_document" "read_from_notices_db" {
  source_policy_documents = [data.aws_iam_policy_document.use_notices_db_kms_key.json]

  statement {
    sid    = "AllowReadNoticesDatabase"
    effect = "Allow"
    # trivy:ignore:aws-iam-no-policy-wildcards The wildcard resource is just the indexes of one specific table, which is not that sensitive
    resources = [
      aws_dynamodb_table.notices.arn,
      "${aws_dynamodb_table.notices.arn}/index/*"
    ]
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
  }
}

data "aws_iam_policy_document" "write_to_notices_db" {
  source_policy_documents = [data.aws_iam_policy_document.read_from_notices_db.json]

  statement {
    sid    = "AllowWriteNoticesDatabase"
    effect = "Allow"
    resources = [
      aws_dynamodb_table.notices.arn
    ]
    actions = [
      "dynamodb:BatchWriteItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem"
    ]
  }
}

resource "aws_iam_policy" "read_from_notices_db" {
  policy = data.aws_iam_policy_document.read_from_notices_db.json
  name   = "${var.environment_prefix}read_from_notices_db"
}

resource "aws_iam_policy" "write_to_notices_db" {
  policy = data.aws_iam_policy_document.write_to_notices_db.json
  name   = "${var.environment_prefix}write_to_notices_db"
}
