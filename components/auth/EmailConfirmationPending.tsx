'use client';
import {useEffect,useRef,useState} from 'react';
import {MailCheck} from 'lucide-react';
import {createClient} from '@/lib/supabase/client';
import {CONFIRMATION_COOLDOWN_KEY,CONFIRMATION_COOLDOWN_MS,confirmationCallback,confirmationError,emailProvider,remainingConfirmationSeconds} from '@/lib/auth/email-confirmation';

export default function EmailConfirmationPending({email,ru,deadline,onBack,disabled=false,demo=false}:{email:string;ru:boolean;deadline:number;onBack:()=>void;disabled?:boolean;demo?:boolean}){
 const [until,setUntil]=useState(deadline),[seconds,setSeconds]=useState(60),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState(false);
 const inFlight=useRef(false);const provider=emailProvider(email),t=(r:string,e:string)=>ru?r:e;
 useEffect(()=>{const tick=()=>setSeconds(remainingConfirmationSeconds(until,Date.now()));const timer=setInterval(tick,1000);return()=>clearInterval(timer);},[until]);
 async function resend(){
  if(demo||disabled||inFlight.current)return;
  let stored=0;try{stored=Number(sessionStorage.getItem(CONFIRMATION_COOLDOWN_KEY))||0;}catch{}
  if(Math.max(until,stored)>Date.now())return;
  const client=createClient();if(!client){setError(t('Отправка временно недоступна.','Email delivery is temporarily unavailable.'));return;}
  inFlight.current=true;setBusy(true);setError('');setSent(false);
  const next=Date.now()+CONFIRMATION_COOLDOWN_MS;setUntil(next);setSeconds(60);try{sessionStorage.setItem(CONFIRMATION_COOLDOWN_KEY,String(next));}catch{}
  try{const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:confirmationCallback(window.location.origin)}});if(error)throw error;setSent(true);}
  catch(caught){const code=typeof caught==='object'&&caught!==null&&'code'in caught?String(caught.code):'';setError(confirmationError(code,ru));}
  finally{inFlight.current=false;setBusy(false);}
 }
 return <section aria-label={t('Подтверждение почты','Email confirmation')} className="grid min-w-0 gap-4 rounded-2xl border border-[#22D3EE]/25 bg-[#07131C] p-5">
 <MailCheck aria-hidden="true" className="size-9 text-[#22D3EE]"/>
 <h2 className="text-2xl font-bold text-white">{t('Проверьте вашу почту','Check your email')}</h2>
 <p className="break-all text-base font-semibold text-[#22D3EE]">{email}</p>
 <p className="text-sm leading-6 text-slate-200">{t('Откройте письмо DEAF|HUB и нажмите «Подтвердить почту». Проверьте также папки «Спам» и «Рассылки».','Open the DEAF|HUB email and select “Confirm email”. Please also check spam and promotions.')}</p>
 <p className="text-sm leading-6 text-slate-300">{t('Откройте ссылку в том же браузере, где зарегистрировались. Не пересылайте письмо другим людям.','Open the link in the same browser you used to sign up. Do not forward this email to anyone else.')}</p>
 {provider?<a href={provider.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22D3EE] px-4 py-3 text-center font-semibold text-[#07131C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{t('Открыть ','Open ')}{provider.name==='Яндекс Почта'?(ru?'Яндекс Почту':'Yandex Mail'):provider.name}</a>:<p className="text-sm text-slate-200">{t('Откройте приложение или сайт вашего почтового сервиса и найдите письмо DEAF|HUB.','Open your email app or provider website and look for the DEAF|HUB email.')}</p>}
 <button type="button" disabled={demo||disabled||busy||seconds>0} onClick={()=>void resend()} className="min-h-11 rounded-xl border border-white/25 px-4 py-3 text-sm text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#22D3EE]">{busy?t('Отправка…','Sending…'):seconds>0?t(`Отправить повторно через ${seconds} с`,`Resend in ${seconds}s`):t('Отправить подтверждение повторно','Resend confirmation')}</button>
 {sent?<p role="status" className="text-sm text-[#A5F3FC]">{t('Запрос принят. Если подтверждение доступно для этого адреса, письмо будет отправлено. Используйте самое новое письмо.','Request received. If confirmation is available for this address, an email will be sent. Use the latest email.')}</p>:null}
 {error?<p role="alert" className="text-sm text-red-300">{error}</p>:null}
 <p className="text-xs leading-5 text-slate-300">{t('Если аккаунт уже существует, войдите или восстановите пароль.','If you already have an account, sign in or reset your password.')}</p>
 <button type="button" disabled={busy||disabled} onClick={onBack} className="min-h-11 text-sm text-[#22D3EE] focus-visible:outline-2 focus-visible:outline-[#22D3EE]">{t('Вернуться ко входу','Back to sign in')}</button>
 </section>;
}
