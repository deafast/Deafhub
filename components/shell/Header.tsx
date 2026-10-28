'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import AccountButton from '@/components/auth/AccountButton';


const GB_FLAG = (
    <svg viewBox="0 0 640 480" className="w-4 h-3" aria-hidden="true">
        <path fill="#012169" d="M0 0h640v480H0z" />
        <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 240l240 178v62h-78L320 300 78 480H0v-62l240-178L0 62V0h75z" />
        <path fill="#C8102E" d="m424 281 216 159v40L369 306l55-25zM640 0v3L445 149l56-25L640 0zM0 440l214-159-55 25L0 480v-40zM0 0v4l195 145-56 25L0 0z" />
        <path fill="#FFF" d="M240 0v480h160V0H240zM0 160v160h640V160H0z" />
        <path fill="#C8102E" d="M272 0v480h96V0h-96zM0 192v96h640v-96H0z" />
    </svg>
);

const RU_FLAG = (
    <svg viewBox="0 0 640 480" className="w-4 h-3" aria-hidden="true">
        <path fill="#fff" d="M0 0h640v160H0z" />
        <path fill="#0039a6" d="M0 160h640v160H0z" />
        <path fill="#d52b1e" d="M0 320h640v160H0z" />
    </svg>
);

export default function Header() {
    const { t, language, setLanguage } = useLanguageStore();
    const pathname = usePathname();

    const navItems = [
        { label: t.nav.home, href: '/' },
        { label: t.nav.live, href: '/live' },
        { label: t.nav.tournaments, href: '/tournaments' },
        { label: t.nav.team, href: '/team' },
        { label: t.nav.profile, href: '/profile' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-none transition-all duration-300">
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
                            aria-current={pathname === item.href ? 'page' : item.href !== '/' && pathname?.startsWith(item.href + '/') ? 'location' : undefined}
                            className="text-sm font-medium text-foreground/70 transition-colors hover:text-[#22D3EE]"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div role="group" aria-label="Language / Язык" className="relative grid grid-cols-2 rounded-full border border-white/10 bg-white/5 p-1 scale-90 sm:scale-100">
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute bottom-1 left-1 top-1 rounded-full border border-[#22D3EE]/30 bg-white/5 shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                            style={{ width: 'calc((100% - 8px) / 2)', transform: language === 'ru' ? 'translateX(0)' : 'translateX(100%)' }}
                        />
                        <button
                            type="button"
                            aria-label="Русский"
                            aria-pressed={language === 'ru'}
                            lang="ru"
                            onClick={() => setLanguage('ru')}
                            className="relative z-10 flex items-center justify-center rounded-full px-4 py-1.5 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#22D3EE]"
                        >
                            <span className={`transition-opacity duration-300 ${language === 'ru' ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}>
                                {RU_FLAG}
                            </span>
                        </button>
                        <button
                            type="button"
                            aria-label="English"
                            aria-pressed={language === 'en'}
                            lang="en"
                            onClick={() => setLanguage('en')}
                            className="relative z-10 flex items-center justify-center rounded-full px-4 py-1.5 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#22D3EE]"
                        >
                            <span className={`transition-opacity duration-300 ${language === 'en' ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}>
                                {GB_FLAG}
                            </span>
                        </button>
                    </div>

                    <AccountButton />
                </div>
            </div>
        </header>
    );
}
