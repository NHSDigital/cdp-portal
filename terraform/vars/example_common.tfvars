# example_common.tfvars

# Description: This is an example Terraform variable file (common.tfvars) with dummy values.
# It's used to demonstrate the structure and types of variables common across different environments.

environment                    = "example_environment"
admin_roles                    = ["ExampleAdminRole", "ExampleDeploymentRole", "ExampleDeveloper"]
sso_admin_role_names           = ["Admin", "datarefinery_developer"]
cidr_range                     = "192.168.30.0/18"
dare_management_account_id     = "example_aws_account_id"
dare_orchestration_account_id  = "example_aws_account_id"
dare_access_account_id         = "example_aws_account_id"
keycloak_endpoint_service_name = "example_keycloak_endpoint"
log_delivery_bucket_name       = "example_log_delivery_bucket_name"
access_s3_kms_key_id           = "example_kms_id"

permissions_api_gateway_id = "example_api_gateway_id"
ecr_replication_source     = true
keycloak_url               = "example_keycloak_url"