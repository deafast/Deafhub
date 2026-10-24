'use client';
import {useState,type FormEvent} from 'react';
import type {Command,Match} from '@/lib/tournament/engine';
export default function MatchSchedule({match,owner,busy,ru,onSave}:{match:Match;owner:boolean;busy:boolean;ru:boolean;onSave:(command:Command)=>Promise<void>}){
 const text=(r:string,e:string)=>ru?r:e;
 const [invalidDate,setInvalidDate]=useState(false);
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=new FormData(event.currentTarget),value=String(form.get('scheduledAt')||'');
  let scheduledAt:string|null=null;
  if(value){
   const date=new Date(value+'Z');
   if(!Number.isFinite(date.getTime())||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value)||date.toISOString().slice(0,value.length)!==value){setInvalidDate(true);return;}
   scheduledAt=date.toISOString();
  }
  setInvalidDate(false);void onSave({type:'schedule',match:match.id,scheduledAt,reason:String(form.get('reason')||'')});
 }
 return <div className="mt-3 space-y-2 text-sm">
 {match.scheduledAt?<p className="text-white/70"><time dateTime={match.scheduledAt}>{new Intl.DateTimeFormat(ru?'ru-RU':'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(match.scheduledAt))} UTC</time></p>:null}
 {owner&&['waiting','ready'].includes(match.status)?<details><summary className="cursor-pointer text-[#22D3EE]">{text('Назначить / изменить время','Schedule / reschedule')}</summary><form className="mt-3 space-y-3" onSubmit={submit}>
 {invalidDate?<p role="alert" className="text-red-300">{text('Укажите корректное время UTC.','Use a valid UTC schedule.')}</p>:null}
 <label className="block">{text('Время UTC; пустое поле отменяет назначение','UTC time; leave empty to remove schedule')}<input key={match.scheduledAt||'unscheduled'} name="scheduledAt" type="datetime-local" defaultValue={match.scheduledAt?.slice(0,16)} className="mt-2 block min-h-11 w-full rounded-xl border border-white/15 bg-[#0A0F14] p-3 text-white"/></label>
 <label className="block">{text('Причина назначения / изменения','Reason for scheduling / change')}<input name="reason" required minLength={3} maxLength={500} className="mt-2 block min-h-11 w-full rounded-xl border border-white/15 bg-[#0A0F14] p-3 text-white"/></label>
 <button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-[#22D3EE] px-4 py-3 font-bold text-[#0A0F14] disabled:opacity-40">{text('Сохранить время','Save schedule')}</button>
 </form></details>:null}
 </div>;
}
