import assert from 'node:assert/strict';
import { steamLoginUrl, validState, verifySteam, STEAM_ENDPOINT } from '../../lib/steam/openid.ts';
const returnTo='https://preview.example/auth/steam/callback?state=test';
const params=new URLSearchParams({'openid.ns':'http://specs.openid.net/auth/2.0','openid.mode':'id_res','openid.op_endpoint':STEAM_ENDPOINT,'openid.return_to':returnTo,'openid.claimed_id':'https://steamcommunity.com/openid/id/76561198000000000','openid.identity':'https://steamcommunity.com/openid/id/76561198000000000','openid.response_nonce':new Date().toISOString().replace(/\.\d{3}Z/,'Z')+'test','openid.assoc_handle':'test','openid.sig':'test','openid.signed':'op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle'});
let calls=0;
const verify=async(url,options)=>{calls++;assert.equal(url,STEAM_ENDPOINT);assert.equal(options.body.get('openid.mode'),'check_authentication');assert.equal(options.redirect,'error');return new Response('ns:http://specs.openid.net/auth/2.0\nis_valid:true\n');};
assert.equal(steamLoginUrl(returnTo,'https://preview.example').searchParams.get('openid.return_to'),returnTo);
assert.equal(validState('same','same'),true);
assert.equal(validState('same','other'),false);
assert.equal(validState('é','a'),false);
assert.equal((await verifySteam(params,returnTo,verify)).steamId,'76561198000000000');
assert.equal(calls,1);
for(const [key,value] of [['openid.return_to','https://attacker.example'],['openid.claimed_id','https://attacker.example/id/76561198000000000'],['openid.identity','https://steamcommunity.com/openid/id/76561198000000001'],['openid.op_endpoint','https://attacker.example'],['openid.signed','return_to'],['openid.response_nonce','2020-01-01T00:00:00Zold']]) {const tampered=new URLSearchParams(params);tampered.set(key,value);await assert.rejects(verifySteam(tampered,returnTo,verify));}
assert.equal(calls,1,'Invalid assertions must never be sent to a provider');
const duplicate=new URLSearchParams(params);duplicate.append('openid.identity',params.get('openid.identity'));await assert.rejects(verifySteam(duplicate,returnTo,verify));
await assert.rejects(verifySteam(params,returnTo,async()=>new Response('is_valid:false\n')));
console.log('PASS: Steam verification, state, signed fields, endpoint, return URL, expiry, duplicate and forged assertions');
