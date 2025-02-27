resource "aws_vpc" "portal" {
  cidr_block           = var.cidr_range
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "${var.environment_prefix}portal" }
}

resource "aws_internet_gateway" "portal" {
  vpc_id = aws_vpc.portal.id
  tags   = { Name = "portal" }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.portal.id
  cidr_block        = cidrsubnet(aws_vpc.portal.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]

  tags = {
    Name = "${var.environment_prefix}private-subnet-${count.index}"
  }
}

resource "aws_subnet" "public" {
  count = 3

  vpc_id            = aws_vpc.portal.id
  cidr_block        = cidrsubnet(aws_vpc.portal.cidr_block, 8, length(aws_subnet.private) + count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]

  tags = {
    Name = "${var.environment_prefix}public-subnet-${count.index}"
  }
}

resource "aws_route_table" "private" {
  count = length(aws_subnet.private)

  vpc_id = aws_vpc.portal.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_route_table.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table" "public" {
  count = length(aws_subnet.public)

  vpc_id = aws_vpc.portal.id
}

resource "aws_route_table_association" "public" {
  count = length(aws_route_table.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[count.index].id
}

resource "aws_route" "public_subnet_to_igw" {
  count = length(aws_route_table.public)

  route_table_id         = aws_route_table.public[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.portal.id
}

resource "aws_flow_log" "portal_vpc_flow_log" {
  log_destination = module.portal_vpc_flow_logs.log_group_arn
  iam_role_arn    = aws_iam_role.portal_vpc_flow_logs.arn
  vpc_id          = aws_vpc.portal.id
  traffic_type    = "ALL"
}

module "portal_vpc_flow_logs" {
  source = "../../modules/cloudwatch_log_group"

  name                       = "/${var.environment_prefix}portal/portal_vpc_flow_logs"
  kms_key_arn                = module.cloudwatch_log_kms_key.key_arn
  dare_management_account_id = var.dare_management_account_id
  environment                = var.environment
  filter_pattern             = "[version, account_id, interface_id, srcaddr != \"-\", dstaddr != \"-\", srcport != \"-\", dstport != \"-\", protocol, packets, bytes, start, end, action, log_status != \"NODATA\"]"
}
