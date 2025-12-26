'use client';

import React from 'react';
import MVPFlipCard from './MVPFlipCard';

export default function FC25MVPShowcase() {
    const playerData = {
        id: 'FC25-001',
        game: 'fc25' as const,
        front: {
            name: 'DANIK',
            team: 'REAL MADRID',
            image: '', // Placeholder
            rating: '99',
            stats: [
                { label: 'xG', value: '3.2' },
                { label: 'Poss%', value: '62%' },
                { label: 'Pass%', value: '94%' },
                { label: 'CONV', value: '85%' }
            ]
        },
        back: {
            achievements: [
                'Hat-trick in semifinals',
                '85% conversion rate',
                'Decisive box presence'
            ],
            bio: 'Unstoppable in the box. Delivered a crucial hat-trick in the semifinals and maintained an elite conversion rate throughout the event.'
        }
    };

    return (
        <div className="flex items-center justify-center py-6 md:py-12">
            <MVPFlipCard data={playerData} />
        </div>
    );
}
