// Sudoku Lab pure engine (offline and deterministic).
export const MASTER = '100007090030020008009600500005300900010080002600004000300000010040000007007000300';
export const ROW = i => Math.floor(i / 9);
export const COL = i => i % 9;
export const BOX = i => Math.floor(ROW(i)/3)*3 + Math.floor(COL(i)/3);
export const UNITS = [
  ...Array.from({length:9},(_,r)=>Array.from({length:9},(_,c)=>9*r+c)),
  ...Array.from({length:9},(_,c)=>Array.from({length:9},(_,r)=>9*r+c)),
  ...Array.from({length:9},(_,b)=>Array.from({length:9},(_,i)=>(Math.floor(b/3)*3+Math.floor(i/3))*9+b%3*3+i%3))
];
export const PEERS = Array.from({length:81},(_,i)=>[...new Set(UNITS.filter(u=>u.includes(i)).flat().filter(j=>j!==i))]);
export const parseBoard = s => {if(!/^[0-9.]{81}$/.test(s))throw Error('Invalid board');return [...s].map(x=>x==='.'?0:+x);};
export const isConsistent = a => a.length===81 && a.every(n=>Number.isInteger(n)&&n>=0&&n<=9) && UNITS.every(u=>{const n=u.map(i=>a[i]).filter(Boolean);return n.length===new Set(n).size;});
export const candidates = (a,i) => a[i]?0:511 & ~PEERS[i].reduce((m,j)=>m|(a[j]?1<<(a[j]-1):0),0);
export const isSolved = a => a.length===81 && a.every(Boolean) && isConsistent(a);
export function conflictingCells(a){const bad=new Set();for(const u of UNITS){const seen=new Map();for(const i of u){const v=a[i];if(!v)continue;if(seen.has(v)){bad.add(i);bad.add(seen.get(v));}else seen.set(v,i);}}return bad;}
const values = mask => Array.from({length:9},(_,i)=>i+1).filter(n=>mask&(1<<(n-1)));
export function solve(a,limit=1){
 if(!isConsistent(a))return [];
 const work=a.slice(),results=[];
 function search(){
  if(results.length>=limit)return;
  let choice=-1,mask=0,size=10;
  for(let i=0;i<81;i++){if(work[i])continue;const m=candidates(work,i),n=values(m).length;if(!n)return;if(n<size){choice=i;mask=m;size=n;if(n===1)break;}}
  if(choice<0){results.push(work.slice());return;}
  for(const n of values(mask)){work[choice]=n;search();work[choice]=0;if(results.length>=limit)return;}
 }
 search();return results;
}
export function nextHint(a){
 if(!isConsistent(a))return {kind:'conflict',text:'Resolve duplicate digits first.'};
 for(let i=0;i<81;i++)if(!a[i]&&!candidates(a,i))return {kind:'conflict',index:i,text:'A square has no candidates. Recheck previous entries.'};
 for(let i=0;i<81;i++){if(a[i])continue;const v=values(candidates(a,i));if(v.length===1)return {kind:'fill',index:i,digit:v[0],method:'Naked single',text:'The row, column and box rule out all other digits.'};}
 for(let k=0;k<UNITS.length;k++)for(let digit=1;digit<=9;digit++){
  const u=UNITS[k];if(u.some(i=>a[i]===digit))continue;
  const p=u.filter(i=>!a[i]&&(candidates(a,i)&(1<<(digit-1))));
  if(p.length===1)return {kind:'fill',index:p[0],digit,method:'Hidden single',text:'Only one cell in this unit permits that digit.'};
 }
 return {kind:'advanced',method:'Expert deduction',text:'Try pairs, locked candidates or chains. Reveal offers one confirmed digit.'};
}
export const countSolutions = (a,limit=2) => solve(a,limit).length;
export function chooseReveal(a,solution){
 let index=-1,size=10;
 for(let i=0;i<81;i++){if(a[i])continue;const n=values(candidates(a,i)).length;if(n<size){size=n;index=i;}}
 return index<0?null:{kind:'fill',index,digit:solution[index],method:'Solution reveal',text:'Confirmed by the unique solution; not a one-step deduction.'};
}
const master=parseBoard(MASTER),mastered=solve(master,2);
if(mastered.length!==1)throw Error('Master must have one solution');
function seeded(seed){let x=(seed>>>0)||0x9e3779b9;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function shuffle(a,r){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function permutation(r){return shuffle([0,1,2],r).flatMap(g=>shuffle([0,1,2],r).map(i=>g*3+i));}
// Digit, band, stack, and transpose symmetries preserve uniqueness and the expert challenge.
export function createPuzzle(seed=1){
 if(!Number.isSafeInteger(+seed)||+seed<0||+seed>4294967295)throw Error('Invalid puzzle seed');
 const r=seeded(+seed),rows=permutation(r),cols=permutation(r),digits=shuffle([1,2,3,4,5,6,7,8,9],r),transpose=r()<.5;
 const transform=a=>Array.from({length:81},(_,i)=>{const x=rows[ROW(i)],y=cols[COL(i)],n=a[transpose?y*9+x:x*9+y];return n?digits[n-1]:0;});
 const givens=transform(master),solution=transform(mastered[0]);
 return {seed:+seed,givens,solution,clueCount:givens.filter(Boolean).length};
}
