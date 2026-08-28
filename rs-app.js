/* RACKSMITH app — transport, scheduling, render loop, preset bank, boot */
'use strict';
window.RS=window.RS||{};RS.mods=RS.mods||{};RS.mods.app='ok';
(function(){
var UI=RS.UI,A=RS.A;
RS.S={ctx:null,powered:false,devices:[],cables:[],playing:false,bpm:124,swing:14,
 tick:0,nextT:0,timer:null,uiQ:[],midiIns:[],focus:null,kbOct:1,hw:null,flipped:false,ccBindings:{},undo:[]};
RS.byId=function(id){return RS.S.devices.find(function(d){return d.id===id;});};
/* one shared undo history for every device's destructive pattern actions
   (COPY/FILL/RND/CLR/kit-or-riff loads) — a single top-bar UNDO steps back
   through whichever device did the most recent one, up to 10 deep. Each
   device calls RS.pushUndo(restoreFn) with a closure that already carries
   its own snapshot; this module doesn't need to know each device's shape. */
RS.pushUndo=function(restoreFn){
  RS.S.undo.push(restoreFn);
  if(RS.S.undo.length>10)RS.S.undo.shift();};
RS.undo=function(){
  if(!RS.S.undo.length){UI.toast('Nothing to undo');return;}
  var fn=RS.S.undo.pop();
  try{fn();}catch(e){UI.toast('Undo error: '+e.message);}};
var warned=new Set();
RS.warn=function(dev){if(warned.has(dev.id))return;
  if(dev.outs.size&&!RS.S.cables.some(function(c){return c.from.dev===dev.id&&c.kind==='audio';})){
    warned.add(dev.id);UI.toast(dev.name+' OUT unpatched (VU dark) — press F, drag a cable from its rear OUT');}};
RS.rebuild=function(){
  RS.S.devices.forEach(function(d){d.outs.forEach(function(n){try{d.jackNodes[n].disconnect();}catch(e){}});});
  RS.S.cables.forEach(function(c){if(c.kind!=='audio'&&c.kind!=='mod')return;
    var f=RS.byId(c.from.dev),t=RS.byId(c.to.dev);if(!f||!t)return;
    try{f.jackNodes[c.from.jack].connect(t.jackNodes[c.to.jack]);}catch(e){}});
  var labels={};
  RS.S.cables.forEach(function(c){var s=RS.byId(c.from.dev),d=RS.byId(c.to.dev);if(!s||!d)return;
    var jt=d.jackEls[c.to.jack];
    if(jt)labels[c.to.dev+':'+c.to.jack]=s.name;});
  RS.S.devices.forEach(function(d){
    if(d.repatch)try{d.repatch();}catch(e){}   /* devices with front-panel normalling */
    if(d.updateLabels)d.updateLabels();
    for(var n in d.jackEls){var j=d.jackEls[n];
      var txt=j.dataset.cap;
      if(!d.outs.has(n)&&labels[d.id+':'+n])txt+=' \u2190 '+labels[d.id+':'+n].toUpperCase();
      j.querySelector('.jl').textContent=txt;}});};
RS.cvTo=function(dev,jack){var c=RS.S.cables.find(function(c){return c.kind==='cv'&&c.from.dev===dev.id&&c.from.jack===jack;});
  return c?RS.byId(c.to.dev):null;};
/* ---- transport ---- */
var OFFS=[0,3,5,7,10,12,15,19];
RS.play=function(){
  if(RS.S.playing||!RS.S.ctx)return;
  RS.S.playing=true;RS.S.tick=0;
  RS.S.nextT=RS.S.ctx.currentTime+.06;
  RS.S.devices.forEach(function(d){if(d.type==='rd'){d._st=0;d._nt=RS.S.nextT;}});
  RS.S.timer=setInterval(sched,25);
  updUI();
  if(!RS.S.cables.some(function(c){return c.kind==='audio';}))
    UI.toast('Transport running — rack is unpatched (check device VUs)');};
RS.stop=function(){if(!RS.S.playing)return;
  RS.S.playing=false;clearInterval(RS.S.timer);RS.S.uiQ=[];
  updUI();};
function updUI(){if(!RS.S.hw)return;
  RS.S.hw.btnPlay.classList.toggle('on',RS.S.playing);
  RS.S.hw.lcd();}
function sched(){
  if(!RS.S.ctx||!RS.S.playing)return;
  var ct=RS.S.ctx.currentTime;
  if(RS.S.nextT<ct-.5)RS.S.nextT=ct+.02;
  var n=0;
  while(RS.S.nextT<ct+.12&&n++<16){
    try{step16(RS.S.tick,RS.S.nextT);}catch(e){}
    RS.S.tick++;
    RS.S.nextT+=60/RS.S.bpm/4;}
  var barLen=60/RS.S.bpm*4;
  RS.S.devices.forEach(function(d){
    if(d.type!=='rd'||!d.p.run)return;
    try{
      var res=d.p.res||16;
      var dur=barLen/res;
      if(d._nt<ct-.5)d._nt=ct+.02;
      var g2=0;
      while(d._nt<ct+.15&&g2++<24){
        var pos=d._st%(d.p.bars*res);
        var t=d._nt+((pos%2===1)?(d.p.rswing||0)/100*dur:0);
        for(var i=0;i<d.drum.length;i++){var v=d.getStep(pos,i);
          if(v&&!(d.muted&&d.muted[i]))d.hit(i,t,v===2?1:.72);}
        (function(p2){RS.S.uiQ.push({t:d._nt,fn:function(){d.setNow(p2);}});})(pos);
        d._st++;d._nt+=dur;}
    }catch(e){}});
  if(!Number.isFinite(RS.S.nextT))RS.S.nextT=ct+.06;}
function step16(k,t0){
  var sd=60/RS.S.bpm/4;
  RS.S.devices.forEach(function(d){
    try{
      if(d.type==='mx'&&d.p.run){
        var len=(d.p.bars||1)*16,pos=k%len;
        RS.S.uiQ.push({t:t0,fn:function(){d.setNow(pos);}});
        var col=d.cols[pos];
        if(col&&col.row!=null){
          var hasCV=RS.S.cables.some(function(c2){return c2.kind==='cv'&&c2.from.dev===d.id&&c2.from.jack==='cvout';});
          var base=Math.round(d.p.base)||33;
          var note=null;
          if(hasCV)note=base+Math.round(UI.clamp(col.val,0,1)*24);
          else{var off=OFFS[col.row];if(off!==undefined)note=base+off;}
          if(note!=null&&Number.isFinite(note)){
            var vel=UI.clamp(.45+UI.clamp(col.val,0,1)*.55,.05,1);
            var tg=[];
            var a=RS.cvTo(d,'cvout'),b=RS.cvTo(d,'gateout');
            if(a&&a.noteOn&&tg.indexOf(a)<0)tg.push(a);
            if(b&&b.noteOn&&tg.indexOf(b)<0)tg.push(b);
            tg.forEach(function(x){
              try{x.noteOn(note,vel,t0);}catch(e){}
              setTimeout(function(){try{x.noteOff(note);}catch(e){}},Math.max(0,(t0+sd*.92-RS.S.ctx.currentTime)*1000));});}
        }
      }
      /* fm (NRD-2) runs its own arp clock off dev.tick now, independent of
         the transport — see rs-devices.js — so it's excluded here to avoid
         double-firing whenever the rack happens to be playing */
      if(d.type==='sub'&&d.p.arp!=='OFF'&&d.held&&d.held.size){
        var rate=d.p.arpRate||2;
        /* a phase accumulator rather than k%rate, so non-integer rates
           (triplet 1/3, quintuplet 1/5, sub-tick 1/32) land on time too —
           plain modulo only ever hits exactly on integer divisors */
        if(d._arpPh===undefined)d._arpPh=0;
        d._arpPh+=1;
        if(d._arpPh>=rate-1e-9){
          d._arpPh-=rate;
          var hs=Array.from(d.held).sort(function(a,b){return a-b;});
          if(d._dirty||d._seq.length!==hs.length*(d.p.arpOct||1)){
            d._seq=[];
            for(var o=0;o<(d.p.arpOct||1);o++)hs.forEach(function(nn){d._seq.push(nn+12*o);});
            d._ai=0;d._adir=1;d._dirty=false;}
          if(d._seq.length){
            var n2;
            if(d.p.arp==='RND')n2=d._seq[Math.floor(Math.random()*d._seq.length)];
            else if(d.p.arp==='DOWN')n2=d._seq[d._seq.length-1-(d._ai%d._seq.length)];
            else if(d.p.arp==='UD'){
              n2=d._seq[Math.min(d._ai,d._seq.length-1)];
              d._ai+=d._adir;
              if(d._ai>=d._seq.length){d._ai=Math.max(0,d._seq.length-2);d._adir=-1;}
              if(d._ai<0){d._ai=Math.min(1,d._seq.length-1);d._adir=1;}}
            else n2=d._seq[d._ai%d._seq.length];
            if(d.p.arp!=='UD'&&d.p.arp!=='RND')d._ai=(d._ai+1)%Math.max(d._seq.length,1);
            if(Number.isFinite(n2)){
              var gate=sd*rate*UI.clamp(d.p.arpGate||.8,.1,1);
              d._arp=true;
              try{d.noteOn(n2,.85,t0);}catch(e){}
              setTimeout(function(){try{d._arp=true;d.noteOff(n2);d._arp=false;}catch(e){}},Math.max(0,(t0+gate-RS.S.ctx.currentTime)*1000));
              d._arp=false;}
          }
        }
      }
    }catch(e){}
  });
  if(RS.S.hw)RS.S.uiQ.push({t:t0,fn:function(){RS.S.hw.lcd();}});}
/* ---- render loop (devices own their per-frame visuals via tick) ---- */
var nanStreak=0,healAt=-10,hotStreak=0,surgeAt=-10;
function raf(){
  requestAnimationFrame(raf);
  if(!(RS.S.ctx&&RS.S.powered))return;
  var now=RS.S.ctx.currentTime;
  if(RS.S.uiQ.length>600)RS.S.uiQ.splice(0,RS.S.uiQ.length-300);
  var qg=0;
  while(RS.S.uiQ.length&&RS.S.uiQ[0].t<=now+.005&&qg++<128){try{RS.S.uiQ.shift().fn();}catch(e){}}
  try{
    A.TMP.fill(0);
    A.anaL.getFloatTimeDomainData(A.TMP);
    var bad=false;
    for(var i=0;i<16;i++){var v=A.TMP[i];if(v!==v||v===Infinity||v===-Infinity){bad=true;break;}}
    if(bad){nanStreak++;
      if(nanStreak>=30&&now-healAt>3){healAt=now;nanStreak=0;A.heal();}}
    else nanStreak=0;
    /* surge guard: a finite but continuously-at-the-ceiling signal (feedback
       riding the limiter) won't ever look "bad" above — it needs its own,
       slower-to-trip watchdog so one loud transient doesn't false-trigger it */
    var hot=Math.max(A.dbOf(A.anaL),A.dbOf(A.anaR))>-.5;
    if(hot){hotStreak++;
      if(hotStreak>=90&&!A.surgeActive&&now-surgeAt>2.5){surgeAt=now;hotStreak=0;A.duckSurge();}}
    else hotStreak=Math.max(0,hotStreak-2);
  }catch(e){}
  RS.S.devices.forEach(function(d){
    try{if(d.tick)d.tick();}catch(e){}
    try{
      if(d.vuAna&&d.vuSegs){
        var db2=A.dbOf(d.vuAna);
        var seg=db2>-6?4:db2>-12?3:db2>-20?2:db2>-30?1:0;
        d.vuSegs.forEach(function(s,i){s.classList.toggle('on',i<seg);});}
    }catch(e){}});}
/* ---- keyboard ---- */
var KEYMAP={KeyA:0,KeyW:1,KeyS:2,KeyE:3,KeyD:4,KeyF:5,KeyT:6,KeyG:7,
  KeyY:8,KeyH:9,KeyU:10,KeyJ:11,KeyK:12,KeyO:13,KeyL:14,KeyP:15,Semicolon:16};
var heldKeys={};
/* typing in a field must not play the rack — the letter keys are a keyboard */
function typing(e){
  var t=e.target||document.activeElement;
  if(!t)return false;
  var tag=(t.tagName||'').toUpperCase();
  return tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||t.isContentEditable===true;}
window.addEventListener('keydown',function(e){
  if(e.metaKey||e.ctrlKey||e.altKey||e.repeat)return;
  if(typing(e)&&e.code!=='Escape')return;
  if(e.code==='Escape'){RS.MIDI.clearLearn();UI.closeMenu();
    Array.prototype.forEach.call(document.querySelectorAll('.modal'),function(m){m.classList.remove('open');});return;}
  if(e.code==='Space'){e.preventDefault();
    var ae=document.activeElement;if(ae&&ae.blur)ae.blur();
    if(RS.S.playing)RS.stop();else RS.play();return;}
  if(!RS.S.powered)return;
  if(e.code==='KeyF'){UI.$('#bFlip').click();return;}
  if(e.code==='KeyZ'||e.code==='KeyX'){
    /* base=48+12*kbOct feeds a 4-octave (48-semitone) keybed, so kbOct must
       stay within [-2,2] to keep base+48 <=120 and base>=0 — -2 reaches down
       to C1 for bass patches without the top keys landing on dead notes */
    RS.S.kbOct=UI.clamp(RS.S.kbOct+(e.code==='KeyZ'?-1:1),-2,2);
    RS.S.devices.forEach(function(d){if(d.kbWrap)d.kbWrap.rebuild();});
    UI.toast('Keyboard octave: '+RS.S.kbOct);return;}
  if(KEYMAP[e.code]===undefined)return;
  var tgt=RS.S.focus&&RS.S.focus.noteOn?RS.S.focus:RS.S.devices.find(function(d){return d.noteOn;});
  if(!tgt)return;
  var note=48+12*RS.S.kbOct+KEYMAP[e.code];
  if(heldKeys[e.code]!==undefined)return;
  heldKeys[e.code]=note;tgt.noteOn(note,.9);});
window.addEventListener('keyup',function(e){
  if(heldKeys[e.code]===undefined)return;
  /* release even if focus moved into a field mid-press, so nothing hangs */
  var tgt=RS.S.focus&&RS.S.focus.noteOn?RS.S.focus:RS.S.devices.find(function(d){return d.noteOn;});
  if(tgt)tgt.noteOff(heldKeys[e.code]);
  delete heldKeys[e.code];});
/* ---- preset bank ---- */
function getStore(){try{return JSON.parse(localStorage.getItem('racksmith_bank')||'{}');}catch(e){return {};}}
function setStore(o){try{localStorage.setItem('racksmith_bank',JSON.stringify(o));}catch(e){UI.toast('Storage failed');}}
function snapAll(){
  return {bpm:RS.S.bpm,swing:RS.S.swing,
    devs:RS.S.devices.map(function(d){return{t:d.type,
      p:JSON.parse(JSON.stringify(d.p)),
      pat:d.pat?JSON.parse(JSON.stringify(d.pat)):null,
      cols:d.cols?JSON.parse(JSON.stringify(d.cols)):null};}),
    cab:RS.S.cables.map(function(c){return{fi:RS.S.devices.findIndex(function(x){return x.id===c.from.dev;}),fj:c.from.jack,
      ti:RS.S.devices.findIndex(function(x){return x.id===c.to.dev;}),tj:c.to.jack,k:c.kind};})};}
function loadAll(sn){
  RS.stop();
  Array.from(RS.S.devices).forEach(function(d){if(d.el)d.el.remove();});
  RS.S.devices.length=0;RS.S.cables=[];RS.S.hw=null;RS.S.focus=null;warned.clear();
  (sn.devs||[]).forEach(function(sd){
    var d=UI.mount(sd.t);
    if(!d)return;
    if(sd.pat)d.pat=sd.pat;
    if(sd.cols)d.cols=sd.cols;
    for(var k in sd.p){if(d.P[k]){try{d.P[k].set(sd.p[k]);}catch(e){}}}
    if(d.renderSteps){try{d.renderSteps();}catch(e){}}
    if(d.refresh){try{d.refresh();}catch(e){}}});
  RS.S.hw=RS.S.devices.find(function(d){return d.type==='hw';});
  RS.S.cables=(sn.cab||[]).filter(function(c){return c.fi>=0&&c.ti>=0&&RS.S.devices[c.fi]&&RS.S.devices[c.ti];})
    .map(function(c){return{from:{dev:RS.S.devices[c.fi].id,jack:c.fj},to:{dev:RS.S.devices[c.ti].id,jack:c.tj},kind:c.k};});
  RS.S.bpm=UI.clamp(sn.bpm||124,60,200);
  RS.S.swing=UI.clamp(sn.swing||14,0,60);
  RS.rebuild();UI.drawCables();
  if(RS.S.hw){try{RS.S.hw.P.bpm.set(RS.S.bpm,false);RS.S.hw.P.swing.set(RS.S.swing,false);RS.S.hw.lcd();}catch(e){}}
  UI.toast('Preset loaded');}
function renderBank(){
  var list=UI.$('#bankList');list.innerHTML='';
  var store=getStore();
  var names=Object.keys(store);
  if(!names.length){list.appendChild(UI.el('p',null,'No saved presets yet.'));return;}
  names.forEach(function(nm){
    var r=UI.el('div','mrow','<label><b style="font-family:Share Tech Mono,monospace">'+nm+'</b></label>');
    var lb=UI.el('button','tbtn','LOAD');lb.style.height='24px';
    lb.onclick=function(){loadAll(store[nm]);UI.$('#bankModal').classList.remove('open');};
    var xb=UI.el('button','mclose','&times;');
    xb.onclick=function(){var st=getStore();delete st[nm];setStore(st);renderBank();};
    r.append(lb,xb);list.appendChild(r);});}
/* ---- topbar / modals ---- */
RS.openModal=function(sel){UI.$(sel).classList.add('open');};
Array.prototype.forEach.call(document.querySelectorAll('.modal'),function(m){
  m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('open');});
  Array.prototype.forEach.call(m.querySelectorAll('[data-close]'),function(b){b.onclick=function(){m.classList.remove('open');};});});
function buildAddMenu(){
  var m=UI.$('#addmenu');m.innerHTML='';
  Object.keys(RS.DEVS).forEach(function(k){if(k==='hw')return;
    var d=RS.DEVS[k];
    var r=UI.el('div','addrow','<div class="dot" style="background:'+d.accent+'"></div><div><b>'+d.name+'</b><small>'+d.sub+'</small></div>');
    var b=UI.el('button',null,'ADD');
    b.onclick=function(){var nd=UI.mount(k);if(nd){RS.rebuild();RS.MIDI.panel();}
      m.classList.remove('open');};
    r.appendChild(b);m.appendChild(r);});}
document.addEventListener('click',function(e){
  var m=UI.$('#addmenu');
  if(m.classList.contains('open')&&!m.contains(e.target)&&!e.target.closest('#bAdd'))
    m.classList.remove('open');});
UI.$('#bHelp').onclick=function(){RS.openModal('#helpModal');};
UI.$('#bFlip').onclick=function(){RS.S.flipped=!RS.S.flipped;
  RS.S.devices.forEach(function(d){d.flipped=RS.S.flipped;d.el.classList.toggle('flipped',RS.S.flipped);});
  UI.drawCables();};
UI.$('#bMidi').onclick=function(){RS.MIDI.panel();RS.openModal('#midiModal');};
UI.$('#bDefault').onclick=function(){
  /* every widget records the default it was built with, so this works for any
     device in the rack without each one having to publish a reset routine */
  var n=0;
  RS.S.devices.forEach(function(d){
    for(var k in d.P){var P=d.P[k];
      if(P&&P._def!==undefined){try{P.set(P._def);n++;}catch(e){}}}
    if(d.refreshBands)try{d.refreshBands();}catch(e){}});
  RS.rebuild();UI.drawCables();
  UI.toast('Defaults restored — '+n+' controls back to their factory positions',4000);};
UI.$('#bRevert').onclick=function(){
  var n=RS.S.cables.length;
  if(!n){UI.toast('Nothing patched — every module is already on its normal');return;}
  RS.S.cables=[];
  RS.rebuild();UI.drawCables();
  UI.toast('Reverted — '+n+' cable'+(n===1?'':'s')+' pulled. Every module is back on its '+
    'normals and the rack is unpatched; AUTO-PATCH rewires the rig.',5000);};
UI.$('#bUndo').onclick=function(){RS.undo();};
UI.$('#bBank').onclick=function(){renderBank();RS.openModal('#bankModal');};
UI.$('#bankSave').onclick=function(){
  var nm=(UI.$('#bankName').value||'').trim();
  if(!nm){UI.toast('Enter a preset name first');return;}
  var st=getStore();
  st[nm]=snapAll();
  setStore(st);
  UI.$('#bankName').value='';
  renderBank();
  UI.toast('Saved "'+nm+'" — full rack state');};
UI.$('#bAdd').onclick=function(){UI.$('#addmenu').classList.toggle('open');};
UI.$('#bDemo').onclick=function(){
  if(!RS.S.powered)return;
  function g(t){return RS.S.devices.find(function(d){return d.type===t;});}
  var hw=g('hw'),sub=g('sub'),fm=g('fm'),rd=g('rd'),mx=g('mx');
  if(!hw){UI.toast('HW-1 console missing');return;}
  RS.S.cables=[];
  function C(a,aj,b,bj,kind){RS.S.cables.push({from:{dev:a.id,jack:aj},to:{dev:b.id,jack:bj},kind:kind||'audio'});}
  if(sub)C(sub,'outa',hw,'ch1');
  if(fm)C(fm,'outa',hw,'ch2');
  if(rd)C(rd,'outa',hw,'ch3');
  if(mx&&sub)C(mx,'gateout',sub,'gatein','cv');
  if(sub&&sub.loadPreset)try{sub.loadPreset(0);}catch(e){}
  RS.rebuild();UI.drawCables();
  if(!RS.S.playing)RS.play();
  UI.toast('Demo rig patched — SGE-7→CH1 · NRD-2→CH2 · RD-8→CH3 · MTRX→SGE-7');};
window.addEventListener('resize',function(){UI.drawCables();});
/* ---- boot ---- */
function buildDefaultRack(){
  RS.S.hw=UI.mount('hw');
  var sub=UI.mount('sub');
  UI.mount('fm');
  UI.mount('rd');
  UI.mount('mx');
  RS.S.cables=[];
  RS.rebuild();UI.drawCables();
  if(sub){RS.S.focus=sub;
    RS.S.devices.forEach(function(d){if(d.mchip)d.mchip.classList.toggle('on',d===sub);});}
  var names=RS.S.devices.map(function(d){return d.name;});
  UI.toast('Boot: '+RS.S.devices.length+'/5 mounted — '+names.join(' · '),4500);
  if(!RS.S.hw)UI.toast('HW-1 CONSOLE FAILED TO MOUNT','#ff6a55');}
RS.boot=function(ctx){
  RS.S.ctx=ctx;
  RS.S.powered=true;
  ['bAdd','bDemo','bBank','bFlip','bMidi','bRevert','bUndo','bDefault'].forEach(function(id){UI.$('#'+id).disabled=false;});
  try{A.init(ctx);}catch(e){UI.toast('Audio init failed: '+e.message,8000);return;}
  try{buildAddMenu();}catch(e){UI.toast('Menu build: '+e.message);}
  try{buildDefaultRack();}catch(e){UI.toast('Rack build: '+e.message,8000);}
  try{A.applyMFX(RS.S.hw.p);}catch(e){}
  try{RS.MIDI.panel();}catch(e){}
  try{RS.MIDI.init();}catch(e){}
  requestAnimationFrame(raf);
  setTimeout(function(){UI.toast('Powered — UNPATCHED. AUTO-PATCH wires the demo rig, F flips to the rear');},4600);};
})();