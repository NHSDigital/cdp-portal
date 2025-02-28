locals {
  sde_domain              = local.sde_domain_global
  portal_hosted_zone_id   = local.prod_env ? aws_route53_zone.prod_domain.0.zone_id : local.nonprod_aws_accounts ? aws_route53_zone.env_portal_subdomain.0.zone_id : var.portal_hosted_zone_id
  portal_hosted_zone_name = local.prod_env ? aws_route53_zone.prod_domain.0.name : local.nonprod_aws_accounts ? aws_route53_zone.env_portal_subdomain.0.name : var.env_portal_subdomain_name
  portal_full_domain_name = local.prod_env ? aws_route53_zone.prod_domain.0.name : local.nonprod_aws_accounts ? "portal.${local.portal_hosted_zone_name}" : "portal.${var.environment}.${local.portal_hosted_zone_name}"
}

resource "aws_route53_zone" "env_portal_subdomain" {
  count = local.all_aws_accounts ? 1 : 0
  name  = "${var.environment}.ui.${local.sde_domain}"
}

resource "aws_route53_zone" "prod_domain" {
  count = local.prod_env ? 1 : 0
  name  = "portal.${local.sde_domain}"
}

resource "aws_route53_record" "portal" {
  zone_id = local.portal_hosted_zone_id
  name    = local.portal_full_domain_name
  type    = "A"

  alias {
    name                   = aws_lb.ecs.dns_name
    zone_id                = aws_lb.ecs.zone_id
    evaluate_target_health = true
  }
}
