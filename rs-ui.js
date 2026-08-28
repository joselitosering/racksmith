/* RACKSMITH UI framework — widgets, panel renderer, mounting, patch bay */
'use strict';
window.RS=window.RS||{};RS.mods=RS.mods||{};RS.mods.ui='ok';
RS.UI=(function(){
var UI={};
UI.$=function(s){return document.querySelector(s);};
UI.el=function(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
UI.clamp=function(v,a,b){return v<a?a:v>b?b:v;};
UI.F2=function(n){return 440*Math.pow(2,(n-69)/12);};
var NN=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
UI.noteName=function(v){return NN[v%12]+(Math.floor(v/12)-1);};
UI.toast=function(msg,ms){var t=UI.el('div','toast',msg);UI.$('#toasts').appendChild(t);
  setTimeout(function(){t.style.transition='opacity .4s';t.style.opacity=0;setTimeout(function(){t.remove();},420);},ms||2600);};
UI.fmt={
  hz:function(v){return v>=1000?(v/1000).toFixed(1)+'k':String(Math.round(v));},
  ms:function(v){return v>=1?v.toFixed(2)+'s':String(Math.round(v*1000));},
  pc:function(v){return Math.round(v*100)+'%';},
  semi:function(v){return(v>0?'+':'')+Math.round(v);},
  db:function(v){return(v>0?'+':'')+Math.round(v)+'dB';},
  pan:function(v){return Math.abs(v)<.05?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100);},
  x:function(v){return 'x'+v.toFixed(2);},
  ct:function(v){return(v>0?'+':'')+Math.round(v)+'ct';},
  ratio:function(v){return v.toFixed(1)+':1';},
  one:function(v){return v.toFixed(1);},
  two:function(v){return v.toFixed(2);},
  note:UI.noteName,
  bpm:function(v){return String(Math.round(v));}
};
function arc(a0,a1){var r=21,P=function(a){return[24+r*Math.sin(a*Math.PI/180),24-r*Math.cos(a*Math.PI/180)];};
  var A=P(a0),B=P(a1),lg=(a1-a0)>180?1:0;
  return 'M '+A[0].toFixed(2)+' '+A[1].toFixed(2)+' A '+r+' '+r+' 0 '+lg+' 1 '+B[0].toFixed(2)+' '+B[1].toFixed(2);}
/* ---- widgets ---- */
UI.kn=function(dev,c){
  var id=c.id,lab=c.label,min=c.min===undefined?0:c.min,max=c.max===undefined?1:c.max,log=!!c.log;
  dev.p[id]=c.def;
  function norm(v){return log?Math.log(v/min)/Math.log(max/min):(v-min)/(max-min);}
  function den(n){return log?min*Math.pow(max/min,n):min+n*(max-min);}
  var w=UI.el('div','kn');
  var sz=c.size||36;
  w.innerHTML='<div class="dial" style="--ks:'+sz+'px">'+
   '<svg viewBox="0 0 48 48"><path class="trk" d="'+arc(-135,135)+'"/><path class="val" d=""/>'+
   '<line class="ptr" x1="24" y1="24" x2="24" y2="8"/></svg></div>'+
   '<div class="kl">'+lab+'</div><div class="kv"></div>';
  var val=w.querySelector('.val'),ptr=w.querySelector('.ptr'),kv=w.querySelector('.kv');
  var F=typeof c.fmt==='function'?c.fmt:(c.fmt?UI.fmt[c.fmt]:null);
  function rf(){var n=UI.clamp(norm(dev.p[id]),0,1);
    val.setAttribute('d',n<=.003?'':arc(-135,-135+270*n));val.setAttribute('stroke',dev.accent);
    var a=(-135+270*n)*Math.PI/180;
    ptr.setAttribute('x2',(24+15*Math.sin(a)).toFixed(1));ptr.setAttribute('y2',(24-15*Math.cos(a)).toFixed(1));
    kv.textContent=F?F(dev.p[id]):(+dev.p[id]).toFixed(2);}
  function set(v,fire){if(fire===undefined)fire=true;
    if(!Number.isFinite(v))return;
    v=UI.clamp(v,min,max);dev.p[id]=v;
    if(fire&&c.ap){try{c.ap(v,dev);}catch(e){}}
    rf();}
  var sy=0,sn=0,dr=false;
  w.addEventListener('pointerdown',function(e){dr=true;sy=e.clientY;sn=norm(dev.p[id]);w.setPointerCapture(e.pointerId);e.preventDefault();});
  w.addEventListener('pointermove',function(e){if(dr)set(den(UI.clamp(sn+(sy-e.clientY)/150*(e.shiftKey?.18:1),0,1)));});
  w.addEventListener('pointerup',function(){dr=false;});
  w.addEventListener('dblclick',function(){set(c.def);});
  w.addEventListener('wheel',function(e){e.preventDefault();set(den(UI.clamp(norm(dev.p[id])+(e.deltaY<0?.03:-.03),0,1)));},{passive:false});
  w.addEventListener('contextmenu',function(e){e.preventDefault();if(RS.MIDI&&RS.MIDI.learn)RS.MIDI.learn(dev,id,lab,w);});
  dev.P[id]={set:set,_def:c.def,_r:{min:min,max:max,log:log,label:lab}};rf();return w;};
UI.st=function(dev,c){
  dev.p[c.id]=c.def;
  var w=UI.el('div','stpr');
  if(c.label)w.appendChild(UI.el('div','kl2',c.label));
  var row=UI.el('div','stprow');
  c.opts.forEach(function(op){var b=UI.el('button','stpb'+(op.wide||c.wide?' wide':''),op.icon?op.icon:'<i></i>'+op.t);
    b.onclick=function(){set(op.v);};row.appendChild(b);});
  w.appendChild(row);
  function rf(){Array.prototype.forEach.call(row.children,function(b,i){
    b.classList.toggle('on',String(c.opts[i].v)===String(dev.p[c.id]));});}
  function set(v,fire){if(fire===undefined)fire=true;
    dev.p[c.id]=v;
    if(fire&&c.ap){try{c.ap(v,dev);}catch(e){}}
    rf();}
  dev.P[c.id]={set:set,_def:c.def};rf();return w;};
UI.sel=function(dev,c){
  dev.p[c.id]=c.def;
  var w=UI.el('div','stpr');
  if(c.label)w.appendChild(UI.el('div','kl2',c.label));
  var s=UI.el('select','selbox');
  c.opts.forEach(function(op){var o=UI.el('option',null,op.t);o.value=String(op.v);s.appendChild(o);});
  s.value=String(c.def);
  function apply(v){dev.p[c.id]=v;if(c.ap){try{c.ap(v,dev);}catch(e){}}}
  s.onchange=function(){
    var op=null;
    for(var i=0;i<c.opts.length;i++)if(String(c.opts[i].v)===s.value){op=c.opts[i];break;}
    apply(op?op.v:s.value);};
  w.appendChild(s);
  dev.P[c.id]={set:function(v){apply(v);s.value=String(v);},_def:c.def};
  return w;};
UI.bt=function(dev,c){
  var b=UI.el('button','stpb'+(c.wide?' wide':''),c.label);
  b.onclick=function(){try{c.fn(dev);}catch(e){UI.toast(c.label+' error: '+e.message);}};
  var w=UI.el('div','stpr');
  if(c.group)w.appendChild(UI.el('div','kl2',c.group));
  var row=UI.el('div','stprow');row.appendChild(b);w.appendChild(row);
  return w;};
UI.fad=function(dev,c){
  dev.p[c.id]=c.def===undefined?.8:c.def;
  var max=c.max===undefined?1.2:c.max;
  var w=UI.el('div','fad');
  var row=UI.el('div','fadrow');
  var tr=UI.el('div','ftrack'),h=UI.el('div','fhandle');tr.appendChild(h);
  row.appendChild(tr);w.appendChild(UI.el('div','kl',c.label));w.appendChild(row);
  function rf(){h.style.bottom='calc('+(dev.p[c.id]/max*100).toFixed(1)+'% - 6.5px)';}
  function set(v,fire){if(fire===undefined)fire=true;
    if(!Number.isFinite(v))return;
    v=UI.clamp(v,0,max);dev.p[c.id]=v;
    if(fire&&c.ap){try{c.ap(v,dev);}catch(e){}}
    rf();}
  var sy=0,sv=0,dr=false;
  tr.addEventListener('pointerdown',function(e){dr=true;sy=e.clientY;sv=dev.p[c.id];tr.setPointerCapture(e.pointerId);e.preventDefault();});
  tr.addEventListener('pointermove',function(e){if(dr)set(sv+(sy-e.clientY)/112*max);});
  tr.addEventListener('pointerup',function(){dr=false;});
  tr.addEventListener('dblclick',function(){set(c.def);});
  tr.addEventListener('contextmenu',function(e){e.preventDefault();if(RS.MIDI&&RS.MIDI.learn)RS.MIDI.learn(dev,c.id,c.label,w);});
  dev.P[c.id]={set:set,_def:(c.def===undefined?.8:c.def),_r:{min:0,max:max,log:false,label:c.label}};rf();return w;};
/* vertical slider — the control a real 500-series / Roland module uses for
   levels, indices and envelope stages */
UI.vs=function(dev,c){
  var id=c.id,min=c.min===undefined?0:c.min,max=c.max===undefined?1:c.max,log=!!c.log;
  dev.p[id]=c.def;
  function norm(v){return log?Math.log(v/min)/Math.log(max/min):(v-min)/(max-min);}
  function den(n){return log?min*Math.pow(max/min,n):min+n*(max-min);}
  var w=UI.el('div','vsl');
  w.innerHTML='<div class="vl">'+c.label+'</div>'+
    '<div class="vtrack"><div class="vfill"></div><div class="vcap"></div></div>'+
    '<div class="vv"></div>';
  var tr=w.querySelector('.vtrack'),cap=w.querySelector('.vcap'),
      fill=w.querySelector('.vfill'),vv=w.querySelector('.vv');
  var F=typeof c.fmt==='function'?c.fmt:(c.fmt?UI.fmt[c.fmt]:null);
  function rf(){var n=UI.clamp(norm(dev.p[id]),0,1);
    cap.style.bottom='calc('+(n*100).toFixed(1)+'% - 5px)';
    fill.style.height=(n*100).toFixed(1)+'%';
    vv.textContent=F?F(dev.p[id]):(+dev.p[id]).toFixed(2);}
  function set(v,fire){if(fire===undefined)fire=true;
    if(!Number.isFinite(v))return;
    v=UI.clamp(v,min,max);dev.p[id]=v;
    if(fire&&c.ap){try{c.ap(v,dev);}catch(e){}}
    rf();}
  var sy=0,sn=0,dr=false,H=c.h||66;
  tr.addEventListener('pointerdown',function(e){dr=true;sy=e.clientY;sn=norm(dev.p[id]);
    tr.setPointerCapture(e.pointerId);e.preventDefault();});
  tr.addEventListener('pointermove',function(e){if(dr)set(den(UI.clamp(sn+(sy-e.clientY)/H*(e.shiftKey?.2:1),0,1)));});
  tr.addEventListener('pointerup',function(){dr=false;});
  tr.addEventListener('dblclick',function(){set(c.def);});
  tr.addEventListener('wheel',function(e){e.preventDefault();
    set(den(UI.clamp(norm(dev.p[id])+(e.deltaY<0?.03:-.03),0,1)));},{passive:false});
  tr.addEventListener('contextmenu',function(e){e.preventDefault();
    if(RS.MIDI&&RS.MIDI.learn)RS.MIDI.learn(dev,id,c.label,w);});
  dev.P[id]={set:set,_def:c.def,_r:{min:min,max:max,log:log,label:c.label}};rf();return w;};
UI.eqSlider=function(dev,i){
  var EQF=RS.A.EQF;
  var lab=EQF[i]>=1000?(EQF[i]/1000)+'k':String(EQF[i]);
  var w=UI.el('div','eqcol');
  w.innerHTML='<div class="eqtrack"><div class="eqcap"></div></div><div class="eqlab">'+lab+'</div>';
  var tr=w.querySelector('.eqtrack'),cap=w.querySelector('.eqcap');
  dev.p['eq'+i]=0;
  function rf(){cap.style.bottom='calc('+(50+UI.clamp(dev.p['eq'+i],-12,12)/12*44)+'% - 4.5px)';}
  function set(v,fire){if(fire===undefined)fire=true;
    if(!Number.isFinite(v))return;
    v=UI.clamp(Math.round(v*10)/10,-12,12);dev.p['eq'+i]=v;
    if(fire&&RS.A.eq[i])RS.A.eq[i].gain.setTargetAtTime(v,RS.A.ctx.currentTime,.02);
    rf();}
  var sy=0,sv=0,dr=false;
  tr.addEventListener('pointerdown',function(e){dr=true;sy=e.clientY;sv=dev.p['eq'+i];tr.setPointerCapture(e.pointerId);e.preventDefault();});
  tr.addEventListener('pointermove',function(e){if(dr)set(sv+(sy-e.clientY)/56*12);});
  tr.addEventListener('pointerup',function(){dr=false;});
  tr.addEventListener('dblclick',function(){set(0);});
  dev.P['eq'+i]={set:set,_def:0,_r:{min:-12,max:12,log:false,label:lab+' EQ'}};rf();return w;};
/* generic vertical band slider — same body as eqSlider but driven through
   dev.P[id], so the console screen can show master GEQ or a channel's bands */
UI.bandSlider=function(dev,c){
  var w=UI.el('div','eqcol');
  w.innerHTML='<div class="eqtrack"><div class="eqcap"></div></div><div class="eqlab">'+c.label+'</div>';
  var tr=w.querySelector('.eqtrack'),cap=w.querySelector('.eqcap');
  var min=c.min===undefined?-12:c.min,max=c.max===undefined?12:c.max,log=!!c.log;
  function norm(v){return log?Math.log(v/min)/Math.log(max/min):(v-min)/(max-min);}
  function den(n){return log?min*Math.pow(max/min,n):min+n*(max-min);}
  function rf(){cap.style.bottom='calc('+(UI.clamp(norm(dev.p[c.id]),0,1)*88+6)+'% - 4.5px)';}
  function set(v){if(!Number.isFinite(v))return;
    if(dev.P[c.id])dev.P[c.id].set(UI.clamp(v,min,max));rf();}
  var sy=0,sv=0,dr=false;
  tr.addEventListener('pointerdown',function(e){dr=true;sy=e.clientY;sv=norm(dev.p[c.id]);tr.setPointerCapture(e.pointerId);e.preventDefault();});
  tr.addEventListener('pointermove',function(e){if(dr)set(den(UI.clamp(sv+(sy-e.clientY)/56,0,1)));});
  tr.addEventListener('pointerup',function(){dr=false;});
  tr.addEventListener('dblclick',function(){set(c.def===undefined?0:c.def);});
  tr.addEventListener('contextmenu',function(e){e.preventDefault();if(RS.MIDI&&RS.MIDI.learn)RS.MIDI.learn(dev,c.id,c.label,w);});
  w.refresh=rf;rf();return w;};
var SEG_DB=[-42,-32,-24,-18,-13,-9,-6,-3,-.2];
UI.meter=function(){var m=UI.el('div','meter'),sg=[],i;
  for(i=0;i<9;i++){var s=UI.el('i');m.appendChild(s);sg.push(s);}
  var last=-1;
  return{el:m,set:function(db){if(!Number.isFinite(db))db=-90;
    var n=db<=SEG_DB[0]?0:SEG_DB.findIndex(function(x){return db<x;});
    var c=n<0?9:n;if(c===last)return;last=c;sg.forEach(function(s,i){s.classList.toggle('on',i<c);});}};};
UI.gr=function(){var m=UI.el('div','grm'),sg=[],i;
  for(i=0;i<8;i++){var s=UI.el('i');m.appendChild(s);sg.push(s);}
  var last=-1;
  return{el:m,set:function(gr){if(!Number.isFinite(gr))gr=0;
    var c=UI.clamp(Math.round(-gr/1.5),0,8);if(c===last)return;last=c;
    sg.forEach(function(s,i){s.classList.toggle('on',i<c);});}};};
/* keyboard: C..C spanning `octaves` octaves (default 2). White/black key
   offsets are generated per octave so any span reuses the same C-major
   pattern instead of a hand-written table. */
UI.keys=function(dev,octaves){
  octaves=octaves||2;
  var wrap=UI.el('div','kbwrap'),kb=UI.el('div','kb');
  var WPAT=[0,2,4,5,7,9,11],BPAT=[[0,1],[1,3],[3,6],[4,8],[5,10]];
  var WOFF=[],BM={};
  for(var o=0;o<octaves;o++){
    WPAT.forEach(function(w){WOFF.push(12*o+w);});
    BPAT.forEach(function(p){BM[12*o+p[1]]=o*7+p[0];});
  }
  WOFF.push(12*octaves);
  function build(){kb.innerHTML='';
    /* base picked so middle C (60) lands at the exact midpoint of the
       keyboard's span (12*octaves semitones) rather than 1/4 of the way in,
       at kbOct's own default (1) — each +/- still shifts a full octave
       from there, same as before */
    var base=60-6*octaves+12*(RS.S.kbOct-1);
    WOFF.forEach(function(s){var k=UI.el('div','wk');k.dataset.n=base+s;kb.appendChild(k);});
    /* a black key straddles the seam between two whites: 62% of a white key
       wide, centred on the seam. The old code used one figure for both the
       width and the offset, so every accidental came out half-width and
       sitting left of its seam. */
    var W=100/WOFF.length,B=W*.62;
    for(var s in BM){var k=UI.el('div','bk');k.dataset.n=base+Number(s);
      k.style.width=B.toFixed(3)+'%';
      k.style.left=((BM[s]+1)*W-B/2).toFixed(3)+'%';
      kb.appendChild(k);}}
  function mkWheel(name,spring){
    var wm=UI.el('div','wheel','<i></i><span>'+name+'</span>'),hd=wm.querySelector('i');
    var dr=false;
    wm.addEventListener('pointerdown',function(e){dr=true;wm._sy=e.clientY;wm._sv=wm._v||0;wm.setPointerCapture(e.pointerId);e.preventDefault();});
    wm.addEventListener('pointermove',function(e){if(!dr)return;
      wm._v=UI.clamp(wm._sv+(wm._sy-e.clientY)/90,-1,1);
      var fn=name==='BEND'?dev.bend:dev.mod;if(fn)fn(wm._v);
      hd.style.top='calc('+(50-wm._v*42)+'% - 4px)';});
    wm.addEventListener('pointerup',function(){dr=false;
      if(spring){wm._v=0;if(dev.bend)dev.bend(0);hd.style.top='calc(50% - 4px)';}});
    return wm;}
  var bend=mkWheel('BEND',true),mod=mkWheel('MOD',false);
  /* transpose shifts the whole rack's keyboard octave, same as the Z/X
     shortcut — every device's kbWrap rebuilds together, so this stays in sync
     with any other keyboard on the rack */
  var octWrap=UI.el('div','stpr');octWrap.style.justifyContent='center';
  octWrap.appendChild(UI.el('div','kl2','OCT'));
  var octRow=UI.el('div','stprow');
  var octDn=UI.el('button','stpb','&#8722;'),octUp=UI.el('button','stpb','+');
  function shiftOct(d){
    RS.S.kbOct=UI.clamp(RS.S.kbOct+d,-2,2);
    RS.S.devices.forEach(function(dv){if(dv.kbWrap)dv.kbWrap.rebuild();});
    UI.toast('Keyboard octave: '+RS.S.kbOct);}
  octDn.onclick=function(){shiftOct(-1);};octUp.onclick=function(){shiftOct(1);};
  octRow.append(octDn,octUp);octWrap.appendChild(octRow);
  function press(k,cy){if(!k)return;
    var r=k.getBoundingClientRect(),vel=UI.clamp(.5+((cy-r.top)/r.height)*.5,.35,1),n=Number(k.dataset.n);
    if(kb._n!=null&&kb._n!==n){var old=kb.querySelector('[data-n="'+kb._n+'"]');if(old)old.classList.remove('on');dev.noteOff(kb._n);}
    dev.noteOn(n,vel);kb._n=n;kb._held=k;k.classList.add('on');}
  kb.addEventListener('pointerdown',function(e){kb.setPointerCapture(e.pointerId);press(e.target.closest('[data-n]'),e.clientY);});
  kb.addEventListener('pointermove',function(e){if(!e.buttons||!kb._held)return;
    var jel=document.elementFromPoint(e.clientX,e.clientY);
    var k=jel&&jel.closest?jel.closest('[data-n]'):null;
    if(k&&k!==kb._held)press(k,e.clientY);});
  function lift(){if(kb._held){kb._held.classList.remove('on');kb._held=null;}
    if(kb._n!=null){dev.noteOff(kb._n);kb._n=null;}}
  kb.addEventListener('pointerup',lift);kb.addEventListener('pointercancel',lift);
  build();wrap.append(octWrap,bend,mod,kb);wrap.rebuild=build;return wrap;};
UI.presets=function(dev,presets,start){
  if(start===undefined)start=0;
  var w=UI.el('div','plcd'),nm=UI.el('span','pname');
  nm.title='Click for preset list';
  var pv=UI.el('button','','&#9666;'),nx=UI.el('button','','&#9656;');
  var idx=start;
  function load(i){idx=(i+presets.length)%presets.length;var pr=presets[idx];
    for(var k in pr.p){if(dev.P[k]){try{dev.P[k].set(pr.p[k]);}catch(e){}}}
    nm.textContent=pr.n;}
  pv.onclick=function(){load(idx-1);};nx.onclick=function(){load(idx+1);};
  nm.onclick=function(ev){ev.stopPropagation();UI.menu(nm,presets.map(function(p){return p.n;}),idx,load);};
  w.append(pv,nm,nx);
  nm.textContent=presets[start].n;
  dev.loadPreset=load;dev._presetStart=start;
  return w;};
var curMenu=null;
UI.closeMenu=function(){if(curMenu){curMenu.remove();curMenu=null;}};
UI.menu=function(anchor,items,cur,cb){
  UI.closeMenu();
  var m=UI.el('div','pmenu');
  items.forEach(function(it,i){var e=UI.el('div','pitem'+(i===cur?' cur':''),it);
    e.onclick=function(ev){ev.stopPropagation();cb(i);UI.closeMenu();};
    m.appendChild(e);});
  document.body.appendChild(m);
  var r=anchor.getBoundingClientRect();
  m.style.left=Math.min(r.left,window.innerWidth-180)+'px';
  m.style.top=Math.min(r.bottom+4,window.innerHeight-280)+'px';
  curMenu=m;};
document.addEventListener('click',function(e){if(curMenu&&!curMenu.contains(e.target))UI.closeMenu();});
/* ---- panel renderer ---- */
UI.ctl=function(dev,c){
  if(c.t==='k')return UI.kn(dev,c);
  if(c.t==='v')return UI.vs(dev,c);
  if(c.t==='row'){var rw=UI.el('div','ctlrow');
    (c.items||[]).forEach(function(x){rw.appendChild(UI.ctl(dev,x));});return rw;}
  if(c.t==='st')return UI.st(dev,c);
  if(c.t==='sel')return UI.sel(dev,c);
  if(c.t==='bt')return UI.bt(dev,c);
  if(c.t==='cus'){try{return c.fn(dev);}catch(e){UI.toast('control error: '+e.message);return UI.el('div');}}
  return UI.el('div');};
UI.panels=function(dev,rows){
  var R=UI.el('div','rows');
  rows.forEach(function(p){
    var g=UI.el('div','grp');
    if(p.title)g.appendChild(UI.el('h5',null,p.title));
    if(p.controls){
      var w=UI.el('div','gwrap');
      if(p.nowrap)w.style.flexWrap='nowrap';
      p.controls.forEach(function(c){w.appendChild(UI.ctl(dev,c));});
      g.appendChild(w);}
    if(p.custom){try{var e=p.custom(dev);if(e)g.appendChild(e);}catch(err){UI.toast('panel error: '+err.message);}}
    R.appendChild(g);});
  return R;};
/* ---- device mounting + patch bay ---- */
var UIDI=1;
var dragCable=null;
function jackPos(devId,jack){var d=RS.byId(devId),j=d&&d.jackEls[jack];if(!j)return null;
  var r=j.getBoundingClientRect(),c=UI.$('#content').getBoundingClientRect();
  return{x:r.left+r.width/2-c.left,y:r.top+r.height/2-c.top};}
var CABLE_COL={audio:'#e2a34f',cv:'#5fc9b8',mod:'#8ab4ff'};
/* a jack is reachable only while the face carrying it is showing — and a
   collapsed device hides its front face entirely, so a front-mounted jack
   (SGE-7's modular matrix) goes unreachable too, same as if it were on the
   flipped-away face */
UI.jackVisible=function(dev,jack){
  var onFront=dev.jackFace&&dev.jackFace[jack]==='front';
  if(onFront&&dev.collapsed)return false;
  return onFront?!dev.flipped:!!dev.flipped;};
UI.drawCables=function(){
  var svg=UI.$('#cables'),c=UI.$('#content');if(!svg)return;
  var W=c.offsetWidth,H=c.offsetHeight;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('width',W);svg.setAttribute('height',H);
  var s='';
  function path(p1,p2,col){var dy=Math.max(26,Math.abs(p2.x-p1.x)*.16);
    var d='M'+p1.x.toFixed(1)+' '+p1.y.toFixed(1)+' C '+p1.x.toFixed(1)+' '+(p1.y+dy).toFixed(1)+', '+p2.x.toFixed(1)+' '+(p2.y+dy).toFixed(1)+', '+p2.x.toFixed(1)+' '+p2.y.toFixed(1);
    s+='<path d="'+d+'" stroke="#000" stroke-opacity=".45" stroke-width="7" fill="none" stroke-linecap="round"/>';
    s+='<path d="'+d+'" stroke="'+col+'" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-opacity=".95"/>';
    s+='<circle cx="'+p1.x+'" cy="'+p1.y+'" r="4.5" fill="'+col+'" stroke="#111" stroke-width="1.5"/>';
    s+='<circle cx="'+p2.x+'" cy="'+p2.y+'" r="4.5" fill="'+col+'" stroke="#111" stroke-width="1.5"/>';}
  RS.S.cables.forEach(function(cb){var fd=RS.byId(cb.from.dev),td=RS.byId(cb.to.dev);
    if(!fd||!td||!UI.jackVisible(fd,cb.from.jack)||!UI.jackVisible(td,cb.to.jack))return;
    var p1=jackPos(cb.from.dev,cb.from.jack),p2=jackPos(cb.to.dev,cb.to.jack);
    if(p1&&p2)path(p1,p2,CABLE_COL[cb.kind]||CABLE_COL.audio);});
  if(dragCable&&dragCable.cur){var fd=RS.byId(dragCable.from.dev);
    if(fd&&UI.jackVisible(fd,dragCable.from.jack)){var p1=jackPos(dragCable.from.dev,dragCable.from.jack);
      if(p1)path(p1,dragCable.cur,CABLE_COL[dragCable.kind]||CABLE_COL.audio);}}
  svg.innerHTML=s;};

function jackKey(d,j){return d+''+j;}
function wouldLoopJack(fromDev,fromJack,toDev,toJack){
  /* nodes are (device, jack). cables run out->in; a device's own jackFlow
     declares which outs an input internally feeds. */
  var adj={};
  function edge(a,b){(adj[a]||(adj[a]=[])).push(b);}
  RS.S.cables.forEach(function(c){edge(jackKey(c.from.dev,c.from.jack),jackKey(c.to.dev,c.to.jack));});
  RS.S.devices.forEach(function(d){
    var fl=d.jackFlow;
    if(fl){for(var inj in fl)(fl[inj]||[]).forEach(function(outj){edge(jackKey(d.id,inj),jackKey(d.id,outj));});
      return;}
    /* no declared flow: assume every input reaches every output (old behaviour) */
    for(var n in d.jackEls){if(d.outs.has(n))continue;
      d.outs.forEach(function(o){edge(jackKey(d.id,n),jackKey(d.id,o));});}});
  var target=jackKey(fromDev,fromJack),seen={},st=[jackKey(toDev,toJack)];
  while(st.length){var k=st.pop();
    if(k===target)return true;
    if(seen[k])continue;seen[k]=1;
    (adj[k]||[]).forEach(function(n){st.push(n);});}
  return false;}
/* place a jack anywhere a device wants it — front module panels included */
UI.jack=function(dev,spec,parent){
  return registerJack(dev,spec.id,spec.dir,spec.kind||'audio',spec.node,spec.cap||spec.id,parent,'front');};
function registerJack(dev,name,dir,kind,node,cap,grp,face){
  /* resolve node lazily: null → same-named node the device build already created; function → call it */
  var nd=node;
  if(nd==null&&dev.jackNodes[name]!==undefined)nd=dev.jackNodes[name];
  if(typeof nd==='function'){try{nd=nd(dev);}catch(e){nd=null;}}
  /* a jack whose node resolves to nothing accepts cables that then silently
     fail inside RS.rebuild's try/catch — say so loudly instead */
  if(nd==null||typeof nd.connect!=='function')
    UI.toast(dev.name+': jack "'+name+'" has no audio node — it was registered '+
      'before the node was built','#ff6a55',9000);
  var j=UI.el('div','jk');j.dataset.dev=dev.id;j.dataset.jack=name;j.dataset.dir=dir;j.dataset.kind=kind;j.dataset.cap=cap;
  j.innerHTML='<div class="jl">'+cap+'</div><div class="jring"></div>';
  grp.appendChild(j);dev.jackEls[name]=j;dev.jackNodes[name]=nd;
  dev.jackFace=dev.jackFace||{};dev.jackFace[name]=face||'back';
  if(dir==='out')dev.outs.add(name);
  j.addEventListener('pointerdown',function(e){jackDown(e,dev,name,dir,kind);});
  j.addEventListener('dblclick',function(){
    RS.S.cables=RS.S.cables.filter(function(c){return!((c.from.dev===dev.id&&c.from.jack===name)||(c.to.dev===dev.id&&c.to.jack===name));});
    RS.rebuild();UI.drawCables();UI.toast('Cable unplugged');});}
function jackDown(e,dev,name,dir,kind){
  e.preventDefault();e.stopPropagation();
  if(dir==='out'){dragCable={from:{dev:dev.id,jack:name},kind:kind,loose:false};}
  else{var i=RS.S.cables.findIndex(function(c){return c.to.dev===dev.id&&c.to.jack===name&&c.kind===kind;});
    if(i<0)return;
    var c=RS.S.cables.splice(i,1)[0];
    RS.rebuild();UI.drawCables();
    dragCable={from:c.from,kind:c.kind,loose:true};}
  window.addEventListener('pointermove',cableMove);
  window.addEventListener('pointerup',cableUp);
  cableMove(e);}
function cableMove(e){if(!dragCable)return;
  var c=UI.$('#content').getBoundingClientRect();
  dragCable.cur={x:e.clientX-c.left,y:e.clientY-c.top};UI.drawCables();}
function cableUp(e){
  window.removeEventListener('pointermove',cableMove);
  window.removeEventListener('pointerup',cableUp);
  var dc=dragCable;dragCable=null;if(!dc)return;
  var jel=document.elementFromPoint(e.clientX,e.clientY);
  var j=jel&&jel.closest?jel.closest('.jk'):null;
  if(j){var tdev=RS.byId(j.dataset.dev);
    var ok=tdev&&j.dataset.dir==='in'&&j.dataset.kind===dc.kind&&!(tdev.id===dc.from.dev&&j.dataset.jack===dc.from.jack);
    if(ok&&wouldLoopJack(dc.from.dev,dc.from.jack,tdev.id,j.dataset.jack)){
      UI.toast('Feedback loop blocked');UI.drawCables();return;}
    if(ok){
      RS.S.cables=RS.S.cables.filter(function(c){return!(c.to.dev===tdev.id&&c.to.jack===j.dataset.jack&&c.kind===dc.kind);});
      RS.S.cables.push({from:dc.from,to:{dev:tdev.id,jack:j.dataset.jack},kind:dc.kind});
      RS.rebuild();UI.drawCables();
      UI.toast('Patched: '+RS.byId(dc.from.dev).name+' \u2192 '+tdev.name);return;}
    UI.toast('Invalid patch — OUT must go to a matching IN jack');}
  UI.drawCables();
  if(dc.loose)UI.toast('Cable unplugged');}
function mkEar(side,o){var mid=[];
  if(o.grip)mid.push('<div class="grip" title="Drag to re-order"></div>');
  if(o.flip)mid.push('<button class="flipb" title="Flip">&#8646;</button>');
  if(o.del)mid.push('<button class="delb" title="Remove">&times;</button>');
  return UI.el('div','ear '+side,'<div class="scr"></div><div class="mid">'+mid.join('')+'</div><div class="scr"></div>');}
UI.mount=function(type){
  var spec=RS.DEVS[type];
  if(!spec){UI.toast('Unknown device: '+type);return null;}
  var dev={id:'d'+(UIDI++),type:type,accent:spec.accent,name:spec.name,p:{},P:{},
    jackNodes:{},jackEls:{},outs:new Set(),channel:spec.channel,flipped:RS.S.flipped};
  try{spec.build(dev);}
  catch(e){UI.toast(spec.name+' BUILD FAILED: '+e.message,8000);return null;}
  try{
    if(dev.outs.size){
      if(dev.noteOn){var o1=dev.noteOn;dev.noteOn=function(n,v,w){RS.warn(dev);o1(n,v,w);};}
      if(dev.hit){var o2=dev.hit;dev.hit=function(tr,t,v){RS.warn(dev);o2(tr,t,v);};}}
    var w=UI.el('div','dev dev-'+type+(dev.flipped?' flipped':''));w.dataset.id=dev.id;
    var fr=UI.el('div','face front');
    fr.append(mkEar('l',{grip:1,flip:1}),dev.chassis,mkEar('r',{del:1}));
    /* collapse: shrinks the front face down to just its header row (name +
       status chips) — every device gets this for free since it's wired up
       here in the shared mount path, not per-device. Only the FRONT face
       collapses; the back stays fully reachable so cabling into a
       collapsed device's jacks still works. A device that patches through
       front-mounted jacks (SGE-7's modular matrix) needs those hidden from
       cable drawing too while collapsed — UI.jackVisible below handles that. */
    var ph=dev.chassis.querySelector('.pheader');
    if(ph){
      var collapseBtn=UI.el('button','collapseb','&#9660;');
      collapseBtn.title='Collapse';
      collapseBtn.onclick=function(){
        dev.collapsed=!dev.collapsed;
        w.classList.toggle('collapsed',dev.collapsed);
        collapseBtn.innerHTML=dev.collapsed?'&#9654;':'&#9660;';
        collapseBtn.title=dev.collapsed?'Expand':'Collapse';
        UI.drawCables();};
      ph.insertBefore(collapseBtn,ph.firstChild);}
    var bk=UI.el('div','face back'),bp=UI.el('div','backpanel');
    bp.appendChild(UI.el('div','bkhead','<div class="bkbrand"><b>'+spec.name+'</b><small>'+spec.sub+'</small></div>'));
    var jrow=UI.el('div','bkjacks');
    (spec.back||[]).forEach(function(g){var grp=UI.el('div','jgrp');
      if(g.title)grp.appendChild(UI.el('div','jkt',g.title));
      g.jacks.forEach(function(j){registerJack(dev,j[0],j[1],j[2],j[3],j[4],grp);});
      jrow.appendChild(grp);});
    bp.appendChild(jrow);
    bk.append(mkEar('l',{grip:1,flip:1}),bp,mkEar('r',{}));
    w.append(fr,bk);dev.el=w;
    Array.prototype.forEach.call(w.querySelectorAll('.flipb'),function(b){b.onclick=function(){dev.flipped=!dev.flipped;w.classList.toggle('flipped',dev.flipped);UI.drawCables();};});
    w.querySelector('.face.front .delb').onclick=function(){UI.unmount(dev);};
    Array.prototype.forEach.call(w.querySelectorAll('.grip'),function(g){g.addEventListener('pointerdown',function(e){reorder(e,dev);});});
    if(dev.noteOn)w.addEventListener('pointerdown',function(){RS.S.focus=dev;
      RS.S.devices.forEach(function(d){if(d.mchip)d.mchip.classList.toggle('on',d===dev);});},true);
    UI.$('#content').appendChild(w);RS.S.devices.push(dev);
    /* output socket + VU: cables hit the socket, the VU taps the raw output,
       so blanket-disconnect during repatching never kills the meter */
    /* EVERY out jack gets its own socket gain. RS.rebuild blanket-disconnects
       registered out nodes, so a jack that aliases an internal node (SGE-7's
       pre-FX OUT B was dev.pre) would cut the device's own signal path. */
    if(type!=='hw'&&RS.A.ctx){
      var primary=dev.outs.has('outa')?'outa':(dev.outs.has('out')?'out':null);
      dev.outs.forEach(function(n){
        var srcN=dev.jackNodes[n];
        if(!srcN||typeof srcN.connect!=='function')return;
        try{
          var sock=RS.A.ctx.createGain();
          srcN.connect(sock);
          dev.jackNodes[n]=sock;
          if(n===primary){
            var ana=RS.A.ctx.createAnalyser();ana.fftSize=256;
            srcN.connect(ana);dev.vuAna=ana;}
        }catch(e){}});
      if(dev.vuAna){
        try{
          var vu=UI.el('div','vu','<i></i><i></i><i></i><i></i>');
          var ph=dev.chassis.querySelector('.pheader');
          if(ph)ph.appendChild(vu);
          dev.vuSegs=Array.from(vu.querySelectorAll('i'));
        }catch(e){}}}
    if(dev.loadPreset&&dev._presetStart!==undefined){try{dev.loadPreset(dev._presetStart);}catch(e){}}
    UI.drawCables();
  }catch(e){UI.toast(spec.name+' MOUNT ERROR: '+e.message,8000);return null;}
  return dev;};
UI.unmount=function(dev){
  if(dev.type==='hw')return;
  try{if(dev.allOff)dev.allOff();}catch(e){}
  RS.S.cables=RS.S.cables.filter(function(c){return c.from.dev!==dev.id&&c.to.dev!==dev.id;});
  RS.S.devices=RS.S.devices.filter(function(d){return d!==dev;});dev.el.remove();
  if(RS.S.focus===dev)RS.S.focus=null;
  RS.rebuild();UI.drawCables();if(RS.MIDI&&RS.MIDI.panel)RS.MIDI.panel();};
function reorder(e,dev){
  if(e.button!==0)return;e.preventDefault();
  var w=dev.el,y0=e.clientY,dy=0,act=false;
  function mv(ev){dy=ev.clientY-y0;
    if(!act&&Math.abs(dy)>8){act=true;w.style.zIndex=60;w.style.opacity=.9;}
    if(!act)return;
    w.style.transform='translateY('+dy+'px)';
    var sib=dy>0?w.nextElementSibling:w.previousElementSibling;
    if(sib&&!sib.classList.contains('dev'))sib=null;
    if(sib){var sr=sib.getBoundingClientRect();
      if(dy>0&&w.getBoundingClientRect().bottom>sr.bottom-6){w.parentNode.insertBefore(sib,w);dy-=sr.height;w.style.transform='translateY('+dy+'px)';UI.drawCables();}
      else if(dy<0&&w.getBoundingClientRect().top<sr.top+6){w.parentNode.insertBefore(w,sib);dy+=sr.height;w.style.transform='translateY('+dy+'px)';UI.drawCables();}}}
  function up(){window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);
    if(act){w.style.transform='';w.style.zIndex='';w.style.opacity='';UI.drawCables();}}
  window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);}
return UI;})();