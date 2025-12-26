'use client';

import React from 'react';
import MVPFlipCard from './MVPFlipCard';

export default function DotaMVPShowcase() {
    const players = [
        {
            id: 'DOTA-001',
            game: 'dota' as const,
            front: {
                name: 'VALENTIN',
                team: 'TEAM SPIRIT',
                image: '', // Placeholder
                rating: '9.8',
                stats: [
                    { label: 'GPM', value: '850' },
                    { label: 'KDA', value: '12.4' },
                    { label: 'KP%', value: '78%' },
                    { label: 'DMG', value: 'TOP' }
                ]
            },
            back: {
                achievements: [
                    '10-0 group stage run',
                    'Key 1v3 clutch (semifinals)',
                    'Top damage in grand final'
                ],
                bio: 'Dominated the tournament as a core playmaker, delivering clutch moments and top damage output in the finals.'
            }
        },
        {
            id: 'DOTA-002',
            game: 'dota' as const,
            front: {
                name: 'SANYA',
                team: 'LGD GAMING',
                image: '', // Placeholder
                rating: '9.7',
                stats: [
                    { label: 'XPM', value: '920' },
                    { label: 'AST', value: '22.5' },
                    { label: 'WARDS', value: '34' },
                    { label: 'SAVES', value: '15' }
                ]
            },
            back: {
                achievements: [
                    'Elite vision control',
                    'Perfect defensive rotations',
                    'Consistent saves under pressure'
                ],
                bio: 'Controlled the map with relentless vision and rotations, repeatedly saving core players in high-pressure fights.'
            }
        }
    ];

    return (
        <div className="flex flex-row items-center justify-center gap-2 xs:gap-4 sm:gap-6 md:gap-12 py-6 md:py-10 perspective-1000 w-full overflow-hidden">
            <div className="flex-1 min-w-0 flex justify-center">
                <MVPFlipCard data={players[0]} />
            </div>

            <div className="hidden xs:flex flex-col items-center gap-2 md:gap-4 opacity-30 flex-shrink-0">
                <div className="h-10 md:h-20 w-[1px] bg-gradient-to-t from-transparent via-white to-transparent" />
                <span className="text-[8px] md:text-xs font-black italic text-amber-500 rotate-90 my-2 md:my-4">VS</span>
                <div className="h-10 md:h-20 w-[1px] bg-gradient-to-b from-transparent via-white to-transparent" />
            </div>

            <div className="flex-1 min-w-0 flex justify-center">
                <MVPFlipCard data={players[1]} />
            </div>
        </div>
    );
}
