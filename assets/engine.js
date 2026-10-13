const $ = s => document.querySelector(s);
function h(tag, attrs, ...kids){ const e=document.createElement(tag); if(attrs) for(const [k,v] of Object.entries(attrs)){ if(k==='class') e.className=v; else if(k==='html') e.innerHTML=v; else if(k.startsWith('on')) e.addEventListener(k.slice(2),v); else if(v!==false&&v!=null) e.setAttribute(k,v===true?'':v);} for(const k of kids.flat()) if(k!=null&&k!==false) e.append(k.nodeType?k:document.createTextNode(k)); return e; }
const pad = n => String(n).padStart(2,'0');
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
const pct = x => Math.round(100*x);
function seg(options, value, onChange, label){ const w = h('div',{class:'seg',role:'group','aria-label':label||''}); const bs = options.map(([v,t]) => { const b = h('button',{type:'button','aria-pressed':String(v===value)}, t); b.onclick = () => { bs.forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); onChange(v); }; return b; }); w.append(...bs); return w; }

/* ---------------- learner state ---------------- */
/* Ethics of AI by Design course engine. Adapted from the Clinical AI Course engine (same lesson cycle),
   with 3D scenes in place of slide images, Try-it activities, and further watching and reading. */
const KEY = 'eai:' + CH.id;
const blank = () => ({ v:2, starter:null, plan:null, lessons:{}, test:null, secs:0, updated:0, name:'' });
let S;
try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch(e){ S = blank(); }
function save(){ S.updated = Date.now(); S.meta = {title:CH.title, num:CH.num, index:metrics().index, level:metrics().level, lessons:CH.lessons.length, done:Object.values(S.lessons).filter(l=>l.done).length, test:!!S.test};
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} renderChip(); renderMenu(); }
function L(i){ return S.lessons[i] || (S.lessons[i] = {watched:false, check:null, retry:null, caseScore:0, caseMax:0, caseDone:false, done:false, secs:0, act:null}); }

/* ---------------- metrics (Learning Index) ----------------
   Knowledge 35%: first-attempt quick checks + latest final-test answers correct
   Application 35%: points earned in case simulations (each choice 0–2)
   Self-awareness 15%: how often your confidence matched your answer (sure & right, or unsure & wrong)
   Completion 15%: lessons completed + final test taken
   Levels follow the familiar novice-to-expert stages (shortened for a short course). */
const LEVELS = [[0,'Novice','Starting out: knows the words, needs support to apply them'],[40,'Advanced beginner','Recognises the main ideas in familiar cases'],[60,'Competent','Applies the ideas to new cases and asks the right questions'],[80,'Proficient','Judges AI systems confidently and explains why to others']];
function metrics(){
  const n = CH.lessons.length; let kOk=0,kN=0,aPts=0,aMax=0,cal=0,calN=0,done=0;
  for (let i=0;i<n;i++){ const l = S.lessons[i]; if (!l) continue;
    if (l.check){ kN++; if (l.check.ok) kOk++; if (l.check.conf){ calN++; if ((l.check.conf==='sure')===l.check.ok) cal++; } }
    aPts += l.caseScore||0; aMax += l.caseDone ? (l.caseMax||0) : 0; if (l.done) done++; }
  if (S.test){ S.test.answers.forEach(a=>{ kN++; if (a.ok) kOk++; if (a.conf){ calN++; if ((a.conf==='sure')===a.ok) cal++; } }); }
  const K = kN? kOk/kN : 0, A = aMax? aPts/aMax : 0, C = calN? cal/calN : null, P = (done + (S.test?1:0))/(n+1);
  const parts = [[K,.35],[A,.35],[P,.15]]; if (C!=null) parts.push([C,.15]);
  const wsum = parts.reduce((x,p)=>x+p[1],0); const idx = Math.round(100*parts.reduce((x,p)=>x+p[0]*p[1],0)/wsum);
  const lv = LEVELS.filter(l=>idx>=l[0]).pop();
  return {K,A,C,P,index:idx,level:lv[1],levelText:lv[2],kN,aMax,calN,done,n};
}

/* ---------------- tutor + voice ---------------- */
const TUTOR_SVG = `<svg viewBox="0 0 200 200"><defs><clipPath id="cc"><circle cx="100" cy="100" r="100"/></clipPath></defs><g clip-path="url(#cc)"><rect width="200" height="200" fill="var(--accent-soft)"/><path d="M14 205 C22 154 58 138 100 136 C142 138 178 154 186 205 Z" fill="#24364A"/><path d="M84 137 L100 168 L116 137 Z" fill="#EEF4F4"/><rect x="88" y="110" width="24" height="32" rx="9" fill="#A9714E"/><g class="tHead"><ellipse cx="70" cy="92" rx="5" ry="8" fill="#B87C58"/><ellipse cx="130" cy="92" rx="5" ry="8" fill="#B87C58"/><ellipse cx="100" cy="88" rx="30" ry="36" fill="#C48A63"/><path d="M66 92 C60 52 84 38 104 40 C128 40 142 58 134 94 C130 76 122 64 102 63 C84 63 72 72 66 92 Z" fill="#2B211C"/><path d="M67 88 C62 108 68 124 76 128 L76 96 Z" fill="#2B211C"/><path d="M133 88 C138 108 132 124 124 128 L124 96 Z" fill="#2B211C"/><path d="M81 76 Q89 72 96 76" fill="none" stroke="#2B211C" stroke-width="2.4" stroke-linecap="round"/><path d="M104 76 Q111 72 119 76" fill="none" stroke="#2B211C" stroke-width="2.4" stroke-linecap="round"/><g class="eyes"><ellipse cx="89" cy="86" rx="3.2" ry="3.6" fill="#1D1714"/><ellipse cx="111" cy="86" rx="3.2" ry="3.6" fill="#1D1714"/></g><circle cx="89" cy="86" r="9" fill="none" stroke="#3B3532" stroke-width="1.5"/><circle cx="111" cy="86" r="9" fill="none" stroke="#3B3532" stroke-width="1.5"/><path d="M98 86 L102 86" stroke="#3B3532" stroke-width="1.5"/><path d="M100 90 Q96 100 101 102" fill="none" stroke="#9C6646" stroke-width="1.8" stroke-linecap="round"/><ellipse class="mouth" cx="100" cy="112" rx="8" ry="1.4" fill="#6E3029"/><path class="smile" d="M92 111 Q100 115 108 111" fill="none" stroke="#6E3029" stroke-width="1.8" stroke-linecap="round"/></g></g></svg>`;
const T = { el:null, open:0, target:0, speaking:false, hasBoundary:false, nextBlink:performance.now()+2500, blinkT:0 };
function tick(now){
  if (T.el && T.el.isConnected){
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (T.speaking && !T.hasBoundary && !reduce) T.target = 0.35 + 0.55*Math.abs(Math.sin(now/95))*(0.6+0.4*Math.sin(now/410));
    if (!T.speaking) T.target = 0;
    T.open += (T.target-T.open)*0.35; if (T.hasBoundary) T.target *= 0.86;
    const o = reduce ? (T.speaking?0.3:0) : T.open;
    const m = T.el.querySelector('.mouth'), sm = T.el.querySelector('.smile'), ey = T.el.querySelector('.eyes'), hd = T.el.querySelector('.tHead');
    m.setAttribute('ry',(1.4+o*5.2).toFixed(2)); m.setAttribute('rx',(8-o*1.5).toFixed(2)); sm.style.opacity = o>0.15?0:1;
    if (now > T.nextBlink){ T.blinkT = now; T.nextBlink = now + 2600 + Math.random()*3200; }
    const b = now - T.blinkT, sy = b<140 ? Math.abs(1-2*b/140) : 1;
    ey.setAttribute('transform',`translate(0 ${86*(1-sy)}) scale(1 ${Math.max(0.1,sy)})`);
    const bob = T.speaking&&!reduce ? Math.sin(now/600)*1.2 : 0, tilt = T.speaking&&!reduce ? Math.sin(now/1300)*1.6 : 0;
    hd.setAttribute('transform',`translate(0 ${bob.toFixed(2)}) rotate(${tilt.toFixed(2)} 100 120)`);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
function setSpeaking(v){ T.speaking = v; if (T.el) T.el.classList.toggle('speaking', v); }
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
let voices = [], voice = null;
function pickVoice(){
  if (!synth) return; voices = synth.getVoices().filter(v=>/^en/i.test(v.lang));
  const pref = S.plan && S.plan.voice; const sorted = voices.slice().sort((a,b)=>(b.lang==='en-GB')-(a.lang==='en-GB'));
  voice = pref==='__none' ? null : (sorted.find(v=>v.name===pref) || sorted.find(v=>v.lang==='en-GB') || sorted[0] || null);
}
if (synth){ pickVoice(); synth.addEventListener ? synth.addEventListener('voiceschanged', ()=>{ pickVoice(); if (curView && curView.startsWith('l')) refreshVoiceSel && refreshVoiceSel(); }) : (synth.onvoiceschanged = pickVoice); }
const WPS = 2.55;
const words = t => t.split(/\s+/).filter(Boolean).length;
const rate = () => (S.plan && S.plan.rate) || 0.95;
function sentences(arr){ return arr.flatMap(p => (p.match(/[^.!?]+[.!?]+["'”’]?\s*|[^.!?]+$/g) || [p]).map(x=>x.trim()).filter(Boolean)); }
function sentencesP(arr){ return arr.flatMap((p,pi) => (p.match(/[^.!?]+[.!?]+["'”’]?\s*|[^.!?]+$/g) || [p]).map(x=>x.trim()).filter(Boolean).map(t=>({t, p:pi}))); }
const stepAt = (sl, pi) => Array.isArray(sl.steps) ? sl.steps[Math.min(pi, sl.steps.length-1)] : (sl.step||0);

/* ---------------- navigation ---------------- */
let curView = 'start';
function views(){ return ['start', ...CH.lessons.map((_,i)=>'l'+i), 'final', 'progress']; }
function renderMenu(){
  const m = $('#menu'); m.innerHTML = '';
  const add = (v, label, state) => { const b = h('button',{type:'button','aria-current':String(curView===v),onclick:()=>go(v)}, state!==undefined ? h('span',{class:'dot'+(state==='done'?' done':state==='part'?' part':'')}) : null, label); m.append(b); };
  add('start','Start', S.plan ? 'done' : '');
  CH.lessons.forEach((l,i)=>{ const st = S.lessons[i]; add('l'+i, `${i+1}. ${l.title}`, st ? (st.done?'done':(st.watched||st.check)?'part':'') : ''); });
  add('final','Final case test', S.test ? 'done' : '');
  add('progress','My progress');
  const cur = m.querySelector('[aria-current="true"]'); if (cur) cur.scrollIntoView({block:'nearest',inline:'center'});
}
function renderChip(){ const M = metrics(); $('#idxVal').textContent = M.index; $('#idxLvl').textContent = M.level; }
$('#idxChip').onclick = () => go('progress');
let lessonTimer = null, lessonStart = 0;
function go(v){
  stopSpeech(); flushTime(); curView = v; const main = $('#main'); main.innerHTML = '';
  if (v==='start') renderStart(main); else if (v==='final') renderFinal(main); else if (v==='progress') renderProgress(main); else renderLesson(main, +v.slice(1));
  renderMenu(); renderChip(); window.scrollTo({top:0, behavior:'instant'});
  try { history.replaceState(null,'','#'+v); } catch(e){}
  if (v.startsWith('l')) lessonStart = Date.now();
}
function flushTime(){ if (curView && curView.startsWith('l') && lessonStart){ const s = Math.round((Date.now()-lessonStart)/1000); if (s>0 && s<3600){ L(+curView.slice(1)).secs += s; S.secs += s; save(); } lessonStart = 0; } }
addEventListener('visibilitychange', ()=>{ if (document.hidden) flushTime(); else if (curView.startsWith('l')) lessonStart = Date.now(); });

/* ---------------- START: personal plan ---------------- */
function renderStart(main){
  const plan = S.plan || {time:10, style:'listen', rate:0.95, voice:null};
  main.append(h('div',null, h('div',{class:'eyebrow'}, CH.num==='A' ? 'Appendix A' : 'Chapter '+CH.num), h('h2',{style:'font-size:2rem;margin-top:4px'}, CH.title), h('p',{class:'lede',style:'margin-top:8px'}, CH.summary)));
  main.append(h('div',{class:'card'}, h('h3',null,'What you will be able to do'), h('ul',{style:'margin:0;padding-left:20px'}, CH.outcomes.map(o=>h('li',null,o)))));
  if (CH.source) main.append(h('p',{class:'foot'}, CH.source));
  const ans = (S.starter && S.starter.answers) ? S.starter.answers.slice() : CH.starter.map(()=>null);
  const sq = h('div',{style:'display:flex;flex-direction:column;gap:14px'});
  CH.starter.forEach((q,i)=>{ const box = h('div',null, h('p',{class:'q'}, `${i+1}. ${q.q}`)); const opts = h('div',{class:'opts'});
    q.o.forEach((o,j)=>{ const b = h('button',{class:'opt',type:'button','aria-pressed':String(ans[i]===j)}, o); if (ans[i]===j) b.style.borderColor='var(--accent)';
      b.onclick = () => { ans[i]=j; opts.querySelectorAll('.opt').forEach(x=>{x.style.borderColor='';}); b.style.borderColor='var(--accent)'; }; opts.append(b); });
    box.append(opts); sq.append(box); });
  main.append(h('div',{class:'card'}, h('h3',null,'1. Where are you starting from?'), h('p',{class:'lede',style:'margin-bottom:12px'},'Three quick questions. There is no pass mark: your answers just set the right pace for you.'), sq));
  const tSel = seg([[5,'5 minutes'],[10,'10 minutes'],[20,'20 minutes or more']], plan.time, v=>plan.time=v, 'Time per session');
  const stSel = seg([['listen','Listen and watch'],['read','Read at my own pace']], plan.style, v=>plan.style=v, 'Learning style');
  const rSel = seg([[0.8,'Slower'],[0.95,'Normal'],[1.15,'Faster']], plan.rate, v=>plan.rate=v, 'Speaking speed');
  main.append(h('div',{class:'card'}, h('h3',null,'2. How do you like to learn?'),
    h('div',{class:'plan',style:'gap:12px'}, h('div',null,h('b',null,'Time per sitting'),tSel), h('div',null,h('b',null,'Style'),stSel), h('div',null,h('b',null,'Speaking speed'),rSel))));
  const out = h('div');
  const btn = h('button',{class:'btn primary',type:'button'},'Make my plan');
  btn.onclick = () => {
    const score = CH.starter.reduce((a,q,i)=>a+(ans[i]===q.a?1:0),0);
    S.starter = {answers:ans, score}; S.plan = Object.assign(plan, {path: score>=2 ? 'fast' : 'steady'}); save(); showPlan(out);
  };
  main.append(h('div',{class:'card'}, h('h3',null,'3. Your plan'), h('div',{class:'row',style:'margin-bottom:10px'}, btn), out));
  if (S.plan) showPlan(out);
  if (CH.watch && CH.watch.length) main.append(h('div',{class:'card'}, h('h3',null,'Watch, read and try more'), h('p',{class:'lede',style:'margin-bottom:10px'},'Optional. Outside resources open in a new tab; the labs are part of this course.'),
    h('div',{class:'watchlist'}, CH.watch.map(w=>h('a',{href:w.u, target: /^https?:/.test(w.u)?'_blank':null, rel:'noopener'}, h('span',{class:'k'+(w.k==='Read'?' read':'')}, w.k), h('span',null, h('b',null,w.t), h('span',{class:'d'}, w.d)))))));
}
function showPlan(out){
  const p = S.plan, n = CH.lessons.length; out.innerHTML = '';
  const per = Math.max(1, Math.floor(p.time / ((p.style==='read'?1.5:2.2) + 2)));
  const sessions = []; for (let i=0;i<n;i+=per) sessions.push([i, Math.min(n,i+per)-1]);
  const pathTxt = p.path==='fast' ? 'Fast track. You already know some of this, so each lesson lets you skip straight to the check and case. The plain-words summaries stay folded unless you need them.' : 'Step by step. Each lesson shows a plain-words summary after Sam explains it, and gives you a second try if a question trips you up.';
  out.append(h('div',{class:'plan'},
    h('div',null,h('b',null,'Your path'), h('span',null, h('span',{class:'pill acc'}, p.path==='fast'?'Fast track':'Step by step'),' ', pathTxt)),
    h('div',null,h('b',null,'Starter score'), h('span',null, `${S.starter.score} of ${CH.starter.length}`)),
    h('div',null,h('b',null,'Sessions'), h('span',null, `${sessions.length} sittings of about ${p.time} minutes, then the final case test.`))),
    h('div',{class:'advice',style:'margin-top:10px'}, sessions.map((s,k)=>h('div',null, h('b',{style:'min-width:80px'},'Sitting '+(k+1)), h('span',null, s[0]===s[1] ? `Lesson ${s[0]+1}: ${CH.lessons[s[0]].title}` : `Lessons ${s[0]+1}–${s[1]+1}: ${CH.lessons[s[0]].title} to ${CH.lessons[s[1]].title}`)))),
    h('div',{class:'row',style:'margin-top:12px'}, h('button',{class:'btn primary',type:'button',onclick:()=>go('l'+firstUnfinished())}, firstUnfinished()===0 && !S.lessons[0] ? 'Start lesson 1' : 'Continue: lesson '+(firstUnfinished()+1)), h('span',{class:'lede',style:'font-size:.88rem'},'You can change any of this later. Your progress is saved in this browser only.')));
}
function firstUnfinished(){ for (let i=0;i<CH.lessons.length;i++) if (!(S.lessons[i]&&S.lessons[i].done)) return i; return CH.lessons.length-1; }

/* ---------------- LESSON ---------------- */
let player = null, refreshVoiceSel = null;
function stopSpeech(){ if (player){ player.stop(); if (player.destroy) player.destroy(); player = null; } }
function renderLesson(main, i){
  const les = CH.lessons[i], st = L(i), plan = S.plan || {path:'steady', style:'listen'};
  if (!S.plan) main.append(h('div',{class:'card',style:'background:var(--info-soft)'}, h('p',null,'Tip: set your pace and style on the ', h('a',{href:'#start',onclick:e=>{e.preventDefault();go('start');}},'Start'),' page first. It takes a minute.')));
  const stepsEl = h('div',{class:'steps'});
  function renderSteps(){ stepsEl.innerHTML=''; [['Watch',st.watched],['Check',!!st.check],['Case',st.caseDone]].forEach(([t,ok],k)=>stepsEl.append(h('span',{class: ok?'ok':''}, (ok?'✓ ':(k+1)+'. ')+t))); }
  renderSteps();
  main.append(h('div',null, h('div',{class:'eyebrow'}, `Lesson ${i+1} of ${CH.lessons.length} · about ${les.minutes||2} minutes`), h('h2',{style:'font-size:1.8rem;margin:4px 0 8px'}, les.title), stepsEl));

  // --- WATCH
  const slides = les.slides; const sentsP = slides.map(s=>sentencesP(s.say)); const sents = sentsP.map(a=>a.map(x=>x.t));
  let si = 0, ui = 0, playing = false, token = 0, timers = [], mode = plan.style === 'read' ? 'read' : 'listen';
  const tag = h('span',{class:'slidetag'}); const big = h('button',{class:'bigplay',type:'button'}, h('span',{class:'c'}, h('span',{html:'<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="#fff"/></svg>'})), h('span',null,'Play lesson'));
  const stage = h('div',{class:'stage',role:'img'}, tag, big);
  const tutorEl = h('div',{class:'tutor','aria-hidden':'true',html:TUTOR_SVG}); T.el = tutorEl;
  const cap = h('div',{class:'cap','aria-live':'polite'});
  const readBox = h('div',{class:'read'});
  const speakRow = h('div',{class:'speaker'}, h('div',{class:'tutor-wrap'}, tutorEl, h('span',null,'Sam, your tutor')), cap);
  const playBtn = h('button',{class:'btn primary',type:'button'},'Play');
  const prevBtn = h('button',{class:'btn',type:'button'},'◀ Back'), nextBtn = h('button',{class:'btn',type:'button'},'Next ▶');
  const voiceSel = h('select',{id:'voiceSel','aria-label':'Voice'});
  refreshVoiceSel = () => { voiceSel.innerHTML=''; voiceSel.append(h('option',{value:'__none'},'No voice: captions only')); voices.slice().sort((a,b)=>(b.lang==='en-GB')-(a.lang==='en-GB')).forEach(v=>voiceSel.append(h('option',{value:v.name},`${v.name} (${v.lang})`))); voiceSel.value = voice ? voice.name : '__none'; };
  refreshVoiceSel();
  voiceSel.onchange = () => { S.plan = S.plan || {path:'steady',style:'listen',time:10,rate:0.95}; S.plan.voice = voiceSel.value; save(); pickVoice(); if (playing){ stop(); play(); } };
  const rateSel = seg([[0.8,'Slower'],[0.95,'Normal'],[1.15,'Faster']], rate(), v=>{ S.plan = S.plan || {path:'steady',style:'listen',time:10}; S.plan.rate = v; save(); if (playing){ stop(); play(); } }, 'Speed');
  const modeSel = seg([['listen','Listen'],['read','Read']], mode, v=>{ stop(); mode = v; layout(); }, 'Mode');
  const plainBtn = h('button',{class:'btn small',type:'button'},'Explain more simply');
  const ctrls = h('div',{class:'ctrls'}, prevBtn, playBtn, nextBtn, h('span',{class:'grow'}), modeSel, rateSel, h('label',null,'Voice', voiceSel));
  const plainCard = h('div',{class:'plain',hidden:true}, h('b',null,'In plain words'), h('ul',null, les.plain.map(p=>h('li',null,p))));
  const keyCard = h('div',{class:'key',hidden:!st.watched}, h('b',{class:'k'},'Key point'), h('p',null, les.keyPoint));
  const skipBtn = h('button',{class:'btn small',type:'button',onclick:()=>{ stop(); markWatched(); checkCard.scrollIntoView({behavior:'smooth'}); }}, 'I know this: skip to the check');
  plainBtn.onclick = () => { plainCard.hidden = !plainCard.hidden; plainBtn.textContent = plainCard.hidden ? 'Explain more simply' : 'Hide plain words'; };
  const watchCard = h('div',{class:'card'}, stage, speakRow, readBox, ctrls, h('div',{class:'row',style:'margin-top:10px'}, plainBtn, plan.path==='fast' ? skipBtn : null), h('div',{style:'margin-top:10px'}, plainCard));
  main.append(watchCard, keyCard);
  const scene = window.Scenes ? Scenes.mount(stage) : null;
  const actCard = les.activity ? renderActivity(les.activity, st) : null; if (actCard){ actCard.hidden = !st.watched; main.append(actCard); }
  function layout(){ speakRow.hidden = mode!=='listen'; readBox.hidden = mode!=='read'; playBtn.hidden = mode!=='listen'; big.hidden = mode!=='listen' || playing; rateSel.hidden = mode!=='listen'; voiceSel.parentNode.hidden = mode!=='listen'; showSlide(); }
  function showSlide(){
    const sl = slides[si]; stage.setAttribute('aria-label', `Animated 3D scene for ${les.title}, part ${si+1} of ${slides.length}`); tag.textContent = `${si+1} / ${slides.length}`;
    if (scene) scene.show(sl.scene, mode==='read' ? stepAt(sl, sl.say.length-1) : stepAt(sl, 0), sl.opts);
    prevBtn.disabled = si===0; nextBtn.textContent = si===slides.length-1 ? (mode==='read' ? 'Finish reading ✓' : 'Next ▶') : 'Next ▶';
    nextBtn.disabled = mode==='listen' && si===slides.length-1;
    if (mode==='read'){ readBox.innerHTML=''; slides[si].say.forEach((p,pi)=>{ const el = h('p',{style:Array.isArray(sl.steps)?'cursor:pointer':null, title:Array.isArray(sl.steps)?'Show this part in the 3D scene':null}, p); if (Array.isArray(sl.steps)) el.onclick = () => { if (scene) scene.show(sl.scene, stepAt(sl, pi), sl.opts); }; readBox.append(el); }); }
    else caption(-1);
  }
  function caption(ci){ cap.innerHTML=''; const t = sents[si][ui]||''; let pos=0; t.split(/(\s+)/).forEach(part=>{ if(!part.trim()){cap.append(part);pos+=part.length;return;} const s0=pos,e0=pos+part.length; pos=e0; cap.append(h('span',{class: ci<0?'w':(ci>=e0?'w past':ci>=s0?'w now':'w')},part)); }); }
  function clear(){ timers.forEach(clearTimeout); timers=[]; }
  function stop(){ playing=false; token++; clear(); if (synth) synth.cancel(); setSpeaking(false); playBtn.textContent='Play'; }
  function play(){ if (playing) return; playing = true; big.hidden = true; playBtn.textContent='Pause'; speak(); }
  function speak(){
    const tok = ++token; clear(); const text = sents[si][ui]; caption(-1);
    if (scene && sentsP[si][ui]) scene.show(slides[si].scene, stepAt(slides[si], sentsP[si][ui].p), slides[si].opts);
    const est = words(text)/(WPS*rate())*1000; const done = () => { if (tok!==token) return; setSpeaking(false); advance(); };
    if (synth && voice){
      const u = new SpeechSynthesisUtterance(text); u.voice = voice; u.lang = voice.lang; u.rate = rate(); T.hasBoundary = false;
      u.onstart = () => { if (tok===token) setSpeaking(true); };
      u.onboundary = e => { if (tok!==token || e.name==='sentence') return; T.hasBoundary = true; T.target = 0.55+Math.random()*0.45; caption(e.charIndex); };
      u.onend = done; u.onerror = e => { if (tok!==token || e.error==='interrupted' || e.error==='canceled') return; silent(tok,text,est); };
      synth.speak(u);
      timers.push(setTimeout(()=>{ if (tok===token && !T.speaking && !synth.speaking) silent(tok,text,est); }, 2500));
      timers.push(setTimeout(done, est*2.2+4000));
    } else silent(tok,text,est);
  }
  function silent(tok,text,est){ if (tok!==token) return; clear(); T.hasBoundary=false; setSpeaking(true);
    const starts=[]; let pos=0; text.split(/(\s+)/).forEach(p=>{ if(p.trim()) starts.push(pos); pos+=p.length; });
    starts.forEach((c,k)=>timers.push(setTimeout(()=>{ if(tok===token) caption(c); }, est*k/starts.length)));
    timers.push(setTimeout(()=>{ if(tok!==token) return; setSpeaking(false); advance(); }, est+250)); }
  function advance(){ if (!playing) return; ui++;
    if (ui >= sents[si].length){ if (si >= slides.length-1){ stop(); markWatched(); return; } si++; ui=0; showSlide(); const tok=token; timers.push(setTimeout(()=>{ if(playing&&tok===token) speak(); }, 900)); return; }
    speak(); }
  function markWatched(){ if (!st.watched){ st.watched = true; save(); renderSteps(); } keyCard.hidden = false; if (actCard) actCard.hidden = false; if (plan.path!=='fast') { plainCard.hidden = false; plainBtn.textContent='Hide plain words'; } cap.innerHTML = '<b>End of the lesson.</b> Now try the quick check below.'; }
  playBtn.onclick = () => playing ? stop() : play(); big.onclick = play;
  prevBtn.onclick = () => { const was = playing; stop(); si = Math.max(0, si-1); ui=0; showSlide(); if (was) play(); };
  nextBtn.onclick = () => { if (mode==='read' && si===slides.length-1){ markWatched(); checkCard.scrollIntoView({behavior:'smooth'}); return; } const was = playing; stop(); si = Math.min(slides.length-1, si+1); ui=0; showSlide(); if (was) play(); };
  player = {stop, destroy: () => { if (scene) scene.destroy(); }};

  // --- CHECK (with confidence and adaptive second chance)
  const checkCard = h('div',{class:'card'}); main.append(checkCard);
  function renderCheck(){
    checkCard.innerHTML=''; checkCard.append(h('div',{class:'eyebrow'},'Quick check'));
    const c = les.check;
    if (st.check){ // already answered: show summary + allow retry practice
      checkCard.append(h('p',{class:'q'}, c.q), h('p',{class:'fb'}, st.check.ok ? h('span',{class:'pill good'},'Right first time') : h('span',{class:'pill warn'},'Missed first time'), ' ', c.e),
        st.retry ? h('p',{class:'fb'}, 'Second chance: ', st.retry.ok ? h('span',{class:'pill good'},'right') : h('span',{class:'pill bad'},'missed')) : null,
        h('div',{class:'row',style:'margin-top:8px'}, h('button',{class:'btn small',type:'button',onclick:()=>{ askQuestion(checkCard, c, true, ()=>{}); }},'Practise again (not scored)')));
      return;
    }
    askQuestion(checkCard, c, false, (ok, conf) => {
      st.check = {ok, conf}; save(); renderSteps();
      if (!ok && c.retry){
        plainCard.hidden = false; plainBtn.textContent='Hide plain words';
        const r = h('div',{style:'margin-top:14px'}, h('div',{class:'plain'}, h('b',null,'Let\'s look at it another way'), h('ul',null, les.plain.map(p=>h('li',null,p)))));
        const rq = h('div',{style:'margin-top:12px'}); r.append(h('div',{class:'eyebrow',style:'margin-top:12px'},'Second chance'), rq); checkCard.append(r);
        askQuestion(rq, c.retry, false, (ok2) => { st.retry = {ok:ok2}; save(); if (!ok2) rq.append(h('p',{class:'fb'}, h('span',{class:'pill warn'},'Tip'),' Try the lesson again in Read mode, at your own pace. It is marked for review on your progress page.')); caseCard.hidden=false; }, true);
      } else caseCard.hidden = false;
    });
  }
  // --- CASE simulation
  const caseCard = h('div',{class:'card',hidden: !st.check}); main.append(caseCard);
  function renderCase(){
    const sc = les.scenario; caseCard.innerHTML='';
    caseCard.append(h('div',{class:'eyebrow'},'Case simulation'), h('h3',null, sc.title), h('p',{class:'case-set'}, sc.setting));
    const maxPts = sc.steps.length*2; let pts = 0, k = 0;
    const host = h('div'); caseCard.append(host);
    if (st.caseDone){ host.append(h('p',{class:'fb'}, h('span',{class: st.caseScore>=maxPts*0.75?'pill good':st.caseScore>=maxPts/2?'pill warn':'pill bad'}, `You scored ${st.caseScore} of ${maxPts}`), ' ', h('button',{class:'btn small',type:'button',onclick:()=>{ st.caseDone=false; st.caseScore=0; save(); renderCase(); }},'Try the case again'))); finishRow(); return; }
    function step(){
      const s = sc.steps[k]; const box = h('div',{class:'stepbox'}, h('p',{class:'q'}, `${k+1}. ${s.prompt}`)); const opts = h('div',{class:'opts'}); const fb = h('div',{class:'fb'});
      s.choices.forEach(ch => { const b = h('button',{class:'opt',type:'button'}, ch.t); b.onclick = () => {
        opts.querySelectorAll('.opt').forEach(x=>x.disabled=true); b.classList.add(ch.s===2?'right':ch.s===1?'part':'wrong');
        if (ch.s<2){ const best = s.choices.find(c=>c.s===2); if (best) [...opts.children].find(x=>x.textContent===best.t).classList.add('right'); }
        pts += ch.s; fb.innerHTML = `<b>${ch.s===2?'Good call.':ch.s===1?'Partly.':'Not the best choice.'}</b> ${ch.fb}`;
        k++; if (k < sc.steps.length) step(); else { st.caseDone = true; st.caseScore = pts; st.caseMax = maxPts; st.done = st.done || !!st.check; save(); renderSteps();
          host.append(h('p',{class:'fb',style:'margin-top:12px'}, h('span',{class: pts>=maxPts*0.75?'pill good':pts>=maxPts/2?'pill warn':'pill bad'}, `Case score: ${pts} of ${maxPts}`))); finishRow(); } };
        opts.append(b); });
      box.append(opts, fb); host.append(box);
    }
    step();
  }
  function finishRow(){
    st.done = !!(st.check && st.caseDone); save();
    const next = i < CH.lessons.length-1 ? h('button',{class:'btn primary',type:'button',onclick:()=>go('l'+(i+1))}, `Next: lesson ${i+2}`) : h('button',{class:'btn primary',type:'button',onclick:()=>go('final')}, 'Go to the final case test');
    if (les.lab) caseCard.append(h('div',{class:'plain',style:'margin-top:14px'}, h('b',null,'Go further'), h('p',null, les.lab.d, ' ', h('a',{href:les.lab.u}, les.lab.t+' →'))));
    caseCard.append(h('div',{class:'row',style:'margin-top:14px'}, next, h('button',{class:'btn',type:'button',onclick:()=>go('progress')},'See my progress')));
  }
  renderCheck(); renderCase(); layout();
}

/* ---------------- TRY IT: sorting activity ----------------
   Tap an item, then tap the box it belongs in. "Check" marks each one. Not scored in the learning index. */
function renderActivity(a, st){
  const card = h('div',{class:'card'}); const place = {}; let sel = null, checked = false;
  card.append(h('div',{class:'eyebrow'},'Try it'), h('h3',null, a.title || 'Sort these'), h('p',{class:'lede',style:'margin-bottom:6px'}, a.prompt), h('p',{class:'foot'},'Tap an item, then tap the box it belongs in. Tap a placed item to move it back.'));
  const pool = h('div',{class:'sort-pool','aria-label':'Items to sort'}); const bx = h('div',{class:'buckets'}); const fb = h('div',{class:'fb'});
  const chips = a.items.map((it,i)=>{ const c = h('button',{class:'chip',type:'button','aria-pressed':'false'}, it.t); c.onclick = (e)=>{ e.stopPropagation(); if (checked) return; if (place[i]!=null){ delete place[i]; draw(); return; } sel = sel===i ? null : i; draw(); }; return c; });
  const bEls = a.buckets.map((b,k)=>{ const inn = h('div',{class:'in'}); const el = h('button',{class:'bucket',type:'button'}, h('b',null,b.t), b.d ? h('small',null,b.d) : null, inn); el.onclick = ()=>{ if (checked || sel==null) return; place[sel] = k; sel = null; draw(); }; el._in = inn; return el; });
  function draw(){ pool.innerHTML=''; bEls.forEach(b=>b._in.innerHTML=''); chips.forEach((c,i)=>{ c.setAttribute('aria-pressed', String(sel===i)); (place[i]!=null ? bEls[place[i]]._in : pool).append(c); }); checkBtn.disabled = Object.keys(place).length < a.items.length; }
  const checkBtn = h('button',{class:'btn primary',type:'button'},'Check my sorting');
  const againBtn = h('button',{class:'btn',type:'button',hidden:true},'Try again');
  checkBtn.onclick = ()=>{ checked = true; let ok = 0; chips.forEach((c,i)=>{ const r = place[i]===a.items[i].b; if (r) ok++; c.classList.add(r?'right':'wrong'); if (!r) c.title = 'Belongs in: ' + a.buckets[a.items[i].b].t; });
    fb.innerHTML = `<b>${ok} of ${a.items.length} in the right place.</b> ${a.explain || ''}` + (ok<a.items.length ? ' Items in red show where they belong when you hover or long-press them.' : '');
    if (st){ st.act = {ok, n:a.items.length}; save(); } checkBtn.hidden = true; againBtn.hidden = false; };
  againBtn.onclick = ()=>{ checked = false; Object.keys(place).forEach(k=>delete place[k]); chips.forEach(c=>{ c.classList.remove('right','wrong'); c.title=''; }); fb.innerHTML=''; checkBtn.hidden = false; againBtn.hidden = true; draw(); };
  bx.append(...bEls); card.append(pool, bx, h('div',{class:'row',style:'margin-top:10px'}, checkBtn, againBtn), fb); draw();
  return card;
}

/* generic question with confidence rating */
function askQuestion(host, q, practice, onDone, isRetry){
  const box = h('div'); host.append(box);
  if (!isRetry || true) box.append(h('p',{class:'q'}, q.q));
  let conf = null;
  const confSeg = seg([['sure','I\'m sure'],['unsure','I\'m not sure']], null, v=>conf=v, 'Confidence');
  if (!practice) box.append(h('div',{class:'conf'}, h('span',null,'Before you answer, how sure are you?'), confSeg, h('span',{style:'font-size:.8rem'},'(optional, helps your self-awareness score)')));
  const opts = h('div',{class:'opts'}); const fb = h('div',{class:'fb'});
  q.o.forEach((o,j)=>{ const b = h('button',{class:'opt',type:'button'}, o); b.onclick = () => {
    const ok = j===q.a; opts.querySelectorAll('.opt').forEach(x=>x.disabled=true); b.classList.add(ok?'right':'wrong'); if (!ok) opts.children[q.a].classList.add('right');
    fb.innerHTML = `<b>${ok?'Right.':'Not quite.'}</b> ${q.e}`; onDone(ok, conf); };
    opts.append(b); });
  box.append(opts, fb);
}

/* ---------------- FINAL case test ---------------- */
function renderFinal(main){
  const M = metrics();
  main.append(h('div',null, h('div',{class:'eyebrow'},'Final case test'), h('h2',{style:'font-size:1.8rem;margin-top:4px'},'Check your learning path'), h('p',{class:'lede',style:'margin-top:6px'}, `${CH.test.length} short questions across all ${CH.lessons.length} lessons. You see the answer after each one. Your latest attempt counts towards your learning index, and the results show which lessons to revisit.`)));
  if (M.done < CH.lessons.length) main.append(h('div',{class:'card',style:'background:var(--signal-soft)'}, h('p',null, `You have finished ${M.done} of ${CH.lessons.length} lessons. You can take the test now, but you will probably score higher after finishing them.`)));
  const host = h('div',{class:'card'}); main.append(host);
  if (S.test) { host.append(h('p',null, h('span',{class:'pill acc'}, `Last attempt: ${S.test.score} of ${CH.test.length}`), ` · ${S.test.attempts} attempt${S.test.attempts>1?'s':''}`), h('div',{class:'row',style:'margin-top:10px'}, h('button',{class:'btn primary',type:'button',onclick:()=>{ host.innerHTML=''; runTest(host); }},'Take the test again'), h('button',{class:'btn',type:'button',onclick:()=>go('progress')},'See my results'))); return; }
  host.append(h('button',{class:'btn primary',type:'button',onclick:()=>{ host.innerHTML=''; runTest(host); }},'Start the test'));
}
function runTest(host){
  const answers = []; let k = 0;
  const prog = h('p',{class:'eyebrow'}); host.append(prog); const qhost = h('div'); host.append(qhost);
  function next(){
    qhost.innerHTML=''; prog.textContent = `Question ${k+1} of ${CH.test.length} · from lesson ${CH.test[k].lesson+1}: ${CH.lessons[CH.test[k].lesson].title}`;
    askQuestion(qhost, CH.test[k], false, (ok, conf) => { answers.push({ok, conf, lesson: CH.test[k].lesson});
      qhost.append(h('div',{class:'row',style:'margin-top:12px'}, h('button',{class:'btn primary',type:'button',onclick:()=>{ k++; if (k<CH.test.length) next(); else finish(); }}, k<CH.test.length-1?'Next question':'See my results'))); });
  }
  function finish(){ const score = answers.filter(a=>a.ok).length; S.test = {answers, score, attempts:(S.test?S.test.attempts:0)+1, at:Date.now()}; save(); go('progress'); }
  next();
}

/* ---------------- PROGRESS: learning index, advice, certificate ---------------- */
function gaugeSVG(v){
  const r=60, c=2*Math.PI*r, f=c*v/100;
  return `<svg viewBox="0 0 150 150" role="img" aria-label="Learning index ${v} out of 100"><circle cx="75" cy="75" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="14"/><circle cx="75" cy="75" r="${r}" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${f} ${c}" transform="rotate(-90 75 75)"/><text x="75" y="80" text-anchor="middle" font-size="34" font-weight="700" fill="var(--ink)" font-family="JetBrains Mono, monospace">${v}</text><text x="75" y="102" text-anchor="middle" font-size="11" fill="var(--muted)">out of 100</text></svg>`;
}
function advice(){
  const out = []; const n = CH.lessons.length;
  const testBy = {}; if (S.test) S.test.answers.forEach(a=>{ (testBy[a.lesson] = testBy[a.lesson]||{ok:0,n:0}); testBy[a.lesson].n++; if (a.ok) testBy[a.lesson].ok++; });
  const weak = [];
  for (let i=0;i<n;i++){ const l = S.lessons[i]; const reasons = [];
    if (l && l.check && !l.check.ok) reasons.push('missed the quick check');
    if (l && l.caseDone && l.caseScore < l.caseMax*0.5) reasons.push(`scored ${l.caseScore} of ${l.caseMax} on the case`);
    if (testBy[i] && testBy[i].ok < testBy[i].n) reasons.push(`${testBy[i].n-testBy[i].ok} final-test question${testBy[i].n-testBy[i].ok>1?'s':''} wrong`);
    if (reasons.length) weak.push([i, reasons]); }
  weak.sort((a,b)=>b[1].length-a[1].length).slice(0,3).forEach(([i,r])=>out.push(['Revisit', `Lesson ${i+1}, ${CH.lessons[i].title}: you ${r.join(', ')}. Try it in Read mode and open "Explain more simply".`, 'l'+i]));
  const nf = [...Array(n).keys()].find(i=>!(S.lessons[i]&&S.lessons[i].done));
  if (nf!==undefined) out.push(['Next', `Carry on with lesson ${nf+1}, ${CH.lessons[nf].title}.`, 'l'+nf]);
  else if (!S.test) out.push(['Next', 'All lessons done. Take the final case test to check your learning path.', 'final']);
  const M = metrics();
  if (M.calN >= 4 && M.C < 0.6) out.push(['Self-awareness', 'Your confidence often did not match your answers. In ethical decisions about AI, knowing when you are unsure matters as much as knowing the answer. Keep rating your confidence.', null]);
  if (S.plan && S.secs > 0){ const done = Object.values(S.lessons).filter(l=>l.done); const avg = done.length ? done.reduce((a,l)=>a+l.secs,0)/done.length/60 : 0;
    if (avg >= 0.5) out.push(['Your pace', `You spend about ${avg.toFixed(1)} minutes per lesson. ${avg > 6 ? 'Taking your time is fine. Shorter sittings may suit you better: try 5-minute sittings on the Start page.' : avg < 2.5 ? 'You move quickly. If the cases feel easy, the Fast track path lets you skip straight to them.' : 'That fits your plan well.'}`, null]); }
  if (!out.length) out.push(['Well done', 'No gaps found. You could teach this chapter to someone else.', null]);
  return out;
}
function renderProgress(main){
  const M = metrics();
  main.append(h('div',null, h('div',{class:'eyebrow'},'My progress'), h('h2',{style:'font-size:1.8rem;margin-top:4px'},'Your learning index'), h('p',{class:'lede',style:'margin-top:6px'}, S.test ? 'Based on your lessons, cases and final test.' : 'Provisional until you take the final case test.')));
  const dims = [['Knowledge', M.K, 'Quick checks right first time, plus final-test answers'], ['Applying it', M.A, 'Points from the case simulations'], ['Self-awareness', M.C, 'How often your confidence matched your answer'], ['Completion', M.P, 'Lessons finished and final test taken']];
  const dimsEl = h('div',{class:'dims'}, dims.map(([n,v,d])=>h('div',null, h('div',{class:'dim'}, h('span',null,n), h('div',{class:'track'}, h('div',{class:'fill',style:`width:${v==null?0:pct(v)}%`})), h('output',null, v==null?'—':pct(v)+'%')), h('div',{style:'font-size:.78rem;color:var(--muted);margin:-4px 0 0'}, d))));
  const ladder = h('div',{class:'ladder'}, LEVELS.map(l=>h('div',{class: l[1]===M.level?'on':''}, l[1], h('br'), `${l[0]}+`)));
  main.append(h('div',{class:'card'}, h('div',{class:'gauge'}, h('div',{html:gaugeSVG(M.index)}), h('div',{style:'flex:1;min-width:240px'}, h('h3',null, M.level), h('p',{class:'lede'}, M.levelText), ladder)), h('div',{style:'margin-top:16px'}, dimsEl),
    h('p',{class:'foot',style:'margin-top:12px'},'How it is worked out: knowledge 35%, applying it 35%, self-awareness 15%, completion 15%. Levels follow the familiar "novice to expert" stages.')));
  const adv = h('div',{class:'advice'}, advice().map(([t,txt,v])=>h('div',null, h('span',{class:'pill acc',style:'flex:none'},t), h('span',{style:'flex:1'},txt), v ? h('button',{class:'btn small',type:'button',onclick:()=>go(v)},'Go') : null)));
  main.append(h('div',{class:'card'}, h('h3',null,'What to do next'), adv));
  const rows = CH.lessons.map((les,i)=>{ const l = S.lessons[i]||{}; return h('tr',null, h('td',null, `${i+1}. ${les.title}`), h('td',null, l.watched?'✓':'—'), h('td',null, l.check ? (l.check.ok ? h('span',{class:'pill good'},'Right') : h('span',{class:'pill warn'},'Missed')) : '—'), h('td',null, l.caseDone ? `${l.caseScore}/${l.caseMax}` : '—'), h('td',{class:'mono'}, l.secs ? (l.secs<60 ? '<1 min' : Math.round(l.secs/60)+' min') : '—')); });
  main.append(h('div',{class:'card'}, h('h3',null,'Lesson by lesson'), h('div',{class:'tablewrap'}, h('table',{class:'t'}, h('thead',null,h('tr',null, ['Lesson','Watched','Check','Case','Time'].map(t=>h('th',null,t)))), h('tbody',null,rows))),
    S.test ? h('p',{style:'margin-top:10px'}, h('span',{class:'pill acc'}, `Final test: ${S.test.score} of ${CH.test.length}`)) : null));
  // certificate
  const nameIn = h('input',{type:'text',id:'certName',placeholder:'Your name as it should appear',value:S.name||''});
  const certBtn = h('button',{class:'btn primary',type:'button'},'Download certificate');
  const note = h('p',{class:'foot'});
  const eligible = S.test && M.index >= 60;
  certBtn.disabled = !eligible; note.textContent = eligible ? 'Saves a picture of your certificate. Your score is calculated in your own browser, so keep the file as your record.' : 'Available once you have taken the final case test and reached Competent (60 or more).';
  certBtn.onclick = () => { S.name = nameIn.value.trim(); save(); makeCert(S.name || 'Learner', M); };
  main.append(h('div',{class:'card'}, h('h3',null,'Certificate'), h('div',{class:'row'}, nameIn, certBtn), note,
    h('div',{class:'row',style:'margin-top:14px'}, h('button',{class:'btn small',type:'button',onclick:()=>{ resetBox.hidden = false; }},'Start this chapter again'))));
  const resetBox = h('div',{class:'card',hidden:true,style:'background:var(--bad-soft)'}, h('p',null,'This clears your plan, answers and scores for this chapter in this browser. It cannot be undone.'), h('div',{class:'row',style:'margin-top:10px'}, h('button',{class:'btn',type:'button',onclick:()=>{ S = blank(); save(); go('start'); }},'Yes, clear this chapter'), h('button',{class:'btn',type:'button',onclick:()=>{ resetBox.hidden=true; }},'Keep my progress')));
  main.append(resetBox);
}
function makeCert(name, M){
  const c = document.createElement('canvas'); c.width = 1600; c.height = 1130; const x = c.getContext('2d');
  x.fillStyle = '#FFFFFF'; x.fillRect(0,0,1600,1130); x.strokeStyle = '#0E6B66'; x.lineWidth = 14; x.strokeRect(40,40,1520,1050); x.lineWidth = 2; x.strokeRect(70,70,1460,990);
  x.fillStyle = '#0E6B66'; x.textAlign = 'center'; x.font = '600 30px Georgia, serif'; x.fillText('ENGINEERING ETHICS OF AI BY DESIGN', 800, 180);
  x.fillStyle = '#14232A'; x.font = '600 72px Georgia, serif'; x.fillText('Certificate of learning', 800, 290);
  x.font = '28px Arial, sans-serif'; x.fillStyle = '#55686D'; x.fillText('This is to record that', 800, 380);
  x.fillStyle = '#14232A'; x.font = '600 64px Georgia, serif'; x.fillText(name.slice(0,48), 800, 470);
  x.font = '28px Arial, sans-serif'; x.fillStyle = '#55686D'; x.fillText('has completed', 800, 550);
  x.fillStyle = '#14232A'; x.font = '600 40px Georgia, serif'; x.fillText((CH.num==='A'?'Appendix A: ':'Chapter '+CH.num+': ') + CH.title, 800, 620, 1400);
  x.font = '22px Arial, sans-serif'; x.fillStyle = '#55686D'; x.fillText('Online course based on the book by Prof Muthu Ramachandran', 800, 665);
  x.fillStyle = '#0E6B66'; x.font = '600 46px Arial, sans-serif'; x.fillText(`Learning index ${M.index} / 100  ·  ${M.level}`, 800, 740);
  x.fillStyle = '#55686D'; x.font = '24px Arial, sans-serif';
  x.fillText(`Knowledge ${pct(M.K)}%   ·   Applying it ${pct(M.A)}%   ·   Self-awareness ${M.C==null?'—':pct(M.C)+'%'}   ·   Final test ${S.test.score}/${CH.test.length}`, 800, 800);
  x.fillText('Issued ' + new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) + '  ·  Self-assessed online course record, calculated in the learner\'s browser', 800, 980);
  c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `certificate-${CH.id}.png`; document.body.append(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000); });
}

/* ---------------- boot ---------------- */
$('#chNum').textContent = CH.num==='A' ? 'Appendix A' : 'Chapter '+CH.num;
$('#chTitle span').textContent = CH.title;
const hv = (location.hash||'').slice(1);
go(views().includes(hv) ? hv : (S.plan ? 'l'+firstUnfinished() : 'start'));
