variable "environment_prefix" {
  default = ""
}

variable "name" {
  description = "platform short"
}

variable "portal_port" {
  description = "lb container portal port"
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "cpu value"
  type        = string
  default     = "2048"
}

variable "execution_role_arn" {
  description = "execution role arn"
  type        = string
}

variable "task_role_arn" {
  description = "task role arn"
  type        = string
}

variable "image" {
  description = "container image"
  type        = string
}

variable "container_definition_secrets" {
  type    = list(object({ name = string, valueFrom = string }))
  default = []
}

variable "container_definitions_environments" {
  type    = list(object({ name = string, value = string }))
  default = []
}

variable "memory" {
  description = "memory"
  type        = string
  default     = "4096"
}

variable "aws_region" {
  description = "aws_region"
  type        = string
  default     = "eu-west-2"
}

variable "log_group_id" {
  description = "log_group_id"
  type        = string
}

variable "desired_count" {
  description = "ecs service desired count"
  type        = number
  default     = 3
}

variable "security_group_ids" {
  description = "ecs service security group ids"
  type        = string
}

variable "subnets_ids" {
  description = "subnets ids"
  type        = list(string)
}

variable "target_group_arn" {
  description = "target group"
  type        = string
}