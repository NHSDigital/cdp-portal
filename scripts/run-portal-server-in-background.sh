#!/bin/bash
SCRIPT_DIR=$(dirname "$(realpath "$0")")
. "$SCRIPT_DIR/variables.sh"
set -e
set -eu
MAINTENANCE_ENABLED=$1
# retrieve keycloak and nextauth secrets
export KEYCLOAK_SECRET=$( AWS_PROFILE=portal_dev aws secretsmanager get-secret-value --secret-id ${keycloak_portal_client_secret} | jq -r .SecretString)
export NEXTAUTH_SECRET=$( AWS_PROFILE=portal_dev aws secretsmanager get-secret-value --secret-id ${nextauth_encryption_secret} | jq -r .SecretString)

# retrieve credentials for portal task
PORTAL_TASK_CREDS=$( AWS_PROFILE=portal_dev aws sts assume-role --role-arn arn:aws:iam::${aws_portal_dev_account_id}:role/portal_task --role-session-name gitlab-runner)

# set environment variables for portal task credentials
export AWS_ACCESS_KEY_ID=$( echo $PORTAL_TASK_CREDS | jq -r .Credentials.AccessKeyId)
export AWS_SECRET_ACCESS_KEY=$( echo $PORTAL_TASK_CREDS | jq -r .Credentials.SecretAccessKey)
export AWS_SESSION_TOKEN=$( echo $PORTAL_TASK_CREDS | jq -r .Credentials.SessionToken)

# start running portal in the background and redirect stdout to null file to not clog terminal, but still show errors for debugging
cd portal
MAINTENANCE_MODE=${MAINTENANCE_ENABLED} npm run dev > /dev/null &