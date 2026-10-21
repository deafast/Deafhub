import {z} from 'zod';
const schema=z.object({at:z.string().datetime({offset:true}),key:z.string().min(1).max(160)}).strict();
export function readHistoryCursor(value:string|null){
 if(!value)return null;
 if(value.length>512||!/^[A-Za-z0-9_-]+$/.test(value))throw Error('Invalid cursor');
 try{return schema.parse(JSON.parse(Buffer.from(value,'base64url').toString('utf8')));}catch{throw Error('Invalid cursor');}
}
export function writeHistoryCursor(value:{at:string;key:string}){return Buffer.from(JSON.stringify(schema.parse(value))).toString('base64url');}
