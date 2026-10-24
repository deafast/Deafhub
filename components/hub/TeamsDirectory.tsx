'use client';

import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { HubData } from '@/lib/hub-types';
import { indexTeamDirectory, TEAM_CAPACITY } from '@/lib/team-directory';

const field = 'mt-2 block min-h-11 w-full rounded-xl border border-white/20 bg-[#0A0F14] p-3 text-base text-[#EAFBFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22D3EE]';
const card = 'rounded-2xl border border-white/10 bg-[#0D131A] p-5';
const button = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22D3EE] px-4 py-3 text-sm font-bold text-[#0A0F14] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE] disabled:opacity-50';
const games = [{ id: 'dota2', name: 'Dota 2' }, { id: 'cs2', name: 'CS2' }, { id: 'fc', name: 'EA Sports FC' }];

type Props = {
    data: HubData;
    ru: boolean;
    own: boolean;
    busy: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    onAction: (payload: Record<string, unknown>) => Promise<void>;
};

export default function TeamsDirectory({ data, ru, own, busy, onSubmit, onAction }: Props) {
    const text = (r: string, e: string) => ru ? r : e;
    const [query, setQuery] = useState('');
    const [game, setGame] = useState('all');
    const [availableOnly, setAvailableOnly] = useState(false);
    const [target, setTarget] = useState('');
    const inviteInput = useRef<HTMLInputElement>(null);
    const inviteHeading = useId();
    const filterId = useId();
    const { membersByTeam, mine, ownGames, invitesByTeam, availability } = useMemo(() => indexTeamDirectory(data), [data]);
    const teams = data.teams.filter(team => (!own || mine.has(team.id))
        && (game === 'all' || team.game === game)
        && team.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
        && (!availableOnly || availability(team.id).canJoin));

    function showInvitation(name: string) {
        setTarget(name);
        inviteInput.current?.focus();
        inviteInput.current?.scrollIntoView({ behavior: 'instant', block: 'center' });
    }

    return <div className="space-y-6 text-[#EAFBFF]">
        <p className="text-base leading-7 text-slate-300">{text('Найдите команду или создайте свою. Для вступления нужен код приглашения от капитана.', 'Find a team or create your own. A captain’s invitation code is required to join.')}</p>
        <p className="text-sm leading-6 text-slate-300">{text('EA Sports FC: индивидуальный формат 1 на 1. Подайте заявку на странице турнира; создавать команду не требуется.', 'EA Sports FC uses an individual 1v1 format. Enter on the tournament page; no team is required.')} <Link href="/tournaments?game=fc" className="inline-flex min-h-11 items-center text-[#22D3EE] underline underline-offset-4">{text('Турниры EA Sports FC', 'EA Sports FC tournaments')}</Link></p>
        <div className="grid gap-5 lg:grid-cols-2">
            <form className={card + ' space-y-4'} onSubmit={onSubmit}>
                <h3 className="text-lg font-bold">{text('Создать команду', 'Create team')}</h3>
                <input type="hidden" name="action" value="create_team" />
                <label className="block">{text('Название', 'Name')}<input className={field} name="name" minLength={2} maxLength={40} required /></label>
                <label className="block">{text('Игра', 'Game')}<select className={field} name="game">{games.filter(g => g.id !== 'fc').map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
                <p className="text-sm leading-6 text-slate-300">{text('Одна команда на игру. Сначала сохраните ник в профиле. Он будет виден в составе другим вошедшим игрокам.', 'One team per game. Save your profile nickname first. Signed-in players will see it in the roster.')}</p>
                <Link href="/profile" className="inline-flex min-h-11 items-center text-sm text-[#22D3EE] underline underline-offset-4">{text('Открыть профиль', 'Open profile')}</Link>
                <button disabled={busy} className={button}>{text('Создать команду', 'Create team')}</button>
            </form>
            <form className={card + ' space-y-4'} onSubmit={onSubmit} aria-labelledby={inviteHeading}>
                <h3 id={inviteHeading} className="text-lg font-bold">{text('Вступить по приглашению', 'Join by invitation')}</h3>
                {target ? <p role="status" className="break-words text-sm text-[#22D3EE]">{text('Вы выбрали: ', 'Selected: ')}{target}</p> : null}
                <input type="hidden" name="action" value="join_team" />
                <label className="block">{text('Код от капитана', 'Captain invitation code')}<input ref={inviteInput} className={field} name="code" required autoCapitalize="none" autoComplete="off" spellCheck={false} /></label>
                <p className="text-sm leading-6 text-slate-300">{text('Код определяет команду, в которую вы вступите. Его передаёт капитан. Публичных заявок капитану пока нет.', 'The code determines which team you join. Obtain it from the captain. Public join requests are not available yet.')}</p>
                <button disabled={busy} className={button}>{text('Вступить по коду', 'Join with code')}</button>
                <p className="text-sm leading-6 text-slate-300">{text('Во время участия команды в турнире изменение состава заблокировано.', 'Roster changes are locked while a team participates in a tournament.')}</p>
            </form>
        </div>
        <div className={card + ' space-y-4'}>
            <div className="flex flex-wrap gap-4">
                <label className="min-w-0 flex-1 basis-56">{text('Поиск команды', 'Search teams')}<input type="search" className={field} value={query} onChange={event => setQuery(event.target.value)} /></label>
                <label className="min-w-0 flex-1 basis-48">{text('Игра', 'Game')}<select className={field} value={game} onChange={event => setGame(event.target.value)}><option value="all">{text('Все игры', 'All games')}</option>{games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
            </div>
            <label htmlFor={filterId} className="flex min-h-11 items-center gap-3 text-sm"><input id={filterId} type="checkbox" checked={availableOnly} onChange={event => setAvailableOnly(event.target.checked)} className="h-5 w-5 accent-[#22D3EE]" />{text('Есть места и состав открыт', 'Has room and roster is unlocked')}</label>
            <div className="flex flex-wrap items-center gap-4 text-sm"><p role="status">{text('Найдено команд: ', 'Teams found: ')}{teams.length}</p>{query || game !== 'all' || availableOnly ? <button type="button" className="min-h-11 text-[#22D3EE] underline underline-offset-4" onClick={() => { setQuery(''); setGame('all'); setAvailableOnly(false); }}>{text('Сбросить фильтры', 'Reset filters')}</button> : null}</div>
            <p className="text-sm leading-6 text-slate-300">{text('Лимит команды — 10 участников. Размер состава на матч задаётся регламентом турнира; это не число свободных мест в матче.', 'Teams can have up to 10 members. Tournament rules define the match roster size; this is not the number of open match positions.')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">{teams.map(team => {
            const state = availability(team.id);
            const members = membersByTeam.get(team.id) ?? [];
            const invite = team.captain_id === data.userId ? invitesByTeam.get(team.id) : undefined;
            const member = mine.has(team.id);
            const sameGame = ownGames.has(team.game);
            return <article key={team.id} className={card + ' min-w-0 space-y-4'}>
                <div><p className="text-sm text-[#22D3EE]">{games.find(g => g.id === team.game)?.name || team.game}</p><h3 className="mt-2 break-words text-xl font-bold">{team.name}</h3></div>
                <p className="text-base text-slate-200">{text(`${state.count} из ${TEAM_CAPACITY} участников · свободных мест: ${state.remaining}`, `${state.count} of ${TEAM_CAPACITY} members · open places: ${state.remaining}`)}</p>
                <p className="text-sm text-slate-300">{state.locked ? text('Состав заблокирован на время турнира', 'Roster locked during tournament participation') : state.remaining === 0 ? text('Состав полный', 'Roster full') : text('Можно вступить по приглашению', 'Can join by invitation')}</p>
                <ul className="space-y-2 text-base">{members.map(m => <li className="break-words" key={m.user_id}>{m.nickname}{m.user_id === team.captain_id ? ' · ' + text('Капитан', 'Captain') : ''}{m.user_id === data.userId ? ' · ' + text('Вы', 'You') : ''}</li>)}</ul>
                {member ? <p className="text-sm text-[#22D3EE]">{text('Вы в этой команде', 'You are on this team')}</p> : <button type="button" disabled={busy || !state.canJoin || sameGame} className={button} onClick={() => showInvitation(team.name)}>{!state.canJoin ? state.locked ? text('Состав заблокирован', 'Roster locked') : text('Состав полный', 'Roster full') : sameGame ? text('У вас уже есть команда в этой игре', 'You already have a team in this game') : text('Вступить по приглашению', 'Join by invitation')}</button>}
                {member && team.captain_id !== data.userId ? <button type="button" disabled={busy || state.locked} className="min-h-11 text-sm text-slate-200 underline underline-offset-4 disabled:opacity-50" onClick={() => void onAction({ action: 'leave_team', team_id: team.id })}>{text('Покинуть команду', 'Leave team')}</button> : null}
                {invite ? <div className="space-y-3 border-t border-white/15 pt-4"><p className="text-sm leading-6 text-slate-300">{text('Пригласить игрока: передайте код только выбранному участнику.', 'Invite a player: share the code only with the intended player.')}</p><code className="block break-all text-sm text-[#22D3EE]">{invite.code}</code><button type="button" disabled={busy} className="min-h-11 text-sm text-[#22D3EE] underline underline-offset-4" onClick={() => void onAction({ action: 'rotate_invite', team_id: team.id })}>{text('Заменить код приглашения', 'Replace invitation code')}</button></div> : null}
            </article>;
        })}</div>
        {!teams.length ? <p role="status" className={card + ' text-base text-slate-300'}>{data.teams.length ? text('По выбранным условиям команд нет. Измените или сбросьте фильтры.', 'No teams match. Change or reset the filters.') : text('Команд пока нет. Создайте первую команду.', 'No teams yet. Create the first team.')}</p> : null}
    </div>;
}
