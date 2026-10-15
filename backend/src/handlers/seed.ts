import {z} from 'zod';
import {cloudContext} from '../context.js';
import {seed} from '../seed.js';
export async function handler(event:unknown){const input=z.object({users:z.array(z.object({sub:z.string().regex(/^[a-f0-9-]{36}$/),store:z.enum(['DEMO-001','DEMO-002'])})).min(1).max(2)}).parse(event);await seed(cloudContext().repo,input.users);return {seeded:input.users.length,dataOrigin:'MOCK'}}
