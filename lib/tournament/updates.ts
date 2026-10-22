import type {SupabaseClient} from '@supabase/supabase-js';
export type UpdateStatus='connecting'|'live'|'fallback';
// Events are only invalidation signals: data is re-read through the authenticated API.
export function startTournamentUpdates(client:Pick<SupabaseClient,'channel'|'removeChannel'>,id:string,refresh:()=>Promise<void>,status:(value:UpdateStatus)=>void,visible:()=>boolean=()=>document.visibilityState==='visible'){
 let stopped=false,pending:ReturnType<typeof setTimeout>|undefined,poll:ReturnType<typeof setInterval>|undefined;
 const request=()=>{if(stopped||!visible()||pending)return;pending=setTimeout(()=>{pending=undefined;if(!stopped&&visible())void refresh().catch(()=>{});},200);};
 const channel=client.channel(`hub-engine-${id}-${crypto.randomUUID()}`)
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'hub_engines',filter:`tournament_id=eq.${id}`},request)
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'hub_engines',filter:`tournament_id=eq.${id}`},request)
  .subscribe(value=>{if(stopped)return;if(value==='SUBSCRIBED'){if(poll)clearInterval(poll);poll=undefined;status('live');request();}else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(value)){status('fallback');if(!poll)poll=setInterval(request,30000);}});
 return {refresh:request,stop(){stopped=true;if(pending)clearTimeout(pending);if(poll)clearInterval(poll);void client.removeChannel(channel).catch(()=>{});}};
}
