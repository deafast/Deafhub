import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { State } from '@/lib/tournament/engine';
const uuid=z.string().uuid();
const game=z.enum(['dota2','cs2','fc']);
const date=z.string().datetime({offset:true});
const actionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('create_team'),name:z.string().trim().min(2).max(40),game}),
 z.object({action:z.literal('join_team'),code:uuid}),
 z.object({action:z.literal('register'),team_id:uuid,tournament_id:uuid,rules_version:uuid,accepted:z.literal(true)}),
 z.object({action:z.literal('create_tournament'),title:z.string().trim().min(3).max(100),game,starts_at:date,rules:z.string().min(20).max(12000),roster_size:z.number().int().min(1).max(10)}),
 z.object({action:z.literal('review_entry'),entry_id:uuid,status:z.enum(['approved','rejected'])}),
 z.object({action:z.literal('create_match'),tournament_id:uuid,entry_a:uuid,entry_b:uuid,starts_at:date}),
 z.object({action:z.literal('finish_match'),match_id:uuid,score_a:z.number().int().min(0).max(1000),score_b:z.number().int().min(0).max(1000)}),
 z.object({action:z.literal('finish_tournament'),tournament_id:uuid}),
 z.object({action:z.literal('leave_team'),team_id:uuid}),
 z.object({action:z.literal('rotate_invite'),team_id:uuid}),
 z.object({action:z.literal('close_tournament'),tournament_id:uuid}),
]).refine(value=>value.action!=='create_tournament'||value.game!=='fc'||value.roster_size===1,{message:'FC requires an individual 1v1 roster'});
const headers={'Cache-Control':'private, no-store'};
export async function GET() {
 const client=await createClient();
 if(!client) return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user) return NextResponse.json({error:'Sign in required'},{status:401,headers});
 const results=await Promise.all([
  client.from('hub_teams').select('*').order('created_at',{ascending:false}).limit(500),
  client.from('hub_members').select('*').limit(5000),
  client.from('hub_tournaments').select('*').order('starts_at').limit(500),
  client.from('hub_entries').select('*').limit(5000),
  client.from('hub_matches').select('*').order('starts_at',{ascending:false}).limit(500),
  client.from('hub_invites').select('*'),
  client.from('hub_entry_players').select('entry_id').eq('user_id',user.id),
  client.from('hub_organizers').select('user_id').eq('user_id',user.id).maybeSingle(),
  client.from('steam_accounts').select('steam_id').eq('user_id',user.id).maybeSingle(),
  client.from('hub_engines').select('tournament_id,revision,state').limit(500),
  client.from('hub_all_player_stats').select('matches,wins,draws').eq('user_id',user.id).maybeSingle(),
 ]);
 if(results.some(r=>r.error)) return NextResponse.json({error:'Competition setup is not complete'},{status:503,headers});
 const [teams,members,tournaments,entries,matches,invites,ownEntries,organizer,steam,engines,stats]=results;
 const engineMatches=(engines.data||[]).flatMap(e=>(e.state as State).matches.filter(m=>m.a&&m.b&&['ready','finished'].includes(m.status)).map(m=>({id:`${e.tournament_id}/${m.id}`,tournament_id:e.tournament_id,entry_a:m.a!,entry_b:m.b!,starts_at:tournaments.data?.find(t=>t.id===e.tournament_id)?.starts_at,score_a:m.result?.kind==='played'?m.result.a:null,score_b:m.result?.kind==='played'?m.result.b:null,status:m.status==='ready'?'scheduled':'finished',engine_match:m.id,result_kind:m.result?.kind||null,penalties:m.result?.kind==='played'?m.result.penalties??null:null})));
 return NextResponse.json({engines:engines.data||[],engineIds:engines.data?.map(e=>e.tournament_id)||[],userId:user.id,teams:teams.data,members:members.data,tournaments:tournaments.data,entries:entries.data,matches:[...(matches.data||[]),...engineMatches],invites:invites.data,ownEntryIds:ownEntries.data?.map(e=>e.entry_id),organizer:Boolean(organizer.data),steamId:steam.data?.steam_id||null,stats:stats.data||{matches:0,wins:0,draws:0}},{headers});
}
export async function POST(request:NextRequest) {
 if(request.headers.get('origin')!==request.nextUrl.origin) return NextResponse.json({error:'Forbidden'},{status:403,headers});
 const client=await createClient();
 if(!client) return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user) return NextResponse.json({error:'Sign in required'},{status:401,headers});
 const parsed=actionSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success) return NextResponse.json({error:'Check all fields'},{status:400,headers});
 const {action,...p}=parsed.data;
 const {data,error:rpcError}=await client.rpc('hub_action',{action,p});
 if(rpcError) {
  const allowed=['Complete player confirmations and organizer review first','Use tournament engine','Finish all matches first','Captain cannot leave the team','Membership not found','Captain required','Sign in required','Save your player nickname first','Invitation not found','Roster locked during tournament participation','Roster full','Captain and matching game required','Registration closed','Read and accept current rules','Roster size does not match tournament','A player is already registered','Organizer access required','Choose a future date','Organizer required','Entry is already in a match','Two approved entries required','Result already confirmed','Cannot close tournament'];
  const message=allowed.find(text=>rpcError.message===text);
  return NextResponse.json({error:message || (rpcError.code==='23505'?'This team, membership or entry already exists':'Could not save. Check fields and permissions.')},{status:400,headers});
 }
 return NextResponse.json({saved:true,data},{headers});
}

