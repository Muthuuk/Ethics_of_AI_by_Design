/* Ethics of AI by Design: 3D lesson scenes.
   One WebGL stage per lesson. Each scene is built from simple shapes and moves through "steps"
   that follow the narration. Labels are HTML, so they stay sharp and readable.
   Requires assets/vendor/three.min.js (Three.js r128, MIT licence). */
(function(){
'use strict';
const C = { teal:0x2dd4bf, amber:0xf59e0b, coral:0xf87171, blue:0x60a5fa, violet:0xa78bfa, green:0x4ade80,
            slate:0x94a3b8, white:0xf1f5f9, dim:0x334155, pink:0xf472b6 };
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const lerp = (a,b,k) => a + (b-a)*k;

function webglOK(){ try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch(e){ return false; } }

/* ---------- helpers used by every scene ---------- */
function mkCtx(stage){
  const T = THREE;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(42, 16/9, 0.1, 200);
  scene.add(new T.HemisphereLight(0xdbeafe, 0x0b1a20, 0.85));
  const sun = new T.DirectionalLight(0xffffff, 0.75); sun.position.set(6,10,8); scene.add(sun);
  const anims = [];
  const ctx = {
    T, scene, camera, anims, labels: [], stage,
    target: new T.Vector3(0,0,0), dist: 14, yaw: 0, pitch: 0.32, swayAmp: 0.18,
    mat(color, o){ o = o||{}; const m = new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: o.e!=null?o.e:0.15, roughness: 0.45, metalness: 0.1, transparent: true, opacity: o.o!=null?o.o:1, depthWrite: o.o==null || o.o>0.9 }); return m; },
    add(mesh, tgt){ scene.add(mesh); if (tgt!==false) ctx.anim(mesh, tgt); return mesh; },
    /* every animated mesh eases towards userData.tgt = {s:scale, e:glow, o:opacity, p:position} */
    anim(mesh, tgt){ const m = mesh.material; mesh.userData.tgt = Object.assign({ s: mesh.scale.x, e: m && m.emissiveIntensity!=null ? m.emissiveIntensity : 0, o: m ? m.opacity : 1 }, tgt||{}); anims.push(mesh); return mesh; },
    set(mesh, t){ Object.assign(mesh.userData.tgt, t); },
    label(text, pos, cls){ const el = document.createElement('div'); el.className = 'lbl ' + (cls||''); el.textContent = text; stage.labelLayer.append(el);
      const L = { el, pos: pos.clone ? pos.clone() : new T.Vector3(pos[0],pos[1],pos[2]), on: true, obj: null, show(v){ L.on = v; return L; }, cls(c, v){ el.classList.toggle(c, v); return L; } }; ctx.labels.push(L); return L; },
    box(w,h,d,color,o){ return new T.Mesh(new T.BoxGeometry(w,h,d), ctx.mat(color,o)); },
    sphere(r,color,o){ return new T.Mesh(new T.SphereGeometry(r, 40, 28), ctx.mat(color,o)); },
    cyl(rt,rb,h,color,o,seg){ return new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg||48), ctx.mat(color,o)); },
    ring(r,tube,color,o){ return new T.Mesh(new T.TorusGeometry(r,tube,16,96), ctx.mat(color,o)); },
    line(points, color, opacity){ const g = new T.BufferGeometry().setFromPoints(points.map(p=>p.isVector3?p:new T.Vector3(...p))); const l = new T.Line(g, new T.LineBasicMaterial({ color, transparent:true, opacity: opacity==null?0.8:opacity })); scene.add(l); return l; },
    tube(points, r, color, o){ const curve = new T.CatmullRomCurve3(points.map(p=>p.isVector3?p:new T.Vector3(...p))); return new T.Mesh(new T.TubeGeometry(curve, 64, r, 10, false), ctx.mat(color,o)); },
    arrow(from, to, color){ const a = new T.Vector3(...from), b = new T.Vector3(...to); const dir = b.clone().sub(a); const len = dir.length(); dir.normalize();
      const g = new T.Group(); const shaft = ctx.cyl(0.05,0.05,len-0.35,color,{e:0.5}); shaft.position.y = (len-0.35)/2; const head = ctx.cyl(0,0.16,0.35,color,{e:0.5}); head.position.y = len-0.175;
      g.add(shaft, head); g.position.copy(a); g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), dir); scene.add(g); return g; },
    floor(size, color){ const g = new T.Mesh(new T.CircleGeometry(size||9, 64), new T.MeshStandardMaterial({ color: color||0x0f2a33, roughness:0.9, transparent:true, opacity:0.85 })); g.rotation.x = -Math.PI/2; g.position.y = -2.2; scene.add(g);
      const grid = new T.PolarGridHelper(size||9, 12, 6, 64, 0x1e4a55, 0x173c45); grid.position.y = -2.19; grid.material.transparent = true; grid.material.opacity = 0.5; scene.add(grid); return g; },
    person(color){ const g = new T.Group(); const body = ctx.cyl(0.22,0.3,0.8,color); body.position.y = 0.4; const head = ctx.sphere(0.2,color); head.position.y = 1.02; g.add(body, head); g.userData.parts = [body, head]; return g; },
  };
  return ctx;
}
function setGroup(g, t){ (g.userData.parts||[]).forEach(p=>{ if (p.userData.tgt) Object.assign(p.userData.tgt, t); }); }
function animGroup(ctx, g, t){ (g.userData.parts||[]).forEach(p=>ctx.anim(p, t)); }

/* ---------- scene library ---------- */
const S = {};

/* 1. Timeline: from rules written by people to deep learning, then real-world impact */
S.timeline = (c) => {
  c.dist = 15; c.floor();
  const nodes = [ [-6,0,0,'Symbolic AI','Rules written by people',C.blue], [-1.5,0,0,'Deep learning','Learns patterns from data',C.violet] ];
  const N = nodes.map(([x,y,z,t,s,col]) => { const m = c.add(c.sphere(0.8,col,{e:0.1,o:0.5}), {e:0.1,o:0.5}); m.position.set(x,y,z); const L = c.label(t, [x,y+1.35,z], 'b'); const L2 = c.label(s, [x,y-1.35,z], 'sm'); return {m,L,L2}; });
  c.add(c.tube([[-5.2,0,0],[-3.8,0.5,0],[-2.3,0,0]], 0.07, C.slate, {e:0.3,o:0.7}), false);
  const areas = [[4.5,2.2,-0.5,'Hiring'],[5.2,0,0.6,'Healthcare'],[4.5,-2.2,-0.5,'Justice']];
  const A = areas.map(([x,y,z,t]) => { const m = c.add(c.box(1.1,1.1,1.1,C.amber,{e:0.05,o:0.25}), {o:0.25,e:0.05,s:0.6}); m.position.set(x,y,z); m.scale.setScalar(0.6);
    const tb = c.add(c.tube([[-0.7,0,0],[1.8,y*0.4,0],[x-0.7,y,z]], 0.05, C.amber, {e:0.4,o:0}), {o:0}); return {m, tb, L: c.label(t,[x,y+0.95,z],'b warn').show(false)}; });
  const society = c.label('AI now shapes decisions about people', [4.8,3.6,0], 'sm').show(false);
  c.setStep = (s) => {
    N[0].m.userData.tgt.e = s===0 ? 0.9 : 0.25; N[0].m.userData.tgt.o = s===0 ? 1 : 0.6;
    N[1].m.userData.tgt.e = s>=1 ? 0.9 : 0.1;  N[1].m.userData.tgt.o = s>=1 ? 1 : 0.4; N[1].m.userData.tgt.s = s>=1 ? 1.25 : 1;
    A.forEach(a => { c.set(a.m, {o: s>=2?1:0.25, e: s>=2?0.7:0.05, s: s>=2?1:0.6}); c.set(a.tb, {o: s>=2?0.9:0}); a.L.show(s>=2); });
    society.show(s>=2);
  };
  c.update = (t) => { A.forEach((a,i)=>{ a.m.rotation.y = t*0.5+i; a.m.rotation.x = t*0.3; }); N[1].m.rotation.y = t*0.4; };
};

/* 2. Pyramid of AI classes: ANI at the base (here today), AGI (future), ASI (theoretical) */
S.pyramid = (c) => {
  c.dist = 13; c.target.set(0,0.4,0); c.floor();
  const tiers = [[3.2,2.2,-1.2,'ANI · Narrow AI','Does one task. All AI in use today.',C.teal],[2.2,1.4,0.6,'AGI · General AI','Human-level. A future idea.',C.violet],[1.4,0.01,2.2,'ASI · Super AI','Beyond human. Theoretical risks.',C.coral]];
  const P = tiers.map(([rb,rt,y,t,s,col],i) => { const m = c.add(c.cyl(rt,rb,1.6,col,{e:0.15,o:0.85},4), {}); m.position.y = y; m.rotation.y = Math.PI/4;
    return {m, L: c.label(t,[rb+1.9,y+0.3,0],'b'), L2: c.label(s,[rb+1.9,y-0.35,0],'sm')}; });
  const icons = []; for (let i=0;i<6;i++){ const ic = c.add(c.box(0.32,0.32,0.32,[C.teal,C.blue,C.green][i%3],{e:0.6,o:0}), {o:0}); icons.push(ic); }
  const tags = ['Sat-nav','Spam filter','Face unlock','Translation','Film suggestions','Speech to text'].map(t=>c.label(t,[0,0,0],'xs').show(false));
  c.setStep = (s) => {
    P.forEach((p,i) => { const on = s===0 || (s===1 && i===0) || (s===2 && i>0); c.set(p.m, {e: on?0.7:0.08, o: on?0.95:(s===1?0.25:0.5)}); p.L.cls('faded', !on); p.L2.cls('faded', !on); });
    icons.forEach(ic=>c.set(ic,{o: s===1?1:0})); tags.forEach(L=>L.show(s===1));
  };
  c.update = (t) => { icons.forEach((ic,i)=>{ const a = t*0.5 + i*Math.PI/3; ic.position.set(Math.cos(a)*4.2, -1.2+Math.sin(t+i)*0.2, Math.sin(a)*4.2); ic.rotation.set(t,t*1.3,0); tags[i].pos.set(ic.position.x, ic.position.y+0.45, ic.position.z); }); P.forEach((p,i)=>p.m.rotation.y = Math.PI/4 + t*0.12*(i%2?-1:1)); };
};

/* 3. Five principles as overlapping glass spheres. step = index of principle to highlight; 5 = all, -1 = none */
S.spheres = (c, o) => {
  c.dist = 14.5; c.floor();
  const names = (o && o.names) || ['Transparency','Fairness','Accountability','Privacy','Do no harm'];
  const subs = (o && o.subs) || ['Clear how decisions are made','No discriminatory outcomes','Someone answers for outcomes','Data protection and consent','Non-maleficence'];
  const cols = [C.blue, C.amber, C.violet, C.teal, C.coral];
  const R = 2.6;
  const B = names.map((n,i) => { const a = -Math.PI/2 + i*2*Math.PI/names.length; const m = c.add(c.sphere(1.55, cols[i], {e:0.12,o:0.42}), {}); m.position.set(Math.cos(a)*R, 0.2, Math.sin(a)*R);
    return {m, a, L: c.label(n,[0,0,0],'b'), L2: c.label(subs[i]||'',[0,0,0],'sm')}; });
  const core = c.add(c.sphere(0.55, C.white, {e:0.5,o:0.9}), {}); core.position.y = 0.2;
  const coreL = c.label(o && o.core || 'Trustworthy AI', [0,1.25,0], 'xs');
  c.setStep = (s) => { B.forEach((b,i) => { const on = s===i || s>=names.length; c.set(b.m, { e: on?0.85:0.1, o: on?0.8:(s<0?0.42:0.18), s: s===i?1.18:1 }); b.L.cls('faded', !(on||s<0)); b.L2.show(on && s<names.length); }); coreL.show(s<0 || s>=names.length); };
  c.update = (t) => { const spin = reduceMotion()?0:t*0.12; B.forEach(b => { const a = b.a + spin; b.m.position.set(Math.cos(a)*R, 0.2+Math.sin(t*0.8+b.a)*0.12, Math.sin(a)*R); const dir = new THREE.Vector3(Math.cos(a),0,Math.sin(a)); b.L.pos.copy(b.m.position).addScaledVector(dir,1.9).setY(b.m.position.y+1.1); b.L2.pos.copy(b.L.pos).setY(b.L.pos.y-0.55); }); };
};

/* 4. Stack: principles at the base, frameworks in the middle, tools on top, Ethics by Design runs through all */
S.stack = (c) => {
  c.dist = 14; c.target.set(0,0.2,0); c.pitch = 0.42; c.floor();
  const layers = [[-1.6,'Principles','Fairness · Transparency · Accountability · Privacy · Do no harm',C.blue],[0.2,'Frameworks and guidelines','EU Trustworthy AI · IEEE · OECD',C.violet],[2.0,'Tools','Checklists · Scorecards · Audits',C.amber]];
  const Ls = layers.map(([y,t,s,col]) => { const m = c.add(c.box(6.4,0.55,4,col,{e:0.1,o:0.15}), {o:0.15,s:0.92}); m.position.y = y; m.scale.setScalar(0.92); return {m, L:c.label(t,[4.6,y+0.25,0],'b').show(false), L2:c.label(s,[4.6,y-0.32,0],'sm').show(false)}; });
  const beam = c.add(c.cyl(0.32,0.32,4.8,C.teal,{e:0.8,o:0}), {o:0}); beam.position.y = 0.2;
  const bl = c.label('AI Ethics by Design: one method through every layer', [0,3.3,0], 'b good').show(false);
  c.setStep = (s) => { Ls.forEach((l,i)=>{ const on = s>=i; c.set(l.m, {o: on?0.9:0.12, e: s===i?0.75:on?0.25:0.05, s: on?1:0.92}); l.L.show(on); l.L2.show(on); }); c.set(beam,{o: s>=3?0.85:0}); bl.show(s>=3); };
  c.update = (t) => { beam.rotation.y = t; };
};

/* 5. Framework circles: shared values in the middle; implementation drifts apart; adaptive governance ring */
S.circles = (c, o) => {
  c.dist = 14; c.pitch = 0.75; c.floor();
  const names = (o && o.names) || ['EU','OECD','IEEE','UNESCO'];
  const cols = [C.blue, C.amber, C.violet, C.green];
  const D = names.map((n,i) => { const a = i*2*Math.PI/names.length + Math.PI/4; const m = c.add(c.cyl(2.3,2.3,0.25,cols[i],{e:0.2,o:0.45}), {}); return {m, a, r:1.35, rt:1.35, L:c.label(n,[0,0,0],'b')}; });
  const core = c.add(c.cyl(0.95,0.95,0.5,C.white,{e:0.6,o:0.95}), {}); const coreL = c.label('Shared values', [0,1.1,0], 'b');
  const ring = c.add(c.ring(5.6,0.08,C.teal,{e:0.9,o:0}), {o:0}); ring.rotation.x = Math.PI/2;
  const ringL = c.label('Adaptive governance: keeps reviewing and updating', [0,0.6,6.2], 'b good').show(false);
  const gapL = c.label('Implementation differs', [0,2.2,0], 'b warn').show(false);
  c.setStep = (s) => { D.forEach((d,i)=>{ d.rt = s===1 ? 3.6 : 1.35; c.set(d.m, {o: s===1?0.75:0.45, e: s===1?0.4:0.2}); }); c.set(core, {o: s===1?0.25:0.95, s: s===1?0.7:1}); coreL.cls('faded', s===1); gapL.show(s===1); c.set(ring, {o: s>=2?0.9:0}); ringL.show(s>=2); };
  c.update = (t, dt) => { D.forEach(d=>{ d.r = lerp(d.r, d.rt, 0.05); const a = d.a + (reduceMotion()?0:t*0.05); d.m.position.set(Math.cos(a)*d.r, 0, Math.sin(a)*d.r); d.L.pos.set(Math.cos(a)*(d.r+1.6), 0.6, Math.sin(a)*(d.r+1.6)); }); ring.rotation.z = t*0.3; };
};

/* 6. Sociotechnical system: the model sits inside rings of technology, process and people */
S.sociotech = (c) => {
  c.dist = 14; c.pitch = 0.55; c.floor();
  const core = c.add(c.box(1.3,1.3,1.3,C.white,{e:0.5}), {}); const coreL = c.label('AI model (the code)', [0,1.3,0], 'b');
  const rings = [[2.4,'Technology','Data, computers, software',C.blue],[3.7,'Processes and rules','Who decides, checks and signs off',C.amber],[5.0,'People and society','Users, people affected, culture, law',C.green]];
  const Rg = rings.map(([r,t,s,col],i) => { const m = c.add(c.ring(r,0.16,col,{e:0.3,o:0.15}), {o:0.15}); m.rotation.x = Math.PI/2; return {m, r, L:c.label(t,[r*0.72,0.6,r*0.72],'b').show(false), L2:c.label(s,[r*0.72,0.05,r*0.72],'sm').show(false)}; });
  const ppl = []; for (let i=0;i<10;i++){ const p = c.person([C.green,C.teal,C.amber][i%3]); const a = i*Math.PI/5; p.position.set(Math.cos(a)*5, -2.2, Math.sin(a)*5); p.scale.setScalar(0.9); c.scene.add(p); animGroup(c,p,{o:0}); setGroup(p,{o:0}); ppl.push(p); }
  c.setStep = (s) => { Rg.forEach((g,i)=>{ const on = s>i || s>=3; c.set(g.m,{o: on?0.9:0.15, e: s===i+1?0.9:on?0.35:0.1}); g.L.show(on); g.L2.show(on); }); ppl.forEach(p=>setGroup(p,{o: s>=3?1:0})); coreL.cls('faded', s>=1 && s<3); c.set(core,{e: s===0?0.9:0.4}); };
  c.update = (t) => { core.rotation.set(t*0.4, t*0.6, 0); Rg.forEach((g,i)=>g.m.rotation.z = t*0.15*(i%2?-1:1)); };
};

/* 7. Ladder from principle to practice */
S.ladder = (c, o) => {
  c.dist = 14; c.target.set(0,0.6,0); c.floor();
  const steps = (o && o.steps) || [['Principle','"Be fair"'],['Requirement','"Approval rates must not differ by group"'],['Test','"Measure approval rates per group"'],['Audit','"Check the tests ran and the results"']];
  const cols = [C.blue, C.violet, C.amber, C.green];
  const St = steps.map(([t,s],i) => { const m = c.add(c.box(2.2,0.5,2.2,cols[i],{e:0.1,o:0.35}), {}); m.position.set(-4.2+i*2.8, -1.8+i*1.15, 0); return {m, L:c.label(t,[m.position.x,m.position.y+0.75,0],'b'), L2:c.label(s,[m.position.x,m.position.y-0.7,1.2],'sm').show(false)}; });
  const ball = c.add(c.sphere(0.35,C.white,{e:0.9}), false); ball.userData.p = new THREE.Vector3(); ball.userData.goal = St[0].m.position.clone().setY(St[0].m.position.y+0.65); ball.position.copy(ball.userData.goal);
  const head = c.label((o && o.head) || 'Abstract  →  concrete', [0,3.6,0], 'sm');
  c.setStep = (s) => { St.forEach((x,i)=>{ c.set(x.m,{o: i<=s?0.95:0.3, e: i===s?0.85:i<s?0.3:0.08}); x.L2.show(i===s); x.L.cls('faded', i>s); }); const k = Math.max(0,Math.min(St.length-1,s)); ball.userData.goal = St[k].m.position.clone().setY(St[k].m.position.y+0.65); };
  c.update = (t) => { ball.position.lerp(ball.userData.goal, 0.06); ball.position.y += Math.abs(Math.sin(t*4))*0.02; };
};

/* 8. Lifecycle conveyor: stages from data collection to deployment. o.mode: 'gates' (ethics review) or 'warnings' (challenges) */
S.lifecycle = (c, o) => {
  c.dist = 15; c.pitch = 0.5; c.floor(10);
  const names = (o && o.names) || ['Data collection','Design','Build and train','Test','Deploy and monitor'];
  const mode = (o && o.mode) || 'gates';
  const track = c.add(c.box(13,0.25,1.6,C.dim,{e:0.05}), false); track.position.y = -1.4;
  const St = names.map((n,i) => { const x = -5.6 + i*2.8; const m = c.add(c.box(1.6,1.6,1.6,C.blue,{e:0.12,o:0.8}), {}); m.position.set(x,-0.4,0);
    const g = mode==='gates' ? c.add(c.ring(1.25,0.09,C.green,{e:0.9,o:0}), {o:0}) : c.add(c.sphere(0.32,C.coral,{e:1,o:0}), {o:0});
    if (mode==='gates'){ g.position.set(x+1.4,-0.3,0); g.rotation.y = Math.PI/2; } else g.position.set(x,1.0,0);
    return {m, g, L:c.label(n,[x,-2.3,1.3],'sm'), G:c.label(mode==='gates'?'Ethics review':((o && o.risks && o.risks[i])||'Risk'),[x+(mode==='gates'?1.4:0),mode==='gates'?1.3:1.75,0],'xs '+(mode==='gates'?'good':'bad')).show(false)}; });
  const pk = c.add(c.sphere(0.28,C.amber,{e:0.9}), false); const head = c.label((o && o.head) || '', [0,3.2,0], 'b').show(!!(o && o.head));
  let step = -1;
  c.setStep = (s) => { step = s; St.forEach((x,i)=>{ const on = s>=names.length || s===i; c.set(x.m,{e: on?0.6:0.12, s: s===i?1.12:1}); c.set(x.g,{o: (s>=names.length || s===i) ? 1:0}); x.G.show(s>=names.length || s===i); }); };
  c.update = (t) => { const u = ((reduceMotion()?0.5:t*0.12) % 1); pk.position.set(-6.8 + u*13.6, 0.6, 0); St.forEach(x=>x.m.rotation.y = t*0.2); if (mode!=='gates') St.forEach((x,i)=>{ if (x.g.userData.tgt.o>0.5) x.g.scale.setScalar(1+0.25*Math.abs(Math.sin(t*3+i))); }); };
};

/* 9. Bias pipeline: data particles flow into a model and come out as decisions. o.skew from step */
S.pipeline = (c, o) => {
  c.dist = 15; c.pitch = 0.35; c.floor(10);
  const tank = c.add(c.cyl(1.4,1.4,2.6,C.slate,{e:0.05,o:0.25}), false); tank.position.set(-5.5,0,0);
  const tankL = c.label((o && o.inLabel) || 'Training data', [-5.5,2.0,0], 'b');
  const model = c.add(c.box(2,2,2,C.violet,{e:0.35,o:0.85}), {}); const modelL = c.label('AI model', [0,1.7,0], 'b');
  const outA = c.add(c.box(1.2,0.15,1.2,C.teal,{e:0.4}), false), outB = c.add(c.box(1.2,0.15,1.2,C.pink,{e:0.4}), false);
  outA.position.set(5.5,1.2,0); outB.position.set(5.5,-1.2,0);
  const gA = (o && o.groups) || ['Group A','Group B'];
  const barA = c.add(c.box(0.6,1,0.6,C.teal,{e:0.6}), false), barB = c.add(c.box(0.6,1,0.6,C.pink,{e:0.6}), false);
  barA.position.set(7.2,1.2,0); barB.position.set(7.2,-1.2,0);
  const LA = c.label(gA[0], [4.9,2.0,0], 'xs'), LB = c.label(gA[1], [4.9,-0.4,0], 'xs');
  const msg = c.label('', [0,-3.2,0], 'b warn').show(false);
  const loop = c.add(c.tube([[6.5,-2,0],[4,-3.4,1.5],[-2,-3.4,1.5],[-5.5,-1.8,0]], 0.06, C.coral, {e:0.8,o:0}), {o:0});
  const loopL = c.label('Unfair decisions become tomorrow\'s data', [0,-2.6,2.2], 'xs bad').show(false);
  const parts = []; for (let i=0;i<60;i++){ const p = c.add(c.sphere(0.13, C.teal, {e:0.6}), false); p.userData.u = Math.random(); p.userData.k = i; parts.push(p); }
  let skew = 0.5, fair = false, ra = 0.5, rb = 0.5;
  c.setStep = (s) => { skew = s===0 ? 0.5 : 0.85; fair = s>=3; c.set(loop,{o: s===2?0.9:0}); loopL.show(s===2);
    msg.show(s>=1); msg.el.textContent = s===1 ? 'Data is mostly one group: the model learns a lopsided pattern' : s===2 ? 'Bias can reinforce existing discrimination' : s>=3 ? 'Fairness-aware adjustment: outcomes rebalanced' : '';
    msg.cls('warn', s<3); msg.cls('good', s>=3);
    parts.forEach(p => { const isA = (p.userData.k/parts.length) < skew; p.userData.g = isA ? 0 : 1; p.material.color.setHex(isA?C.teal:C.pink); p.material.emissive.setHex(isA?C.teal:C.pink); }); };
  c.update = (t) => { const tgtA = 0.7, tgtB = fair ? 0.66 : (skew>0.6 ? 0.25 : 0.7); ra = lerp(ra, tgtA, 0.05); rb = lerp(rb, tgtB, 0.05);
    barA.scale.y = 0.2+ra*3; barB.scale.y = 0.2+rb*3; barA.position.y = 1.2 + barA.scale.y/2 - 0.5; barB.position.y = -1.2 + barB.scale.y/2 - 0.5;
    LA.el.textContent = `${gA[0]}: ${Math.round(ra*100)}% approved`; LB.el.textContent = `${gA[1]}: ${Math.round(rb*100)}% approved`;
    model.rotation.y = t*0.3;
    parts.forEach(p => { p.userData.u = (p.userData.u + 0.0035*(reduceMotion()?0.3:1)) % 1; const u = p.userData.u; const g = p.userData.g; const lane = g===0 ? 1.2 : -1.2; const jit = Math.sin(p.userData.k*12.9)*0.5;
      if (u < 0.45){ const k = u/0.45; p.position.set(-5.5 + k*5.5, jit*(1-k), Math.cos(p.userData.k)*0.6*(1-k)); }
      else { const k = (u-0.45)/0.55; p.position.set(k*5.5, lerp(0, lane, Math.min(1,k*1.6)) + jit*0.15, 0); } }); };
};

/* 10. Black box: inputs go in, a decision comes out, nobody can see why. Explainable AI opens the box */
S.blackbox = (c) => {
  c.dist = 13; c.pitch = 0.3; c.floor();
  const box = c.add(c.box(3,3,3,0x0b1220,{e:0,o:1}), {}); box.material.color.setHex(0x111827); box.material.emissive.setHex(0x000000);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: C.slate })); box.add(edges);
  const inner = []; for (let i=0;i<9;i++){ const n = c.add(c.sphere(0.2,[C.teal,C.amber,C.violet][i%3],{e:0.9,o:0}), {o:0}); n.position.set(((i%3)-1)*0.8, (Math.floor(i/3)-1)*0.8, 0); inner.push(n); }
  const inL = c.label('Your details go in', [-4.5,1.4,0], 'sm'), outL = c.label('Decision: "Refused"', [4.6,1.4,0], 'b bad');
  c.add(c.tube([[-6,0,0],[-1.6,0,0]],0.06,C.blue,{e:0.6}), false); c.add(c.tube([[1.6,0,0],[6,0,0]],0.06,C.coral,{e:0.6}), false);
  const q = c.label('Why? Who is responsible?', [0,2.4,0], 'b warn').show(false);
  const xai = c.label('Explainable AI: shows the main reasons', [0,-2.6,0], 'b good').show(false);
  const reasons = ['Income weighted most','Short credit history','Postcode used'].map((t,i)=>c.label(t,[4.6,0.2-i*0.55,0],'xs').show(false));
  c.setStep = (s) => { c.set(box,{o: s>=2?0.18:1}); edges.material.color.setHex(s>=2?C.teal:C.slate); inner.forEach(n=>c.set(n,{o: s>=2?1:0})); q.show(s===1); xai.show(s>=2); reasons.forEach(r=>r.show(s>=2)); };
  c.update = (t) => { box.rotation.y = t*0.25; box.rotation.x = Math.sin(t*0.3)*0.15; inner.forEach((n,i)=>{ n.position.z = Math.sin(t*2+i)*0.7; }); };
};

/* 11. Station: facial recognition cameras watch a public space */
S.station = (c) => {
  c.dist = 15; c.pitch = 0.55; c.target.set(0,-0.6,0); c.floor(10);
  const plat = c.add(c.box(12,0.3,5,0x1f2937,{e:0.02}), false); plat.position.y = -2.05;
  const people = []; for (let i=0;i<9;i++){ const p = c.person([C.blue,C.green,C.amber,C.violet][i%4]); p.position.set(-4.8+i*1.2, -1.9, (i%2?0.9:-0.6)); c.scene.add(p); animGroup(c,p,{}); people.push(p); }
  const cams = [[-4,2.4,-2.2],[4,2.4,-2.2]].map(([x,y,z]) => { const g = new THREE.Group(); const b = c.box(0.8,0.45,0.5,C.slate,{e:0.2}); g.add(b); const cm = c.mat(C.amber,{e:0.7,o:0}); cm.side = THREE.DoubleSide; const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2,4.2,40,1,true), cm); cone.rotation.x = 0.4; cone.position.set(0,-2.1,0.9); g.add(cone); g.position.set(x,y,z); c.scene.add(g); c.anim(cone,{o:0}); return {g,cone}; });
  const L1 = c.label('Cameras scan every face', [0,3.2,-2.2], 'b warn').show(false);
  const flagged = people[5]; const flagL = c.label('Wrongly matched: stopped and questioned', [flagged.position.x, -0.2, 1.5], 'b bad').show(false);
  const sign = c.add(c.box(1.6,1,0.08,C.white,{e:0.6,o:0}), {o:0}); sign.position.set(5.6,-0.6,1.6); const signL = c.label('No notice, no consent', [5.6,0.4,1.6], 'xs bad').show(false);
  const store = c.add(c.cyl(0.7,0.7,1.2,C.violet,{e:0.6,o:0}), {o:0}); store.position.set(-5.6,-1.4,1.6); const storeL = c.label('Faces kept for how long?', [-5.6,-0.3,1.8], 'xs warn').show(false);
  c.setStep = (s) => { cams.forEach(k=>c.set(k.cone,{o: s>=1?0.28:0})); L1.show(s>=1); setGroup(flagged,{e: s>=2?1:0.15}); flagged.userData.parts.forEach(p=>{ p.material.color.setHex(s>=2?C.coral:C.violet); p.material.emissive.setHex(s>=2?C.coral:C.violet); }); flagL.show(s>=2); c.set(sign,{o:s>=3?0.95:0}); signL.show(s>=3); c.set(store,{o:s>=3?0.9:0}); storeL.show(s>=3); };
  c.update = (t) => { cams.forEach((k,i)=>{ k.g.rotation.y = Math.sin(t*0.6+i*2)*0.5; }); people.forEach((p,i)=>{ if (p!==flagged) p.position.x = -4.8 + ((i*1.2 + t*0.35) % 9.6); }); };
};

/* 12. Challenge-to-fix map */
S.fixmap = (c) => {
  c.dist = 16.5; c.pitch = 0.2; c.floor(10);
  const ch = ['Bias','Black box','Privacy and surveillance','Changing, self-acting systems'];
  const fx = ['Fairness-aware algorithms','Explainable AI','Privacy-preserving tech','Ethical audits and oversight'];
  const L = ch.map((t,i)=>{ const y = 2.5 - i*1.3; const a = c.add(c.box(0.8,0.8,0.8,C.coral,{e:0.2,o:0.6}), {}); a.position.set(-2.8,y,0); const b = c.add(c.sphere(0.5,C.teal,{e:0.2,o:0.6}), {}); b.position.set(2.8,y,0);
    const tb = c.add(c.tube([[-2.3,y,0],[0,y+0.35,1.2],[2.3,y,0]],0.06,C.amber,{e:0.9,o:0}), {o:0});
    return {a,b,tb, La:c.label(t,[-3.5,y,0],'b right'), Lb:c.label(fx[i],[3.5,y,0],'b left')}; });
  const gov = c.add(c.ring(5.9,0.07,C.violet,{e:0.9,o:0}), {o:0}); gov.rotation.x = Math.PI/2; gov.position.y = -3.4;
  const govL = c.label('Governance: many disciplines, acting before harm happens', [0,-3.1,4.8], 'b').show(false);
  c.setStep = (s) => { L.forEach((x,i)=>{ const on = s===i || s>=4; c.set(x.a,{e:on?0.8:0.15,o:on?1:0.5}); c.set(x.b,{e:on?0.8:0.15,o:on?1:0.5}); c.set(x.tb,{o:on?0.9:0}); x.La.cls('faded',!on && s>=0); x.Lb.cls('faded',!on && s>=0); }); c.set(gov,{o:s>=5?0.9:0}); govL.show(s>=5); };
  c.update = (t) => { L.forEach((x,i)=>{ x.a.rotation.set(t*0.5+i, t*0.4, 0); }); gov.rotation.z = t*0.2; };
};

/* 13. Stakeholder orbit */
S.orbit = (c, o) => {
  c.dist = 15; c.pitch = 0.6; c.floor(10);
  const core = c.add(c.box(1.2,1.2,1.2,C.white,{e:0.6}), {}); c.label((o && o.core) || 'AI system', [0,1.2,0], 'b');
  const nm = (o && o.names) || ['Users','People affected by decisions','Developers','The organisation','Regulators'];
  const st = nm.map((t,i)=>[t,[2.6,3.8,2.6,4.8,4.8][i],[C.blue,C.coral,C.violet,C.amber,C.green][i]]);
  const O = st.map(([t,r,col],i)=>{ const m = c.add(c.sphere(0.45,col,{e:0.3}), {}); const ring = c.add(c.ring(r,0.02,C.slate,{e:0.2,o:0.35}), false); ring.rotation.x = Math.PI/2; return {m, r, a: i*1.3, L:c.label(t,[0,0,0],'sm')}; });
  const L2 = c.label((o && o.msg) || 'Inclusive design: bring the outer circles into the design room', [0,3.4,0], 'b good').show(false);
  c.setStep = (s) => { O.forEach((o,i)=>{ c.set(o.m,{e: (s===i || s>=5)?0.9:0.2, s: s===i?1.4:1}); o.L.cls('faded', s>=0 && s<5 && s!==i); }); L2.show(s>=5); };
  c.update = (t) => { core.rotation.y = t*0.4; O.forEach((o,i)=>{ const a = o.a + t*0.18*(3/o.r); o.m.position.set(Math.cos(a)*o.r, 0, Math.sin(a)*o.r); o.L.pos.set(o.m.position.x, 0.75, o.m.position.z); }); };
};

/* 14. Dominoes: one ignored principle tips over into harm, lost trust and broken rules */
S.dominoes = (c, o) => {
  c.dist = 14; c.pitch = 0.35; c.floor(10);
  const names = (o && o.names) || ['A principle is ignored','People are harmed','Public trust is lost','Rules and standards broken'];
  const cols = [C.amber, C.coral, C.violet, C.blue];
  const D = names.map((t,i)=>{ const m = c.add(c.box(0.5,2.6,1.6,cols[i],{e:0.2}), {}); m.position.set(-4.5+i*3, -0.9, 0); m.userData.rot = 0; m.userData.rt = 0; return {m, L:c.label(t,[-4.5+i*3,1.0,0],'sm')}; });
  const ok = c.label((o && o.good) || 'Following the principles keeps every piece standing', [0,2.6,0], 'b good').show(false);
  c.setStep = (s) => { D.forEach((d,i)=>{ d.m.userData.rt = (s>=1 && s<9 && i < s) ? -1.2 : 0; c.set(d.m,{e: (s>=1 && i < s)?0.7:0.2}); }); ok.show(s>=9); };
  c.update = (t) => { D.forEach(d=>{ d.m.userData.rot = lerp(d.m.userData.rot, d.m.userData.rt, 0.06); d.m.rotation.z = d.m.userData.rot; d.m.position.y = -0.9 - Math.abs(Math.sin(d.m.userData.rot))*0.6; }); };
};

/* 15. Drift: a system that keeps learning slowly moves away from what was intended; oversight pulls it back */
S.drift = (c) => {
  c.dist = 14; c.pitch = 0.45; c.floor(10);
  const pts = []; for (let i=0;i<=40;i++) pts.push(new THREE.Vector3(-6+i*0.3, -1, Math.sin(i*0.25)*0.6));
  c.add(c.tube(pts,0.06,C.green,{e:0.6}), false); c.label('Intended behaviour', [-5,-0.4,0.6], 'sm good');
  const ball = c.add(c.sphere(0.4,C.amber,{e:0.9}), false); const trail = [];
  for (let i=0;i<24;i++){ const s = c.add(c.sphere(0.08,C.amber,{e:0.8,o:0.6}), false); trail.push(s); }
  const L1 = c.label('Keeps learning from new data: behaviour shifts (adaptive bias)', [2.5,2.4,0], 'b warn').show(false);
  const L2 = c.label('Acts on its own: fewer people check each decision', [2.5,1.7,0], 'sm').show(false);
  const mon = c.add(c.ring(1.1,0.08,C.teal,{e:1,o:0}), {o:0}); const L3 = c.label('Continuous oversight: monitor, alert, correct', [3,-2.6,1.4], 'b good').show(false);
  let step = 0, k = 0;
  c.setStep = (s) => { step = s; L1.show(s>=1); L2.show(s>=1); c.set(mon,{o:s>=2?0.95:0}); L3.show(s>=2); };
  c.update = (t) => { k = (k + 0.004*(reduceMotion()?0.3:1)) % 1; const x = -6 + k*12; const off = step===1 ? Math.pow(k,1.6)*3.2 : step>=2 ? Math.pow(k,1.6)*3.2*Math.max(0,1-Math.max(0,(k-0.45))*4) : 0;
    ball.position.set(x, -1 + off, Math.sin((x+6)/0.3*0.25)*0.6); trail.unshift(trail.pop()); trail[0].position.copy(ball.position);
    mon.position.set(ball.position.x, ball.position.y, ball.position.z); mon.rotation.y = t*2; };
};

/* ---------- stage controller ---------- */
function mount(host){
  host.classList.add('s3d');
  const labelLayer = document.createElement('div'); labelLayer.className = 'lbl-layer';
  const hint = document.createElement('div'); hint.className = 's3d-hint'; hint.textContent = 'Drag to turn';
  const stage = { el: host, labelLayer };
  let renderer = null, ctx = null, name = null, raf = 0, t0 = performance.now(), dragging = false, lx = 0, userYaw = 0, alive = true, visible = true;
  const ok = window.THREE && webglOK();
  if (ok){
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false }); }
    catch(e){ renderer = null; }
  }
  if (renderer){ renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1)); host.append(renderer.domElement); renderer.domElement.setAttribute('aria-hidden','true'); }
  host.append(labelLayer, hint);
  const fallback = document.createElement('div'); fallback.className = 's3d-fallback'; if (!renderer) host.append(fallback);
  function size(){ const w = host.clientWidth || 640, h = host.clientHeight || 360; if (renderer) renderer.setSize(w, h, false); if (ctx){ ctx.camera.aspect = w/h; ctx.camera.updateProjectionMatrix(); } }
  const ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(host); else addEventListener('resize', size);
  const io = window.IntersectionObserver ? new IntersectionObserver(es => { visible = es[0].isIntersecting; }) : null; if (io) io.observe(host);
  host.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('button,a,input,select')) return; dragging = true; lx = e.clientX; host.setPointerCapture && host.setPointerCapture(e.pointerId); hint.style.opacity = 0; });
  host.addEventListener('pointermove', e => { if (!dragging) return; userYaw += (e.clientX - lx) * 0.008; lx = e.clientX; });
  const up = () => { dragging = false; }; host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
  const v = new (window.THREE ? THREE.Vector3 : Object)();
  function frame(now){
    if (!alive) return; raf = requestAnimationFrame(frame);
    if (!ctx || !renderer || !visible) return;
    const t = (now - t0)/1000;
    ctx.anims.forEach(m => { const g = m.userData.tgt, mt = m.material; if (!g) return; const s = lerp(m.scale.x, g.s, 0.08); m.scale.setScalar(s); if (mt){ if (mt.emissiveIntensity!=null) mt.emissiveIntensity = lerp(mt.emissiveIntensity, g.e, 0.08); mt.opacity = lerp(mt.opacity, g.o, 0.08); m.visible = mt.opacity > 0.01; } });
    if (ctx.update) ctx.update(t);
    const sway = reduceMotion() ? 0 : Math.sin(t*0.25)*ctx.swayAmp;
    const yaw = ctx.yaw + sway + userYaw, p = ctx.pitch;
    ctx.camera.position.set(ctx.target.x + Math.sin(yaw)*Math.cos(p)*ctx.dist, ctx.target.y + Math.sin(p)*ctx.dist, ctx.target.z + Math.cos(yaw)*Math.cos(p)*ctx.dist);
    ctx.camera.lookAt(ctx.target);
    renderer.render(ctx.scene, ctx.camera);
    const w = host.clientWidth, h = host.clientHeight;
    ctx.labels.forEach(L => { if (!L.on){ L.el.style.opacity = 0; return; } v.copy(L.pos).project(ctx.camera); const x = (v.x*0.5+0.5)*w, y = (-v.y*0.5+0.5)*h; const behind = v.z > 1;
      L.el.style.opacity = behind ? 0 : ''; L.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${L.el.classList.contains('right')?'-100%':L.el.classList.contains('left')?'0%':'-50%'}, -50%)`; });
  }
  raf = requestAnimationFrame(frame);
  function build(n, opts){
    labelLayer.innerHTML = ''; if (ctx){ ctx.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); }); }
    ctx = mkCtx(stage); name = n; userYaw = 0;
    const builder = S[n] || S.spheres; builder(ctx, opts||{}); size();
  }
  let curKey = null;
  function fallbackShow(){ fallback.innerHTML = '<b>3D view not available on this device.</b><span>The narration and captions below carry the full lesson.</span>'; }
  return {
    show(n, step, opts){ if (!renderer){ fallbackShow(); return; } const key = n + '|' + JSON.stringify(opts||{}); if (key !== curKey){ build(n, opts); curKey = key; }
      if (ctx.setStep) ctx.setStep(step==null?0:step); },
    destroy(){ alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); if (renderer){ renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); } host.innerHTML = ''; },
    get webgl(){ return !!renderer; }
  };
}

window.Scenes = { mount, list: Object.keys(S) };
})();
