import {NextRequest,NextResponse} from 'next/server';import {z} from 'zod';import {createClient} from '@/lib/supabase/server';
const uuid=z.string().uuid(),score=z.number().int().min(0).max(1000),common={tournament_id:uuid,match_id:z.string().min(1).max(64)};
const payload=z.discriminatedUnion('action',[
 z.object({action:z.literal('configure'),tournament_id:uuid,required:z.boolean()}),
 z.object({action:z.literal('assign_referee'),tournament_id:uuid,user_id:uuid,enabled:z.boolean()}),
 z.object({action:z.literal('submit'),...common,entry_id:uuid,result:z.object({kind:z.literal('played'),a:score,b:score,penalties:z.object({a:score,b:score}).optional()}),evidence:z.string().trim().max(2000)}),
 z.object({action:z.literal('confirm'),...common,entry_id:uuid,report_id:uuid,accepted:z.boolean(),reason:z.string().trim().max(2000)}),
 z.object({action:z.literal('decide'),...common,report_id:uuid,reason:z.string().trim().min(3).max(2000)}),
]);
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:NextRequest){
 const client=await createClient();if(!client)return reply({error:'Unavailable'},503);const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 const id=uuid.safeParse(req.nextUrl.searchParams.get('id'));if(!id.success)return reply({error:'Invalid tournament'},400);
 const results=await Promise.all([
  client.from('hub_result_rules').select('*').eq('tournament_id',id.data).maybeSingle(),
  client.from('hub_referees').select('user_id').eq('tournament_id',id.data),
  client.from('hub_current_result_reports').select('*').eq('tournament_id',id.data).order('sequence',{ascending:false}).limit(1024),
  client.from('hub_entries').select('id,player_id,team_id').eq('tournament_id',id.data),
  client.from('hub_teams').select('id,captain_id').eq('captain_id',user.id),
 ]);
 if(results.some(r=>r.error))return reply({error:'Match reports unavailable'},503);
 const [rules,referees,reports,entries,teams]=results;
 const votes=reports.data?.length?await client.from('hub_result_confirmations').select('*').in('report_id',reports.data.map(r=>r.id)):{data:[],error:null};
 if(votes.error)return reply({error:'Match reports unavailable'},503);
 return reply({rules:rules.data,referees:referees.data,reports:reports.data,confirmations:votes.data,captainEntries:entries.data?.filter(e=>e.player_id===user.id||teams.data?.some(t=>t.id===e.team_id&&t.captain_id===user.id)).map(e=>e.id),userId:user.id});
}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Forbidden'},403);
 if(Number(req.headers.get('content-length'))>12000)return reply({error:'Request too large'},413);
 const client=await createClient();if(!client)return reply({error:'Unavailable'},503);const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 const parsed=payload.safeParse(await req.json().catch(()=>null));if(!parsed.success)return reply({error:'Check all fields'},400);
 const {action,...p}=parsed.data;const result=await client.rpc('hub_result_action',{action,p});
 const allowed=['Organizer required','Tournament not found','Result rules are locked','Registered participant required','Playable match required','Revoke awards before correcting results','Match captain required','Report changed; refresh the match','Explain the dispute','Referee required','A participant cannot adjudicate their match','Explain the decision','Invalid result report'];
 if(result.error)return reply({error:allowed.includes(result.error.message)?result.error.message:'Could not save match report'},['Organizer required','Match captain required','Referee required'].includes(result.error.message)?403:400);
 return reply(result.data);
}
