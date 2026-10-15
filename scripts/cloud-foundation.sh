#!/usr/bin/env bash
set -euo pipefail
export AWS_DEFAULT_REGION=ap-southeast-1 AWS_PAGER="" SAM_CLI_TELEMETRY=0
[[ "$(aws sts get-caller-identity --query Account --output text)" == "109991964227" ]] || exit 1
cd "$(dirname "$0")/.."
existing="$(python3 - <<'PY'
import boto3
from botocore.exceptions import ClientError
try:
 s=boto3.client('cloudformation',region_name='ap-southeast-1').describe_stacks(StackName='marginsight')['Stacks'][0]
 assert s['StackStatus'] in ['CREATE_COMPLETE','UPDATE_COMPLETE'],s['StackStatus']
 print('EXISTS')
except ClientError as e:
 if e.response['Error']['Code']=='ValidationError' and 'does not exist' in e.response['Error']['Message']:print('NEW')
 else:raise
PY
)"
if [[ "$existing" == "EXISTS" ]]; then
  echo "Foundation already exists. Continue with external-role full template; never downgrade the running stack to foundation."
  exit 0
fi
sam validate --lint --region ap-southeast-1 --template-file template-foundation.yaml
sam deploy --template-file template-foundation.yaml --stack-name marginsight --region ap-southeast-1 --resolve-s3 --no-confirm-changeset --no-fail-on-empty-changeset
