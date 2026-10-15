"""Read-only canonical order count and retained-resource emptiness/size evidence."""
import boto3,json,datetime
r='ap-southeast-1';assert boto3.client('sts').get_caller_identity()['Account']=='109991964227'
o=json.load(open('foundation-outputs.json'));report=json.load(open('import-smoke-result.json'));table=boto3.resource('dynamodb',region_name=r).Table(o['LedgerTable'])
params={'IndexName':'ByStoreMonth','KeyConditionExpression':'#p = :p','ExpressionAttributeNames':{'#p':'GSI1PK'},'ExpressionAttributeValues':{':p':'STORE#'+report['store']+'#MONTH#2026-10'},'Select':'COUNT'}
count=0
while True:
 result=table.query(**params);count+=result['Count']
 if not result.get('LastEvaluatedKey'):break
 params['ExclusiveStartKey']=result['LastEvaluatedKey']
assert count==1000,count
old=json.load(open('aws-deployment-evidence.json'))['retainedFailedStackResources'];sizes=[]
for item in old:
 name=item['physical']
 if item['type']=='AWS::DynamoDB::Table':
  t=boto3.client('dynamodb',region_name=r).describe_table(TableName=name)['Table'];sizes.append({'physical':name,'itemCountApproximate':t['ItemCount'],'tableSizeBytesApproximate':t['TableSizeBytes']})
 else:
  b=boto3.client('s3',region_name=r).list_objects_v2(Bucket=name,MaxKeys=1);sizes.append({'physical':name,'emptyAtCheck':b.get('KeyCount',0)==0})
sources=boto3.client('lambda',region_name=r).list_event_source_mappings(FunctionName='marginsight-lineworker')['EventSourceMappings']
evidence={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'canonicalMockOrderCount':count,'store':report['store'],'retainedResourceSizes':sizes,'lineWorkerMappings':[{'UUID':x['UUID'],'State':x['State']} for x in sources]}
json.dump(evidence,open('aws-storage-inventory.json','w'),indent=2);print(json.dumps(evidence));assert all(x['State']=='Disabled' for x in sources),'Unconfigured LINE poller should be disabled'
print('PASS canonical 1000 order count and LINE poller disabled')
