variable "service_name" {
  type        = string
  description = "The servicename of the endpoint"
}

variable "name" {
  type        = string
  description = "Name to be given to all resources and used in tags"
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC the to attach the endpoint to"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs to attach the endpoint to"
}
