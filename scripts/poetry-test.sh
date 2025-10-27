#! /bin/bash

set -e

PARENT_PROJECT=$1
INITIAL_DIR=$(pwd)

# Create the output directory if it does not already exist
mkdir -p "$INITIAL_DIR/build"

cat <<BANNER
=======================================================

Build & Test for [$PARENT_PROJECT]

=======================================================
BANNER

cd "src/aws-lambda/$PARENT_PROJECT"

echo "Checking lockfile"
poetry check --lock

echo "Installing dependencies"
poetry sync --with dev --no-root

echo "Running tests"
poetry run pytest
