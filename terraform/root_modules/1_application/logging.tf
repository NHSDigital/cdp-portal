module "portal_logging" {
  source                   = "../../modules/logging"
  account_id               = local.account_id
  environment              = var.environment
  log_delivery_bucket_name = local.log_delivery_bucket_name
  log_delivery_path        = local.log_delivery_path
  elb_account_id_eu_west_2 = local.elb_account_id_eu_west_2
}
