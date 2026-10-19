import Link from 'next/link';
import {redirect} from 'next/navigation';
import {MailCheck} from 'lucide-react';
import {createClient} from '@/lib/supabase/server';
import LocalizedText from '@/components/shared/LocalizedText';
export const dynamic='force-dynamic';
export default async function Page(){
 const client=await createClient();
 if(!client)redirect('/sign-in?error=callback');
 const {data,error}=await client.auth.getUser();
 if(error||!data.user?.email_confirmed_at)redirect('/sign-in?error=callback');
 return <section className="mx-auto my-16 max-w-lg rounded-3xl border border-[#22D3EE]/25 bg-[#07131C] p-8 text-center text-white">
 <MailCheck aria-hidden="true" className="mx-auto size-12 text-[#22D3EE]"/>
 <h1 className="mt-5 text-3xl font-bold"><LocalizedText ru="Почта подтверждена" en="Email confirmed"/></h1>
 <p className="mt-4 break-all text-[#22D3EE]">{data.user.email}</p>
 <p className="mt-4 leading-7 text-slate-200"><LocalizedText ru="Добро пожаловать в DEAF|HUB! Теперь вы можете заполнить профиль и присоединиться к сообществу." en="Welcome to DEAF|HUB! You can now complete your profile and join the community."/></p>
 <Link href="/profile" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#22D3EE] px-5 py-3 font-semibold text-[#07131C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><LocalizedText ru="Открыть личный кабинет" en="Open your account"/></Link>
 </section>;
}
