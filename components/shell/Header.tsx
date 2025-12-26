'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

const GB_FLAG = (
    <svg viewBox="0 0 640 480" className="w-4 h-3">
        <path fill="#012169" d="M0 0h640v480H0z" />
        <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 240l240 178v62h-78L320 300 78 480H0v-62l240-178L0 62V0h75z" />
        <path fill="#C8102E" d="m424 281 216 159v40L369 306l55-25zM640 0v3L445 149l56-25L640 0zM0 440l214-159-55 25L0 480v-40zM0 0v4l195 145-56 25L0 0z" />
        <path fill="#FFF" d="M240 0v480h160V0H240zM0 160v160h640V160H0z" />
        <path fill="#C8102E" d="M272 0v480h96V0h-96zM0 192v96h640v-96H0z" />
    </svg>
);

const RU_FLAG = (
    <svg viewBox="0 0 640 480" className="w-4 h-3">
        <path fill="#fff" d="M0 0h640v160H0z" />
        <path fill="#0039a6" d="M0 160h640v160H0z" />
        <path fill="#d52b1e" d="M0 320h640v160H0z" />
    </svg>
);

export default function Header() {
    const { t, language, setLanguage } = useLanguageStore();

    const navItems = [
        { label: t.nav.home, href: '/' },
        { label: t.nav.live, href: '/live' },
        { label: t.nav.tournaments, href: '/tournaments' },
        { label: t.nav.team, href: '/team' },
        { label: t.nav.profile, href: '/profile' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-none transition-all duration-300">
            <div className="container mx-auto flex h-16 sm:h-20 items-center justify-between px-3 sm:px-4">
                {/* Left: Logo */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 sm:gap-4 group">
                        <div className="relative h-10 w-10 sm:h-14 sm:w-14 translate-x-1 sm:translate-x-3 transition-all duration-500 group-hover:scale-110">
                            {/* Header Logo - Transparent Shield */}
                            <Image
                                src="/brand/header_logo.png"
                                alt="DEAF HUB"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base sm:text-xl font-bold tracking-tighter text-[#EAFBFF]">
                                DEAF <span className="text-[#22D3EE]">|</span> <span className="text-[#22D3EE]">HUB</span>
                            </span>
                            <span className="text-[8px] sm:text-[10px] font-medium tracking-[0.2em] text-[#22D3EE]/80 uppercase">
                                {t.nav.espPlatform}
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Center: Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-foreground/70 transition-colors hover:text-[#22D3EE]"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="relative flex items-center gap-0.5 sm:gap-1 rounded-full border border-white/10 bg-white/5 p-0.5 sm:p-1 backdrop-blur-sm overflow-hidden scale-90 sm:scale-100">
                        {/* Smooth sliding background highlight */}
                        <div className="absolute inset-0 flex p-1">
                            <motion.div
                                layoutId="lang-bg-stable"
                                className="w-1/2 h-full bg-white/5 border border-[#22D3EE]/30 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-md"
                                animate={{ x: language === 'ru' ? 0 : '100%' }}
                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                        </div>

                        <button
                            onClick={() => setLanguage('ru')}
                            className="relative z-10 flex items-center justify-center rounded-full px-4 py-1.5 transition-colors group"
                        >
                            <span className={`transition-opacity duration-300 ${language === 'ru' ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}>
                                {RU_FLAG}
                            </span>
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className="relative z-10 flex items-center justify-center rounded-full px-4 py-1.5 transition-colors group"
                        >
                            <span className={`transition-opacity duration-300 ${language === 'en' ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}>
                                {GB_FLAG}
                            </span>
                        </button>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border-[#22D3EE]/30 bg-[#22D3EE]/5 text-[#22D3EE] hover:bg-[#22D3EE] hover:text-[#0A0F14] text-xs sm:text-sm">
                                {t.nav.signin}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-3xl border-white/10 bg-[#0D131A] p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-center mb-6">{t.nav.signin}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4">
                                <Button className="h-12 w-full rounded-2xl bg-white text-black hover:bg-white/90">
                                    Continue with Google
                                </Button>
                                <Button className="h-12 w-full rounded-2xl bg-[#4C75A3] text-white hover:bg-[#4C75A3]/90">
                                    Continue with VK
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </header>
    );
}
