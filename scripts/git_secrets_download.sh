#!/usr/bin/env bash
set -euxo pipefail

installPath="$HOME/git-secrets"
if [ -d "$installPath" ];
then
  echo "Git secrets already cloned"
else
  git clone https://github.com/awslabs/git-secrets.git $installPath
fi
