import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
for(const name of ['template.yaml','template-foundation.yaml','template-external-roles.yaml']){
  const template=JSON.parse(readFileSync(name,'utf8'));
  assert.equal(template.Transform,'AWS::Serverless-2016-10-31');
  for(const resource of Object.values(template.Resources))if(resource.Type==='AWS::Serverless::Function'){
    assert.equal(resource.Properties.CodeUri,'backend/dist/');
    assert.equal(resource.Properties.Runtime,'nodejs24.x');
  }
}
console.log('PASS template structure/CodeUri/runtime; SAM validation remains an operator deployment gate');
