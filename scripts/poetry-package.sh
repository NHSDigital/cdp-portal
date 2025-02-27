#! /bin/bash

set -e

PARENT_PROJECT=$1
INITIAL_DIR=$(pwd)

# Create the output directory if it does not already exist
mkdir -p "$INITIAL_DIR/build"

cat <<BANNER
=======================================================

Package for [$PARENT_PROJECT]

=======================================================
BANNER

cd "src/aws-lambda/$PARENT_PROJECT"

echo "Checking lockfile"
poetry lock --check

echo "Installing runtime dependencies"
poetry install --no-root --only main --sync

echo "Uninstalling pip and setuptools to exclude from output"
VENV=$(poetry env info --path)
"$VENV/bin/pip" uninstall -y setuptools pip || echo "Pip already uninstalled"

echo "Creating build output zip with all remaining dependencies"
ZIP_PATH="$INITIAL_DIR/build/$PARENT_PROJECT.zip"
SITE_PACKAGES="$(find "$VENV" -name site-packages)"
cd "$SITE_PACKAGES"
zip -9 -q -r "$ZIP_PATH" . --exclude '*/__pycache__/*'

echo "Adding project code to zip"
cd "$INITIAL_DIR/src/aws-lambda/$PARENT_PROJECT/$PARENT_PROJECT"
zip -ur "$ZIP_PATH" . --exclude '__pycache__/*'

echo "Deleting virtual env"
poetry env remove --all
