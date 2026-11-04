'use client';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import styles from './Header.module.css';

function Flag({locale}:{locale:'ru'|'en'}) {
 return locale==='ru'?<svg viewBox="0 0 36 24" className={styles.flag} aria-hidden="true">
  <path fill="#fff" d="M0 0h36v8H0z"/><path fill="#0039a6" d="M0 8h36v8H0z"/><path fill="#d52b1e" d="M0 16h36v8H0z"/>
 </svg>:<svg viewBox="0 0 36 24" className={styles.flag} aria-hidden="true">
  <path fill="#012169" d="M0 0h36v24H0z"/><path stroke="#fff" strokeWidth="5" d="m0 0 36 24M36 0 0 24"/>
  <path stroke="#c8102e" strokeWidth="2" d="m0 0 36 24M36 0 0 24"/><path fill="#fff" d="M14 0h8v24h-8zM0 8h36v8H0z"/>
  <path fill="#c8102e" d="M16 0h4v24h-4zM0 10h36v4H0z"/>
 </svg>;
}
export default function LanguageMenu() {
 const {language,setLanguage}=useLanguageStore();
 return <DropdownMenu.Root modal={false}>
  <DropdownMenu.Trigger className={styles.language} aria-label={language==='ru'?'Язык: Русский':'Language: English'}>
   <Flag locale={language}/><ChevronDown size={13} aria-hidden="true"/>
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
   <DropdownMenu.Content className={styles.languageList} align="end" sideOffset={8} collisionPadding={12} aria-label={language==='ru'?'Выбор языка':'Choose language'}>
    <DropdownMenu.RadioGroup value={language} onValueChange={value=>{if(value==='ru'||value==='en')setLanguage(value);}}>
     {(['ru','en'] as const).map(locale=><DropdownMenu.RadioItem key={locale} value={locale} className={styles.languageOption} aria-label={locale==='ru'?'Русский':'English'} lang={locale}><Flag locale={locale}/></DropdownMenu.RadioItem>)}
    </DropdownMenu.RadioGroup>
   </DropdownMenu.Content>
  </DropdownMenu.Portal>
 </DropdownMenu.Root>;
}
