
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

  sourceImg: null,
  originalImageData: null,
  currentImageData: null,
  whiteImg: null, blackImg: null, dualMode: false,

  // Grid slicing
  frameW: 48, frameH: 48, gridOx: 0, gridOy: 0,

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
  reviewFitReady: false,
  viewInitialized: false,
  viewMode: 'source',
  viewStates: {source:null, frame:null},
  pendingFrameMeta: [],
  batchHistory: [],
  specGuide: {prompt:'', items:[], checkedAt:null},
  reviewIssues: [],
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
function makeUndoSnapshot(){return{currentImageData:S.currentImageData?cloneImageData(S.currentImageData):null,frames:S.frames.map(cloneFrame),selectedFrame:S.selectedFrame,anchor:{...S.anchor},detectedGroups:clonePlain(S.detectedGroups),viewMode:S.viewMode,viewStates:clonePlain(S.viewStates),batchHistory:clonePlain(S.batchHistory),pendingFrameMeta:clonePlain(S.pendingFrameMeta),previewFrames:clonePlain(S.previewFrames)}}
function restoreUndoSnapshot(snap){S.frames=snap.frames.map(cloneFrame);S.selectedFrame=snap.selectedFrame;S.anchor={...snap.anchor};S.detectedGroups=clonePlain(snap.detectedGroups||[]);S.viewMode=snap.viewMode||'source';S.viewStates=clonePlain(snap.viewStates||{source:null,frame:null});S.batchHistory=clonePlain(snap.batchHistory||[]);S.pendingFrameMeta=clonePlain(snap.pendingFrameMeta||[]);S.previewFrames=Array.isArray(snap.previewFrames)?clonePlain(snap.previewFrames):[];S.currentImageData=snap.currentImageData?cloneImageData(snap.currentImageData):null;if(S.selectedFrame>=0&&S.frames[S.selectedFrame])showFrame(S.selectedFrame);else if(S.currentImageData)applyImageData(S.currentImageData);updateFrameStrip();updateTimeline();updateUndoUI()}
function pushUndo(){if(!S.currentImageData&&!S.frames.length)return;S.undoStack.push(makeUndoSnapshot());if(S.undoStack.length>S.maxUndo)S.undoStack.shift();S.redoStack=[];updateUndoUI()}
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
function applyTransform(){const t=`translate(${S.panX}px,${S.panY}px) scale(${S.zoom})`;mainCanvas.style.transform=t;overlayCanvas.style.transform=t;onionCanvas.style.transform=t;$('info-zoom').textContent=Math.round(S.zoom*100)+'%'}
function fitToView(){if(!mainCanvas.width||!mainCanvas.height)return;const r=container.getBoundingClientRect();const cw=Math.max(1,r.width),ch=Math.max(1,r.height);const p=Math.min(48,Math.max(8,Math.min(cw,ch)*0.1));const sx=Math.max(.1,(cw-p)/mainCanvas.width),sy=Math.max(.1,(ch-p)/mainCanvas.height);const maxZ=Math.max(1,Math.min(16,+S.maxAutoFitZoom||4));const z=Math.max(.1,Math.min(16,Math.min(sx,sy,maxZ)||1));S.zoom=z;S.panX=Math.round((cw-mainCanvas.width*z)/2);S.panY=Math.round((ch-mainCanvas.height*z)/2);S.reviewFitReady=true;S.viewInitialized=true;applyTransform();saveViewState()}
function maybeFitToView(force){const key=currentViewKey();const shouldAuto=key==='frame'&&S.autoFitFrames;if(!force&&!shouldAuto&&restoreViewState(key))return;if(force||shouldAuto||!S.viewStates[key]||!S.viewInitialized||!S.reviewFitReady)fitToView();else applyTransform()}
function updateOverlaySize(){overlayCanvas.width=mainCanvas.width;overlayCanvas.height=mainCanvas.height;onionCanvas.width=mainCanvas.width;onionCanvas.height=mainCanvas.height}
function updateInfoSize(){$('info-size').textContent=mainCanvas.width+'x'+mainCanvas.height}

// ════════════════════════════════════════════
// IMAGE LOADING
// ════════════════════════════════════════════
function loadImageToCanvas(img){
  S.sourceImg=img;srcCanvas.width=img.width;srcCanvas.height=img.height;
  srcCtx.clearRect(0,0,img.width,img.height);srcCtx.drawImage(img,0,0);
  S.originalImageData=srcCtx.getImageData(0,0,img.width,img.height);
  S.currentImageData=cloneImageData(S.originalImageData);
  mainCanvas.width=img.width;mainCanvas.height=img.height;
  ctx.putImageData(S.currentImageData,0,0);updateOverlaySize();
  S.detectedGroups=[];S.frames=[];S.selectedFrame=-1;S.previewFrames=[];S.previewCursor=0;S.undoStack=[];S.redoStack=[];S.viewStates={source:null,frame:null};setViewMode('source');updateUndoUI();
  $('drop-zone').classList.add('hidden');S.reviewFitReady=false;fitToView();updatePreview();updateInfoSize();updateFrameStrip();updateTimeline();drawOverlay();
  setStatus('Loaded '+img.width+'x'+img.height);toast('Image loaded','success');
}

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
  S.originalImageData=cloneImageData(result);S.currentImageData=result;
  mainCanvas.width=result.width;mainCanvas.height=result.height;ctx.putImageData(S.currentImageData,0,0);
  updateOverlaySize();$('drop-zone').classList.add('hidden');S.reviewFitReady=false;fitToView();updatePreview();updateInfoSize();drawOverlay();
  toast('Dual BG alpha extracted','success');
});

// Drag & drop
container.addEventListener('dragover',e=>{e.preventDefault();container.classList.add('drag-over')});
container.addEventListener('dragleave',()=>container.classList.remove('drag-over'));
container.addEventListener('drop',e=>{e.preventDefault();container.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(!f||!f.type.startsWith('image/'))return;loadObjectUrlImage(f,loadImageToCanvas)});

// ════════════════════════════════════════════
// WORKFLOW SWITCHING
// ════════════════════════════════════════════
function setWorkflow(wf){
  S.wf=wf;
  if(wf==='import'&&S.originalImageData)showSourceSheet();
  document.querySelectorAll('.wf-tab').forEach(t=>t.classList.toggle('active',t.dataset.wf===wf));
  document.querySelectorAll('.wf-panel').forEach(p=>p.style.display=p.dataset.wf===wf?'':'none');
  $('status-wf').textContent=wf.charAt(0).toUpperCase()+wf.slice(1);
  drawOverlay();
}
document.querySelectorAll('.wf-tab').forEach(t=>t.addEventListener('click',()=>setWorkflow(t.dataset.wf)));

// ════════════════════════════════════════════
// RANGE SLIDERS
// ════════════════════════════════════════════
const rangeDisplays={tolerance:'tol-val','max-saturation':'sat-val','frame-w':'fw-val','frame-h':'fh-val','grid-ox':'ox-val','grid-oy':'oy-val','anchor-x':'ancx-val','anchor-y':'ancy-val','stray-size':'stray-val','jitter-thresh':'jitter-val','outline-radius':'outline-val','soften-radius':'soften-val','alpha-erode':'erode-val','alpha-dilate':'dilate-val','export-cols':'cols-val','export-pad':'pad-val','alpha-threshold':'athresh-val','merge-distance':'merge-val','manifest-fps':'fps-val','max-auto-fit-zoom':'fitzoom-val'};
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

// ════════════════════════════════════════════
// GRID SLICING (WF: Import)
// ════════════════════════════════════════════
$('btn-slice').addEventListener('click',()=>{
  if(!S.currentImageData){toast('Load an image first','warning');return}
  const fw=+$('frame-w').value, fh=+$('frame-h').value;
  const ox=+$('grid-ox').value, oy=+$('grid-oy').value;
  const iw=S.currentImageData.width, ih=S.currentImageData.height;
  const cols=Math.floor((iw-ox)/fw), rows=Math.floor((ih-oy)/fh);
  if(cols<1||rows<1){toast('Frame size too large for image','error');return}

  S.frames=[];S.previewFrames=[];S.previewCursor=0;
  const tmpC=document.createElement('canvas');tmpC.width=iw;tmpC.height=ih;
  tmpC.getContext('2d').putImageData(S.currentImageData,0,0);

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const sx=ox+c*fw, sy=oy+r*fh;
      const fd=document.createElement('canvas');fd.width=fw;fd.height=fh;
      const fctx=fd.getContext('2d',{willReadFrequently:true});
      fctx.drawImage(tmpC,sx,sy,fw,fh,0,0,fw,fh);
      S.frames.push({imgData:fctx.getImageData(0,0,fw,fh),anchor:{x:S.anchor.x,y:S.anchor.y},offsetX:0,offsetY:0,label:'',notes:''});
    }
  }
  S.selectedFrame=0;
  applyPendingFrameMeta();
  S.reviewFitReady=false;
  $('slice-info').textContent=cols+'x'+rows+' = '+S.frames.length+' frames';
  updateFrameStrip();updateTimeline();showFrame(0);
  toast('Sliced '+S.frames.length+' frames','success');
  setStatus('Grid sliced: '+cols+'x'+rows);
});

// ════════════════════════════════════════════
// FRAME DISPLAY
// ════════════════════════════════════════════
function showSourceSheet(){
  if(!S.originalImageData)return;
  setViewMode('source');
  S.selectedFrame=-1;
  S.currentImageData=cloneImageData(S.originalImageData);
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

function updateFrameStrip(){
  const strip=$('frame-strip');strip.innerHTML='';
  S.frames.forEach((f,i)=>{
    const chip=document.createElement('div');chip.className='frame-chip'+(i===S.selectedFrame?' selected':'');
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
    strip.appendChild(chip);
  });
  $('frame-count').textContent=S.frames.length+' frame(s)';
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
    div.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey){togglePreviewFrame(i);return}S.selectedFrame=i;showFrame(i);updateTimeline()});
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
  if(S.wf==='import'&&S.originalImageData){
    // Ensure overlay matches source, not sliced frame
    const ow=S.originalImageData.width, oh=S.originalImageData.height;
    if(overlayCanvas.width!==ow||overlayCanvas.height!==oh){
      overlayCanvas.width=ow;overlayCanvas.height=oh;
    }
    const fw=+$('frame-w').value, fh=+$('frame-h').value;
    const ox=+$('grid-ox').value, oy=+$('grid-oy').value;
    ovCtx.save();ovCtx.lineWidth=1*iz;ovCtx.strokeStyle='rgba(108,123,240,0.5)';ovCtx.setLineDash([4*iz,4*iz]);
    for(let x=ox;x<=overlayCanvas.width;x+=fw){ovCtx.beginPath();ovCtx.moveTo(x,0);ovCtx.lineTo(x,overlayCanvas.height);ovCtx.stroke()}
    for(let y=oy;y<=overlayCanvas.height;y+=fh){ovCtx.beginPath();ovCtx.moveTo(0,y);ovCtx.lineTo(overlayCanvas.width,y);ovCtx.stroke()}
    ovCtx.setLineDash([]);ovCtx.restore();
  }

  // Anchor point (align mode or always if set)
  if(S.anchor.x>0||S.anchor.y>0){
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

container.addEventListener('mousedown',e=>{
  const pos=screenToCanvas(e.clientX,e.clientY);

  // Anchor place mode
  if(S.anchorMode){
    const snap=$('chk-snap-anchor').checked;
    let ax=Math.round(pos.x),ay=Math.round(pos.y);
    if(snap){const fw=+$('frame-w').value,fh=+$('frame-h').value;ax=Math.round(ax/fw)*fw;ay=Math.round(ay/fh)*fh}
    S.anchor={x:ax,y:ay};
    $('anchor-x').value=ax;$('anchor-y').value=ay;$('anchor-x-num').value=ax;$('anchor-y-num').value=ay;
    $('ancx-val').textContent=ax;$('ancy-val').textContent=ay;
    updateAnchorList();drawOverlay();
    // Update current frame anchor
    if(S.selectedFrame>=0&&S.selectedFrame<S.frames.length)S.frames[S.selectedFrame].anchor={x:ax,y:ay};
    toast('Anchor set at '+ax+','+ay,'success');
    return;
  }

  // Default: pan
  S.isPanning=true;S.panStartX=e.clientX;S.panStartY=e.clientY;S.panStartPanX=S.panX;S.panStartPanY=S.panY;container.classList.add('grabbing');
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
  if(S.isPanning){S.panX=S.panStartPanX+(e.clientX-S.panStartX);S.panY=S.panStartPanY+(e.clientY-S.panStartY);markManualView();applyTransform()}
});
window.addEventListener('mouseup',()=>{S.isPanning=false;S.draggingAnchor=false;container.classList.remove('grabbing')});

// Zoom buttons
$('btn-zoom-in').addEventListener('click',()=>{const r=container.getBoundingClientRect();setZoom(S.zoom*1.25,r.width/2,r.height/2)});
$('btn-zoom-out').addEventListener('click',()=>{const r=container.getBoundingClientRect();setZoom(S.zoom*.8,r.width/2,r.height/2)});
$('btn-zoom-fit').addEventListener('click',()=>fitToView());
$('btn-auto-fit').addEventListener('click',()=>{S.autoFitFrames=!S.autoFitFrames;$('btn-auto-fit').classList.toggle('active',S.autoFitFrames);S.reviewFitReady=false;if(mainCanvas.width)fitToView();toast(S.autoFitFrames?'Auto-fit review on':'Review fit locked')});
$('btn-reset-layout').addEventListener('click',()=>resetLayout('all'));

// Undo/redo
$('btn-undo').addEventListener('click',undo);
$('btn-redo').addEventListener('click',redo);
document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo()}if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();redo()}if(e.key==='o'){$('btn-onion').click()}if(e.key==='f'){e.preventDefault();fitToView()}if(e.key==='ArrowLeft'&&S.frames.length){e.preventDefault();$('btn-tl-prev').click()}if(e.key==='ArrowRight'&&S.frames.length){e.preventDefault();$('btn-tl-next').click()}if(e.key.toLowerCase()==='i'&&S.frames.length){e.preventDefault();gotoIssue(e.shiftKey?-1:1)}if(e.key==='m'&&S.frames.length){e.preventDefault();togglePreviewFrame(S.selectedFrame)}if(e.key==='Escape'&&S.previewFrames.length){e.preventDefault();clearPreviewFrames()}if(e.key===' '&&S.frames.length){e.preventDefault();$('btn-tl-play').click()}});

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
function renderPreviewImageData(imgData,label){if(!imgData)return;S.previewImageData=cloneImageData(imgData);S.previewMode=label;const pw=232,ratio=imgData.height/imgData.width;previewCanvas.width=pw;previewCanvas.height=Math.max(1,Math.round(pw*ratio));prevCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);const tc=document.createElement('canvas');tc.width=imgData.width;tc.height=imgData.height;tc.getContext('2d').putImageData(imgData,0,0);prevCtx.drawImage(tc,0,0,previewCanvas.width,previewCanvas.height);document.querySelector('.preview-label').textContent=label}
function updatePreview(){if(!S.currentImageData&&!mainCanvas.width)return;if(S.currentImageData)renderPreviewImageData(S.currentImageData,'CURRENT');else{const pw=232,ratio=mainCanvas.height/mainCanvas.width;previewCanvas.width=pw;previewCanvas.height=Math.round(pw*ratio);prevCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);prevCtx.drawImage(mainCanvas,0,0,previewCanvas.width,previewCanvas.height);S.previewImageData=null;S.previewMode='CURRENT'}updateReviewMetrics()}
function showOriginalPreview(){if(!S.originalImageData)return;renderPreviewImageData(S.originalImageData,'ORIGINAL')}
function showCurrentPreview(){updatePreview();document.querySelector('.preview-label').textContent='CURRENT'}
function showRepairPreview(kind){if(!S.currentImageData){toast('Load an image first','warning');return}let img=cloneImageData(S.currentImageData),label='PREVIEW';if(kind==='stray'){img=removeStrayPixels(img,+$('stray-size').value);label='PREVIEW STRAY'}else if(kind==='pinholes'){img=fillAlphaPinholes(img,+$('stray-size').value);label='PREVIEW PINHOLES'}else if(kind==='outline'){img=normalizeOutline(img,+$('outline-radius').value);label='PREVIEW OUTLINE'}renderPreviewImageData(img,label);toast(label.toLowerCase().replace('preview ','')+' preview only')}
$('btn-preview-cur').addEventListener('click',showCurrentPreview);
$('btn-preview-orig').addEventListener('click',showOriginalPreview);
$('btn-preview-stray').addEventListener('click',()=>showRepairPreview('stray'));
$('btn-preview-pinholes').addEventListener('click',()=>showRepairPreview('pinholes'));
$('btn-preview-outline').addEventListener('click',()=>showRepairPreview('outline'));

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

$('btn-clean-run').addEventListener('click',()=>{
  if(!S.currentImageData){toast('Load an image first','warning');return}
  pushUndo();
  const imgData=cloneImageData(S.currentImageData);
  cleanAlpha(imgData,+$('tolerance').value,+$('max-saturation').value,$('chk-edge-seed').checked,$('chk-remove-fringe').checked);
  S.currentImageData=imgData;
  // Update current frame if sliced
  if(S.selectedFrame>=0&&S.selectedFrame<S.frames.length)S.frames[S.selectedFrame].imgData=cloneImageData(imgData);
  applyImageData(S.currentImageData);drawOverlay();updateFrameStrip();toast('Background removed','success');
});

// ════════════════════════════════════════════
// ISLAND DETECTION
// ════════════════════════════════════════════
function findComponents(imgData,athresh){const{width:w,height:h,data}=imgData;const visited=new Uint8Array(w*h);const comps=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const idx=y*w+x;if(visited[idx])continue;visited[idx]=1;if(data[idx*4+3]<=athresh)continue;let minX=x,maxX=x,minY=y,maxY=y,count=0;const stack=[[x,y]];while(stack.length){const[cx,cy]=stack.pop();count++;if(cx<minX)minX=cx;if(cx>maxX)maxX=cx;if(cy<minY)minY=cy;if(cy>maxY)maxY=cy;for(const[nx,ny]of[[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1],[cx+1,cy+1],[cx-1,cy-1],[cx+1,cy-1],[cx-1,cy+1]]){if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=ny*w+nx;if(visited[ni])continue;visited[ni]=1;if(data[ni*4+3]>athresh)stack.push([nx,ny])}}comps.push({minX,minY,maxX,maxY,width:maxX-minX+1,height:maxY-minY+1,count})}return comps}
function boxesDist(a,b){const dx=Math.max(0,Math.max(a.minX-b.maxX,b.minX-a.maxX)),dy=Math.max(0,Math.max(a.minY-b.maxY,b.minY-a.maxY));return Math.sqrt(dx*dx+dy*dy)}
function mergeNearby(comps,dist){let groups=comps.map(c=>({...c}));let changed=true;while(changed){changed=false;outer:for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)if(boxesDist(groups[i],groups[j])<=dist){groups[i]={minX:Math.min(groups[i].minX,groups[j].minX),minY:Math.min(groups[i].minY,groups[j].minY),maxX:Math.max(groups[i].maxX,groups[j].maxX),maxY:Math.max(groups[i].maxY,groups[j].maxY),count:(groups[i].count||0)+(groups[j].count||0)};groups.splice(j,1);changed=true;break outer}}for(const g of groups){g.width=g.maxX-g.minX+1;g.height=g.maxY-g.minY+1;g.cx=(g.minX+g.maxX)/2;g.cy=(g.minY+g.maxY)/2}return groups}
function sortTopLeft(groups){const sorted=[...groups].sort((a,b)=>a.cy-b.cy);const rows=[];for(const g of sorted){let placed=false;for(const row of rows){const avgY=row.reduce((s,it)=>s+it.cy,0)/row.length;const avgH=row.reduce((s,it)=>s+it.height,0)/row.length;if(Math.abs(g.cy-avgY)<=Math.max(avgH*.75,20)){row.push(g);placed=true;break}}if(!placed)rows.push([g])}for(const row of rows)row.sort((a,b)=>a.cx-b.cx);rows.sort((a,b)=>a.reduce((s,it)=>s+it.cy,0)/a.length-b.reduce((s,it)=>s+it.cy,0)/b.length);return rows.flat()}

$('btn-detect').addEventListener('click',()=>{
  if(!S.currentImageData){toast('Load an image first','warning');return}
  const comps=findComponents(S.currentImageData,+$('alpha-threshold').value);
  const useful=comps.filter(c=>c.count>=8);
  S.detectedGroups=sortTopLeft(mergeNearby(useful,+$('merge-distance').value));
  drawOverlay();toast('Detected '+S.detectedGroups.length+' groups','success');
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
function repackSheet(){
  if(!S.frames.length){toast('Slice frames first','warning');return}
  const cols=+$('export-cols').value, pad=+$('chk-no-pad').checked?0:+$('export-pad').value;
  const fw=S.frames[0].imgData.width, fh=S.frames[0].imgData.height;
  const cellW=fw+pad*2, cellH=fh+pad*2;
  const rows=Math.ceil(S.frames.length/cols);
  const outW=cellW*cols, outH=cellH*rows;
  const outC=document.createElement('canvas');outC.width=outW;outC.height=outH;
  const outCtx=outC.getContext('2d');outCtx.clearRect(0,0,outW,outH);

  S.frames.forEach((f,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const dx=col*cellW+pad, dy=row*cellH+pad;
    const tmpC=document.createElement('canvas');tmpC.width=f.imgData.width;tmpC.height=f.imgData.height;
    tmpC.getContext('2d').putImageData(f.imgData,0,0);
    outCtx.drawImage(tmpC,dx,dy);
  });

  return outC;
}

$('btn-repack').addEventListener('click',()=>{
  const outC=repackSheet();if(!outC)return;
  const imgData=outC.getContext('2d').getImageData(0,0,outC.width,outC.height);
  S.currentImageData=imgData;mainCanvas.width=outC.width;mainCanvas.height=outC.height;
  ctx.putImageData(imgData,0,0);updateOverlaySize();S.reviewFitReady=false;fitToView();updatePreview();updateInfoSize();drawOverlay();
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
  {id:'grid',label:'Grid is within 4x4 generation contract',check:()=>S.frames.length>0&&S.frames.length<=16&&(+$('export-cols').value||1)<=4&&Math.ceil(S.frames.length/(+$('export-cols').value||1))<=4,action:'Use up to 16 frames with no more than 4 export columns.'},
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
$('manifest-loop').addEventListener('input',()=>{$('loop-val').textContent=+$('manifest-loop').value===0?'∞':$('manifest-loop').value});
$('spec-prompt').addEventListener('input',()=>{S.specGuide.prompt=$('spec-prompt').value;renderSpecGuide(S.specGuide)});

// ════════════════════════════════════════════
// DUAL BG EXTRACT
// ════════════════════════════════════════════
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
try{const saved=localStorage.getItem('sprite-atlas-studio-cfg');if(saved)applyConfig(JSON.parse(saved))}catch(e){}

// Anchor input live update
['anchor-x','anchor-x-num'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',()=>{S.anchor.x=+el.value;drawOverlay();updateAnchorList()})});
['anchor-y','anchor-y-num'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',()=>{S.anchor.y=+el.value;drawOverlay();updateAnchorList()})});

// Frame size live update for grid overlay
['frame-w','frame-h','grid-ox','grid-oy'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',()=>drawOverlay())});

})();
