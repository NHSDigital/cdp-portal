#! /bin/bash

set -e

PARENT_PROJECT=$1
INITIAL_DIR=$(pwd)

cd "src/aws-lambda/$PARENT_PROJECT"

echo "Updating the dependencies"
poetry update 
