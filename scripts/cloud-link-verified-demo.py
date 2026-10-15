"""Operator-only: bind one verified, user-identified Cognito account to MOCK DEMO-001."""
import argparse,boto3,json,datetime
p=argparse.ArgumentParser();p.add_argument('--email',required=True);a=p.parse_args()
r='ap-southeast-1';account=boto3.client('sts').get_caller_identity()['Account'];assert account=='109991964227'
stack=boto3.client('cloudformation',region_name=r).describe_stacks(StackName='marginsight')['Stacks'][0]
assert stack['StackStatus']=='UPDATE_COMPLETE'
o={v['OutputKey']:v['OutputValue'] for v in stack['Outputs']};assert o['UserPoolId']=='ap-southeast-1_DUntBTgQH' and o['SeedFunction']=='marginsight-seed'
assert len(a.email)<255 and '"' not in a.email and '\\' not in a.email and '@' in a.email
users=boto3.client('cognito-idp',region_name=r).list_users(UserPoolId=o['UserPoolId'],Filter='email = "'+a.email+'"',Limit=2)['Users']
assert len(users)==1,'EXPECTED_EXACTLY_ONE_MATCHING_USER'
u=users[0];attrs={v['Name']:v['Value'] for v in u['Attributes']}
assert attrs.get('email','').lower()==a.email.lower() and attrs.get('email_verified')=='true','EMAIL_NOT_VERIFIED'
assert u['Enabled'] and u['UserStatus']=='CONFIRMED','USER_NOT_CONFIRMED'
sub=attrs['sub'];assert len(sub)==36
membership=boto3.resource('dynamodb',region_name=r).Table(o['MembershipsTable']);key={'PK':'USER#'+sub,'SK':'STORE#DEMO-001'}
before=membership.get_item(Key=key,ConsistentRead=True).get('Item')
result=boto3.client('lambda',region_name=r).invoke(FunctionName='marginsight-seed',InvocationType='RequestResponse',Payload=json.dumps({'users':[{'sub':sub,'store':'DEMO-001'}]}).encode())
assert not result.get('FunctionError'),'SEED_FUNCTION_FAILED'
payload=json.loads(result['Payload'].read());assert payload=={'seeded':1,'dataOrigin':'MOCK'},payload
row=membership.get_item(Key=key,ConsistentRead=True)['Item'];assert row['value']['role']=='OWNER' and row['value']['dataOrigin']=='MOCK'
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'account':account,'region':r,'scope':'user-identified email matched exactly one enabled CONFIRMED Cognito account with verified email; no password read/reset; private subject/email omitted','cognitoEmailVerified':True,'userStatus':u['UserStatus'],'store':'DEMO-001','membershipExisted':bool(before),'role':'OWNER','dataOrigin':'MOCK','seedResult':payload}
json.dump(report,open('verified-demo-membership.json','w'),indent=2);print(json.dumps(report));print('PASS requested verified user bound only to MOCK DEMO-001')
