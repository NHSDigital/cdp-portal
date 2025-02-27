environment                    = "example_environment"                            # Replace with your environment name (dev, int, test, prod)
admin_roles                    = ["ExampleRole1", "ExampleRole2", "ExampleRole3"] # Example roles
sso_admin_role_names           = ["ExampleRole1", "ExampleRole2", "ExampleRole3"] # Example roles
cidr_range                     = "172.20.192.0/18"
dare_management_account_id     = "123456789012"                                        # Example account, replace with your mgmt account                gitsecrets:ignore - example file
dare_orchestration_account_id  = "123456789012"                                        # Example account, replace with your orchestration account       gitsecrets:ignore - example file
dare_access_account_id         = "123456789012"                                        # Example account, replace with your access account              gitsecrets:ignore - example file
keycloak_endpoint_service_name = "com.amazonaws.vpce.eu-west-2.vpce-svc-xxxxxxxxxxxxx" # Example VPC Endpoint Service, replace with your keycloak endpoint
log_delivery_bucket_name       = "example-alb-audit-logs"                              # Example bucket name, replace with your audit log bucket
access_s3_kms_key_id           = ""                                                    # Replace with your KMS Key ID

permissions_api_gateway_id = "" # Replace with your API Gateway ID for Permissions.
ecr_replication_source     = true
keycloak_url               = "" # Replace with your keycloak URL.