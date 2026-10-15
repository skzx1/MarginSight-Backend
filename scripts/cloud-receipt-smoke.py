"""Operator-only AWS smoke with a synthetic Thai receipt, not merchant accuracy proof."""
import boto3, json, uuid, datetime, hashlib
region='ap-southeast-1'
assert boto3.client('sts').get_caller_identity()['Account']=='109991964227'
o=json.load(open('foundation-outputs.json'))
store='AWS-VERIFY-MOCK'; job_id=str(uuid.uuid4())
key=f'{store}/receipts/{job_id}/receipt-thai-mock.png'
image=open('receipt-thai-mock.png','rb').read()
boto3.client('s3',region_name=region).put_object(Bucket=o['UploadsBucket'],Key=key,Body=image,ContentType='image/png')
table=boto3.resource('dynamodb',region_name=region).Table(o['JobsTable'])
table.put_item(Item={'PK':'STORE#'+store,'SK':'JOB#'+job_id,'version':1,'value':{'id':job_id,'kind':'receipt','status':'QUEUED','dataOrigin':'MOCK','fileName':'receipt-thai-mock.png','objectKey':key,'type':'image/png','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}})
event={'Records':[{'messageId':str(uuid.uuid4()),'body':json.dumps({'kind':'OCR','store':store,'jobId':job_id})}]}
response=boto3.client('lambda',region_name=region).invoke(FunctionName='marginsight-ocrworker',Payload=json.dumps(event).encode())
payload=json.load(response['Payload']); assert not response.get('FunctionError'),payload
assert not payload.get('batchItemFailures'),payload
job=table.get_item(Key={'PK':'STORE#'+store,'SK':'JOB#'+job_id},ConsistentRead=True)['Item']['value']
def safe(v):
 from decimal import Decimal
 if isinstance(v,Decimal):return int(v) if v==int(v) else float(v)
 raise TypeError(type(v).__name__)
report={'scope':'synthetic receipt / operator IAM / Lambda + private S3 + DynamoDB + direct Bedrock us-east-1','origin':'MOCK','jobId':job_id,'imageSha256':hashlib.sha256(image).hexdigest(),'status':job['status'],'draft':job.get('draft'),'totalsMatch':job.get('totalsMatch'),'error':job.get('error'),'expected':{'quantity':6,'lineTotalTHB':'780.00','totalTHB':'780.00'},'confirmation':'not performed; merchant review still required'}
json.dump(report,open('receipt-smoke-result.json','w'),ensure_ascii=False,indent=2,default=safe)
print(json.dumps(report,ensure_ascii=False,default=safe))
assert job['status']=='REVIEW','OCR did not return a valid draft'
assert job['draft']['totalTHB']=='780.00','Total mismatch'
assert len(job['draft']['items'])==1 and job['draft']['items'][0]['quantity']==6,'Item quantity mismatch'
assert job['draft']['items'][0]['lineTotalTHB']=='780.00' and job['totalsMatch'] is True,'Line total mismatch'
print('PASS 1 synthetic Thai receipt; not a real merchant accuracy evaluation')
