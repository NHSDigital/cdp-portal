#!/bin/bash
SCRIPT_DIR=$(dirname "$(realpath "$0")")
. "$SCRIPT_DIR/variables.sh"
set -eo pipefail

# Use this to configure your local hosts file to alias the dev public network
# load balancer to the dev internal portal API Gateway host name. This will
# allow requests to li7gnh7rjl.execute-api.eu-west-2.amazonaws.com to resolve
# correctly and be routed to the load balancer, such that the internal portal
# and its APIs to be accessed from your laptop, provided you are connected to
# the VPN.

# NOTE: Running this script requires sudo to allow /etc/hosts to be modified.

# NOTE: This script works by finding the public IP addresses of the network load
# balancer by resolving it's DNS name. Because these IP addresses are ephemeral
# they may change from time to time, and so this script may need to be re-run
# periodically.

# If the infrastructure ever gets redeployed such that the public NLB is
# recreated with a different id then the new DNS name can be found in the AWS
# console or with the following:
# 
# LB_DNS=$(aws elbv2 describe-load-balancers \
# --names i-portal-nlb-public \
# --region eu-west-2 \
# --output json \
# --query 'LoadBalancers[0].DNSName' | tr -d '"')


# If the infrastructure ever gets redeployed such that the API gateway is
# recreated with a different id then the new DNS name can be found in the AWS
# console or with the following:
# 
# APIGW_ID=$(aws apigateway get-rest-apis \
# --region eu-west-2 \
# --output json \
# --query 'items[?name==`internal-portal-rest-api-private`].id | [0]'  | tr -d '"')

for var in APIGW_ID PERMISSIONS_APIGW_ID LB_DNS; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set."
    exit 1
  fi
  echo "$var is set to: ${!var}"
done

APIGW_HOST="${APIGW_ID}.execute-api.eu-west-2.amazonaws.com"
PERMISSIONS_APIGW_HOST="${PERMISSIONS_APIGW_ID}.execute-api.eu-west-2.amazonaws.com"

# Find the IP addresses the load balancer DNS name resolves to, and create the
# lines to add to /etc/hosts.
# HOSTS are the entries that need to be added to /etc/hosts, ie for each IP
# address there is a line like:
# <ip address> <API Gateway Id>.execute-api.eu-west-2.amazonaws.com
HOSTS=$(dig +short $LB_DNS | sed "s/.*/& $APIGW_HOST/")

PERMISSIONS_HOSTS=$(dig +short $LB_DNS | sed "s/.*/& $PERMISSIONS_APIGW_HOST/")

echo "Updating /etc/hosts..." >&2

# Remove any entries previously created by this script
sed -i '/# Internal Portal Records/,/# End Internal Portal Records/d' /etc/hosts
sed -i '/# Permissions Service Records/,/# End Permissions Service Records/d' /etc/hosts

# Add the hosts to /etc/hosts
echo "# Internal Portal Records" >> /etc/hosts
echo "$HOSTS" >> /etc/hosts
echo "# End Internal Portal Records" >> /etc/hosts

echo "# Permissions Service Records" >> /etc/hosts
echo "$PERMISSIONS_HOSTS" >> /etc/hosts
echo "# End Permissions Service Records" >> /etc/hosts

echo "Finished" >&2
echo "" >&2
echo "Internal portal API host records" >&2
echo "$HOSTS"
echo "" >&2
echo "Permissions service API host records" >&2
echo "$PERMISSIONS_HOSTS"