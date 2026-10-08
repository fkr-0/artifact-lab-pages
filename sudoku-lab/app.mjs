import {createPuzzle,PEERS,ROW,COL,BOX,candidates,conflictingCells,isSolved,nextHint,chooseReveal} from './engine.mjs';
const $ = id => document.getElementById(id);
const STORE = 'fkr.sudoku.expert.v1';
const params = new URLSearchParams(location.search);
const urlSeed = params.has('seed') && /^\d{1,10}$/.test(params.get('seed')) ? Number(params.get('seed')) : null;
let saved;
try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch {}
const seed = Number.isInteger(urlSeed) && urlSeed >= 0 && urlSeed <= 4294967295 ? urlSeed :
  (Number.isInteger(saved?.seed) ? saved.seed : 1);
let puzzle = createPuzzle(seed);
let entry = Array(81).fill(0), notes = Array(81).fill(0), selected = puzzle.givens.findIndex(n => !n);
let elapsed = 0, mistakes = 0, paused = false, pencil = false, auto = false, completed = false;
let undoStack = [], redoStack = [], highlight = -1;
function validArray(a,max){return Array.isArray(a) && a.length===81 && a.every(n=>Number.isInteger(n)&&n>=0&&n<=max);}
function restore(){
 if(saved?.seed!==puzzle.seed || !validArray(saved.entry,9) || !validArray(saved.notes,511))return;
 if(saved.entry.some((n,i)=>puzzle.givens[i] && n))return;
 entry=saved.entry.slice();notes=saved.notes.slice();
 elapsed=Number.isInteger(saved.elapsed)&&saved.elapsed>=0?Math.min(saved.elapsed,999999):0;
 mistakes=Number.isInteger(saved.mistakes)&&saved.mistakes>=0?Math.min(saved.mistakes,9999):0;
 completed=Boolean(saved.completed)&&board().every((n,i)=>n===puzzle.solution[i]);
 auto=Boolean(saved.auto);pencil=Boolean(saved.pencil);
}
restore();
function board(){return puzzle.givens.map((n,i)=>n||entry[i]);}
function save(){
 try{localStorage.setItem(STORE,JSON.stringify({seed:puzzle.seed,entry,notes,elapsed,mistakes,completed,auto,pencil}));}catch{}
}
function snapshot(){return {entry:entry.slice(),notes:notes.slice(),mistakes,completed};}
function remember(){undoStack.push(snapshot());if(undoStack.length>100)undoStack.shift();redoStack=[];}
function feedback(message){$('message').textContent=message;}
function timeString(seconds){return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
const cells=Array.from({length:81},(_,i)=>{
 const b=document.createElement('button');b.type='button';b.className='cell';b.setAttribute('role','gridcell');
 b.dataset.r=ROW(i);b.dataset.c=COL(i);b.addEventListener('click',()=>{if(paused)return;selected=i;highlight=-1;render();b.focus();});
 $('grid').append(b);return b;
});
for(let n=1;n<=9;n++){const b=document.createElement('button');b.type='button';b.textContent=String(n);b.setAttribute('aria-label','Enter '+n);b.addEventListener('click',()=>put(n));$('keypad').append(b);}
function drawCell(el,i,a,conflicts){
 const n=a[i],given=Boolean(puzzle.givens[i]),related=selected>=0 && (ROW(i)===ROW(selected)||COL(i)===COL(selected)||BOX(i)===BOX(selected));
 el.className='cell';
 if(given)el.classList.add('given');
 if(related)el.classList.add('related');
 if(selected>=0 && a[selected] && n===a[selected])el.classList.add('same');
 if(conflicts.has(i))el.classList.add('bad');
 if(highlight===i)el.classList.add('hint-focus');
 if(selected===i)el.classList.add('selected');
 el.replaceChildren();
 if(n)el.textContent=String(n);
 else{
  const mask=auto?candidates(a,i):notes[i];
  if(mask){const marks=document.createElement('span');marks.className='marks';marks.setAttribute('aria-hidden','true');
   for(let d=1;d<=9;d++){const s=document.createElement('span');s.textContent=mask&(1<<(d-1))?String(d):'';marks.append(s);}el.append(marks);}
 }
 el.setAttribute('aria-label','Row '+(ROW(i)+1)+' column '+(COL(i)+1)+': '+(n?n+(given?' given':' entered'):'empty')+(conflicts.has(i)?', conflict':''));
 el.setAttribute('aria-selected',String(selected===i));
 el.tabIndex=selected===i?0:-1;
}
function render(){
 const a=board(),conflicts=conflictingCells(a);
 cells.forEach((el,i)=>drawCell(el,i,a,conflicts));
 const done=a.filter(Boolean).length;
 $('progress').textContent=done+' / 81';
 $('meter-fill').style.width=(100*done/81)+'%';
 $('clock').textContent=timeString(elapsed);
 $('mistakes').textContent=String(mistakes).padStart(2,'0');
 $('puzzle-id').textContent='SEED '+String(puzzle.seed).padStart(10,'0');
 $('notes').classList.toggle('active',pencil);
 $('notes').setAttribute('aria-pressed',String(pencil));
 $('notes').querySelector('small').textContent=pencil?'ON':'OFF';
 $('auto').checked=auto;
 $('veil').hidden=!paused;
 $('pause').textContent=paused?'▶ Resume':'Ⅱ Pause';
 $('undo').disabled=undoStack.length===0||paused;
 $('redo').disabled=redoStack.length===0||paused;
 $('hint').disabled=paused||completed;
 $('reveal').disabled=paused||completed;
 $('keypad').querySelectorAll('button').forEach(b=>b.disabled=paused||completed);
}
function put(n){
 if(paused||completed||selected<0||puzzle.givens[selected])return;
 if(n<0||n>9)return;
 if(pencil&&n>0){
  remember();notes[selected]^=1<<(n-1);feedback('Candidate '+n+' toggled.');
 }else{
  if(entry[selected]===n && notes[selected]===0)return;
  remember();entry[selected]=n;notes[selected]=0;highlight=-1;
  if(n)for(const peer of PEERS[selected])notes[peer]&=~(1<<(n-1));
  feedback('Keep going. Look for constraints.');
 }
 const a=board();
 if(isSolved(a)){completed=true;feedback('Perfect solution. Expert puzzle complete in '+timeString(elapsed)+'!');$('hint-text').textContent='Well played. You solved this unique expert challenge. Start another or share this seed.';}
 save();render();
}
function historyMove(from,to){
 if(paused||!from.length)return;
 to.push(snapshot());const s=from.pop();entry=s.entry;notes=s.notes;mistakes=s.mistakes;completed=s.completed;highlight=-1;
 feedback('Move restored.');save();render();
}
$('undo').addEventListener('click',()=>historyMove(undoStack,redoStack));
$('redo').addEventListener('click',()=>historyMove(redoStack,undoStack));
$('notes').addEventListener('click',()=>{pencil=!pencil;save();render();});
$('erase').addEventListener('click',()=>put(0));
$('auto').addEventListener('change',e=>{auto=e.target.checked;save();render();});
function togglePause(){if(completed)return;paused=!paused;feedback(paused?'Timer stopped.':'Back in the grid.');render();}
$('pause').addEventListener('click',togglePause);
$('resume').addEventListener('click',togglePause);
function hint(){
 if(paused||completed)return;
 const a=board(),wrong=a.some((n,i)=>n&&n!==puzzle.solution[i]);
 const h=wrong?{kind:'conflict',text:'At least one entry differs from the unique solution. Review your work before using deductions.'}:nextHint(a);
 highlight=h.index??-1;
 $('hint-text').textContent=(h.method?h.method+' — ':'')+h.text+(h.kind==='fill'?' Candidate: '+h.digit+' in row '+(ROW(h.index)+1)+', column '+(COL(h.index)+1)+'.':'');
 feedback(h.kind==='fill'?'A logical clue is highlighted.':'Consult the assistant panel.');
 if(highlight>=0)selected=highlight;
 render();
}
$('hint').addEventListener('click',hint);
$('reveal').addEventListener('click',()=>{
 if(paused||completed)return;
 const a=board();
 if(a.some((n,i)=>n&&n!==puzzle.solution[i])){feedback('Correct the incorrect entries before revealing.');return;}
 const h=chooseReveal(a,puzzle.solution);if(!h)return;
 selected=h.index;pencil=false;put(h.digit);
 $('hint-text').textContent=h.method+' — '+h.text;
 feedback('One correct digit revealed in row '+(ROW(h.index)+1)+', column '+(COL(h.index)+1)+'.');
 render();
});
$('check').addEventListener('click',()=>{
 if(paused)return;
 const a=board(),wrong=a.filter((n,i)=>n&&n!==puzzle.solution[i]).length;
 if(wrong){mistakes++;feedback(wrong+' incorrect '+(wrong===1?'entry':'entries')+' detected. No penalty to edit.');}
 else feedback('All placed digits are correct. Keep solving.');
 save();render();
});
function resetPuzzle(nextSeed){
 puzzle=createPuzzle(nextSeed);entry=Array(81).fill(0);notes=Array(81).fill(0);selected=puzzle.givens.findIndex(n=>!n);
 elapsed=0;mistakes=0;paused=false;pencil=false;auto=false;completed=false;undoStack=[];redoStack=[];highlight=-1;
 $('hint-text').textContent='Need a nudge? Get a logical explanation, or reveal one digit as a last resort.';
 const u=new URL(location.href);u.searchParams.set('seed',String(nextSeed));history.replaceState(null,'',u);
 feedback('New expert challenge ready.');save();render();
}
$('restart').addEventListener('click',()=>{if(confirm('Erase progress and restart this puzzle?'))resetPuzzle(puzzle.seed);});
$('new').addEventListener('click',()=>{if(!confirm('Start a new expert puzzle? Your current progress will be replaced.'))return;const n=new Uint32Array(1);crypto.getRandomValues(n);resetPuzzle(n[0]);});
$('share').addEventListener('click',async()=>{const u=new URL(location.href);u.searchParams.set('seed',String(puzzle.seed));try{await navigator.clipboard.writeText(u.href);feedback('Puzzle link copied.');}catch{feedback('Share this URL: '+u.href);}});
document.addEventListener('keydown',event=>{
 if(event.target.matches('input,textarea,select'))return;
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();historyMove(event.shiftKey?redoStack:undoStack,event.shiftKey?undoStack:redoStack);return;}
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();historyMove(redoStack,undoStack);return;}
 if(paused)return;
 if(/^Digit[1-9]$|^Numpad[1-9]$/.test(event.code)){event.preventDefault();put(Number(event.code.slice(-1)));return;}
 if(event.key==='0'||event.key==='Backspace'||event.key==='Delete'){event.preventDefault();put(0);return;}
 if(event.key.toLowerCase()==='n'){pencil=!pencil;save();render();return;}
 if(event.key.toLowerCase()==='h'){hint();return;}
 const move={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[event.key];
 if(move){event.preventDefault();selected=((ROW(selected)+move[0]+9)%9)*9+(COL(selected)+move[1]+9)%9;highlight=-1;render();cells[selected].focus();}
});
setInterval(()=>{if(!paused&&!completed){elapsed++;save();$('clock').textContent=timeString(elapsed);}},1000);
if(completed)feedback('Puzzle solved. Start a new expert challenge.');
render();
