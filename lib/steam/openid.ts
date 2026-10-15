import { timingSafeEqual } from 'node:crypto';
export const STEAM_ENDPOINT = 'https://steamcommunity.com/openid/login';
const NS = 'http://specs.openid.net/auth/2.0';
export function steamLoginUrl(returnTo: string, origin: string) {
 const url = new URL(STEAM_ENDPOINT);
 for (const [key,value] of Object.entries({ ns:NS, mode:'checkid_setup', return_to:returnTo, realm:origin, identity:`${NS}/identifier_select`, claimed_id:`${NS}/identifier_select` })) url.searchParams.set(`openid.${key}`,value);
 return url;
}
export function validState(actual: string | null, expected: string | undefined) {
 if (!actual || !expected) return false;
 const a=Buffer.from(actual); const b=Buffer.from(expected);
 return a.length===b.length && timingSafeEqual(a,b);
}
export async function verifySteam(params: URLSearchParams, returnTo: string, send: typeof fetch = fetch) {
 const unique = new Set<string>();
 for (const [key] of params) { if (unique.has(key)) throw new Error('Duplicate parameter'); unique.add(key); }
 const id = params.get('openid.claimed_id');
 const signed = new Set((params.get('openid.signed') || '').split(','));
 if (params.get('openid.ns') !== NS || params.get('openid.mode') !== 'id_res' || params.get('openid.op_endpoint') !== STEAM_ENDPOINT || params.get('openid.return_to') !== returnTo || !id || !/^https:\/\/steamcommunity\.com\/openid\/id\/7656119\d{10}$/.test(id) || params.get('openid.identity') !== id || !['op_endpoint','claimed_id','identity','return_to','response_nonce','assoc_handle'].every(k=>signed.has(k))) throw new Error('Invalid assertion');
 const nonce = params.get('openid.response_nonce') || '';
 const issued = Date.parse(nonce.slice(0,20));
 if (!Number.isFinite(issued) || Math.abs(Date.now()-issued)>600000) throw new Error('Expired assertion');
 const body = new URLSearchParams();
 for (const [key,value] of params) if (key.startsWith('openid.')) body.set(key,value);
 body.set('openid.mode','check_authentication');
 const response = await send(STEAM_ENDPOINT,{method:'POST',body,redirect:'error',signal:AbortSignal.timeout(10000)});
 if (!response.ok || !(await response.text()).split(/\r?\n/).includes('is_valid:true')) throw new Error('Unverified assertion');
 return {steamId:id.split('/').pop()!,nonce};
}

