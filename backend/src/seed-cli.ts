import {AwsStorage} from './storage.js';
import {Repository} from './repository.js';
import {seed} from './seed.js';
import {demand} from './errors.js';
demand(process.env.AWS_ACCOUNT_ID==='109991964227'&&process.env.AWS_REGION==='ap-southeast-1','WRONG_DEPLOYMENT_TARGET');const users=JSON.parse(process.env.SEED_MEMBERSHIPS??'[]');demand(Array.isArray(users)&&users.length>0,'SEED_MEMBERSHIPS_REQUIRED');await seed(new Repository(new AwsStorage()),users);console.log('Seeded MOCK stores for configured Cognito subjects');
