resource "aws_ecs_cluster" "portal" {
  name = var.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

#trivy:ignore:AVD-AWS-0036  no secrets in env vars passed
resource "aws_ecs_task_definition" "portal" {
  family                   = var.name
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  network_mode             = "awsvpc"
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      "name"                   = var.name
      "image"                  = var.image
      "readonlyRootFilesystem" = true
      "essential"              = true

      "portMappings" = [
        {
          "containerPort" = var.portal_port
          "hostPort"      = var.portal_port
          "protocol"      = "tcp"
        },
      ]

      "secrets" = var.container_definition_secrets

      "environment" = var.container_definitions_environments

      "logConfiguration" = {
        "logDriver" = "awslogs"
        "options" = {
          "awslogs-group"         = var.log_group_id
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "portal" {
  name            = var.name
  cluster         = aws_ecs_cluster.portal.arn
  task_definition = aws_ecs_task_definition.portal.arn
  launch_type     = "FARGATE"
  desired_count   = var.desired_count

  health_check_grace_period_seconds = 180
  wait_for_steady_state             = true

  network_configuration {
    security_groups = [var.security_group_ids]
    subnets         = var.subnets_ids
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = var.name
    container_port   = var.portal_port
  }

  depends_on = [
    aws_ecs_task_definition.portal
  ]
}
