'use client';

import { useSyncExternalStore } from 'react';
import { GAME_OPTIONS, gameFilterUrl, parseGameFilter, type GameFilter as Filter } from '@/lib/tournament-filters';

const changeEvent = 'deafhub:game-filter';
function subscribe(callback: () => void) {
    window.addEventListener('popstate', callback);
    window.addEventListener(changeEvent, callback);
    return () => {
        window.removeEventListener('popstate', callback);
        window.removeEventListener(changeEvent, callback);
    };
}
const snapshot = () => window.location.search;
const serverSnapshot = () => '';

export function useGameFilter() {
    const search = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
    const game = parseGameFilter(new URLSearchParams(search).get('game'));
    function setGame(next: Filter) {
        const url = gameFilterUrl(window.location.href, next);
        if (url === window.location.pathname + window.location.search + window.location.hash) return;
        window.history.pushState(null, '', url);
        window.dispatchEvent(new Event(changeEvent));
    }
    return [game, setGame] as const;
}

export default function GameFilter({ value, onChange, ru }: { value: Filter; onChange: (value: Filter) => void; ru: boolean }) {
    return <div role="group" aria-label={ru ? 'Фильтр по игре' : 'Filter by game'} className="flex flex-wrap gap-2">
        {[{ id: 'all' as const, name: ru ? 'Все игры' : 'All games' }, ...GAME_OPTIONS].map(game => <button
            key={game.id} type="button" aria-pressed={value === game.id} onClick={() => onChange(game.id)}
            className={'min-h-11 rounded-xl border px-4 py-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE] '
                + (value === game.id ? 'border-[#22D3EE] bg-[#22D3EE] text-[#0A0F14]' : 'border-white/15 bg-white/5 text-[#EAFBFF]')}
        ><span translate="no">{game.name}</span></button>)}
    </div>;
}
