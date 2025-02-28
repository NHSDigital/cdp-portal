resource "aws_ecr_repository" "portal" {
  name                 = "${var.environment_prefix}portal"
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = module.ecr_kms_key.key_arn
  }

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Retain the latest 20 images only
data "aws_ecr_lifecycle_policy_document" "default_lifecycle_policy_document" {
  rule {
    priority    = 1
    description = "Retain image count: 200"

    selection {
      tag_status   = "any"
      count_type   = "imageCountMoreThan"
      count_number = 200
    }

    action {
      type = "expire"
    }
  }
}

resource "aws_ecr_lifecycle_policy" "default_lifecycle_policy" {
  repository = aws_ecr_repository.portal.name
  policy     = data.aws_ecr_lifecycle_policy_document.default_lifecycle_policy_document.json
}

locals {
  replication_source_account_id = local.dare_portal_dev_account_id
  replication_destination_account_ids = [
    local.dare_portal_test_account_id,
    local.dare_portal_int_account_id,
    local.dare_portal_prod_account_id,
  ]

  kms_key_owner_arns = [for role in var.admin_roles : "arn:aws:iam::${data.aws_caller_identity.this.account_id}:role/${role}"]
}

# Replication source config

data "aws_iam_policy_document" "replication_source_policy_doc" {
  count = var.ecr_replication_source ? 1 : 0

  statement {
    sid    = "ReplicationAccessCrossAccount"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [for account in local.replication_destination_account_ids : "arn:aws:iam::${account}:root"]
    }
    actions = ["ecr:ReplicateImage"]
    resources = [
      "arn:aws:ecr:eu-west-2:${data.aws_caller_identity.this.account_id}:repository/*portal"
    ]
  }
}

resource "aws_ecr_registry_policy" "replication_source" {
  count  = var.ecr_replication_source ? 1 : 0
  policy = data.aws_iam_policy_document.replication_source_policy_doc[0].json
}

resource "aws_ecr_replication_configuration" "replication_source_config" {
  count = var.ecr_replication_source ? 1 : 0

  replication_configuration {
    rule {
      dynamic "destination" {
        for_each = local.replication_destination_account_ids
        content {
          region      = "eu-west-2"
          registry_id = destination.value
        }
      }

      repository_filter {
        filter      = aws_ecr_repository.portal.name
        filter_type = "PREFIX_MATCH"
      }
    }
  }
}

# Replication destination config

data "aws_iam_policy_document" "replication_destination_policy_doc" {
  count = var.ecr_replication_destination ? 1 : 0

  statement {
    sid    = "ReplicationAccessCrossAccount"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.replication_source_account_id}:root"]
    }
    actions = ["ecr:ReplicateImage"]
    resources = [
      "arn:aws:ecr:eu-west-2:${data.aws_caller_identity.this.account_id}:repository/*portal"
    ]
  }
}

resource "aws_ecr_registry_policy" "replication_destination" {
  count  = var.ecr_replication_destination ? 1 : 0
  policy = data.aws_iam_policy_document.replication_destination_policy_doc[0].json
}

module "ecr_kms_key" {
  source = "../../modules/kms_key"

  alias_name  = "alias/${var.environment_prefix}portal/ecr_kms_key" //NOSONAR
  environment = var.environment
  policies    = [data.aws_iam_policy_document.allow_ecs_access_to_kms_key.json]

  admin_role_arns      = local.kms_key_owner_arns
  sso_admin_role_names = var.sso_admin_role_names
}

data "aws_iam_policy_document" "allow_ecs_access_to_kms_key" {
  statement {
    sid = "AllowECSAccessToKmsKey"
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

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.portal_execution.arn]
    }

    resources = [
      "*"
    ]
  }
}
