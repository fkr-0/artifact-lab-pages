// Groove Scratch Studio — offline engine regression tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../groove-scratch-studio/index.html',import.meta.url),'utf8');
const worklet=source.split('<script id="worklet-code" type="text/plain">')[1]?.split('</script>')[0];
const app=source.split('<script>')[1]?.split('</script>')[0];
test('scripts compile and standalone bundle has no remote dependencies',()=>{
 assert.ok(worklet&&app);assert.doesNotThrow(()=>new vm.Script(worklet));assert.doesNotThrow(()=>new vm.Script(app));
 assert.ok(!source.includes('<script src=') && !source.includes('https://cdn.'));
});
test('vinyl scratch, bars, reset, and zoom controls exist',()=>{
 for(const id of ['disc','vinylRing','scratchSensitivity','barLength','barCountRead','resetSampleLength','overview','deckWave','graph'])
   assert.match(source,new RegExp('id="'+id+'"'));
 for(const f of ['vinylDown','vinylMove','vinylUp','drawVinylRing','zoomAt','setEditLength'])
   assert.ok(app.includes('function '+f+'('));
});
test('AudioWorklet scratches across cyclic boundary without changing direction',()=>{
 let Processor;
 class Base {constructor(){this.port={postMessage(){},onmessage:null};}}
 const context=vm.createContext({AudioWorkletProcessor:Base,sampleRate:48000,registerProcessor:(_,ctor)=>Processor=ctor,Math,Float32Array,Array});
 new vm.Script(worklet).runInContext(context);
 const p=new Processor(),pcm=new Float32Array(48000);
 for(let i=0;i<pcm.length;i++)pcm[i]=Math.sin(i*.03)*.3;
 p.message({type:'load',left:pcm,right:pcm});p.message({type:'clip',start:0,end:48000});
 const output=[[new Float32Array(128),new Float32Array(128)]];
 p.message({type:'seek',p:.01});p.message({type:'drag',active:true,p:.99});
 assert.equal(p.process([],output),true);assert.ok(p.lastRate<0);
 p.message({type:'seek',p:.99});p.message({type:'drag',active:true,p:.01});p.process([],output);
 assert.ok(p.lastRate>0);assert.ok(Number.isFinite(output[0][0][0]));
});


test('eight rectangle scratch techniques, fader lane and drawing controls exist',()=>{
 for(const value of ['baby','forward','chirp','stab','flare1','orbit1','flare2','orbit2'])assert.match(source,new RegExp('<option value="'+value+'">'));
 for(const id of ['editTool','patternRepeats','volumeGraph','volumeUnity','volumeCut'])assert.match(source,new RegExp('id="'+id+'"'));
 for(const f of ['generateScratchPattern','spliceTrack','drawPatternPreview','insertScratchPattern','drawVolumeGraph'])assert.ok(app.includes('function '+f+'('));
});
const generator=source.split('// BEGIN SCRATCH PATTERN GENERATOR')[1].split('\n').slice(1).join('\n').split('// END SCRATCH PATTERN GENERATOR')[0];
const make=vm.runInNewContext(generator+'\n(generateScratchPattern)');
test('scratch rectangle defines X/time and Y/source for every technique',()=>{
 for(const kind of ['baby','forward','chirp','stab','flare1','orbit1','flare2','orbit2']){
  const p=make(kind,.5,2.5,.2,.8);
  assert.equal(p.points[0].t,.5);
  assert.equal(p.points.at(-1).t,2.5);
  assert.ok(p.points.every(x=>x.p>=.2-1e-12&&x.p<=.8+1e-12&&x.t>=.5&&x.t<=2.5));
  assert.ok(p.volume.every(x=>x.v>=0&&x.v<=1&&x.t>=.5&&x.t<=2.5));
 }
});
test('flare and orbit generate expected audible segments and fader closures',()=>{
 const closes=kind=>make(kind,0,2,.2,.8).volume.filter((p,i,pts)=>p.v===0&&(i===0||pts[i-1].v!==0)).length;
 assert.equal(closes('baby'),0);assert.equal(closes('chirp'),1);
 assert.equal(closes('flare1'),2);assert.equal(closes('orbit1'),2);
 assert.equal(closes('flare2'),3);assert.equal(closes('orbit2'),4);
 assert.ok(make('orbit2',0,2,.1,.9,4).volume.length>make('orbit2',0,2,.1,.9,1).volume.length);
});
test('AudioWorklet applies 0–100% volume automation at sample rate',()=>{
 let Processor;
 class Base {constructor(){this.port={postMessage(){},onmessage:null};}}
 const ctx=vm.createContext({AudioWorkletProcessor:Base,sampleRate:48000,registerProcessor:(_,C)=>Processor=C,Math,Float32Array,Array});
 new vm.Script(worklet).runInContext(ctx);
 const p=new Processor(),pcm=new Float32Array(48000),out=[[new Float32Array(128),new Float32Array(128)]];
 for(let i=0;i<pcm.length;i++)pcm[i]=.2*Math.sin(i*.04);
 p.message({type:'load',left:pcm,right:pcm});p.message({type:'clip',start:0,end:48000});
 p.message({type:'automation',points:[{t:0,p:0},{t:2,p:1}],volume:[{t:0,v:0},{t:2,v:0}],duration:2,loop:true});
 for(let i=0;i<20;i++)p.process([],out);
 assert.ok(out[0][0].every(x=>x===0));
 p.message({type:'volume',points:[{t:0,v:1},{t:2,v:1}]});let max=0;
 for(let i=0;i<30;i++){p.process([],out);for(const s of out[0][0])max=Math.max(max,Math.abs(s));}
 assert.ok(max>.001);
});


test('pattern splice preserves audio positions outside the rectangle',()=>{
 const code='function interpolateTrack('+source.split('function interpolateTrack(')[1].split('function patternRect(')[0];
 const helper=vm.runInNewContext(code+'\n({spliceTrack,interpolateTrack})',{motionDuration:4});
 const original=[{t:0,p:0},{t:2,p:.5},{t:4,p:1}];
 const newRegion=make('baby',1,3,.3,.6).points;
 const result=helper.spliceTrack(original,newRegion,1,3,'p',0);
 assert.equal(result[0].t,0);assert.equal(result.at(-1).t,4);
 assert.ok(Math.abs(helper.interpolateTrack(result,.5,'p',0)-.125)<.001);
 assert.ok(Math.abs(helper.interpolateTrack(result,3.5,'p',0)-.875)<.001);
});

test('pattern editor auto-fit keeps vinyl traversal below limit and wheel adjusts per-pattern shaping',()=>{
 const pure=source.slice(source.indexOf('// BEGIN SCRATCH PATTERN GENERATOR'),source.indexOf('function graphToPoint('));
 const widgets={};
 const context={
   Math,Number,Array,
   clamp:(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),
   settings:{patternAutoFit:true,patternMaxSpeed:1,patternParameters:{}},
   editTool:'baby',patternRepeats:8,patternDrag:null,motionDuration:3.04,motion:[],
   clip:{start:0,end:1.52},intervalSeconds:()=>1.52,
   $:id=>(widgets[id]??={textContent:'',classList:{toggle(){}}}),
   markSave(){},autoPlaying:false
 };
 const api=vm.runInNewContext(pure+'\n({evaluatePatternRect,generateScratchPattern,positionSpeed,adjustPatternWheel,getPatternParameters})',context);
 const rect={t0:0,t1:3.04,lo:.18,hi:.86};
 const raw=api.positionSpeed(api.generateScratchPattern('baby',0,3.04,.18,.86,8).points,1.52);
 assert.ok(raw.peak>4,'original parameters must reproduce too-fast baby scratches');
 const fitted=api.evaluatePatternRect(rect);
 assert.ok(fitted.scale<.3,'auto-fit shortens source travel');
 assert.ok(fitted.actual.peak<=1.00001,'auto-fit meets selected maximum');
 assert.equal(fitted.blocked,false);
 api.adjustPatternWheel({deltaY:-80,altKey:false,shiftKey:false});
 assert.ok(api.getPatternParameters().sharpness>1,'plain wheel raises flank steepness');
 api.adjustPatternWheel({deltaY:-80,altKey:true,shiftKey:false});
 assert.ok(api.getPatternParameters().bias>.5,'alt+wheel changes forward/reverse bias');
 api.adjustPatternWheel({deltaY:-80,altKey:false,shiftKey:true});
 assert.ok(api.getPatternParameters().cutWidth>1,'shift+wheel changes click width');
 const shaped=api.evaluatePatternRect(rect);
 assert.ok(shaped.actual.peak<=1.00001);
 assert.ok(shaped.pattern.points.length>fitted.pattern.points.length,'sharper flank adds plateau/ramp vertices');
 context.settings.patternAutoFit=false;
 const unfit=api.evaluatePatternRect(rect);
 assert.ok(unfit.actual.peak>4,'disabling auto-fit allows deliberate high-speed gestures');
});
