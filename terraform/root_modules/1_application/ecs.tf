locals {
  portal_shared_environment_variables = {
    NEXT_PUBLIC_KEYCLOAK_ISSUER   = var.keycloak_url
    AWS_ENVIRONMENT               = var.environment
    AWS_ENVIRONMENT_PREFIX        = var.environment_prefix
    SWITCH_AGREEMENT_ARN          = local.switch_agreement_arn
    SWITCH_AGREEMENT_ROLE_ARN     = local.switch_agreement_role_arn
    LOG_LEVEL                     = "info"
    DATA_UPLOAD_BUCKET_NAME       = module.data_in_landing.id
    PERMISSIONS_API_GATEWAY_ID    = var.permissions_api_gateway_id
    TABLE_NAME                    = aws_dynamodb_table.notices.id
    MAX_UPLOAD_FILE_SIZE_IN_BYTES = tostring(var.max_upload_file_size_in_bytes)
  }

  sde_portal_environment_variables = {
    KEYCLOAK_ID      = "portal"
    NEXTAUTH_URL     = "https://${local.portal_full_domain_name}"
    MAINTENANCE_MODE = tostring(var.sde_maintenance_mode)
    PORTAL_SERVICE   = "SDE"
  }

  cdp_portal_environment_variables = {
    KEYCLOAK_ID      = "cdp_portal"
    NEXTAUTH_URL     = "https://${local.cdp_portal_full_domain_name}"
    MAINTENANCE_MODE = tostring(var.cdp_maintenance_mode)
    PORTAL_SERVICE   = "CDP"
  }
}

module "sde_portal" {
  source = "../../modules/portal_ecs"

  name               = "${var.environment_prefix}sde-portal"
  environment_prefix = var.environment_prefix
  image              = "${aws_ecr_repository.portal.repository_url}:${var.image_tag}"
  task_role_arn      = aws_iam_role.portal_task.arn
  execution_role_arn = aws_iam_role.sde_portal_execution.arn
  log_group_id       = module.ecs_logs.log_group_id
  target_group_arn   = aws_lb_target_group.portal.arn
  subnets_ids        = aws_subnet.private[*].id
  security_group_ids = aws_security_group.portal_ecs.id

  container_definition_secrets = [
    {
      "name"      = "NEXTAUTH_SECRET"
      "valueFrom" = aws_secretsmanager_secret.nextauth_secret.arn
    },
    {
      "name"      = "KEYCLOAK_SECRET"
      "valueFrom" = aws_secretsmanager_secret.portal_keycloak_secret.arn
    }
  ]

  container_definitions_environments = concat(
    // lambda names -> arns
    [
      for lambda_name, env_lambda_name in local.orchestration_lambda_names : {
        "name"  = format("%s%s", upper(lambda_name), "_ARN")
        "value" = "arn:aws:lambda:eu-west-2:${var.dare_orchestration_account_id}:function:${env_lambda_name}"
      }
    ],
    // shared vars
    [
      for name, value in local.portal_shared_environment_variables : {
        name  = name
        value = value
      }
    ],
    // sde specific vars
    [
      for name, value in local.sde_portal_environment_variables : {
        name  = name
        value = value
      }
    ]
  )
}


module "cdp_portal" {
  source = "../../modules/portal_ecs"

  name               = "${var.environment_prefix}cdp-portal"
  environment_prefix = var.environment_prefix
  image              = "${aws_ecr_repository.portal.repository_url}:${var.image_tag}"
  task_role_arn      = aws_iam_role.portal_task.arn
  execution_role_arn = aws_iam_role.cdp_portal_execution.arn
  log_group_id       = module.ecs_logs.log_group_id
  target_group_arn   = aws_lb_target_group.cdp_portal.arn
  subnets_ids        = aws_subnet.private[*].id
  security_group_ids = aws_security_group.portal_ecs.id

  container_definition_secrets = [
    {
      "name"      = "NEXTAUTH_SECRET"
      "valueFrom" = aws_secretsmanager_secret.cdp_nextauth_secret.arn
    },
    {
      "name"      = "KEYCLOAK_SECRET"
      "valueFrom" = aws_secretsmanager_secret.cdp_portal_client_secret.arn
    }
  ]

  container_definitions_environments = concat(
    // lambda names -> arns 
    [
      for lambda_name, env_lambda_name in local.orchestration_lambda_names : {
        "name"  = format("%s%s", upper(lambda_name), "_ARN")
        "value" = "arn:aws:lambda:eu-west-2:${var.dare_orchestration_account_id}:function:${env_lambda_name}"
      }
    ],
    // shared vars
    [
      for name, value in local.portal_shared_environment_variables : {
        name  = name
        value = value
      }
    ],
    // cdp specific vars
    [
      for name, value in local.cdp_portal_environment_variables : {
        name  = name
        value = value
      }
    ]
  )
}
