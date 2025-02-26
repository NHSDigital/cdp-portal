resource "aws_iam_role" "portal_execution" {
  name               = "${var.environment_prefix}portal_execution"
  assume_role_policy = data.aws_iam_policy_document.allow_ecs_to_assume.json
}

data "aws_iam_policy_document" "allow_ecs_to_assume" {
  statement {
    sid    = ""
    effect = "Allow"

    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.this.account_id]
    }
  }
}

resource "aws_iam_role_policy_attachment" "portal_ecs_task_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  role       = aws_iam_role.portal_execution.id
}

resource "aws_iam_role_policy_attachment" "read_openidc_secrets" {
  policy_arn = aws_iam_policy.read_openidc_secrets.arn
  role       = aws_iam_role.portal_execution.id
}

resource "aws_iam_role" "portal_task" {
  name               = "${var.environment_prefix}portal_task"
  assume_role_policy = local.dev_envs ? data.aws_iam_policy_document.allow_ecs_and_developer_to_assume.json : data.aws_iam_policy_document.allow_ecs_to_assume.json
}

data "aws_iam_policy_document" "allow_ecs_and_developer_to_assume" {
  source_policy_documents = [data.aws_iam_policy_document.allow_ecs_to_assume.json]

  statement {
    effect = "Allow"

    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.account_id}:role/Developer", "arn:aws:iam::${local.account_id}:role/Deployment"]
    }
  }

  statement {
    sid     = "AllowSSOAccessToRole"
    actions = ["sts:AssumeRole"]


    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    condition {
      test     = "ArnLike"
      variable = "aws:PrincipalArn"
      values = [
        "arn:aws:iam::${data.aws_caller_identity.this.account_id}:role/aws-reserved/sso.amazonaws.com/eu-west-2/AWSReservedSSO_datarefinery_developer_????????????????"
      ]
    }
  }

}

locals {
  switch_agreement_arn           = "arn:aws:states:eu-west-2:${var.dare_orchestration_account_id}:stateMachine:${var.environment_prefix}switch-agreement-step-function"
  switch_agreement_execution_arn = "arn:aws:states:eu-west-2:${var.dare_orchestration_account_id}:execution:${var.environment_prefix}switch-agreement-step-function:*"
  switch_agreement_role_arn      = "arn:aws:iam::${var.dare_orchestration_account_id}:role/${var.environment_prefix}portal_invoke_switch_agreement"

  # Add lambdas in alphabetical order to the below map
  orchestration_lambda_names = {
    add_role_to_user_in_agreement                     = "${var.environment_prefix}add_role_to_user_in_agreement",
    add_user_to_agreement_account_group_in_databricks = "${var.environment_prefix}add_user_to_agreement_account_group_in_databricks",
    change_user_activation                            = "${var.environment_prefix}change_user_activation",
    create_base_user                                  = "${var.environment_prefix}create_base_user",
    get_agreement_user_details                        = "${var.environment_prefix}get_agreement_user_details",
    get_all_agreements                                = "${var.environment_prefix}get_all_agreements",
    get_user_agreements                               = "${var.environment_prefix}get_user_agreements",
    get_users_in_agreement                            = "${var.environment_prefix}get_users_in_agreement",
    record_induction_assessment_attempt               = "${var.environment_prefix}record_induction_assessment_attempt",
    remove_role_from_user_in_agreement                = "${var.environment_prefix}remove_role_from_user_in_agreement",
    user_password_setup_service                       = "${var.environment_prefix}user_password_setup_service"
  }
}

data "aws_iam_policy_document" "allow_invoke_orchestration_lambdas" {
  statement {
    sid    = ""
    effect = "Allow"

    actions = ["lambda:InvokeFunction"]

    resources = [
      for _, env_lambda_name in local.orchestration_lambda_names : "arn:aws:lambda:eu-west-2:${var.dare_orchestration_account_id}:function:${env_lambda_name}"
    ]
  }
}

resource "aws_iam_policy" "allow_invoke_orchestration_lambdas" {
  name   = "${var.environment_prefix}allow_invoke_orchestration_lambdas"
  policy = data.aws_iam_policy_document.allow_invoke_orchestration_lambdas.json
}

resource "aws_iam_role_policy_attachment" "ecs_allow_invoke_orchestration_lambdas" {
  policy_arn = aws_iam_policy.allow_invoke_orchestration_lambdas.arn
  role       = aws_iam_role.portal_task.id
}

data "aws_iam_policy_document" "allow_assume_role_in_orchestration" {
  statement {
    sid    = ""
    effect = "Allow"

    actions = ["sts:AssumeRole"]

    resources = [
      local.switch_agreement_role_arn,
    ]
  }
}

resource "aws_iam_policy" "allow_assume_role_in_orchestration" {
  name   = "${var.environment_prefix}allow_assume_role_in_orchestration"
  policy = data.aws_iam_policy_document.allow_assume_role_in_orchestration.json
}

resource "aws_iam_role_policy_attachment" "ecs_allow_assume_role_in_orchestration" {
  policy_arn = aws_iam_policy.allow_assume_role_in_orchestration.arn
  role       = aws_iam_role.portal_task.id
}

data "aws_iam_policy_document" "portal_vpc_flow_logs_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      identifiers = ["vpc-flow-logs.amazonaws.com"]
      type        = "Service"
    }
  }
}

resource "aws_iam_role" "portal_vpc_flow_logs" {
  name               = "${var.environment_prefix}PortalVPCFlowLogs"
  assume_role_policy = data.aws_iam_policy_document.portal_vpc_flow_logs_assume_role_policy.json
}

data "aws_iam_policy_document" "portal_flow_logs_access_to_cloudwatch" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
    ]

    # https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-cwl.html#flow-logs-iam
    #trivy:ignore:aws-iam-no-policy-wildcards
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "portal_flow_logs_access_to_cloudwatch" {
  name   = aws_iam_role.portal_vpc_flow_logs.name
  role   = aws_iam_role.portal_vpc_flow_logs.id
  policy = data.aws_iam_policy_document.portal_flow_logs_access_to_cloudwatch.json
}

data "aws_iam_policy_document" "allow_put_s3_landing_bucket" {
  statement {
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:PutObject"
    ]
    #trivy:ignore:aws-iam-no-policy-wildcards
    resources = [
      module.data_in_landing.arn,
      "${module.data_in_landing.arn}/*"
    ]
  }
}

resource "aws_iam_policy" "allow_put_s3_landing_bucket" {
  name   = "${var.environment_prefix}allow_put_s3_landing_bucket"
  policy = data.aws_iam_policy_document.allow_put_s3_landing_bucket.json
}

resource "aws_iam_role_policy_attachment" "ecs_allow_put_s3_landing_bucket" {
  policy_arn = aws_iam_policy.allow_put_s3_landing_bucket.arn
  role       = aws_iam_role.portal_task.id
}


data "aws_iam_policy_document" "allow_kms_landing_bucket" {
  statement {
    effect = "Allow"

    actions = [
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:GenerateDataKeyPair",
      "kms:GenerateDataKeyPairWithoutPlaintext",
      "kms:GenerateDataKeyWithoutPlaintext"
    ]

    resources = [
      module.s3_kms_key.key_arn
    ]
  }
}

resource "aws_iam_policy" "allow_kms_landing_bucket" {
  name   = "${var.environment_prefix}allow_kms_landing_bucket"
  policy = data.aws_iam_policy_document.allow_kms_landing_bucket.json
}

resource "aws_iam_role_policy_attachment" "ecs_allow_kms_landing_bucket" {
  policy_arn = aws_iam_policy.allow_kms_landing_bucket.arn
  role       = aws_iam_role.portal_task.id
}

resource "aws_iam_role_policy_attachment" "notices_read_access_db" {
  policy_arn = aws_iam_policy.read_from_notices_db.arn
  role       = aws_iam_role.portal_task.id
}

## System Manager Parameter Store

data "aws_iam_policy_document" "allow_ssm_read" {
  statement {
    effect = "Allow"

    actions = [
      "ssm:GetParameter",
    ]

    resources = [
      aws_ssm_parameter.feature_flag_user_management.arn,
      aws_ssm_parameter.feature_flag_induction.arn,
      aws_ssm_parameter.feature_flag_password_setup_flow.arn
    ]
  }

}

resource "aws_iam_policy" "allow_ssm_read" {
  name   = "${var.environment_prefix}allow_ssm_read"
  policy = data.aws_iam_policy_document.allow_ssm_read.json
}

resource "aws_iam_role_policy_attachment" "ecs_allow_ssm_read" {
  policy_arn = aws_iam_policy.allow_ssm_read.arn
  role       = aws_iam_role.portal_task.id
}
