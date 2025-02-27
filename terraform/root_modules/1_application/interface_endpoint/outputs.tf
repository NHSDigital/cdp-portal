output "private_dns_name" {
  value = data.aws_vpc_endpoint_service.main.private_dns_name
}

output "security_group_id" {
  value = aws_security_group.endpoint.id
}
