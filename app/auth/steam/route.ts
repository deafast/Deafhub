import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { steamLoginUrl } from '@/lib/steam/openid';
import { createClient } from '@/lib/supabase/server';
export const runtime='nodejs';
export async function GET(request:NextRequest) {
 if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({error:'Steam setup is not complete'},{status:503});
 const state=randomBytes(32).toString('hex');
 const client=await createClient();
 const {data} = client ? await client.auth.getUser() : {data:{user:null}};
 const callback=new URL('/auth/steam/callback',request.url); callback.searchParams.set('state',state);
 const response=NextResponse.redirect(steamLoginUrl(callback.href,request.nextUrl.origin));
 response.cookies.set('dh-steam-state',state,{httpOnly:true,secure:request.nextUrl.protocol==='https:',sameSite:'lax',maxAge:600,path:'/auth/steam'});
 response.cookies.set('dh-steam-user',data.user?.id || 'new',{httpOnly:true,secure:request.nextUrl.protocol==='https:',sameSite:'lax',maxAge:600,path:'/auth/steam'});
 response.headers.set('Cache-Control','private, no-store');
 return response;
}
