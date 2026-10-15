import type {SQSEvent} from 'aws-lambda';
import {cloudContext} from '../context.js';
export async function handler(event:SQSEvent){const failures=[];for(const r of event.Records){try{await cloudContext().run(JSON.parse(r.body))}catch{failures.push({itemIdentifier:r.messageId});console.error(JSON.stringify({messageId:r.messageId,error:'WORKER_FAILURE'}))}}return {batchItemFailures:failures}}
