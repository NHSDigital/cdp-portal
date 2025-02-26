locals {
  aws_endpoints = ["execute-api", "ecr.api", "ecr.dkr", "logs", "secretsmanager", "lambda", "states", "sts", "ssm"]
}

module "aws_endpoints" {
  source = "./interface_endpoint"

  for_each = toset(local.aws_endpoints)

  service_name = "com.amazonaws.eu-west-2.${each.value}"
  name         = "${var.environment_prefix}${each.value}-portal"
  vpc_id       = aws_vpc.portal.id
  subnet_ids   = aws_subnet.private[*].id
}

resource "aws_vpc_endpoint" "s3_endpoint" {
  service_name    = "com.amazonaws.eu-west-2.s3"
  vpc_id          = aws_vpc.portal.id
  route_table_ids = aws_route_table.private[*].id
  tags = {
    Name = "${var.environment_prefix}s3-portal"
  }
}

data "aws_ec2_managed_prefix_list" "s3" {
  name = "com.amazonaws.eu-west-2.s3"
}

resource "aws_network_acl_rule" "s3_gateway_cidrs_egress" {
  count = length(data.aws_ec2_managed_prefix_list.s3.entries)

  network_acl_id = aws_network_acl.private.id
  rule_number    = 500 + 10 * count.index
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = tolist(data.aws_ec2_managed_prefix_list.s3.entries)[count.index].cidr
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "s3_gateway_cidrs_ingress" {
  count = length(data.aws_ec2_managed_prefix_list.s3.entries)

  network_acl_id = aws_network_acl.private.id
  rule_number    = 600 + 10 * count.index
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = tolist(data.aws_ec2_managed_prefix_list.s3.entries)[count.index].cidr
  # Ephemeral ports
  from_port = 1024
  to_port   = 65535
}

module "keycloak_endpoint" {
  source = "./interface_endpoint"

  service_name = var.keycloak_endpoint_service_name
  name         = "${var.environment_prefix}keycloak-portal"
  vpc_id       = aws_vpc.portal.id
  subnet_ids   = aws_subnet.private[*].id
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.portal.id
  service_name      = "com.amazonaws.eu-west-2.dynamodb"
  policy            = data.aws_iam_policy_document.dynamodb_endpoint_policy.json
  vpc_endpoint_type = "Gateway"

  route_table_ids = aws_route_table.private[*].id

  tags = {
    Name = "${var.environment_prefix}dynamodb-gateway-endpoint"
  }
}

data "aws_iam_policy_document" "dynamodb_endpoint_policy" {
  statement {
    actions = [
      "dynamodb:Scan"
    ]
    resources = [
      aws_dynamodb_table.notices.arn
    ]

    principals {
      identifiers = ["*"]
      type        = "*"
    }

    # Only allows access from IAM entities that belong to this account
    condition {
      test     = "StringEquals"
      values   = [local.account_id]
      variable = "aws:PrincipalAccount"
    }
  }
}

data "aws_ec2_managed_prefix_list" "dynamodb" {
  name = "com.amazonaws.eu-west-2.dynamodb"
}

locals {
  dynamodb_gateway_cidr_blocks_list = sort(distinct(
    data.aws_ec2_managed_prefix_list.dynamodb.entries[*].cidr
  ))
  dynamodb_gateway_cidr_blocks = { for index, range in local.dynamodb_gateway_cidr_blocks_list : index + 700 => range }
}

resource "aws_network_acl_rule" "gateway_endpoint_cidrs_egress" {
  for_each = local.dynamodb_gateway_cidr_blocks

  network_acl_id = aws_network_acl.private.id
  rule_number    = each.key
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = each.value
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "gateway_endpoint_cidrs_ingress" {
  for_each = local.dynamodb_gateway_cidr_blocks

  network_acl_id = aws_network_acl.private.id
  rule_number    = each.key
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = each.value
  from_port      = 1024
  to_port        = 65535
}


