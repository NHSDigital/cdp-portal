#!/bin/bash

set -eu

SCRIPT_DIR=$(dirname "$(realpath "$0")")
. "$SCRIPT_DIR/variables.sh"

# Determine spec pattern based on portal service
if [ "${PORTAL_SERVICE}" = "CDP" ]; then
  SPEC="cypress/e2e_cdp/**/*.cy.ts"
else
  SPEC="cypress/e2e/**/*.cy.ts"
fi

export CYPRESS_PORTAL_SERVICE="${PORTAL_SERVICE}"  
export CYPRESS_BASE_URL="http://localhost:3000"
export CYPRESS_KEYCLOAK_HOSTNAME="$keycloak_dev_url"
export CYPRESS_BUILD_ENV="local"
export BUILD_ENV="local"

# Retrieve test user credentials from AWS Secrets Manager
echo "Retrieving test user credentials..."
export CYPRESS_ANALYST_TEST_CREDENTIALS=$(AWS_PROFILE=identity_dev aws secretsmanager get-secret-value --secret-id="${secret_id_test_user_analyst}" | jq ".SecretString | fromjson")
export CYPRESS_USER_MANAGER_TEST_CREDENTIALS=$(AWS_PROFILE=identity_dev aws secretsmanager get-secret-value --secret-id="${secret_id_test_user_user_manager}" | jq ".SecretString | fromjson")
export CYPRESS_SUPPORT_ADMIN_TEST_CREDENTIALS=$(AWS_PROFILE=identity_dev aws secretsmanager get-secret-value --secret-id="${secret_id_test_user_support_admin}" | jq ".SecretString | fromjson")
export CYPRESS_MAINTAINER_TEST_CREDENTIALS=$(AWS_PROFILE=identity_dev aws secretsmanager get-secret-value --secret-id="${secret_id_test_user_maintainer}" | jq ".SecretString | fromjson")

echo "Cypress base URL: ${CYPRESS_BASE_URL}"
echo "Spec pattern: ${SPEC}"

run_portal_server() {
  local maintenance=$1
  echo "Starting portal server (MAINTENANCE_MODE=${maintenance})..."
  scripts/run-portal-server-in-background.sh "$maintenance"
  sleep 10
}

kill_portal_server() {
  echo "Killing portal server..."
  for pid in $(ps -ef | grep portal/node_modules/.bin/next | grep -v grep | awk '{print $2}'); do
    kill "$pid" || true
  done
}

# Run portal server in normal mode
run_portal_server false

# Run Cypress tests in normal mode
cd portal
echo "Running Cypress tests in normal mode..."
AWS_PROFILE=${portal_dev_profile} npx cypress run --spec "$SPEC"

# Kill portal server after normal tests
kill_portal_server

# Only run maintenance mode tests if service is CDP
if [ "${PORTAL_SERVICE}" = "CDP" ]; then
  cd ..
  run_portal_server true
  cd portal
  echo "Running Cypress tests in maintenance mode..."
  MAINTENANCE_MODE=true AWS_PROFILE=${portal_dev_profile} npx cypress run --spec "$SPEC"

  # Kill portal server after maintenance tests
  kill_portal_server
fi

echo "Cypress runs complete."
