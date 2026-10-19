'use client';
import {useState} from 'react';
import EmailConfirmationPending from '@/components/auth/EmailConfirmationPending';
import {useLanguageStore} from '@/store/useLanguageStore';
export default function Preview(){
 const ru=useLanguageStore(s=>s.language==='ru');const [domain,setDomain]=useState('gmail.com');
 return <section className="mx-auto my-16 w-full max-w-md px-4"><p className="mb-4 text-sm text-white/70">{ru?'ДЕМО: письма не отправляются, адреса вымышленные.':'DEMO: no emails are sent; addresses are fictional.'}</p><label className="mb-5 block text-white">{ru?'Почтовый сервис':'Email provider'}<select className="mt-2 block min-h-11 w-full rounded-xl border border-white/25 bg-[#07131C] p-3" value={domain} onChange={e=>setDomain(e.target.value)}>{['gmail.com','mail.ru','outlook.com','yandex.ru','example.com'].map(d=><option key={d}>{d}</option>)}</select></label><EmailConfirmationPending key={domain} email={'demo@'+domain} ru={ru} deadline={0} onBack={()=>{}} demo/></section>;
}
