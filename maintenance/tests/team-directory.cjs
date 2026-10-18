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
const { getTeamAvailability, TEAM_CAPACITY } = scope.exports;
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
const componentScope = { exports: {}, require: name => name === '@/lib/team-directory' ? scope.exports : require(name) };
vm.runInNewContext(componentCode, componentScope);
const TeamsDirectory = componentScope.exports.default;
const renderDirectory = data => renderToStaticMarkup(React.createElement(TeamsDirectory, {
 data, ru: true, own: false, busy: false, onSubmit: async () => {}, onAction: async () => {},
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
