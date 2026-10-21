import test from 'node:test';
import assert from 'node:assert/strict';
import {MASTER,UNITS,PEERS,parseBoard,isConsistent,isSolved,candidates,countSolutions,createPuzzle,conflictingCells,nextHint,solve,chooseReveal} from '../sudoku-lab/engine.mjs';

test('master puzzle is an expert challenge with exactly one solution',()=>{
 const m=parseBoard(MASTER);
 assert.equal(m.filter(Boolean).length,23);
 assert.equal(countSolutions(m),1);
 assert.ok(isSolved(solve(m)[0]));
});

test('150 seeded expert transformations preserve every constraint and unique solution',()=>{
 const fingerprints=new Set();
 for(let seed=0;seed<150;seed++){
  const p=createPuzzle(seed),start=p.givens.slice();
  assert.equal(p.clueCount,23);
  assert.ok(isConsistent(start));
  assert.ok(isSolved(p.solution));
  assert.equal(countSolutions(start),1,'seed '+seed);
  assert.deepEqual(solve(start)[0],p.solution);
  assert.ok(start.every((n,i)=>!n||n===p.solution[i]));
  assert.deepEqual(start,p.givens,'solver cannot mutate puzzle');
  fingerprints.add(start.join(''));
 }
 assert.equal(fingerprints.size,150);
});

test('candidate masks and duplicate detection observe all 27 units',()=>{
 assert.equal(UNITS.length,27);
 assert.equal(PEERS[0].length,20);
 const board=Array(81).fill(0);board[0]=3;board[8]=3;
 assert.deepEqual([...conflictingCells(board)].sort((a,b)=>a-b),[0,8]);
 assert.equal(isConsistent(board),false);
 assert.equal(countSolutions(board),0);
 board[8]=0;
 assert.equal(candidates(board,1)&(1<<2),0);
});

test('hint and reveal do not invent a logical proof',()=>{
 const p=createPuzzle(42);
 const step=nextHint(p.givens);
 assert.ok(['fill','advanced'].includes(step.kind));
 const h=chooseReveal(p.givens,p.solution);
 assert.ok(h && !p.givens[h.index]);
 assert.equal(h.digit,p.solution[h.index]);
 assert.match(h.method,/reveal/i);
});

test('reject invalid boards/seeds and incomplete solved states',()=>{
 assert.throws(()=>parseBoard('0'.repeat(80)));
 assert.throws(()=>createPuzzle(-1));
 assert.throws(()=>createPuzzle(2**32));
 assert.equal(isSolved(Array(81).fill(0)),false);
});
