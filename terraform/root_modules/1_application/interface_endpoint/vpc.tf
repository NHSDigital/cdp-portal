data "aws_vpc" "vpc" {
  id = var.vpc_id
}

data "aws_subnet" "main" {
  count = length(var.subnet_ids)

  id = var.subnet_ids[count.index]
}
