// Killer Sudoku Lab: pure, offline rules, puzzle data, and bounded solver.
// Each cage is orthogonally connected, covers cells exactly once, has a sum
// in its top-left cell, and forbids repeated digits.
export const ROW = i => Math.floor(i / 9);
export const COL = i => i % 9;
export const BOX = i => Math.floor(ROW(i) / 3) * 3 + Math.floor(COL(i) / 3);
export const UNITS = [
 ...Array.from({length:9},(_,r)=>Array.from({length:9},(_,c)=>9*r+c)),
 ...Array.from({length:9},(_,c)=>Array.from({length:9},(_,r)=>9*r+c)),
 ...Array.from({length:9},(_,b)=>Array.from({length:9},(_,j)=>(Math.floor(b/3)*3+Math.floor(j/3))*9+(b%3)*3+j%3))
];
export const PEERS = Array.from({length:81},(_,i)=>[...new Set(UNITS.filter(u=>u.includes(i)).flat().filter(j=>j!==i))]);
export const SOLUTION = [...'162857493534129678789643521475312986913586742628794135356478219241935867897261354'].map(Number);
export const ALL = 511;
const digits = mask => Array.from({length:9},(_,i)=>i+1).filter(n=>mask&(1<<(n-1)));
const POP = Array.from({length:512},(_,i)=>{let n=i,v=0;while(n){n&=n-1;v++;}return v;});
const COMBOS = Array.from({length:10},()=>Array.from({length:46},()=>[]));
for(let mask=1;mask<512;mask++){const d=digits(mask),sum=d.reduce((a,b)=>a+b,0);COMBOS[d.length][sum].push(mask);}
export function cageMap(cages){
 const byCell=Array(81).fill(-1);
 for(let k=0;k<cages.length;k++)for(const i of cages[k].cells){if(byCell[i]!==-1)throw Error('Overlapping cage cell '+i);byCell[i]=k;}
 if(byCell.some(k=>k<0))throw Error('Cages do not cover the board');
 return byCell;
}
export function validateCages(cages,solution=SOLUTION){
 if(!Array.isArray(cages)||!cages.length||solution.length!==81||!isClassicSolved(solution))return false;
 try{
  const byCell=cageMap(cages);
  return cages.every((c,k)=>{
   if(!Array.isArray(c.cells)||!c.cells.length||c.cells.length>9||!Number.isInteger(c.sum))return false;
   const members=new Set(c.cells);
   if(members.size!==c.cells.length||[...members].some(i=>!Number.isInteger(i)||i<0||i>80))return false;
   const reached=new Set([c.cells[0]]),open=[c.cells[0]];
   while(open.length){const i=open.pop();for(const j of adjacent(i))if(members.has(j)&&!reached.has(j)){reached.add(j);open.push(j);}}
   const ds=c.cells.map(i=>solution[i]);
   return reached.size===c.cells.length &&
    new Set(ds).size===ds.length && ds.reduce((a,b)=>a+b,0)===c.sum &&
    c.cells.every(i=>byCell[i]===k);
  });
 }catch{return false;}
}
export function adjacent(i){
 const r=ROW(i),c=COL(i);
 return [r>0?i-9:-1,r<8?i+9:-1,c>0?i-1:-1,c<8?i+1:-1].filter(n=>n>=0);
}
export function isClassicSolved(a){return a.length===81&&a.every(n=>Number.isInteger(n)&&n>=1&&n<=9)&&UNITS.every(u=>new Set(u.map(i=>a[i])).size===9);}
export function isConsistent(a,cages,byCell=cageMap(cages)){
 if(a.length!==81||a.some(n=>!Number.isInteger(n)||n<0||n>9))return false;
 if(!UNITS.every(u=>{const n=u.map(i=>a[i]).filter(Boolean);return n.length===new Set(n).size;}))return false;
 return cages.every(c=>{
  const used=c.cells.map(i=>a[i]).filter(Boolean),mask=used.reduce((m,n)=>m|1<<(n-1),0);
  return used.length===POP[mask] && COMBOS[c.cells.length][c.sum].some(combo=>(combo&mask)===mask);
 });
}
export function candidates(a,i,cages,byCell=cageMap(cages)){
 if(a[i])return 0;
 const c=cages[byCell[i]],used=c.cells.reduce((m,j)=>m|(a[j]?1<<(a[j]-1):0),0);
 const available=COMBOS[c.cells.length][c.sum].reduce((m,combo)=>m|((combo&used)===used?combo&~used:0),0);
 const forbidden=PEERS[i].reduce((m,j)=>m|(a[j]?1<<(a[j]-1):0),used);
 return available&~forbidden;
}
export function conflictingCells(a,cages,byCell=cageMap(cages)){
 const bad=new Set();
 for(const u of UNITS){const seen=new Map();for(const i of u){const n=a[i];if(!n)continue;if(seen.has(n)){bad.add(i);bad.add(seen.get(n));}else seen.set(n,i);}}
 for(const c of cages){
  const used=new Map(),mask=c.cells.reduce((m,i)=>m|(a[i]?1<<(a[i]-1):0),0);
  for(const i of c.cells)if(a[i]){if(used.has(a[i])){bad.add(i);bad.add(used.get(a[i]));}else used.set(a[i],i);}
  if(!COMBOS[c.cells.length][c.sum].some(combo=>(combo&mask)===mask))for(const i of c.cells)if(a[i])bad.add(i);
 }
 return bad;
}
export const isSolved=(a,cages,byCell=cageMap(cages))=>isClassicSolved(a)&&isConsistent(a,cages,byCell);
export function solve(initial,cages,limit=2,{nodeLimit=1500000}={}){
 const byCell=cageMap(cages),solutions=[],a=initial.slice();let nodes=0;
 if(!isConsistent(a,cages,byCell))return solutions;
 const descend=()=>{
  if(++nodes>nodeLimit)throw Error('Solver node limit reached');
  // Naked singles and hidden singles in every Sudoku row, column and box.
  // Restore all propagated assignments on backtrack.
  const changes=[];
  const assign=(i,n)=>{a[i]=n;changes.push(i);};
  try{
   for(let loop=0;loop<81;loop++){
    let changed=false;
    for(let i=0;i<81;i++)if(!a[i]){
     const mask=candidates(a,i,cages,byCell),count=POP[mask];
     if(!count)return;
     if(count===1){assign(i,digits(mask)[0]);changed=true;}
    }
    if(changed)continue;
    for(const u of UNITS){
     let present=u.reduce((m,i)=>m|(a[i]?1<<(a[i]-1):0),0);
     for(let n=1;n<=9;n++)if(!(present&(1<<(n-1)))){
      let match=-1,count=0;
      for(const i of u)if(!a[i]&&(candidates(a,i,cages,byCell)&(1<<(n-1)))){match=i;count++;if(count>1)break;}
      if(!count)return;
      if(count===1){assign(match,n);changed=true;break;}
     }
     if(changed)break;
    }
    if(!changed)break;
   }
   if(!isConsistent(a,cages,byCell))return;
   let choice=-1,mask=0,size=10;
   for(let i=0;i<81;i++)if(!a[i]){
    const m=candidates(a,i,cages,byCell),n=POP[m];if(!n)return;
    if(n<size){choice=i;mask=m;size=n;}
   }
   if(choice<0){solutions.push(a.slice());return;}
   for(const n of digits(mask)){assign(choice,n);descend();a[changes.pop()]=0;if(solutions.length>=limit)return;}
  }finally{for(const i of changes)a[i]=0;}
 };
 descend();return solutions;
}
export const countSolutions=(board,cages,limit=2,options)=>solve(board,cages,limit,options).length;
export function nextHint(a,cages,byCell=cageMap(cages)){
 if(!isConsistent(a,cages,byCell))return {kind:'conflict',text:'A row, column, box or cage conflicts with the rules. Review your entries.'};
 for(const c of cages){
  const empty=c.cells.filter(i=>!a[i]);
  if(empty.length===1)return {kind:'fill',index:empty[0],digit:c.sum-c.cells.reduce((s,i)=>s+a[i],0),method:'Cage remainder',text:'Subtract the filled digits from this cage\'s target sum.'};
 }
 for(let i=0;i<81;i++)if(!a[i]){
  const d=digits(candidates(a,i,cages,byCell));
  if(!d.length)return {kind:'conflict',text:'A cell has no candidates. Recheck earlier entries.'};
  if(d.length===1)return {kind:'fill',index:i,digit:d[0],method:'Single candidate',text:'The Sudoku and cage constraints leave just one digit.'};
 }
 for(const u of UNITS)for(let n=1;n<=9;n++){
  if(u.some(i=>a[i]===n))continue;
  const spots=u.filter(i=>!a[i]&&(candidates(a,i,cages,byCell)&1<<(n-1)));
  if(spots.length===1)return {kind:'fill',index:spots[0],digit:n,method:'Hidden single',text:'Only one square in this unit permits the digit.'};
 }
 return {kind:'advanced',method:'Cage combinations',text:'Compare possible digit combinations for nearby cages; then remove candidates that conflict with rows, columns and boxes.'};
}
export function chooseReveal(a,solution,cages,byCell=cageMap(cages)){
 let best=-1,bestSize=10;
 for(let i=0;i<81;i++)if(!a[i]){const n=POP[candidates(a,i,cages,byCell)];if(n<bestSize){best=i;bestSize=n;}}
 return best<0?null:{index:best,digit:solution[best],method:'Solution reveal',text:'One confirmed digit from the unique solution, not a logical step.'};
}
function seeded(seed){let x=(seed>>>0)||0x9e3779b9;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function mixSeed(seed){let z=(seed+0x9e3779b9)>>>0;z=Math.imul(z^(z>>>16),0x85ebca6b);z=Math.imul(z^(z>>>13),0xc2b2ae35);return(z^(z>>>16))>>>0;}
function shuffle(a,r){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
// Target sum labels are positioned in the uppermost then leftmost cell.
export const cageAnchor=c=>Math.min(...c.cells);
export function randomCages(solution,seed,{maxSize=4,targetSize=3}={}){
 const rand=seeded(seed),remaining=new Set(Array.from({length:81},(_,i)=>i)),cages=[];
 while(remaining.size){
  const start=shuffle([...remaining],rand)[0],cells=[start],used=new Set([solution[start]]);
  remaining.delete(start);
  const desired=Math.max(1,Math.min(maxSize,Math.floor(rand()*3)+targetSize-1));
  while(cells.length<desired){
   const front=shuffle([...new Set(cells.flatMap(adjacent).filter(i=>remaining.has(i)&&!used.has(solution[i])))],rand);
   if(!front.length)break;
   const j=front[0];remaining.delete(j);used.add(solution[j]);cells.push(j);
  }
  cages.push({cells:cells.sort((a,b)=>a-b),sum:cells.reduce((s,i)=>s+solution[i],0)});
 }
 return cages;
}
// Offline-qualified cage templates are populated below. They are not generated
// by user inputs; each template has been exhaustively tested for uniqueness.
export const TEMPLATE_SEEDS = Object.freeze([14,28,33,61,75,77,91,119,143,153,157,184,197,17,49,103]);
export const TEMPLATES = TEMPLATE_SEEDS.map(seed => randomCages(SOLUTION,seed).map(c=>c.cells));
// Reflections and rotations preserve cage connectedness, Sudoku constraints,
// cage sums, and uniqueness. Digit complement (10−n) also preserves all rules.
function transformIndex(i,flip,rotate){
 let r=ROW(i),c=COL(i);if(flip)c=8-c;
 for(let k=0;k<rotate;k++){[r,c]=[c,8-r];}
 return r*9+c;
}
export function createPuzzle(seed=1){
 if(typeof seed!=='number'&&typeof seed!=='string')throw Error('Invalid puzzle seed');
 if(!Number.isSafeInteger(Number(seed))||Number(seed)<0||Number(seed)>4294967295)throw Error('Invalid puzzle seed');
 if(!TEMPLATES.length)throw Error('No qualified Killer Sudoku template');
 const n=Number(seed),r=seeded(mixSeed(n)),template=TEMPLATES[Math.floor(r()*TEMPLATES.length)],flip=r()<.5,rotate=Math.floor(r()*4),complement=r()<.5;
 const solution=Array(81);
 for(let i=0;i<81;i++)solution[transformIndex(i,flip,rotate)]=complement?10-SOLUTION[i]:SOLUTION[i];
 const cages=template.map(c=>{const cells=c.map(i=>transformIndex(i,flip,rotate)).sort((a,b)=>a-b);return {cells,sum:cells.reduce((s,i)=>s+solution[i],0)};});
 if(!validateCages(cages,solution))throw Error('Invalid qualified cage template');
 return {seed:n,solution,cages,givens:Array(81).fill(0),cageOf:cageMap(cages),clueCount:0};
}
