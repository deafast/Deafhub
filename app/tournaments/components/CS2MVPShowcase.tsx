'use client';

import React from 'react';
import MVPFlipCard from './MVPFlipCard';

export default function CS2MVPShowcase() {
    const players = [
        {
            id: 'CS2-001',
            game: 'cs2' as const,
            front: {
                name: 'ZYWOO',
                team: 'VITALITY',
                image: '', // Placeholder
                rating: '1.52',
                stats: [
                    { label: 'ADR', value: '102.5' },
                    { label: 'KAST', value: '76%' },
                    { label: 'HS%', value: '55%' },
                    { label: 'CLUTCH', value: '4x 1v2' }
                ]
            },
            back: {
                achievements: [
                    'Playoff MVP rating leader',
                    '4 clutch 1v2 situations (final)',
                    'Consistent impact vs top teams'
                ],
                bio: 'Highest rated player in playoff stage. Secured multiple clutch rounds in the final match vs NAVI.'
            }
        },
        {
            id: 'CS2-002',
            game: 'cs2' as const,
            front: {
                name: 'ELIGE',
                team: 'COMPLEXITY',
                image: '', // Placeholder
                rating: '1.48',
                stats: [
                    { label: 'IMPACT', value: '1.65' },
                    { label: 'OPEN', value: '24' },
                    { label: 'EF_FLASH', value: '0.82' },
                    { label: 'ADR', value: '90+' }
                ]
            },
            back: {
                achievements: [
                    'Entry leader and opener',
                    '90+ ADR throughout group stage',
                    'High-impact site entries'
                ],
                bio: 'Aggressive entry style opened up sites consistently. Maintained 90+ ADR throughout the group stage.'
            }
        }
    ];

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-10">
            <MVPFlipCard data={players[0]} />
            <MVPFlipCard data={players[1]} />
        </div>
    );
}
