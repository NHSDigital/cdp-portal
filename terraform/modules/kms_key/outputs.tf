output "key_arn" {
  value = aws_kms_key.kms_key.arn
}

output "alias" {
  value = aws_kms_alias.kms_key_alias.name
}
