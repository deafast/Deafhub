import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export async function GET(){
 const enabled=Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
 const client=await createClient();
 const {data}=client ? await client.auth.getUser() : {data:{user:null}};
 let linked=false;
 if(data.user && client){const {data:account}=await client.from('steam_accounts').select('steam_id').eq('user_id',data.user.id).maybeSingle();linked=Boolean(account);}
 return NextResponse.json({enabled,linked},{headers:{'Cache-Control':'private, no-store'}});
}
