"""SQS/Lambda import with 1,000 synthetic rows; no Cognito E2E claim."""
import boto3,json,uuid,datetime,time
r='ap-southeast-1';assert boto3.client('sts').get_caller_identity()['Account']=='109991964227'
o=json.load(open('foundation-outputs.json'));table=boto3.resource('dynamodb',region_name=r).Table(o['JobsTable']);ledger=boto3.resource('dynamodb',region_name=r).Table(o['LedgerTable'])
s3=boto3.client('s3',region_name=r);q=boto3.client('sqs',region_name=r);store='AWS-VERIFY-IMPORT-'+uuid.uuid4().hex[:8]
headers='platform,order_id,line_id,order_at,sku,quantity,revenue_thb,buyer_payment_thb,packaging_thb,ads_thb,seller_shipping_thb\n'
rows=[f'mock-market,O-{i:04d},L1,2026-10-14,SKU-DEMO-01,1,200.00,200.00,5.00,10.00,10.00' for i in range(1000)]
def run(csv,label):
 job_id=str(uuid.uuid4());key=f'{store}/imports/{job_id}/orders.csv'
 s3.put_object(Bucket=o['UploadsBucket'],Key=key,Body=csv.encode(),ContentType='text/csv')
 table.put_item(Item={'PK':'STORE#'+store,'SK':'JOB#'+job_id,'version':1,'value':{'id':job_id,'kind':'orders','fileName':'orders.csv','adapter':'mock-v1','dataOrigin':'MOCK','status':'QUEUED','type':'text/csv','objectKey':key,'chunks':0,'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}})
 task=json.dumps({'kind':'IMPORT','store':store,'jobId':job_id})
 q.send_message(QueueUrl=o['ImportQueueUrl'],MessageBody=task)
 # A duplicate delivery deliberately exercises retry safety.
 q.send_message(QueueUrl=o['ImportQueueUrl'],MessageBody=task)
 deadline=time.monotonic()+90
 while time.monotonic()<deadline:
  job=table.get_item(Key={'PK':'STORE#'+store,'SK':'JOB#'+job_id},ConsistentRead=True)['Item']['value']
  if job['status'] in ['COMPLETED','PARTIAL','FAILED']:break
  time.sleep(2)
 result={'label':label,'jobId':job_id,**{k:str(job.get(k)) for k in ['status','accepted','duplicate','rejected','conflict','completedChunks','totalRows']}}
 print(json.dumps(result),flush=True);return result
first=run(headers+'\n'.join(rows)+'\n','1000 rows plus duplicate SQS delivery')
assert first['status']=='COMPLETED' and int(first['accepted'])+int(first['duplicate'])==1000 and first['rejected']=='0',first
overlap=run(headers+'\n'.join(rows[:5])+'\n','overlap 5 rows')
assert overlap['status']=='COMPLETED' and overlap['duplicate']=='5' and overlap['accepted']=='0',overlap
changed=run(headers+rows[0].replace('200.00,200.00','201.00,201.00')+'\n','conflicting revenue remains unchanged')
assert changed['status']=='PARTIAL' and changed['conflict']=='1',changed
existing=ledger.get_item(Key={'PK':'STORE#'+store+'#ORDER#mock-market#O-0000','SK':'ITEM#L1'},ConsistentRead=True)['Item']['value'];assert int(existing['revenueSatang'])==20000,existing
report={'scope':'operator IAM writes synthetic input; real private S3 / SQS / Lambda / DynamoDB; no user login E2E','origin':'MOCK','store':store,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'results':[first,overlap,changed],'originalRevenueSatang':20000}
json.dump(report,open('import-smoke-result.json','w'),indent=2)
print('PASS AWS 1000-row import, retry, overlap and conflicting evidence preservation',flush=True)
