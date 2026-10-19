import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { validState, verifySteam } from '@/lib/steam/openid';
import { claimSteamAccount } from '@/lib/steam/link';
export const runtime='nodejs';
export async function GET(request:NextRequest) {
 let target='/sign-in?error=steam';
 try {
  const params=request.nextUrl.searchParams;
  const state=params.get('state');
  if (!validState(state,request.cookies.get('dh-steam-state')?.value)) throw new Error('State mismatch');
  const callback=new URL('/auth/steam/callback',request.url); callback.searchParams.set('state',state!);
  const {steamId,nonce}=await verifySteam(params,callback.href);
  const admin=createAdminClient(); const client=await createClient();
  if (!admin || !client) throw new Error('Unavailable');
  const {error:replay}=await admin.from('steam_nonces').insert({nonce_hash:createHash('sha256').update(nonce).digest('hex')});
  if (replay) throw new Error('Replayed assertion');
  const {data:{user:current}}=await client.auth.getUser();
  const expected=request.cookies.get('dh-steam-user')?.value;
  if (!expected || (expected==='new' && current) || (expected!=='new' && current?.id!==expected)) throw new Error('Session changed');
  const {data:linked,error:lookupError}=await admin.from('steam_accounts').select('user_id').eq('steam_id',steamId).maybeSingle();
  if (lookupError) throw lookupError;
  if (current) {
   if (linked && linked.user_id!==current.id) throw new Error('Already linked');
   await claimSteamAccount(steamId,current.id,{
    insert:async(id,userId)=>{const {error}=await admin.from('steam_accounts').insert({steam_id:id,user_id:userId});return {error};},
    owner:async(id)=>{const {data,error}=await admin.from('steam_accounts').select('user_id').eq('steam_id',id).maybeSingle();return {userId:data?.user_id||null,error};},
   });
  } else {
   let userId=linked?.user_id as string | undefined;
   const email=`${steamId}@steam.deafhub.invalid`;
   if (!userId) {
    const {data,error}=await admin.auth.admin.createUser({email,email_confirm:true,app_metadata:{steam_id:steamId}});
    if (error || !data.user) throw error || new Error('Cannot create user');
    userId=data.user.id;
    const {error:linkError}=await admin.from('steam_accounts').insert({steam_id:steamId,user_id:userId});
    if (linkError) { await admin.auth.admin.deleteUser(userId); throw linkError; }
   }
   const {data:account,error:accountError}=await admin.auth.admin.getUserById(userId);
   if (accountError || !account.user?.email) throw new Error('Unavailable account');
   const {data,error}=await admin.auth.admin.generateLink({type:'magiclink',email:account.user.email});
   if (error || !data.properties?.hashed_token) throw error || new Error('Cannot establish session');
   const {error:sessionError}=await client.auth.verifyOtp({token_hash:data.properties.hashed_token,type:'magiclink'});
   if (sessionError) throw sessionError;
  }
  target='/auth/complete';
 } catch { /* Never return assertions, credentials or account details. */ }
 const response=NextResponse.redirect(new URL(target,request.url));
 for (const name of ['dh-steam-state','dh-steam-user']) response.cookies.set(name,'',{maxAge:0,path:'/auth/steam'});
 response.headers.set('Cache-Control','private, no-store');
 response.headers.set('Referrer-Policy','no-referrer');
 return response;
}

