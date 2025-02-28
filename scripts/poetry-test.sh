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
poetry lock --check

echo "Installing dependencies"
poetry install --with dev --no-root --sync

echo "Running tests"
poetry run pytest
