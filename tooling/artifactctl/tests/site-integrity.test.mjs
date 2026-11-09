import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {sealSite,verifySite} from '../src/site-integrity.mjs';
test('site receipt verifies exact files and commit; rejects changed, extra or missing bytes',async t=>{
 const root=await mkdtemp(join(tmpdir(),'sealed-site-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await writeFile(join(root,'index.html'),'release');await sealSite(root,{commit:'a'.repeat(40),inventorySha256:'b'.repeat(64)});
 const result=await verifySite(root,{commit:'a'.repeat(40)});assert.equal(result.files.length,1);
 await assert.rejects(verifySite(root,{commit:'c'.repeat(40)}),/commit/i);
 await writeFile(join(root,'index.html'),'tampered');await assert.rejects(verifySite(root),/hash|integrity/i);
 await writeFile(join(root,'index.html'),'release');await writeFile(join(root,'extra.js'),'extra');await assert.rejects(verifySite(root),/inventory|extra/i);
 await rm(join(root,'extra.js'));await rm(join(root,'index.html'));await assert.rejects(verifySite(root),/inventory|missing/i);
});
