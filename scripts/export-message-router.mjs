import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {ROUTER_PROMPT,ROUTER_VERSION,routerJsonSchema} from '../backend/src/message-router.ts';
import {routerCases} from '../backend/tests/fixtures/router-cases.ts';
const root='docs/message-router';await mkdir(root,{recursive:true});
const outputs={'router-prompt.txt':`${ROUTER_VERSION}\n\n${ROUTER_PROMPT}\n`,'router.schema.json':JSON.stringify(routerJsonSchema,null,2)+'\n','test-cases.json':JSON.stringify(routerCases,null,2)+'\n'};
for(const [name,content] of Object.entries(outputs)){
 const path=root+'/'+name;
 if(process.argv.includes('--check')){if(await readFile(path,'utf8')!==content)throw Error('Router contract drift: '+path);}
 else await writeFile(path,content);
}
console.log(`Router ${ROUTER_VERSION}: prompt/schema/${routerCases.length} synthetic cases ${process.argv.includes('--check')?'verified':'exported'}`);
