export type SteamPublicProfile = {steamId:string;name:string;avatar:string|null;url:string};
export type SteamProfileResult = {status:'available';profile:SteamPublicProfile;checkedAt:string}|{status:'private'|'unavailable'|'unconfigured'};
export function steamProfileUrl(id:string) { return `https://steamcommunity.com/profiles/${id}`; }
