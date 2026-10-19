import test from 'node:test';
import assert from 'node:assert/strict';
import {filterTournaments,parseGameFilter,gameFilterUrl} from './tournament-filters.ts';
const data={userId:'viewer',ownEntryIds:['entry'],entries:[{id:'entry',tournament_id:'fc'}],tournaments:[
 {id:'dota',game:'dota2',title:'QA Dota cup',organizer_id:'other'},
 {id:'cs',game:'cs2',title:'QA CS cup',organizer_id:'viewer'},
 {id:'fc',game:'fc',title:'QA FC cup',organizer_id:'other'},
]};
test('each game filters actual supplied records without fabricating results',()=>{
 for(const [game,id] of [['dota2','dota'],['cs2','cs'],['fc','fc']]) assert.deepEqual(filterTournaments(data,game,'',false).map(t=>t.id),[id]);
 assert.equal(filterTournaments(data,'all','',false).length,3);
});
test('trimmed case-insensitive query combines with the game filter',()=>{
 assert.equal(filterTournaments(data,'fc','  qA fC ',false).length,1);
 assert.equal(filterTournaments(data,'cs2','Dota',false).length,0);
});
test('own tournaments include organizer and registered participant without leaking other entries',()=>{
 assert.deepEqual(filterTournaments(data,'all','',true).map(t=>t.id),['cs','fc']);
 assert.equal(filterTournaments(data,'dota2','',true).length,0);
});
test('empty data remains empty and input data is unchanged',()=>{
 const before=structuredClone(data);
 assert.equal(filterTournaments({...data,tournaments:[]},'all','',false).length,0);
 filterTournaments(data,'fc','',false);assert.deepEqual(data,before);
});
test('invalid URL games fall back to all games; legacy demo identifiers are not accepted',()=>{
 for(const value of [null,'unknown','dota','fc25','FC']) assert.equal(parseGameFilter(value),'all');
 for(const value of ['fc','cs2','dota2'])assert.equal(parseGameFilter(value),value);
});
test('game URL retains other parameters and fragment; reset removes only game',()=>{
 const start='https://preview.example/tournaments?source=invite&game=cs2#rules';
 assert.equal(gameFilterUrl(start,'fc'),'/tournaments?source=invite&game=fc#rules');
 assert.equal(gameFilterUrl(start,'all'),'/tournaments?source=invite#rules');
});
