import {readFileSync,writeFileSync} from 'node:fs';
const t=JSON.parse(readFileSync('template.yaml','utf8'));
for(const [name,r] of Object.entries(t.Resources)){if(r.Type==='AWS::Serverless::Function'){r.Properties.FunctionName={'Fn::Sub':'${AWS::StackName}-'+name.toLowerCase()};r.Properties.Role={'Fn::Sub':'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/${AWS::StackName}-'+name.toLowerCase()};delete r.Properties.Policies;}}
delete t.Conditions.UseHaiku; // External runtime roles are managed separately.
const foundation=structuredClone(t);for(const [name,r] of Object.entries(foundation.Resources)){if(r.Type==='AWS::Serverless::Function'||r.Type==='AWS::Logs::LogGroup')delete foundation.Resources[name]}
delete foundation.Outputs.SeedFunction;
delete foundation.Conditions;delete foundation.Parameters;delete foundation.Rules;
foundation.Outputs.ImportQueueUrl={Value:{Ref:'ImportQueue'}};foundation.Outputs.OCRQueueUrl={Value:{Ref:'OCRQueue'}};foundation.Outputs.LineQueueUrl={Value:{Ref:'LineQueue'}};
t.Outputs.ImportQueueUrl=foundation.Outputs.ImportQueueUrl;t.Outputs.OCRQueueUrl=foundation.Outputs.OCRQueueUrl;t.Outputs.LineQueueUrl=foundation.Outputs.LineQueueUrl;
writeFileSync('template-foundation.yaml',JSON.stringify(foundation,null,2)+'\n');writeFileSync('template-external-roles.yaml',JSON.stringify(t,null,2)+'\n');
