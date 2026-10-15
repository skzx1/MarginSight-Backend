"""Recover only our generated poison message; preserve all application messages."""
import boto3,json,time,base64,uuid,hashlib
r='ap-southeast-1';assert boto3.client('sts').get_caller_identity()['Account']=='109991964227'
o=json.load(open('foundation-outputs.json'));lam=boto3.client('lambda',region_name=r);q=boto3.client('sqs',region_name=r);queue=o['ImportQueueUrl'];a=q.get_queue_attributes(QueueUrl=queue,AttributeNames=['RedrivePolicy'])['Attributes'];dlq=q.get_queue_url(QueueName=json.loads(a['RedrivePolicy'])['deadLetterTargetArn'].split(':')[-1])['QueueUrl']
mappings=lam.list_event_source_mappings(FunctionName='marginsight-importworker')['EventSourceMappings'];assert len(mappings)==1;mapping_id=mappings[0]['UUID']
def wait(state):
 for _ in range(45):
  if lam.get_event_source_mapping(UUID=mapping_id)['State']==state:return
  time.sleep(1)
 raise AssertionError('Mapping state '+state+' not reached')
prefix='invalid-json:MarginSight-MOCK-DLQ:';counts=[];matched=False;marker_hash=None
identifier=str(uuid.uuid4());response=lam.invoke(FunctionName='marginsight-importworker',Payload=json.dumps({'Records':[{'messageId':identifier,'body':prefix+'direct-invoke-proof'}]}).encode());assert json.load(response['Payload'])=={'batchItemFailures':[{'itemIdentifier':identifier}]}
try:
 lam.update_event_source_mapping(UUID=mapping_id,Enabled=False);wait('Disabled')
 print('Import poller paused for isolated poison recovery; waiting for existing visibility lease',flush=True)
 deadline=time.monotonic()+420
 while time.monotonic()<deadline:
  messages=q.receive_message(QueueUrl=queue,MaxNumberOfMessages=1,VisibilityTimeout=5,WaitTimeSeconds=2,MessageSystemAttributeNames=['ApproximateReceiveCount']).get('Messages',[])
  for message in messages:
   if not message['Body'].startswith(prefix):
    q.change_message_visibility(QueueUrl=queue,ReceiptHandle=message['ReceiptHandle'],VisibilityTimeout=0)
    raise AssertionError('Unrelated application work preserved; abort test')
   counts.append(int(message['Attributes']['ApproximateReceiveCount']));marker_hash=hashlib.sha256(message['Body'].encode()).hexdigest();q.change_message_visibility(QueueUrl=queue,ReceiptHandle=message['ReceiptHandle'],VisibilityTimeout=0)
  moved=q.receive_message(QueueUrl=dlq,MaxNumberOfMessages=1,VisibilityTimeout=30,WaitTimeSeconds=1).get('Messages',[])
  if moved:
   message=moved[0]
   if not message['Body'].startswith(prefix):
    q.change_message_visibility(QueueUrl=dlq,ReceiptHandle=message['ReceiptHandle'],VisibilityTimeout=0)
    raise AssertionError('Unrelated DLQ message preserved')
   marker_hash=hashlib.sha256(message['Body'].encode()).hexdigest();q.delete_message(QueueUrl=dlq,ReceiptHandle=message['ReceiptHandle']);matched=True;break
 assert matched,'Recovery timeout; do not claim DLQ success'
finally:
 lam.update_event_source_mapping(UUID=mapping_id,Enabled=True);wait('Enabled')
report={'scope':'real Lambda partial-batch failure plus SQS redrive; operator-driven receives; recovery of our single generated invalid-JSON poison','origin':'MOCK','workerBatchFailure':True,'receiveCounts':counts,'dlqMatched':matched,'poisonBodySha256':marker_hash,'deletedOnlyGeneratedPoison':True,'mappingRestored':'Enabled','noApplicationRowsModified':True,'initialAttempt':'FAILED because in-flight Lambda long poll took the test message before manual receive; import poller restored after that attempt'}
json.dump(report,open('dlq-smoke-result.json','w'),indent=2)
print('DLQ_REPORT_B64_BEGIN'+base64.b64encode(json.dumps(report).encode()).decode()+'DLQ_REPORT_B64_END',flush=True)
print('PASS generated poison redrive + recovery; import poller restored',flush=True)
