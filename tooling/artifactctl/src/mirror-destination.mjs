import {posix} from 'node:path';
export function mirrorDestination(host,path) {
 if(!/^[a-zA-Z0-9_.@-]+$/u.test(host||'')||host.startsWith('-')||!/^\/[a-zA-Z0-9_./-]+$/u.test(path||'')||path.split('/').includes('..'))throw new Error('Invalid mirror host/path');
 const normalized=posix.normalize(path).replace(/\/$/u,'');
 if(!normalized||normalized==='/')throw new Error('Refusing remote filesystem root');
 return `${host}:${normalized}/`;
}
