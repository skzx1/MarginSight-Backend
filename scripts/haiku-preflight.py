"""Read-only access/budget gate for Haiku in the approved team account.

Uses CountTokens (not inference). Never creates an agreement, Marketplace
subscription, IAM grant, API key, project, or cross-Region inference profile.
Requires the operator's existing AWS credentials and boto3/botocore.
"""
import json
from datetime import datetime, timezone
from urllib.request import Request
from urllib.error import HTTPError

ACCOUNT = '109991964227'
REGION = 'us-east-1'
MODEL = 'anthropic.claude-haiku-4-5'
URL = f'https://bedrock-mantle.{REGION}.api.aws/anthropic/v1/messages/count_tokens'


def check_access():
    import boto3
    from botocore.auth import SigV4Auth
    from botocore.awsrequest import AWSRequest
    from botocore.config import Config

    session = boto3.Session(region_name=REGION)
    config = Config(retries={'total_max_attempts': 1}, connect_timeout=5, read_timeout=15)
    assert session.client('sts', config=config).get_caller_identity()['Account'] == ACCOUNT, 'Wrong account'
    budget = session.client('budgets', config=config).describe_budget(AccountId=ACCOUNT, BudgetName='Hackathon-Team10')['Budget']
    limit, spend = budget['BudgetLimit'], budget['CalculatedSpend']['ActualSpend']
    assert limit['Unit'] == spend['Unit'] == 'USD' and float(limit['Amount']) == 350, 'Unexpected team budget'
    assert float(spend['Amount']) < 25, 'Trial target reached; review actual spend before more usage'
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'account': ACCOUNT, 'region': REGION, 'model': MODEL,
              'budgetLimit': limit, 'laggedActualSpend': spend, 'budgetUpdatedAt': str(budget.get('LastUpdatedTime')),
              'scope': 'CountTokens only; does not prove inference, Lambda IAM, or browser assistant success'}
    body = json.dumps({'model': MODEL, 'messages': [{'role': 'user', 'content': 'Hello'}]}).encode()
    request = AWSRequest(method='POST', url=URL, data=body, headers={'content-type': 'application/json', 'anthropic-version': '2023-06-01'})
    SigV4Auth(session.get_credentials().get_frozen_credentials(), 'bedrock-mantle', REGION).add_auth(request)
    # Do not follow redirects to a different endpoint with signed credentials.
    from urllib.request import HTTPRedirectHandler, build_opener
    class NoRedirect(HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs):
            return None
    try:
        with build_opener(NoRedirect).open(Request(URL, data=body, headers=dict(request.headers.items()), method='POST'), timeout=20) as response:
            payload = json.loads(response.read(4096))
            assert isinstance(payload.get('input_tokens'), int), 'Unexpected CountTokens response'
            report.update(status='ACCESS_PROBE_PASSED', inputTokens=payload['input_tokens'])
    except HTTPError as error:
        report.update(status='BLOCKED_EXTERNAL', httpStatus=error.code)
        print(json.dumps(report))
        raise RuntimeError(f'Haiku account access probe denied (HTTP {error.code}); ask the organizer, do not subscribe or change organization policy') from None
    print(json.dumps(report))
    return report


if __name__ == '__main__':
    check_access()
