#!/bin/bash

set -eu
SCRIPT_DIR=$(dirname "$(realpath "$0")")
. "$SCRIPT_DIR/variables.sh"
set -e

# Run portal server in the background (assumes "false" is the default mode)
scripts/run-portal-server-in-background.sh false

# Wait until portal server has started
sleep 10

# Retrieve test user credentials from AWS Secrets Manager
export BUILD_ENV="dev"
export CYPRESS_ANALYST_TEST_CREDENTIALS=$( AWS_PROFILE=identity_${BUILD_ENV} aws secretsmanager get-secret-value --secret-id=${secret_id_test_user_analyst} | jq ".SecretString | fromjson" )
export CYPRESS_USER_MANAGER_TEST_CREDENTIALS=$( AWS_PROFILE=identity_${BUILD_ENV} aws secretsmanager get-secret-value --secret-id=${secret_id_test_user_user_manager} | jq ".SecretString | fromjson" )
export CYPRESS_SUPPORT_ADMIN_TEST_CREDENTIALS=$( AWS_PROFILE=identity_${BUILD_ENV} aws secretsmanager get-secret-value --secret-id=${secret_id_test_user_support_admin} | jq ".SecretString | fromjson" )
export CYPRESS_MAINTAINER_TEST_CREDENTIALS=$( AWS_PROFILE=identity_${BUILD_ENV} aws secretsmanager get-secret-value --secret-id=${secret_id_test_user_maintainer} | jq ".SecretString | fromjson" )


# Set variables required for Cypress tests
export CYPRESS_BASE_URL="http://localhost:3000"
export CYPRESS_KEYCLOAK_HOSTNAME=$keycloak_dev_url
export CYPRESS_BUILD_ENV="local"
export BUILD_ENV="local"
echo "Cypress base URL is ${CYPRESS_BASE_URL}"

# Run Cypress tests in normal mode
cd portal
AWS_PROFILE=portal_dev npx cypress run

# Kill the portal server process after first set of tests
for pid in $(ps -ef | grep portal/node_modules/.bin/next | grep -v grep | awk '{print $2}'); do
  kill "$pid"
done

# Run portal server in maintenance mode
cd ..
scripts/run-portal-server-in-background.sh true

# Wait until portal server has started in maintenance mode
sleep 10

# Run Cypress tests in maintenance mode
cd portal
MAINTENANCE_MODE=true AWS_PROFILE=portal_dev npx cypress run
