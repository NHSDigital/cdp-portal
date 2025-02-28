# /bin/bash
SCRIPT_DIR=$(dirname "$(realpath "$0")")
. "$SCRIPT_DIR/variables.sh"
set -eu

cd portal

export BUILD_ENV=dev

export CYPRESS_ANALYST_TEST_CREDENTIALS=$( AWS_PROFILE=identity_${BUILD_ENV} aws secretsmanager get-secret-value --secret-id=${secret_id_test_user_analyst} | jq ".SecretString | fromjson" )
export CYPRESS_USER_MANAGER_TEST_CREDENTIALS=$( AWS_PROFILE=identity_${BUILD_ENV} aws secretsmanager get-secret-value --secret-id=${secret_id_test_user_user_manager} | jq ".SecretString | fromjson" )
export CYPRESS_SUPPORT_ADMIN_TEST_CREDENTIALS=$( AWS_PROFILE=identity_${BUILD_ENV} aws secretsmanager get-secret-value --secret-id=${secret_id_test_user_support_admin} | jq ".SecretString | fromjson" )
export CYPRESS_MAINTAINER_TEST_CREDENTIALS=$( AWS_PROFILE=identity_${BUILD_ENV} aws secretsmanager get-secret-value --secret-id=${secret_id_test_user_maintainer} | jq ".SecretString | fromjson" )

export CYPRESS_BUILD_ENV=local
export CYPRESS_BASE_URL=http://localhost:3000
export CYPRESS_KEYCLOAK_HOSTNAME=$keycloak_dev_url

npx cypress open
