#!/usr/bin/env node
// Explicit VPS mirror command. Pages remains owned by its workflow.
import {spawn} from 'node:child_process';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifySite} from '../tooling/artifactctl/src/site-integrity.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
try {
 const args=process.argv.slice(2);if(args.some(x=>!['--dry-run','--full'].includes(x)))throw new Error('Expected --dry-run or --full');
 const site=join(process.env.ARTIFACTS_DIR||root,'dist/site');await verifySite(site);
 const host=process.env.ARTIFACTS_VPS_HOST,path=process.env.ARTIFACTS_VPS_PATH;
 if(!host||!path)throw new Error('Set ARTIFACTS_VPS_HOST and ARTIFACTS_VPS_PATH for this explicit mirror operation');
 if(!/^[a-zA-Z0-9_.@-]+$/u.test(host)||host.startsWith('-')||!/^\/[a-zA-Z0-9_./-]+$/u.test(path)||path==='/'||path.split('/').includes('..'))throw new Error('Invalid mirror host/path');
 if(args.includes('--dry-run')) {console.log(`Verified site; would sync ${site}/ to ${host}:${path}/. No network operation performed.`);}else{
  const child=spawn('rsync',['-avz','--checksum','--delete','--',site+'/',host+':'+path+'/'],{stdio:'inherit'});
  await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('rsync failed '+code)));});
 }
} catch(error){console.error(error.message);process.exitCode=1;}
