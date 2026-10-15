import {z} from 'zod';
export function businessDate(at:string){const n=Date.parse(at);if(!Number.isFinite(n))throw new Error('INVALID_DATE');return new Date(n+7*3600000).toISOString().slice(0,10)}
export function businessMonth(at:string){return businessDate(at).slice(0,7)}
export function normalizeDate(value:string){if(/^\d{4}-\d{2}-\d{2}$/.test(value)){const iso=new Date(value+'T00:00:00+07:00').toISOString();if(businessDate(iso)!==value)throw new Error('INVALID_DATE');return iso}z.string().datetime({offset:true}).parse(value);return new Date(value).toISOString()}
