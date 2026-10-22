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
type Client=NonNullable<Awaited<ReturnType<typeof createClient>>>;
type ReportRow={id:string;sequence:number;[key:string]:unknown};
type VoteRow={report_id:string;entry_id:string;[key:string]:unknown};
// Every page uses the authenticated client/RLS. Never return a silently truncated list.
async function readReports(client:Client,id:string){
 const data:ReportRow[]=[];let cursor:number|undefined;
 for(;;){
  let query=client.from('hub_current_result_reports').select('*').eq('tournament_id',id).order('sequence',{ascending:false}).limit(200);
  if(cursor!==undefined)query=query.lt('sequence',cursor);
  const page=await query;if(page.error||!page.data)return {data,error:true};
  if(!page.data.length)return {data,error:false};
  for(const row of page.data as ReportRow[]){
   if(!Number.isSafeInteger(row.sequence)||row.sequence<=0||(cursor!==undefined&&row.sequence>=cursor)||data.length>=4096)return {data,error:true};
   data.push(row);cursor=row.sequence;
  }
 }
}
async function readVotes(client:Client,reports:ReportRow[]){
 const data:VoteRow[]=[];
 for(let start=0;start<reports.length;start+=80){
  const ids=reports.slice(start,start+80).map(r=>r.id);let offset=0;
  for(;;){
   const page=await client.from('hub_result_confirmations').select('*').in('report_id',ids).order('report_id').order('entry_id').range(offset,offset+199);
   if(page.error||!page.data)return {data,error:true};
   if(!page.data.length)break;
   offset+=page.data.length;if(offset>ids.length*2)return {data,error:true};
   data.push(...page.data as VoteRow[]);
  }
 }
 return {data,error:false};
}
export async function GET(req:NextRequest){
 const client=await createClient();if(!client)return reply({error:'Unavailable'},503);const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 const id=uuid.safeParse(req.nextUrl.searchParams.get('id'));if(!id.success)return reply({error:'Invalid tournament'},400);
 const results=await Promise.all([
  client.from('hub_result_rules').select('*').eq('tournament_id',id.data).maybeSingle(),
  client.from('hub_referees').select('user_id').eq('tournament_id',id.data),
  readReports(client,id.data),
  client.from('hub_entries').select('id,player_id,team_id').eq('tournament_id',id.data),
  client.from('hub_teams').select('id,captain_id').eq('captain_id',user.id),
 ]);
 if(results.some(r=>r.error))return reply({error:'Match reports unavailable'},503);
 const [rules,referees,reports,entries,teams]=results;
 const votes=await readVotes(client,reports.data||[]);
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
