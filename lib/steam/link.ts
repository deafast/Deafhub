// Insert-only claim: a concurrent callback must never transfer an existing link.
export async function claimSteamAccount(steamId:string,userId:string,store:{
 insert:(steamId:string,userId:string)=>Promise<{error:{code?:string}|null}>;
 owner:(steamId:string)=>Promise<{userId:string|null;error:unknown}>;
}) {
 const result=await store.insert(steamId,userId);
 if(!result.error) return;
 if(result.error.code!=='23505') throw new Error('Steam link unavailable');
 const existing=await store.owner(steamId);
 if(existing.error||existing.userId!==userId) throw new Error('Steam account already linked');
}
