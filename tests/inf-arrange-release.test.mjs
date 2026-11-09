import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('Inf Arrange compiled entrypoint loads assets under its versioned publication route',async()=>{
 const html=await readFile('inf-arrange/dist/index.html','utf8');
 assert.doesNotMatch(html,/(?:src|href)=["']\/(?!\/)/u);
 assert.match(html,/src="\.\/assets\//u);
});
