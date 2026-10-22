import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {createClient} from '@/lib/supabase/server';
const uuid=z.string().uuid();
const payload=z.discriminatedUnion('action',[
 z.object({action:z.literal('configure'),tournament_id:uuid,enabled:z.boolean(),opens_at:z.string().datetime().nullable(),closes_at:z.string().datetime().nullable(),reason:z.string().trim().min(3).max(500)}),
 z.object({action:z.literal('check_in'),entry_id:uuid,window_version:uuid,ready:z.boolean()}),
]);
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:NextRequest){
 const client=await createClient();if(!client)return reply({error:'Unavailable'},503);
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 const id=uuid.safeParse(req.nextUrl.searchParams.get('id'));if(!id.success)return reply({error:'Invalid tournament'},400);
 const entries=await client.from('hub_entries').select('id').eq('tournament_id',id.data);
 if(entries.error)return reply({error:'Check-in unavailable'},503);
 const [window,checkins,tournament]=await Promise.all([
  client.from('hub_checkin_windows').select('*').eq('tournament_id',id.data).maybeSingle(),
  client.from('hub_player_checkins').select('*').in('entry_id',entries.data.map(e=>e.id)),
  client.from('hub_tournaments').select('rules_version').eq('id',id.data).maybeSingle(),
 ]);
 if(window.error||checkins.error||tournament.error||!tournament.data)return reply({error:'Check-in unavailable'},503);
 return reply({window:window.data,checkins:checkins.data,rulesVersion:tournament.data.rules_version});
}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Forbidden'},403);
 if(Number(req.headers.get('content-length'))>10000)return reply({error:'Request too large'},413);
 const client=await createClient();if(!client)return reply({error:'Unavailable'},503);
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 const parsed=payload.safeParse(await req.json().catch(()=>null));if(!parsed.success)return reply({error:'Check all fields'},400);
 const {action,...p}=parsed.data;
 const result=await client.rpc('hub_checkin_action',{action,p});
 const allowed=['Organizer required','Tournament not found','Check-in is locked after launch','Reason required','Invalid check-in window','Approved registered player required','Refresh the check-in window','Check-in window is closed','Registered roster is incomplete','Confirm current participation rules first'];
 if(result.error)return reply({error:allowed.includes(result.error.message)?result.error.message:'Could not save check-in'},result.error.message==='Organizer required'?403:400);
 return reply(result.data);
}
