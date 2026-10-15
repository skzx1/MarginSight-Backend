"""Read back an authorized personal store; no merchant data or credentials printed."""
import boto3,json,argparse,re,datetime,urllib.request,urllib.error
p=argparse.ArgumentParser();p.add_argument('--store',required=True);p.add_argument('--name',required=True);a=p.parse_args();assert re.fullmatch(r'SHOP-[a-f0-9]{64}',a.store)
r='ap-southeast-1';assert boto3.client('sts').get_caller_identity()['Account']=='109991964227'
o={x['OutputKey']:x['OutputValue'] for x in boto3.client('cloudformation',region_name=r).describe_stacks(StackName='marginsight')['Stacks'][0]['Outputs']};d=boto3.resource('dynamodb',region_name=r);m=d.Table(o['MembershipsTable']);profile=m.get_item(Key={'PK':'STORE#'+a.store,'SK':'PROFILE'},ConsistentRead=True)['Item']['value'];assert profile['name']==a.name and profile['dataOrigin']=='REAL'
member=m.get_item(Key={'PK':'USER#'+profile['owner'],'SK':'STORE#'+a.store},ConsistentRead=True)['Item']['value'];assert member['personal'] and member['role']=='OWNER' and member['name']==a.name
u=boto3.client('cognito-idp',region_name=r).list_users(UserPoolId=o['UserPoolId'],Filter='sub = "'+profile['owner']+'"',Limit=2)['Users'];assert len(u)==1 and u[0]['Enabled'] and u[0]['UserStatus']=='CONFIRMED';attrs={x['Name']:x['Value'] for x in u[0]['Attributes']};assert attrs.get('email_verified')=='true'
catalog=d.Table(o['CatalogTable']).query(KeyConditionExpression='#p=:p',ExpressionAttributeNames={'#p':'PK'},ExpressionAttributeValues={':p':'STORE#'+a.store},Select='COUNT',ConsistentRead=True)['Count'];assert catalog==0
orders=d.Table(o['LedgerTable']).query(IndexName='ByStoreMonth',KeyConditionExpression='#p=:p',ExpressionAttributeNames={'#p':'GSI1PK'},ExpressionAttributeValues={':p':'STORE#'+a.store+'#MONTH#2026-10'},Select='COUNT')['Count'];assert orders==0
req=urllib.request.Request(o['ApiUrl']+'/me/store',method='POST',data=b'{"name":"Anonymous attempt"}',headers={'Content-Type':'application/json','Origin':o['WebUrl']})
try: status=urllib.request.urlopen(req,timeout=10).status
except urllib.error.HTTPError as e: status=e.code
assert status==401
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'browser authenticated self-service creation plus operator read-back; no fresh-signup/password automation; no real merchant financial data inserted','account':'109991964227','region':r,'storeName':a.name,'cognitoConfirmed':True,'emailVerified':True,'personal':True,'role':'OWNER','dataOrigin':'REAL','catalogEntries':catalog,'monthOrders':orders,'unauthenticatedCreateStatus':status,'profileAndMembershipConsistent':True}
json.dump(report,open('self-service-store-evidence.json','w'),indent=2);print(json.dumps(report));print('PASS verified Cognito owner, private empty store, consistent transaction and unauthorized creation denial')
