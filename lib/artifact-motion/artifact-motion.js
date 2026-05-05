// artifact-motion.js
// Minimal extraction of the “native feel” drag system from Solitaire.

export function createArtifactMotion(cfg) {
  const state = { drag: null };

  const opt = Object.assign({
    threshold: 10,
    stiffness: 0.24,
    friction: 0.70,
    sound: true,
    haptics: true,
  }, cfg);

  function ping(type="tap"){
    if(!opt.sound) return;
    try{
      const ctx = ping.ctx || (ping.ctx = new (window.AudioContext||window.webkitAudioContext)());
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.type="triangle";
      o.frequency.value = type==="snap"?420:type==="bad"?150:260;
      g.gain.value=.0001; o.connect(g); g.connect(ctx.destination);
      const t=ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(type==="snap"?.03:.02,t+.01);
      g.gain.exponentialRampToValueAtTime(.0001,t+.1);
      o.start(t); o.stop(t+.12);
    }catch{}
    if(opt.haptics && navigator.vibrate){
      navigator.vibrate(type==="snap"?12:type==="bad"?[18,24,18]:8);
    }
  }

  function startSpring(d){
    const step=()=>{
      const k=opt.stiffness, fr=opt.friction;
      d.vx=(d.vx+(d.tx-d.x)*k)*fr;
      d.vy=(d.vy+(d.ty-d.y)*k)*fr;
      d.x+=d.vx; d.y+=d.vy;
      render(d);
      d.raf=requestAnimationFrame(step);
    };
    d.raf=requestAnimationFrame(step);
  }

  function render(d){
    const rot=Math.max(-8,Math.min(8,d.vx*.08));
    d.layer.style.transform=`translate3d(${d.x}px,${d.y}px,0) rotate(${rot}deg)`;
  }

  function onDown(e){
    const src=e.target.closest(opt.draggable);
    if(!src) return;
    state.drag={src,startX:e.clientX,startY:e.clientY,active:false};
  }

  function onMove(e){
    const d=state.drag; if(!d) return;
    const dx=e.clientX-d.startX, dy=e.clientY-d.startY;
    if(!d.active && Math.hypot(dx,dy)>opt.threshold){
      d.active=true;
      d.layer=document.createElement("div");
      d.layer.className="am-ghost-layer";
      document.body.appendChild(d.layer);
      const clone=d.src.cloneNode(true);
      clone.classList.add("am-ghost-item");
      d.layer.appendChild(clone);
      d.x=e.clientX; d.y=e.clientY; d.vx=0; d.vy=0; d.tx=d.x; d.ty=d.y;
      startSpring(d);
      ping("tap");
    }
    if(!d.active) return;
    e.preventDefault();
    d.tx=e.clientX; d.ty=e.clientY;
  }

  function onUp(){
    const d=state.drag; if(!d) return;
    if(d.active){ d.layer.remove(); ping("snap"); }
    state.drag=null;
  }

  opt.root.addEventListener("pointerdown",onDown);
  opt.root.addEventListener("pointermove",onMove,{passive:false});
  opt.root.addEventListener("pointerup",onUp);

  return { destroy(){ /* omitted */ } };
}
