const test=require('node:test');
const assert=require('node:assert/strict');
const {z}=require('zod');

// Match the tournament entry/group bounds without allocating a destructive payload.
for(const limit of [32,64])test(`Zod rejects an oversized collection before validating its elements (limit ${limit})`,()=>{
 let visited=0;
 const entry=z.string().refine(()=>{visited++;return true;});
 const schema=z.array(entry).max(limit);
 const result=schema.safeParse(Array(limit+1).fill('invalid entry'));
 assert.equal(result.success,false);
 assert.equal(visited,0,'over-limit arrays must not allocate per-element validation work');
 assert.equal(result.error.issues.length,1);
});
test('Zod preserves valid boundary collections and ordinary field errors',()=>{
 const id='00000000-0000-4000-8000-000000000001';
 const schema=z.array(z.string().uuid()).max(64);
 assert.equal(schema.safeParse(Array(64).fill(id)).success,true);
 const invalid=schema.safeParse(['invalid entry']);
 assert.equal(invalid.success,false);assert.equal(invalid.error.issues[0].path[0],0);
});
