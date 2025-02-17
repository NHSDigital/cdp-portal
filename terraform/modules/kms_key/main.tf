resource "aws_kms_key" "kms_key" {
  enable_key_rotation = true

  policy = data.aws_iam_policy_document.combined_kms_key_policy.json

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_kms_alias" "kms_key_alias" {
  name          = var.alias_name
  target_key_id = aws_kms_key.kms_key.key_id
}

# data.aws_iam_policy_document.combined merges the allow_ssl_requests_only policy above 
# with whatever policies are supplied via var.policies variable. 
# It's fine if var.policies is not supplied, 
# then the merged policy will just be equivalent to cloudtrail_kms_key_policy.
data "aws_iam_policy_document" "combined_kms_key_policy" {
  override_policy_documents = concat(
    [data.aws_iam_policy_document.allow_access_to_kms_key.json],
    var.policies,
  )
}

data "aws_iam_policy_document" "allow_access_to_kms_key" {
  statement {
    sid = "AllowAccessToKmsKey"
    actions = [
      "kms:*"
    ]

    principals {
      type        = "AWS"
      identifiers = var.admin_role_arns
    }

    resources = [
      "*"
    ]
  }
  statement {
    sid = "AllowSSOAccessToKmsKey"
    actions = [
      "kms:*"
    ]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    resources = ["*"]

    condition {
      test     = "ArnLike"
      variable = "aws:PrincipalArn"
      values = [
        for role_name in var.sso_admin_role_names :
        "arn:aws:iam::${data.aws_caller_identity.this.account_id}:role/aws-reserved/sso.amazonaws.com/eu-west-2/AWSReservedSSO_${role_name}_????????????????"
      ]
    }
  }
}

data "aws_caller_identity" "this" {}
