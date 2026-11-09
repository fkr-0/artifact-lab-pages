#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';
import {createGzip} from 'node:zlib';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifySite} from '../tooling/artifactctl/src/site-integrity.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const site=join(process.env.ARTIFACTS_DIR||root,'dist/site');
try {
 const receipt=await verifySite(site);
 const outputDir=resolve(process.argv[2]||join(root,'dist/packages'));await mkdir(outputDir,{recursive:true});
 const path=join(outputDir,`artifacts-site-${receipt.commit}.tar.gz`);
 const tar=spawn('tar',['--sort=name','--owner=0','--group=0','--numeric-owner','--mtime=@0','-cf','-','-C',site,'.'],{stdio:['ignore','pipe','inherit']});
 const exit=new Promise((resolve,reject)=>{tar.on('error',reject);tar.on('exit',code=>code===0?resolve():reject(new Error('tar failed '+code)));});
 await Promise.all([pipeline(tar.stdout,createGzip(),createWriteStream(path)),exit]);
 const digest=createHash('sha256').update(await readFile(path)).digest('hex');
 await writeFile(path+'.sha256',digest+'  '+path.split('/').pop()+'\n');
 console.log(`Package: ${path}\nSHA256: ${digest}`);
} catch(error){console.error(error.message);process.exitCode=1;}
