"""Read-only deployment, budget, region and retained-resource inventory."""
import boto3,json,datetime,urllib.request,urllib.error
r='ap-southeast-1';account=boto3.client('sts').get_caller_identity()['Account'];assert account=='109991964227'
cf=boto3.client('cloudformation',region_name=r)
stack=cf.describe_stacks(StackName='marginsight')['Stacks'][0]
outputs={x['OutputKey']:x['OutputValue'] for x in stack['Outputs']}
resources=cf.list_stack_resources(StackName='marginsight')['StackResourceSummaries']
old=cf.list_stack_resources(StackName='marginsight-demo')['StackResourceSummaries']
retained=[{'logical':x['LogicalResourceId'],'physical':x.get('PhysicalResourceId'),'type':x['ResourceType'],'status':x['ResourceStatus']} for x in old if x['ResourceStatus']=='DELETE_SKIPPED']
budget=boto3.client('budgets',region_name='us-east-1').describe_budget(AccountId=account,BudgetName='Hackathon-Team10')['Budget']
lam=boto3.client('lambda',region_name=r)
functions=[]
for name in ['api','assistant','importworker','ocrworker','linewebhook','lineworker','seed']:
 c=lam.get_function_configuration(FunctionName='marginsight-'+name)
 functions.append({k:c.get(k) for k in ['FunctionName','State','LastUpdateStatus','Runtime','Architectures','MemorySize','Timeout','CodeSha256']})
def http(url):
 try:
  with urllib.request.urlopen(url,timeout=15) as response:return response.status
 except urllib.error.HTTPError as e:return e.code
checks={'publicHealth':http(outputs['ApiUrl']+'/health'),'protectedStoresNoToken':http(outputs['ApiUrl']+'/me/stores'),'privateUploadBucket':http('https://'+outputs['UploadsBucket']+'.s3.'+r+'.amazonaws.com/'),'privateWebBucket':http('https://'+outputs['WebBucket']+'.s3.'+r+'.amazonaws.com/index.html'),'httpsWeb':http(outputs['WebUrl'])}
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'account':account,'region':r,'stackStatus':stack['StackStatus'],'stackTags':stack.get('Tags',[]),'health':json.load(urllib.request.urlopen(outputs['ApiUrl']+'/health')),'outputs':outputs,'functions':functions,'resources':[{'logical':x['LogicalResourceId'],'physical':x.get('PhysicalResourceId'),'type':x['ResourceType'],'status':x['ResourceStatus']} for x in resources],'eventSourceMappings':[{'function':name,'UUID':m['UUID'],'State':m['State'],'FunctionResponseTypes':m.get('FunctionResponseTypes'),'ScalingConfig':m.get('ScalingConfig')} for name in ['marginsight-importworker','marginsight-ocrworker','marginsight-lineworker'] for m in lam.list_event_source_mappings(FunctionName=name)['EventSourceMappings']],'retainedFailedStackResources':retained,'budget':{'name':budget['BudgetName'],'limit':budget['BudgetLimit'],'actual':budget.get('CalculatedSpend'),'lastUpdated':str(budget.get('LastUpdatedTime'))},'http':checks}
json.dump(report,open('aws-deployment-evidence.json','w'),ensure_ascii=False,indent=2)
print(json.dumps({'stack':report['stackStatus'],'outputs':outputs,'http':checks,'budget':report['budget'],'retained':retained},ensure_ascii=False))
assert stack['StackStatus']=='UPDATE_COMPLETE',stack['StackStatus']
assert all(x['State']=='Active' and x['LastUpdateStatus']=='Successful' for x in functions),functions
assert checks=={'publicHealth':200,'protectedStoresNoToken':401,'privateUploadBucket':403,'privateWebBucket':403,'httpsWeb':200},checks
print('PASS AWS infrastructure / health / public denial; authenticated E2E not verified')
