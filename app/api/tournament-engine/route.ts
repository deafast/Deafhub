import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createTournament, transition, type State } from '@/lib/tournament/engine';
import {drawFcGroups} from '@/lib/tournament/fc-groups';
import type {FcLevel} from '@/lib/tournament/fc-levels';
const uuid=z.string().uuid();
const config=z.object({
 format:z.enum(['single','double']),grandFinal:z.enum(['reset','single']),bestOf:z.union([z.literal(1),z.literal(3),z.literal(5)]),
 fcScore:z.literal('goals').optional(),
 bronzeMatch:z.boolean().optional(),
 groups:z.array(z.object({id:z.string().regex(/^[A-Z0-9_-]{1,12}$/),entries:z.array(uuid).min(2).max(64)})).max(32),
 qualify:z.number().int().min(1).max(32),
 points:z.object({win:z.number().int().min(0).max(100),draw:z.number().int().min(0).max(100),loss:z.number().int().min(0).max(100)}),
});
const command=z.discriminatedUnion('type',[
 z.object({type:z.literal('schedule'),match:z.string().min(1).max(64),scheduledAt:z.string().datetime().nullable(),reason:z.string().trim().min(3).max(500)}),
 z.object({type:z.literal('launch'),config,entries:z.array(uuid).min(2).max(64)}),
 z.object({type:z.literal('qualify'),ties:z.record(z.string(),z.array(uuid).max(64))}),
 z.object({type:z.literal('result'),match:z.string().max(64),result:z.discriminatedUnion('kind',[
  z.object({kind:z.literal('played'),a:z.number().int().min(0).max(1000),b:z.number().int().min(0).max(1000),penalties:z.object({a:z.number().int().min(0).max(1000),b:z.number().int().min(0).max(1000)}).optional()}),
  z.object({kind:z.literal('forfeit'),loser:uuid}),
 ]),invalidate:z.boolean(),reason:z.string().trim().min(3).max(500)}),
]);
const payload=z.object({tournament_id:uuid,revision:z.number().int().min(0),request_id:uuid,command});
const headers={'Cache-Control':'private, no-store'};
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});
export async function GET(req:NextRequest) {
 const client=await createClient();if(!client)return reply({error:'Unavailable'},503);
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 const id=uuid.safeParse(req.nextUrl.searchParams.get('id'));if(!id.success)return reply({error:'Invalid tournament'},400);
 const {data,error:dbError}=await client.from('hub_engines').select('revision,state').eq('tournament_id',id.data).maybeSingle();
 return dbError?reply({error:'Tournament engine unavailable'},503):reply(data??{revision:0,state:null});
}
export async function POST(req:NextRequest) {
 if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Forbidden'},403);
 if(Number(req.headers.get('content-length'))>100000)return reply({error:'Request too large'},413);
 const client=await createClient(),admin=createAdminClient();if(!client||!admin)return reply({error:'Unavailable'},503);
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 const parsed=payload.safeParse(await req.json().catch(()=>null));if(!parsed.success)return reply({error:'Check all fields'},400);
 const p=parsed.data;
 const [t,role,stored,prior]=await Promise.all([
  client.from('hub_tournaments').select('game,organizer_id').eq('id',p.tournament_id).maybeSingle(),
  client.from('hub_organizers').select('user_id').eq('user_id',user.id).maybeSingle(),
  client.from('hub_engines').select('revision,state').eq('tournament_id',p.tournament_id).maybeSingle(),
  client.from('hub_engine_audit').select('command,actor_id').eq('tournament_id',p.tournament_id).eq('request_id',p.request_id).maybeSingle(),
 ]);
 if([t,role,stored,prior].some(r=>r.error))return reply({error:'Tournament engine unavailable'},503);
 if(t.data?.organizer_id!==user.id||!role.data)return reply({error:'Organizer required'},403);
 if(prior.data) {
  // JSONB comparison happens in the RPC; this also handles keys in a different order.
  const {data,error:retryError}=await admin.rpc('hub_engine_commit',{tid:p.tournament_id,actor:user.id,expected:p.revision,request_id:p.request_id,command:p.command,next_state:stored.data?.state});
  return retryError?reply({error:'Idempotency key reused'},409):reply(data);
 }
 if((stored.data?.revision??0)!==p.revision)return reply({error:'Revision conflict; reload tournament'},409);
 let next:State;
 try {
  if(p.command.type==='launch') {
   if(stored.data)return reply({error:'Tournament already launched'},409);
   if(!['dota2','cs2','fc'].includes(t.data!.game))return reply({error:'Invalid game'},400);
   let rules=p.command.config;
   if(t.data!.game==='fc'&&rules.groups.length){
    const {data:approved,error:entryError}=await client.from('hub_entries').select('id,skill_level').eq('tournament_id',p.tournament_id).eq('status','approved');
    if(entryError)return reply({error:'FC registration setup is not complete'},503);
    const ids=approved?.map(e=>e.id)||[];
    if(ids.length!==p.command.entries.length||new Set(p.command.entries).size!==ids.length||p.command.entries.some(id=>!ids.includes(id)))return reply({error:'Approved entries changed'},409);
    rules={...rules,groups:drawFcGroups((approved||[]).map(e=>({id:e.id,level:e.skill_level as FcLevel|null})),rules.groups.map(g=>g.id))};
   }
   next=createTournament(t.data!.game as State['game'],p.command.entries,rules);
  } else {
   if(!stored.data)return reply({error:'Launch tournament first'},400);
   next=transition(stored.data.state as State,p.command);
  }
 } catch(e) {return reply({error:e instanceof Error?e.message:'Invalid transition'},400);}
 const {data,error:saveError}=await admin.rpc('hub_engine_commit',{tid:p.tournament_id,actor:user.id,expected:p.revision,request_id:p.request_id,command:p.command,next_state:next});
 if(saveError) {
  const allowed=['Organizer required','Revision conflict','Idempotency key reused','Review entries and remove manual scheduling before launch','Approved entries changed','Tournament rules are locked','Publish participation and award rules before launch','Third-place rule does not match the format','Complete player confirmations and organizer review first','Revoke awards before correcting results','Complete personal check-in before launch','Both captains must confirm the current result or a referee must decide'];
  return reply({error:allowed.includes(saveError.message)?saveError.message:'Could not save tournament'},saveError.message==='Revision conflict'?409:400);
 }
 return reply(data);
}
