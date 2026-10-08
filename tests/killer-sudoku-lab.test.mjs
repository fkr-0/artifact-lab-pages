import test from 'node:test';
import assert from 'node:assert/strict';
import {
 SOLUTION,TEMPLATES,TEMPLATE_SEEDS,ROW,COL,BOX,cageAnchor,validateCages,cageMap,
 createPuzzle,conflictingCells,isConsistent,isSolved,candidates,solve,countSolutions,
 nextHint,chooseReveal
} from '../killer-sudoku-lab/engine.mjs';

test('all base cage layouts are connected, non-overlapping and uniquely solvable with zero givens',()=>{
 assert.equal(TEMPLATES.length,16);
 assert.equal(TEMPLATES.length,TEMPLATE_SEEDS.length);
 for(let k=0;k<TEMPLATES.length;k++){
  const cages=TEMPLATES[k].map(cells=>({cells,sum:cells.reduce((s,i)=>s+SOLUTION[i],0)}));
  assert.ok(validateCages(cages), 'invalid base template '+TEMPLATE_SEEDS[k]);
  assert.ok(cages.filter(c=>c.cells.length===1).length<=5,'too many singleton cages');
  assert.equal(countSolutions(Array(81).fill(0),cages),1,'ambiguous cage template '+TEMPLATE_SEEDS[k]);
  assert.deepEqual(solve(Array(81).fill(0),cages,1)[0],SOLUTION);
 }
});

test('seeded puzzle transformations preserve cage positions and a unique solution',()=>{
 const variants=new Set();
 for(let seed=0;seed<64;seed++){
  const p=createPuzzle(seed),q=createPuzzle(seed);
  assert.deepEqual(p,q);
  assert.ok(validateCages(p.cages,p.solution));
  assert.equal(p.givens.filter(Boolean).length,0);
  assert.ok(isSolved(p.solution,p.cages,p.cageOf));
  assert.equal(countSolutions(p.givens,p.cages),1,'seed '+seed);
  assert.deepEqual(solve(p.givens,p.cages,1)[0],p.solution);
  variants.add(p.cages.map(c=>c.cells.join(',')+':'+c.sum).join('|'));
  for(let i=0;i<81;i++){
   const c=p.cages[p.cageOf[i]];
   assert.ok(c.cells.includes(i));
   assert.ok(cageAnchor(c)<=i);
  }
 }
 assert.ok(variants.size>=20,'seeds must vary challenge layouts');
});

test('cage arithmetic and repetition are enforced independently of sudoku rows',()=>{
 const p=createPuzzle(28),c=p.cages.find(c=>c.cells.length>1),a=Array(81).fill(0);
 const [i,j]=c.cells;
 a[i]=5;a[j]=5;
 assert.equal(isConsistent(a,p.cages,p.cageOf),false);
 assert.ok(conflictingCells(a,p.cages,p.cageOf).has(i));
 a[j]=0;
 const mask=candidates(a,j,p.cages,p.cageOf);
 assert.equal(mask&(1<<(5-1)),0,'cannot repeat a digit in the cage');
 const bad=Array(81).fill(0);
 const tiny=p.cages.find(c=>c.cells.length===1);
 if(tiny){
  bad[tiny.cells[0]]=tiny.sum===9?1:9;
  assert.equal(isConsistent(bad,p.cages,p.cageOf),false,'singleton sum violated');
 }
});

test('hints and reveals are valid and do not present a reveal as a logical proof',()=>{
 const p=createPuzzle(143),a=p.givens.slice(),h=nextHint(a,p.cages,p.cageOf);
 assert.ok(['fill','advanced'].includes(h.kind));
 if(h.kind==='fill')assert.equal(h.digit,p.solution[h.index]);
 const r=chooseReveal(a,p.solution,p.cages,p.cageOf);
 assert.equal(r.digit,p.solution[r.index]);
 assert.match(r.method,/reveal/i);
});

test('rejects invalid boards, seeds and overlapping cages',()=>{
 assert.throws(()=>createPuzzle(-1));
 assert.throws(()=>createPuzzle(2**32));
 assert.throws(()=>createPuzzle(NaN));
 assert.throws(()=>createPuzzle(null));
 assert.ok(!isSolved(Array(81).fill(0),createPuzzle(1).cages));
 assert.throws(()=>cageMap([{cells:[0],sum:1},{cells:[0],sum:1}]));
 const p=createPuzzle(1);
 assert.equal(validateCages(p.cages.map((c,i)=>i?c:{...c,sum:c.sum+1}),p.solution),false);
});
