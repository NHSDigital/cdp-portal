resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.portal.id

  subnet_ids = aws_subnet.private[*].id
}

resource "aws_network_acl" "public" {
  vpc_id = aws_vpc.portal.id

  subnet_ids = aws_subnet.public[*].id
}

#trivy:ignore:aws-vpc-no-public-ingress-acl This service is public internet facing, allowing public ingress is intentional.
resource "aws_network_acl_rule" "https_from_internet_ingress_to_public" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "https_from_public_egress_to_internet" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 200
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

#trivy:ignore:aws-vpc-no-public-ingress-acl This service is public internet facing, allowing public ingress is intentional.
resource "aws_network_acl_rule" "http_from_internet_ingress_to_public" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 300
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "http_from_public_egress_to_internet" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 400
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

#trivy:ignore:aws-vpc-no-excessive-port-access
resource "aws_network_acl_rule" "ephemeral_ports_egress" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 450
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "portal_port_from_public_egress_to_private" {
  count = length(aws_subnet.private)

  network_acl_id = aws_network_acl.public.id
  rule_number    = 500 + count.index * 10
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = aws_subnet.private[count.index].cidr_block
  from_port      = local.portal_port
  to_port        = local.portal_port
}

resource "aws_network_acl_rule" "portal_port_from_private_ingress_to_public" {
  count = length(aws_subnet.private)

  network_acl_id = aws_network_acl.public.id
  rule_number    = 600 + count.index * 10
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = aws_subnet.private[count.index].cidr_block
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "portal_port_from_public_inress_to_private" {
  count = length(aws_subnet.public)

  network_acl_id = aws_network_acl.private.id
  rule_number    = 100 + count.index * 10
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = aws_subnet.public[count.index].cidr_block
  from_port      = local.portal_port
  to_port        = local.portal_port
}

resource "aws_network_acl_rule" "portal_port_from_private_egress_to_public" {
  count = length(aws_subnet.public)

  network_acl_id = aws_network_acl.private.id
  rule_number    = 200 + count.index * 10
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = aws_subnet.public[count.index].cidr_block
  from_port      = 1024
  to_port        = 65535
}

#trivy:ignore:aws-vpc-no-excessive-port-access We deliberately allow all internal traffic in the VPC, as it is protected by security groups
resource "aws_network_acl_rule" "all_internal_private_traffic_ingress" {
  count = length(aws_subnet.private)

  network_acl_id = aws_network_acl.private.id
  rule_number    = 300 + count.index * 10
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = aws_subnet.private[count.index].cidr_block
}

#trivy:ignore:aws-vpc-no-excessive-port-access We deliberately allow all internal traffic in the VPC, as it is protected by security groups
resource "aws_network_acl_rule" "all_internal_private_traffic_egress" {
  count = length(aws_subnet.private)

  network_acl_id = aws_network_acl.private.id
  rule_number    = 400 + count.index * 10
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = aws_subnet.private[count.index].cidr_block
}
