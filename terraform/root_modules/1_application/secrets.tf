module "secrets_kms_key" {
  source      = "../../modules/kms_key"
  alias_name  = "alias/${var.environment_prefix}portal/secretsmanager_kms_key" //NOSONAR
  policies    = [data.aws_iam_policy_document.allow_secrets_kms_access.json]
  environment = var.environment

  admin_role_arns      = local.kms_key_owner_arns
  sso_admin_role_names = var.sso_admin_role_names
}

data "aws_iam_policy_document" "allow_secrets_kms_access" {
  statement {
    sid    = "Allow access through secretsmanager for the root principal"
    effect = "Allow"

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
      identifiers = [local.account_id]
    }

    resources = ["*"]

    condition {
      test     = "StringLike"
      variable = "kms:ViaService"

      values = ["secretsmanager.*.amazonaws.com"]
    }
  }
}

resource "aws_secretsmanager_secret" "portal_keycloak_secret" {
  name        = "${var.environment_prefix}keycloak/portal_client_secret" //NOSONAR
  description = "The portal's OpenID Client Secret in Keycloak"
  kms_key_id  = module.secrets_kms_key.key_arn
}

resource "aws_secretsmanager_secret" "nextauth_secret" {
  name        = "${var.environment_prefix}nextauth/encryption_secret" //NOSONAR
  description = "The secret used for encyption of the next auth JS JWT"
  kms_key_id  = module.secrets_kms_key.key_arn
}

data "aws_iam_policy_document" "use_secrets_kms_key" {
  statement {
    sid    = "AllowUseOfSecretsKey"
    effect = "Allow"
    resources = [
      module.secrets_kms_key.key_arn
    ]
    actions = [
      "kms:Decrypt"
    ]
  }
}

data "aws_iam_policy_document" "read_openidc_secrets" {
  source_policy_documents = [data.aws_iam_policy_document.use_secrets_kms_key.json]

  statement {
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      aws_secretsmanager_secret.portal_keycloak_secret.arn,
      aws_secretsmanager_secret.nextauth_secret.arn,
    ]
  }
}

resource "aws_iam_policy" "read_openidc_secrets" {
  name   = "${var.environment_prefix}read_openidc_secrets"
  policy = data.aws_iam_policy_document.read_openidc_secrets.json
}
