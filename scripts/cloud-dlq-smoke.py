"""Isolated poison-message proof; pause/restore only this empty prototype queue."""
import boto3,json,uuid,time,base64
r='ap-southeast-1';assert boto3.client('sts').get_caller_identity()['Account']=='109991964227'
o=json.load(open('foundation-outputs.json'));lam=boto3.client('lambda',region_name=r);q=boto3.client('sqs',region_name=r)
queue=o['ImportQueueUrl'];attrs=q.get_queue_attributes(QueueUrl=queue,AttributeNames=['All'])['Attributes'];dlq_arn=json.loads(attrs['RedrivePolicy'])['deadLetterTargetArn'];dlq=q.get_queue_url(QueueName=dlq_arn.split(':')[-1])['QueueUrl']
def empty(url):
 a=q.get_queue_attributes(QueueUrl=url,AttributeNames=['ApproximateNumberOfMessages','ApproximateNumberOfMessagesNotVisible','ApproximateNumberOfMessagesDelayed'])['Attributes'];return all(int(v)==0 for v in a.values())
assert empty(queue) and empty(dlq),'Do not disturb a queue containing application work'
mapping=lam.list_event_source_mappings(FunctionName='marginsight-importworker')['EventSourceMappings'];assert len(mapping)==1 and mapping[0]['State']=='Enabled';mapping_id=mapping[0]['UUID']
def wait(state):
 for _ in range(40):
  if lam.get_event_source_mapping(UUID=mapping_id)['State']==state:return
  time.sleep(1)
 raise AssertionError('Event source did not reach '+state)
marker='invalid-json:MarginSight-MOCK-DLQ:'+str(uuid.uuid4());message_id=str(uuid.uuid4())
failure=lam.invoke(FunctionName='marginsight-importworker',Payload=json.dumps({'Records':[{'messageId':message_id,'body':marker}]}).encode());body=json.load(failure['Payload']);assert body=={'batchItemFailures':[{'itemIdentifier':message_id}]},body
counts=[];matched=False
try:
 lam.update_event_source_mapping(UUID=mapping_id,Enabled=False);wait('Disabled');time.sleep(25);assert empty(queue),'Unexpected application work after pause'
 q.send_message(QueueUrl=queue,MessageBody=marker)
 for _ in range(15):
  messages=q.receive_message(QueueUrl=queue,MaxNumberOfMessages=1,VisibilityTimeout=5,WaitTimeSeconds=1,MessageSystemAttributeNames=['ApproximateReceiveCount']).get('Messages',[])
  if messages:
   m=messages[0];assert m['Body']==marker,'Never consume unrelated messages';counts.append(int(m['Attributes']['ApproximateReceiveCount']));q.change_message_visibility(QueueUrl=queue,ReceiptHandle=m['ReceiptHandle'],VisibilityTimeout=0)
  moved=q.receive_message(QueueUrl=dlq,MaxNumberOfMessages=1,VisibilityTimeout=30,WaitTimeSeconds=1).get('Messages',[])
  if moved:
   m=moved[0];assert m['Body']==marker,'Never delete unrelated DLQ messages';q.delete_message(QueueUrl=dlq,ReceiptHandle=m['ReceiptHandle']);matched=True;break
 assert matched and max(counts)>=5,(matched,counts)
finally:
 lam.update_event_source_mapping(UUID=mapping_id,Enabled=True);wait('Enabled')
report={'scope':'real Lambda partial-batch failure and SQS redrive; receives driven by operator to avoid 30-minute visibility delays','origin':'MOCK','workerBatchFailure':True,'receiveCounts':counts,'dlqMatched':matched,'deletedOnlyGeneratedPoison':True,'mappingRestored':'Enabled','noApplicationRowsModified':True}
json.dump(report,open('dlq-smoke-result.json','w'),indent=2)
print('DLQ_REPORT_B64_BEGIN'+base64.b64encode(json.dumps(report).encode()).decode()+'DLQ_REPORT_B64_END',flush=True)
print('PASS Lambda batch failure / SQS DLQ / exact test-message cleanup / import poller restored',flush=True)
