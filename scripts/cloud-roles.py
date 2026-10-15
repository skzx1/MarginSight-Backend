"""Create only the 7 approved Lambda service roles. Never changes team SSO permissions."""
import json, subprocess, pathlib
REGION='ap-southeast-1'; ACCOUNT='109991964227'; STACK='marginsight'
def aws(*args):
    return subprocess.check_output(['aws',*args,'--region',REGION,'--output','json'],text=True)
assert json.loads(aws('sts','get-caller-identity'))['Account']==ACCOUNT
stack=json.loads(aws('cloudformation','describe-stacks','--stack-name',STACK))['Stacks'][0]
assert stack['StackStatus'] in ('CREATE_COMPLETE','UPDATE_COMPLETE')
o={x['OutputKey']:x['OutputValue'] for x in stack['Outputs']}
pathlib.Path('role-policies').mkdir(exist_ok=True)
trust={'Version':'2012-10-17','Statement':[{'Effect':'Allow','Principal':{'Service':'lambda.amazonaws.com'},'Action':'sts:AssumeRole'}]}
pathlib.Path('role-trust.json').write_text(json.dumps(trust))
names=['Api','Assistant','ImportWorker','OCRWorker','LineWebhook','LineWorker','Seed']
for name in names:
    role=STACK+'-'+name.lower()
    resources=[f'arn:aws:dynamodb:{REGION}:{ACCOUNT}:table/{o[n+"Table"]}' for n in ['Memberships','Catalog','Ledger','Jobs']]
    resources.append(resources[2]+'/index/ByStoreMonth')
    statements=[{'Effect':'Allow','Action':['dynamodb:GetItem','dynamodb:PutItem','dynamodb:Query','dynamodb:UpdateItem'],'Resource':resources}, {'Effect':'Allow','Action':['logs:CreateLogStream','logs:PutLogEvents'],'Resource':f'arn:aws:logs:{REGION}:{ACCOUNT}:log-group:/aws/lambda/{role}:*'}]
    if name in ['Api','ImportWorker','OCRWorker']:
        statements.append({'Effect':'Allow','Action':['s3:GetObject','s3:PutObject'],'Resource':'arn:aws:s3:::'+o['UploadsBucket']+'/*'})
    if name in ['Api','ImportWorker','LineWebhook']:
        queues=['Import','OCR','Line'] if name=='Api' else ['Import'] if name=='ImportWorker' else ['Line']
        statements.append({'Effect':'Allow','Action':'sqs:SendMessage','Resource':[f'arn:aws:sqs:{REGION}:{ACCOUNT}:'+o[k+'QueueUrl'].split('/')[-1] for k in queues]})
    if name in ['ImportWorker','OCRWorker','LineWorker']:
        q={'ImportWorker':'Import','OCRWorker':'OCR','LineWorker':'Line'}[name]
        statements.append({'Effect':'Allow','Action':['sqs:ReceiveMessage','sqs:DeleteMessage','sqs:GetQueueAttributes'],'Resource':f'arn:aws:sqs:{REGION}:{ACCOUNT}:'+o[q+'QueueUrl'].split('/')[-1]})
    if name in ['Assistant','OCRWorker','LineWorker']:
        statements.append({'Effect':'Allow','Action':'bedrock:InvokeModel','Resource':'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0'})
    policy={'Version':'2012-10-17','Statement':statements}; file=pathlib.Path('role-policies')/(role+'.json');file.write_text(json.dumps(policy,indent=2))
    try:
        created=json.loads(aws('iam','create-role','--role-name',role,'--assume-role-policy-document','file://role-trust.json'))
    except subprocess.CalledProcessError:
        # Verify the existing exact role and Lambda trust; never read the denied GetRolePolicy.
        created=json.loads(aws('iam','get-role','--role-name',role))
        assert created['Role']['AssumeRolePolicyDocument']==trust,'Unexpected existing role trust; stop for review'
    assert created['Role']['Arn']==f'arn:aws:iam::{ACCOUNT}:role/{role}'
    subprocess.check_call(['aws','iam','put-role-policy','--role-name',role,'--policy-name','MarginSightRuntime','--policy-document','file://'+str(file),'--region',REGION])
    print('Created approved scoped Lambda role:',role)
pathlib.Path('foundation-outputs.json').write_text(json.dumps(o,indent=2))
