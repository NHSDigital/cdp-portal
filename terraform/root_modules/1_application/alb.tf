# trivy:ignore:aws-elb-alb-not-public this load balancer is meant to be open to the internet
resource "aws_lb" "ecs" {
  name                       = "${var.environment_prefix}ecs"
  drop_invalid_header_fields = true
  enable_deletion_protection = true
  subnets                    = aws_subnet.public[*].id
  security_groups = [
    aws_security_group.ecs_alb.id,
  ]
  access_logs {
    bucket  = local.log_delivery_bucket_name
    prefix  = local.log_delivery_path
    enabled = true
  }
}

resource "aws_lb_target_group" "portal" {
  name        = "${var.environment_prefix}portal-external-alb"
  port        = local.portal_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.portal.id
  target_type = "ip"

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
  }

  health_check {
    path = "/api/auth/signin"
  }
}

resource "aws_lb_listener" "https" {
  depends_on        = [aws_acm_certificate_validation.portal]
  load_balancer_arn = aws_lb.ecs.arn
  port              = "443"
  protocol          = "HTTPS"

  ssl_policy      = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn = aws_acm_certificate.portal.arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "FORBIDDEN"
      status_code  = "403"
    }
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.ecs.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener_rule" "portal" {
  listener_arn = aws_lb_listener.https.arn

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.portal.arn
  }

  condition {
    host_header {
      values = [aws_route53_record.portal.fqdn]
    }
  }

  condition {
    path_pattern {
      values = ["*"]
    }
  }
}

resource "aws_wafv2_web_acl_association" "portal" {
  resource_arn = aws_lb.ecs.arn
  web_acl_arn  = aws_wafv2_web_acl.portal.arn
}
