import type {APIGatewayProxyEventV2} from 'aws-lambda';
import {cloudContext} from '../context.js';
import {safeError} from '../api.js';
export async function handler(e:APIGatewayProxyEventV2){try{const raw=Buffer.from(e.body??'',e.isBase64Encoded?'base64':'utf8');if(raw.length>200000)return {statusCode:413,body:'Too large'};await cloudContext().line.webhook(raw,e.headers['x-line-signature']??'');return {statusCode:200,body:'ok'}}catch(e){return {statusCode:safeError(e).status,body:'Webhook rejected'}}}
