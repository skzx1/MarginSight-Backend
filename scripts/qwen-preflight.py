"""Read-only Qwen3 32B access/budget gate; never invokes or activates a model."""
import json
from datetime import datetime, timezone

ACCOUNT = '109991964227'
REGION = 'us-east-1'
MODEL = 'qwen.qwen3-32b-v1:0'


def check_access():
    import boto3
    from botocore.config import Config
    session = boto3.Session(region_name=REGION)
    config = Config(retries={'total_max_attempts': 1}, connect_timeout=5, read_timeout=15)
    assert session.client('sts', config=config).get_caller_identity()['Account'] == ACCOUNT, 'Wrong account'
    budget = session.client('budgets', config=config).describe_budget(AccountId=ACCOUNT, BudgetName='Hackathon-Team10')['Budget']
    limit, spend = budget['BudgetLimit'], budget['CalculatedSpend']['ActualSpend']
    assert limit['Unit'] == spend['Unit'] == 'USD' and float(limit['Amount']) == 350, 'Unexpected team budget'
    assert float(spend['Amount']) < 25, 'Trial target reached; review spend before more usage'
    client = session.client('bedrock', config=config)
    access = client.get_foundation_model_availability(modelId=MODEL)
    details = client.get_foundation_model(modelIdentifier=MODEL)['modelDetails']
    assert access.get('authorizationStatus') == 'AUTHORIZED', 'Qwen authorization unavailable'
    assert access.get('entitlementAvailability') == access.get('regionAvailability') == 'AVAILABLE', 'Qwen account/Region unavailable'
    assert access.get('agreementAvailability', {}).get('status') == 'AVAILABLE', 'Qwen agreement unavailable; do not activate or subscribe automatically'
    assert 'ON_DEMAND' in details.get('inferenceTypesSupported', []), 'Direct in-Region inference unavailable'
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'account': ACCOUNT, 'region': REGION, 'model': MODEL,
              'budgetLimit': limit, 'laggedActualSpend': spend, 'budgetUpdatedAt': str(budget.get('LastUpdatedTime')),
              'status': 'METADATA_ACCESS_PASSED', 'scope': 'read-only metadata; inference and Lambda IAM must be tested separately'}
    print(json.dumps(report))
    return report


if __name__ == '__main__':
    check_access()
