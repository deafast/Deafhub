import { Sword, Swords, Shield, HandHelping } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RoleType = 'CARRY' | 'MID' | 'OFFLANE' | 'SUPPORT';

interface RoleBadgeProps {
    role: RoleType;
    className?: string;
}

const roleConfig = {
    CARRY: { icon: Sword, color: 'text-red-500', label: 'CARRY' },
    MID: { icon: Swords, color: 'text-amber-500', label: 'MID' },
    OFFLANE: { icon: Shield, color: 'text-orange-600', label: 'OFFLANE' },
    SUPPORT: { icon: HandHelping, color: 'text-emerald-500', label: 'SUPPORT' },
};

export default function RoleBadge({ role, className }: RoleBadgeProps) {
    const { icon: Icon, color, label } = roleConfig[role];

    return (
        <div className={cn('flex items-center gap-2 font-bold uppercase text-[10px] sm:text-xs tracking-wider', color, className)}>
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </div>
    );
}
