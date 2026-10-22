import 'server-only';
import {steamProfileUrl,type SteamProfileResult} from './profile';

export async function getSteamPublicProfile(id:string,key:string|undefined,send:typeof fetch=fetch):Promise<SteamProfileResult> {
 if(!/^7656119\d{10}$/.test(id)) return {status:'unavailable'};
 const apiKey=key?.trim();
 if(!apiKey) return {status:'unconfigured'};
 try {
  const url=new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
  url.searchParams.set('steamids',id);
  const response=await send(url,{headers:{'x-webapi-key':apiKey},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!response.ok) return {status:'unavailable'};
  const body=await response.json();
  const player=body?.response?.players?.find((p:{steamid?:unknown})=>p.steamid===id);
  if(!player) return {status:'unavailable'};
  if(player.communityvisibilitystate!==3) return {status:'private'};
  if(typeof player.personaname!=='string'||!player.personaname.trim()) return {status:'unavailable'};
  let avatar:string|null=null;
  if(typeof player.avatarfull==='string'){
   try {
    const u=new URL(player.avatarfull);
    if(u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['avatars.steamstatic.com','avatars.akamai.steamstatic.com','avatars.fastly.steamstatic.com','steamcdn-a.akamaihd.net'].includes(u.hostname)) avatar=u.href;
   } catch { /* Invalid optional avatar must not hide the public name. */ }
  }
  return {status:'available',profile:{steamId:id,name:player.personaname.trim().slice(0,128),avatar,url:steamProfileUrl(id)},checkedAt:new Date().toISOString()};
 }catch{return {status:'unavailable'};}
}
