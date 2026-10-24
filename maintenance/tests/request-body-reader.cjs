const test=require('node:test');
const assert=require('node:assert/strict');
const {readBoundedJson,declaredBodyTooLarge}=require('../test-support/request-body.cjs');
const encode=value=>new TextEncoder().encode(value);
function request(chunks,headers={}){
 let index=0,cancelled=false;
 const body=new ReadableStream({pull(controller){if(index===chunks.length)controller.close();else controller.enqueue(chunks[index++]);},cancel(){cancelled=true;}},{highWaterMark:0});
 return {req:new Request('https://preview.example',{method:'POST',body,headers,duplex:'half'}),pulls:()=>index,cancelled:()=>cancelled};
}
test('bounded JSON accepts the exact byte limit and UTF-8 split across chunks',async()=>{
 const value={message:'Турнир 😀'},bytes=encode(JSON.stringify(value));
 const r=request(Array.from(bytes,byte=>new Uint8Array([byte])));
 const result=await readBoundedJson(r.req,bytes.byteLength);
 assert.equal(result.tooLarge,false);assert.equal(JSON.stringify(result.value),JSON.stringify(value));
 assert.equal(r.cancelled(),false);assert.equal(r.req.body.locked,false);
});
test('bounded JSON counts UTF-8 bytes, not JavaScript characters',async()=>{
 const text=JSON.stringify({message:'😀😀😀'}),bytes=encode(text),r=request([bytes]);
 assert.ok(bytes.byteLength>text.length);
 assert.equal((await readBoundedJson(r.req,text.length)).tooLarge,true);
 assert.equal(r.cancelled(),true);assert.equal(r.req.body.locked,false);
});
test('bounded JSON stops at overflow without draining the rest of the stream',async()=>{
 const r=request([encode('{"v":"'),encode('123456789'),encode('never read"}')]);
 assert.equal((await readBoundedJson(r.req,10)).tooLarge,true);
 assert.equal(r.pulls(),2);assert.equal(r.cancelled(),true);assert.equal(r.req.body.locked,false);
});
test('bounded JSON does not wait for a sender to finish cancellation',{timeout:1000},async()=>{
 let cancelled=false;
 const stream=new ReadableStream({start(c){c.enqueue(encode('oversized'));},cancel(){cancelled=true;return new Promise(()=>{});}});
 const req=new Request('https://preview.example',{method:'POST',body:stream,duplex:'half'});
 assert.equal((await readBoundedJson(req,2)).tooLarge,true);assert.equal(cancelled,true);assert.equal(req.body.locked,false);
});
test('bounded JSON handles a rejected cancellation without exposing its error',async()=>{
 const stream=new ReadableStream({start(c){c.enqueue(encode('oversized'));},cancel(){return Promise.reject(Error('PRIVATE STREAM ERROR'));}});
 const req=new Request('https://preview.example',{method:'POST',body:stream,duplex:'half'});
 assert.equal((await readBoundedJson(req,2)).tooLarge,true);assert.equal(req.body.locked,false);
});
test('bounded JSON leaves declared oversized bodies unread',async()=>{
 const r=request([encode('{}')],{'content-length':'11'});
 assert.equal((await readBoundedJson(r.req,10)).tooLarge,true);
 assert.equal(r.pulls(),0);assert.equal(r.req.body.locked,false);
});
test('bounded JSON preserves invalid, missing and failed body schema handling',async()=>{
 for(const chunks of [[],[encode('{"broken":')]]){
  const r=request(chunks),result=await readBoundedJson(r.req,100);
  assert.equal(result.tooLarge,false);assert.equal(result.value,null);assert.equal(r.req.body.locked,false);
 }
 const empty=await readBoundedJson(new Request('https://preview.example'),100);
 assert.equal(empty.tooLarge,false);assert.equal(empty.value,null);
 const stream=new ReadableStream({pull(c){c.error(Error('PRIVATE READ ERROR'));}});
 const failed=new Request('https://preview.example',{method:'POST',body:stream,duplex:'half'});
 const result=await readBoundedJson(failed,100);
 assert.equal(result.tooLarge,false);assert.equal(result.value,null);assert.equal(failed.body.locked,false);
});
test('Content-Length is only an early rejection hint',()=>{
 for(const value of [null,'1','10','invalid','-1']){
  const headers=new Headers();if(value!==null)headers.set('content-length',value);
  assert.equal(declaredBodyTooLarge({headers},10),false);
 }
 assert.equal(declaredBodyTooLarge({headers:new Headers({'content-length':'11'})},10),true);
});
