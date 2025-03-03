output "log_group_arn" {
  value = aws_cloudwatch_log_group.this.arn
}

output "log_group_id" {
  value = aws_cloudwatch_log_group.this.id
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.this.name
}
