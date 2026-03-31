module "imports_to_outputs_ddb_table_lambda" {
  source = "../../modules/lambda_function"

  name          = "${var.environment_prefix}imports_to_outputs_ddb_table"
  zip_file_path = "${path.module}/../../../build/imports_to_outputs_ddb_table.zip"

  cloudwatch_log_kms_key_arn = module.cloudwatch_log_kms_key.key_arn
  dare_management_account_id = var.dare_management_account_id
  sns_alert_topic            = aws_sns_topic.slack_alert_topic_errors.arn
  environment                = var.environment
  timeout                    = 900
  memory_size                = 1024

  env_vars = {
    DYNAMODB_OUTPUTS_TABLE_NAME = "${var.environment_prefix}Outputs",
    DYNAMODB_OUTPUTS_ROLE_ARN   = var.outputs_writer_role_arn,
    DYNAMODB_IMPORTS_TABLE_NAME = "${var.environment_prefix}Imports",
    ENVIRONMENT                 = var.environment,
    IMPORTS_S3_BUCKET           = "${var.environment}-nhs-sde-imports-pending"
  }
}

data "aws_iam_policy_document" "imports_to_outputs_ddb_table_policy_document" {
  statement {
    sid       = "AllowLambdaToUpdateDynamoDBTable"
    effect    = "Allow"
    actions   = ["dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.imports_workflow.arn]
  }

  statement {
    sid       = "AllowLambdaToReadDynamoDBStreams"
    effect    = "Allow"
    actions   = ["dynamodb:ListStreams"]
    resources = ["*"]
  }

  statement {
    sid       = "AllowLambdaToReadDynamoDBStreamRecords"
    effect    = "Allow"
    actions   = ["dynamodb:GetShardIterator", "dynamodb:GetRecords", "dynamodb:DescribeStream"]
    resources = [aws_dynamodb_table.imports_workflow.stream_arn]
  }

  statement {
    sid       = "AllowLambdaToDecryptKMSKeys"
    effect    = "Allow"
    actions   = ["kms:Decrypt", "kms:Encrypt"]
    resources = [module.imports_dynamodb_kms_key.key_arn]
  }
}

resource "aws_iam_policy" "imports_to_outputs_ddb_table_policy" {
  name   = module.imports_to_outputs_ddb_table_lambda.iam_role_name
  policy = data.aws_iam_policy_document.imports_to_outputs_ddb_table_policy_document.json
}

resource "aws_iam_role_policy_attachment" "imports_to_outputs_ddb_table_policy_attachment" {
  policy_arn = aws_iam_policy.imports_to_outputs_ddb_table_policy.arn
  role       = module.imports_to_outputs_ddb_table_lambda.iam_role_name
}

# outputs table write
data "aws_iam_policy_document" "allow_outputs_writer_assume_role" {
  statement {
    sid       = "AssumeWriterRole"
    effect    = "Allow"
    actions   = ["sts:AssumeRole"]
    resources = [var.outputs_writer_role_arn]
  }
}

resource "aws_iam_policy" "assume_outputs_table_writer" {
  name   = "${var.environment_prefix}internalPortal-AssumeOutputsTableWriter"
  policy = data.aws_iam_policy_document.allow_outputs_writer_assume_role.json
}

resource "aws_iam_role_policy_attachment" "imports_to_outputs_ddb_table_assume_output_writer" {
  role       = module.imports_to_outputs_ddb_table_lambda.iam_role_name
  policy_arn = aws_iam_policy.assume_outputs_table_writer.arn
}

resource "aws_lambda_event_source_mapping" "imports_to_outputs_ddb_table_event_source_mapping" {
  event_source_arn  = aws_dynamodb_table.imports_workflow.stream_arn
  function_name     = module.imports_to_outputs_ddb_table_lambda.function_name
  starting_position = "LATEST"
}

