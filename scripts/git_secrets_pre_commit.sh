#!/usr/bin/env bash

set -euxo pipefail

git secrets --add-provider -- cat ./nhsd-rules-deny.txt || echo "ALREADY ADDED"

git secrets --pre_commit_hook
