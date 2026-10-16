import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
const uuid=z.string().uuid();
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('set_policy'),tournament_id:uuid,body:z.string().trim().min(20).max(6000),require_acceptance:z.boolean(),bronze:z.enum(['none','shared_semifinal','lower_final'])}),
 z.object({action:z.literal('attest'),entry_id:uuid,policy_version:uuid,accepted:z.boolean()}),
 z.object({action:z.literal('review_eligibility'),entry_id:uuid,policy_version:uuid,approved:z.boolean(),reason:z.string().trim().min(3).max(500)}),
 z.object({action:z.literal('issue_awards'),tournament_id:uuid}),
 z.object({action:z.literal('revoke_awards'),tournament_id:uuid,reason:z.string().trim().min(3).max(500)}),
]);
const headers={'Cache-Control':'private, no-store'};
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers});
export async function GET(req:NextRequest){
 const client=await createClient();if(!client)return reply({error:'Unavailable'},503);
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 if(req.nextUrl.searchParams.get('profile')==='me'){
  const result=await client.from('hub_awards').select('*,hub_award_batches(status,revoked_at,revoke_reason)').eq('recipient_id',user.id).order('created_at',{ascending:false}).limit(100);
  return result.error?reply({error:'Awards unavailable'},503):reply({awards:result.data});
 }
 const tid=uuid.safeParse(req.nextUrl.searchParams.get('id'));if(!tid.success)return reply({error:'Invalid tournament'},400);
 const entries=await client.from('hub_entries').select('id').eq('tournament_id',tid.data);
 if(entries.error)return reply({error:'Tournament unavailable'},503);
 const ids=entries.data.map(e=>e.id);
 const results=await Promise.all([
  client.from('hub_participation_policies').select('*').eq('tournament_id',tid.data).maybeSingle(),
  client.from('hub_entry_players').select('*').in('entry_id',ids),
  client.from('hub_entry_attestations').select('*').in('entry_id',ids),
  client.from('hub_eligibility_reviews').select('*').in('entry_id',ids),
  client.from('hub_award_batches').select('*').eq('tournament_id',tid.data).order('created_at',{ascending:false}),
  client.from('hub_awards').select('*').in('entry_id',ids),
  client.from('hub_ops_audit').select('*').eq('tournament_id',tid.data).order('created_at',{ascending:false}).limit(100),
  client.from('hub_engine_audit').select('revision,command,actor_id,created_at').eq('tournament_id',tid.data).order('revision',{ascending:false}).limit(100),
 ]);
 if(results.some(r=>r.error))return reply({error:'Tournament operations unavailable'},503);
 const [policy,players,attestations,reviews,batches,awards,audit,engineAudit]=results;
 return reply({policy:policy.data,players:players.data,attestations:attestations.data,reviews:reviews.data,batches:batches.data,awards:awards.data,audit:audit.data,engineAudit:engineAudit.data,userId:user.id});
}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Forbidden'},403);
 const client=await createClient();if(!client)return reply({error:'Unavailable'},503);
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return reply({error:'Sign in required'},401);
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return reply({error:'Check all fields'},400);
 const {action,...p}=parsed.data;const result=await client.rpc('hub_ops_action',{action,p});
 if(result.error){
  const allowed=['Sign in required','Tournament not found','Organizer required','Participation rules are locked','Registered player required','Read the current participation rules','Finish the tournament first','Publish award rules before launch','Third-place rule does not match the format','Placements are incomplete','Invalid award entry','Registered roster is incomplete','Reason required'];
  return reply({error:allowed.includes(result.error.message)?result.error.message:'Could not save. Check rules and permissions.'},result.error.message==='Organizer required'?403:400);
 }
 return reply(result.data);
}
