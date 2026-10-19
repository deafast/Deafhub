import type { HubData, HubTournament } from './hub-types';

export const GAME_OPTIONS = [
    { id: 'dota2', name: 'Dota 2' },
    { id: 'cs2', name: 'CS2' },
    { id: 'fc', name: 'EA Sports FC' },
] as const;
export type GameFilter = 'all' | typeof GAME_OPTIONS[number]['id'];

export function parseGameFilter(value: string | null): GameFilter {
    return GAME_OPTIONS.some(game => game.id === value) ? value as GameFilter : 'all';
}

export function gameFilterUrl(current: string, game: GameFilter) {
    const url = new URL(current);
    if (game === 'all') url.searchParams.delete('game');
    else url.searchParams.set('game', game);
    return url.pathname + url.search + url.hash;
}

export function filterTournaments(data: Pick<HubData, 'tournaments' | 'entries' | 'ownEntryIds' | 'userId'>,
    game: GameFilter, query: string, own: boolean): HubTournament[] {
    const search = query.trim().toLocaleLowerCase();
    const ownEntries = new Set(data.ownEntryIds);
    return data.tournaments.filter(tournament => (game === 'all' || tournament.game === game)
        && tournament.title.toLocaleLowerCase().includes(search)
        && (!own || tournament.organizer_id === data.userId
            || data.entries.some(entry => entry.tournament_id === tournament.id && ownEntries.has(entry.id))));
}
