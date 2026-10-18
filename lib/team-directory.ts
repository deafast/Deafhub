import type { HubData } from './hub-types';

// This is the existing hub_action membership limit, not a match roster size.
export const TEAM_CAPACITY = 10;

export function getTeamAvailability(data: Pick<HubData, 'members' | 'entries' | 'tournaments'>, teamId: string) {
    const count = data.members.filter(member => member.team_id === teamId).length;
    const remaining = Math.max(0, TEAM_CAPACITY - count);
    const locked = data.entries.some(entry => entry.team_id === teamId && entry.status !== 'rejected'
        && data.tournaments.some(tournament => tournament.id === entry.tournament_id && tournament.status !== 'finished'));
    return { count, remaining, locked, canJoin: remaining > 0 && !locked };
}
