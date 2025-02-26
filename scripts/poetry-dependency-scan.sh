#! /bin/bash

set -e

INITIAL_DIR=$(pwd)

for PROJECT in $(find src/aws-lambda -maxdepth 1 -mindepth 1 -type d -exec basename {} \; | sort)
do
  cat <<BANNER
=======================================================

Scanning dependencies for [$PROJECT]

=======================================================
BANNER

  cd "$INITIAL_DIR/src/aws-lambda/$PROJECT"

  echo "Installing safety"
  poetry run pip install safety

  echo "Installing dependencies"
  poetry install --with dev --no-root  # No --sync, we want to keep safety and it's dependencies

  echo "Scanning dependency graph"
  # Checks against https://github.com/pyupio/safety-db which is updated once per month
  vulns=`cat ../../../pipmoduleignore.txt`
  poetry run safety check --full-report $vulns
done


echo "All good!"
