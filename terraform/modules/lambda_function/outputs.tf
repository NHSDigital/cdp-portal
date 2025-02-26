output "iam_role_arn" { value = aws_iam_role.lambda_role.arn }
output "iam_role_name" { value = aws_iam_role.lambda_role.name }
output "function_arn" { value = aws_lambda_function.func.arn }
output "function_name" { value = aws_lambda_function.func.function_name }
