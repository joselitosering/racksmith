/* RACKSMITH audio bridge — master chain, safety, FX factory */
'use strict';
window.RS=window.RS||{};RS.mods=RS.mods||{};RS.mods.audio='ok';
RS.A=(function(){
var A={};
var TMP=new Float32Array(512);
function tanh(dr){var n=1024,c=new Float32Array(n),i,x;
  for(i=0;i<n;i++){x=i/(n-1)*2-1;c[i]=Math.tanh(x*dr)/Math.tanh(dr);}return c;}
A.TMP=TMP;A.tanh=tanh;
var EQF=[31,62,125,250,500,1000,2000,4000,8000,16000];
A.EQF=EQF;

A.init=function(ctx){
  A.ctx=ctx;
  function G(v){var g=ctx.createGain();g.gain.value=v;return g;}
  function ANA(){var a=ctx.createAnalyser();a.fftSize=512;return a;}
  A.safeCurve=tanh(1.02);
  A.drvCurve=tanh(1.6);
  var b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=b.getChannelData(0),i;
  for(i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  A.noise=b;
  /* master chain: in → gate → comp → EQ10 → dry/delay/reverb → limiter → clip → out */
  A.in=G(1);A.gateAna=ANA();
  A.gateG=G(1);A.gateDry=G(0);A.gateWet=G(1);A.gSum=G(1);
  A.comp=ctx.createDynamicsCompressor();
  A.comp.threshold.value=-22;A.comp.knee.value=6;A.comp.ratio.value=4;A.comp.attack.value=.006;A.comp.release.value=.18;
  A.compDry=G(0);A.compWet=G(1);A.cSum=G(1);
  A.compMk=G(A.compTrim(-22,4));
  A.eq=[];
  for(i=0;i<10;i++){var f=ctx.createBiquadFilter();
    f.type=i===0?'lowshelf':i===9?'highshelf':'peaking';
    f.frequency.value=EQF[i];f.Q.value=1;f.gain.value=0;A.eq.push(f);}
  A.dryMain=G(.95);A.sum=G(1);
  A.dIn=G(1);A.dL=ctx.createDelay(2);A.dR=ctx.createDelay(2);
  A.dL.delayTime.value=.28;A.dR.delayTime.value=.28;
  A.dFb=G(.38);A.dTone=ctx.createBiquadFilter();A.dTone.type='lowpass';A.dTone.frequency.value=5500;
  A.pL=ctx.createStereoPanner();A.pL.pan.value=-.85;
  A.pR=ctx.createStereoPanner();A.pR.pan.value=.85;
  A.dWet=G(.18);
  A.rIn=G(1);
  A.rHP=ctx.createBiquadFilter();A.rHP.type='highpass';A.rHP.frequency.value=140;A.rHP.Q.value=.707;
  A.conv=ctx.createConvolver();
  A.rTone=ctx.createBiquadFilter();A.rTone.type='lowpass';A.rTone.frequency.value=6500;
  A.rWet=G(.22);
  A.lim=ctx.createDynamicsCompressor();
  A.lim.threshold.value=-2;A.lim.knee.value=4;A.lim.ratio.value=14;A.lim.attack.value=.002;A.lim.release.value=.14;
  A.limMk=G(A.compTrim(-2,14));
  A.clip=ctx.createWaveShaper();A.clip.curve=tanh(1.3);A.clip.oversample='2x';
  /* surge guard: the limiter+clip pair already bounds any single peak, but a
     runaway feedback patch can sit the output at that ceiling continuously —
     that's a surge, not a peak, so it needs its own watchdog (see raf() in
     rs-app.js) which ducks this stage rather than one-shot clipping it */
  A.surge=G(1);A.surgeActive=false;
  A.gain=G(.92);A.split=ctx.createChannelSplitter(2);A.anaL=ANA();A.anaR=ANA();
  A.in.connect(A.gateAna);
  A.in.connect(A.gateDry);A.gateDry.connect(A.gSum);
  A.in.connect(A.gateG);A.gateG.connect(A.gateWet);A.gateWet.connect(A.gSum);
  A.gSum.connect(A.compDry);A.compDry.connect(A.cSum);
  A.gSum.connect(A.comp);A.comp.connect(A.compMk);A.compMk.connect(A.compWet);A.compWet.connect(A.cSum);
  var last=A.cSum;
  A.eq.forEach(function(f){last.connect(f);last=f;});
  A.eqOut=last;
  A.eqOut.connect(A.dryMain);A.dryMain.connect(A.sum);
  A.eqOut.connect(A.dIn);A.dIn.connect(A.dL);
  A.dL.connect(A.pL);A.pL.connect(A.dWet);
  A.dL.connect(A.dR);A.dR.connect(A.pR);A.pR.connect(A.dWet);
  A.dR.connect(A.dTone);A.dTone.connect(A.dFb);A.dFb.connect(A.dL);
  A.dWet.connect(A.sum);
  A.eqOut.connect(A.rIn);A.rIn.connect(A.rHP);A.rHP.connect(A.conv);A.conv.connect(A.rTone);A.rTone.connect(A.rWet);A.rWet.connect(A.sum);
  A.sum.connect(A.lim);A.lim.connect(A.limMk);A.limMk.connect(A.clip);A.clip.connect(A.surge);A.surge.connect(A.gain);
  A.gain.connect(A.split);A.split.connect(A.anaL,0);A.split.connect(A.anaR,1);
  A.gain.connect(ctx.destination);
  A.mkIR(2.2);
};
/* Room model. rt60 = -60dB decay time; pre = first-reflection delay in ms
   (path length / 343 m/s); damp = HF corner of the tail (air + audience
   absorption, so the top decays faster than the bottom); er = level of the
   discrete early reflections that tell the ear how big the room is. */
A.vAc={rt60:2.2,pre:18,damp:6000,er:.5};
A.mkIR=function(sec,ac){
  var ctx=A.ctx;
  if(Number.isFinite(sec))A.vAc.rt60=Math.max(.12,Math.min(9,sec));
  if(ac){
    if(Number.isFinite(ac.pre))A.vAc.pre=Math.max(0,Math.min(250,ac.pre));
    if(Number.isFinite(ac.damp))A.vAc.damp=Math.max(800,Math.min(16000,ac.damp));
    if(Number.isFinite(ac.er))A.vAc.er=Math.max(0,Math.min(1,ac.er));}
  var rt=A.vAc.rt60,pre=A.vAc.pre/1000,damp=A.vAc.damp,er=A.vAc.er;
  var sr=ctx.sampleRate;
  var p0=Math.floor(pre*sr);
  var len=Math.max(64,p0+Math.floor(rt*1.05*sr));
  var b=ctx.createBuffer(2,len,sr);
  var k=Math.log(1000)/(rt*sr);            /* e^-kn hits -60 dB at n = rt*sr */
  /* Reflection taps, spaced by room size (a garage answers in 3ms, a bowl in
     90). The diffuse tail builds up behind them instead of starting at full
     density — that build-up is what makes a room read as a room. */
  var TAPS=[[.0000,1],[.0083,.72],[.0141,.61],[.0219,.52],[.0307,.43],[.0412,.35],[.0561,.28]];
  var tscale=Math.max(.3,Math.min(3,A.vAc.pre/18));
  var build=Math.max(64,Math.floor(Math.min(.07,Math.max(.008,rt*.05))*sr));
  for(var ch=0;ch<2;ch++){
    var d=b.getChannelData(ch),z=0,i,sq=0;
    var f0=Math.min(damp,sr*.45);
    for(i=p0;i<len;i++){
      var n=i-p0,env=Math.exp(-k*n);
      /* one-pole whose corner falls with the tail: highs die first */
      var a=1-Math.exp(-2*Math.PI*(f0*(.35+.65*env))/sr);
      z+=a*((Math.random()*2-1)-z);
      var grow=n<build?(n/build)*(n/build):1;
      d[i]=z*env*grow;}
    for(var t2=0;t2<TAPS.length;t2++){
      var td=TAPS[t2][0]*tscale*(1+ch*.11);
      var idx=p0+Math.floor(td*sr);
      if(idx<len)d[idx]+=TAPS[t2][1]*er*Math.exp(-k*(idx-p0))*(ch?-.9:.9);}
    for(i=0;i<len;i++)sq+=d[i]*d[i];
    var g=.9/Math.sqrt(sq||1);
    for(i=0;i<len;i++)d[i]*=g;}
  A.irBuf=b;A.conv.buffer=b;};
/* SURGE PROTECTION — every device output goes through this:
   12Hz highpass (kills DC/stacking) → soft tanh clip (kills overs) */
/* DC blocker — folders and asymmetric shapers push the signal off centre,
   and DC through a resonant filter or a VCA gate thumps */
/* Blink's DynamicsCompressorNode applies an undocumented internal makeup of
   about -0.6 x (the curve output for a 0 dBFS input), so DROPPING the
   threshold silently ADDS level: at threshold -22 / ratio 4 that is nearly
   +10 dB of hidden gain, which is why the master sat pinned in the red.
   These trims cancel it so a compressor behaves like a compressor. */
A.compTrim=function(th,ratio){
  var out0=th+(0-th)/Math.max(ratio||1,1);          /* dB out for 0 dBFS in */
  return Math.pow(10,(0.6*out0)/20);};
A.dcBlock=function(){
  var f=A.ctx.createBiquadFilter();f.type='highpass';f.frequency.value=16;f.Q.value=.707;return f;};
/* one time constant for every panel control, so nothing steps */
A.SMOOTH=.02;
A.smooth=function(param,v,tc){
  if(!Number.isFinite(v))return;
  try{param.setTargetAtTime(v,A.ctx.currentTime,tc||A.SMOOTH);}catch(e){}};
A.safeOut=function(){
  /* one calibrated output standard for every device in the rack: -6 dB so a
     handful of sources sum into the console with headroom left */
  var ctx=A.ctx;
  var input=ctx.createGain(),output=ctx.createGain();
  output.gain.value=.5;
  var dc=ctx.createBiquadFilter();dc.type='highpass';dc.frequency.value=12;
  var cl=ctx.createWaveShaper();cl.curve=A.safeCurve;cl.oversample='2x';
  input.connect(dc);dc.connect(cl);cl.connect(output);
  return{input:input,output:output};};
A.applyMFX=function(p){
  if(!A.ctx)return;
  var t=A.ctx.currentTime;
  var g=p.gOn?p.gmix:0;
  A.gateDry.gain.setTargetAtTime(1-g,t,.03);A.gateWet.gain.setTargetAtTime(g,t,.03);
  var c=p.cOn?p.cmix:0;
  A.compDry.gain.setTargetAtTime(1-c,t,.03);A.compWet.gain.setTargetAtTime(c,t,.03);
  A.dWet.gain.setTargetAtTime(p.dOn?p.dmix:0,t,.03);
  A.rWet.gain.setTargetAtTime(p.rOn?p.rmix:0,t,.03);};
A.heal=function(){
  var ctx=A.ctx,now=ctx.currentTime;
  try{
    [A.gateG,A.dryMain,A.dWet,A.rWet,A.dFb].forEach(function(g){
      g.gain.cancelScheduledValues(now);g.gain.setValueAtTime(0,now);});
    try{A.rIn.disconnect();A.rHP.disconnect();A.conv.disconnect();}catch(e){}
    A.conv=ctx.createConvolver();if(A.irBuf)A.conv.buffer=A.irBuf;
    A.rIn.connect(A.rHP);A.rHP.connect(A.conv);A.conv.connect(A.rTone);
    try{A.sum.disconnect();A.lim.disconnect();A.limMk.disconnect();A.clip.disconnect();}catch(e){}
    A.lim=ctx.createDynamicsCompressor();
    A.lim.threshold.value=-2;A.lim.knee.value=4;A.lim.ratio.value=14;A.lim.attack.value=.002;A.lim.release.value=.14;
    A.clip=ctx.createWaveShaper();A.clip.curve=tanh(1.3);A.clip.oversample='2x';
    A.sum.connect(A.lim);A.lim.connect(A.limMk);A.limMk.connect(A.clip);A.clip.connect(A.surge);
  }catch(e){}
  setTimeout(function(){
    if(!A.ctx)return;
    var t=A.ctx.currentTime;
    A.gateG.gain.setTargetAtTime(1,t,.02);
    A.dryMain.gain.setTargetAtTime(.95,t,.02);
    if(RS.S&&RS.S.hw)A.applyMFX(RS.S.hw.p);
  },2300);
  RS.UI.toast('Signal fault — master FX flushed, restoring in 2s',3200);};
var surgeT=null;
/* SURGE GUARD — called by the watchdog in rs-app.js's raf() when the master
   output has sat at the limiter's ceiling for a sustained stretch (a
   feedback loop riding the limiter, not just one loud hit). Ducks hard and
   fast, then eases back over a couple seconds so it doesn't thump. */
A.duckSurge=function(){
  if(!A.ctx)return;
  var t=A.ctx.currentTime;
  A.surgeActive=true;
  if(A.onSurge)try{A.onSurge(true);}catch(e){}
  A.surge.gain.cancelScheduledValues(t);
  A.surge.gain.setTargetAtTime(.2,t,.015);
  clearTimeout(surgeT);
  surgeT=setTimeout(function(){
    if(!A.ctx)return;
    A.surgeActive=false;
    if(A.onSurge)try{A.onSurge(false);}catch(e){}
    A.surge.gain.setTargetAtTime(1,A.ctx.currentTime,.6);
  },2000);
  RS.UI.toast('Surge guard — output ducked, easing back in',2600);};
A.pEnv=function(param,t,from,to,At,D,Sf,R){
  if(!Number.isFinite(t))t=A.ctx.currentTime;
  if(!Number.isFinite(from))from=0;
  if(!Number.isFinite(to))to=from;
  if(!Number.isFinite(At)||At<=0)At=.0015;
  if(!Number.isFinite(D)||D<=0)D=.05;
  if(!Number.isFinite(Sf))Sf=0;Sf=Math.max(0,Math.min(1,Sf));
  if(!Number.isFinite(R)||R<=0)R=.05;
  At=Math.max(At,.0015);var tau=Math.max(D/3,.012);
  param.setValueAtTime(from,t);param.linearRampToValueAtTime(to,t+At);
  param.setTargetAtTime(from+(to-from)*Sf,t+At,tau);
  var cur=function(tO){var e=tO-t;if(e<=0)return from;if(e<At)return from+(to-from)*(e/At);
    return from+(to-from)*(Sf+(1-Sf)*Math.exp(-(e-At)/tau));};
  return{off:function(tO,end){var v=cur(tO);param.cancelScheduledValues(tO);param.setValueAtTime(v,tO);
    param.setTargetAtTime(end,tO,Math.max(R/3,.01));return tO+Math.max(R*2.6,.12)+.06;}};};
A.noiseSrc=function(){var s=A.ctx.createBufferSource();s.buffer=A.noise;s.loop=true;return s;};
var FXTYPES=['OFF','HALL','PLATE','SPRING','ROOM','TAPE ECHO','PING-PONG','TUBE','OVERDRIVE','FUZZ','CHORUS','FLANGER','PHASER','TREMOLO'];
A.FXTYPES=FXTYPES;
function mkIRBuf(sec,pw){
  var ctx=A.ctx;
  var len=Math.max(64,Math.floor(sec*ctx.sampleRate));
  var b=ctx.createBuffer(2,len,ctx.sampleRate),ch,i,d,t,v,sq,g,ramp=Math.max(8,Math.floor(ctx.sampleRate*.012));
  for(ch=0;ch<2;ch++){d=b.getChannelData(ch);sq=0;
    for(i=0;i<len;i++){t=i/len;
      v=(Math.random()*2-1)*Math.pow(1-t,pw);
      if(i<ramp)v*=i/ramp;
      if(sec<1.1&&Math.random()<.0015)v*=7;
      d[i]=v;sq+=v*v;}
    g=.9/Math.sqrt(sq||1);
    for(i=0;i<len;i++)d[i]*=g;}
  return b;}
A.makeFX=function(){
  var ctx=A.ctx;
  var input=ctx.createGain(),output=ctx.createGain();
  var dry=ctx.createGain(),wet=ctx.createGain();
  input.connect(dry);dry.connect(output);wet.connect(output);
  var type='OFF',amount=.5,mix=.35,nds=[],oscs=[],bt=null;
  function kill(){
    oscs.forEach(function(o){try{o.stop();}catch(e){}});
    nds.forEach(function(n){try{n.disconnect();}catch(e){}});
    try{input.disconnect();}catch(e){}
    input.connect(dry);dry.connect(output);wet.connect(output);
    nds=[];oscs=[];}
  function build(){
    kill();
    if(type==='OFF'){dry.gain.value=1;wet.gain.value=0;return;}
    dry.gain.value=1-mix*.6;wet.gain.value=mix*1.25;
    var Am=amount;
    function N(n){nds.push(n);return n;}
    function O(o){oscs.push(o);o.start();return o;}
    if(type==='HALL'||type==='PLATE'||type==='SPRING'||type==='ROOM'){
      var cfg={HALL:[3.2,2.4,5200],PLATE:[1.7,3.4,8500],SPRING:[.85,3.2,6800],ROOM:[.95,2.1,7200]}[type];
      var conv=ctx.createConvolver();conv.buffer=mkIRBuf(cfg[0]*(.45+Am),cfg[1]);
      var tone=ctx.createBiquadFilter();tone.type='lowpass';tone.frequency.value=cfg[2]*(.4+Am*1.2);
      input.connect(conv);conv.connect(tone);tone.connect(wet);N(conv);N(tone);return;}
    if(type==='TAPE ECHO'){
      var d=N(ctx.createDelay(2));d.delayTime.value=.34;
      var lfo=O(ctx.createOscillator());lfo.frequency.value=.5;
      var lg=N(ctx.createGain());lg.gain.value=.0016;lfo.connect(lg);lg.connect(d.delayTime);
      var fb=N(ctx.createGain());fb.gain.value=.15+Am*.7;
      var tn=N(ctx.createBiquadFilter());tn.type='lowpass';tn.frequency.value=3400;
      input.connect(d);d.connect(wet);d.connect(tn);tn.connect(fb);fb.connect(d);return;}
    if(type==='PING-PONG'){
      var dL=N(ctx.createDelay(2)),dR=N(ctx.createDelay(2));
      dL.delayTime.value=.28;dR.delayTime.value=.28;
      var fb2=N(ctx.createGain());fb2.gain.value=.15+Am*.65;
      var pL=N(ctx.createStereoPanner()),pR=N(ctx.createStereoPanner());
      pL.pan.value=-.85;pR.pan.value=.85;
      var tn2=N(ctx.createBiquadFilter());tn2.type='lowpass';tn2.frequency.value=5000;
      input.connect(dL);dL.connect(pL);pL.connect(wet);
      dL.connect(dR);dR.connect(pR);pR.connect(wet);
      dR.connect(tn2);tn2.connect(fb2);fb2.connect(dL);return;}
    if(type==='TUBE'){
      var pre=N(ctx.createGain());pre.gain.value=1+Am*3;
      var sh=N(ctx.createWaveShaper());sh.curve=A.drvCurve;sh.oversample='2x';
      var cp=ctx.createDynamicsCompressor();cp.threshold.value=-18;cp.ratio.value=3;cp.attack.value=.004;cp.release.value=.12;
      var post=N(ctx.createGain());post.gain.value=.85;
      input.connect(pre);pre.connect(sh);sh.connect(cp);cp.connect(post);post.connect(wet);N(cp);return;}
    if(type==='OVERDRIVE'||type==='FUZZ'){
      var pre2=N(ctx.createGain());pre2.gain.value=1+Am*(type==='FUZZ'?16:6);
      var sh2=N(ctx.createWaveShaper());sh2.curve=tanh(type==='FUZZ'?3.4:1.8);sh2.oversample='2x';
      var post2=N(ctx.createGain());post2.gain.value=type==='FUZZ'?.5:.75;
      input.connect(pre2);pre2.connect(sh2);sh2.connect(post2);post2.connect(wet);return;}
    if(type==='CHORUS'){
      var cg=N(ctx.createGain());
      [[.02,.6],[.027,.83]].forEach(function(cf){
        var cd=N(ctx.createDelay(.1));cd.delayTime.value=cf[0];
        var cl=O(ctx.createOscillator());cl.frequency.value=cf[1];
        var clg=N(ctx.createGain());clg.gain.value=.0008+Am*.009;
        cl.connect(clg);clg.connect(cd.delayTime);
        input.connect(cd);cd.connect(cg);});
      cg.connect(wet);return;}
    if(type==='FLANGER'){
      var fd=N(ctx.createDelay(.06));fd.delayTime.value=.005;
      var fl=O(ctx.createOscillator());fl.frequency.value=.25;
      var flg=N(ctx.createGain());flg.gain.value=.0008+Am*.004;
      fl.connect(flg);flg.connect(fd.delayTime);
      var ffb=N(ctx.createGain());ffb.gain.value=.55;
      input.connect(fd);fd.connect(wet);fd.connect(ffb);ffb.connect(fd);return;}
    if(type==='PHASER'){
      var last=input;
      var pl=O(ctx.createOscillator());pl.frequency.value=.4;
      var plg=N(ctx.createGain());plg.gain.value=700+Am*1600;
      pl.connect(plg);
      for(var i=0;i<4;i++){
        var ap=N(ctx.createBiquadFilter());ap.type='allpass';
        ap.frequency.value=350*Math.pow(2.1,i);ap.Q.value=1.4;
        plg.connect(ap.frequency);last.connect(ap);last=ap;}
      last.connect(wet);return;}
    if(type==='TREMOLO'){
      var tl=O(ctx.createOscillator());tl.frequency.value=1.5+Am*8;
      var tlg=N(ctx.createGain());tlg.gain.value=.5;
      var base=N(ctx.createGain());base.gain.value=.5;
      tl.connect(tlg);tlg.connect(base.gain);
      input.connect(base);base.connect(wet);return;}
  }
  try{build();}catch(e){}
  return{input:input,output:output,
    setType:function(t){type=t;try{build();}catch(e){}},
    setAmount:function(a){amount=Math.max(0,Math.min(1,a));clearTimeout(bt);bt=setTimeout(function(){try{build();}catch(e){}},60);},
    setMix:function(m){mix=Math.max(0,Math.min(1,m));
      if(type==='OFF'){dry.gain.value=1;wet.gain.value=0;}
      else{dry.gain.value=1-mix*.6;wet.gain.value=mix*1.25;}}};
};
A.dbOf=function(ana){
  try{ana.getFloatTimeDomainData(TMP);}catch(e){return -90;}
  /* only the first fftSize samples were written — scanning past them reads
     whatever analyser was measured last */
  var n=Math.min(ana.fftSize,TMP.length);
  var m=0;for(var i=0;i<n;i+=2){var a=Math.abs(TMP[i]);if(a>m)m=a;}
  if(!Number.isFinite(m))return -90;
  return 20*Math.log10(m+1e-6);};
return A;})();