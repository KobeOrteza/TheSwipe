// The Swipe application logic. Word banks live in data/words.js.

const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>( {
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}
[c]));
const KEY='theswipe.v3',DEF= {
  best:0,
  streak:0,
  lastDay:null,
  daily: {
  },
  played:0,
  xp:0,
  seenHelp:false,
  opt: {
    snd:1,
    mus:1,
    vol:.6,
    hap:1
  }
};
let S=load();
function load() {
  try {
    const o=JSON.parse(localStorage.getItem(KEY));
    if(o)return {
      ...DEF,
      ...o,
      opt: {
        ...DEF.opt,
        ...o.opt
      }
    }
  }
  catch(e) {
  }
  return structuredClone(DEF)
}
function save() {
  try {
    localStorage.setItem(KEY,JSON.stringify(S))
  }
  catch(e) {
  }
}
/* Word banks are maintained separately in data/words.js. */
const {
  dictionary: D,
  slang: SL,
  fakes: FK
} = window.SWIPE_WORD_DATA;
const mk=(l,real,src)=> {
  const i=l.indexOf('|');
  return {
    w:i<0?l:l.slice(0,i),
    def:i<0?'Totally made up!':l.slice(i+1),
    real,
    src
  }
};
const fake=i=>( {
  w:FK[i],def:'Totally made up – not a real word!',real:false,src:'fake'
});
function pick(n,lo,hi,r) {
  const s=new Set();
  n=Math.min(n,hi-lo);
  while(s.size<n)s.add(lo+Math.floor(r()*(hi-lo)));
  return[...s]
}
let RS=null;
function decoy(r) {
  RS=RS||new Set(D.map(l=>l.slice(0,l.indexOf('|'))));
  const V='AEIOU';
  for(let t=0;t<40;t++) {
    const o=D[Math.floor(r()*Math.min(D.length,20000))],
    w=o.slice(0,o.indexOf('|'));
    if(w.length<6||w.length>11||!/^[A-Z]+$/.test(w))continue;
    const i=1+Math.floor(r()*(w.length-2)),
    c=w[i];
    let m;
    if(V.includes(c))m=w.slice(0,i)+V.replace(c,'')[Math.floor(r()*4)]+w.slice(i+1);
    else if(w[i+1]!==c&&i<w.length-2)m=w.slice(0,i)+w[i+1]+c+w.slice(i+2);
    else continue;
    if(!RS.has(m))return {
      w:m,
      def:'A sneaky look-alike of “'+w+'”.',
      real:false,
      src:'decoy'
    }
  }
  return fake(Math.floor(r()*FK.length))
}
const realPick=(n,r,hard)=> {
  const s=Math.max(1,Math.round(n*.3)),
  L=D.length;
  return pick(n-s,hard?L>>1:0,hard?L:L*.6|0,r).map(i=>mk(D[i],true,'dict')).concat(pick(s,0,SL.length,r).map(i=>mk(SL[i],true,'slang')))
};
const fakePick=(n,r,hard)=> {
  const d=hard?n>>1:0;
  return pick(n-d,0,FK.length,r).map(fake).concat(Array.from( {
    length:d
  },()=>decoy(r)))
};
const MODES= {
  daily: {
    n:'Daily Match',
    e:'🎁',
    d:'20 cards, same for all',
    t:3000
  },
  speed: {
    n:'Speed Run',
    e:'⚡',
    d:'60 seconds',
    t:3000
  },
  hard: {
    n:'Hard Mode',
    e:'🌶️',
    d:'2s + sneaky fakes',
    t:2000
  },
  practice: {
    n:'Practice',
    e:'🌱',
    d:'No timer, relax',
    t:0
  }
};
function rng(seed) {
  let a=seed>>>0;
  return()=> {
    a=a+0x6D2B79F5>>>0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return((t^t>>>14)>>>0)/4294967296
  }
}
function hash(s) {
  let h=2166136261;
  for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);
  return h>>>0
}
function shuffle(a,r=Math.random) {
  a=a.slice();
  for(let i=a.length-1;i>0;i--) {
    const j=Math.floor(r()*(i+1));
    [a[i],
    a[j]]=[a[j],
    a[i]]
  }
  return a
}
const today=()=> {
  const d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
};

function buildDeck(m, day) {
  if (m === 'daily') {
    // Generate a fresh random deck every time Daily Match starts.
    const r = Math.random;

    return shuffle(
      [
        ...realPick(10, r),
        ...fakePick(10, r)
      ],
      r
    );
  }

  // Keep the existing behavior of other game modes.
  const h = m === 'speed' ? 60 : 10;
  const x = Math.random;

  return shuffle([
    ...realPick(h, x, m === 'hard'),
    ...fakePick(h, x, m === 'hard')
  ]);
}

const mult=c=>1+Math.min(4,Math.floor((c-1)/5))*.5;
function score(g,ok) {
  if(ok) {
    g.combo++;
    g.best=Math.max(g.best,g.combo);
    const p=Math.round(100*mult(g.combo));
    g.score+=p;
    g.cor++;
    return p
  }
  g.combo=0;
  return 0
}
const lvOf=x=>Math.floor(Math.sqrt(x/60))+1,TT=['Word Seedling',
'Sprout',
'Bud',
'Blossom',
'Wordsmith',
'Lexi-Star',
'Word Wizard',
'Dictionary Dragon'];
function lvUI() {
  const l=lvOf(S.xp),
  a=60*(l-1)**2,
  b=60*l*l;
  $('lvN').textContent='Lv '+l;
  $('lvT').textContent=TT[Math.min(l-1,TT.length-1)];
  $('xpF').style.width=(S.xp-a)/(b-a)*100+'%'
}
/* ---------- audio: soft bells, pentatonic combo climb, whoosh, music box ---------- */
let AC,MG,NB,mt=0,ms=0,nt=0;
function ac() {
  if(!AC) {
    const X=window.AudioContext||window.webkitAudioContext;
    if(!X)return;
    AC=new X();
    const c=AC.createDynamicsCompressor();
    MG=AC.createGain();
    MG.connect(c);
    c.connect(AC.destination);
    NB=AC.createBuffer(1,AC.sampleRate*.4|0,AC.sampleRate);
    const d=NB.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1
  }
  if(AC.state!=='running')AC.resume();
  MG.gain.value=S.opt.vol;
  return AC
}
const hz=n=>523.25*2**(n/12),PT=[0,
2,
4,
7,
9],pn=i=>hz(PT[i%5]+12*(i/5|0));
function bell(f,w=0,d=.4,v=.5,ty='sine',m) {
  if(!(m?S.opt.mus&&S.opt.snd:S.opt.snd)||!ac())return;
  const t=AC.currentTime+w,
  g=AC.createGain(),
  o=AC.createOscillator(),
  h=AC.createOscillator(),
  hg=AC.createGain();
  o.type=ty;
  o.frequency.value=f;
  h.frequency.value=f*2.76;
  hg.gain.value=.12;
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(v,t+.008);
  g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);
  h.connect(hg).connect(g);
  g.connect(MG);
  o.start(t);
  h.start(t);
  o.stop(t+d+.05);
  h.stop(t+d+.05)
}
function slide(a,b,d=.25,ty='sine',v=.4,w=0) {
  if(!S.opt.snd||!ac())return;
  const t=AC.currentTime+w,
  o=AC.createOscillator(),
  g=AC.createGain();
  o.type=ty;
  o.frequency.setValueAtTime(a,t);
  o.frequency.exponentialRampToValueAtTime(b,t+d);
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(v,t+.02);
  g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g).connect(MG);
  o.start(t);
  o.stop(t+d+.05)
}
function whoosh() {
  if(!S.opt.snd||!ac())return;
  const t=AC.currentTime,
  s=AC.createBufferSource(),
  f=AC.createBiquadFilter(),
  g=AC.createGain();
  s.buffer=NB;
  f.type='bandpass';
  f.Q.value=1.2;
  f.frequency.setValueAtTime(500,t);
  f.frequency.exponentialRampToValueAtTime(2400,t+.16);
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(.3,t+.04);
  g.gain.exponentialRampToValueAtTime(.0001,t+.18);
  s.connect(f).connect(g).connect(MG);
  s.start(t);
  s.stop(t+.2)
}
const sfx= {
  tap:()=>slide(600,950,.07,'sine',.3),
  ok:c=> {
    const i=Math.min(c+1,11);
    bell(pn(i),0,.45,.5);
    bell(pn(i+2),.07,.5,.35);
    if(c%5===0)[0,
    1,
    2,
    3].forEach(k=>bell(pn(14+k),.1+k*.06,.4,.25))
  },
  bad:()=> {
    slide(330,190,.3,'sine',.45);
    slide(250,140,.32,'triangle',.22,.1)
  },
  late:()=>slide(420,130,.45,'triangle',.4),
  tick:()=>bell(1568,0,.08,.22,'triangle'),
  star:i=>bell(pn(7+i*2),0,.55,.5),
  end:()=>[0,
  2,
  4,
  7].forEach((n,i)=>bell(pn(n+3),i*.1,.5,.4)),
  lvl:()=>[0,
  4,
  7,
  12,
  16,
  19].forEach((n,i)=>bell(hz(n),i*.09,.7,.45))
};
const MEL=[0,
2,
4,
2,
5,
4,
2,
0,
4,
5,
7,
5,
4,
2,
4,
2];
function sched() {
  if(!AC||!S.opt.mus||!S.opt.snd||document.hidden||(G&&G.paused))return;
  const n=AC.currentTime;
  if(nt<n)nt=n+.05;
  while(nt<n+.3) {
    const i=ms++%16,
    k=MEL[i];
    bell(pn(k),nt-n,.55,.07,'sine',1);
    if(i%4===0)bell(pn(k)/2,nt-n,.7,.09,'sine',1);
    nt+=.27
  }
}
const music=()=> {
  if(!mt)mt=setInterval(sched,150)
};
const buzz=p=> {
  if(S.opt.hap&&navigator.vibrate)try {
    navigator.vibrate(p)
  }
  catch(e) {
  }
};
/* ---------- fx ---------- */
const YAY=['Yay!',
'Nice!',
'Sparkly!',
'Got it!',
'Cutie!'],OOPS=['Oopsie!',
'So close!',
'Next one!',
'Boop!'],R1=a=>a[Math.random()*a.length|0];
function mood(m) {
  document.querySelectorAll('.bloop[data-mood]').forEach(b=>b.dataset.mood=m);
  clearTimeout(mood.t);
  if(m!=='idle')mood.t=setTimeout(()=>mood('idle'),m==='sad'?1100:800)
}
function burst(el,em,n=12) {
  for(let i=0;i<n;i++) {
    const s=document.createElement('span'),
    a=Math.random()*6.28,
    d=60+Math.random()*90;
    s.className='cf';
    s.textContent=em[i%em.length];
    s.style.cssText=`--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d-40}px`;
    el.appendChild(s);
    s.onanimationend=()=>s.remove()
  }
}
function pop(t) {
  const s=document.createElement('div');
  s.className='pp';
  s.textContent=t;
  $('stage').appendChild(s);
  s.onanimationend=()=>s.remove()
}
/* ---------- engine ---------- */
let G=null,raf=0,last=0;
const fill=$('fill'),barEl=$('bar'),wc=$('wc');
function show(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id))
}
function start(mode) {
  cancelAnimationFrame(raf);
  const day=today(),
  m=MODES[mode];
  G= {
    mode,
    day,
    deck:buildDeck(mode,day),
    i:0,
    score:0,
    combo:0,
    best:0,
    cor:0,
    ans:[],
    cardLeft:m.t,
    runLeft:mode==='speed'?60000:Infinity,
    paused:false,
    locked:false,
    over:false,
    requeued:false,
    warned:false,
    low:false
  };
  show('game');
  $('pause').classList.remove('on');
  music();
  card();
  last=performance.now();
  raf=requestAnimationFrame(loop)
}
function card() {
  const g=G;
  if(g.over)return;
  if(g.i>=g.deck.length) {
    if(g.mode==='speed')g.deck=g.deck.concat(buildDeck('speed'));
    else if(g.mode==='practice'&&!g.requeued) {
      g.requeued=true;
      const miss=g.ans.filter(a=>!a.ok).map(a=>a.w);
      if(miss.length)g.deck=g.deck.concat(miss);
      else return end()
    }
    else return end()
  }
  g.locked=false;
  g.warned=false;
  g.cardLeft=MODES[g.mode].t;
  const it=g.deck[g.i],
  w=it.w.length;
  wc.classList.remove('go');
  wc.style.transform='';
  wc.style.opacity=1;
  wc.querySelectorAll('.st').forEach(s=>s.style.opacity=0);
  const wd=$('word');
  wd.textContent=it.w;
  wd.style.fontSize=Math.max(26,Math.min(58,500/w))+'px';
  $('lbl').textContent=g.mode==='speed'?'Speed Run':g.mode==='practice'?'Practice · '+(g.i+1):`Card ${g.i+1}/${g.deck.length}`;
  $('fb').innerHTML='';
  hud();
  bar()
}
function hud() {
  const g=G;
  $('score').textContent=g.score.toLocaleString();
  $('combo').textContent=g.combo>1?'×'+mult(g.combo)+' · '+g.combo+'🔥':'';
  barEl.style.visibility=MODES[g.mode].t?'visible':'hidden'
}
function bar() {
  const g=G,
  t=MODES[g.mode].t,
  f=g.mode==='speed'?g.runLeft/60000:t?g.cardLeft/t:1;
  fill.style.transform=`scaleX(${Math.max(0,f).toFixed(3)})`;
  const low=t>0&&g.cardLeft<900;
  if(low!==g.low) {
    g.low=low;
    barEl.classList.toggle('low',low)
  }
}
function loop(now) {
  if(!G||G.over)return;
  const dt=Math.min(100,now-last);
  last=now;
  if(!G.paused&&!G.locked) {
    if(G.mode==='speed') {
      G.runLeft-=dt;
      if(G.runLeft<=0) {
        G.runLeft=0;
        bar();
        return end()
      }
    }
    if(MODES[G.mode].t) {
      G.cardLeft-=dt;
      if(G.cardLeft<900&&!G.warned) {
        G.warned=true;
        sfx.tick()
      }
      if(G.cardLeft<=0) {
        G.cardLeft=0;
        bar();
        answer(null)
      }
    }
    bar()
  }
  raf=requestAnimationFrame(loop)
}
function answer(choice) {
  const g=G;
  if(!g||g.over||g.paused||g.locked)return;
  g.locked=true;
  const it=g.deck[g.i],
  timed=choice===null,
  ok=!timed&&choice===it.real,
  pts=score(g,ok),
  hi=ok&&g.combo>1&&g.combo%5===0;
  g.ans.push( {
    w:it,ok
  });
  whoosh();
  ok?(sfx.ok(g.combo),buzz(15)):(timed?sfx.late():sfx.bad(),buzz(40));
  mood(ok?hi?'wow':'happy':'sad');
  $('fb').innerHTML=`<strong class="${ok?'ok':'bad'}">${ok?R1(YAY)+' +'+pts:timed?'Too slow!':R1(OOPS)} · ${it.real?'Real':'Fake'}</strong>${esc(it.def)}`;
  if(ok)pop('+'+pts);
  if(hi) {
    burst($('stage'),['✨','⭐','💖','🌸']);
    const c=$('combo');
    c.classList.remove('pulse');
    void c.offsetWidth;
    c.classList.add('pulse')
  }
  const dir=choice===null?0:choice?1:-1;
  wc.classList.add('go');
  wc.style.transform=`translateX(${dir*130}%) rotate(${dir*18}deg)`;
  wc.style.opacity=0;
  hud();
  const my=g.i;
  setTimeout(()=> {
    if(G!==g||g.over||g.i!==my)return;g.i++;card()
  },MODES[g.mode].t?600:1400)
}
function pause(p) {
  if(!G||G.over||!$('game').classList.contains('on'))return;
  G.paused=p;
  $('pause').classList.toggle('on',p);
  last=performance.now()
}
function end() {
  const g=G;
  if(g.over)return;
  g.over=true;
  cancelAnimationFrame(raf);
  if(g.mode==='daily'&&g.ans.length===20)g.score+=200;
  const n=g.ans.length,
  acc=n?Math.round(g.cor/n*100):0,
  pb=g.mode!=='practice'&&g.score>S.best,
  l0=lvOf(S.xp),
  gain=Math.round(g.score/10)+(n>=10?10:0);
  S.played+=n;
  S.xp+=gain;
  if(pb)S.best=g.score;
  if(g.mode==='daily'&&!S.daily[g.day]) {
    S.daily[g.day]= {
      score:g.score,
      acc
    };
    const y=new Date();
    y.setDate(y.getDate()-1);
    const yd=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
    S.streak=S.lastDay===yd?S.streak+1:1;
    S.lastDay=g.day
  }
  save();
  sfx.end();
  buzz([20,30,20]);
  show('res');
  const up=lvOf(S.xp)>l0,
  st=!n?0:acc>=90?3:acc>=70?2:acc>=40?1:0;
  $('rMode').textContent=MODES[g.mode].e+' '+MODES[g.mode].n;
  $('rScore').textContent=g.score.toLocaleString();
  $('rPB').textContent=pb?'★ New personal best!':'';
  $('rLv').textContent=up?'🎉 Level up! Lv '+lvOf(S.xp)+' · '+TT[Math.min(lvOf(S.xp)-1,TT.length-1)]:'';
  $('rAcc').textContent=acc+'%';
  $('rCor').textContent=g.cor+'/'+n;
  $('rCombo').textContent=g.best+'×';
  $('rXp').textContent='+'+gain+' XP';
  $('share').textContent='Share';
  const sp=[...$('stars').children];
  sp.forEach(s=>s.classList.remove('on'));
  sp.forEach((s,i)=> {
    if(i<st)setTimeout(()=> {
      if(G!==g)return;s.classList.add('on');sfx.star(i);if(i===st-1)burst($('res'),['⭐','✨','💖'],14)
    },500+i*350)
  });
  if(up)setTimeout(()=> {
    if(G===g)sfx.lvl()
  },500+st*350+200);
  const miss=g.ans.filter(a=>!a.ok);
  $('rvT').textContent=miss.length?'Oopsies to review':'Perfect – nothing to review! 🌟';
  $('rev').innerHTML=miss.map(a=>`<div class="rev"><b>${esc(a.w.w)}</b> – <span class="${a.w.real?'ok':'bad'}">${a.w.real?'Real':'Fake'}</span><br><span style="color:var(--mut);font-weight:500">${esc(a.w.def)}</span></div>`).join('');
  home()
}
function home() {
  $('sBest').textContent=S.best.toLocaleString();
  $('sStreak').textContent=S.streak;
  const d=S.daily[today()];
  $('sDaily').textContent=d?d.score:'Open';
  lvUI()
}
/* ---------- input ---------- */
let ds=null;
wc.addEventListener('pointerdown',e=> {
  if(!G||G.locked||G.paused)return;ds= {
    x:e.clientX,dx:0
  };try {
    wc.setPointerCapture(e.pointerId)
  }
  catch(_) {
  }
});
wc.addEventListener('pointermove',e=> {
  if(!ds)return;ds.dx=e.clientX-ds.x;wc.style.transform=`translateX(${ds.dx}px) rotate(${ds.dx*.06}deg)`;const o=Math.min(1,Math.abs(ds.dx)/100);wc.querySelector('.st.r').style.opacity=ds.dx>0?o:0;wc.querySelector('.st.l').style.opacity=ds.dx<0?o:0
});
wc.addEventListener('pointerup',()=> {
  if(!ds)return;const dx=ds.dx;ds=null;if(Math.abs(dx)>90)answer(dx>0);else {
    wc.classList.add('go');wc.style.transform='';wc.querySelectorAll('.st').forEach(s=>s.style.opacity=0);setTimeout(()=>wc.classList.remove('go'),230)
  }
});
wc.addEventListener('pointercancel',()=> {
  ds=null;wc.style.transform=''
});
$('bYes').onclick=()=>answer(true);
$('bNo').onclick=()=>answer(false);
addEventListener('keydown',e=> {
  if(!$('game').classList.contains('on'))return;if(e.key==='ArrowRight')answer(true);else if(e.key==='ArrowLeft')answer(false);else if(e.key==='Escape'||e.key==='p')pause(!G.paused)
});
document.addEventListener('visibilitychange',()=> {
  if(document.hidden) {
    pause(true);AC&&AC.suspend()
  }
  else if(AC&&S.opt.snd)AC.resume()
});
/* ---------- UI wiring ---------- */
let sel='daily';
$('modes').innerHTML=Object.entries(MODES).map(([k,m])=>`<button class="btn" data-m="${k}"><b>${m.e} ${m.n}</b><small>${m.d}</small></button>`).join('');
const pickMode=()=>document.querySelectorAll('#modes .btn').forEach(b=>b.classList.toggle('sel',b.dataset.m===sel));
$('modes').onclick=e=> {
  const b=e.target.closest('[data-m]');
  if(b) {
    sel=b.dataset.m;
    pickMode();
    sfx.tap()
  }
};
pickMode();
$('play').onclick=()=> {
  sfx.tap();
  start(sel)
};
$('again').onclick=()=> {
  sfx.tap();
  start(G.mode)
};
$('rHome').onclick=()=> {
  sfx.tap();
  show('home')
};
$('pauseBtn').onclick=()=>pause(true);
$('resume').onclick=()=>pause(false);
$('restart').onclick=()=>start(G.mode);
$('pHome').onclick=()=> {
  cancelAnimationFrame(raf);
  G.over=true;
  $('pause').classList.remove('on');
  show('home')
};
const ov=(id,on)=>$(id).classList.toggle('on',on);
$('hHelp').onclick=$('pHelp').onclick=()=> {
  sfx.tap();
  ov('help',true)
};
$('helpOk').onclick=()=> {
  ov('help',false);
  S.seenHelp=true;
  save()
};
$('hSet').onclick=$('pSet').onclick=()=> {
  sfx.tap();
  $('oSnd').checked=!!S.opt.snd;
  $('oMus').checked=!!S.opt.mus;
  $('oVol').value=S.opt.vol;
  $('oHap').checked=!!S.opt.hap;
  ov('set',true)
};
$('setOk').onclick=()=>ov('set',false);
$('oSnd').onchange=e=> {
  S.opt.snd=+e.target.checked;
  save()
};
$('oMus').onchange=e=> {
  S.opt.mus=+e.target.checked;
  save();
  music()
};
$('oVol').oninput=e=> {
  S.opt.vol=+e.target.value;
  if(MG)MG.gain.value=S.opt.vol;
  save()
};
$('oHap').onchange=e=> {
  S.opt.hap=+e.target.checked;
  save()
};
$('oReset').onclick=()=> {
  if(confirm('Erase all scores, streaks, XP and settings on this device?')) {
    S=structuredClone(DEF);
    save();
    home();
    ov('set',false)
  }
};
$('share').onclick=async()=> {
  const g=G,
  n=g.ans.length,
  t=`🌸 THE SWIPE\n${MODES[g.mode].n}${g.mode==='daily'?' '+g.day:''}\nScore: ${g.score.toLocaleString()}\nAccuracy: ${n?Math.round(g.cor/n*100):0}%\nBest combo: ${g.best}×`;
  try {
    if(navigator.share)await navigator.share( {
      text:t
    });
    else {
      await navigator.clipboard.writeText(t);
      $('share').textContent='Copied ✓'
    }
  }
  catch(e) {
    prompt('Copy your result:',t)
  }
};
$('foot').textContent=`${(D.length+SL.length+FK.length).toLocaleString()} words + endless sneaky fakes · plays offline`;
home();
if(!S.seenHelp)ov('help',true);
