'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import AccountButton from '@/components/auth/AccountButton';
import { Home, Play, Trophy, Users, UserRound } from 'lucide-react';


export default function Header() {
    const { t, language, setLanguage } = useLanguageStore();
    const pathname = usePathname();

    const navItems = [
        { label: t.nav.home, href: '/', icon: Home },
        { label: t.nav.live, href: '/live', icon: Play },
        { label: t.nav.tournaments, href: '/tournaments', icon: Trophy },
        { label: t.nav.team, href: '/team', icon: Users },
        { label: t.nav.profile, href: '/profile', icon: UserRound },
    ];

    return (
        <header data-site-shell="" className="sticky top-0 z-50 w-full border-b border-border bg-background">
            <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4">
                {/* Left: Logo */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 sm:gap-4 group">
                        <Image
                            src="/branding/approved-2026-10-28/wordmark-tagline.png"
                            alt="DeafHub Esports"
                            width={610}
                            height={115}
                            priority
                            className="h-auto w-[120px] sm:w-[180px]"
                        />
                    </Link>
                </div>

                {/* Center: Nav */}
                <nav aria-label={language === 'ru' ? 'Основная навигация' : 'Main navigation'} className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            aria-current={pathname === item.href ? 'page' : item.href !== '/' && pathname?.startsWith(item.href + '/') ? 'location' : undefined}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary motion-reduce:transition-none"
                        >
                            <item.icon size={20} aria-hidden="true" />
                            <span data-nav-label="">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div role="group" aria-label="Language / Язык" className="site-language">
                        {(['ru', 'en'] as const).map((locale) => (
                            <button
                                key={locale}
                                type="button"
                                aria-label={locale === 'ru' ? 'Русский' : 'English'}
                                aria-pressed={language === locale}
                                lang={locale}
                                onClick={() => setLanguage(locale)}
                            >
                                <span>{locale === 'ru' ? 'РУ' : 'EN'}</span>
                            </button>
                        ))}
                    </div>

                    <AccountButton />
                </div>
            </div>
        </header>
    );
}
