#! /bin/sh
SCRIPT_DIR=$(dirname "$(realpath "$0")")
. "$SCRIPT_DIR/variables.sh"
set -e
echo "Downloading Lambda package from CI..."
mkdir -p ./build
CI_JOB_TOKEN=${CI_JOB_TOKEN:-$(awk -F '"' '/token =/ {print $2}' ~/.terraformrc)}
CI_COMMIT_SHA=$(git rev-parse HEAD)
wget --header="PRIVATE-TOKEN: $CI_JOB_TOKEN" -O ./build/lambda-package.zip "https://$git_url/api/v4/projects/$git_project_id/packages/generic/build_output/${CI_COMMIT_SHA}/build_output.zip"
echo "Download complete. Unzipping..."
unzip -o -d ./build ./build/lambda-package.zip
echo "Unzip complete."