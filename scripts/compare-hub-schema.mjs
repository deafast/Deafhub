import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const actual=JSON.parse(await readFile(process.argv[2]||'/tmp/deafhub-local-schema.json','utf8'));
const expected=JSON.parse(await readFile(process.argv[3]||'docs/checks/2026-10-22-auto-admission-schema.json','utf8'));
const key=row=>row.kind+':'+row.name;const rows=new Map(actual.map(row=>[key(row),row.value]));
assert.equal(rows.size,actual.length,'Duplicate structural keys');
assert.equal(rows.size,expected.length,'Structural row count changed');
for(const row of expected)assert.deepEqual(rows.get(key(row)),row.value,key(row));
console.log(`PASS: ${expected.length} hub structural records match the read-only hosted snapshot; no player data read`);
