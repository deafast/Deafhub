const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const vm = require('node:vm');
const source = readFileSync(resolve(__dirname, '../../lib/team-directory.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const scope = { exports: {} };
vm.runInNewContext(compiled, scope);
const { getTeamAvailability, TEAM_CAPACITY, indexTeamDirectory } = scope.exports;
const fixtures = (count, status, entryStatus = 'approved') => ({
 members: Array.from({ length: count }, (_, i) => ({ team_id: 'team', user_id: String(i), nickname: 'Test' })),
 entries: status ? [{ team_id: 'team', tournament_id: 'tournament', status: entryStatus }] : [],
 tournaments: status ? [{ id: 'tournament', status }] : [],
});
test('capacity reflects 10-member server limit, not a five-player match', () => {
 const state = getTeamAvailability(fixtures(5), 'team');
 assert.equal(TEAM_CAPACITY, 10);
 assert.equal(state.remaining, 5);
 assert.equal(state.canJoin, true);
});
test('full and oversized rosters cannot advertise available places', () => {
 for (const count of [10, 11]) {
  const state = getTeamAvailability(fixtures(count), 'team');
  assert.equal(state.remaining, 0);
  assert.equal(state.canJoin, false);
 }
});
test('pending and approved entries lock roster until tournament finishes', () => {
 for (const entryStatus of ['pending', 'approved']) {
  for (const status of ['open', 'closed']) {
   const state = getTeamAvailability(fixtures(3, status, entryStatus), 'team');
   assert.equal(state.locked, true);
   assert.equal(state.canJoin, false);
  }
 }
});
test('rejected entries and finished tournaments do not lock roster', () => {
 assert.equal(getTeamAvailability(fixtures(3, 'open', 'rejected'), 'team').canJoin, true);
 assert.equal(getTeamAvailability(fixtures(3, 'finished'), 'team').canJoin, true);
});
test('another team cannot change membership count or lock state', () => {
 const data = fixtures(10, 'open');
 const state = getTeamAvailability(data, 'different-team');
 assert.equal(state.count, 0);
 assert.equal(state.remaining, 10);
 assert.equal(state.locked, false);
});

const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const componentSource = readFileSync(resolve(__dirname, '../../components/hub/TeamsDirectory.tsx'), 'utf8');
const componentCode = ts.transpileModule(componentSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const componentScope = { exports: {}, require: name => name === '@/lib/team-directory' ? scope.exports : name === './PlayerLfp' ? { __esModule:true, default:()=>null } : require(name) };
vm.runInNewContext(componentCode, componentScope);
const TeamsDirectory = componentScope.exports.default;
const renderDirectory = (data, ru = true) => renderToStaticMarkup(React.createElement(TeamsDirectory, {
 data, ru, own: false, busy: false, onSubmit: async () => {}, onAction: async () => {},
}));
test('real directory shows clear counts and invitation action, without fabricated ratings', () => {
 const data = { ...fixtures(4), userId: 'viewer', teams: [{ id: 'team', game: 'dota2', captain_id: 'captain', name: 'Test team' }], invites: [] };
 const html = renderDirectory(data);
 assert.match(html, /4 из 10 участников/);
 assert.match(html, /свободных мест: 6/);
 assert.match(html, /Вступить по приглашению/);
 assert.match(html, /EA Sports FC/);
 assert.doesNotMatch(html, /2850|SOLARIS|Подать заявку/);
});
test('non-captain never sees invitation secret even if supplied in data', () => {
 const data = { ...fixtures(4), userId: 'viewer', teams: [{ id: 'team', game: 'dota2', captain_id: 'captain', name: 'Test team' }], invites: [{ team_id: 'team', code: 'private-test-invite' }] };
 assert.doesNotMatch(renderDirectory(data), /private-test-invite/);
 data.userId = 'captain';
 assert.match(renderDirectory(data), /private-test-invite/);
});
for(const ru of [true,false])test(`individual FC entry is reachable from teams without creating a team RU=${ru}`,()=>{
 const data={...fixtures(0),userId:'viewer',teams:[],invites:[]};
 const html=renderDirectory(data,ru);
 assert.match(html,/<a(?=[^>]*href="\/tournaments\?game=fc")(?=[^>]*class="[^"]*min-h-11[^"]*")[^>]*>/);
 assert.match(html,ru?/Турниры EA Sports FC/:/EA Sports FC tournaments/);
 assert.doesNotMatch(html,/Индивидуальная регистрация ещё не подключена|Individual registration is not connected yet/);
 assert.doesNotMatch(html.match(/<form[\s\S]*?<\/form>/)[0],/<option value="fc">/);
});

test('indexed team directory preserves availability, roster order and first invite without mutating input',()=>{
 const data={userId:'viewer',teams:[],members:[],entries:[],tournaments:[],invites:[]};
 for(let i=0;i<120;i++){
  const id=`team-${i}`,game=i%2?'cs2':'dota2';
  data.teams.push({id,game,captain_id:`captain-${i}`,name:id});
  for(let n=0;n<i%13;n++)data.members.push({team_id:id,user_id:n===0&&i%7===0?'viewer':`${i}-${n}`,nickname:`Player ${i}-${n}`});
  data.tournaments.push({id:`event-${i}`,status:['open','closed','finished'][i%3]});
  for(let j=0;j<3;j++)data.entries.push({team_id:j===2?null:id,tournament_id:j===1?'missing':`event-${i}`,status:['pending','approved','rejected'][(i+j)%3]});
  data.invites.push({team_id:id,code:`first-${i}`},{team_id:id,code:`second-${i}`});
 }
 const before=JSON.stringify(data),index=indexTeamDirectory(data);
 for(const team of [...data.teams,{id:'missing-team',game:'cs2'}]){
  assert.equal(JSON.stringify(index.availability(team.id)),JSON.stringify(getTeamAvailability(data,team.id)));
  assert.equal(JSON.stringify(index.membersByTeam.get(team.id)??[]),JSON.stringify(data.members.filter(m=>m.team_id===team.id)));
  assert.equal(index.invitesByTeam.get(team.id),data.invites.find(i=>i.team_id===team.id));
  assert.equal(index.mine.has(team.id),data.members.some(m=>m.team_id===team.id&&m.user_id===data.userId));
  assert.equal(index.ownGames.has(team.game),data.teams.some(t=>t.game===team.game&&data.members.some(m=>m.team_id===t.id&&m.user_id===data.userId)));
 }
 assert.equal(JSON.stringify(data),before);
});

test('directory index is rebuilt from a changed roster and finished tournament',()=>{
 const data={...fixtures(10,'open'),userId:'0',teams:[{id:'team',game:'cs2'}],invites:[]};
 assert.equal(indexTeamDirectory(data).availability('team').canJoin,false);
 const next={...data,members:data.members.slice(1),tournaments:[{id:'tournament',status:'finished'}]};
 const index=indexTeamDirectory(next);
 assert.equal(index.availability('team').canJoin,true);
 assert.equal(index.mine.has('team'),false);
 assert.equal(index.ownGames.has('cs2'),false);
});
