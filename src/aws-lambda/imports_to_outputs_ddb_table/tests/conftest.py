import os

os.environ["DYNAMODB_OUTPUTS_TABLE_NAME"] = "Outputs"
os.environ["DYNAMODB_IMPORTS_TABLE_NAME"] = "Imports"
os.environ["DYNAMODB_OUTPUTS_ROLE_ARN"] = (
    "arn:aws:iam::12271924598:role/write_to_outputs_ddb_table_role"
)
os.environ["ENVIRONMENT"] = "dev"
os.environ["AWS_REGION"] = "eu-west-2"
os.environ["AWS_LAMBDA_FUNCTION_NAME"] = "test"
os.environ["IMPORTS_S3_BUCKET"] = "dev-imports-pending"
