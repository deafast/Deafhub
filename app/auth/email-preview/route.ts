import {readFile} from 'node:fs/promises';
import path from 'node:path';
import type {NextRequest} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 if(process.env.VERCEL_ENV!=='preview'&&process.env.NODE_ENV!=='development')return new Response('Not found',{status:404});
 const template=await readFile(path.join(process.cwd(),'supabase/templates/confirm-signup.html'),'utf8');
 const ru=request.nextUrl.searchParams.get('lang')!=='en';
 const mobile=request.nextUrl.searchParams.get('width')==='360';
 const parts=template.split(/\{\{ (?:if eq \.Data.locale "ru"|else|end) \}\}/);
 let html=(ru?parts[1]:parts[2]).replaceAll('{{ .ConfirmationURL }}','#demo-confirmation');
 if(mobile)html=html.replaceAll('max-width:600px','max-width:328px');
 html=html.replace(/(<body[^>]*>)/,'$1<div style="padding:16px;color:white;text-align:center;font:14px Arial;">'+(ru?'ДЕМО ПИСЬМА — ссылка не подтверждает адрес.':'EMAIL PREVIEW — this link does not verify an address.')+' <a style="color:#22D3EE" href="?lang=ru">RU</a> · <a style="color:#22D3EE" href="?lang=en">EN</a> · <a style="color:#22D3EE" href="?lang='+(ru?'ru':'en')+'&amp;width=360">360 px</a></div>');
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; img-src https://raw.githubusercontent.com; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'"}});
}
