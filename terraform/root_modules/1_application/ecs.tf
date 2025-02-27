resource "aws_ecs_cluster" "portal" {
  name = "${var.environment_prefix}portal"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

locals {
  portal_port = 3000
}

resource "aws_ecs_task_definition" "portal" {
  family                   = "${var.environment_prefix}portal"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "2048"
  memory                   = "4096"
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.portal_execution.arn
  task_role_arn            = aws_iam_role.portal_task.arn

  container_definitions = jsonencode([
    {
      "readonlyRootFilesystem" = true
      "essential"              = true
      "image"                  = "${aws_ecr_repository.portal.repository_url}:${var.image_tag}"
      "name"                   = "${var.environment_prefix}portal"
      "portMappings" = [
        {
          "containerPort" = local.portal_port
          "hostPort"      = local.portal_port
          "protocol"      = "tcp"
        },
      ]
      "secrets" = [
        {
          "name"      = "NEXTAUTH_SECRET"
          "valueFrom" = aws_secretsmanager_secret.nextauth_secret.arn
        },
        {
          "name"      = "KEYCLOAK_SECRET"
          "valueFrom" = aws_secretsmanager_secret.portal_keycloak_secret.arn
        }
      ]
      "environment" = concat(
        [
          for lambda_name, env_lambda_name in local.orchestration_lambda_names : {
            "name"  = format("%s%s", upper(lambda_name), "_ARN")
            "value" = "arn:aws:lambda:eu-west-2:${var.dare_orchestration_account_id}:function:${env_lambda_name}"
          }
        ],
        // Add the rest of the environment variables
        [
          {
            "name"  = "NEXT_PUBLIC_KEYCLOAK_ISSUER"
            "value" = var.keycloak_url
          },
          {
            "name"  = "KEYCLOAK_ID"
            "value" = "portal"
          },
          {
            "name"  = "NEXTAUTH_URL"
            "value" = "https://${local.portal_full_domain_name}"
          },
          {
            "name"  = "AWS_ENVIRONMENT"
            "value" = var.environment
          },
          {
            "name"  = "AWS_ENVIRONMENT_PREFIX",
            "value" = var.environment_prefix
          },
          {
            "name"  = "SWITCH_AGREEMENT_ARN",
            "value" = local.switch_agreement_arn
          },
          {
            "name"  = "SWITCH_AGREEMENT_ROLE_ARN"
            "value" = local.switch_agreement_role_arn
          },
          {
            "name"  = "LOG_LEVEL"
            "value" = "info"
          },
          {
            "name"  = "DATA_UPLOAD_BUCKET_NAME"
            "value" = module.data_in_landing.id
          },
          {
            "name"  = "PERMISSIONS_API_GATEWAY_ID"
            "value" = var.permissions_api_gateway_id
          },
          {
            "name"  = "TABLE_NAME"
            "value" = aws_dynamodb_table.notices.id
          },
          {
            "name"  = "MAINTENANCE_MODE",
            "value" = tostring(var.maintenance_mode)
          },
        ]
      )
      "logConfiguration" = {
        "logDriver" = "awslogs"
        "options" = {
          "awslogs-group"         = "${module.ecs_logs.log_group_id}"
          "awslogs-region"        = "eu-west-2"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "portal" {
  name            = "${var.environment_prefix}portal"
  cluster         = aws_ecs_cluster.portal.arn
  task_definition = aws_ecs_task_definition.portal.arn
  launch_type     = "FARGATE"
  desired_count   = 3

  health_check_grace_period_seconds = 180
  wait_for_steady_state             = true

  network_configuration {
    security_groups = [
      aws_security_group.portal_ecs.id
    ]
    subnets = aws_subnet.private[*].id
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.portal.arn
    container_name   = "${var.environment_prefix}portal"
    container_port   = local.portal_port
  }

  depends_on = [
    aws_iam_role.portal_execution,
    aws_lb_listener_rule.portal
  ]
}
