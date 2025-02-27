resource "aws_acm_certificate" "portal" {
  # domain_name has to use the .name attribute (rather than .fqdn), 
  # because fqdn is not known at apply time and that causes the error below
  # Error: Invalid for_each argument
  # (...)
  # aws_acm_certificate.portal.domain_validation_options is a set of object, known only after apply
  domain_name       = aws_route53_record.portal.name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Cert validation using DNS
# See: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/acm_certificate#referencing-domain_validation_options-with-for_each-based-resources
resource "aws_route53_record" "portal_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.portal.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = local.portal_hosted_zone_id
}

resource "aws_acm_certificate_validation" "portal" {
  certificate_arn         = aws_acm_certificate.portal.arn
  validation_record_fqdns = [for record in aws_route53_record.portal_cert_validation : record.fqdn]
}
