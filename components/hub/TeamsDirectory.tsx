'use client';

import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Search, Users, Plus, KeyRound } from 'lucide-react';
import type { HubData } from '@/lib/hub-types';
import { indexTeamDirectory, TEAM_CAPACITY } from '@/lib/team-directory';

const field = 'mt-2 block min-h-11 w-full rounded-xl border border-white/20 bg-[#0A0F14] p-3 text-base text-[#EAFBFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22D3EE]';
const card = 'rounded-2xl border border-white/10 bg-white/[0.025] p-5';
const button = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22D3EE] px-4 py-3 text-sm font-bold text-[#0A0F14] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE] disabled:opacity-50';
const games = [{ id: 'dota2', name: 'Dota 2' }, { id: 'cs2', name: 'CS2' }, { id: 'fc', name: 'EA Sports FC' }];

type Props = {
    data: HubData;
    ru: boolean;
    own: boolean;
    busy: boolean;
    headingLevel?: 2 | 3;
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    onAction: (payload: Record<string, unknown>) => Promise<void>;
};

export default function TeamsDirectory({ data, ru, own, busy, headingLevel = 3, onSubmit, onAction }: Props) {
    const text = (r: string, e: string) => ru ? r : e;
    const Heading = headingLevel === 2 ? 'h2' : 'h3';
    const RowHeading = headingLevel === 2 ? 'h3' : 'h4';
    const [query, setQuery] = useState('');
    const [game, setGame] = useState('all');
    const [availableOnly, setAvailableOnly] = useState(false);
    const [target, setTarget] = useState('');
    const inviteInput = useRef<HTMLInputElement>(null);
    const invitePanel = useRef<HTMLDetailsElement>(null);
    const inviteHeading = useId();
    const filterId = useId();
    const { membersByTeam, mine, ownGames, invitesByTeam, availability } = useMemo(() => indexTeamDirectory(data), [data]);
    const teams = data.teams.filter(team => (!own || mine.has(team.id))
        && (game === 'all' || team.game === game)
        && team.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
        && (!availableOnly || availability(team.id).canJoin));

    function showInvitation(name: string) {
        setTarget(name);
        if (invitePanel.current) invitePanel.current.open = true;
        inviteInput.current?.focus();
        inviteInput.current?.scrollIntoView({ behavior: 'instant', block: 'center' });
    }

    return <div className="space-y-6 font-sans text-[#EAFBFF]">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">DEAF|HUB / TEAM TERMINAL</p><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{text('Твоя игра. Твой состав. Найди команду и выходи на турнир вместе.', 'Your game. Your roster. Find a team and enter the tournament together.')}</p></div><div role="group" aria-label={text('Фильтр команд по игре', 'Filter teams by game')} className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">{[{id:'all',name:text('Все игры','All games')},...games].map(item=><button key={item.id} type="button" aria-pressed={game===item.id} onClick={()=>setGame(item.id)} className={'min-h-11 rounded-xl px-4 text-xs font-bold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22D3EE] '+(game===item.id?'bg-[#22D3EE] text-[#0A0F14]':'text-slate-400 hover:bg-white/5 hover:text-white')}>{item.name}</button>)}</div></div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="space-y-4 border-b border-white/10 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><Heading className="text-2xl font-black uppercase italic tracking-tight">{own?text('Мои команды','My teams'):text('Команды','Teams')}</Heading><label className="relative min-w-0 flex-1 basis-52 sm:max-w-xs"><span className="sr-only">{text('Поиск команды','Search teams')}</span><Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input type="search" placeholder={text('Найти команду…','Find a team…')} className={field+' !mt-0 !pl-10'} value={query} onChange={event=>setQuery(event.target.value)}/></label></div><div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-400"><p role="status">{text('Найдено команд: ','Teams found: ')}<span className="font-mono text-[#EAFBFF]">{teams.length}</span></p><label htmlFor={filterId} className="flex min-h-11 cursor-pointer items-center gap-2"><input id={filterId} type="checkbox" checked={availableOnly} onChange={event=>setAvailableOnly(event.target.checked)} className="h-4 w-4 accent-[#22D3EE]"/>{text('Есть места и состав открыт','Has room and roster is unlocked')}</label>{query||game!=='all'||availableOnly?<button type="button" className="min-h-11 text-[#22D3EE] underline-offset-4 hover:underline" onClick={()=>{setQuery('');setGame('all');setAvailableOnly(false);}}>{text('Сбросить фильтры','Reset filters')}</button>:null}</div></div>
        <div className="divide-y divide-white/10">{teams.map(team => {
            const state = availability(team.id);
            const members = membersByTeam.get(team.id) ?? [];
            const invite = team.captain_id === data.userId ? invitesByTeam.get(team.id) : undefined;
            const member = mine.has(team.id);
            const sameGame = ownGames.has(team.game);
            return <article key={team.id} className="min-w-0 space-y-4 p-5 transition-colors hover:bg-white/[0.025] sm:p-6">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4"><span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] text-xl font-black">{Array.from(team.name.trim())[0]?.toLocaleUpperCase()}</span><div className="min-w-0 flex-1"><p className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[#22D3EE]">{games.find(g => g.id === team.game)?.name || team.game}</p><RowHeading className="break-words text-lg font-black uppercase leading-tight tracking-tight sm:text-xl">{team.name}</RowHeading><p className="mt-2 text-xs text-slate-400">{text(`${state.count} из ${TEAM_CAPACITY} участников · свободных мест: ${state.remaining}`, `${state.count} of ${TEAM_CAPACITY} members · open places: ${state.remaining}`)}</p></div><div className="shrink-0 text-right"><p className={'font-mono text-3xl font-bold leading-none sm:text-4xl ' + (state.canJoin ? 'text-[#EAFBFF]' : 'text-slate-500')}>{state.remaining}</p><p className="mt-2 text-[9px] uppercase tracking-widest text-slate-500">{text('мест', 'places')}</p></div></div>
                <p className="text-sm text-slate-300">{state.locked ? text('Состав заблокирован на время турнира', 'Roster locked during tournament participation') : state.remaining === 0 ? text('Состав полный', 'Roster full') : text('Можно вступить по приглашению', 'Can join by invitation')}</p>
                <details className="text-sm"><summary className="w-fit min-h-11 cursor-pointer py-3 text-slate-400 focus-visible:outline-2 focus-visible:outline-[#22D3EE]">{text('Состав', 'Roster')} · {members.length}</summary><ul className="mt-2 space-y-2 border-l border-white/15 pl-4 text-slate-300">{members.map(m => <li className="break-words" key={m.user_id}>{m.nickname}{m.user_id === team.captain_id ? ' · ' + text('Капитан', 'Captain') : ''}{m.user_id === data.userId ? ' · ' + text('Вы', 'You') : ''}</li>)}</ul></details>
                {member ? <p className="text-sm text-[#22D3EE]">{text('Вы в этой команде', 'You are on this team')}</p> : <button type="button" disabled={busy || !state.canJoin || sameGame} className={button} onClick={() => showInvitation(team.name)}>{!state.canJoin ? state.locked ? text('Состав заблокирован', 'Roster locked') : text('Состав полный', 'Roster full') : sameGame ? text('У вас уже есть команда в этой игре', 'You already have a team in this game') : text('Вступить по приглашению', 'Join by invitation')}</button>}
                {member && team.captain_id !== data.userId ? <button type="button" disabled={busy || state.locked} className="min-h-11 text-sm text-slate-200 underline underline-offset-4 disabled:opacity-50" onClick={() => void onAction({ action: 'leave_team', team_id: team.id })}>{text('Покинуть команду', 'Leave team')}</button> : null}
                {invite ? <div className="space-y-3 border-t border-white/15 pt-4"><p className="text-sm leading-6 text-slate-300">{text('Пригласить игрока: передайте код только выбранному участнику.', 'Invite a player: share the code only with the intended player.')}</p><code className="block break-all text-sm text-[#22D3EE]">{invite.code}</code><button type="button" disabled={busy} className="min-h-11 text-sm text-[#22D3EE] underline underline-offset-4" onClick={() => void onAction({ action: 'rotate_invite', team_id: team.id })}>{text('Заменить код приглашения', 'Replace invitation code')}</button></div> : null}
            </article>;
        })}</div>
        {!teams.length ? <div role="status" className="px-6 py-16 text-center text-sm leading-6 text-slate-400"><Users aria-hidden="true" size={32} className="mx-auto mb-5 text-slate-600"/>{data.teams.length ? text('По выбранным условиям команд нет. Измените или сбросьте фильтры.', 'No teams match. Change or reset the filters.') : text('Команд пока нет. Создайте первую команду.', 'No teams yet. Create the first team.')}</div> : null}

        </section><aside className="min-w-0 space-y-4"><div className="rounded-2xl border border-[#22D3EE]/20 bg-[#22D3EE]/[0.04] p-5"><Users size={20} aria-hidden="true" className="mb-4 text-[#22D3EE]"/><Heading className="text-lg font-black uppercase italic">{text('Твой следующий состав','Your next roster')}</Heading><p className="mt-3 text-sm leading-6 text-slate-400">{text('Создай свою команду или присоединись по коду капитана. Одна команда на каждую игру.','Create your own team or join with a captain’s code. One team per game.')}</p></div>
<details className={card}><summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-[#22D3EE]"><Plus size={18} aria-hidden="true" className="text-[#22D3EE]"/>{text('Создать команду', 'Create team')}</summary>            <form className="mt-4 space-y-4 border-t border-white/10 pt-4" onSubmit={onSubmit} aria-label={text('Создать команду', 'Create team')}>
                <h3 className="sr-only">{text('Создать команду', 'Create team')}</h3>
                <input type="hidden" name="action" value="create_team" />
                <label className="block">{text('Название', 'Name')}<input className={field} name="name" minLength={2} maxLength={40} required /></label>
                <fieldset><legend className="text-sm text-slate-400">{text('Игра', 'Game')}</legend><div className="mt-2 grid grid-cols-2 gap-2">{games.filter(g => g.id !== 'fc').map(g => <label key={g.id} className="cursor-pointer"><input type="radio" name="game" value={g.id} defaultChecked={g.id === 'dota2'} required className="peer sr-only"/><span className="flex min-h-11 items-center justify-center rounded-xl border border-white/15 text-sm font-bold text-slate-400 peer-checked:border-[#22D3EE] peer-checked:bg-[#22D3EE]/10 peer-checked:text-[#22D3EE] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#22D3EE]">{g.name}</span></label>)}</div></fieldset>
                <p className="text-sm leading-6 text-slate-300">{text('Одна команда на игру. Сначала сохраните ник в профиле. Он будет виден в составе другим вошедшим игрокам.', 'One team per game. Save your profile nickname first. Signed-in players will see it in the roster.')}</p>
                <Link href="/profile" className="inline-flex min-h-11 items-center text-sm text-[#22D3EE] underline underline-offset-4">{text('Открыть профиль', 'Open profile')}</Link>
                <button disabled={busy} className={button}>{text('Создать команду', 'Create team')}</button>
            </form>
</details><details ref={invitePanel} className={card}><summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-[#22D3EE]"><KeyRound size={18} aria-hidden="true" className="text-[#22D3EE]"/>{text('Вступить по приглашению', 'Join by invitation')}</summary>            <form className="mt-4 space-y-4 border-t border-white/10 pt-4" onSubmit={onSubmit} aria-labelledby={inviteHeading}>
                <h3 id={inviteHeading} className="sr-only">{text('Вступить по приглашению', 'Join by invitation')}</h3>
                {target ? <p role="status" className="break-words text-sm text-[#22D3EE]">{text('Вы выбрали: ', 'Selected: ')}{target}</p> : null}
                <input type="hidden" name="action" value="join_team" />
                <label className="block">{text('Код от капитана', 'Captain invitation code')}<input ref={inviteInput} className={field} name="code" required autoCapitalize="none" autoComplete="off" spellCheck={false} /></label>
                <p className="text-sm leading-6 text-slate-300">{text('Код определяет команду, в которую вы вступите. Его передаёт капитан. Публичных заявок капитану пока нет.', 'The code determines which team you join. Obtain it from the captain. Public join requests are not available yet.')}</p>
                <button disabled={busy} className={button}>{text('Вступить по коду', 'Join with code')}</button>
                <p className="text-sm leading-6 text-slate-300">{text('Во время участия команды в турнире изменение состава заблокировано.', 'Roster changes are locked while a team participates in a tournament.')}</p>
            </form>
</details>
        <p className="px-1 text-xs leading-6 text-slate-500">{text('Лимит команды — 10 участников. Размер состава на матч задаётся регламентом турнира; это не число свободных мест в матче.', 'Teams can have up to 10 members. Tournament rules define the match roster size; this is not the number of open match positions.')}</p><Link href="/tournaments?game=fc" className="inline-flex min-h-11 items-center px-1 text-xs text-slate-400 hover:text-[#22D3EE]">{text('Турниры EA Sports FC','EA Sports FC tournaments')}</Link>
        </aside></div>
    </div>;
}
