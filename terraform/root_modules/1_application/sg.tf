# Each VPC created in AWS comes with a default security group that can be managed but not destroyed.
# When Terraform first adopts the default security group,
# it immediately removes all ingress and egress rules in the Security Group.
# NB: This is an advanced resource with special caveats, read the documentation before changing it.
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.portal.id
}

resource "aws_security_group" "portal_ecs" {
  name        = "${var.environment_prefix}portal_ecs"
  description = "SG for portal ecs cluster"
  vpc_id      = aws_vpc.portal.id
}

resource "aws_security_group" "ecs_alb" {
  name        = "${var.environment_prefix}ecs_alb"
  description = "SG for portal ecs load balancer"
  vpc_id      = aws_vpc.portal.id
}

resource "aws_security_group_rule" "ingress_http_from_alb_to_portal_ecs" {
  security_group_id = aws_security_group.portal_ecs.id
  description       = "Ingress - http from alb to portal"

  type                     = "ingress"
  from_port                = local.portal_port
  to_port                  = local.portal_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_alb.id
}

resource "aws_security_group_rule" "egress_http_from_alb_to_portal_ecs" {
  security_group_id = aws_security_group.ecs_alb.id
  description       = "Egress - http from alb to portal_ecs"

  type                     = "egress"
  from_port                = local.portal_port
  to_port                  = local.portal_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.portal_ecs.id
}

#trivy:ignore:aws-vpc-no-public-ingress-sgr
resource "aws_security_group_rule" "ingress_http_from_external_to_alb" {
  security_group_id = aws_security_group.ecs_alb.id
  description       = "Ingress - http from external to alb for incoming web clients"

  type        = "ingress"
  from_port   = 80
  to_port     = 80
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

#trivy:ignore:aws-vpc-no-public-ingress-sgr
resource "aws_security_group_rule" "ingress_https_from_external_to_alb" {
  security_group_id = aws_security_group.ecs_alb.id
  description       = "Ingress - https from external to alb for incoming web clients"

  type        = "ingress"
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "egress_http_from_ecs_to_aws_interface_endpoints" {
  for_each = toset(local.aws_endpoints)

  security_group_id = aws_security_group.portal_ecs.id
  description       = "Egress - ECS to AWS Endpoints"

  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = module.aws_endpoints[each.key].security_group_id
}

resource "aws_security_group_rule" "egress_http_from_ecs_to_keycloak" {
  security_group_id = aws_security_group.portal_ecs.id
  description       = "Egress - ECS to Keycloak"

  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = module.keycloak_endpoint.security_group_id
}

resource "aws_security_group_rule" "egress_https_from_ecs_to_s3" {
  security_group_id = aws_security_group.portal_ecs.id
  description       = "Egress - ECS to S3"

  type        = "egress"
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = data.aws_ec2_managed_prefix_list.s3.entries[*].cidr
}

resource "aws_security_group_rule" "egress_https_from_ecs_to_dynamodb" {
  security_group_id = aws_security_group.portal_ecs.id
  description       = "Egress - ECS to DynamoDB"

  type        = "egress"
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = local.dynamodb_gateway_cidr_blocks_list
}
