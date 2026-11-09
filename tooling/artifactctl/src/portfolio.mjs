import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseDocument } from 'yaml';
import { isSafeRelativePath } from './core.mjs';

const SCHEMA = 'artifacts.fkr.dev/inventory-v1';
const slug = /^[a-z0-9][a-z0-9._-]*$/u;
export function parsePortfolio(text) {
  const doc = parseDocument(text, { version:'1.2', uniqueKeys:true });
  if (doc.errors.length || doc.warnings.length) throw new Error('Invalid inventory YAML: ' + [...doc.errors,...doc.warnings].map(x=>x.message).join('; '));
  const value = doc.toJS({ maxAliasCount:0 });
  validatePortfolio(value);
  return value;
}
function relative(value, field) {
  if (!isSafeRelativePath(value)) throw new Error(`${field} must be a contained relative path`);
}
function argv(commands, field) {
  if (!Array.isArray(commands) || commands.some(command => !Array.isArray(command) || !command.length || command.some(x=>typeof x!=='string'||!x||x.includes('\0')))) throw new Error(`${field} requires argv arrays`);
}
export function validatePortfolio(p) {
  if (p?.schemaVersion!==SCHEMA || !Array.isArray(p.artifacts) || !p.recipes || typeof p.recipes!=='object' || Array.isArray(p.recipes)) throw new Error(`Expected ${SCHEMA} with artifacts and recipes`);
  for (const [id,r] of Object.entries(p.recipes)) {
    if (!slug.test(id) || !r || !['local','submodule','git','release'].includes(r.source?.kind)) throw new Error(`Invalid recipe source: ${id}`);
    if (!['copy','build','assemble'].includes(r.prepare)) throw new Error(`Invalid recipe preparation: ${id}`);
    if (r.source.kind==='local'||r.source.kind==='submodule') relative(r.source.path,`${id}: source.path`);
    if (['git','submodule'].includes(r.source.kind)) {
      if (!/^[a-f0-9]{40}$/u.test(r.source.revision||'')) throw new Error(`${id}: source revision must be a full commit`);
      if (typeof r.source.repository!=='string'||!r.source.repository.startsWith('https://')) throw new Error(`${id}: repository must use HTTPS`);
      if (typeof r.source.recursive!=='boolean') throw new Error(`${id}: recursive must be explicit`);
    }
    if (r.source.kind==='release') {
      if (!/^https:\/\//u.test(r.source.url||'') || !/^[a-f0-9]{64}$/u.test(r.source.sha256||'') || !['zip','tar','tar.gz','file'].includes(r.source.format)) throw new Error(`${id}: release requires HTTPS URL, SHA-256 and format`);
      if (r.source.filename!==undefined) relative(r.source.filename,`${id}: source.filename`);
      if (r.prepare!=='copy') throw new Error(`${id}: prebuilt release must use copy`);
    }
    relative(r.output,`${id}: output`);
    if (r.prepare!=='copy' && ['.','.git','node_modules'].includes(r.output)) throw new Error(`${id}: unsafe build output`);
    if (r.cwd!==undefined) relative(r.cwd,`${id}: cwd`);
    for (const field of ['install','commands','checks']) if (r[field]!==undefined) argv(r[field],`${id}: ${field}`);
    if (r.prepare==='copy' && (r.install?.length || r.commands?.length)) throw new Error(`${id}: copy cannot install or build`);
    if (r.prepare!=='copy' && !r.commands?.length) throw new Error(`${id}: ${r.prepare} requires commands`);
    if (r.environment && (Array.isArray(r.environment)||typeof r.environment!=='object'||Object.entries(r.environment).some(([k,v])=>!/^NODE_OPTIONS$/u.test(k)||typeof v!=='string'))) throw new Error(`${id}: unsupported environment override`);
    if (r.dependsOn!==undefined && (!Array.isArray(r.dependsOn)||r.dependsOn.some(x=>!p.recipes[x]))) throw new Error(`${id}: unknown dependency`);
    for (const file of r.expectedFiles||[]) relative(file,`${id}: expectedFiles`);
  }
  const ids=new Set();
  for (const a of p.artifacts) {
    if (!slug.test(a.id||'') || ids.has(a.id)) throw new Error(`Duplicate or invalid artifact ID: ${a.id}`);
    ids.add(a.id);
    if (a.publish==='local' && p.recipes[a.recipe]?.enabled===false) throw new Error(`${a.id}: published recipe is disabled`);
    if (a.recipe && !Object.hasOwn(p.recipes,a.recipe)) throw new Error(`${a.id}: unknown recipe ${a.recipe}`);
    if (!a.recipe && !['catalog','reference'].includes(a.publish)) throw new Error(`${a.id}: publishable artifact requires a recipe`);
    if (a.manifest && a.manifest.id!==a.id) throw new Error(`${a.id}: manifest ID differs`);
    if (a.manifest?.source?.git?.mode==='submodule') {
      const r=p.recipes[a.recipe];
      if (r?.source.kind!=='submodule' || r.source.path!==a.manifest.source.path || r.source.revision!==a.manifest.source.git.revision) throw new Error(`${a.id}: manifest and recipe source pin mismatch`);
    }
  }
  planPortfolio(p);
  return p;
}
export function planPortfolio(p) {
  const active=new Set(), done=new Set(), result=[];
  function visit(id) {
    if(active.has(id)) throw new Error(`Recipe dependency cycle: ${id}`);
    if(done.has(id)) return;
    active.add(id);
    for(const dependency of p.recipes[id].dependsOn||[]) visit(dependency);
    active.delete(id); done.add(id); result.push({id,...p.recipes[id]});
  }
  for(const id of Object.keys(p.recipes)) if(p.recipes[id].enabled!==false) visit(id);
  return result;
}
export async function loadPortfolio(rootDir) {
  return parsePortfolio(await readFile(join(rootDir,'inventory.yml'),'utf8'));
}
export function portfolioManifests(p, {publication=false}={}) {
  return p.artifacts.filter(x=>x.manifest && (!publication || x.publish!=='reference')).map(x=>({...structuredClone(x.manifest),__manifestPath:`inventory.yml#${x.id}`}));
}
export function portfolioBaseline(p, historical) {
  return {...historical,items:p.artifacts.filter(x=>x.compatibility).map(x=>structuredClone(x.compatibility))};
}

export function artifactPreparations(p, prepared) {
  const byRecipe=Object.fromEntries(prepared.map(result=>[result.id,result]));
  return Object.fromEntries(p.artifacts.filter(a=>a.publish==='local'&&byRecipe[a.recipe]).map(a=>[a.id,byRecipe[a.recipe]]));
}
