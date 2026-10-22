/** Deterministic tournament state. Only the authenticated server may persist transitions. */
export type Game = 'dota2' | 'cs2' | 'fc';
export type Config = {
  format: 'single' | 'double';
  grandFinal: 'reset' | 'single';
  bestOf: 1 | 3 | 5;
  // Missing on legacy persisted states: do not reinterpret their recorded BO scores.
  fcScore?: 'goals';
  bronzeMatch?: boolean;
  groups: { id: string; entries: string[] }[];
  qualify: number;
  points: { win: number; draw: number; loss: number };
};
type Source = { entry: string | null } | { match: string; outcome: 'winner' | 'loser' };
export type Result = { kind: 'played'; a: number; b: number; penalties?: { a: number; b: number } } | { kind: 'forfeit'; loser: string };
export type Match = {
  id: string; stage: string; sources: [Source, Source];
  a: string | null; b: string | null;
  status: 'waiting' | 'ready' | 'finished' | 'bye' | 'skipped';
  result?: Result; winner?: string | null; loser?: string | null;
  scheduledAt?: string;
};
export type Row = { entry: string; played: number; wins: number; draws: number; losses: number; scored: number; conceded: number; points: number };
export type State = {
  schema: 1; game: Game; entries: string[]; config: Config;
  phase: 'groups' | 'playoffs' | 'finished';
  matches: Match[]; seeds: string[]; champion: string | null;
};
export type Command =
  | { type: 'schedule'; match: string; scheduledAt: string | null; reason: string }
  | { type: 'result'; match: string; result: Result; invalidate: boolean; reason: string }
  | { type: 'qualify'; ties: Record<string, string[]> };
function fail(message: string): never { throw new Error(message); }
function unique(values: string[]) { return values.length === new Set(values).size && values.every(v => typeof v === 'string' && v.length > 0); }
function add(matches: Match[], id: string, stage: string, a: Source, b: Source) {
  matches.push({ id, stage, sources: [a,b], a:null, b:null, status:'waiting' });
}
const entry = (id: string | null): Source => ({entry:id});
const winner = (id: string): Source => ({match:id, outcome:'winner'});
const loser = (id: string): Source => ({match:id, outcome:'loser'});
function seedOrder(size: number): number[] {
  let order = [1,2];
  while (order.length < size) order = order.flatMap(n => [n, order.length * 2 + 1 - n]);
  return order;
}
function playoffMatches(seeds: string[], config: Config): Match[] {
  const size = 2 ** Math.ceil(Math.log2(seeds.length));
  const rounds = Math.log2(size), matches: Match[] = [];
  const order = seedOrder(size);
  for (let r=1;r<=rounds;r++) for(let i=0;i<size/2**r;i++) {
    add(matches,`U${r}.${i}`,'upper',
      r===1?entry(seeds[order[2*i]-1]??null):winner(`U${r-1}.${2*i}`),
      r===1?entry(seeds[order[2*i+1]-1]??null):winner(`U${r-1}.${2*i+1}`));
  }
  if(config.format==='single') {
    if(config.bronzeMatch) add(matches,'BR1','bronze',loser(`U${rounds-1}.0`),loser(`U${rounds-1}.1`));
    return matches;
  }
  if(size>2) {
    for(let i=0;i<size/4;i++) add(matches,`L1.${i}`,'lower',loser(`U1.${2*i}`),loser(`U1.${2*i+1}`));
    for(let r=2;r<=rounds;r++) {
      const count=size/2**r;
      for(let i=0;i<count;i++) add(matches,`L${2*r-2}.${i}`,'lower',winner(`L${2*r-3}.${i}`),loser(`U${r}.${count>1?(i^1):i}`));
      if(r<rounds) for(let i=0;i<count/2;i++) add(matches,`L${2*r-1}.${i}`,'lower',winner(`L${2*r-2}.${2*i}`),winner(`L${2*r-2}.${2*i+1}`));
    }
  }
  add(matches,'GF1','final',winner(`U${rounds}.0`),size===2?loser('U1.0'):winner(`L${2*rounds-2}.0`));
  if(config.grandFinal==='reset') add(matches,'GF2','reset',winner('GF1'),loser('GF1'));
  return matches;
}
function evaluate(state: State, previous: Match[] = [], invalidate=false) {
  const old = new Map(previous.map(m=>[m.id,m]));
  const resolved = new Map<string,Match>();
  // Upper matches precede lower matches, and each lower round follows its dependencies.
  for(const m of state.matches) {
    const source = (s: Source): string | null | undefined => {
      if('entry' in s) return s.entry;
      const prior=resolved.get(s.match);
      return prior && ['finished','bye','skipped'].includes(prior.status)?prior[s.outcome]:undefined;
    };
    const a=source(m.sources[0]), b=source(m.sources[1]);
    const before=old.get(m.id);
    if(m.result && before && (before.a!==a || before.b!==b)) {
      if(!invalidate) fail('Dependent results exist; explicitly invalidate them');
      delete m.result;
    }
    delete m.winner; delete m.loser;
    m.a=a??null; m.b=b??null;
    if(m.id==='GF2') {
      const first=resolved.get('GF1');
      if(first?.status==='finished' && first.winner===first.a) {
        if(m.result && !invalidate) fail('Dependent results exist; explicitly invalidate them');
        delete m.result; m.status='skipped'; m.winner=first.winner; m.loser=first.loser; resolved.set(m.id,m); continue;
      }
    }
    if(a===undefined || b===undefined) { m.status='waiting'; }
    else if(a===null || b===null) { m.status='bye'; m.winner=a??b; m.loser=null; }
    else if(m.result) {
      const result=m.result;
      if(result.kind==='forfeit') {
        if(![a,b].includes(result.loser)) fail('Forfeit loser must be a participant');
        m.loser=result.loser; m.winner=result.loser===a?b:a;
      } else {
        const group=m.stage.startsWith('group:');
        if(![result.a,result.b].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000)) fail('Invalid score');
        const football=state.game==='fc' && (group || state.config.fcScore==='goals');
        if(result.penalties) {
          if(!football || group || result.a!==result.b) fail('Penalties require a tied FC playoff match');
          if(![result.penalties.a,result.penalties.b].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000)
            || result.penalties.a===result.penalties.b) fail('Invalid penalty shootout');
        }
        if(result.a===result.b && !(group&&state.game==='fc') && !result.penalties) fail(football?'Draw not allowed; record the deciding penalty shootout for FC':'Draw not allowed');
        if(!football) {
          const target=(state.config.bestOf+1)/2;
          if(Math.max(result.a,result.b)!==target || Math.min(result.a,result.b)>=target) fail('Score does not match best-of');
        }
        const deciding=result.penalties??result;
        m.winner=deciding.a===deciding.b?null:deciding.a>deciding.b?a:b;
        m.loser=deciding.a===deciding.b?null:deciding.a>deciding.b?b:a;
      }
      m.status='finished';
    } else m.status='ready';
    resolved.set(m.id,m);
  }
  state.champion=null;
  if(state.phase!=='groups') {
    const final=state.matches.findLast(m=>m.stage!=='bronze')!;
    const bronze=state.matches.find(m=>m.id==='BR1');
    if(['finished','skipped'].includes(final.status) && final.winner && (!bronze||bronze.status==='finished')) { state.champion=final.winner; state.phase='finished'; }
    else state.phase='playoffs';
  }
}
export function createTournament(game: Game, entries: string[], config: Config): State {
  if(!['dota2','cs2','fc'].includes(game) || entries.length<2 || entries.length>64 || !unique(entries)) fail('Choose 2–64 unique approved entries');
  if(!['single','double'].includes(config.format)||!['reset','single'].includes(config.grandFinal)||![1,3,5].includes(config.bestOf)) fail('Invalid tournament rules');
  if(game==='fc' && config.bestOf!==1) fail('FC uses football goals in a single match; multi-match FC series are not supported');
  if(game!=='fc' && config.fcScore) fail('Football scoring is only available for FC');
  if(config.bronzeMatch && (config.format!=='single' || (config.groups.length?config.qualify*config.groups.length:entries.length)<4)) fail('Bronze match requires Single Elimination with at least four playoff entries');
  if(!Object.values(config.points).every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100)) fail('Invalid points');
  const state: State={schema:1,game,entries:[...entries],config:structuredClone(config),phase:config.groups.length?'groups':'playoffs',matches:[],seeds:config.groups.length?[]:[...entries],champion:null};
  if(game==='fc') state.config.fcScore='goals';
  if(config.groups.length) {
    if(!unique(config.groups.map(g=>g.id)) || !unique(config.groups.flatMap(g=>g.entries)) || config.groups.flatMap(g=>g.entries).sort().join()!==[...entries].sort().join()) fail('Each entry must belong to exactly one group');
    for(const group of config.groups) {
      if(group.entries.length<2 || !Number.isInteger(config.qualify) || config.qualify<1 || config.qualify>group.entries.length) fail('Invalid qualification count');
      for(let a=0;a<group.entries.length;a++) for(let b=a+1;b<group.entries.length;b++) add(state.matches,`G${group.id}.${a}.${b}`,`group:${group.id}`,entry(group.entries[a]),entry(group.entries[b]));
    }
    if(config.qualify*config.groups.length<2) fail('At least two qualifiers required');
  } else state.matches=playoffMatches(entries,config);
  evaluate(state); return state;
}
export function standings(state: State, groupId: string): Row[] {
  const group=state.config.groups.find(g=>g.id===groupId)??fail('Group not found');
  const rows=new Map(group.entries.map(id=>[id,{entry:id,played:0,wins:0,draws:0,losses:0,scored:0,conceded:0,points:0}]));
  for(const m of state.matches.filter(m=>m.stage===`group:${groupId}` && m.status==='finished')) {
    const a=rows.get(m.a!)!, b=rows.get(m.b!)!;
    a.played++; b.played++;
    // A technical victory awards points, without invented goals or maps.
    if(m.result?.kind==='played') {a.scored+=m.result.a; a.conceded+=m.result.b; b.scored+=m.result.b; b.conceded+=m.result.a;}
    if(m.winner===null) {a.draws++;b.draws++;a.points+=state.config.points.draw;b.points+=state.config.points.draw;}
    else {const w=m.winner===m.a?a:b,l=m.winner===m.a?b:a;w.wins++;l.losses++;w.points+=state.config.points.win;l.points+=state.config.points.loss;}
  }
  return [...rows.values()].sort((a,b)=>b.points-a.points || b.wins-a.wins || (b.scored-b.conceded)-(a.scored-a.conceded) || b.scored-a.scored || a.entry.localeCompare(b.entry));
}
const rankKey=(r:Row)=>[r.points,r.wins,r.scored-r.conceded,r.scored].join(':');
export function transition(current: State, command: Command): State {
  const state=structuredClone(current);
  if(command.type==='schedule') {
    if(command.reason.trim().length<3) fail('Schedule reason required');
    const match=state.matches.find(m=>m.id===command.match)??fail('Match not found');
    if(state.phase==='finished'||!['waiting','ready'].includes(match.status)) fail('Only upcoming matches can be scheduled');
    if(command.scheduledAt===null) delete match.scheduledAt;
    else {
      const date=new Date(command.scheduledAt);
      if(!Number.isFinite(date.getTime())||date.toISOString()!==command.scheduledAt) fail('Use a valid UTC schedule');
      match.scheduledAt=command.scheduledAt;
    }
    return state;
  }
  if(command.type==='qualify') {
    if(state.phase!=='groups'||state.matches.some(m=>m.status!=='finished')) fail('Finish all group matches first');
    const ranked=state.config.groups.map(g=>{
      const rows=standings(state,g.id), order=command.ties[g.id];
      if(order && (!unique(order)||order.length!==rows.length||order.some(id=>!g.entries.includes(id)))) fail('Tie order must contain every entry in the group');
      for(let start=0;start<rows.length;) {
        let end=start+1; while(end<rows.length&&rankKey(rows[start])===rankKey(rows[end])) end++;
        if(end-start>1 && start<state.config.qualify) {
          if(!order) fail('Resolve tied qualification or seed positions first');
          const tied=rows.slice(start,end).sort((a,b)=>order.indexOf(a.entry)-order.indexOf(b.entry)); rows.splice(start,end-start,...tied);
        }
        start=end;
      }
      return rows.slice(0,state.config.qualify).map(r=>r.entry);
    });
    // Rank first, then group. Standard bracket seed order produces A1–B2 / B1–A2.
    state.seeds=Array.from({length:state.config.qualify},(_,i)=>ranked.map(g=>g[i])).flat();
    const playoffs=playoffMatches(state.seeds,state.config);
    evaluate({...state,phase:'playoffs',matches:playoffs});
    if(playoffs.some(m=>m.id.startsWith('U1.')&&m.a&&m.b&&state.config.groups.some(g=>g.entries.includes(m.a!)&&g.entries.includes(m.b!)))) fail('First-round group rematch; use a different group/qualification configuration');
    state.matches.push(...playoffs); state.phase='playoffs'; evaluate(state); return state;
  }
  if(!command.reason.trim()) fail('Result reason required');
  const match=state.matches.find(m=>m.id===command.match)??fail('Match not found');
  if(!['ready','finished'].includes(match.status)) fail('Match is not ready');
  if(match.result && match.stage.startsWith('group:') && state.phase!=='groups') {
    if(!command.invalidate) fail('Qualification already published; explicitly invalidate playoffs');
    state.matches=state.matches.filter(m=>m.stage.startsWith('group:')); state.seeds=[];state.phase='groups';
  }
  match.result=structuredClone(command.result);
  evaluate(state,current.matches,command.invalidate); return state;
}
