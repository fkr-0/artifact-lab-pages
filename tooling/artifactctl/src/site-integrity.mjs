import {createHash} from 'node:crypto';
import {lstat,readFile,readdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {isSafeRelativePath} from './core.mjs';
export const SITE_RECEIPT='SITE_RECEIPT.json';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function siteFiles(root,current='') {
 const result=[];
 for(const entry of await readdir(join(root,current),{withFileTypes:true})) {
  const path=current?current+'/'+entry.name:entry.name;
  if(entry.isSymbolicLink())throw new Error('Symlink in site: '+path);
  if(entry.isDirectory())result.push(...await siteFiles(root,path));
  else if(entry.isFile())result.push(path);
  else throw new Error('Non-regular site entry: '+path);
 }
 return result.sort();
}
export async function sealSite(root,metadata) {
 const files=[];
 for(const path of await siteFiles(root)) {
  if(path===SITE_RECEIPT)continue;
  const bytes=await readFile(join(root,path));files.push({path,bytes:bytes.length,sha256:sha256(bytes)});
 }
 const receipt={schemaVersion:'artifacts.fkr.dev/site-package-v1',...metadata,files};
 await writeFile(join(root,SITE_RECEIPT),JSON.stringify(receipt,null,2)+'\n');
 return verifySite(root,{commit:metadata.commit});
}
export async function verifySite(root,{commit}={}) {
 const receipt=JSON.parse(await readFile(join(root,SITE_RECEIPT),'utf8'));
 if(receipt.schemaVersion!=='artifacts.fkr.dev/site-package-v1'||!/^[a-f0-9]{40}$/u.test(receipt.commit||'')||!/^[a-f0-9]{64}$/u.test(receipt.inventorySha256||'')||!Array.isArray(receipt.files))throw new Error('Invalid site receipt');
 if(commit&&receipt.commit!==commit)throw new Error('Site commit differs from expected commit');
 const expected=receipt.files.map(x=>x.path).sort();
 if(new Set(expected).size!==expected.length||expected.includes(SITE_RECEIPT)||expected.some(x=>!isSafeRelativePath(x)))throw new Error('Invalid site receipt file inventory');
 const actual=(await siteFiles(root)).filter(x=>x!==SITE_RECEIPT);
 if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error('Site file inventory mismatch (extra or missing files)');
 for(const file of receipt.files){const bytes=await readFile(join(root,file.path));if(bytes.length!==file.bytes||sha256(bytes)!==file.sha256)throw new Error('Site integrity hash mismatch: '+file.path);}
 return receipt;
}
