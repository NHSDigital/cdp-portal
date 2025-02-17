resource "aws_security_group" "endpoint" {
  vpc_id      = var.vpc_id
  name        = var.name
  description = "Allow access to the ${var.name} VPC endpoint"
  lifecycle { create_before_destroy = true }
}

resource "aws_security_group_rule" "open_to_vpc" {
  from_port         = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.endpoint.id
  to_port           = 443
  type              = "ingress"
  cidr_blocks       = [data.aws_vpc.vpc.cidr_block]
  description       = "Open the ${var.name} VPC endpoint to the VPC"
}
