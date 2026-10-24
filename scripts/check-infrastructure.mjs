import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
for(const name of ['template.yaml','template-foundation.yaml','template-external-roles.yaml']){
  const template=JSON.parse(readFileSync(name,'utf8'));
  assert.equal(template.Transform,'AWS::Serverless-2016-10-31');
  for(const resource of Object.values(template.Resources))if(resource.Type==='AWS::Serverless::Function'){
    assert.equal(resource.Properties.CodeUri,'backend/dist/');
    assert.equal(resource.Properties.Runtime,'nodejs24.x');
    assert.equal(resource.Properties.Environment.Variables.ASSISTANT_MODEL_ID.Ref,'AssistantModelId');
    assert.equal(resource.Properties.Environment.Variables.BEDROCK_MODEL_ID,'amazon.nova-lite-v1:0');
  }
  if(name!=='template-foundation.yaml'){
    assert.deepEqual(template.Parameters.AssistantModelId.AllowedValues,['amazon.nova-lite-v1:0','anthropic.claude-haiku-4-5']);
    assert.equal(template.Parameters.AssistantModelId.Default,'amazon.nova-lite-v1:0','do not activate an unavailable model by default');
    assert.deepEqual(template.Rules.HaikuRegion.Assertions[0].Assert,{'Fn::Equals':[{Ref:'AIRegion'},'us-east-1']});
  }
}
const policy=JSON.parse(readFileSync('scripts/haiku-runtime-policy.json','utf8')).Statement;
assert.equal(policy.length,1);
assert.equal(policy[0].Action,'bedrock-mantle:CreateInference');
assert.equal(policy[0].Resource,'arn:aws:bedrock-mantle:us-east-1:109991964227:project/*');
assert.deepEqual(policy[0].Condition.StringEquals,{'aws:RequestedRegion':'us-east-1','bedrock-mantle:Model':'anthropic.claude-haiku-4-5','bedrock-mantle:ServiceTier':'default'});
console.log('PASS template structure/CodeUri/runtime; SAM validation remains an operator deployment gate');
