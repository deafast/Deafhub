'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Home, Play, Trophy, Users, User } from 'lucide-react';

export default function BottomNav() {
    const { t } = useLanguageStore();
    const pathname = usePathname();

    const navItems = [
        { label: t.nav.home, href: '/', icon: Home },
        { label: t.nav.live, href: '/live', icon: Play },
        { label: t.nav.tournaments, href: '/tournaments', icon: Trophy },
        { label: t.nav.team, href: '/team', icon: Users },
        { label: t.nav.profile, href: '/profile', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-white/10 bg-background/95 px-4 backdrop-blur-md md:hidden">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#22D3EE]' : 'text-foreground/50 hover:text-[#22D3EE]/80'
                            }`}
                    >
                        <Icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : ''}`} />
                        <span className="text-[10px] font-medium uppercase tracking-tight">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
