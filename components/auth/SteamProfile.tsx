'use client';
import {useEffect,useState} from 'react';
import Image from 'next/image';
import {steamProfileUrl,type SteamProfileResult} from '@/lib/steam/profile';
type Data=SteamProfileResult&{linked:boolean;steamId?:string;linkedAt?:string;url?:string};
export default function SteamProfile({steamId,ru}:{steamId:string;ru:boolean}){
 const [data,setData]=useState<Data|null>(null);const [failed,setFailed]=useState(false);const [signedOut,setSignedOut]=useState(false);
 useEffect(()=>{const controller=new AbortController();
  void fetch('/api/steam-profile',{cache:'no-store',signal:controller.signal}).then(async response=>{if(response.status===401){if(!controller.signal.aborted){setData(null);setSignedOut(true);}return;}if(!response.ok)throw Error('unavailable');const result:Data=await response.json();if(!controller.signal.aborted){setData(result);setFailed(false);setSignedOut(false);}}).catch(()=>{if(!controller.signal.aborted){setData(null);setFailed(true);}});
  return()=>controller.abort();
 },[steamId]);
 const t=(r:string,e:string)=>ru?r:e;
 const invalidLink=data&&(!data.linked||data.steamId!==steamId||(data.status==='available'&&data.profile?.steamId!==steamId));
 if(signedOut)return <p role="status" className="text-sm leading-6 text-slate-300">{t('Войдите снова, чтобы посмотреть подключённый Steam.','Sign in again to view your connected Steam account.')}</p>;
 if(invalidLink)return <p role="status" className="text-sm leading-6 text-slate-300">{t('Не удалось подтвердить текущую привязку Steam. Обновите страницу.','Could not verify the current Steam link. Reload the page.')}</p>;
 const profile=data?.linked&&data.status==='available'?data.profile:null;
 return <div className="space-y-3"><p>Steam · <a className="break-all text-[#22D3EE]" href={steamProfileUrl(steamId)} target="_blank" rel="noopener noreferrer">{steamId}</a></p><p className="text-sm text-slate-300">{t('SteamID подтверждён при привязке через Steam.','SteamID verified when linked through Steam.')}</p>
 {profile?<div className="flex min-w-0 items-center gap-3">{profile.avatar?<Image unoptimized src={profile.avatar} alt="" width={48} height={48} referrerPolicy="no-referrer" className="h-12 w-12 shrink-0 rounded-xl"/>:null}<p className="min-w-0 break-words font-semibold" translate="no">{profile.name}</p></div>:null}
 <p role="status" className="text-sm leading-6 text-slate-300">{failed?t('Не удалось загрузить сведения Steam. Привязка сохранена.','Could not load Steam details. Your link is preserved.'):!data?t('Загрузка публичного профиля Steam…','Loading public Steam profile…'):data.status==='private'?t('Профиль Steam закрыт. Закрытые сведения не отображаются.','Steam profile is private. Private details are not displayed.'):data.status==='unconfigured'?t('Публичные сведения Steam пока не подключены. SteamID сохранён.','Public Steam details are not connected yet. SteamID is saved.'):data.status==='unavailable'||!data.linked?t('Публичные сведения Steam сейчас недоступны.','Public Steam details are currently unavailable.'):t('Источник: Steam.','Source: Steam.')}</p>
 {data?.status==='available'&&Number.isFinite(Date.parse(data.checkedAt))?<p className="text-sm text-slate-400">{t('Проверено: ','Checked: ')}<time dateTime={data.checkedAt}>{new Date(data.checkedAt).toLocaleString(ru?'ru-RU':'en-GB')}</time></p>:null}
 </div>;
}
