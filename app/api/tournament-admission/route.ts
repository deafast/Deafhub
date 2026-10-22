import {NextRequest,NextResponse} from 'next/server';import {z} from 'zod';import {createClient} from '@/lib/supabase/server';
const uuid=z.string().uuid(),payload=z.object({tournament_id:uuid,enabled:z.boolean(),reason:z.string().trim().min(3).max(500)});
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:NextRequest){
 const client=await createClient();if(!client)return reply({error:'Unavailable'},503);
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 const id=uuid.safeParse(req.nextUrl.searchParams.get('id'));if(!id.success)return reply({error:'Invalid tournament'},400);
 const rule=await client.from('hub_admission_rules').select('enabled').eq('tournament_id',id.data).maybeSingle();
 return rule.error?reply({error:'Admission unavailable'},503):reply({enabled:rule.data?.enabled??false});
}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Forbidden'},403);
 if(Number(req.headers.get('content-length'))>8000)return reply({error:'Request too large'},413);
 const client=await createClient();if(!client)return reply({error:'Unavailable'},503);
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 const parsed=payload.safeParse(await req.json().catch(()=>null));if(!parsed.success)return reply({error:'Check all fields'},400);
 const p=parsed.data;const result=await client.rpc('hub_set_auto_admission',{tid:p.tournament_id,enabled_value:p.enabled,reason:p.reason});
 const allowed=['Organizer required','Tournament not found','Admission rules are locked after launch','Reason required'];
 if(result.error)return reply({error:allowed.includes(result.error.message)?result.error.message:'Could not save admission rules'},result.error.message==='Organizer required'?403:400);
 return reply(result.data);
}
