data "aws_vpc_endpoint_service" "main" {
  service_name = var.service_name
  service_type = "Interface"
}

resource "aws_vpc_endpoint" "main" {
  service_name      = data.aws_vpc_endpoint_service.main.service_name
  vpc_endpoint_type = data.aws_vpc_endpoint_service.main.service_type

  vpc_id             = var.vpc_id
  subnet_ids         = [for s in data.aws_subnet.main : s.id if contains(data.aws_vpc_endpoint_service.main.availability_zones, s.availability_zone)]
  security_group_ids = [aws_security_group.endpoint.id]

  private_dns_enabled = true

  tags = {
    Name = var.name
  }

  depends_on = [
    data.aws_vpc_endpoint_service.main
  ]
}
