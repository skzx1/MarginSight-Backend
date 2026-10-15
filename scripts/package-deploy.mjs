import {mkdir,cp} from 'node:fs/promises';
const root='artifacts/deploy';await mkdir(root,{recursive:true});
await cp('backend/dist',root+'/backend/dist',{recursive:true});
for(const file of ['template.yaml','template-foundation.yaml','template-external-roles.yaml'])await cp(file,root+'/'+file);
console.log('Deployment payload prepared: artifacts/deploy (no credentials).');
