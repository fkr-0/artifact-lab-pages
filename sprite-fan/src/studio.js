
(function(){
'use strict';

// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
const DEFAULT_LAYOUT=Object.freeze({leftWidth:272,rightWidth:256,timelineHeight:80});
const S = {
  wf: 'import',
  zoom:1, panX:0, panY:0,
  isPanning:false, panStartX:0, panStartY:0, panStartPanX:0, panStartPanY:0,
  resizeDrag: null,
  layout: {...DEFAULT_LAYOUT},
  anchorMode: false,
  draggingAnchor: false,
  frameDrag: null,

  sourceImg: null,
  originalImageData: null,
  sheetImageData: null,
  currentImageData: null,
  whiteImg: null, blackImg: null, dualMode: false,

  // Grid slicing
  frameW: 48, frameH: 48, gridOx: 0, gridOy: 0,
  gridDrag: null,
  cellOverrides: {},

  // Frames - sliced from the grid
  frames: [],        // [{imgData, anchor:{x,y}, offsetX, offsetY}]
  selectedFrame: -1,

  // Anchor
  anchor: {x:24, y:44},
  showOnionSkin: true,
  onionOpacity: 0.3,

  // Island detection
  detectedGroups: [],

  // Timeline playback
  playing: false, playInterval: null, playFps: 12, previewFrames: [], previewCursor: 0,

  // Undo
  undoStack: [], redoStack: [], maxUndo: 40,

  // Repack
  repackCols: 8, repackPad: 0,

  // Review viewport
  autoFitFrames: true,
  maxAutoFitZoom: 4,
  previewImageData: null,
  previewMode: 'current',
  showAnchorOverlay: true,
  reviewFitReady: false,
  viewInitialized: false,
  viewMode: 'source',
  viewStates: {source:null, frame:null},
  pendingFrameMeta: [],
  batchHistory: [],
  specGuide: {prompt:'', items:[], checkedAt:null},
  reviewIssues: [],
  activeTool: 'idle',
  spacePanKey: false,
  frameDragIndex: null,
  alphaCleanupBaseImageData: null,

  // Batch queue
  batchQueue: [],        // [{name, file, blob?, frameW, frameH, anchor, status}]
  batchIndex: -1,
  batchManifest: null,   // parsed sprites.json manifest
  batchAutoDetect: true,
};

// ════════════════════════════════════════════
// DOM
// ════════════════════════════════════════════
const $=id=>document.getElementById(id);
const mainCanvas=$('main-canvas'), overlayCanvas=$('overlay-canvas'), onionCanvas=$('onion-canvas');
const ctx=mainCanvas.getContext('2d',{willReadFrequently:true});
const ovCtx=overlayCanvas.getContext('2d');
const onCtx=onionCanvas.getContext('2d');
const previewCanvas=$('preview-canvas');
const prevCtx=previewCanvas.getContext('2d');
const container=$('canvas-container');
const srcCanvas=document.createElement('canvas');
const srcCtx=srcCanvas.getContext('2d',{willReadFrequently:true});

// ════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════
function toast(msg,type='info'){const el=document.createElement('div');el.className='toast'+(type!=='info'?' '+type:'');el.textContent=msg;$('toast-container').appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),300)},2800)}
function setStatus(msg){$('status-msg').textContent=msg}
function setActiveTool(tool){S.activeTool=tool;const el=$('info-tool');if(el)el.textContent='tool: '+tool}
function workflowModel(){
  const hasImage=!!(S.sheetImageData||S.currentImageData);
  const hasFrames=S.frames.length>0;
  const cleaned=hasImage&&S.originalImageData&&S.sheetImageData&&hashImageData(S.originalImageData)!==hashImageData(S.sheetImageData);
  const issues=hasFrames?buildReviewReport().totals.issueFrames:0;
  const exported=hasFrames&&($('manifest-name')?.value||'').trim().length>0;
  return{
    hasImage,cleaned,hasFrames,issues,exported,
    steps:[
      {wf:'import',label:'Image',done:hasImage,active:!hasImage},
      {wf:'cleanup',label:'Alpha',done:cleaned,active:hasImage&&!cleaned&&!hasFrames},
      {wf:'import',label:'Slice',done:hasFrames,active:hasImage&&!hasFrames},
      {wf:'repair',label:'Review',done:hasFrames&&issues===0,active:hasFrames&&issues>0,blocked:!hasFrames},
      {wf:'export',label:'Export',done:false,active:hasFrames&&issues===0,blocked:!hasFrames},
    ]
  };
}
function setQuickButton(btn,label,handler,disabled=false,kind='primary'){
  if(!btn)return;
  btn.textContent=label;btn.disabled=!!disabled;
  btn.classList.toggle('btn-primary',kind==='primary');
  btn.classList.toggle('btn-ghost',kind!=='primary');
  btn.onclick=handler||null;
}
function refreshWorkflowProgress(model=workflowModel()){
  const box=$('workflow-progress');if(!box)return;
  box.textContent='';
  model.steps.forEach((step,i)=>{
    const chip=document.createElement('button');
    chip.type='button';
    chip.className='workflow-chip'+(step.done?' done':'')+(step.active?' active':'')+(step.blocked?' blocked':'');
    chip.textContent=(step.done?'✓ ':step.blocked?'· ':`${i+1} `)+step.label;
    chip.disabled=!!step.blocked;
    chip.title=step.blocked?'Slice frames before this step':'Jump to '+step.label;
    chip.addEventListener('click',()=>setWorkflow(step.wf));
    box.appendChild(chip);
  });
  document.querySelectorAll('.wf-tab').forEach(t=>{
    const wf=t.dataset.wf;
    const done=(wf==='import'&&model.hasFrames)||(wf==='cleanup'&&model.cleaned)||(wf==='repair'&&model.hasFrames&&model.issues===0);
    const blocked=(wf==='align'||wf==='repair'||wf==='export')&&!model.hasFrames;
    t.classList.toggle('done',done);t.classList.toggle('blocked',blocked);
  });
}
function taskOrderModel(){
  const model=workflowModel(), info=targetContractInfo(), checks=contractReadiness(info);
  const hasTarget=info.id!=='generic', hardFails=checks.filter(c=>!c.ok&&!c.warn), reviewWarn=checks.find(c=>c.id==='review'&&c.warn);
  const orderOk=checks.find(c=>c.id==='order')?.ok;
  return[
    {id:'load',title:'Load',meta:model.hasImage?'image ready':'source sheet',done:model.hasImage,active:!model.hasImage,run:()=>$('file-input')?.click()},
    {id:'clean',title:'Clean',meta:model.cleaned?'alpha changed':'optional alpha',done:model.cleaned,active:model.hasImage&&!model.hasFrames&&!model.cleaned,blocked:!model.hasImage,run:()=>setWorkflow('cleanup')},
    {id:'slice',title:'Slice',meta:model.hasFrames?`${S.frames.length} frames`:'grid cells',done:model.hasFrames,active:model.hasImage&&!model.hasFrames,blocked:!model.hasImage,run:()=>setWorkflow('import')},
    {id:'align',title:'Align',meta:'anchors',done:model.hasFrames&&S.frames.every(f=>f.anchor),active:model.hasFrames&&!S.frames.every(f=>f.anchor),blocked:!model.hasFrames,run:()=>setWorkflow('align')},
    {id:'review',title:'Review',meta:reviewWarn?reviewWarn.msg:'issues',done:model.hasFrames&&!reviewWarn,active:!!reviewWarn,blocked:!model.hasFrames,run:()=>setWorkflow('repair')},
    {id:'target',title:'Target',meta:hasTarget?info.label:'Badger/Ethic',done:hasTarget,active:model.hasFrames&&!hasTarget,blocked:!model.hasFrames,run:()=>setWorkflow('export')},
    {id:'order',title:'Order',meta:orderOk?'covered':'reorder',done:!!orderOk&&hasTarget,active:model.hasFrames&&hasTarget&&!orderOk,blocked:!model.hasFrames,run:()=>setWorkflow('export')},
    {id:'export',title:'Export',meta:hardFails.length?hardFails[0].id:'ready grid',done:false,active:model.hasFrames&&hasTarget&&!hardFails.length,blocked:!model.hasFrames||!hasTarget||!!hardFails.length,run:exportContractPages},
  ];
}
function renderTaskOrder(){
  const strip=$('task-order-strip');if(!strip)return;
  strip.textContent='';
  taskOrderModel().forEach((task,i)=>{
    const card=document.createElement('button');card.type='button';card.className='task-card'+(task.done?' done':'')+(task.active?' active':'')+(task.blocked?' blocked':'');card.disabled=!!task.blocked;
    const num=document.createElement('span');num.className='task-num';num.textContent=task.done?'✓':String(i+1);
    const copy=document.createElement('span');copy.className='task-copy';
    const title=document.createElement('span');title.className='task-title';title.textContent=task.title;
    const meta=document.createElement('span');meta.className='task-meta';meta.textContent=task.meta;
    copy.append(title,meta);card.append(num,copy);card.title=task.blocked?'Complete previous steps first':task.title+' — '+task.meta;card.addEventListener('click',task.run);strip.appendChild(card);
  });
}
function refreshQuickGuide(){
  const el=$('quick-guide-text'),title=$('quick-guide-title'),stage=$('info-stage');if(!el)return;
  const model=workflowModel();
  let text='Load an image to begin. Drop a file on the canvas, use the file picker, or paste from clipboard.';
  let primaryLabel='Load Image', primary=()=>$('file-input')?.click(), secondaryLabel='Clipboard', secondary=()=>$('btn-load-clip')?.click();
  if(model.hasImage&&!model.cleaned&&!model.hasFrames){text='Preview alpha cleanup on the main canvas, then apply it or continue straight to slicing.';primaryLabel='Go to Cleanup';primary=()=>setWorkflow('cleanup');secondaryLabel='Slice Grid';secondary=()=>setWorkflow('import')}
  if(model.hasImage&&!model.hasFrames&&S.wf==='cleanup'){text='Use Preview Mode: Alpha clean to inspect. Apply Remove BG only when it looks right.';primaryLabel='Apply Remove BG';primary=()=>$('btn-clean-run')?.click();secondaryLabel='Back to Import';secondary=()=>setWorkflow('import')}
  if(model.hasImage&&!model.hasFrames&&S.wf==='import'){text='Set frame size and offsets. Drag grid, Shift+drag to resize, or switch to Single Cell for exceptions.';primaryLabel='Slice by Grid';primary=()=>$('btn-slice')?.click();secondaryLabel='Cleanup';secondary=()=>setWorkflow('cleanup')}
  if(model.hasFrames&&model.issues>0){text=`${model.issues} frame(s) need review. Use issue navigation or Cleanup by Frame before export.`;primaryLabel='Next Issue';primary=()=>$('btn-next-issue')?.click();secondaryLabel='Cleanup by Frame';secondary=()=>setWorkflow('repair')}
  if(model.hasFrames&&model.issues===0){text='Frames look clean. Export PNG, manifest, GIF, or review report from Export.';primaryLabel='Go to Export';primary=()=>setWorkflow('export');secondaryLabel='Preview Play';secondary=()=>$('btn-tl-play')?.click()}
  if(title)title.textContent=model.hasFrames?'Workflow:':'Quick Start:';
  el.textContent=text;
  if(stage)stage.textContent='stage: '+(S.wf||'empty')+(model.hasFrames?` · ${S.frames.length} frame(s)`:model.hasImage?' · image loaded':'');
  setQuickButton($('btn-quick-primary'),primaryLabel,primary,false,'primary');
  setQuickButton($('btn-quick-secondary'),secondaryLabel,secondary,false,'ghost');
  refreshWorkflowProgress(model);
  if(typeof updateReassemblyHud==='function')updateReassemblyHud();
}
function cloneImageData(d){return new ImageData(new Uint8ClampedArray(d.data),d.width,d.height)}
function clamp255(v){return Math.max(0,Math.min(255,Math.round(v)))}
function finiteNumber(v,fallback,min=-Infinity,max=Infinity){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
function finiteInt(v,fallback,min=-Infinity,max=Infinity){const n=finiteNumber(v,fallback,min,max);return Number.isFinite(n)?Math.round(n):fallback}
function cleanText(v,max=500){return String(v??'').slice(0,max)}
function cleanAnchor(anchor,fallback={x:0,y:0}){return{x:finiteNumber(anchor?.x,fallback.x,-4096,4096),y:finiteNumber(anchor?.y,fallback.y,-4096,4096)}}
function cleanTotals(t={}){t=t&&typeof t==='object'?t:{};return{pixels:finiteInt(t.pixels,0,0,1e9),soft:finiteInt(t.soft,0,0,1e9),strayPixels:finiteInt(t.strayPixels,0,0,1e9),pinholePixels:finiteInt(t.pinholePixels,0,0,1e9),jitterFrames:finiteInt(t.jitterFrames,0,0,1e6),issueFrames:finiteInt(t.issueFrames,0,0,1e6)}}
function cleanBatchHistory(history){return Array.isArray(history)?history.slice(-10).map(h=>({kind:cleanText(h?.kind||'batch',80),at:cleanText(h?.at||'',80),before:cleanTotals(h?.before),after:cleanTotals(h?.after),delta:{issueFrames:finiteInt(h?.delta?.issueFrames,0,-1e6,1e6),strayPixels:finiteInt(h?.delta?.strayPixels,0,-1e9,1e9),pinholePixels:finiteInt(h?.delta?.pinholePixels,0,-1e9,1e9),jitterFrames:finiteInt(h?.delta?.jitterFrames,0,-1e6,1e6)}})):[]}
function cleanSpecGuide(guide){if(!guide||typeof guide!=='object')return null;const items=Array.isArray(guide.items)?guide.items.slice(0,64).map(i=>({id:cleanText(i?.id,80),label:cleanText(i?.label,200),done:!!i?.done,action:cleanText(i?.action,300)})):[];return{version:finiteInt(guide.version,1,1,10),source:cleanText(guide.source||'sprite-fan/reqs/animation.yml',300),prompt:cleanText(guide.prompt,4000),checkedAt:cleanText(guide.checkedAt||'',80),summary:{done:items.filter(i=>i.done).length,total:items.length},items}}
function cleanFrameMeta(meta){return Array.isArray(meta)?meta.slice(0,512).map((m,i)=>({index:finiteInt(m?.index,i,0,511),label:cleanText(m?.label,160),notes:cleanText(m?.notes,2000),anchor:cleanAnchor(m?.anchor,S.anchor)})):[]}
function cleanViewState(v){if(!v||typeof v!=='object')return null;return{zoom:finiteNumber(v.zoom,1,.1,16),panX:finiteNumber(v.panX,0,-100000,100000),panY:finiteNumber(v.panY,0,-100000,100000),ready:!!v.ready,initialized:!!v.initialized}}
function cleanViewStates(vs){return vs&&typeof vs==='object'?{source:cleanViewState(vs.source),frame:cleanViewState(vs.frame)}:undefined}
function cleanLayout(l){return l&&typeof l==='object'?{leftWidth:finiteInt(l.leftWidth,DEFAULT_LAYOUT.leftWidth,180,520),rightWidth:finiteInt(l.rightWidth,DEFAULT_LAYOUT.rightWidth,180,560),timelineHeight:finiteInt(l.timelineHeight,DEFAULT_LAYOUT.timelineHeight,48,240)}:undefined}
function cleanConfig(c){if(!c||typeof c!=='object')return{};return{frameW:finiteInt(c.frameW,undefined,1,4096),frameH:finiteInt(c.frameH,undefined,1,4096),gridOx:finiteInt(c.gridOx,undefined,0,4096),gridOy:finiteInt(c.gridOy,undefined,0,4096),anchor:c.anchor?cleanAnchor(c.anchor,S.anchor):undefined,tolerance:finiteNumber(c.tolerance,undefined,0,255),maxSaturation:finiteNumber(c.maxSaturation,undefined,0,255),alphaThreshold:finiteNumber(c.alphaThreshold,undefined,0,255),mergeDistance:finiteNumber(c.mergeDistance,undefined,0,4096),straySize:finiteInt(c.straySize,undefined,1,4096),jitterThresh:finiteNumber(c.jitterThresh,undefined,0,4096),outlineRadius:finiteInt(c.outlineRadius,undefined,0,64),softenRadius:finiteInt(c.softenRadius,undefined,0,64),alphaErode:finiteInt(c.alphaErode,undefined,0,64),alphaDilate:finiteInt(c.alphaDilate,undefined,0,64),exportCols:finiteInt(c.exportCols,undefined,1,64),exportPad:finiteInt(c.exportPad,undefined,0,512),noPad:c.noPad===undefined?undefined:!!c.noPad,manifestName:c.manifestName===undefined?undefined:cleanText(c.manifestName,120),manifestFps:finiteNumber(c.manifestFps,undefined,1,120),manifestLoop:finiteInt(c.manifestLoop,undefined,0,1000000),specGuide:cleanSpecGuide(c.specGuide),showOnionSkin:c.showOnionSkin===undefined?undefined:!!c.showOnionSkin,onionOpacity:finiteNumber(c.onionOpacity,undefined,0,1),autoFitFrames:c.autoFitFrames===undefined?undefined:!!c.autoFitFrames,maxAutoFitZoom:finiteNumber(c.maxAutoFitZoom,undefined,1,16),viewMode:c.viewMode==='frame'?'frame':c.viewMode==='source'?'source':undefined,zoom:finiteNumber(c.zoom,undefined,.1,16),panX:finiteNumber(c.panX,undefined,-100000,100000),panY:finiteNumber(c.panY,undefined,-100000,100000),viewStates:cleanViewStates(c.viewStates),layout:cleanLayout(c.layout),frameMeta:Array.isArray(c.frameMeta)?cleanFrameMeta(c.frameMeta):undefined,batchHistory:Array.isArray(c.batchHistory)?cleanBatchHistory(c.batchHistory):undefined}}
function loadObjectUrlImage(file,onload){const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{try{onload(img)}finally{URL.revokeObjectURL(url)}};img.onerror=()=>{URL.revokeObjectURL(url);toast('Image load failed','error')};img.src=url}

// ════════════════════════════════════════════
// UNDO / REDO
// ════════════════════════════════════════════
function cloneFrame(f){return{imgData:cloneImageData(f.imgData),anchor:{...(f.anchor||S.anchor)},offsetX:f.offsetX||0,offsetY:f.offsetY||0,label:f.label||'',notes:f.notes||''}}
function clonePlain(v){return JSON.parse(JSON.stringify(v))}
function makeUndoSnapshot(){return{originalImageData:S.originalImageData?cloneImageData(S.originalImageData):null,sheetImageData:S.sheetImageData?cloneImageData(S.sheetImageData):null,currentImageData:S.currentImageData?cloneImageData(S.currentImageData):null,frames:S.frames.map(cloneFrame),selectedFrame:S.selectedFrame,anchor:{...S.anchor},detectedGroups:clonePlain(S.detectedGroups),cellOverrides:clonePlain(S.cellOverrides||{}),viewMode:S.viewMode,viewStates:clonePlain(S.viewStates),batchHistory:clonePlain(S.batchHistory),pendingFrameMeta:clonePlain(S.pendingFrameMeta),previewFrames:clonePlain(S.previewFrames)}}
function restoreUndoSnapshot(snap){S.frames=snap.frames.map(cloneFrame);S.selectedFrame=snap.selectedFrame;S.anchor={...snap.anchor};S.detectedGroups=clonePlain(snap.detectedGroups||[]);S.cellOverrides=clonePlain(snap.cellOverrides||{});S.originalImageData=snap.originalImageData?cloneImageData(snap.originalImageData):S.originalImageData;S.sheetImageData=snap.sheetImageData?cloneImageData(snap.sheetImageData):null;S.viewMode=snap.viewMode||'source';S.viewStates=clonePlain(snap.viewStates||{source:null,frame:null});S.batchHistory=clonePlain(snap.batchHistory||[]);S.pendingFrameMeta=clonePlain(snap.pendingFrameMeta||[]);S.previewFrames=Array.isArray(snap.previewFrames)?clonePlain(snap.previewFrames):[];S.currentImageData=snap.currentImageData?cloneImageData(snap.currentImageData):null;if(S.selectedFrame>=0&&S.frames[S.selectedFrame])showFrame(S.selectedFrame);else if(S.sheetImageData)showSourceSheet();else if(S.currentImageData)applyImageData(S.currentImageData);updateFrameStrip();updateTimeline();updateUndoUI();refreshWorkflowAvailability()}
function pushUndo(){if(!S.currentImageData&&!S.frames.length&&!S.sheetImageData)return;S.undoStack.push(makeUndoSnapshot());if(S.undoStack.length>S.maxUndo)S.undoStack.shift();S.redoStack=[];updateUndoUI()}
function undo(){if(!S.undoStack.length)return;S.redoStack.push(makeUndoSnapshot());restoreUndoSnapshot(S.undoStack.pop())}
function redo(){if(!S.redoStack.length)return;S.undoStack.push(makeUndoSnapshot());restoreUndoSnapshot(S.redoStack.pop())}
function updateUndoUI(){$('btn-undo').disabled=!S.undoStack.length;$('btn-redo').disabled=!S.redoStack.length;$('status-undo').textContent='Undo: '+S.undoStack.length}

function applyImageData(imgData){
  mainCanvas.width=imgData.width;mainCanvas.height=imgData.height;
  ctx.putImageData(imgData,0,0);updateOverlaySize();maybeFitToView(false);updatePreview();updateInfoSize();
}

// ════════════════════════════════════════════
// ZOOM / PAN
// ════════════════════════════════════════════
function currentViewKey(){return S.viewMode==='frame'?'frame':'source'}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function applyLayout(){const l=S.layout||DEFAULT_LAYOUT;const left=$('left-panel'),right=$('right-panel'),tl=$('timeline');if(left)left.style.width=clamp(+l.leftWidth||DEFAULT_LAYOUT.leftWidth,180,520)+'px';if(right)right.style.width=clamp(+l.rightWidth||DEFAULT_LAYOUT.rightWidth,180,560)+'px';if(tl)tl.style.height=clamp(+l.timelineHeight||DEFAULT_LAYOUT.timelineHeight,48,240)+'px';if(mainCanvas.width)requestAnimationFrame(()=>maybeFitToView(false))}
function resetLayout(kind='all'){if(kind==='left'||kind==='all')S.layout.leftWidth=DEFAULT_LAYOUT.leftWidth;if(kind==='right'||kind==='all')S.layout.rightWidth=DEFAULT_LAYOUT.rightWidth;if(kind==='timeline'||kind==='all')S.layout.timelineHeight=DEFAULT_LAYOUT.timelineHeight;applyLayout();saveViewState();toast(kind==='all'?'Layout reset':'Pane reset','success')}
function saveViewState(key=currentViewKey()){S.viewStates[key]={zoom:S.zoom,panX:S.panX,panY:S.panY,ready:S.reviewFitReady,initialized:S.viewInitialized}}
function restoreViewState(key=currentViewKey()){const v=S.viewStates[key];if(!v)return false;S.zoom=v.zoom;S.panX=v.panX;S.panY=v.panY;S.reviewFitReady=!!v.ready;S.viewInitialized=!!v.initialized;applyTransform();return true}
function setViewMode(mode){if(S.viewMode!==mode){saveViewState();S.viewMode=mode;S.reviewFitReady=false;S.viewInitialized=false}}
function markManualView(){S.reviewFitReady=true;S.viewInitialized=true;saveViewState()}
function setZoom(z,cx,cy){const o=S.zoom||1;S.zoom=Math.max(.1,Math.min(16,z));if(cx!==undefined&&cy!==undefined){S.panX=cx-(cx-S.panX)*(S.zoom/o);S.panY=cy-(cy-S.panY)*(S.zoom/o)}markManualView();applyTransform()}
function applyTransform(){const t=`translate(${S.panX}px,${S.panY}px) scale(${S.zoom})`;mainCanvas.style.transform=t;previewCanvas.style.transform=t;overlayCanvas.style.transform=t;onionCanvas.style.transform=t;$('info-zoom').textContent=Math.round(S.zoom*100)+'%'}
function fitToView(){if(!mainCanvas.width||!mainCanvas.height)return;const r=container.getBoundingClientRect();const cw=Math.max(1,r.width),ch=Math.max(1,r.height);const p=Math.min(48,Math.max(8,Math.min(cw,ch)*0.1));const sx=Math.max(.1,(cw-p)/mainCanvas.width),sy=Math.max(.1,(ch-p)/mainCanvas.height);const maxZ=Math.max(1,Math.min(16,+S.maxAutoFitZoom||4));const z=Math.max(.1,Math.min(16,Math.min(sx,sy,maxZ)||1));S.zoom=z;S.panX=Math.round((cw-mainCanvas.width*z)/2);S.panY=Math.round((ch-mainCanvas.height*z)/2);S.reviewFitReady=true;S.viewInitialized=true;applyTransform();saveViewState()}
function maybeFitToView(force){const key=currentViewKey();const shouldAuto=key==='frame'&&S.autoFitFrames;if(!force&&!shouldAuto&&restoreViewState(key))return;if(force||shouldAuto||!S.viewStates[key]||!S.viewInitialized||!S.reviewFitReady)fitToView();else applyTransform()}
function updateOverlaySize(){overlayCanvas.width=mainCanvas.width;overlayCanvas.height=mainCanvas.height;onionCanvas.width=mainCanvas.width;onionCanvas.height=mainCanvas.height;previewCanvas.width=mainCanvas.width;previewCanvas.height=mainCanvas.height}
function updateInfoSize(){$('info-size').textContent=mainCanvas.width+'x'+mainCanvas.height}

// ════════════════════════════════════════════
// IMAGE LOADING
// ════════════════════════════════════════════
function loadImageToCanvas(img){
  S.sourceImg=img;srcCanvas.width=img.width;srcCanvas.height=img.height;
  srcCtx.clearRect(0,0,img.width,img.height);srcCtx.drawImage(img,0,0);
  S.originalImageData=srcCtx.getImageData(0,0,img.width,img.height);
  S.sheetImageData=cloneImageData(S.originalImageData);
  S.currentImageData=cloneImageData(S.sheetImageData);
  S.alphaCleanupBaseImageData=cloneImageData(S.originalImageData);
  mainCanvas.width=img.width;mainCanvas.height=img.height;
  ctx.putImageData(S.currentImageData,0,0);updateOverlaySize();
  S.detectedGroups=[];S.frames=[];S.selectedFrame=-1;S.cellOverrides={};S.previewFrames=[];S.previewCursor=0;S.undoStack=[];S.redoStack=[];S.viewStates={source:null,frame:null};setViewMode('source');updateUndoUI();refreshWorkflowAvailability();
  $('drop-zone').classList.add('hidden');S.reviewFitReady=false;
  // Defer fitToView to next frame so container dimensions are settled
  requestAnimationFrame(()=>{fitToView();updatePreview();updateInfoSize();updateFrameStrip();updateTimeline();drawOverlay()});
  setStatus('Loaded '+img.width+'x'+img.height);toast('Image loaded','success');refreshQuickGuide();
}
function renderPreviewEmpty(label='PREVIEW'){
  prevCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);
  previewCanvas.style.display='none';
}
function refreshWorkflowAvailability(){
  const hasSheet=!!S.sheetImageData;
  const hasFrames=S.frames.length>0;
  document.querySelectorAll('.wf-tab').forEach(t=>{
    const wf=t.dataset.wf;
    const disabled=(wf==='align'||wf==='repair')&&!hasFrames;
    t.disabled=disabled;
    t.classList.toggle('disabled',disabled);
    if(wf==='cleanup')t.disabled=!hasSheet;
  });
}
function setSheetImageData(imgData){
  S.sheetImageData=cloneImageData(imgData);
  if(S.selectedFrame<0){
    S.currentImageData=cloneImageData(S.sheetImageData);
    applyImageData(S.currentImageData);
  }
  refreshQuickGuide();
  refreshWorkflowAvailability();
}
function commitCurrentAsNewBase(){
  const src=S.selectedFrame>=0&&S.frames[S.selectedFrame]?S.frames[S.selectedFrame].imgData:S.currentImageData;
  if(!src){toast('Nothing to commit','warning');return}
  pushUndo();
  S.originalImageData=cloneImageData(src);
  S.sheetImageData=cloneImageData(src);
  S.alphaCleanupBaseImageData=cloneImageData(src);
  S.cellOverrides={};
  showSourceSheet();
  toast('Current image committed as new base','success');
}
function resetToOriginal(){
  if(!S.originalImageData){toast('No original image loaded','warning');return}
  pushUndo();
  S.sheetImageData=cloneImageData(S.originalImageData);
  S.alphaCleanupBaseImageData=cloneImageData(S.originalImageData);
  S.currentImageData=cloneImageData(S.sheetImageData);
  S.frames=[];S.selectedFrame=-1;S.cellOverrides={};S.previewFrames=[];S.previewCursor=0;
  showSourceSheet();updateFrameStrip();updateTimeline();drawOverlay();
  toast('Reset sheet to original','success');
}
function getGridMetrics(){const fw=+$('frame-w').value,fh=+$('frame-h').value,ox=+$('grid-ox').value,oy=+$('grid-oy').value;const source=S.sheetImageData||S.currentImageData||S.originalImageData;if(!source||fw<1||fh<1)return null;return{fw,fh,ox,oy,cols:Math.max(0,Math.floor((source.width-ox)/fw)),rows:Math.max(0,Math.floor((source.height-oy)/fh)),source}}
function cellKey(i){return String(Math.max(0,Math.floor(+i||0)))}
function getCellOverride(i){return S.cellOverrides[cellKey(i)]||{dx:0,dy:0,dw:0,dh:0}}
function setCellOverride(i,o){const k=cellKey(i);const n={dx:Math.round(o.dx||0),dy:Math.round(o.dy||0),dw:Math.round(o.dw||0),dh:Math.round(o.dh||0)};if(!n.dx&&!n.dy&&!n.dw&&!n.dh)delete S.cellOverrides[k];else S.cellOverrides[k]=n;updateCellOverrideInfo()}
function getEffectiveCellRect(index,metrics=getGridMetrics()){if(!metrics)return null;const i=Math.max(0,Math.floor(+index||0));const col=i%metrics.cols,row=Math.floor(i/metrics.cols);if(row<0||row>=metrics.rows)return null;const o=getCellOverride(i);return{x:metrics.ox+col*metrics.fw+o.dx,y:metrics.oy+row*metrics.fh+o.dy,w:Math.max(1,metrics.fw+o.dw),h:Math.max(1,metrics.fh+o.dh),col,row,index:i,override:o}}
function updateCellOverrideInfo(){const el=$('grid-cell-info');if(!el)return;const count=Object.keys(S.cellOverrides||{}).length;const idx=+$('grid-cell-index').value||0;const o=getCellOverride(idx);el.textContent=count?`Cell ${idx}: dx ${o.dx}, dy ${o.dy}, dw ${o.dw}, dh ${o.dh} · ${count} overridden`:'No cell overrides';}

$('file-input').addEventListener('change',()=>{const f=$('file-input').files[0];if(!f)return;loadObjectUrlImage(f,loadImageToCanvas)});
$('white-file').addEventListener('change',()=>{const f=$('white-file').files[0];if(!f)return;loadObjectUrlImage(f,img=>{S.whiteImg=img;setStatus('White: '+img.width+'x'+img.height)})});
$('black-file').addEventListener('change',()=>{const f=$('black-file').files[0];if(!f)return;loadObjectUrlImage(f,img=>{S.blackImg=img;setStatus('Black: '+img.width+'x'+img.height)})});

$('btn-load-clip').addEventListener('click',async()=>{try{const items=await navigator.clipboard.read();for(const item of items)for(const type of item.types)if(type.startsWith('image/')){const blob=await item.getType(type);loadObjectUrlImage(blob,loadImageToCanvas);return}toast('No image in clipboard','warning')}catch(e){toast('Clipboard access denied','error')}});

$('btn-dual-toggle').addEventListener('click',()=>{S.dualMode=!S.dualMode;$('single-file-input').style.display=S.dualMode?'none':'';$('dual-file-inputs').style.display=S.dualMode?'':'none';$('dual-extract-row').style.display=S.dualMode?'':'none';toast(S.dualMode?'Dual BG mode on':'Single image mode')});

$('btn-dual-extract').addEventListener('click',()=>{
  if(!S.whiteImg||!S.blackImg){toast('Load both white & black images first','warning');return}
  if(S.whiteImg.width!==S.blackImg.width||S.whiteImg.height!==S.blackImg.height){toast('Images must have identical dimensions','error');return}
  pushUndo();
  const result=extractDualAlpha(S.whiteImg,S.blackImg,1,true,false);
  S.sourceImg=S.whiteImg;srcCanvas.width=result.width;srcCanvas.height=result.height;srcCtx.putImageData(result,0,0);
  S.originalImageData=cloneImageData(result);S.sheetImageData=cloneImageData(result);S.currentImageData=cloneImageData(result);S.alphaCleanupBaseImageData=cloneImageData(result);
  mainCanvas.width=result.width;mainCanvas.height=result.height;ctx.putImageData(S.currentImageData,0,0);
  updateOverlaySize();$('drop-zone').classList.add('hidden');S.reviewFitReady=false;
  requestAnimationFrame(()=>{fitToView();updatePreview();updateInfoSize();drawOverlay()});
  toast('Dual BG alpha extracted','success');
});

// Drag & drop
container.addEventListener('dragover',e=>{e.preventDefault();container.classList.add('drag-over')});
container.addEventListener('dragleave',()=>container.classList.remove('drag-over'));
container.addEventListener('drop',e=>{e.preventDefault();container.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(!f||!f.type.startsWith('image/'))return;loadObjectUrlImage(f,loadImageToCanvas)});
$('drop-zone')?.addEventListener('click',()=>$('file-input')?.click());

// ════════════════════════════════════════════
// WORKFLOW SWITCHING
// ════════════════════════════════════════════
function setWorkflow(wf){
  if((wf==='align'||wf==='repair')&&!S.frames.length){toast('Slice frames first','warning');wf=S.sheetImageData?'import':'cleanup'}
  if(wf==='cleanup'&&S.sheetImageData){setViewMode('source');S.selectedFrame=-1;S.currentImageData=cloneImageData(S.sheetImageData);applyImageData(S.currentImageData);if($('preview-mode'))$('preview-mode').value='alpha-clean'}
  S.wf=wf;
  if(wf==='import'&&S.sheetImageData)showSourceSheet();
  document.querySelectorAll('.wf-tab').forEach(t=>t.classList.toggle('active',t.dataset.wf===wf));
  document.querySelectorAll('.wf-panel').forEach(p=>p.style.display=p.dataset.wf===wf?'':'none');
  $('status-wf').textContent=wf.charAt(0).toUpperCase()+wf.slice(1);refreshQuickGuide();refreshWorkflowAvailability();
  drawOverlay();updatePreview();
}
document.querySelectorAll('.wf-tab').forEach(t=>t.addEventListener('click',()=>setWorkflow(t.dataset.wf)));

// ════════════════════════════════════════════
// RANGE SLIDERS
// ════════════════════════════════════════════
const rangeDisplays={tolerance:'tol-val','max-saturation':'sat-val','frame-w':'fw-val','frame-h':'fh-val','grid-ox':'ox-val','grid-oy':'oy-val','anchor-x':'ancx-val','anchor-y':'ancy-val','stray-size':'stray-val','jitter-thresh':'jitter-val','outline-radius':'outline-val','soften-radius':'soften-val','alpha-erode':'erode-val','alpha-dilate':'dilate-val','export-cols':'cols-val','export-pad':'pad-val','alpha-threshold':'athresh-val','merge-distance':'merge-val','manifest-fps':'fps-val','max-auto-fit-zoom':'fitzoom-val','export-scale':'export-scale-val'};
Object.entries(rangeDisplays).forEach(([id,valId])=>{const el=$(id);if(el)el.addEventListener('input',()=>{$ (valId).textContent=el.value;if(id==='max-auto-fit-zoom'){S.maxAutoFitZoom=+el.value;if(mainCanvas.width&&S.autoFitFrames)fitToView()}})});

// Sync number inputs with ranges
['frame-w','frame-h','anchor-x','anchor-y'].forEach(id=>{
  const r=$(id),n=$(id+'-num');if(!r||!n)return;
  r.addEventListener('input',()=>{n.value=r.value});
  n.addEventListener('input',()=>{r.value=n.value;$ (rangeDisplays[id]).textContent=n.value});
});

// Presets
document.querySelectorAll('.preset-btn[data-fw]').forEach(b=>b.addEventListener('click',()=>{$('frame-w').value=b.dataset.fw;$('frame-h').value=b.dataset.fh;$('frame-w-num').value=b.dataset.fw;$('frame-h-num').value=b.dataset.fh;$('fw-val').textContent=b.dataset.fw;$('fh-val').textContent=b.dataset.fh}));
document.querySelectorAll('.preset-btn[data-ax]').forEach(b=>b.addEventListener('click',()=>{$('anchor-x').value=b.dataset.ax;$('anchor-y').value=b.dataset.ay;$('anchor-x-num').value=b.dataset.ax;$('anchor-y-num').value=b.dataset.ay;$('ancx-val').textContent=b.dataset.ax;$('ancy-val').textContent=b.dataset.ay;S.anchor={x:+b.dataset.ax,y:+b.dataset.ay};drawOverlay();updateAnchorList()}));

// Panel collapse
document.querySelectorAll('.panel-header[data-toggle]').forEach(h=>h.addEventListener('click',()=>{h.classList.toggle('collapsed');$(h.dataset.toggle).classList.toggle('collapsed')}));

['grid-edit-mode','grid-cell-index'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',()=>{updateCellOverrideInfo();drawOverlay()})});
$('btn-reset-cell-override')?.addEventListener('click',()=>{const idx=+$('grid-cell-index').value||0;pushUndo();setCellOverride(idx,{dx:0,dy:0,dw:0,dh:0});drawOverlay();toast('Cell override reset','success')});
$('btn-clear-cell-overrides')?.addEventListener('click',()=>{if(!Object.keys(S.cellOverrides||{}).length){toast('No cell overrides','info');return}pushUndo();S.cellOverrides={};updateCellOverrideInfo();drawOverlay();toast('All cell overrides cleared','success')});
$('btn-reset-original')?.addEventListener('click',resetToOriginal);
$('btn-commit-base')?.addEventListener('click',commitCurrentAsNewBase);

// ════════════════════════════════════════════
// GRID SLICING (WF: Import)
// ════════════════════════════════════════════
$('btn-auto-fit-grid')?.addEventListener('click',()=>{
  const source=S.sheetImageData||S.currentImageData;
  if(!source){toast('Load an image first','warning');return}
  const fw=+$('frame-w').value||48,fh=+$('frame-h').value||48;
  const ox=+$('grid-ox').value||0,oy=+$('grid-oy').value||0;
  const cols=Math.max(1,Math.floor((source.width-ox)/fw));
  const rows=Math.max(1,Math.floor((source.height-oy)/fh));
  const fitW=Math.max(1,Math.floor((source.width-ox)/cols));
  const fitH=Math.max(1,Math.floor((source.height-oy)/rows));
  $('frame-w').value=fitW;$('frame-w-num').value=fitW;$('fw-val').textContent=fitW;
  $('frame-h').value=fitH;$('frame-h-num').value=fitH;$('fh-val').textContent=fitH;
  drawOverlay();toast('Auto-fit: '+cols+'x'+rows+' at '+fitW+'x'+fitH,'success');
});

$('btn-slice').addEventListener('click',()=>{
  if(!S.currentImageData){toast('Load an image first','warning');return}
  const fw=+$('frame-w').value, fh=+$('frame-h').value;
  const ox=+$('grid-ox').value, oy=+$('grid-oy').value;
  const sourceForSlice=S.sheetImageData||S.currentImageData;
  const iw=sourceForSlice.width, ih=sourceForSlice.height;
  const cols=Math.floor((iw-ox)/fw), rows=Math.floor((ih-oy)/fh);
  if(cols<1||rows<1){toast('Frame size too large for image','error');return}

  S.frames=[];S.previewFrames=[];S.previewCursor=0;
  const tmpC=document.createElement('canvas');tmpC.width=iw;tmpC.height=ih;
  tmpC.getContext('2d').putImageData(sourceForSlice,0,0);

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const index=r*cols+c;
      const rect=getEffectiveCellRect(index,{fw,fh,ox,oy,cols,rows,source:sourceForSlice});
      const sx=Math.max(0,rect.x), sy=Math.max(0,rect.y), sw=Math.min(iw-sx,rect.w), sh=Math.min(ih-sy,rect.h);
      const fd=document.createElement('canvas');fd.width=rect.w;fd.height=rect.h;
      const fctx=fd.getContext('2d',{willReadFrequently:true});
      fctx.clearRect(0,0,rect.w,rect.h);
      fctx.drawImage(tmpC,sx,sy,sw,sh,0,0,sw,sh);
      S.frames.push({imgData:fctx.getImageData(0,0,rect.w,rect.h),anchor:{x:S.anchor.x,y:S.anchor.y},offsetX:0,offsetY:0,label:'',notes:''});
    }
  }
  S.selectedFrame=0;
  applyPendingFrameMeta();
  S.reviewFitReady=false;
  $('slice-info').textContent=cols+'x'+rows+' = '+S.frames.length+' frames';
  updateFrameStrip();updateTimeline();showFrame(0);
  toast('Sliced '+S.frames.length+' frames','success');
  setStatus('Grid sliced: '+cols+'x'+rows);
  refreshQuickGuide();
});

// ════════════════════════════════════════════
// FRAME DISPLAY
// ════════════════════════════════════════════
function showSourceSheet(){
  const sheet=S.sheetImageData||S.currentImageData;
  if(!sheet)return;
  setViewMode('source');
  S.selectedFrame=-1;
  S.currentImageData=cloneImageData(sheet);
  mainCanvas.width=S.currentImageData.width;mainCanvas.height=S.currentImageData.height;
  ctx.putImageData(S.currentImageData,0,0);updateOverlaySize();
  onionCanvas.style.opacity=0;onCtx.clearRect(0,0,onionCanvas.width,onionCanvas.height);
  maybeFitToView(false);updatePreview();updateInfoSize();drawOverlay();
  $('tl-frame-info').textContent=S.frames.length?'source':'0/0';
  updateFrameStrip();updateTimeline();
}
function showFrame(idx){
  if(idx<0||idx>=S.frames.length){
    showSourceSheet();
    return;
  }
  setViewMode('frame');
  S.selectedFrame=idx;
  const f=S.frames[idx];
  mainCanvas.width=f.imgData.width;mainCanvas.height=f.imgData.height;
  ctx.putImageData(f.imgData,0,0);
  // Also update currentImageData so preview/cleanup work on the selected frame
  S.currentImageData=f.imgData;
  updateOverlaySize();

  // Onion skin: show previous frame semi-transparent
  if(S.showOnionSkin&&idx>0){
    const pf=S.frames[idx-1];
    onionCanvas.width=pf.imgData.width;onionCanvas.height=pf.imgData.height;
    onCtx.clearRect(0,0,onionCanvas.width,onionCanvas.height);
    onCtx.putImageData(pf.imgData,0,0);
    onionCanvas.style.opacity=S.onionOpacity;
  } else {
    onCtx.clearRect(0,0,onionCanvas.width,onionCanvas.height);
    onionCanvas.style.opacity=0;
  }

  maybeFitToView(false);updatePreview();updateInfoSize();drawOverlay();
  $('tl-frame-info').textContent=(idx+1)+'/'+S.frames.length;
  updateFrameStrip();
  updateTimeline();
}

function syncFrameOrderText(){const el=$('frame-order');if(el)el.value=S.frames.map((_,i)=>i+1).join(',')}
function updateContractPageInfo(){
  const el=$('contract-page-info');
  if(el){
    if(!S.frames.length)el.textContent='No frames sliced yet.';
    else {const info=targetContractInfo(),pageSize=info.pageSize||Math.max(1,+$('export-cols').value||1),pages=Math.ceil(S.frames.length/pageSize);el.textContent=`${S.frames.length} frame(s) → ${pages} ${info.pageSize?'4x4 contract':'generic'} page(s). ${S.frames.length>16&&info.pageSize?'Split into numbered downstream-compatible sheets.':S.frames.length>16?'Pick a target for safe 4x4 paging.':'Ready for one page.'}`;}
  }
  if($('assistant-status'))renderReassemblyAssistant();
}
function moveFrame(from,to){
  if(from<0||from>=S.frames.length||to<0||to>=S.frames.length||from===to)return;
  pushUndo();
  const [frame]=S.frames.splice(from,1);S.frames.splice(to,0,frame);
  S.previewFrames=S.previewFrames.map(i=>i===from?to:(from<to&&i>from&&i<=to?i-1:(from>to&&i>=to&&i<from?i+1:i))).sort((a,b)=>a-b);
  S.selectedFrame=to;showFrame(to);updateFrameStrip();updateTimeline();syncFrameOrderText();updateContractPageInfo();refreshQuickGuide();
}
function reorderFramesByOrder(order){
  if(!Array.isArray(order)||order.length!==S.frames.length){toast('Order must include every frame once','error');return false}
  const zero=order.map(n=>n-1);const seen=new Set(zero);
  if(zero.some(i=>!Number.isInteger(i)||i<0||i>=S.frames.length)||seen.size!==S.frames.length){toast('Invalid frame order','error');return false}
  pushUndo();
  S.frames=zero.map(i=>S.frames[i]);
  S.selectedFrame=Math.min(S.selectedFrame,S.frames.length-1);
  showFrame(Math.max(0,S.selectedFrame));updateFrameStrip();updateTimeline();syncFrameOrderText();updateContractPageInfo();refreshQuickGuide();toast('Frame order applied','success');return true;
}
function parseFrameOrderText(){return String($('frame-order')?.value||'').split(/[\s,;]+/).filter(Boolean).map(v=>Number(v))}
function updateFrameStrip(){
  const strip=$('frame-strip');strip.innerHTML='';
  S.frames.forEach((f,i)=>{
    const chip=document.createElement('div');chip.className='frame-chip'+(i===S.selectedFrame?' selected':'');chip.draggable=true;
    const tc=document.createElement('canvas');tc.width=48;tc.height=48;
    const tctx=tc.getContext('2d');
    const tmpC=document.createElement('canvas');tmpC.width=f.imgData.width;tmpC.height=f.imgData.height;
    tmpC.getContext('2d').putImageData(f.imgData,0,0);
    const sc=Math.min(48/f.imgData.width,48/f.imgData.height);
    const dw=f.imgData.width*sc,dh=f.imgData.height*sc;
    tctx.drawImage(tmpC,0,0,f.imgData.width,f.imgData.height,(48-dw)/2,(48-dh)/2,dw,dh);
    chip.appendChild(tc);
    const idx=document.createElement('span');idx.className='chip-idx';idx.textContent=i+1;chip.appendChild(idx);
    chip.addEventListener('click',()=>{S.selectedFrame=i;showFrame(i)});
    chip.addEventListener('dragstart',e=>{S.frameDragIndex=i;chip.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(i))});
    chip.addEventListener('dragend',()=>{S.frameDragIndex=null;chip.classList.remove('dragging');document.querySelectorAll('.frame-chip.drop-target,.tl-frame.drop-target').forEach(n=>n.classList.remove('drop-target'))});
    chip.addEventListener('dragover',e=>{e.preventDefault();chip.classList.add('drop-target');e.dataTransfer.dropEffect='move'});
    chip.addEventListener('dragleave',()=>chip.classList.remove('drop-target'));
    chip.addEventListener('drop',e=>{e.preventDefault();chip.classList.remove('drop-target');const from=S.frameDragIndex??Number(e.dataTransfer.getData('text/plain'));moveFrame(from,i)});
    strip.appendChild(chip);
  });
  $('frame-count').textContent=S.frames.length+' frame(s)';
  syncFrameOrderText();updateContractPageInfo();
}

// ════════════════════════════════════════════
// TIMELINE
// ════════════════════════════════════════════
function getPreviewSequence(){return S.previewFrames.filter(i=>i>=0&&i<S.frames.length).sort((a,b)=>a-b)}
function updatePreviewSelectionInfo(){const seq=getPreviewSequence();const el=$('tl-preview-info');if(el)el.textContent=seq.length?'Preview: '+seq.map(i=>i+1).join(','):'Preview: all';const mark=$('btn-tl-mark');if(mark)mark.classList.toggle('active',S.selectedFrame>=0&&S.previewFrames.includes(S.selectedFrame))}
function togglePreviewFrame(i){if(i<0||i>=S.frames.length)return;const pos=S.previewFrames.indexOf(i);if(pos>=0)S.previewFrames.splice(pos,1);else S.previewFrames.push(i);S.previewFrames=[...new Set(S.previewFrames)].sort((a,b)=>a-b);S.previewCursor=0;updateTimeline()}
function clearPreviewFrames(){S.previewFrames=[];S.previewCursor=0;updateTimeline();toast('Preview subset cleared','success')}
function updateTimeline(){
  const body=$('tl-body');body.innerHTML='';
  S.frames.forEach((f,i)=>{
    const div=document.createElement('div');div.className='tl-frame'+(i===S.selectedFrame?' selected':'')+(S.previewFrames.includes(i)?' preview-selected':'');
    const tc=document.createElement('canvas');tc.width=48;tc.height=Math.max(8,Math.round(48*f.imgData.height/f.imgData.width));
    const tctx=tc.getContext('2d');
    const tmpC=document.createElement('canvas');tmpC.width=f.imgData.width;tmpC.height=f.imgData.height;
    tmpC.getContext('2d').putImageData(f.imgData,0,0);
    tctx.drawImage(tmpC,0,0,tc.width,tc.height);
    div.appendChild(tc);
    const idx=document.createElement('span');idx.className='tl-idx';idx.textContent=i+1;div.appendChild(idx);
    div.draggable=true;
    div.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey){togglePreviewFrame(i);return}S.selectedFrame=i;showFrame(i);updateTimeline()});
    div.addEventListener('dragstart',e=>{S.frameDragIndex=i;div.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(i))});
    div.addEventListener('dragend',()=>{S.frameDragIndex=null;div.classList.remove('dragging');document.querySelectorAll('.frame-chip.drop-target,.tl-frame.drop-target').forEach(n=>n.classList.remove('drop-target'))});
    div.addEventListener('dragover',e=>{e.preventDefault();div.classList.add('drop-target');e.dataTransfer.dropEffect='move'});
    div.addEventListener('dragleave',()=>div.classList.remove('drop-target'));
    div.addEventListener('drop',e=>{e.preventDefault();div.classList.remove('drop-target');const from=S.frameDragIndex??Number(e.dataTransfer.getData('text/plain'));moveFrame(from,i)});
    body.appendChild(div);
  });
  $('tl-frame-info').textContent=(S.selectedFrame+1)+'/'+S.frames.length;
  updatePreviewSelectionInfo();
}

// Playback
$('btn-tl-play').addEventListener('click',()=>{
  S.playing=!S.playing;
  $('btn-tl-play').textContent=S.playing?'\u23F8':'\u25B6';
  $('btn-tl-play').classList.toggle('active',S.playing);
  if(S.playing){
    S.playFps=+$('tl-fps').value||12;
    S.playInterval=setInterval(()=>{
      if(!S.frames.length)return;
      const seq=getPreviewSequence();
      if(seq.length){const pos=seq.indexOf(S.selectedFrame);S.previewCursor=pos>=0?(pos+1)%seq.length:(S.previewCursor%seq.length);S.selectedFrame=seq[S.previewCursor];}
      else S.selectedFrame=(S.selectedFrame+1)%S.frames.length;
      showFrame(S.selectedFrame);updateTimeline();
    },1000/S.playFps);
  } else {
    clearInterval(S.playInterval);
  }
});
function stepTimeline(delta){
  if(!S.frames.length)return;
  const seq=getPreviewSequence();
  if(seq.length){
    const pos=seq.indexOf(S.selectedFrame);
    const base=pos>=0?pos:S.previewCursor;
    S.previewCursor=(base+delta+seq.length)%seq.length;
    S.selectedFrame=seq[S.previewCursor];
  } else S.selectedFrame=(S.selectedFrame+delta+S.frames.length)%S.frames.length;
  showFrame(S.selectedFrame);updateTimeline();
}
$('btn-tl-prev').addEventListener('click',()=>stepTimeline(-1));
$('btn-tl-next').addEventListener('click',()=>stepTimeline(1));
$('btn-tl-mark').addEventListener('click',()=>togglePreviewFrame(S.selectedFrame));
$('btn-tl-clear').addEventListener('click',clearPreviewFrames);
function gotoIssue(dir=1){refreshReviewIssues();if(!S.reviewIssues.length){toast('No review issues','success');return}let pos=S.reviewIssues.findIndex(r=>r.index===S.selectedFrame);if(pos<0)pos=dir>0?-1:0;const next=S.reviewIssues[(pos+dir+S.reviewIssues.length)%S.reviewIssues.length];showFrame(next.index);toast('Issue frame '+(next.index+1)+': '+next.issues.join(', '))}
$('btn-next-issue').addEventListener('click',()=>gotoIssue(1));
$('btn-prev-issue').addEventListener('click',()=>gotoIssue(-1));
document.getElementById('btn-export-review-report').addEventListener('click',exportReviewReport);
$('frame-label').addEventListener('input',()=>{const f=S.frames[S.selectedFrame];if(f)f.label=$('frame-label').value});
$('frame-notes').addEventListener('input',()=>{const f=S.frames[S.selectedFrame];if(f)f.notes=$('frame-notes').value});

// ════════════════════════════════════════════
// ANCHOR & ALIGNMENT
// ════════════════════════════════════════════
$('btn-anchor-place').addEventListener('click',()=>{S.anchorMode=!S.anchorMode;container.classList.toggle('anchor-mode',S.anchorMode);$('btn-anchor-place').classList.toggle('btn-primary',S.anchorMode);$('btn-anchor-place').classList.toggle('btn-ghost',!S.anchorMode)});
$('btn-anchor-clear').addEventListener('click',()=>{S.anchor={x:0,y:0};$('anchor-x').value=0;$('anchor-y').value=0;$('anchor-x-num').value=0;$('anchor-y-num').value=0;$('ancx-val').textContent='0';$('ancy-val').textContent='0';drawOverlay();updateAnchorList();toast('Anchor cleared')});
$('chk-onion').addEventListener('change',()=>{S.showOnionSkin=$('chk-onion').checked;if(S.selectedFrame>=0)showFrame(S.selectedFrame)});
$('btn-onion').addEventListener('click',()=>{$('chk-onion').checked=!$('chk-onion').checked;$('chk-onion').dispatchEvent(new Event('change'));$('btn-onion').classList.toggle('active',$('chk-onion').checked)});

function updateAnchorList(){
  const list=$('anchor-list');list.innerHTML='';
  const item=document.createElement('div');item.className='anchor-item';
  const dot=document.createElement('span');dot.className='anchor-dot';dot.style.background='var(--warning)';
  const label=document.createElement('span');label.textContent='Anchor';
  const pos=document.createElement('span');pos.className='anchor-pos';pos.textContent='('+S.anchor.x+', '+S.anchor.y+')';
  item.append(dot,label,pos);list.appendChild(item);
}

// Stabilize: align all frames so anchor point is at the same pixel position
$('btn-stabilize').addEventListener('click',()=>{
  if(!S.frames.length){toast('Slice frames first','warning');return}
  // Find max dimensions needed after offset
  let maxW=0,maxH=0;
  S.frames.forEach(f=>{maxW=Math.max(maxW,f.imgData.width+Math.abs(f.offsetX));maxH=Math.max(maxH,f.imgData.height+Math.abs(f.offsetY))});
  // For each frame, compute offset so anchor aligns to anchor of frame 0
  const refAnchor=S.frames[0].anchor;
  S.frames.forEach((f,i)=>{
    if(i===0)return;
    const dx=refAnchor.x-f.anchor.x;
    const dy=refAnchor.y-f.anchor.y;
    if(dx===0&&dy===0)return;
    // Create new imgData with offset
    const nw=f.imgData.width+Math.abs(dx), nh=f.imgData.height+Math.abs(dy);
    const nd=new ImageData(Math.max(nw,f.imgData.width),Math.max(nh,f.imgData.height));
    const sd=f.imgData.data, dd=nd.data;
    const sx=dx>0?dx:0, sy=dy>0?dy:0;
    for(let y=0;y<f.imgData.height;y++){
      for(let x=0;x<f.imgData.width;x++){
        const sp=(y*f.imgData.width+x)*4;
        const dp=((y+sy)*nd.width+(x+sx))*4;
        dd[dp]=sd[sp];dd[dp+1]=sd[sp+1];dd[dp+2]=sd[sp+2];dd[dp+3]=sd[sp+3];
      }
    }
    f.imgData=nd;
    f.anchor={x:refAnchor.x,y:refAnchor.y};
  });
  showFrame(S.selectedFrame);updateFrameStrip();updateTimeline();
  toast('Frames stabilized to anchor','success');
});

// ════════════════════════════════════════════
// OVERLAY DRAWING
// ════════════════════════════════════════════
function drawOverlay(){
  ovCtx.clearRect(0,0,overlayCanvas.width,overlayCanvas.height);
  const iz=1/S.zoom;

  // Grid lines (import mode) — draw on full source image
  if(S.wf==='import'&&(S.sheetImageData||S.originalImageData)){
    const sheet=S.sheetImageData||S.originalImageData;
    const ow=sheet.width, oh=sheet.height;
    if(overlayCanvas.width!==ow||overlayCanvas.height!==oh){overlayCanvas.width=ow;overlayCanvas.height=oh;}
    const metrics=getGridMetrics();
    if(metrics){
      const {fw,fh,ox,oy,cols,rows}=metrics;
      ovCtx.save();

      if(ox>0||oy>0){
        ovCtx.fillStyle='rgba(167,139,250,0.12)';
        ovCtx.fillRect(0,0,overlayCanvas.width,oy);
        ovCtx.fillRect(0,0,ox,overlayCanvas.height);
      }

      for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
          const cx=ox+c*fw,cy=oy+r*fh;
          ovCtx.fillStyle='rgba(56,189,248,0.06)';
          ovCtx.fillRect(cx,cy,fw,fh);
        }
      }

      ovCtx.lineWidth=1*iz;ovCtx.strokeStyle='rgba(108,123,240,0.5)';ovCtx.setLineDash([4*iz,4*iz]);
      for(let x=ox;x<=overlayCanvas.width;x+=fw){ovCtx.beginPath();ovCtx.moveTo(x,0);ovCtx.lineTo(x,overlayCanvas.height);ovCtx.stroke()}
      for(let y=oy;y<=overlayCanvas.height;y+=fh){ovCtx.beginPath();ovCtx.moveTo(0,y);ovCtx.lineTo(overlayCanvas.width,y);ovCtx.stroke()}
      ovCtx.setLineDash([]);
      const selected=+$('grid-cell-index')?.value||0;
      Object.keys(S.cellOverrides||{}).forEach(k=>{const r=getEffectiveCellRect(+k,metrics);if(!r)return;ovCtx.strokeStyle='rgba(251,146,60,0.9)';ovCtx.lineWidth=2*iz;ovCtx.strokeRect(r.x,r.y,r.w,r.h)});
      const sr=getEffectiveCellRect(selected,metrics);if(sr){ovCtx.strokeStyle='rgba(250,204,21,0.95)';ovCtx.lineWidth=2*iz;ovCtx.strokeRect(sr.x,sr.y,sr.w,sr.h);ovCtx.font=(12*iz)+'px system-ui';ovCtx.fillStyle='rgba(250,204,21,0.95)';ovCtx.fillText('cell '+selected,sr.x+3*iz,sr.y+12*iz)}
      ovCtx.restore();
    }
  }

  // Anchor point (align mode or always if set)
  if(S.showAnchorOverlay&&(S.anchor.x>0||S.anchor.y>0)){
    ovCtx.save();
    const ax=S.anchor.x,ay=S.anchor.y;
    // Crosshair lines spanning the frame
    ovCtx.lineWidth=1*iz;
    ovCtx.strokeStyle='rgba(251,191,36,0.6)';
    ovCtx.beginPath();ovCtx.moveTo(ax,0);ovCtx.lineTo(ax,overlayCanvas.height);ovCtx.stroke();
    ovCtx.beginPath();ovCtx.moveTo(0,ay);ovCtx.lineTo(overlayCanvas.width,ay);ovCtx.stroke();
    // Circle
    const r=6*iz;
    ovCtx.beginPath();ovCtx.arc(ax,ay,r,0,Math.PI*2);
    ovCtx.fillStyle='rgba(251,191,36,0.8)';ovCtx.fill();
    ovCtx.lineWidth=1.5*iz;ovCtx.strokeStyle='#fff';ovCtx.stroke();
    // Label
    ovCtx.font=(10*iz)+'px system-ui';ovCtx.fillStyle='#fff';
    ovCtx.fillText('A('+ax+','+ay+')',ax+r+2*iz,ay-r);
    ovCtx.restore();
  }

  // Detected group outlines
  if(S.detectedGroups.length){
    ovCtx.save();ovCtx.lineWidth=2*iz;ovCtx.strokeStyle='rgba(74,222,128,0.8)';
    ovCtx.font=(14*iz)+'px system-ui';ovCtx.fillStyle='rgba(74,222,128,0.9)';
    S.detectedGroups.forEach((g,i)=>{ovCtx.strokeRect(g.minX,g.minY,g.width,g.height);ovCtx.fillText(String(i+1),g.minX+3*iz,g.minY+14*iz)});
    ovCtx.restore();
  }
  const legend=$('overlay-legend');if(legend)legend.style.display=(S.wf==='import'||S.detectedGroups.length)?'block':'none';
}

// ════════════════════════════════════════════
// CANVAS INTERACTION
// ════════════════════════════════════════════
function screenToCanvas(cx,cy){const r=container.getBoundingClientRect();return{x:(cx-r.left-S.panX)/S.zoom,y:(cy-r.top-S.panY)/S.zoom}}

container.addEventListener('wheel',e=>{e.preventDefault();const r=container.getBoundingClientRect();setZoom(S.zoom*(e.deltaY>0?.9:1.1),e.clientX-r.left,e.clientY-r.top)},{passive:false});
function startLayoutResize(kind,e){e.preventDefault();S.resizeDrag={kind,startX:e.clientX,startY:e.clientY,left:S.layout.leftWidth,right:S.layout.rightWidth,timeline:S.layout.timelineHeight};document.body.classList.add(kind==='timeline'?'layout-resizing-y':'layout-resizing');e.currentTarget.classList.add('dragging')}
function updateLayoutResize(e){const d=S.resizeDrag;if(!d)return;if(d.kind==='left')S.layout.leftWidth=clamp(d.left+(e.clientX-d.startX),180,520);else if(d.kind==='right')S.layout.rightWidth=clamp(d.right-(e.clientX-d.startX),180,560);else if(d.kind==='timeline')S.layout.timelineHeight=clamp(d.timeline-(e.clientY-d.startY),48,240);applyLayout()}
function endLayoutResize(){if(!S.resizeDrag)return;document.body.classList.remove('layout-resizing','layout-resizing-y');document.querySelectorAll('.resize-handle.dragging').forEach(h=>h.classList.remove('dragging'));S.resizeDrag=null;saveViewState();if(mainCanvas.width)maybeFitToView(false)}
document.querySelectorAll('.resize-handle').forEach(h=>{h.addEventListener('mousedown',e=>startLayoutResize(h.dataset.resize,e));h.addEventListener('dblclick',e=>{e.preventDefault();resetLayout(h.dataset.resize)})});
window.addEventListener('mousemove',updateLayoutResize);
window.addEventListener('mouseup',endLayoutResize);

function startPan(e){S.isPanning=true;S.panStartX=e.clientX;S.panStartY=e.clientY;S.panStartPanX=S.panX;S.panStartPanY=S.panY;container.classList.add('grabbing');setActiveTool('pan')}
container.addEventListener('mousedown',e=>{
  if(e.button!==0)return;
  const pos=screenToCanvas(e.clientX,e.clientY);
  if(S.spacePanKey||e.getModifierState?.('Space')){e.preventDefault();startPan(e);return}

  if(S.wf==='align'&&S.selectedFrame>=0&&S.selectedFrame<S.frames.length&&!S.anchorMode){
    e.preventDefault();
    S.frameDrag={startX:e.clientX,startY:e.clientY,frameIndex:S.selectedFrame,origImgData:cloneImageData(S.frames[S.selectedFrame].imgData)};
    setActiveTool('frame-align');
    return;
  }

  if(S.anchorMode){
    e.preventDefault();
    const snap=$('chk-snap-anchor').checked;
    let ax=Math.round(pos.x),ay=Math.round(pos.y);
    if(snap){const fw=+$('frame-w').value,fh=+$('frame-h').value;ax=Math.round(ax/fw)*fw;ay=Math.round(ay/fh)*fh}
    S.anchor={x:ax,y:ay};
    $('anchor-x').value=ax;$('anchor-y').value=ay;$('anchor-x-num').value=ax;$('anchor-y-num').value=ay;
    $('ancx-val').textContent=ax;$('ancy-val').textContent=ay;
    updateAnchorList();drawOverlay();
    if(S.selectedFrame>=0&&S.selectedFrame<S.frames.length)S.frames[S.selectedFrame].anchor={x:ax,y:ay};
    toast('Anchor set at '+ax+','+ay,'success');
    setActiveTool('anchor-place');
    return;
  }

  if(S.wf==='import'&&(S.sheetImageData||S.originalImageData)){
    e.preventDefault();
    const mode=$('grid-edit-mode')?.value||'grid';
    const metrics=getGridMetrics();
    if(mode==='cell'&&metrics&&!e.shiftKey&&!e.altKey&&!e.ctrlKey){
      const selected=Math.max(0,Math.min(metrics.cols*metrics.rows-1,+$('grid-cell-index').value||0));
      const base=getCellOverride(selected);
      S.gridDrag={mode:'cell',cell:selected,startX:e.clientX,startY:e.clientY,startOverride:{...base},resize:false};
      setActiveTool('cell-move');
    }else if(mode==='cell'&&metrics&&e.shiftKey&&!e.altKey&&!e.ctrlKey){
      const selected=Math.max(0,Math.min(metrics.cols*metrics.rows-1,+$('grid-cell-index').value||0));
      const base=getCellOverride(selected);
      S.gridDrag={mode:'cell',cell:selected,startX:e.clientX,startY:e.clientY,startOverride:{...base},resize:true};
      setActiveTool('cell-resize');
    }else if(e.shiftKey){
      S.gridDrag={mode:'grid-resize',startX:e.clientX,startY:e.clientY,startW:+$('frame-w').value,startH:+$('frame-h').value};
      setActiveTool('grid-resize');
    }else if(e.altKey){
      S.gridDrag={mode:'grid-gap',startX:e.clientX,startY:e.clientY,startOx:+$('grid-ox').value,startOy:+$('grid-oy').value};
      setActiveTool('grid-gap');
    }else if(e.ctrlKey||e.metaKey){
      S.gridDrag={mode:'grid-margin',startX:e.clientX,startY:e.clientY,startOx:+$('grid-ox').value,startOy:+$('grid-oy').value};
      setActiveTool('grid-margin');
    }else{
      S.gridDrag={mode:'grid',startX:e.clientX,startY:e.clientY,startOx:+$('grid-ox').value,startOy:+$('grid-oy').value,startW:+$('frame-w').value,startH:+$('frame-h').value,resize:false};
      setActiveTool('grid-move');
    }
    return;
  }

  startPan(e);
});
container.addEventListener('dblclick',e=>{
  if(S.wf==='import'&&($('grid-edit-mode')?.value||'grid')==='cell'){
    e.preventDefault();
    const idx=+$('grid-cell-index').value||0;
    pushUndo();setCellOverride(idx,{dx:0,dy:0,dw:0,dh:0});drawOverlay();toast('Cell override reset','success');
  }
});

container.addEventListener('mousemove',e=>{
  const pos=screenToCanvas(e.clientX,e.clientY);
  if(S.currentImageData){
    const px=Math.floor(pos.x),py=Math.floor(pos.y);
    if(px>=0&&py>=0&&px<mainCanvas.width&&py<mainCanvas.height){
      const p=(py*mainCanvas.width+px)*4,d=S.currentImageData.data;
      $('info-cursor').textContent=px+','+py+' rgba('+d[p]+','+d[p+1]+','+d[p+2]+','+d[p+3]+')';
    }else $('info-cursor').textContent=Math.round(pos.x)+','+Math.round(pos.y);
  }
  if(S.gridDrag){
    const dx=Math.round((e.clientX-S.gridDrag.startX)/Math.max(0.1,S.zoom));
    const dy=Math.round((e.clientY-S.gridDrag.startY)/Math.max(0.1,S.zoom));
    if(S.gridDrag.mode==='cell'){
      const base=S.gridDrag.startOverride||{dx:0,dy:0,dw:0,dh:0};
      if(S.gridDrag.resize)setCellOverride(S.gridDrag.cell,{...base,dw:base.dw+dx,dh:base.dh+dy});
      else setCellOverride(S.gridDrag.cell,{...base,dx:base.dx+dx,dy:base.dy+dy});
    }else if(S.gridDrag.mode==='grid-resize'){
      const fw=Math.max(1,S.gridDrag.startW+dx);
      const fh=Math.max(1,S.gridDrag.startH+dy);
      $('frame-w').value=fw;$('frame-w-num').value=fw;$('fw-val').textContent=fw;
      $('frame-h').value=fh;$('frame-h-num').value=fh;$('fh-val').textContent=fh;
    }else if(S.gridDrag.mode==='grid-gap'){
      const ox=Math.max(0,S.gridDrag.startOx+dx);
      const oy=Math.max(0,S.gridDrag.startOy+dy);
      $('grid-ox').value=ox;$('ox-val').textContent=ox;
      $('grid-oy').value=oy;$('oy-val').textContent=oy;
    }else if(S.gridDrag.mode==='grid-margin'){
      const ox=Math.max(0,S.gridDrag.startOx+dx);
      const oy=Math.max(0,S.gridDrag.startOy+dy);
      $('grid-ox').value=ox;$('ox-val').textContent=ox;
      $('grid-oy').value=oy;$('oy-val').textContent=oy;
    }else{
      const ox=Math.max(0,S.gridDrag.startOx+dx);
      const oy=Math.max(0,S.gridDrag.startOy+dy);
      $('grid-ox').value=ox;$('ox-val').textContent=ox;
      $('grid-oy').value=oy;$('oy-val').textContent=oy;
    }
    drawOverlay();
    return;
  }
  if(S.frameDrag){
    const dx=Math.round((e.clientX-S.frameDrag.startX)/Math.max(0.1,S.zoom));
    const dy=Math.round((e.clientY-S.frameDrag.startY)/Math.max(0.1,S.zoom));
    const f=S.frames[S.frameDrag.frameIndex];
    if(f){
      const orig=S.frameDrag.origImgData;
      const w=orig.width,h=orig.height;
      const nd=new ImageData(w,h);
      const sd=orig.data,dd=nd.data;
      for(let y=0;y<h;y++){
        for(let x=0;x<w;x++){
          const sx=x-dx,sy=y-dy;
          if(sx<0||sy<0||sx>=w||sy>=h)continue;
          const sp=(sy*w+sx)*4,dp=(y*w+x)*4;
          dd[dp]=sd[sp];dd[dp+1]=sd[sp+1];dd[dp+2]=sd[sp+2];dd[dp+3]=sd[sp+3];
        }
      }
      f.imgData=nd;
      S.currentImageData=nd;
      applyImageData(nd);drawOverlay();
    }
    return;
  }
  if(S.isPanning){S.panX=S.panStartPanX+(e.clientX-S.panStartX);S.panY=S.panStartPanY+(e.clientY-S.panStartY);markManualView();applyTransform()}
});
window.addEventListener('mouseup',(e)=>{
  if(S.frameDrag){
    const dx=Math.round((e.clientX-S.frameDrag.startX)/Math.max(0.1,S.zoom));
    const dy=Math.round((e.clientY-S.frameDrag.startY)/Math.max(0.1,S.zoom));
    if(dx!==0||dy!==0){
      pushUndo();
      toast('Frame shifted by '+dx+','+dy,'success');
      updateFrameStrip();updateTimeline();
    }
    S.frameDrag=null;
  }
  S.isPanning=false;S.draggingAnchor=false;S.gridDrag=null;container.classList.remove('grabbing');setActiveTool('idle')
});

// Zoom buttons
$('btn-zoom-in').addEventListener('click',()=>{const r=container.getBoundingClientRect();setZoom(S.zoom*1.25,r.width/2,r.height/2)});
$('btn-zoom-out').addEventListener('click',()=>{const r=container.getBoundingClientRect();setZoom(S.zoom*.8,r.width/2,r.height/2)});
$('btn-zoom-fit').addEventListener('click',()=>fitToView());
$('btn-auto-fit').addEventListener('click',()=>{S.autoFitFrames=!S.autoFitFrames;$('btn-auto-fit').classList.toggle('active',S.autoFitFrames);S.reviewFitReady=false;if(mainCanvas.width)fitToView();toast(S.autoFitFrames?'Auto-fit review on':'Review fit locked')});
$('btn-reset-layout').addEventListener('click',()=>resetLayout('all'));

// Undo/redo
$('btn-undo').addEventListener('click',undo);
$('btn-redo').addEventListener('click',redo);
document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;if(e.code==='Space'){S.spacePanKey=true;e.preventDefault();setActiveTool(S.isPanning?'pan':'space-pan-ready');return}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo()}if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();redo()}if(e.key==='o'){$('btn-onion').click()}if(e.key==='f'){e.preventDefault();fitToView()}if(e.key==='ArrowLeft'&&S.frames.length){e.preventDefault();$('btn-tl-prev').click()}if(e.key==='ArrowRight'&&S.frames.length){e.preventDefault();$('btn-tl-next').click()}if(e.key.toLowerCase()==='i'&&S.frames.length){e.preventDefault();gotoIssue(e.shiftKey?-1:1)}if(e.key==='m'&&S.frames.length){e.preventDefault();togglePreviewFrame(S.selectedFrame)}if(e.key==='Escape'&&S.previewFrames.length){e.preventDefault();clearPreviewFrames()}
// Batch queue shortcuts
if(S.batchQueue.length){
  if(e.key==='n'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();nextBatchItem()}
  if(e.key==='p'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();prevBatchItem()}
  if(e.key==='d'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();markBatchDone(true);toast('Marked done','success')}
  if(e.key==='s'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();markBatchDone(false);nextBatchItem()}
}});
window.addEventListener('blur',()=>{S.spacePanKey=false;if(!S.isPanning)setActiveTool('idle')});
window.addEventListener('keyup',e=>{if(e.code==='Space'){S.spacePanKey=false;if(!S.isPanning)setActiveTool('idle');e.preventDefault()}});

// ════════════════════════════════════════════
// PREVIEW
// ════════════════════════════════════════════
function analyzeFramePixels(imgData){if(!imgData)return null;const{width:w,height:h,data}=imgData;let pixels=0,minX=w,minY=h,maxX=-1,maxY=-1,soft=0,sx=0,sy=0,total=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=data[(y*w+x)*4+3];if(a>0){pixels++;if(a<255)soft++;if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y;sx+=x*a;sy+=y*a;total+=a}}return pixels?{pixels,soft,bbox:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1},center:{x:sx/total,y:sy/total}}:{pixels:0,soft:0,bbox:null,center:{x:w/2,y:h/2}}}
function countTransparentHoles(imgData,maxSize){if(!imgData)return{count:0,pixels:0};const{width:w,height:h,data}=imgData;const visited=new Uint8Array(w*h);const dirs=[[1,0],[-1,0],[0,1],[0,-1]];let count=0,pixels=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const idx=y*w+x;if(visited[idx]||data[idx*4+3]>0)continue;const comp=[];let edge=false;const stack=[[x,y]];visited[idx]=1;while(stack.length){const[cx,cy]=stack.pop();const ci=cy*w+cx;comp.push(ci);if(cx===0||cy===0||cx===w-1||cy===h-1)edge=true;for(const[dx,dy]of dirs){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=ny*w+nx;if(visited[ni]||data[ni*4+3]>0)continue;visited[ni]=1;stack.push([nx,ny])}}if(!edge&&comp.length<=maxSize){count++;pixels+=comp.length}}return{count,pixels}}
function hashImageData(imgData){let h=2166136261>>>0;const d=imgData.data;for(let i=0;i<d.length;i++){h^=d[i];h=Math.imul(h,16777619)>>>0}return h.toString(16).padStart(8,'0')}
function collectFrameReview(i){const f=S.frames[i];if(!f)return null;const m=analyzeFramePixels(f.imgData);const comps=findComponents(f.imgData,0);const stray=comps.filter(c=>c.count<+$('stray-size').value);const holes=countTransparentHoles(f.imgData,+$('stray-size').value);const ref=S.frames[0]?analyzeFramePixels(S.frames[0].imgData):m;const dx=ref&&m?m.center.x-ref.center.x:0,dy=ref&&m?m.center.y-ref.center.y:0;const issues=[];if(stray.length)issues.push('stray '+stray.reduce((a,c)=>a+c.count,0)+'px');if(holes.count)issues.push('holes '+holes.pixels+'px');if(Math.abs(dx)>+$('jitter-thresh').value||Math.abs(dy)>+$('jitter-thresh').value)issues.push('jitter '+dx.toFixed(1)+','+dy.toFixed(1));return{index:i,hash:hashImageData(f.imgData),pixels:m.pixels,soft:m.soft,bbox:m.bbox,center:m.center,anchor:f.anchor,anchorDelta:{x:f.anchor.x-S.frames[0].anchor.x,y:f.anchor.y-S.frames[0].anchor.y},strayCount:stray.length,strayPixels:stray.reduce((a,c)=>a+c.count,0),pinholeCount:holes.count,pinholePixels:holes.pixels,centerDelta:{x:dx,y:dy},issues,label:f.label||'',notes:f.notes||''}}
function refreshReviewIssues(){S.reviewIssues=S.frames.map((_,i)=>collectFrameReview(i)).filter(r=>r&&r.issues.length);const el=$('review-issue-list');if(el)el.textContent=S.reviewIssues.length?'Issues: '+S.reviewIssues.map(r=>'f'+(r.index+1)+' '+r.issues.join('/')).join(' | '):'Issues: none'}
function buildReviewReport(){const cols=+$('export-cols').value||1;const pad=+$('chk-no-pad').checked?0:+$('export-pad').value;const fw=S.frames[0]?.imgData.width||0,fh=S.frames[0]?.imgData.height||0;const cellW=fw+pad*2,cellH=fh+pad*2;const rows=Math.ceil((S.frames.length||1)/cols);const frames=S.frames.map((_,i)=>{const r=collectFrameReview(i),col=i%cols,row=Math.floor(i/cols);return{...r,col,row,sheetRect:{x:col*cellW+pad,y:row*cellH+pad,w:fw,h:fh}}}).filter(Boolean);const totals=frames.reduce((acc,r)=>{acc.pixels+=r.pixels;acc.soft+=r.soft;acc.strayPixels+=r.strayPixels;acc.pinholePixels+=r.pinholePixels;acc.jitterFrames+=r.issues.some(issue=>issue.startsWith('jitter '))?1:0;acc.issueFrames+=r.issues.length?1:0;return acc},{pixels:0,soft:0,strayPixels:0,pinholePixels:0,jitterFrames:0,issueFrames:0});return{version:1,name:$('manifest-name').value||'sprite',frameCount:S.frames.length,selectedFrame:S.selectedFrame,sheetLayout:{columns:cols,rows,padding:pad,frameWidth:fw,frameHeight:fh,cellWidth:cellW,cellHeight:cellH,sheetWidth:cellW*cols,sheetHeight:cellH*rows},settings:{straySize:+$('stray-size').value,jitterThresh:+$('jitter-thresh').value,outlineRadius:+$('outline-radius').value,softenRadius:+$('soften-radius').value,autoFitFrames:S.autoFitFrames,maxAutoFitZoom:S.maxAutoFitZoom},totals,batchHistory:S.batchHistory.slice(-10),frames}}
function exportReviewReport(){if(!S.frames.length){toast('Slice frames first','warning');return}const report=buildReviewReport();const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});const a=document.createElement('a');a.download=($('manifest-name').value||'sprite')+'_review-report.json';a.href=URL.createObjectURL(blob);a.click();URL.revokeObjectURL(a.href);toast('Review report exported','success')}
function updateFrameMetaInputs(){const f=S.frames[S.selectedFrame];if($('frame-label'))$('frame-label').value=f?(f.label||''):'';if($('frame-notes'))$('frame-notes').value=f?(f.notes||''):''}
function updateReviewMetrics(){const el=$('review-metrics');if(!el)return;refreshReviewIssues();updateFrameMetaInputs();const m=analyzeFramePixels(S.currentImageData);if(!m){el.textContent='Review: -';return}const frame=S.frames.length&&S.selectedFrame>=0?`f ${S.selectedFrame+1}/${S.frames.length} · `:'';const bbox=m.bbox?`bbox ${m.bbox.x},${m.bbox.y} ${m.bbox.w}x${m.bbox.h}`:'empty';const ctr=`ctr ${m.center.x.toFixed(1)},${m.center.y.toFixed(1)}`;let issue='';if(S.frames.length&&S.selectedFrame>=0){const r=collectFrameReview(S.selectedFrame);issue=r&&r.issues.length?' · '+r.issues.join(' · '):' · ok'}el.textContent=`Review: ${frame}${m.pixels}px · soft ${m.soft}px · ${bbox} · ${ctr}${issue}`}
function previewOpacityValue(){return Math.max(.15,Math.min(1,(+$('preview-opacity')?.value||70)/100))}
function applyPreviewOpacity(){if(previewCanvas)previewCanvas.style.opacity=String(previewOpacityValue());const v=$('preview-opacity-val');if(v)v.textContent=Math.round(previewOpacityValue()*100)+'%'}
function renderPreviewImageData(imgData,label){if(!imgData){renderPreviewEmpty(label);return}S.previewImageData=cloneImageData(imgData);S.previewMode=label;previewCanvas.width=imgData.width;previewCanvas.height=imgData.height;prevCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);prevCtx.putImageData(imgData,0,0);const show=previewModeValue()!=='current'||(S.wf==='cleanup');previewCanvas.style.display=show?'block':'none';applyPreviewOpacity()}
function previewModeValue(){return $('preview-mode')?.value||'current'}
function buildPreviewForMode(mode){
  if(mode==='original')return S.originalImageData?{img:S.originalImageData,label:'ORIGINAL'}:null;
  if(!S.currentImageData)return null;
  if(mode==='current')return{img:S.currentImageData,label:'CURRENT'};
  let img=cloneImageData(S.currentImageData),label='PREVIEW';
  if(mode==='alpha-clean'){img=cleanAlpha(img,+$('tolerance').value,+$('max-saturation').value,$('chk-edge-seed').checked,$('chk-remove-fringe').checked);label='ALPHA CLEAN PREVIEW'}
  else if(mode==='stray'){img=removeStrayPixels(img,+$('stray-size').value);label='PREVIEW STRAY'}
  else if(mode==='pinholes'){img=fillAlphaPinholes(img,+$('stray-size').value);label='PREVIEW PINHOLES'}
  else if(mode==='outline'){img=normalizeOutline(img,+$('outline-radius').value);label='OUTLINE PREVIEW'}
  return{img,label};
}
function updatePreview(){
  const mode=previewModeValue();
  const result=buildPreviewForMode(mode);
  if(result)renderPreviewImageData(result.img,result.label);
  else renderPreviewEmpty('PREVIEW');applyPreviewOpacity();
  updateReviewMetrics();
  if($('quick-guide-text'))requestAnimationFrame(refreshQuickGuide);
}
function setPreviewMode(mode){if($('preview-mode'))$('preview-mode').value=mode;updatePreview()}
$('btn-preview-cur').addEventListener('click',()=>setPreviewMode('current'));
$('btn-preview-orig').addEventListener('click',()=>setPreviewMode('original'));
$('btn-preview-stray').addEventListener('click',()=>setPreviewMode('stray'));
$('btn-preview-pinholes').addEventListener('click',()=>setPreviewMode('pinholes'));
$('btn-preview-outline').addEventListener('click',()=>setPreviewMode('outline'));
$('preview-mode').addEventListener('change',updatePreview);
$('preview-opacity')?.addEventListener('input',applyPreviewOpacity);

// ════════════════════════════════════════════
// ALPHA CLEANING
// ════════════════════════════════════════════
function colorDistance(r,g,b,tr,tg,tb){return Math.sqrt((r-tr)**2+(g-tg)**2+(b-tb)**2)}
function isBackgroundLike(r,g,b,tol,maxSat){const ts=[[255,255,255],[250,250,250],[245,245,245],[238,238,238],[230,230,230],[224,224,224],[216,216,216]];const mx=Math.max(r,g,b),mn=Math.min(r,g,b);if((mx-mn)>maxSat)return false;return ts.some(([tr,tg,tb])=>colorDistance(r,g,b,tr,tg,tb)<=tol)}

function cleanAlpha(imgData,tolerance,maxSat,edgeOnly,removeFringe){
  const{width:w,height:h,data}=imgData;const visited=new Uint8Array(w*h);const queue=[];
  function push(x,y){if(x<0||y<0||x>=w||y>=h)return;const i=y*w+x;if(visited[i])return;visited[i]=1;const p=i*4;if(data[p+3]===0||isBackgroundLike(data[p],data[p+1],data[p+2],tolerance,maxSat))queue.push([x,y])}
  if(edgeOnly){for(let x=0;x<w;x++){push(x,0);push(x,h-1)}for(let y=0;y<h;y++){push(0,y);push(w-1,y)}}else{for(let y=0;y<h;y++)for(let x=0;x<w;x++)push(x,y)}
  while(queue.length){const[x,y]=queue.pop();data[(y*w+x)*4+3]=0;push(x+1,y);push(x-1,y);push(x,y+1);push(x,y-1)}
  if(removeFringe){const copy=new Uint8ClampedArray(data);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const p=(y*w+x)*4;const a=copy[p+3];if(a>0&&a<128){let tr=0,tg=0,tb=0,tw=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const np=((y+dy)*w+(x+dx))*4;const na=copy[np+3];if(na>128){tr+=copy[np];tg+=copy[np+1];tb+=copy[np+2];tw++}}if(tw>0){data[p]=Math.round(tr/tw);data[p+1]=Math.round(tg/tw);data[p+2]=Math.round(tb/tw)}}}}
  return imgData;
}

function applyAlphaCleanupLive(notify=false){
  if(!S.currentImageData)return;
  let base;
  if(S.selectedFrame>=0&&S.selectedFrame<S.frames.length){
    base=cloneImageData(S.frames[S.selectedFrame].imgData);
  }else{
    if(!S.alphaCleanupBaseImageData&&S.currentImageData)S.alphaCleanupBaseImageData=cloneImageData(S.currentImageData);
    base=cloneImageData(S.alphaCleanupBaseImageData||S.currentImageData);
  }
  const cleaned=cleanAlpha(base,+$('tolerance').value,+$('max-saturation').value,$('chk-edge-seed').checked,$('chk-remove-fringe').checked);
  if(($('chk-force-transparent')&&$('chk-force-transparent').checked)||($('chk-force-transparent-frame')&&$('chk-force-transparent-frame').checked)){const d=cleaned.data;for(let i=3;i<d.length;i+=4)if(d[i]<8)d[i]=0}
  S.currentImageData=cleaned;
  if(S.selectedFrame>=0&&S.selectedFrame<S.frames.length)S.frames[S.selectedFrame].imgData=cloneImageData(cleaned);
  else setSheetImageData(cleaned);
  applyImageData(S.currentImageData);drawOverlay();updateFrameStrip();
  if(notify)toast('Background removed','success');
  refreshQuickGuide();
}

$('btn-clean-run').addEventListener('click',()=>{
  if(!S.currentImageData){toast('Load an image first','warning');return}
  pushUndo();
  applyAlphaCleanupLive(true);
});
let _cleanupPreviewTimer=null;
function debouncedCleanupPreview(){clearTimeout(_cleanupPreviewTimer);_cleanupPreviewTimer=setTimeout(()=>{if(S.wf==='cleanup'&&$('preview-mode'))$('preview-mode').value='alpha-clean';updatePreview()},60)}
['tolerance','max-saturation','chk-edge-seed','chk-remove-fringe','stray-size','outline-radius','chk-force-transparent'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',debouncedCleanupPreview)});

// ════════════════════════════════════════════
// ISLAND DETECTION
// ════════════════════════════════════════════
function findComponents(imgData,athresh,useColorFallback=false){const{width:w,height:h,data}=imgData;const visited=new Uint8Array(w*h);const comps=[];const tol=+$('tolerance').value||32;const sat=+$('max-saturation').value||18;const isFg=(p)=>{const a=data[p+3];if(a===0)return false;if(a>athresh)return true;if(!useColorFallback)return false;return !isBackgroundLike(data[p],data[p+1],data[p+2],tol,sat)};for(let y=0;y<h;y++)for(let x=0;x<w;x++){const idx=y*w+x;if(visited[idx])continue;visited[idx]=1;const p0=idx*4;if(!isFg(p0))continue;let minX=x,maxX=x,minY=y,maxY=y,count=0;const stack=[[x,y]];while(stack.length){const[cx,cy]=stack.pop();count++;if(cx<minX)minX=cx;if(cx>maxX)maxX=cx;if(cy<minY)minY=cy;if(cy>maxY)maxY=cy;for(const[nx,ny]of[[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1],[cx+1,cy+1],[cx-1,cy-1],[cx+1,cy-1],[cx-1,cy+1]]){if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=ny*w+nx;if(visited[ni])continue;visited[ni]=1;const np=ni*4;if(isFg(np))stack.push([nx,ny])}}comps.push({minX,minY,maxX,maxY,width:maxX-minX+1,height:maxY-minY+1,count})}return comps}
function boxesDist(a,b){const dx=Math.max(0,Math.max(a.minX-b.maxX,b.minX-a.maxX)),dy=Math.max(0,Math.max(a.minY-b.maxY,b.minY-a.maxY));return Math.sqrt(dx*dx+dy*dy)}
function mergeNearby(comps,dist){let groups=comps.map(c=>({...c}));let changed=true;while(changed){changed=false;outer:for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)if(boxesDist(groups[i],groups[j])<=dist){groups[i]={minX:Math.min(groups[i].minX,groups[j].minX),minY:Math.min(groups[i].minY,groups[j].minY),maxX:Math.max(groups[i].maxX,groups[j].maxX),maxY:Math.max(groups[i].maxY,groups[j].maxY),count:(groups[i].count||0)+(groups[j].count||0)};groups.splice(j,1);changed=true;break outer}}for(const g of groups){g.width=g.maxX-g.minX+1;g.height=g.maxY-g.minY+1;g.cx=(g.minX+g.maxX)/2;g.cy=(g.minY+g.maxY)/2}return groups}
function sortTopLeft(groups){const sorted=[...groups].sort((a,b)=>a.cy-b.cy);const rows=[];for(const g of sorted){let placed=false;for(const row of rows){const avgY=row.reduce((s,it)=>s+it.cy,0)/row.length;const avgH=row.reduce((s,it)=>s+it.height,0)/row.length;if(Math.abs(g.cy-avgY)<=Math.max(avgH*.75,20)){row.push(g);placed=true;break}}if(!placed)rows.push([g])}for(const row of rows)row.sort((a,b)=>a.cx-b.cx);rows.sort((a,b)=>a.reduce((s,it)=>s+it.cy,0)/a.length-b.reduce((s,it)=>s+it.cy,0)/b.length);return rows.flat()}

$('btn-detect').addEventListener('click',()=>{
  if(!S.currentImageData){toast('Load an image first','warning');return}
  const comps=findComponents(S.currentImageData,+$('alpha-threshold').value,true);
  const useful=comps.filter(c=>c.count>=8);
  S.detectedGroups=sortTopLeft(mergeNearby(useful,+$('merge-distance').value));
  const islandInfo=$('island-info');
  if(islandInfo)islandInfo.textContent=S.detectedGroups.length?`Detected ${S.detectedGroups.length} groups. Green boxes show bounds and ids.`:'No groups found. Try lower alpha threshold or remove BG first.';
  drawOverlay();toast('Detected '+S.detectedGroups.length+' groups','success');
  const sliceBtn=$('btn-slice-islands');if(sliceBtn)sliceBtn.disabled=!S.detectedGroups.length;
});

$('btn-slice-islands')?.addEventListener('click',()=>{
  if(!S.detectedGroups.length){toast('Detect islands first','warning');return}
  if(!S.currentImageData){toast('No image loaded','warning');return}
  pushUndo();
  const groups=S.detectedGroups;
  let maxW=0,maxH=0;
  groups.forEach(g=>{if(g.width>maxW)maxW=g.width;if(g.height>maxH)maxH=g.height});
  maxW=Math.max(1,maxW);maxH=Math.max(1,maxH);

  const sourceForSlice=S.sheetImageData||S.currentImageData;
  const tmpC=document.createElement('canvas');tmpC.width=sourceForSlice.width;tmpC.height=sourceForSlice.height;
  tmpC.getContext('2d').putImageData(sourceForSlice,0,0);

  S.frames=[];S.previewFrames=[];S.previewCursor=0;
  for(const g of groups){
    const fd=document.createElement('canvas');fd.width=maxW;fd.height=maxH;
    const fctx=fd.getContext('2d',{willReadFrequently:true});
    fctx.clearRect(0,0,maxW,maxH);
    const ox=Math.round((maxW-g.width)/2);
    const oy=maxH-g.height;
    fctx.drawImage(tmpC,g.minX,g.minY,g.width,g.height,ox,oy,g.width,g.height);
    S.frames.push({imgData:fctx.getImageData(0,0,maxW,maxH),anchor:{x:Math.round(maxW/2),y:maxH},offsetX:0,offsetY:0,label:'',notes:''});
  }
  S.anchor={x:Math.round(maxW/2),y:maxH};
  $('anchor-x').value=S.anchor.x;$('anchor-y').value=S.anchor.y;
  $('anchor-x-num').value=S.anchor.x;$('anchor-y-num').value=S.anchor.y;
  $('ancx-val').textContent=S.anchor.x;$('ancy-val').textContent=S.anchor.y;
  $('frame-w').value=maxW;$('frame-h').value=maxH;
  $('frame-w-num').value=maxW;$('frame-h-num').value=maxH;
  $('fw-val').textContent=maxW;$('fh-val').textContent=maxH;

  S.selectedFrame=0;
  S.reviewFitReady=false;
  updateAnchorList();updateFrameStrip();updateTimeline();showFrame(0);
  toast('Sliced '+S.frames.length+' frames from islands ('+maxW+'x'+maxH+', bottom-center anchor)','success');
  setStatus('Island slice: '+S.frames.length+' frames at '+maxW+'x'+maxH);
  refreshQuickGuide();
});

// ════════════════════════════════════════════
// PER-FRAME CLEANUP
// ════════════════════════════════════════════

// Remove stray pixels outside silhouette
function removeStrayPixels(imgData,maxSize){
  const{width:w,height:h,data}=imgData;
  // Find connected components, remove those with pixel count < maxSize
  const visited=new Uint8Array(w*h);const toRemove=new Set();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const idx=y*w+x;if(visited[idx]||data[idx*4+3]===0)continue;const component=[];const stack=[[x,y]];visited[idx]=1;while(stack.length){const[cx,cy]=stack.pop();component.push(cy*w+cx);for(const[nx,ny]of[[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]){if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=ny*w+nx;if(visited[ni]||data[ni*4+3]===0)continue;visited[ni]=1;stack.push([nx,ny])}}if(component.length<maxSize)component.forEach(i=>toRemove.add(i))}
  toRemove.forEach(i=>{data[i*4+3]=0;data[i*4]=0;data[i*4+1]=0;data[i*4+2]=0});
  return imgData;
}

// Fill small transparent holes fully enclosed by opaque pixels.
function fillAlphaPinholes(imgData,maxSize){
  const{width:w,height:h,data}=imgData;
  const visited=new Uint8Array(w*h);
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const idx=y*w+x;if(visited[idx]||data[idx*4+3]>0)continue;
    const component=[];let touchesEdge=false;const stack=[[x,y]];visited[idx]=1;
    while(stack.length){const[cx,cy]=stack.pop();const ci=cy*w+cx;component.push(ci);if(cx===0||cy===0||cx===w-1||cy===h-1)touchesEdge=true;for(const[dx,dy]of dirs){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=ny*w+nx;if(visited[ni]||data[ni*4+3]>0)continue;visited[ni]=1;stack.push([nx,ny])}}
    if(!touchesEdge&&component.length<=maxSize){
      component.forEach(i=>{let r=0,g=0,b=0,a=0,n=0;const cx=i%w,cy=Math.floor(i/w);for(const[dx,dy]of dirs){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const p=(ny*w+nx)*4;if(data[p+3]>0){r+=data[p];g+=data[p+1];b+=data[p+2];a+=data[p+3];n++}}const p=i*4;if(n){data[p]=Math.round(r/n);data[p+1]=Math.round(g/n);data[p+2]=Math.round(b/n);data[p+3]=Math.round(a/n)||255}});
    }
  }
  return imgData;
}

// Fix jitter: find the center of mass of each frame and shift to align
function shiftImageData(imgData,dx,dy){const out=new ImageData(imgData.width,imgData.height);const sd=imgData.data,dd=out.data;for(let y=0;y<imgData.height;y++)for(let x=0;x<imgData.width;x++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=imgData.width||ny>=imgData.height)continue;const sp=(y*imgData.width+x)*4,dp=(ny*imgData.width+nx)*4;dd[dp]=sd[sp];dd[dp+1]=sd[sp+1];dd[dp+2]=sd[sp+2];dd[dp+3]=sd[sp+3]}return out}
function fixJitter(frames,threshold,shiftPixels=false){
  if(frames.length<2)return frames;
  const refFrame=frames[0];
  const refCenter=centerOfMass(refFrame.imgData);
  frames.forEach((f,i)=>{
    if(i===0)return;
    const c=centerOfMass(f.imgData);
    const dx=Math.round(refCenter.x-c.x), dy=Math.round(refCenter.y-c.y);
    if(Math.abs(dx)>threshold||Math.abs(dy)>threshold){
      if(shiftPixels)f.imgData=shiftImageData(f.imgData,dx,dy);
      else if(f.anchor){f.anchor.x+=dx;f.anchor.y+=dy;}
    }
  });
  return frames;
}

function centerOfMass(imgData){
  const{width:w,height:h,data}=imgData;let sx=0,sy=0,total=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=data[(y*w+x)*4+3];if(a>0){sx+=x*a;sy+=y*a;total+=a}}
  return total>0?{x:sx/total,y:sy/total}:{x:w/2,y:h/2};
}

// Normalize outline thickness
function normalizeOutline(imgData,radius){
  if(radius<=0)return imgData;
  const{width:w,height:h,data}=imgData;
  // Erode then dilate (opening) to remove thin protrusions, then dilate to restore
  const eroded=erodeAlpha(imgData,1);
  const dilated=dilateAlpha(eroded,Math.max(1,radius));
  // Copy result back
  const dd=dilated.data;
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]>0&&dd[i+3]===0){data[i+3]=Math.min(data[i+3],64)} // thin protrusions fade
    else if(dd[i+3]>0&&data[i+3]===0){data[i]=dd[i];data[i+1]=dd[i+1];data[i+2]=dd[i+2];data[i+3]=dd[i+3]}
  }
  return imgData;
}

function erodeAlpha(imgData,r){
  const{width:w,height:h,data}=imgData;const out=new ImageData(w,h);const od=out.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=(y*w+x)*4;let minA=255;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h){minA=0;break}const np=(ny*w+nx)*4;if(data[np+3]<minA)minA=data[np+3];if(minA===0)break}od[p+3]=minA;if(minA>0){od[p]=data[p];od[p+1]=data[p+1];od[p+2]=data[p+2]}}
  return out;
}

function dilateAlpha(imgData,r){
  const{width:w,height:h,data}=imgData;const out=new ImageData(w,h);const od=out.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=(y*w+x)*4;let maxA=0,bestR=0,bestG=0,bestB=0,bestD=Infinity;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const np=(ny*w+nx)*4;if(data[np+3]>maxA||(data[np+3]===maxA&&data[np+3]>128)){const d=dx*dx+dy*dy;if(data[np+3]>maxA||d<bestD){maxA=data[np+3];bestR=data[np];bestG=data[np+1];bestB=data[np+2];bestD=d}}}od[p]=bestR;od[p+1]=bestG;od[p+2]=bestB;od[p+3]=maxA}
  return out;
}

// Soften edges
function applySoftening(imgData,radius){
  if(radius<=0)return imgData;const{width:w,height:h,data}=imgData;const r=Math.ceil(radius);
  const tmp=new Uint8ClampedArray(data);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=(y*w+x)*4;if(tmp[p+3]===0)continue;let sR=0,sG=0,sB=0,sA=0,tW=0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const d=Math.sqrt(dx*dx+dy*dy);if(d>radius)continue;const wt=1-d/(radius+1);const np=(ny*w+nx)*4;sR+=tmp[np]*wt;sG+=tmp[np+1]*wt;sB+=tmp[np+2]*wt;sA+=tmp[np+3]*wt;tW+=wt}if(tW>0){data[p]=Math.round(sR/tW);data[p+1]=Math.round(sG/tW);data[p+2]=Math.round(sB/tW);data[p+3]=Math.round(sA/tW)}}
  return imgData;
}

// Button handlers
$('btn-remove-stray').addEventListener('click',()=>{
  if(S.selectedFrame<0||!S.frames.length){toast('Slice frames first','warning');return}
  pushUndo();
  if(S.frames.length&&S.selectedFrame>=0){
    const f=S.frames[S.selectedFrame];f.imgData=removeStrayPixels(cloneImageData(f.imgData),+$('stray-size').value);
    S.currentImageData=f.imgData;applyImageData(S.currentImageData);showFrame(S.selectedFrame);
  } else if(S.currentImageData){
    S.currentImageData=removeStrayPixels(cloneImageData(S.currentImageData),+$('stray-size').value);
    applyImageData(S.currentImageData);
  }
  toast('Stray pixels removed','success');
});

$('btn-fix-pinholes').addEventListener('click',()=>{
  if(S.selectedFrame<0||!S.frames.length){toast('Slice frames first','warning');return}
  pushUndo();
  const f=S.frames[S.selectedFrame];f.imgData=fillAlphaPinholes(cloneImageData(f.imgData),+$('stray-size').value);
  S.currentImageData=f.imgData;applyImageData(S.currentImageData);showFrame(S.selectedFrame);toast('Pinholes filled','success');
});

$('btn-fix-jitter').addEventListener('click',()=>{
  if(!S.frames.length){toast('Slice frames first','warning');return}
  pushUndo();fixJitter(S.frames,+$('jitter-thresh').value,$('chk-jitter-shift').checked);showFrame(S.selectedFrame);updateFrameStrip();updateTimeline();toast('Jitter fixed','success');
});

$('btn-normalize-outline').addEventListener('click',()=>{
  if(S.selectedFrame<0||!S.frames.length){toast('Slice frames first','warning');return}
  pushUndo();
  const f=S.frames[S.selectedFrame];f.imgData=normalizeOutline(cloneImageData(f.imgData),+$('outline-radius').value);
  S.currentImageData=f.imgData;applyImageData(S.currentImageData);showFrame(S.selectedFrame);toast('Outline normalized','success');
});

$('btn-soften').addEventListener('click',()=>{
  if(S.selectedFrame<0||!S.frames.length){toast('Slice frames first','warning');return}
  pushUndo();
  const f=S.frames[S.selectedFrame];f.imgData=applySoftening(cloneImageData(f.imgData),+$('soften-radius').value);
  // Also apply erode/dilate
  const erode=+$('alpha-erode').value,dilate=+$('alpha-dilate').value;
  if(erode>0){const e=erodeAlpha(f.imgData,erode);f.imgData=new ImageData(new Uint8ClampedArray(e.data),e.width,e.height)}
  if(dilate>0){const d=dilateAlpha(f.imgData,dilate);f.imgData=new ImageData(new Uint8ClampedArray(d.data),d.width,d.height)}
  S.currentImageData=f.imgData;applyImageData(S.currentImageData);showFrame(S.selectedFrame);toast('Softening applied','success');
});

// Cleanup all frames
$('btn-cleanup-all').addEventListener('click',()=>{
  if(!S.frames.length){toast('Slice frames first','warning');return}
  const beforeIssues=S.frames.map((_,i)=>collectFrameReview(i)).filter(r=>r&&r.issues.length);
  const summary='Cleanup '+S.frames.length+' frame(s). Current issues: '+(beforeIssues.length?beforeIssues.map(r=>'f'+(r.index+1)+' '+r.issues.join('/')).join('; '):'none')+'. Continue?';
  if(!confirm(summary))return;
  const beforeReport=buildReviewReport();
  pushUndo();
  const stray=+$('stray-size').value,outlineR=+$('outline-radius').value,softenR=+$('soften-radius').value;
  const erode=+$('alpha-erode').value,dilate=+$('alpha-dilate').value;
  S.frames.forEach((f,i)=>{
    let fd=cloneImageData(f.imgData);
    fd=removeStrayPixels(fd,stray);
    fd=fillAlphaPinholes(fd,stray);
    if(outlineR>0)fd=normalizeOutline(fd,outlineR);
    if(softenR>0)fd=applySoftening(fd,softenR);
    if(erode>0){const e=erodeAlpha(fd,erode);fd=new ImageData(new Uint8ClampedArray(e.data),e.width,e.height)}
    if(dilate>0){const d=dilateAlpha(fd,dilate);fd=new ImageData(new Uint8ClampedArray(d.data),d.width,d.height)}
    if(forceTransparentCleanupEnabled()){const d=fd.data;for(let j=3;j<d.length;j+=4)if(d[j]<8)d[j]=0}
    f.imgData=fd;
  });
  fixJitter(S.frames,+$('jitter-thresh').value,$('chk-jitter-shift').checked);
  showFrame(S.selectedFrame);updateFrameStrip();updateTimeline();
  const afterReport=buildReviewReport();
  S.batchHistory.push({kind:'cleanup-all',at:new Date().toISOString(),before:beforeReport.totals,after:afterReport.totals,delta:{issueFrames:afterReport.totals.issueFrames-beforeReport.totals.issueFrames,strayPixels:afterReport.totals.strayPixels-beforeReport.totals.strayPixels,pinholePixels:afterReport.totals.pinholePixels-beforeReport.totals.pinholePixels,jitterFrames:afterReport.totals.jitterFrames-beforeReport.totals.jitterFrames}});
  toast('All frames cleaned up','success');
});

// ════════════════════════════════════════════
// EXPORT & REPACK
// ════════════════════════════════════════════
function getExportScale(){return Math.max(0.1,Math.min(4,(+$('export-scale')?.value||100)/100))}

function scaleCanvas(srcCanvas,scale){
  if(Math.abs(scale-1)<0.001)return srcCanvas;
  const sw=Math.round(srcCanvas.width*scale),sh=Math.round(srcCanvas.height*scale);
  const out=document.createElement('canvas');out.width=sw;out.height=sh;
  const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=scale<1;ctx.imageSmoothingQuality='high';
  ctx.drawImage(srcCanvas,0,0,sw,sh);
  return out;
}

function repackSheet(){
  if(!S.frames.length){toast('Slice frames first','warning');return}
  const cols=+$('export-cols').value, pad=+$('chk-no-pad').checked?0:+$('export-pad').value;
  const scale=getExportScale();
  const fw=Math.round(S.frames[0].imgData.width*scale), fh=Math.round(S.frames[0].imgData.height*scale);
  const cellW=fw+pad*2, cellH=fh+pad*2;
  const rows=Math.ceil(S.frames.length/cols);
  const outW=cellW*cols, outH=cellH*rows;
  const outC=document.createElement('canvas');outC.width=outW;outC.height=outH;
  const outCtx=outC.getContext('2d');outCtx.clearRect(0,0,outW,outH);
  outCtx.imageSmoothingEnabled=scale<1;outCtx.imageSmoothingQuality='high';

  S.frames.forEach((f,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const dx=col*cellW+pad, dy=row*cellH+pad;
    const tmpC=document.createElement('canvas');tmpC.width=f.imgData.width;tmpC.height=f.imgData.height;
    tmpC.getContext('2d').putImageData(f.imgData,0,0);
    outCtx.drawImage(tmpC,0,0,f.imgData.width,f.imgData.height,dx,dy,fw,fh);
  });

  return outC;
}

$('btn-repack').addEventListener('click',()=>{
  const outC=repackSheet();if(!outC)return;
  const imgData=outC.getContext('2d').getImageData(0,0,outC.width,outC.height);
  S.currentImageData=imgData;mainCanvas.width=outC.width;mainCanvas.height=outC.height;
  ctx.putImageData(imgData,0,0);updateOverlaySize();S.reviewFitReady=false;
  requestAnimationFrame(()=>{fitToView();updatePreview();updateInfoSize();drawOverlay()});
  toast('Sheet repacked','success');
});

$('btn-export-png').addEventListener('click',()=>{
  const outC=repackSheet();if(!outC){toast('Nothing to export','warning');return}
  const a=document.createElement('a');a.download=($('manifest-name').value||'sprite')+'_sheet.png';
  a.href=outC.toDataURL('image/png');a.click();toast('PNG exported','success');
});

function pushAscii(out,str){for(let i=0;i<str.length;i++)out.push(str.charCodeAt(i))}
function pushU16(out,n){out.push(n&255,(n>>8)&255)}
function writeGifSubBlocks(out,bytes){let off=0;while(off<bytes.length){const n=Math.min(255,bytes.length-off);out.push(n);for(let i=0;i<n;i++)out.push(bytes[off+i]);off+=n}out.push(0)}
function bitPackGifCodes(codes,minCodeSize){let cur=0,bits=0;const out=[];const write=(code,size)=>{cur|=code<<bits;bits+=size;while(bits>=8){out.push(cur&255);cur>>=8;bits-=8}};for(const c of codes)write(c,minCodeSize+1);if(bits>0)out.push(cur&255);return out}
function lzwEncodeFlatIndices(indices,minCodeSize){const clear=1<<minCodeSize,end=clear+1;const codes=[clear];for(const idx of indices)codes.push(idx);codes.push(end);return bitPackGifCodes(codes,minCodeSize)}
function collectGifPalette(frames){const colors=new Map();let transparent=false;for(const f of frames){const d=f.imgData.data;for(let i=0;i<d.length;i+=4){const a=d[i+3];if(a<128){transparent=true;continue}const r=Math.round(d[i]/51)*51,g=Math.round(d[i+1]/51)*51,b=Math.round(d[i+2]/51)*51;const key=`${r},${g},${b}`;if(!colors.has(key)&&colors.size<255)colors.set(key,[r,g,b])}}const palette=[[0,0,0],...colors.values()];while(palette.length<256)palette.push([0,0,0]);return{palette,transparent}}
function encodeGifBlob(){
  if(!S.frames.length){toast('Slice frames first','warning');return null}
  const fw=S.frames[0].imgData.width,fh=S.frames[0].imgData.height;
  if(!S.frames.every(f=>f.imgData.width===fw&&f.imgData.height===fh)){toast('GIF export requires stable frame size','error');return null}
  const fps=+$('manifest-fps').value||12,delayCs=Math.max(1,Math.round(100/fps));
  const loopCount=Math.max(0,+$('manifest-loop').value||0);
  const {palette,transparent}=collectGifPalette(S.frames),out=[];
  pushAscii(out,'GIF89a');pushU16(out,fw);pushU16(out,fh);out.push(0xF7,0,0); // global 256-color table
  palette.forEach(([r,g,b])=>out.push(r,g,b));
  // Netscape loop extension; 0 means infinite, otherwise finite loop count.
  out.push(0x21,0xFF,11);pushAscii(out,'NETSCAPE2.0');out.push(3,1);pushU16(out,loopCount);out.push(0);
  for(const f of S.frames){
    out.push(0x21,0xF9,4,transparent?0x09:0x08);pushU16(out,delayCs);out.push(0,0);
    out.push(0x2C);pushU16(out,0);pushU16(out,0);pushU16(out,fw);pushU16(out,fh);out.push(0);
    const d=f.imgData.data,idx=[];
    const colorToIndex=new Map();palette.forEach((c,i)=>{if(i>0)colorToIndex.set(c.join(','),i)});
    for(let i=0;i<d.length;i+=4){if(d[i+3]<128){idx.push(0);continue}const r=Math.round(d[i]/51)*51,g=Math.round(d[i+1]/51)*51,b=Math.round(d[i+2]/51)*51;idx.push(colorToIndex.get(`${r},${g},${b}`)||1)}
    out.push(8);writeGifSubBlocks(out,lzwEncodeFlatIndices(idx,8));
  }
  out.push(0x3B);return new Blob([new Uint8Array(out)],{type:'image/gif'})
}
function exportGif(){const blob=encodeGifBlob();if(!blob)return;const a=document.createElement('a');a.download=($('manifest-name').value||'sprite')+'.gif';a.href=URL.createObjectURL(blob);a.click();URL.revokeObjectURL(a.href);toast('GIF exported','success')}

$('btn-export-gif').addEventListener('click',exportGif);

function targetContractInfo(target=($('target-contract')?.value||'generic')){
  const map={
    generic:{id:'generic',label:'Generic atlas',cols:+$('export-cols').value||8,rows:null,pageSize:null,namespace:'generic',gridKey:'grid'},
    'badger-runner':{id:'badger-runner',label:'Badger Runner',cols:4,rows:4,pageSize:16,namespace:'badger-runner',gridKey:'grid'},
    'ethic-brawl-core':{id:'ethic-brawl-core',label:'Ethic Brawl core',cols:4,rows:4,pageSize:16,namespace:'ethic-brawl',gridKey:'core_4x4'},
    'ethic-brawl-extended':{id:'ethic-brawl-extended',label:'Ethic Brawl extended',cols:4,rows:4,pageSize:16,namespace:'ethic-brawl',gridKey:'extended_4x4'},
  };
  return map[target]||map.generic;
}
function contractReadiness(info=targetContractInfo()){
  const fw=S.frames[0]?.imgData.width||0,fh=S.frames[0]?.imgData.height||0;
  const stable=S.frames.length>0&&S.frames.every(f=>f.imgData.width===fw&&f.imgData.height===fh);
  const orderCount=parseFrameOrderText().length||S.frames.length;
  const reviewIssues=S.frames.length?buildReviewReport().totals.issueFrames:0;
  const targetChosen=info.id!=='generic';
  const cols=+$('export-cols').value||1,pad=+$('chk-no-pad').checked?0:+$('export-pad').value;
  return[
    {id:'target',label:'Target selected: '+info.label,ok:targetChosen,warn:!targetChosen,msg:targetChosen?'ready':'choose Badger or Ethic target'},
    {id:'frames',label:'Frames sliced',ok:S.frames.length>0,msg:S.frames.length?`${S.frames.length} frame(s)`:'slice a grid first'},
    {id:'stable',label:'Stable frame size',ok:stable,msg:stable?`${fw}x${fh}`:'all frames must share size'},
    {id:'layout',label:'Strict 4x4 page layout',ok:info.pageSize?cols===4&&pad===0:true,msg:info.pageSize?`${cols} cols, ${pad}px pad`:'generic layout'},
    {id:'order',label:'Frame order covers every frame',ok:orderCount===S.frames.length&&S.frames.length>0,msg:`${orderCount}/${S.frames.length}`},
    {id:'review',label:'No unresolved review issues',ok:S.frames.length>0&&reviewIssues===0,warn:S.frames.length>0&&reviewIssues>0,msg:reviewIssues?`${reviewIssues} issue frame(s)`:'clean'},
  ];
}
function renderCheckRows(box,checks,cls='contract-check'){
  if(!box)return;
  box.textContent='';
  checks.forEach(check=>{
    const row=document.createElement('div');
    row.className=cls+' '+(check.ok?'done':check.warn?'warn':'fail');
    row.textContent=(check.ok?'✓ ':check.warn?'! ':'□ ')+check.label+' — '+check.msg;
    box.appendChild(row);
  });
}
function nextReassemblyAction(info=targetContractInfo()){
  const checks=contractReadiness(info);
  const firstFail=checks.find(c=>!c.ok&&!c.warn);
  if(!S.currentImageData&&!S.sheetImageData)return{label:'Load Image',run:()=>$('file-input')?.click(),detail:'Start by loading or dropping a source sheet.'};
  if(!S.frames.length)return{label:'Slice Frames',run:()=>setWorkflow('import'),detail:'Set the grid, then slice frames.'};
  if(info.id==='generic')return{label:'Pick Target',run:()=>setWorkflow('export'),detail:'Choose Badger or Ethic for directly usable pages.'};
  if(firstFail?.id==='stable')return{label:'Review Frame Sizes',run:()=>setWorkflow('repair'),detail:firstFail.msg};
  if(firstFail?.id==='layout')return{label:'Apply 4x4 Layout',run:setContract4x4Layout,detail:firstFail.msg};
  if(firstFail?.id==='order')return{label:'Fix Order',run:()=>setWorkflow('export'),detail:firstFail.msg};
  const warn=checks.find(c=>c.warn);
  if(warn?.id==='review')return{label:'Review Issues',run:()=>setWorkflow('repair'),detail:warn.msg};
  return{label:'Export Ready Grid',run:exportContractPages,detail:'All hard checks pass.'};
}
function renderReassemblyChecklist(info=targetContractInfo()){
  const checks=contractReadiness(info);
  renderCheckRows($('reassembly-checklist'),checks,'contract-check');
  renderReassemblyAssistant(info,checks);
}
function setPill(id,text,state){const el=$(id);if(!el)return;el.textContent=text;el.classList.remove('ok','warn','fail');if(state)el.classList.add(state)}
function updateReassemblyHud(info=targetContractInfo(),checks=contractReadiness(info)){
  const pageSize=info.pageSize||Math.max(1,+$('export-cols').value||1);
  const pages=S.frames.length?Math.ceil(S.frames.length/pageSize):0;
  const hardFails=checks.filter(c=>!c.ok&&!c.warn),warns=checks.filter(c=>c.warn);
  setPill('info-target','target: '+(info.id==='generic'?'generic':info.label),info.id==='generic'?'warn':'ok');
  setPill('info-pages','pages: '+(pages||'-'),S.frames.length?info.pageSize?'ok':'warn':'fail');
  setPill('info-ready','ready: '+(!hardFails.length&&S.frames.length?'yes':hardFails.length?hardFails[0].id:'no'),!S.frames.length?'fail':hardFails.length?'fail':warns.length?'warn':'ok');
  if($('task-order-strip'))renderTaskOrder();
}
function renderExportPreview(info=targetContractInfo(),checks=contractReadiness(info)){
  const el=$('export-preview');if(!el)return;
  el.classList.remove('ready','warn','fail');
  if(!S.frames.length){el.textContent='Export preview appears after slicing frames.';el.classList.add('fail');return}
  const name=$('manifest-name')?.value||'sprite',hardFails=checks.filter(c=>!c.ok&&!c.warn),warns=checks.filter(c=>c.warn);
  const pageSize=info.pageSize||Math.max(1,+$('export-cols').value||1),pages=Math.ceil(S.frames.length/pageSize);
  const files=info.pageSize?Array.from({length:pages},(_,i)=>`${name}_${info.id}_p${String(i+1).padStart(2,'0')}.png`).concat(`${name}_${info.id}_manifest.json`):[`${name}_sheet.png`,`${name}_sprites.json`];
  el.textContent=`Target: ${info.label}\nFrames: ${S.frames.length} → ${pages} page(s)\nFiles:\n- ${files.join('\n- ')}`;
  el.classList.add(hardFails.length?'fail':warns.length?'warn':'ready');
}
function renderPageMap(container,info=targetContractInfo(),compact=false){
  const box=typeof container==='string'?$(container):container;if(!box)return;
  box.textContent='';
  if(!S.frames.length){box.textContent='No frames to page yet.';return}
  const pageSize=info.pageSize||Math.max(1,+$('export-cols').value||1),cols=info.pageSize?4:Math.max(1,+$('export-cols').value||1),pages=Math.ceil(S.frames.length/pageSize);
  for(let p=0;p<pages;p++){
    const card=document.createElement('div');card.className='page-card'+(S.selectedFrame>=p*pageSize&&S.selectedFrame<Math.min(S.frames.length,(p+1)*pageSize)?' active':'');
    const title=document.createElement('div');title.className='page-title';
    const name=document.createElement('span');name.textContent='Page '+(p+1);
    const count=document.createElement('span');const start=p*pageSize,end=Math.min(S.frames.length,start+pageSize);count.textContent=(start+1)+'-'+end;
    title.append(name,count);card.appendChild(title);
    const cells=document.createElement('div');cells.className='page-cells';cells.style.gridTemplateColumns='repeat('+Math.min(4,cols)+',1fr)';
    const shown=info.pageSize?16:Math.min(pageSize,S.frames.length-start);
    for(let i=0;i<shown;i++){
      const idx=start+i,cell=document.createElement('button');cell.type='button';cell.className='page-cell '+(idx<S.frames.length?'filled':'empty')+(idx===S.selectedFrame?' selected':'');cell.textContent=idx<S.frames.length?String(idx+1):'';cell.disabled=idx>=S.frames.length;
      if(idx<S.frames.length){cell.title='Show frame '+(idx+1);cell.addEventListener('click',()=>showFrame(idx))}
      cells.appendChild(cell);
    }
    card.appendChild(cells);box.appendChild(card);
    if(compact&&p>=2&&pages>3){const more=document.createElement('div');more.className='page-card';more.textContent='+'+(pages-p-1)+' more';box.appendChild(more);break}
  }
}
function renderReassemblyAssistant(info=targetContractInfo(),checks=contractReadiness(info)){
  updateReassemblyHud(info,checks);
  renderExportPreview(info,checks);
  renderPageMap('assistant-pages',info,true);renderPageMap('contract-page-map',info,false);
  const status=$('assistant-status'),box=$('assistant-checks'),next=$('btn-assist-next'),exportBtn=$('btn-assist-export');
  if(status){
    const pages=info.pageSize?Math.max(1,Math.ceil((S.frames.length||0)/info.pageSize)):Math.max(1,Math.ceil((S.frames.length||0)/Math.max(1,+$('export-cols').value||1)));
    status.textContent=!S.frames.length?'Load → cleanup → slice → target → reorder → export.':`${info.label}: ${S.frames.length} frame(s), ${pages} page(s), ${checks.filter(c=>c.ok).length}/${checks.length} checks ready.`;
  }
  renderCheckRows(box,checks.slice(0,4),'assistant-check-row');
  document.querySelectorAll('#btn-assist-badger,#btn-assist-ethic-core,#btn-assist-ethic-ext').forEach(b=>b.classList.remove('active'));
  const activeId=info.id==='badger-runner'?'btn-assist-badger':info.id==='ethic-brawl-core'?'btn-assist-ethic-core':info.id==='ethic-brawl-extended'?'btn-assist-ethic-ext':'';
  if(activeId&&$(activeId))$(activeId).classList.add('active');
  const action=nextReassemblyAction(info);
  if(next){next.textContent=action.label;next.onclick=action.run}
  if(exportBtn){const hardFails=checks.filter(c=>!c.ok&&!c.warn);exportBtn.disabled=!!hardFails.length;exportBtn.onclick=exportContractPages;exportBtn.title=hardFails.length?'Blocked: '+hardFails[0].label:'Export contract pages'}
}
function updateReassemblyGuide(){
  const info=targetContractInfo();
  const guide=$('reassembly-guide');
  if(guide){
    const pages=Math.max(1,Math.ceil((S.frames.length||1)/(info.pageSize||Math.max(1,+$('export-cols').value||1))));
    guide.textContent=info.pageSize?`${info.label}: strict 4 columns × 4 rows, transparent background, stable frame size. ${S.frames.length>16?`This will export ${pages} numbered pages.`:'This will export one directly usable page.'}`:'Generic atlas: uses the Columns and Padding settings above. Choose Badger/Ethic for downstream-ready 4x4 pages.';
  }
  if(info.pageSize){$('export-cols').value=4;$('cols-val').textContent='4';$('chk-no-pad').checked=true;$('export-pad').value=0;$('pad-val').textContent='0'}
  renderReassemblyChecklist(info);updateContractPageInfo();refreshSpecGuide();
}
function setContract4x4Layout(){
  $('target-contract').value=$('target-contract').value==='generic'?'badger-runner':$('target-contract').value;
  $('export-cols').value=4;$('cols-val').textContent='4';$('export-pad').value=0;$('pad-val').textContent='0';$('chk-no-pad').checked=true;
  syncFrameOrderText();updateReassemblyGuide();toast('4x4 contract layout set','success');
}
function buildSheetCanvasForFrames(frames,cols,pad,scale=1){
  if(!frames.length)return null;
  const fw=Math.round(frames[0].imgData.width*scale),fh=Math.round(frames[0].imgData.height*scale),cellW=fw+pad*2,cellH=fh+pad*2;
  const rows=Math.ceil(frames.length/cols),out=document.createElement('canvas');out.width=cellW*cols;out.height=cellH*rows;
  const outCtx=out.getContext('2d');outCtx.clearRect(0,0,out.width,out.height);
  outCtx.imageSmoothingEnabled=scale<1;outCtx.imageSmoothingQuality='high';
  frames.forEach((f,i)=>{const c=i%cols,r=Math.floor(i/cols),tmp=document.createElement('canvas');tmp.width=f.imgData.width;tmp.height=f.imgData.height;tmp.getContext('2d').putImageData(f.imgData,0,0);outCtx.drawImage(tmp,0,0,f.imgData.width,f.imgData.height,c*cellW+pad,r*cellH+pad,fw,fh)});
  return out;
}
function exportContractPages(){
  if(!S.frames.length){toast('Slice frames first','warning');return}
  const info=targetContractInfo();
  const checks=contractReadiness(info), hardFails=checks.filter(c=>!c.ok&&!c.warn);
  if(hardFails.length){renderReassemblyChecklist(info);toast('Not export-ready: '+hardFails[0].label,'error');return}
  if(!info.pageSize){$('btn-export-png').click();$('btn-export-manifest').click();return}
  const name=$('manifest-name').value||'sprite',pad=0,cols=4;
  const pages=[];
  for(let start=0;start<S.frames.length;start+=info.pageSize){
    const pageFrames=S.frames.slice(start,start+info.pageSize);
    const canvas=buildSheetCanvasForFrames(pageFrames,cols,pad);
    const pageIndex=pages.length;
    pages.push({pageIndex,startFrame:start,frameCount:pageFrames.length,file:`${name}_${info.id}_p${String(pageIndex+1).padStart(2,'0')}.png`,canvas});
  }
  pages.forEach(p=>{const a=document.createElement('a');a.download=p.file;a.href=p.canvas.toDataURL('image/png');a.click()});
  const fw=S.frames[0].imgData.width,fh=S.frames[0].imgData.height;
  const manifest={
    name,target:info.id,targetLabel:info.label,namespace:info.namespace,gridKey:info.gridKey,
    grid:{columns:4,rows:4,framesPerPage:16,padding:0,frameWidth:fw,frameHeight:fh},
    transparentBackground:true,stableFrameSize:S.frames.every(f=>f.imgData.width===fw&&f.imgData.height===fh),
    pageCount:pages.length,totalFrames:S.frames.length,order:S.frames.map((_,i)=>i),
    pages:pages.map(p=>({pageIndex:p.pageIndex,file:p.file,startFrame:p.startFrame,frameCount:p.frameCount,columns:4,rows:4})),
    animations:{[name]:{frames:S.frames.length,fps:+$('manifest-fps').value||12,order:S.frames.map((_,i)=>i),loop:+$('manifest-loop').value===0,loopCount:+$('manifest-loop').value||0,anchor:S.anchor,events:[],hitboxes:[],hurtboxes:[]}},
    frames:S.frames.map((f,i)=>{const page=Math.floor(i/16),local=i%16,col=local%4,row=Math.floor(local/4),r=collectFrameReview(i);return{index:i,page,col,row,sheetRect:{x:col*fw,y:row*fh,w:fw,h:fh},anchor:f.anchor||S.anchor,label:f.label||'',notes:f.notes||'',hash:r.hash,issues:r.issues}}),
    compatibility:{badgerRunner:info.id==='badger-runner',ethicBrawl:info.id.startsWith('ethic-brawl'),maxPromptGrid:'4x4'}
  };
  const blob=new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'});const a=document.createElement('a');a.download=`${name}_${info.id}_manifest.json`;a.href=URL.createObjectURL(blob);a.click();URL.revokeObjectURL(a.href);
  toast(`Exported ${pages.length} contract page(s) + manifest`,'success')
}
function chooseTargetContract(id){if($('target-contract'))$('target-contract').value=id;setContract4x4Layout();updateReassemblyGuide();setWorkflow('export')}
$('target-contract')?.addEventListener('change',updateReassemblyGuide);
$('btn-target-badger')?.addEventListener('click',()=>chooseTargetContract('badger-runner'));
$('btn-target-ethic-core')?.addEventListener('click',()=>chooseTargetContract('ethic-brawl-core'));
$('btn-target-ethic-ext')?.addEventListener('click',()=>chooseTargetContract('ethic-brawl-extended'));
$('btn-assist-badger')?.addEventListener('click',()=>chooseTargetContract('badger-runner'));
$('btn-assist-ethic-core')?.addEventListener('click',()=>chooseTargetContract('ethic-brawl-core'));
$('btn-assist-ethic-ext')?.addEventListener('click',()=>chooseTargetContract('ethic-brawl-extended'));
$('btn-contract-4x4')?.addEventListener('click',setContract4x4Layout);
$('btn-export-contract')?.addEventListener('click',exportContractPages);
$('btn-order-current')?.addEventListener('click',()=>{syncFrameOrderText();toast('Current order copied','success')});
$('btn-apply-order')?.addEventListener('click',()=>reorderFramesByOrder(parseFrameOrderText()));
$('btn-frame-up')?.addEventListener('click',()=>moveFrame(S.selectedFrame,S.selectedFrame-1));
$('btn-frame-down')?.addEventListener('click',()=>moveFrame(S.selectedFrame,S.selectedFrame+1));

$('btn-export').addEventListener('click',()=>{$('btn-export-png').click()});

// ════════════════════════════════════════════
// MANIFEST EXPORT
// ════════════════════════════════════════════
$('btn-export-manifest').addEventListener('click',()=>{
  if(!S.frames.length){toast('No frames to manifest','warning');return}
  const name=$('manifest-name').value||'sprite';
  const fps=+$('manifest-fps').value||12;
  const frameDurationMs=Math.round(1000/fps);
  const frameDurationsMs=Array.from({length:S.frames.length},()=>frameDurationMs);
  const loopCount=Math.max(0,+$('manifest-loop').value||0);
  const loop=loopCount===0;
  const cols=+$('export-cols').value;
  const pad=+$('chk-no-pad').checked?0:+$('export-pad').value;
  const fw=S.frames[0].imgData.width, fh=S.frames[0].imgData.height;
  const cellW=fw+pad*2, cellH=fh+pad*2;
  const rows=Math.ceil(S.frames.length/cols);
  const order=Array.from({length:S.frames.length},(_,i)=>i);
  const manifest={
    name, fps, frameWidth:fw, frameHeight:fh,
    columns:cols, rows, frameCount:S.frames.length,
    padding:pad, totalFrames:S.frames.length,
    generationContract:{source:'sprite-fan/reqs/animation.yml',gridVsIndividual:'atlas-grid',maxPromptGrid:{columns:4,rows:4,frames:16},transparentBackground:true,stableFrameSize:true,metadataPolicy:'export-grid-animations-order-loop-anchor-empty-gameplay-slots'},
    specGuide:refreshSpecGuide(),
    grid:{columns:cols,rows,padding:pad,frameWidth:fw,frameHeight:fh,cellWidth:cellW,cellHeight:cellH,sheetWidth:cellW*cols,sheetHeight:cellH*rows},
    animation:{id:name,frames:S.frames.length,fps,frameDurationMs,frameDurationsMs,order,loop,loopCount,tags:['sprite-fan','postprocessed','atlas-grid'],anchor:S.anchor,events:[],hitboxes:[],hurtboxes:[]},
    animations:{[name]:{frames:S.frames.length,fps,frameDurationMs,frameDurationsMs,order,loop,loopCount,anchor:S.anchor,tags:['sprite-fan','postprocessed','atlas-grid'],events:[],hitboxes:[],hurtboxes:[]}},
    sheetLayout:{columns:cols,rows,padding:pad,frameWidth:fw,frameHeight:fh,cellWidth:cellW,cellHeight:cellH,sheetWidth:cellW*cols,sheetHeight:cellH*rows},
    anchor:S.anchor,
    frames:Array.from({length:S.frames.length},(_,i)=>{const r=collectFrameReview(i),col=i%cols,row=Math.floor(i/cols),cellW=fw+pad*2,cellH=fh+pad*2;return{
      index:i, col, row,
      sheetRect:{x:col*cellW+pad,y:row*cellH+pad,w:fw,h:fh},
      anchor:S.frames[i].anchor||S.anchor,
      label:S.frames[i].label||'', notes:S.frames[i].notes||'',
      hash:r.hash, bbox:r.bbox, alphaPixels:r.pixels, softAlphaPixels:r.soft,
      strayPixels:r.strayPixels, pinholePixels:r.pinholePixels, issues:r.issues
    }})
  };
  const blob=new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.download=name+'_sprites.json';a.href=URL.createObjectURL(blob);a.click();URL.revokeObjectURL(a.href);
  toast('sprites.json exported','success');
});

$('btn-export-manifest-full').addEventListener('click',()=>{
  const cfg=getConfig();
  const blob=new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.download='sprite-atlas-config.json';a.href=URL.createObjectURL(blob);a.click();URL.revokeObjectURL(a.href);
  toast('Full config exported','success');
});

// ════════════════════════════════════════════
// SPEC GUIDE
// ════════════════════════════════════════════
const SPEC_REQUIREMENTS=[
  {id:'prompt',label:'Prompt/goals captured',check:()=>($('spec-prompt')?.value||'').trim().length>0,action:'Write the intended sprite or animation prompt.'},
  {id:'frames',label:'Frames sliced from atlas',check:()=>S.frames.length>0,action:'Load an atlas and slice frames.'},
  {id:'grid',label:'4x4 contract export is page-safe',check:()=>S.frames.length>0&&(targetContractInfo().pageSize?+$('export-cols').value===4&&($('chk-no-pad').checked||+$('export-pad').value===0):S.frames.length<=16&&(+$('export-cols').value||1)<=4&&Math.ceil(S.frames.length/(+$('export-cols').value||1))<=4),action:'Choose Badger/Ethic target to split larger sets into strict 4x4 pages, or keep generic exports within one 4x4.'},
  {id:'stable-size',label:'Stable frame size present',check:()=>S.frames.length>0&&S.frames.every(f=>f.imgData.width===S.frames[0].imgData.width&&f.imgData.height===S.frames[0].imgData.height),action:'Slice or repack so every frame has the same dimensions.'},
  {id:'anchor',label:'Anchor metadata present',check:()=>S.frames.length>0&&S.frames.every(f=>f.anchor&&Number.isFinite(f.anchor.x)&&Number.isFinite(f.anchor.y)),action:'Set an anchor before slicing or apply anchors through config.'},
  {id:'review',label:'No unresolved review issues',check:()=>S.frames.length>0&&buildReviewReport().totals.issueFrames===0,action:'Use cleanup/review tools until issueFrames is zero.'},
  {id:'animation',label:'Animation timing metadata exportable',check:()=>S.frames.length>0&&+$('manifest-fps').value>0&&($('manifest-name').value||'').trim().length>0,action:'Set sprite name, FPS, and loop metadata.'},
  {id:'preview',label:'Animation preview subset selected or all-frame preview available',check:()=>S.frames.length>0,action:'Use timeline preview; optionally mark frames with M or Ctrl/Meta-click.'},
];
function buildSpecGuide(){const items=SPEC_REQUIREMENTS.map(r=>{let done=false;try{done=!!r.check()}catch(e){}return{id:r.id,label:r.label,done,action:r.action}});return{version:1,source:'sprite-fan/reqs/animation.yml',prompt:$('spec-prompt')?.value||'',checkedAt:new Date().toISOString(),summary:{done:items.filter(i=>i.done).length,total:items.length},items}}
function renderSpecGuide(guide=S.specGuide){const safeGuide=cleanSpecGuide(guide)||{items:[]};const items=safeGuide.items;const done=items.filter(i=>i.done).length,total=items.length;const summary=$('spec-guide-summary');if(summary)summary.textContent=total?`Spec: ${done}/${total} done`:'Spec: not checked';const list=$('spec-guide-list');if(!list)return;list.textContent='';if(!items.length){list.textContent='Open export workflow and click Check Spec.';return}items.forEach((i,idx)=>{if(idx>0)list.appendChild(document.createElement('br'));list.appendChild(document.createTextNode((i.done?'✓ ':'□ ')+i.label+(i.done?'':' — '+i.action)))})}
function refreshSpecGuide(){S.specGuide=buildSpecGuide();renderSpecGuide();return S.specGuide}
function exportSpecState(){const guide=refreshSpecGuide();const b=new Blob([JSON.stringify(guide,null,2)],{type:'application/json'});const a=document.createElement('a');a.download=($('manifest-name').value||'sprite')+'_spec-state.json';a.href=URL.createObjectURL(b);a.click();URL.revokeObjectURL(a.href);toast('Spec state exported','success')}
function applySpecGuide(guide){const safeGuide=cleanSpecGuide(guide);if(!safeGuide)return;if($('spec-prompt'))$('spec-prompt').value=safeGuide.prompt;S.specGuide=safeGuide;renderSpecGuide(S.specGuide)}

// ════════════════════════════════════════════
// CONFIG SYSTEM
// ════════════════════════════════════════════
function getConfig(){
  saveViewState();
  return{
    frameW:+$('frame-w').value,frameH:+$('frame-h').value,gridOx:+$('grid-ox').value,gridOy:+$('grid-oy').value,
    anchor:S.anchor,tolerance:+$('tolerance').value,maxSaturation:+$('max-saturation').value,
    alphaThreshold:+$('alpha-threshold').value,mergeDistance:+$('merge-distance').value,
    straySize:+$('stray-size').value,jitterThresh:+$('jitter-thresh').value,outlineRadius:+$('outline-radius').value,
    softenRadius:+$('soften-radius').value,alphaErode:+$('alpha-erode').value,alphaDilate:+$('alpha-dilate').value,
    exportCols:+$('export-cols').value,exportPad:+$('export-pad').value,noPad:$('chk-no-pad').checked,
    manifestName:$('manifest-name').value,manifestFps:+$('manifest-fps').value,manifestLoop:+$('manifest-loop').value,
    specGuide:refreshSpecGuide(),
    showOnionSkin:S.showOnionSkin,onionOpacity:S.onionOpacity,autoFitFrames:S.autoFitFrames,maxAutoFitZoom:S.maxAutoFitZoom,
    viewMode:S.viewMode,zoom:S.zoom,panX:S.panX,panY:S.panY,viewStates:clonePlain(S.viewStates),layout:clonePlain(S.layout),
    frameMeta:S.frames.map((f,i)=>({index:i,label:f.label||'',notes:f.notes||'',anchor:f.anchor||S.anchor})),
    batchHistory:S.batchHistory.slice(-10),
  };
}

function applyPendingFrameMeta(){
  if(!Array.isArray(S.pendingFrameMeta)||!S.pendingFrameMeta.length)return;
  S.pendingFrameMeta.forEach(m=>{const f=S.frames[m.index];if(f){if(m.label!==undefined)f.label=m.label;if(m.notes!==undefined)f.notes=m.notes;if(m.anchor)f.anchor=m.anchor}});
  updateFrameMetaInputs();refreshReviewIssues();updateFrameStrip();updateTimeline();
}
function applyConfig(c){
  c=cleanConfig(c);
  if(c.frameW!==undefined){$('frame-w').value=c.frameW;$('frame-w-num').value=c.frameW;$('fw-val').textContent=c.frameW}
  if(c.frameH!==undefined){$('frame-h').value=c.frameH;$('frame-h-num').value=c.frameH;$('fh-val').textContent=c.frameH}
  if(c.gridOx!==undefined){$('grid-ox').value=c.gridOx;$('ox-val').textContent=c.gridOx}
  if(c.gridOy!==undefined){$('grid-oy').value=c.gridOy;$('oy-val').textContent=c.gridOy}
  if(c.anchor){S.anchor=c.anchor;$('anchor-x').value=c.anchor.x;$('anchor-y').value=c.anchor.y;$('anchor-x-num').value=c.anchor.x;$('anchor-y-num').value=c.anchor.y;$('ancx-val').textContent=c.anchor.x;$('ancy-val').textContent=c.anchor.y;updateAnchorList();drawOverlay()}
  if(c.tolerance!==undefined){$('tolerance').value=c.tolerance;$('tol-val').textContent=c.tolerance}
  if(c.maxSaturation!==undefined){$('max-saturation').value=c.maxSaturation;$('sat-val').textContent=c.maxSaturation}
  if(c.alphaThreshold!==undefined){$('alpha-threshold').value=c.alphaThreshold;$('athresh-val').textContent=c.alphaThreshold}
  if(c.mergeDistance!==undefined){$('merge-distance').value=c.mergeDistance;$('merge-val').textContent=c.mergeDistance}
  if(c.straySize!==undefined){$('stray-size').value=c.straySize;$('stray-val').textContent=c.straySize}
  if(c.jitterThresh!==undefined){$('jitter-thresh').value=c.jitterThresh;$('jitter-val').textContent=c.jitterThresh}
  if(c.outlineRadius!==undefined){$('outline-radius').value=c.outlineRadius;$('outline-val').textContent=c.outlineRadius}
  if(c.softenRadius!==undefined){$('soften-radius').value=c.softenRadius;$('soften-val').textContent=c.softenRadius}
  if(c.alphaErode!==undefined){$('alpha-erode').value=c.alphaErode;$('erode-val').textContent=c.alphaErode}
  if(c.alphaDilate!==undefined){$('alpha-dilate').value=c.alphaDilate;$('dilate-val').textContent=c.alphaDilate}
  if(c.exportCols!==undefined){$('export-cols').value=c.exportCols;$('cols-val').textContent=c.exportCols}
  if(c.exportPad!==undefined){$('export-pad').value=c.exportPad;$('pad-val').textContent=c.exportPad}
  if(c.noPad!==undefined)$('chk-no-pad').checked=c.noPad;
  if(c.manifestName!==undefined)$('manifest-name').value=c.manifestName;
  if(c.manifestFps!==undefined){$('manifest-fps').value=c.manifestFps;$('fps-val').textContent=c.manifestFps}
  if(c.manifestLoop!==undefined){$('manifest-loop').value=c.manifestLoop;$('loop-val').textContent=+c.manifestLoop===0?'∞':String(c.manifestLoop)}
  if(c.specGuide)applySpecGuide(c.specGuide);
  if(c.showOnionSkin!==undefined){S.showOnionSkin=c.showOnionSkin;$('chk-onion').checked=c.showOnionSkin}
  if(c.onionOpacity!==undefined)S.onionOpacity=c.onionOpacity;
  if(c.autoFitFrames!==undefined){S.autoFitFrames=!!c.autoFitFrames;$('btn-auto-fit').classList.toggle('active',S.autoFitFrames)}
  if(c.maxAutoFitZoom!==undefined){S.maxAutoFitZoom=+c.maxAutoFitZoom||4;$('max-auto-fit-zoom').value=S.maxAutoFitZoom;$('fitzoom-val').textContent=S.maxAutoFitZoom}
  if(c.layout){S.layout={...S.layout,...c.layout};applyLayout()}
  if(c.viewStates){S.viewStates={source:c.viewStates.source||S.viewStates.source,frame:c.viewStates.frame||S.viewStates.frame}}
  if(c.viewMode){S.viewMode=c.viewMode}
  if(c.zoom!==undefined){S.zoom=c.zoom;S.panX=c.panX??S.panX;S.panY=c.panY??S.panY;S.reviewFitReady=true;S.viewInitialized=true;saveViewState();applyTransform()}
  if(Array.isArray(c.frameMeta)&&c.frameMeta.length){S.pendingFrameMeta=c.frameMeta.map(m=>({...m}));applyPendingFrameMeta()}
  if(Array.isArray(c.batchHistory))S.batchHistory=c.batchHistory.map(h=>({...h}));
}
function forceTransparentCleanupEnabled(){return !!(($('chk-force-transparent')&&$('chk-force-transparent').checked)||($('chk-force-transparent-frame')&&$('chk-force-transparent-frame').checked))}

function openConfigModal(){$('cfg-editor').value=JSON.stringify(getConfig(),null,2);$('config-modal').classList.add('open')}
function closeConfigModal(){$('config-modal').classList.remove('open')}
$('btn-config').addEventListener('click',openConfigModal);
$('btn-config-close').addEventListener('click',closeConfigModal);
$('btn-cfg-cancel').addEventListener('click',closeConfigModal);
$('config-modal').addEventListener('click',e=>{if(e.target===$('config-modal'))closeConfigModal()});
$('btn-cfg-save-local').addEventListener('click',()=>{try{localStorage.setItem('sprite-atlas-studio-cfg',JSON.stringify(getConfig()));toast('Config saved','success')}catch(e){toast('Save failed','error')}});
$('btn-cfg-load-local').addEventListener('click',()=>{try{const r=localStorage.getItem('sprite-atlas-studio-cfg');if(!r){toast('No saved config','warning');return}applyConfig(JSON.parse(r));$('cfg-editor').value=JSON.stringify(getConfig(),null,2);toast('Config loaded','success')}catch(e){toast('Load failed','error')}});
$('btn-cfg-export').addEventListener('click',()=>{const b=new Blob([JSON.stringify(getConfig(),null,2)],{type:'application/json'});const a=document.createElement('a');a.download='sprite-atlas-config.json';a.href=URL.createObjectURL(b);a.click();URL.revokeObjectURL(a.href);toast('Config exported','success')});
$('btn-cfg-import').addEventListener('click',()=>$('cfg-import-file').click());
$('cfg-import-file').addEventListener('change',()=>{const f=$('cfg-import-file').files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('cfg-editor').value=r.result;toast('File loaded','success')};r.readAsText(f)});
$('btn-cfg-apply').addEventListener('click',()=>{try{applyConfig(JSON.parse($('cfg-editor').value));closeConfigModal();toast('Config applied','success')}catch(e){toast('Invalid JSON: '+e.message,'error')}});
$('btn-spec-check').addEventListener('click',()=>{refreshSpecGuide();toast('Spec checklist refreshed','success')});
$('btn-export-spec-state').addEventListener('click',exportSpecState);
function refreshExportUi(){if(typeof renderReassemblyAssistant==='function')renderReassemblyAssistant();if(typeof refreshSpecGuide==='function')refreshSpecGuide()}
$('manifest-name')?.addEventListener('input',refreshExportUi);
$('manifest-fps')?.addEventListener('input',()=>{$('fps-val').textContent=$('manifest-fps').value;refreshExportUi()});
$('manifest-loop').addEventListener('input',()=>{$('loop-val').textContent=+$('manifest-loop').value===0?'∞':$('manifest-loop').value;refreshExportUi()});
$('spec-prompt').addEventListener('input',()=>{S.specGuide.prompt=$('spec-prompt').value;renderSpecGuide(S.specGuide)});

// ════════════════════════════════════════════
// BATCH QUEUE
// ════════════════════════════════════════════

// Known dimension contracts from reqs/animation.yml
const DIMENSION_CONTRACTS = {
  player:    { fw: 48, fh: 48, anchor: {x:24, y:44} },
  item:      { fw: 32, fh: 32, anchor: {x:16, y:16} },
  vfx:       { fw: 32, fh: 32, anchor: {x:16, y:16} },
  tile:      { fw: 32, fh: 32, anchor: {x:16, y:16} },
  enemy:     { fw: 48, fh: 48, anchor: {x:24, y:44} },
  boss:      { fw: 96, fh: 96, anchor: {x:48, y:88} },
  companion: { fw: 48, fh: 48, anchor: {x:24, y:44} },
  npc:       { fw: 48, fh: 48, anchor: {x:24, y:44} },
  parallax:  { fw: 320, fh: 180, anchor: {x:160, y:90} },
};

// Auto-detect frame dimensions from image size and ID patterns
function autoDetectDimensions(name, imgW, imgH) {
  const lower = name.toLowerCase();
  // Match known contracts by ID pattern
  if (lower.includes('boss'))     return DIMENSION_CONTRACTS.boss;
  if (lower.includes('enemy'))    return DIMENSION_CONTRACTS.enemy;
  if (lower.includes('parallax')) return DIMENSION_CONTRACTS.parallax;
  if (lower.includes('tile'))     return DIMENSION_CONTRACTS.tile;
  if (lower.includes('item'))     return DIMENSION_CONTRACTS.item;
  if (lower.includes('vfx'))      return DIMENSION_CONTRACTS.vfx;
  if (lower.includes('companion') || lower.includes('character') || lower.includes('npc'))
    return DIMENSION_CONTRACTS.companion;
  // Fallback: assume 4x4 grid, pick dimensions that divide evenly
  for (const fw of [48, 32, 96, 64, 24]) {
    if (imgW % fw === 0) {
      const cols = imgW / fw;
      const rows = imgH / fw; // assume square frames
      if (rows >= 1 && imgH % fw === 0) return { fw, fh: fw, anchor: {x: Math.floor(fw/2), y: fw - 4} };
    }
  }
  // Last resort: try to fit 4 columns
  const fw = Math.floor(imgW / 4);
  const fh = Math.floor(imgH / Math.ceil((imgW / fw) * (imgH / imgW)));
  return { fw: Math.max(1, fw), fh: Math.max(1, fh || fw), anchor: {x: Math.floor(fw/2), y: fh - 4} };
}

function renderBatchQueue() {
  const strip = $('batch-queue-strip');
  const info = $('batch-info');
  const nav = $('batch-nav');
  const status = $('batch-status');
  if (!strip) return;

  strip.textContent = '';
  if (!S.batchQueue.length) {
    if (info) info.textContent = 'No sprites queued';
    if (nav) nav.style.display = 'none';
    if (status) status.style.display = 'none';
    return;
  }

  if (nav) nav.style.display = S.batchQueue.length > 1 ? '' : 'none';

  S.batchQueue.forEach((item, i) => {
    const chip = document.createElement('div');
    chip.className = 'batch-chip' + (i === S.batchIndex ? ' active' : '') + (item.status === 'done' ? ' done' : item.status === 'error' ? ' error' : '');
    chip.title = item.name + ' (' + item.frameW + 'x' + item.frameH + ')';
    chip.textContent = item.name.replace(/\.[^.]+$/, '').slice(0, 16);
    chip.addEventListener('click', () => loadBatchItem(i));
    strip.appendChild(chip);
  });

  if (info) {
    const current = S.batchIndex >= 0 ? S.batchQueue[S.batchIndex] : null;
    const done = S.batchQueue.filter(i => i.status === 'done').length;
    info.textContent = `${done}/${S.batchQueue.length} done` + (current ? ` · ${current.name.slice(0, 24)}` : '');
  }

  // Update status bar
  if (status) {
    const item = S.batchIndex >= 0 ? S.batchQueue[S.batchIndex] : null;
    if (item) {
      status.style.display = '';
      $('batch-file-name').textContent = item.name;
      $('batch-img-size').textContent = S.sourceImg ? S.sourceImg.width + 'x' + S.sourceImg.height : 'loading...';
      $('batch-frame-size').textContent = item.frameW + 'x' + item.frameH;
      const source = S.sheetImageData || S.currentImageData;
      if (source) {
        const cols = Math.floor((source.width - (+$('grid-ox').value || 0)) / item.frameW);
        const rows = Math.floor((source.height - (+$('grid-oy').value || 0)) / item.frameH);
        $('batch-grid-info').textContent = cols + 'x' + rows + ' = ' + (cols * rows) + ' frames';
      } else {
        $('batch-grid-info').textContent = '-';
      }
    } else {
      status.style.display = 'none';
    }
  }
}

function addFilesToBatch(fileList) {
  const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  if (!files.length) { toast('No image files', 'warning'); return; }
  
  files.forEach(f => {
    const detected = autoDetectDimensions(f.name, 0, 0);
    S.batchQueue.push({
      name: f.name,
      file: f,
      blob: f,
      frameW: detected.fw,
      frameH: detected.fh,
      anchor: { ...detected.anchor },
      status: 'pending',
      dimsLocked: false,
    });
  });

  renderBatchQueue();
  toast(`Added ${files.length} sprite(s) to queue`, 'success');
}

function loadBatchItem(index) {
  if (index < 0 || index >= S.batchQueue.length) return;
  const item = S.batchQueue[index];
  S.batchIndex = index;

  // Apply saved dimensions
  $('frame-w').value = item.frameW;
  $('frame-w-num').value = item.frameW;
  $('fw-val').textContent = item.frameW;
  $('frame-h').value = item.frameH;
  $('frame-h-num').value = item.frameH;
  $('fh-val').textContent = item.frameH;
  S.anchor = { ...item.anchor };
  $('anchor-x').value = item.anchor.x;
  $('anchor-y').value = item.anchor.y;
  $('anchor-x-num').value = item.anchor.x;
  $('anchor-y-num').value = item.anchor.y;
  $('ancx-val').textContent = item.anchor.x;
  $('ancy-val').textContent = item.anchor.y;

  // Update manifest name
  const baseName = item.name.replace(/\.[^.]+$/, '');
  if ($('manifest-name')) $('manifest-name').value = baseName;

  // Load image
  loadObjectUrlImage(item.blob, (img) => {
    loadImageToCanvas(img);
    // Update batch status after image loads
    renderBatchQueue();
  });

  renderBatchQueue();
}

function markBatchDone(success) {
  if (S.batchIndex < 0 || S.batchIndex >= S.batchQueue.length) return;
  S.batchQueue[S.batchIndex].status = success ? 'done' : 'error';
  // Save current dimensions back to queue item
  const item = S.batchQueue[S.batchIndex];
  item.frameW = +$('frame-w').value;
  item.frameH = +$('frame-h').value;
  item.anchor = { ...S.anchor };
  renderBatchQueue();
}

function nextBatchItem() {
  if (S.batchIndex < S.batchQueue.length - 1) {
    markBatchDone(true);
    loadBatchItem(S.batchIndex + 1);
  } else {
    markBatchDone(true);
    toast('Batch queue complete!', 'success');
  }
}

function prevBatchItem() {
  if (S.batchIndex > 0) loadBatchItem(S.batchIndex - 1);
}

// Load manifest (sprites.json) and populate batch queue from it
function loadManifestBatch(manifestJson) {
  try {
    const manifest = typeof manifestJson === 'string' ? JSON.parse(manifestJson) : manifestJson;
    const sheets = manifest.spriteSheets || manifest.sheets || [];
    if (!sheets.length) { toast('No sheets in manifest', 'warning'); return; }

    S.batchManifest = manifest;
    S.batchQueue = [];

    sheets.forEach(sheet => {
      const fw = sheet.frameSize?.[0] || 48;
      const fh = sheet.frameSize?.[1] || 48;
      const ax = sheet.animations ? Object.values(sheet.animations)[0]?.anchor?.[0] : Math.floor(fw / 2);
      const ay = sheet.animations ? Object.values(sheet.animations)[0]?.anchor?.[1] : fh - 4;

      S.batchQueue.push({
        name: sheet.id + '.png',
        file: null,
        blob: null,
        frameW: fw,
        frameH: fh,
        anchor: { x: ax ?? Math.floor(fw / 2), y: ay ?? fh - 4 },
        status: 'pending',
        dimsLocked: true,
        manifestEntry: sheet,
      });
    });

    renderBatchQueue();
    toast(`Loaded ${S.batchQueue.length} sheets from manifest`, 'success');
  } catch (e) {
    toast('Invalid manifest: ' + e.message, 'error');
  }
}

// Wire up batch queue UI
$('btn-batch-add')?.addEventListener('click', () => $('batch-file-input')?.click());
$('batch-file-input')?.addEventListener('change', () => {
  addFilesToBatch($('batch-file-input').files);
  $('batch-file-input').value = '';
});
$('btn-batch-next')?.addEventListener('click', nextBatchItem);
$('btn-batch-prev')?.addEventListener('click', prevBatchItem);
$('btn-batch-done')?.addEventListener('click', () => markBatchDone(true));
$('btn-batch-skip')?.addEventListener('click', () => {
  markBatchDone(false);
  nextBatchItem();
});
$('btn-batch-load-manifest')?.addEventListener('click', () => $('batch-manifest-input')?.click());
$('batch-manifest-input')?.addEventListener('change', () => {
  const f = $('batch-manifest-input').files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => loadManifestBatch(r.result);
  r.readAsText(f);
  $('batch-manifest-input').value = '';
});
$('btn-batch-clear')?.addEventListener('click', () => {
  S.batchQueue = [];
  S.batchIndex = -1;
  renderBatchQueue();
  toast('Batch queue cleared', 'info');
});
$('chk-batch-auto-detect')?.addEventListener('change', (e) => {
  S.batchAutoDetect = e.target.checked;
});

// Save/apply dimension patterns
const DIM_PATTERNS_KEY = 'sprite-fan-dim-patterns';
function loadDimPatterns() {
  try { return JSON.parse(localStorage.getItem(DIM_PATTERNS_KEY) || '{}'); } catch { return {}; }
}
function saveDimPatterns(patterns) {
  try { localStorage.setItem(DIM_PATTERNS_KEY, JSON.stringify(patterns)); } catch {}
}
$('btn-batch-save-dims')?.addEventListener('click', () => {
  if (S.batchIndex < 0) { toast('Select a batch item first', 'warning'); return; }
  const item = S.batchQueue[S.batchIndex];
  const name = item.name.toLowerCase();
  const patterns = loadDimPatterns();
  // Extract pattern key (e.g., "boss", "enemy", "character")
  let key = 'generic';
  if (name.includes('boss')) key = 'boss';
  else if (name.includes('enemy')) key = 'enemy';
  else if (name.includes('character') || name.includes('companion') || name.includes('npc')) key = 'character';
  else if (name.includes('parallax')) key = 'parallax';
  else if (name.includes('tile')) key = 'tile';
  else if (name.includes('item')) key = 'item';
  else if (name.includes('vfx')) key = 'vfx';
  patterns[key] = {
    fw: +$('frame-w').value,
    fh: +$('frame-h').value,
    anchor: { ...S.anchor },
    ox: +$('grid-ox').value,
    oy: +$('grid-oy').value,
  };
  saveDimPatterns(patterns);
  toast(`Saved dimensions for "${key}" pattern`, 'success');
});
$('btn-batch-apply-dims')?.addEventListener('click', () => {
  if (!S.batchQueue.length) { toast('Batch queue is empty', 'warning'); return; }
  const patterns = loadDimPatterns();
  let applied = 0;
  S.batchQueue.forEach(item => {
    if (item.status === 'done') return;
    const name = item.name.toLowerCase();
    let key = 'generic';
    if (name.includes('boss')) key = 'boss';
    else if (name.includes('enemy')) key = 'enemy';
    else if (name.includes('character') || name.includes('companion') || name.includes('npc')) key = 'character';
    else if (name.includes('parallax')) key = 'parallax';
    else if (name.includes('tile')) key = 'tile';
    else if (name.includes('item')) key = 'item';
    else if (name.includes('vfx')) key = 'vfx';
    if (patterns[key]) {
      item.frameW = patterns[key].fw;
      item.frameH = patterns[key].fh;
      item.anchor = { ...patterns[key].anchor };
      item.dimsLocked = true;
      applied++;
    }
  });
  renderBatchQueue();
  toast(`Applied dimensions to ${applied} item(s)`, 'success');
});

// Override export to mark batch done
const _origExportPng = $('btn-export-png')?.onclick;
$('btn-export-png')?.addEventListener('click', () => {
  if (S.batchIndex >= 0) markBatchDone(true);
});
function extractDualAlpha(whiteImg,blackImg,athresh,despill,hardAlpha){
  const w=whiteImg.width,h=whiteImg.height;
  const wC=document.createElement('canvas');wC.width=w;wC.height=h;const wCtx=wC.getContext('2d',{willReadFrequently:true});wCtx.clearRect(0,0,w,h);wCtx.drawImage(whiteImg,0,0);const wD=wCtx.getImageData(0,0,w,h);
  const bC=document.createElement('canvas');bC.width=w;bC.height=h;const bCtx=bC.getContext('2d',{willReadFrequently:true});bCtx.clearRect(0,0,w,h);bCtx.drawImage(blackImg,0,0);const bD=bCtx.getImageData(0,0,w,h);
  const out=new ImageData(w,h);const wd=wD.data,bd=bD.data,od=out.data;let tc=0,oc=0;
  for(let i=0;i<wd.length;i+=4){const wr=wd[i],wg=wd[i+1],wb=wd[i+2],br=bd[i],bg=bd[i+1],bb=bd[i+2];let ar=255-(wr-br),ag=255-(wg-bg),ab=255-(wb-bb);ar=Math.max(0,Math.min(255,ar));ag=Math.max(0,Math.min(255,ag));ab=Math.max(0,Math.min(255,ab));let a=(ar+ag+ab)/3;if(hardAlpha)a=a>=128?255:0;if(a<=athresh){od[i]=od[i+1]=od[i+2]=od[i+3]=0;tc++;continue}const an=a/255;let r=br/an,g=bg/an,bl=bb/an;if(despill){const r2=(wr-(1-an)*255)/an,g2=(wg-(1-an)*255)/an,b2=(wb-(1-an)*255)/an;r=(r+r2)/2;g=(g+g2)/2;bl=(bl+b2)/2}od[i]=clamp255(r);od[i+1]=clamp255(g);od[i+2]=clamp255(bl);od[i+3]=clamp255(a);oc++}
  return out;
}

// Auto-detect dual mode and extract
// (accessible from cleanup workflow)
// We'll add a button in cleanup for this
// Actually, keep it simple: if dual mode is on and both images loaded, show extract button

// ════════════════════════════════════════════
// TEST HOOKS (read-only helpers for Playwright contracts)
// ════════════════════════════════════════════
window.__spriteFanTest = {
  getState(){return {wf:S.wf,frames:S.frames.length,selectedFrame:S.selectedFrame,viewMode:S.viewMode,autoFitFrames:S.autoFitFrames,maxAutoFitZoom:S.maxAutoFitZoom,zoom:S.zoom,panX:S.panX,panY:S.panY,detectedGroups:S.detectedGroups.length,previewMode:S.previewMode,previewFrames:S.previewFrames.slice(),playing:S.playing,viewStates:S.viewStates}},
  getCanvasSize(){return {width:mainCanvas.width,height:mainCanvas.height}},
  getCurrentAlpha(x,y){if(!S.currentImageData)return null;const ix=(y*S.currentImageData.width+x)*4+3;return S.currentImageData.data[ix]},
  getCurrentRgba(x,y){if(!S.currentImageData)return null;const ix=(y*S.currentImageData.width+x)*4;const d=S.currentImageData.data;return [d[ix],d[ix+1],d[ix+2],d[ix+3]]},
  getPreviewAlpha(x,y){if(!S.previewImageData)return null;const ix=(y*S.previewImageData.width+x)*4+3;return S.previewImageData.data[ix]},
  getPreviewMode(){return S.previewMode},
  getFrameAlpha(frameIndex,x,y){const f=S.frames[frameIndex];if(!f)return null;const ix=(y*f.imgData.width+x)*4+3;return f.imgData.data[ix]},
  getFrameHash(frameIndex){const f=S.frames[frameIndex];return f?hashImageData(f.imgData):null},
  getFrameMetrics(frameIndex){const f=S.frames[frameIndex];return analyzeFramePixels(f?f.imgData:S.currentImageData)},
  getDetectedGroups(){return S.detectedGroups.map(g=>({minX:g.minX,minY:g.minY,maxX:g.maxX,maxY:g.maxY,width:g.width,height:g.height,count:g.count}))},
  getReviewText(){return $('review-metrics')?.textContent||''},
  getReviewIssues(){refreshReviewIssues();return S.reviewIssues},
  gotoIssue(dir=1){gotoIssue(dir);return this.getState()},
  setFrameMeta(i,label,notes){const f=S.frames[i];if(!f)return null;f.label=label;f.notes=notes;if(i===S.selectedFrame)updateFrameMetaInputs();return {label:f.label,notes:f.notes}},
  getConfig(){return getConfig()},
  applyConfig(c){applyConfig(c);return getConfig()},
  selectFrame(i){showFrame(i);return this.getState()},
  togglePreviewFrame(i){togglePreviewFrame(i);return this.getState()},
  getPreviewSequence(){return getPreviewSequence()},
  async encodeGifBytes(){const b=encodeGifBlob();return b?Array.from(new Uint8Array(await b.arrayBuffer())):null},
  refreshSpecGuide(){return refreshSpecGuide()},
  getSpecGuide(){return S.specGuide},
};

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
applyTransform();
$('btn-auto-fit').classList.toggle('active',S.autoFitFrames);
updateAnchorList();renderSpecGuide();
refreshQuickGuide();
setActiveTool('idle');
renderPreviewEmpty('PREVIEW');
try{const saved=localStorage.getItem('sprite-atlas-studio-cfg');if(saved)applyConfig(JSON.parse(saved))}catch(e){}
if($('chk-show-anchor-overlay'))$('chk-show-anchor-overlay').addEventListener('change',()=>{S.showAnchorOverlay=$('chk-show-anchor-overlay').checked;drawOverlay()});

// Anchor input live update
['anchor-x','anchor-x-num'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',()=>{S.anchor.x=+el.value;drawOverlay();updateAnchorList()})});
['anchor-y','anchor-y-num'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',()=>{S.anchor.y=+el.value;drawOverlay();updateAnchorList()})});

// Frame size live update for grid overlay
['frame-w','frame-h','grid-ox','grid-oy'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',()=>drawOverlay())});

})();
