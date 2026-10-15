import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {CognitoJwtVerifier} from 'aws-jwt-verify';
import {AppError,demand} from './errors.js';
const localKey=randomBytes(32);let verifier:ReturnType<typeof CognitoJwtVerifier.create>|undefined;
export function localSession(user:string){demand(process.env.LOCAL_MODE==='true','LOCAL_AUTH_DISABLED',403);demand(['demo-a','demo-b'].includes(user),'INVALID_DEMO_USER');const part=Buffer.from(JSON.stringify({sub:user,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');return 'local.'+part+'.'+createHmac('sha256',localKey).update(part).digest('base64url')}
export async function subject(authorization:string|undefined):Promise<string>{
 demand(authorization?.startsWith('Bearer '),'UNAUTHORIZED',401);const token=authorization!.slice(7);
 if(process.env.LOCAL_MODE==='true'){const [prefix,part,sig]=token.split('.');demand(prefix==='local'&&part&&sig,'UNAUTHORIZED',401);const actual=Buffer.from(sig,'base64url'),expected=createHmac('sha256',localKey).update(part).digest();demand(actual.length===expected.length&&timingSafeEqual(actual,expected),'UNAUTHORIZED',401);try{const claims=JSON.parse(Buffer.from(part,'base64url').toString());demand(claims.exp>Date.now()/1000&&['demo-a','demo-b'].includes(claims.sub),'UNAUTHORIZED',401);return claims.sub}catch{throw new AppError('UNAUTHORIZED',401)}}
 demand(process.env.USER_POOL_ID&&process.env.USER_POOL_CLIENT_ID,'AUTH_NOT_CONFIGURED',503);
 verifier??=CognitoJwtVerifier.create({userPoolId:process.env.USER_POOL_ID!,clientId:process.env.USER_POOL_CLIENT_ID!,tokenUse:'access',scope:'marginsight/api'});
 try{return (await verifier.verify(token)).sub}catch{throw new AppError('UNAUTHORIZED',401)}
}
