import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {readHistoryCursor,writeHistoryCursor} from '@/lib/match-history-cursor';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
const pageSize=20;
export async function GET(request:NextRequest){
 const client=await createClient();if(!client)return NextResponse.json({error:'Unavailable'},{status:503,headers});
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return NextResponse.json({error:'Sign in required'},{status:401,headers});
 let cursor;try{cursor=readHistoryCursor(request.nextUrl.searchParams.get('cursor'));}catch{return NextResponse.json({error:'Invalid cursor'},{status:400,headers});}
 const {data,error:dbError}=await client.rpc('hub_player_match_history',{before_at:cursor?.at??null,before_key:cursor?.key??null,page_size:pageSize});
 if(dbError)return NextResponse.json({error:'Match history unavailable'},{status:503,headers});
 const rows=data||[],page=rows.slice(0,pageSize),last=page.at(-1);
 // Cursor changes position only; the RPC always determines the caller from auth.uid().
 const nextCursor=rows.length>pageSize&&last?writeHistoryCursor({at:last.sort_at,key:last.sort_key}):null;
 const items=page.map(({sort_at:_,sort_key:__,...item}:{sort_at:string;sort_key:string;[key:string]:unknown})=>{void _;void __;return item;});
 return NextResponse.json({items,nextCursor},{headers});
}
