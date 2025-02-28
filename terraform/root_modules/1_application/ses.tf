resource "aws_ses_domain_identity" "root_zone" {
  count  = local.all_aws_accounts ? 1 : 0
  domain = local.portal_full_domain_name
}

resource "aws_ses_domain_dkim" "root_zone" {
  count  = local.all_aws_accounts ? 1 : 0
  domain = aws_ses_domain_identity.root_zone.0.domain
}

resource "aws_route53_record" "root_zone_amazonses_verification_record" {
  count   = local.all_aws_accounts ? 1 : 0
  zone_id = local.portal_hosted_zone_id
  name    = "_amazonses.${local.portal_full_domain_name}"
  type    = "TXT"
  ttl     = "600"

  records = [
    aws_ses_domain_identity.root_zone.0.verification_token,
  ]
}

resource "aws_route53_record" "root_zone_amazonses_dkim_record" {
  count   = local.all_aws_accounts ? 3 : 0
  zone_id = local.portal_hosted_zone_id
  name    = "${element(aws_ses_domain_dkim.root_zone.0.dkim_tokens, count.index)}._domainkey.${local.portal_full_domain_name}"
  type    = "CNAME"
  ttl     = "600"

  records = [
    "${element(aws_ses_domain_dkim.root_zone.0.dkim_tokens, count.index)}.dkim.amazonses.com",
  ]
}
