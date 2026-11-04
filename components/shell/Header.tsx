'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import AccountButton from '@/components/auth/AccountButton';
import LanguageMenu from './LanguageMenu';
import styles from './Header.module.css';

export default function Header() {
 const {t,language}=useLanguageStore();
 const pathname=usePathname();
 const navItems=[{label:t.nav.home,href:'/'},{label:t.nav.live,href:'/live'},{label:t.nav.tournaments,href:'/tournaments'},{label:t.nav.team,href:'/team'}];
 return <header data-site-shell="" className={styles.header}><div className={styles.inner}>
  <Link href="/" className={styles.brand} aria-label={language==='ru'?'DeafHub — главная':'DeafHub — home'}><Image src="/branding/approved-2026-10-28/dh.png" alt="DH" width={62} height={33} sizes="62px" preload/></Link>
  <nav className={styles.nav} aria-label={language==='ru'?'Основная навигация':'Main navigation'}>
   {navItems.map(item=><Link key={item.href} href={item.href} aria-current={pathname===item.href?'page':item.href!=='/'&&pathname?.startsWith(item.href+'/')?'location':undefined}>{item.label}</Link>)}
  </nav>
  <div className={styles.actions}><LanguageMenu/><AccountButton compact/></div>
 </div></header>;
}
