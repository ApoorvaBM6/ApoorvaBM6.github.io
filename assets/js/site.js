/* Portfolio behaviour. Data comes from window.SITE_DATA (built by Liquid in index.html). */
const DATA = window.SITE_DATA;
/* Normalise the project data coming from the _projects/ front matter. */
(function () {
  const arr = v => Array.isArray(v) ? v : (v ? [v] : []);
  const decode = h => { const t = document.createElement('textarea'); t.innerHTML = h; return t.value; };
  DATA.projects = DATA.projects.map((p, i) => ({
    id: 'p' + (i + 1),
    title: p.title || '',
    period: String(p.period || ''),
    tag: p.tag || '',
    university: p.university || '',
    category: arr(p.category),
    skills: arr(p.skills),
    contributors: arr(p.contributors).map(c => typeof c === 'string' ? { name: c } : { name: c.name, linkedin: c.linkedin }).filter(c => c.name),
    links: [
      ...(p.github ? [{ label: 'GitHub', url: p.github }] : []),
      ...(p.report ? [{ label: 'Report', url: p.report }] : []),
      ...(p.presentation ? [{ label: 'Slides', url: p.presentation }] : []),
      ...arr(p.links).map(l => ({ label: l.title, url: l.url }))
    ],
    summary: decode(String(p.summary || '')).replace(/\s+/g, ' ').trim(),
    body: p.body || ''
  }));
})();
const $ = (s, r=document) => r.querySelector(s), $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const P = Object.fromEntries(DATA.projects.map(p => [p.id, p]));


/* ---------- socials ---------- */
const ICONS = {
  github:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"/></svg>',
  linkedin:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.5H3.5V9h3.6v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z"/></svg>',
  email:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/></svg>'
};
const SOC = [['github','https://github.com/ApoorvaBM6','GitHub'],['linkedin','https://linkedin.com/in/apoorva-bm','LinkedIn'],['email','mailto:bmapoorva.nr@gmail.com','Email']];
const EMAIL = 'bmapoorva.nr@gmail.com';
$$('[data-socials]').forEach(el => el.innerHTML = SOC.map(([k,u,l]) => k === 'email'
  ? `<a href="mailto:${EMAIL}" class="mail-link" target="_blank" rel="noopener" aria-label="Email ${EMAIL}" title="${EMAIL}">${ICONS[k]}</a>`
  : `<a href="${u}" target="_blank" rel="noopener" aria-label="${l}" title="${l}">${ICONS[k]}</a>`).join(''));
/* email: open the mail app and copy the address as a fallback */
const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role','status'); document.body.appendChild(toast);
function showToast(msg){ toast.textContent = msg; toast.classList.add('on'); clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove('on'), 2600); }
document.addEventListener('click', e => {
  const a = e.target.closest('.mail-link'); if (!a) return;
  try { navigator.clipboard.writeText(EMAIL).then(() => showToast(`${EMAIL} copied to clipboard`), () => showToast(EMAIL)); }
  catch (_) { showToast(EMAIL); }
});

/* ---------- hero: rate-monotonic schedule strip (single core, preemptive) ---------- */
(function(){
  const c = $('#sched'), ctx = c.getContext('2d'); let w, h, dpr, off = 0, running = true, last = performance.now();
  // [name, period T (ms), WCET C (ms), colour]; deadline = period, all released at t=0 (critical instant)
  const TASKS = [['CTRL',10,2,'#00B8D9'],['NAV',20,4,'#4FD1C5'],['BUS',40,5,'#7fdcef'],['HMI',80,8,'rgba(248,250,252,.6)']];
  const H = 80, DT = 0.5; // hyperperiod (ms) and simulation step
  const U = TASKS.reduce((s,[,T,C]) => s + C/T, 0);
  // Simulate RM: at every step run the ready job with the shortest period.
  const segs = TASKS.map(() => []), rem = TASKS.map(() => 0); let missed = 0;
  for (let t = 0; t < H; t += DT){
    TASKS.forEach(([,T,C],i) => { if (Math.abs(t % T) < 1e-9){ if (rem[i] > 1e-9) missed++; rem[i] = C; } });
    const i = rem.findIndex(r => r > 1e-9); // TASKS sorted by period = RM priority order
    if (i < 0) continue;
    const sg = segs[i], lastSeg = sg[sg.length-1];
    if (lastSeg && Math.abs(lastSeg[1] - t) < 1e-9) lastSeg[1] = t + DT; else sg.push([t, t + DT]);
    rem[i] -= DT;
  }
  const PX = 8.5;
  function size(){ dpr = Math.min(devicePixelRatio||1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w*dpr; c.height = h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  function draw(){
    ctx.clearRect(0,0,w,h);
    const rowH = 17, top = 30, labelW = 46, nowX = Math.round(labelW + (w-labelW)*.55);
    ctx.font = '10px ui-monospace,monospace'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(248,250,252,.45)';
    ctx.fillText(`SINGLE CORE · PREEMPTIVE RM · U = ${U.toFixed(2)} · ${missed} DEADLINE MISSES`, 0, 9);
    const t0 = off/PX, tEnd = t0 + (w-labelW)/PX;
    // hyperperiod boundaries
    for (let m = Math.ceil(t0/H)*H; m <= tEnd; m += H){
      const x = labelW + (m-t0)*PX; ctx.strokeStyle = 'rgba(0,184,217,.35)'; ctx.beginPath(); ctx.moveTo(x+.5, top-6); ctx.lineTo(x+.5, top+TASKS.length*rowH); ctx.stroke();
    }
    TASKS.forEach(([n,T,,col],r) => {
      const y = top + r*rowH;
      ctx.fillStyle = 'rgba(248,250,252,.55)'; ctx.fillText(n, 0, y+rowH/2-1);
      // release markers
      ctx.strokeStyle = 'rgba(248,250,252,.18)';
      for (let k = Math.ceil(t0/T)*T; k <= tEnd; k += T){ const x = labelW + (k-t0)*PX; ctx.beginPath(); ctx.moveTo(x+.5, y+1); ctx.lineTo(x+.5, y+rowH-3); ctx.stroke(); }
      // execution segments, repeated every hyperperiod
      ctx.fillStyle = col;
      for (let base = Math.floor(t0/H)*H; base <= tEnd; base += H){
        segs[r].forEach(([a,b]) => {
          const x1 = labelW + (base+a-t0)*PX, x2 = labelW + (base+b-t0)*PX;
          if (x2 < labelW || x1 > w) return;
          ctx.globalAlpha = (x1+x2)/2 < nowX ? .95 : .3;
          ctx.fillRect(Math.max(x1,labelW), y+3, x2-Math.max(x1,labelW), rowH-7);
        });
      }
      ctx.globalAlpha = 1;
    });
    ctx.strokeStyle = '#4FD1C5'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(nowX+.5, top-8); ctx.lineTo(nowX+.5, top+TASKS.length*rowH+2); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = '#4FD1C5'; ctx.beginPath(); ctx.moveTo(nowX-4, top-12); ctx.lineTo(nowX+5, top-12); ctx.lineTo(nowX+.5, top-6); ctx.fill();
  }
  window.__rm = {segs, U, missed};
  function loop(now){ if (!running) return; off += (now-last)*0.04; last = now; draw(); requestAnimationFrame(loop); }
  size(); draw();
  addEventListener('resize', () => { size(); draw(); });
  if (!reduce){
    new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was){ last = performance.now(); requestAnimationFrame(loop); } }).observe($('#top'));
    requestAnimationFrame(loop);
  }
})();

/* ---------- typed roles ---------- */
(function(){
  const roles = ['Embedded software engineer','Real-time & safety-critical systems','Avionics networks · RTOS · FPGA','Human-centred aerospace systems'];
  const el = $('#typed');
  if (reduce){ el.textContent = roles[0]; return; }
  let r = 0, i = 0, del = false;
  (function tick(){
    const s = roles[r]; el.textContent = s.slice(0, i);
    if (!del && i < s.length){ i++; setTimeout(tick, 55); }
    else if (!del){ del = true; setTimeout(tick, 1800); }
    else if (i > 0){ i--; setTimeout(tick, 25); }
    else { del = false; r = (r+1) % roles.length; setTimeout(tick, 300); }
  })();
})();

/* ---------- counters ---------- */
function countUp(el){
  const n = +el.dataset.count, suf = el.dataset.suffix || '';
  if (reduce){ el.textContent = n + suf; return; }
  const t0 = performance.now();
  (function f(now){ const k = Math.min(1,(now-t0)/1100), e = 1-Math.pow(1-k,3); el.textContent = Math.round(n*e) + suf; if (k < 1) requestAnimationFrame(f); })(t0);
}
setTimeout(() => $$('[data-count]').forEach(countUp), 400);

/* ---------- CV menu ---------- */
const cvBtn = $('#cvBtn'), cvMenu = $('#cvMenu');
cvBtn.onclick = e => { e.stopPropagation(); const o = cvMenu.classList.toggle('open'); cvBtn.setAttribute('aria-expanded', o); };
document.addEventListener('click', () => { cvMenu.classList.remove('open'); cvBtn.setAttribute('aria-expanded', false); });

/* ---------- reveal ---------- */
const ro = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); ro.unobserve(e.target); } }), {rootMargin:'0px 0px -8% 0px'});
function observeReveals(root=document){ $$('.reveal:not(.in)', root).forEach((el,i) => { el.style.transitionDelay = (i%4)*70+'ms'; ro.observe(el); }); }

/* ---------- nav ---------- */
(function(){
  const ids = ['top','overview','journey','projects','engagement','contact'];
  const alti = $('#alti'), top = $('#topbar');
  const mark = id => { $$('a[data-s]').forEach(a => a.classList.toggle('active', a.dataset.s === id)); alti.classList.toggle('dark', !!document.getElementById(id).hasAttribute('data-dark')); top.classList.toggle('show', id !== 'top'); };
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting && mark(e.target.id)), {rootMargin:'-45% 0px -50% 0px'}).observe($('#top'));
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && mark(e.target.id)), {rootMargin:'-45% 0px -50% 0px'});
  ids.forEach(id => io.observe(document.getElementById(id)));
})();

/* ---------- bento extras ---------- */
(function(){
  // mini map dots
  const svg = $('#miniMap'); let s = '';
  if (svg) {
  for (let x = 10; x < 300; x += 14) for (let y = 8; y < 140; y += 14) s += `<circle cx="${x}" cy="${y}" r=".9" fill="#F8FAFC" fill-opacity=".18"/>`;
  const pts = [[60,50],[80,40],[140,46],[150,60],[160,52],[210,70],[230,58],[250,90],[100,95],[180,100]];
  pts.forEach(([x,y],i) => s += `<circle cx="${x}" cy="${y}" r="3.2" fill="${i%3?'#00B8D9':'#4FD1C5'}"><animate attributeName="r" values="3;5;3" dur="${2+i%3}s" repeatCount="indefinite"/></circle>`);
  s += `<path d="M60 50 L140 46 L210 70 M150 60 L180 100 M80 40 L100 95" stroke="#00B8D9" stroke-opacity=".35" fill="none"/>`;
  svg.innerHTML = s;
  }
  // focus bars
  const counts = {}; DATA.projects.forEach(p => p.category.forEach(c => counts[c] = (counts[c]||0)+1));
  const max = Math.max(...Object.values(counts));
  $('#focusBars').innerHTML = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v]) =>
    `<div style="display:grid;grid-template-columns:150px 1fr 24px;gap:10px;align-items:center;font-size:13.5px;margin:6px 0"><span>${esc(k)}</span><span style="height:8px;border-radius:4px;background:rgba(0,29,59,.07);overflow:hidden"><i style="display:block;height:100%;width:${v/max*100}%;background:linear-gradient(90deg,#00B8D9,#4FD1C5);border-radius:4px"></i></span><b style="font-family:var(--mono);font-size:12px;color:#001d3b">${v}</b></div>`).join('');
})();

/* ---------- timeline ---------- */
const TL = [
  {kind:'Education', cls:'edu', when:'2023 – 2026', title:'M.Sc. Aerospace Engineering (Embedded Systems)', org:'ISAE-SUPAERO, Toulouse', uni:'ISAE-SUPAERO',
   detail:'<p>Specialisation in embedded systems with a focus on neuro-adaptive systems and human factors.</p><ul><li>Real-Time Operating Systems</li><li>AI and Autonomous Systems</li><li>Instrumentation and Flight Data Analysis</li><li>Aircraft Control and Guidance (Airbus FMS)</li><li>Space Environment and Effects</li></ul>'},
  {kind:'Experience', cls:'exp', when:'Apr 2025 – Sep 2025', title:'Research Intern', org:'ISAE-SUPAERO Neuroergonomics Lab · Toulouse',
   detail:'<p>Developed <b>real-time blink detection algorithms</b> from fronto-polar EEG to evaluate mental fatigue in professionals in extreme environments. Designed experimental protocols and evaluated algorithm robustness for safety-critical conditions.</p>', skills:['Python','EEG Signal Processing','Machine Learning','Research Methodology']},
  {kind:'Experience', cls:'exp', when:'Jul 2024', title:'Summer Intern', org:'ISAE-SUPAERO Neuroergonomics Lab · Toulouse',
   detail:'<p>Collected and analysed <b>8-electrode EEG data</b> to validate prediction algorithms for spatial attention in simulated flight.</p>', skills:['Python','EEG Data Analysis','Log Analysis']},
  {kind:'Experience', cls:'exp', when:'Oct 2020 – Aug 2023', title:'Software / Firmware Engineer I & II', org:'Hewlett Packard (HP) · Bangalore',
   detail:'<p>Developed UI and firmware features across <b>40+ enterprise printer products</b>, focused on reliability and usability. Feature development, system triage and customer escalations during new product deployments. Promoted to Engineer II in June 2023.</p>',
   skills:['JavaScript','C#','C','CSS','Git','Agile','JIRA','Requirement Analysis']},
  {kind:'Education', cls:'edu', when:'2016 – 2020', title:'B.E. Electronics & Communication', org:'The National Institute of Engineering, Mysuru', uni:'The National Institute of Engineering',
   detail:'<ul><li>Embedded Systems, DSP and Signals &amp; Systems</li><li>Microcontrollers and Computer Architecture</li><li>Digital Electronics, Project Management</li></ul>'},
];
$('#timeline').innerHTML = TL.map((e,i) => {
  const n = e.uni ? DATA.projects.filter(p => p.university === e.uni).length : 0;
  return `<div class="t-item ${e.cls} reveal"><div class="t-card" data-i="${i}">
    <span class="t-when">${e.when}</span><span class="t-kind">${e.kind}</span>
    <h3>${esc(e.title)}</h3><div class="t-org">${esc(e.org)}</div>
    <div class="t-detail"><div>${e.detail}${e.skills?`<div class="t-skills">${e.skills.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div>`:''}</div></div>
    <div class="t-actions"><button data-toggle aria-expanded="false">Details ＋</button>${n?`<button data-uni="${esc(e.uni)}">See ${n} projects from here →</button>`:''}</div>
  </div></div>`;}).join('');
(function(){
  const tl = $('#timeline');
  tl.insertAdjacentHTML('beforeend', `<div class="tl-fill" aria-hidden="true"></div><div class="rocket" aria-hidden="true"><svg viewBox="0 0 34 34">
    <path class="flame" d="M13.5 25 Q17 34 20.5 25 Z" fill="#4FD1C5"/>
    <path d="M17 2c4.5 3.8 6.6 9.2 6.2 16.4l-1.4 6.1h-9.6l-1.4-6.1C10.4 11.2 12.5 5.8 17 2z" fill="#F8FAFC"/>
    <path d="M17 2c2.2 1.9 3.8 4.2 4.8 6.9h-9.6C13.2 6.2 14.8 3.9 17 2z" fill="#00B8D9"/>
    <circle cx="17" cy="13.2" r="2.6" fill="#001d3b" stroke="#00B8D9" stroke-width="1.2"/>
    <path d="M10.8 16.5 6.5 22.4l5.3-.6zM23.2 16.5l4.3 5.9-5.3-.6z" fill="#00B8D9"/>
  </svg></div>`);
  const fill = $('.tl-fill', tl), rocket = $('.rocket', tl), items = $$('.t-item', tl);
  let lastY = scrollY, ticking = false;
  function update(){
    ticking = false;
    const r = tl.getBoundingClientRect(), anchor = innerHeight * .5;
    const y = Math.max(0, Math.min(r.height, anchor - r.top));
    fill.style.height = y + 'px';
    rocket.style.translate = `0 ${y}px`;
    const dir = scrollY - lastY; if (dir) rocket.classList.toggle('up', dir < 0); lastY = scrollY;
    items.forEach(it => it.classList.toggle('passed', it.offsetTop + 29 <= y));
  }
  addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(update); } }, {passive:true});
  addEventListener('resize', update);
  update();
})();
$('#timeline').addEventListener('click', ev => {
  const card = ev.target.closest('.t-card'); if (!card) return;
  const uni = ev.target.closest('[data-uni]');
  if (uni){ setUni(uni.dataset.uni); $('#projects').scrollIntoView({behavior: reduce?'auto':'smooth'}); return; }
  const open = card.classList.toggle('open'); const b = $('[data-toggle]', card); b.textContent = open ? 'Details −' : 'Details ＋'; b.setAttribute('aria-expanded', open);
});

/* ---------- grid + filters ---------- */
let curCat = 'all', curUni = null;
const cats = ['all', ...new Set(DATA.projects.flatMap(p => p.category))];
$('#filters').insertAdjacentHTML('afterbegin', cats.map(c => {
  const n = c==='all' ? DATA.projects.length : DATA.projects.filter(p => p.category.includes(c)).length;
  return `<button class="filter${c==='all'?' on':''}" data-cat="${esc(c)}">${c==='all'?'All':esc(c)}<span class="n">${n}</span></button>`; }).join(''));
const tagCls = t => /research/i.test(t) ? 'research' : /personal/i.test(t) ? 'personal' : '';
$('#grid').innerHTML = DATA.projects.map(p => `<button class="card reveal" data-open="${p.id}">
  <div class="meta"><span class="tagdot ${tagCls(p.tag)}"><i></i>${esc(p.tag)}</span><span>${esc(p.period.split(/[–-]/)[0].trim())}</span></div>
  <h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p>
  <div class="skills">${p.skills.slice(0,3).map(s=>`<span class="chip">${esc(s)}</span>`).join('')}${p.skills.length>3?`<span class="chip">+${p.skills.length-3}</span>`:''}</div>
</button>`).join('');
function applyFilter(){
  $$('.card').forEach(c => { const p = P[c.dataset.open]; c.classList.toggle('hide', !((curCat==='all'||p.category.includes(curCat)) && (!curUni||p.university===curUni))); });
  $$('.filter').forEach(b => b.classList.toggle('on', b.dataset.cat === curCat));
  $('#uniPill').classList.toggle('show', !!curUni); $('#uniName').textContent = curUni || '';
}
function setUni(u){ curUni = u; curCat = 'all'; applyFilter(); }
$('#filters').addEventListener('click', e => { const b = e.target.closest('.filter'); if (b){ curCat = b.dataset.cat; applyFilter(); } });
$('#uniClear').onclick = () => { curUni = null; applyFilter(); };

/* ---------- drawer / modal ---------- */
const scrim = $('#scrim'), drawer = $('#drawer'), modal = $('#modal'); let lastFocus;
function openProject(id){
  const p = P[id]; lastFocus = document.activeElement;
  drawer.innerHTML = `<div class="drawer-head"><button class="x" data-close aria-label="Close">×</button><div class="eyebrow">${esc(p.tag)}${p.category.length?' · '+p.category.map(esc).join(' · '):''}</div><h3 id="dTitle">${esc(p.title)}</h3><div class="sub">${esc(p.period)}${p.university?' · '+esc(p.university):''}</div></div>
  <div class="drawer-body">${p.body}
  ${p.skills.length?`<h4>Skills &amp; tools</h4><div class="skills">${p.skills.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div>`:''}
  ${p.contributors.length?`<h4>Collaborators</h4><div class="collab">${p.contributors.map(c => c.linkedin ? `<a href="${esc(c.linkedin)}" target="_blank" rel="noopener" title="${esc(c.name)} on LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.5H3.5V9h3.6v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z"/></svg>${esc(c.name)}</a>` : `<span>${esc(c.name)}</span>`).join('')}</div>`:''}
  ${p.links.length?`<h4>Links</h4><div class="links">${p.links.map(l=>`<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>`:''}</div>`;
  drawer.classList.add('on'); scrim.classList.add('on'); document.body.style.overflow = 'hidden'; $('.x', drawer).focus();
}
function openAbout(){
  lastFocus = document.activeElement;
  modal.innerHTML = `<div class="drawer-head"><button class="x" data-close aria-label="Close">×</button><div class="eyebrow">About</div><h3>Apoorva Busunur Mallikarjuna</h3></div><div class="drawer-body">${DATA.about}</div>`;
  modal.classList.add('on'); scrim.classList.add('on'); document.body.style.overflow = 'hidden'; $('.x', modal).focus();
}
function closeAll(){ drawer.classList.remove('on'); modal.classList.remove('on'); scrim.classList.remove('on'); document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }
document.addEventListener('click', e => {
  if (e.target.closest('[data-close]') || e.target === scrim) return closeAll();
  const o = e.target.closest('[data-open]'); if (o) return openProject(o.dataset.open);
  const t = e.target.closest('.tile.clickable'); if (!t) return;
  if (t.dataset.modal === 'about') openAbout();
  else if (t.dataset.project) openProject(t.dataset.project);
  else if (t.dataset.jump) document.getElementById(t.dataset.jump).scrollIntoView({behavior: reduce?'auto':'smooth'});
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAll();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tile')){ e.preventDefault(); e.target.click(); }
});

/* ---------- publication details ---------- */
$$('.pub-toggle').forEach(b => b.addEventListener('click', () => {
  const it = b.closest('.pub-item'), open = it.classList.toggle('open');
  b.setAttribute('aria-expanded', open); $('.sr-only', b).textContent = open ? 'Hide details' : 'Show details';
}));
/* ---------- engagement tabs (small screens) ---------- */
$$('.eng-tabs [role=tab]').forEach(b => b.addEventListener('click', () => {
  $$('.eng-tabs [role=tab]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
  $$('.eng-panel').forEach(pn => pn.classList.toggle('on', pn.id === b.getAttribute('aria-controls')));
}));

observeReveals();
