'use client';
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
type Window={version:string;enabled:boolean;opens_at:string|null;closes_at:string|null};
type Checkin={entry_id:string;user_id:string;ready:boolean;window_version:string;rules_version:string;policy_version:string|null};
type Props={id:string;owner:boolean;ru:boolean;locked:boolean;userId:string;players:{entry_id:string;user_id:string;nickname:string}[];entries:{id:string;status:string}[];policyVersion:string|null;name:(id:string)=>string};
const field='mt-2 block w-full rounded-xl border border-white/15 bg-[#0A0F14] p-3 text-white';
const button='rounded-xl bg-[#22D3EE] px-4 py-3 font-bold text-[#0A0F14] disabled:opacity-40';
const errors:Record<string,[string,string]>={
 'Organizer required':['Действие доступно организатору.','Organizer access required.'],
 'Check-in is locked after launch':['После запуска готовность зафиксирована.','Check-in is locked after launch.'],
 'Invalid check-in window':['Укажите время начала и окончания. Окончание должно быть в будущем.','Enter a valid opening and future closing time.'],
 'Approved registered player required':['Подтверждать готовность могут только допущенные участники.','Only approved registered players can check in.'],
 'Refresh the check-in window':['Окно check-in изменилось. Обновите данные.','The check-in window changed. Refresh the data.'],
 'Check-in window is closed':['Сейчас подтверждение готовности закрыто.','Check-in is currently closed.'],
 'Registered roster is incomplete':['Состав заявки неполный. Обратитесь к организатору.','The registered roster is incomplete. Contact the organizer.'],
 'Confirm current participation rules first':['Сначала подтвердите актуальные условия участия.','Confirm the current participation rules first.'],
 'Sign in required':['Войдите в аккаунт.','Sign in to continue.'],
};
export default function TournamentCheckin({id,owner,ru,locked,userId,players,entries,policyVersion,name}:Props){
 const [data,setData]=useState<{window:Window|null;checkins:Checkin[];rulesVersion:string}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const request=useRef<AbortController|null>(null);
 const lifecycle=useRef(0),saving=useRef(false);
 const fail=useCallback((e:unknown)=>{const message=e instanceof Error?e.message:'Unavailable';setError(message);if(message==='Sign in required'){request.current?.abort();setData(null);setNotice('');}},[]);
 const text=(r:string,e:string)=>ru?r:e;
 const readable=(message:string)=>errors[message]?.[ru?0:1]||text('Не удалось выполнить действие. Обновите данные и повторите попытку.','Could not complete the action. Refresh and try again.');
 const load=useCallback(async()=>{request.current?.abort();const abort=new AbortController();request.current=abort;
  try{const r=await fetch(`/api/tournament-checkin?id=${id}`,{cache:'no-store',signal:abort.signal});if(abort.signal.aborted)return false;if(r.status===401)throw new Error('Sign in required');const d=await r.json();if(abort.signal.aborted)return false;if(!r.ok)throw new Error(d.error);setData(d);setError('');return true;}catch(e){if(abort.signal.aborted)return false;throw e;}
 },[id]);
 useEffect(()=>{let active=true;const generation=++lifecycle.current;void Promise.resolve().then(()=>active?load():false).catch(e=>{if(active)fail(e);}).finally(()=>{if(active&&!saving.current)setBusy(false);});return()=>{active=false;lifecycle.current=generation+1;saving.current=false;request.current?.abort();};},[load,fail]);
 async function save(payload:Record<string,unknown>){if(saving.current)return;saving.current=true;const generation=lifecycle.current,current=()=>generation===lifecycle.current;setBusy(true);setError('');setNotice('');try{const r=await fetch('/api/tournament-checkin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!current())return;if(r.status===401)throw new Error('Sign in required');const d=await r.json();if(!current())return;if(!r.ok)throw new Error(d.error);if(await load()&&current())setNotice(text('Готовность обновлена.','Check-in updated.'));}catch(e){if(current())fail(e);}finally{if(current()){saving.current=false;setBusy(false);}}}
 function configure(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const enabled=f.get('enabled')==='on';try{void save({action:'configure',tournament_id:id,enabled,opens_at:enabled?new Date(String(f.get('opens_at'))+'Z').toISOString():null,closes_at:enabled?new Date(String(f.get('closes_at'))+'Z').toISOString():null,reason:f.get('reason')});}catch{setError('Invalid check-in window');}}
 const w=data?.window;
 const current=(c:Checkin)=>c.ready&&c.window_version===w?.version&&c.policy_version===policyVersion&&c.rules_version===data?.rulesVersion;
 const dates=(v:string|null)=>v?new Intl.DateTimeFormat(ru?'ru-RU':'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(v))+' UTC':'—';
 return <section className="space-y-4 rounded-2xl border border-white/10 p-4"><h4 className="font-bold">{text('Готовность к турниру · Check-in','Tournament check-in')}</h4>
 <p className="text-sm text-white/70">{text('Каждый допущенный игрок подтверждает готовность лично. Это отдельное действие после принятия правил.','Every approved player checks in personally, separately from accepting the rules.')}</p>
 {error?<p role="alert" className="text-red-300">{readable(error)}</p>:null}{notice?<p role="status">{notice}</p>:null}
 {!data&&!error?<p role="status">{text('Загрузка…','Loading…')}</p>:null}
 {data?<p>{w?.enabled?`${dates(w.opens_at)} — ${dates(w.closes_at)}`:text('Обязательный check-in не включён.','Required check-in is not enabled.')}</p>:null}
 <button type="button" disabled={busy} className="min-h-11 text-[#22D3EE]" onClick={()=>{setError('');setNotice('');void load().catch(fail);}}>{text('Обновить готовность','Refresh check-in')}</button>
 {owner&&!locked&&data?<form key={w?.version||'new'} className="space-y-3" onSubmit={configure}>
 <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="enabled" defaultChecked={w?.enabled??false}/>{text('Требовать check-in перед запуском','Require check-in before launch')}</label>
 <div className="grid gap-3 sm:grid-cols-2"><label>{text('Начало · UTC','Opens · UTC')}<input type="datetime-local" name="opens_at" className={field} defaultValue={w?.opens_at?.slice(0,16)||''}/></label><label>{text('Окончание · UTC','Closes · UTC')}<input type="datetime-local" name="closes_at" className={field} defaultValue={w?.closes_at?.slice(0,16)||''}/></label></div>
 <label className="block">{text('Причина изменения','Reason for change')}<input name="reason" className={field} required minLength={3} maxLength={500}/></label>
 <p className="text-sm text-white/70">{text('Изменение окна сбрасывает актуальность прежнего check-in. Отсутствие готовности блокирует запуск, но не создаёт автоматических поражений.','Changing the window invalidates earlier check-ins. Missing check-in blocks launch; it never creates automatic forfeits.')}</p>
 <button disabled={busy} className={button}>{text('Сохранить окно check-in','Save check-in window')}</button></form>:null}
 {w?.enabled?entries.filter(e=>e.status==='approved').map(e=>{const roster=players.filter(p=>p.entry_id===e.id),mine=roster.find(p=>p.user_id===userId),ready=data!.checkins.filter(c=>c.entry_id===e.id&&current(c));return owner||mine?<div key={e.id} className="space-y-3 border-t border-white/10 pt-3"><p className="font-bold">{name(e.id)}</p>{owner?<p>{text('Готовы','Checked in')}: {ready.length}/{roster.length}</p>:null}{mine?<><p>{ready.some(c=>c.user_id===userId)?text('Вы подтвердили готовность.','You are checked in.'):text('Ваша готовность не подтверждена.','You have not checked in.')}</p>{!locked?<div className="flex flex-wrap gap-3"><button disabled={busy} className={button} onClick={()=>void save({action:'check_in',entry_id:e.id,window_version:w.version,ready:true})}>{text('Я готов к турниру','Check in')}</button><button disabled={busy} className="min-h-11 rounded-xl border border-white/15 px-4 py-3 disabled:opacity-40" onClick={()=>void save({action:'check_in',entry_id:e.id,window_version:w.version,ready:false})}>{text('Отменить готовность','Withdraw check-in')}</button></div>:null}</>:null}</div>:null;}):null}
 </section>;
}
