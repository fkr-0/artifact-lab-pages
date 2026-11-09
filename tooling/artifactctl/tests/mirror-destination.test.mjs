import test from 'node:test';import assert from 'node:assert/strict';
import {mirrorDestination} from '../src/mirror-destination.mjs';
test('mirror path normalization forbids every spelling of remote filesystem root',()=>{
 for(const path of ['/','/.','/./','//','/././'])assert.throws(()=>mirrorDestination('example.org',path),/root|invalid/i);
 assert.equal(mirrorDestination('user@example.org','/srv/./portfolio/'),'user@example.org:/srv/portfolio/');
 assert.throws(()=>mirrorDestination('-oProxyCommand=bad','/srv/site'),/invalid/i);
});
