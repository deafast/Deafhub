import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {getSteamPublicProfile,steamProfileUrl} from '@/lib/steam/profile';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
export async function GET(){
 const client=await createClient();
 if(!client)return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user)return NextResponse.json({error:'Sign in required'},{status:401,headers});
 const {data:account,error:linkError}=await client.from('steam_accounts').select('steam_id,linked_at').eq('user_id',user.id).maybeSingle();
 if(linkError)return NextResponse.json({error:'Unavailable'},{status:503,headers});
 if(!account)return NextResponse.json({linked:false},{headers});
 const publicData=await getSteamPublicProfile(account.steam_id,process.env.STEAM_WEB_API_KEY);
 return NextResponse.json({linked:true,steamId:account.steam_id,linkedAt:account.linked_at,url:steamProfileUrl(account.steam_id),...publicData},{headers});
}
