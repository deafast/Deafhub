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

export function indexTeamDirectory(data: HubData) {
    const membersByTeam = new Map<string, HubData['members']>();
    const mine = new Set<string>();
    for (const member of data.members) {
        const members = membersByTeam.get(member.team_id);
        if (members) members.push(member);
        else membersByTeam.set(member.team_id, [member]);
        if (member.user_id === data.userId) mine.add(member.team_id);
    }
    const active = new Set(data.tournaments.filter(t => t.status !== 'finished').map(t => t.id));
    const locked = new Set(data.entries.filter(e => e.team_id !== null && e.status !== 'rejected' && active.has(e.tournament_id)).map(e => e.team_id));
    const invitesByTeam = new Map<string, HubData['invites'][number]>();
    for (const invite of data.invites) {
        if (!invitesByTeam.has(invite.team_id)) invitesByTeam.set(invite.team_id, invite);
    }
    const ownGames = new Set(data.teams.filter(t => mine.has(t.id)).map(t => t.game));
    const availability = (teamId: string) => {
        const count = membersByTeam.get(teamId)?.length ?? 0;
        const remaining = Math.max(0, TEAM_CAPACITY - count);
        const rosterLocked = locked.has(teamId);
        return { count, remaining, locked: rosterLocked, canJoin: remaining > 0 && !rosterLocked };
    };
    return { membersByTeam, mine, ownGames, invitesByTeam, availability };
}
