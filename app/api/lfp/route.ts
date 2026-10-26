import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { declaredBodyTooLarge, readBoundedJson } from '@/lib/request-body';

const uuid=z.string().uuid();
const game=z.enum(['dota2','cs2']);
const cursorSchema=z.object({updatedAt:z.string().datetime({offset:true}),id:uuid}).strict();
const actionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('publish'),game,position:z.string().trim().min(1).max(40),note:z.string().trim().max(180)}).strict(),
 z.object({action:z.literal('withdraw'),listing_id:uuid}).strict(),
 z.object({action:z.literal('invite'),listing_id:uuid,team_id:uuid}).strict(),
 z.object({action:z.literal('accept'),invitation_id:uuid}).strict(),
 z.object({action:z.literal('decline'),invitation_id:uuid}).strict(),
]);
const listingSchema=z.object({id:uuid,game,nickname:z.string(),position:z.string(),note:z.string(),updatedAt:z.string(),mine:z.boolean()});
const boardSchema=z.object({
 listings:z.array(listingSchema).max(21),
 mine:z.array(z.object({id:uuid,game,position:z.string(),note:z.string()})).max(2),
 incoming:z.array(z.object({id:uuid,teamId:uuid,teamName:z.string(),game,createdAt:z.string()})).max(30),
 outgoing:z.array(z.object({id:uuid,listingId:uuid,teamId:uuid,game})).max(50),
 teams:z.array(z.object({id:uuid,game,name:z.string(),canInvite:z.boolean()})).max(50),
});
const headers={'Cache-Control':'private, no-store'};
const allowed=['Sign in required','Check all fields','Save your player nickname first','Already on a team','Listing unavailable','Captain and matching game required','Roster locked during tournament participation','Roster full','Invitation already pending','Invitation limit reached','Invitation unavailable'];

export async function GET(request:NextRequest){
 const selected=request.nextUrl.searchParams.get('game');
 if(selected&&!game.safeParse(selected).success)return NextResponse.json({error:'Check all fields'},{status:400,headers});
 const rawCursor=request.nextUrl.searchParams.get('cursor');
 let cursor:z.infer<typeof cursorSchema>|null=null;
 if(rawCursor){
  if(rawCursor.length>256)return NextResponse.json({error:'Check all fields'},{status:400,headers});
  try{const parsed=cursorSchema.safeParse(JSON.parse(Buffer.from(rawCursor,'base64url').toString('utf8')));if(!parsed.success)throw Error('cursor');cursor=parsed.data;}
  catch{return NextResponse.json({error:'Check all fields'},{status:400,headers});}
 }
 const client=await createClient();if(!client)return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return NextResponse.json({error:'Sign in required'},{status:401,headers});
 const result=await client.rpc('hub_lfp_board',{p_game:selected||null,p_before:cursor?.updatedAt||null,p_before_id:cursor?.id||null});
 if(result.error)return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const parsed=boardSchema.safeParse(result.data);if(!parsed.success)return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const items=parsed.data.listings.slice(0,20),last=items.at(-1);
 const nextCursor=parsed.data.listings.length>20&&last?Buffer.from(JSON.stringify({updatedAt:last.updatedAt,id:last.id})).toString('base64url'):null;
 return NextResponse.json({...parsed.data,listings:items,nextCursor},{headers});
}

export async function POST(request:NextRequest){
 if(request.headers.get('origin')!==request.nextUrl.origin)return NextResponse.json({error:'Forbidden'},{status:403,headers});
 if(declaredBodyTooLarge(request,2048))return NextResponse.json({error:'Request too large'},{status:413,headers});
 const client=await createClient();if(!client)return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return NextResponse.json({error:'Sign in required'},{status:401,headers});
 const body=await readBoundedJson(request,2048);if(body.tooLarge)return NextResponse.json({error:'Request too large'},{status:413,headers});
 const parsed=actionSchema.safeParse(body.value);if(!parsed.success)return NextResponse.json({error:'Check all fields'},{status:400,headers});
 const {action,...p}=parsed.data;const result=await client.rpc('hub_lfp_action',{action,p});
 if(result.error){const message=allowed.find(value=>result.error?.message===value);return NextResponse.json({error:message||'Could not save'}, {status:message?400:503,headers});}
 return NextResponse.json({saved:true},{headers});
}
