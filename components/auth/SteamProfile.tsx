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
 const label=t('Steam — привязан. Открыть профиль.','Steam — connected. Open profile.');
 return <div className="inline-flex">
 <a href={steamProfileUrl(steamId)} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] transition-colors hover:border-[#22D3EE]/60 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE]">
 <Image src="/auth/steam-mark.svg" width={34} height={34} alt="" />
 </a>
 {failed?<span role="status" className="sr-only">{t('Не удалось загрузить сведения Steam. Привязка сохранена.','Could not load Steam details. Your link is preserved.')}</span>:!data?<span role="status" className="sr-only">{t('Проверка привязки Steam…','Checking the Steam connection…')}</span>:null}
 </div>;
}
