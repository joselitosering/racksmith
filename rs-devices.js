/* RACKSMITH device registry */
'use strict';
window.RS=window.RS||{};RS.mods=RS.mods||{};RS.mods.devices='ok';
RS.DEVS={};
RS.dev=function(id,spec){RS.DEVS[id]=spec;};
function ps(s){return Array.from(s).map(function(c){return c==='X'?2:c==='x'?1:0;});}
var RGEN={
 HOUSE:{bd:.28,pat:['X...X...X...X...','................','....X.......X...','................','................','x.x.x.x.x.x.x.x.','..X...X...X...X.','................','X.......X.......']},
 TECHNO:{bd:.22,pat:['X...X...X...X...','................','....x.......x...','................','................','x.x.x.x.x.x.x.x.','..X...X...X...X.','................','X...............']},
 TRANCE:{bd:.34,pat:['X...X...X...X...','....X.......X...','................','................','................','x.x.x.x.x.x.x.x.','..X...X...X...X.','................','X.......X.......']},
 DNB:{bd:.5,pat:['X.........X.....','....X..x....X...','................','...........x....','................','x.x.x.x.x.x.x.x.','................','................','X.........X.....']},
 DUB:{bd:.75,pat:['X.........X.....','........X.......','........X.......','................','................','x..x..x.x..x..x.','................','................','X.........X.....']},
 HIPHOP:{bd:.5,pat:['X.....X...X.....','....X.......X...','................','................','................','x.x.x.x.x.x.x.x.','................','................','X.....X...X.....']}};
var KITNAMES=Object.keys(RGEN);
var OFFS=[0,3,5,7,10,12,15,19];
var RIFFS={
 ACID:{rows:[1,1,2,1,1,6,1,1,1,2,1,6,1,1,6,1],vals:[.95,.5,.6,.5,.95,.9,.5,.55,.95,.6,.5,.9,.95,.5,.9,.55]},
 TRANCE:{rows:[1,2,3,4,5,4,3,2,1,2,3,4,5,6,6,7],vals:[.85,.55,.55,.55,.85,.55,.55,.55,.85,.55,.55,.55,.85,.6,.65,.75]},
 DNB:{rows:[1,null,1,1,null,1,null,null,1,null,1,1,null,1,null,2],vals:[.9,0,.55,.6,0,.55,0,0,.9,0,.55,.6,0,.6,0,.75]},
 DUB:{rows:[1,null,null,2,null,null,null,null,1,null,null,2,null,null,3,null],vals:[.95,0,0,.7,0,0,0,0,.95,0,0,.75,0,0,.8,0]},
 TECHNO:{rows:[1,null,2,null,1,null,2,null,1,null,2,null,1,null,2,3],vals:[.9,0,.6,0,.85,0,.6,0,.9,0,.6,0,.85,0,.6,.7]}};
var NTRK=9;
var DRLAB=[['BD','BASS DRUM'],['SD','SNARE'],['CP','CLAP'],['LT','LOW TOM'],['HT','HI TOM'],['CH','CLOSED HAT'],['OH','OPEN HAT'],['CB','COWBELL'],['B8','808 BASS']];
var DSETS={'808':{tune:1,dec:1},'909':{tune:1.28,dec:.68},'ACOUSTIC':{tune:.9,dec:1.15},'LO-FI':{tune:.76,dec:1.35}};
var DDEF=[[1,.32,.95],[1,.45,.9],[1,.5,.7],[1,.45,.7],[1,.45,.65],[1,.35,.55],[1,.45,.55],[1,.5,.6],[1,.6,1]];
var EQP={FLAT:[0,0,0,0,0,0,0,0,0,0],BASS:[8,7,5,2,0,0,0,0,0,0],SMILE:[6,5,3,0,-2,-2,0,3,5,6],LOUD:[5,3,0,-2,-3,-2,0,3,5,5],RADIO:[-10,-8,-4,2,5,6,4,-2,-8,-10]};
/* Venue acoustics. rt60 from published room-acoustics bands for each venue
   class (club <1s · hall 1.2-1.8s · concert hall 1.8-2.2s · arena 3-4.5s ·
   open bowl 5s+); pre = first-reflection path / 343 m/s; slap = [s, feedback,
   mix] for the rear-wall return, only where the room is deep enough to hear
   one as a discrete echo; wet stays low so the room sits behind the mix. */
var VENUES={
 'GARAGE':        {rt60:.45,pre:6, damp:7500,er:.85,locut:110,wet:.07,slap:null,           cth:-18,crat:2.5,vol:.92,eq:[0,1,2,2,0,-1,-1,-1,-2,-3]},
 'SMALL VENUE':   {rt60:.85,pre:11,damp:6800,er:.70,locut:120,wet:.10,slap:null,           cth:-20,crat:3,  vol:.92,eq:[0,0,1,1,0,0,0,0,-1,-1]},
 'ROCK SHOW':     {rt60:1.35,pre:18,damp:5500,er:.55,locut:140,wet:.13,slap:[.095,.14,.05],cth:-17,crat:4,  vol:.93,eq:[2,2,1,0,-1,0,1,2,1,0]},
 'RAVE':          {rt60:2.1,pre:24,damp:4500,er:.50,locut:150,wet:.16,slap:[.120,.20,.07], cth:-15,crat:5,  vol:.93,eq:[4,4,2,0,-2,-1,1,2,2,1]},
 'WAREHOUSE':     {rt60:3.0,pre:30,damp:4200,er:.75,locut:150,wet:.17,slap:[.140,.30,.09], cth:-16,crat:4,  vol:.92,eq:[3,3,2,0,-1,0,2,3,1,-1]},
 'STADIUM':       {rt60:5.5,pre:95,damp:3200,er:.30,locut:170,wet:.20,slap:[.260,.26,.11], cth:-16,crat:3.5,vol:.90,eq:[1,2,1,0,-1,-2,-2,-3,-4,-5]},
 'THE FILLMORE':  {rt60:1.5,pre:17,damp:6000,er:.62,locut:130,wet:.12,slap:[.080,.12,.04], cth:-18,crat:3,  vol:.93,eq:[1,2,2,1,0,0,1,1,0,-1]},
 'GRAND OLE OPRY':{rt60:1.7,pre:22,damp:6800,er:.50,locut:130,wet:.13,slap:null,           cth:-20,crat:2.5,vol:.93,eq:[0,0,1,2,2,2,1,0,-1,-1]},
 'MSG':           {rt60:3.2,pre:48,damp:4000,er:.40,locut:160,wet:.17,slap:[.150,.22,.08], cth:-16,crat:4,  vol:.91,eq:[2,3,2,0,-1,-1,0,0,-2,-3]},
 'COW PALACE':    {rt60:4.3,pre:55,damp:3600,er:.45,locut:160,wet:.19,slap:[.175,.28,.10], cth:-17,crat:3.5,vol:.91,eq:[3,4,3,1,0,1,2,0,-3,-4]}
};
var XP=[{t:'-12',v:-12},{t:'-7',v:-7},{t:'-5',v:-5},{t:'-2',v:-2},{t:'-1',v:-1},{t:'0',v:0},
  {t:'+1',v:1},{t:'+2',v:2},{t:'+5',v:5},{t:'+7',v:7},{t:'+12',v:12}];
var WAVS=[{t:'SIN',v:'sine'},{t:'TRI',v:'triangle'},{t:'SAW',v:'sawtooth'},{t:'SQR',v:'square'}];

/* ============ HW-1 — Qu-style master console ============ */
RS.dev('hw',{name:'HW-1',sub:'QU MASTER CONSOLE · TRANSPORT · FX',accent:'#5fc46a',
build:function(dev){
  var A=RS.A,UI=RS.UI,ctx=A.ctx;
  var NCH=8;
  /* ---------- audio: 8 channels + master EQ + 4 aux + PFL bus ---------- */
  dev.chs=[];dev.mute=[];dev.solo=[];dev.mg=[];dev.meters=[];dev.stripEls=[];
  dev.fxs=[];dev.retG=[];dev.nch=NCH;
  dev._srcNames=['MASTER'];
  for(var q=1;q<=NCH;q++)dev._srcNames.push('CH '+q);
  var mix=ctx.createGain();
  var pflBus=ctx.createGain();pflBus.gain.value=0;
  /* master strip EQ sits on the mix bus, ahead of the master FX chain.
     PFL bypasses it — pre-fade listen is a monitor path, not a mix path. */
  var mHp=ctx.createBiquadFilter();mHp.type='highpass';mHp.frequency.value=20;mHp.Q.value=.707;
  var mLo=ctx.createBiquadFilter();mLo.type='lowshelf';mLo.frequency.value=120;
  var mMid=ctx.createBiquadFilter();mMid.type='peaking';mMid.frequency.value=900;mMid.Q.value=.8;
  var mHi=ctx.createBiquadFilter();mHi.type='highshelf';mHi.frequency.value=7500;
  var mGain=ctx.createGain();mGain.gain.value=1;
  var mPan=ctx.createStereoPanner();
  mix.connect(mGain);mGain.connect(mHp);
  mHp.connect(mLo);mLo.connect(mMid);mMid.connect(mHi);mHi.connect(mPan);mPan.connect(A.in);
  /* the strip meters and the VU pair both read A.anaL/anaR — the true master
     output, downstream of the MAIN fader, so pulling the fader pulls them */
  pflBus.connect(A.in);
  dev.mEq={hp:mHp,lo:mLo,mid:mMid,hi:mHi};
  dev.jackNodes.in=A.in;
  var defT=['PLATE','TAPE ECHO','PING-PONG','TUBE'];
  for(var f=0;f<4;f++){
    var fx=A.makeFX();fx.setType(defT[f]);fx.setMix(.3);
    var ret=ctx.createGain();ret.gain.value=.8;
    var sendOut=ctx.createGain();                  /* rear AUX SEND tap */
    fx.output.connect(ret);ret.connect(mix);
    dev.fxs.push(fx);dev.retG.push(ret);
    dev.jackNodes['aux'+(f+1)]=sendOut;dev.outs.add('aux'+(f+1));
    dev.jackNodes['ret'+(f+1)]=ret;                /* external return into the mix */
  }
  for(var i=0;i<NCH;i++){
    dev.mute.push(false);dev.solo.push(false);
    var o={};
    o.in=ctx.createGain();
    o.gn=ctx.createGain();
    o.hp=ctx.createBiquadFilter();o.hp.type='highpass';o.hp.frequency.value=20;o.hp.Q.value=.707;
    o.lo=ctx.createBiquadFilter();o.lo.type='lowshelf';o.lo.frequency.value=120;
    o.mid=ctx.createBiquadFilter();o.mid.type='peaking';o.mid.frequency.value=900;o.mid.Q.value=.8;
    o.hi=ctx.createBiquadFilter();o.hi.type='highshelf';o.hi.frequency.value=7500;
    /* RTA taps POST-EQ so the screen shows what the EQ actually did */
    o.an=ctx.createAnalyser();o.an.fftSize=512;
    o.fad=ctx.createGain();o.fad.gain.value=.8;
    o.mute=ctx.createGain();
    o.pan=ctx.createStereoPanner();
    o.pfl=ctx.createGain();o.pfl.gain.value=0;
    o.spl=ctx.createChannelSplitter(2);
    o.anL=ctx.createAnalyser();o.anL.fftSize=512;
    o.anR=ctx.createAnalyser();o.anR.fftSize=512;
    o.in.connect(o.gn);
    o.gn.connect(o.hp);o.hp.connect(o.lo);o.lo.connect(o.mid);o.mid.connect(o.hi);
    o.hi.connect(o.an);
    o.hi.connect(o.fad);o.fad.connect(o.mute);o.mute.connect(o.pan);o.pan.connect(mix);
    /* post-pan split feeds the strip's stereo meters, so pan is visible */
    o.pan.connect(o.spl);o.spl.connect(o.anL,0);o.spl.connect(o.anR,1);
    o.hi.connect(o.pfl);o.pfl.connect(pflBus);     /* pre-fade listen */
    o.sends=[];
    for(var s=0;s<4;s++){var sg=ctx.createGain();sg.gain.value=0;   /* FX off by default */
      o.pan.connect(sg);sg.connect(dev.fxs[s].input);
      sg.connect(dev.jackNodes['aux'+(s+1)]);
      o.sends.push(sg);}
    (function(o2,ci){
      dev.p['midf'+ci]=900;
      dev.P['midf'+ci]={set:function(v){v=UI.clamp(v,150,8000);dev.p['midf'+ci]=v;
        o2.mid.frequency.setTargetAtTime(v,ctx.currentTime,.02);}};
      dev.p['midq'+ci]=.8;
      dev.P['midq'+ci]={set:function(v){v=UI.clamp(v,.3,8);dev.p['midq'+ci]=v;
        o2.mid.Q.setTargetAtTime(v,ctx.currentTime,.02);}};})(o,i);
    dev.mg.push(o.mute);dev.chs.push(o);
    dev.jackNodes['ch'+(i+1)]=o.in;}
  dev.updMS=function(){
    var any=dev.solo.indexOf(true)>=0,t=ctx.currentTime;
    for(var j=0;j<NCH;j++){
      dev.mg[j].gain.setTargetAtTime(dev.mute[j]?0:1,t,.01);
      dev.chs[j].pfl.gain.setTargetAtTime(dev.solo[j]?1:0,t,.01);}
    mix.gain.setTargetAtTime(any?0:1,t,.02);
    pflBus.gain.setTargetAtTime(any?1:0,t,.02);
    dev._pfl=any;
    if(dev.pflLed)dev.pflLed.classList.toggle('on',any);
    if(dev.masterStripEl)dev.masterStripEl.classList.toggle('pfl',any);};
  /* ---------- chassis ---------- */
  var c=UI.el('div','chassis');
  var hd=UI.el('div','pheader');
  hd.appendChild(UI.el('div','plate','HW-1<small>QU MASTER CONSOLE</small>'));
  hd.appendChild(UI.el('div','mchip','<i></i>8 CH · 4 AUX · RTA · GATE · COMP · DLY · RVB'));
  c.appendChild(hd);
  /* ---------- display: spectral analyser + interactive EQ curve
       Format adapted from the Master Beta mastering EQ: live spectrum behind
       the curve, draggable nodes, wheel = Q, dbl-click = reset. ---------- */
  var disp=UI.el('div','grp widegrp');
  var dispH=UI.el('h5',null,'PROCESSING DISPLAY · MASTER');
  disp.appendChild(dispH);
  var DPR=Math.min(window.devicePixelRatio||1,2),SH=176;
  var FMIN=20,FMAX=20000,GN=14;
  var cv=document.createElement('canvas');cv.className='scope';
  var g=cv.getContext('2d');
  var spec=new Uint8Array(256),peaks=null,pw=0;
  var rdBuf=new Float32Array(2048),rdPk=-120,rdPkT=0;
  function now0(){return A.ctx?A.ctx.currentTime:0;}
  var CN=200,cf=new Float32Array(CN),cmag=new Float32Array(CN),tmag=new Float32Array(CN),cph=new Float32Array(CN);
  for(var q0=0;q0<CN;q0++)cf[q0]=FMIN*Math.pow(FMAX/FMIN,q0/(CN-1));
  function LX(f,w){return Math.log(f/FMIN)/Math.log(FMAX/FMIN)*w;}
  function LF(x,w){return FMIN*Math.pow(FMAX/FMIN,UI.clamp(x/w,0,1));}
  function LY(db,h){return h/2-(db/GN)*(h/2-18);}
  function LG(y,h){return UI.clamp((h/2-y)/(h/2-18)*GN,-GN,GN);}
  /* nodes follow SEL: MASTER = 10 GEQ bands, a channel = its own LO/MID/HI */
  function nodesFor(src){
    var out=[],i3;
    if(src===0){
      for(i3=0;i3<10;i3++)out.push({f:A.EQF[i3],db:dev.p['eq'+i3]||0,key:'eq'+i3,sweep:false,
        lab:'GEQ BAND '+(i3+1)});
      return out;}
    var ci=src-1;if(!dev.chs[ci])return out;
    out.push({f:120,db:dev.p['lo'+ci]||0,key:'lo'+ci,sweep:false,lab:'CH'+src+' LO SHELF'});
    out.push({f:dev.p['midf'+ci]||900,db:dev.p['mid'+ci]||0,key:'mid'+ci,sweep:true,ci:ci,lab:'CH'+src+' MID'});
    out.push({f:7500,db:dev.p['hi'+ci]||0,key:'hi'+ci,sweep:false,lab:'CH'+src+' HI SHELF'});
    return out;}
  function filtsFor(src){
    if(src===0)return [dev.mEq.hp,dev.mEq.lo,dev.mEq.mid,dev.mEq.hi].concat(A.eq);
    var ch=dev.chs[src-1];return ch?[ch.hp,ch.lo,ch.mid,ch.hi]:[];}
  var srcbar=UI.el('div','srcbar');
  var sbtns=[];
  dev._srcNames.forEach(function(s2,i2){
    var b=UI.el('button','srcbtn'+(i2===0?' on':''),i2===0?'MASTER':('CH'+i2));
    b.onclick=function(){dev.setScopeSrc(i2);};
    srcbar.appendChild(b);sbtns.push(b);});
  var tip=UI.el('div','eqtip','Drag a node — the spectrum shows where the energy is');
  var dragI=-1;
  function nodeTip(n){
    if(!n)return '';
    return n.lab+' · '+(n.f>=1000?(n.f/1000).toFixed(2)+' kHz':Math.round(n.f)+' Hz')+
      ' · '+(n.db>0?'+':'')+n.db.toFixed(1)+' dB'+
      (n.sweep?' · Q '+(dev.p['midq'+n.ci]||.8).toFixed(2)+' — drag X/Y · wheel Q':' — drag Y');}
  function draw(){
    requestAnimationFrame(draw);
    if(!RS.S.powered)return;
    var w=Math.round(cv.clientWidth),h=SH;
    if(!w)return;
    if(cv.width!==Math.round(w*DPR)||cv.height!==Math.round(h*DPR)){
      cv.width=Math.round(w*DPR);cv.height=Math.round(h*DPR);}
    g.setTransform(DPR,0,0,DPR,0,0);
    var src=dev._scopeSrc||0;
    var ana=src===0?A.anaL:(dev.chs[src-1]?dev.chs[src-1].an:null);
    g.fillStyle='#05080a';g.fillRect(0,0,w,h);
    if(ana){
      if(spec.length!==ana.frequencyBinCount)spec=new Uint8Array(ana.frequencyBinCount);
      try{ana.getByteFrequencyData(spec);}catch(e){}
      var nyq=A.ctx.sampleRate/2,steps=Math.ceil(w/2)+1,s2,b,b0,b1,m,px;
      if(pw!==steps){peaks=new Float32Array(steps);pw=steps;}
      g.beginPath();g.moveTo(0,h-12);
      for(s2=0;s2<steps;s2++){
        px=s2*2;
        b0=Math.floor(LF(px,w)/nyq*spec.length);
        b1=Math.max(b0+1,Math.ceil(LF(px+2,w)/nyq*spec.length));
        m=0;for(b=b0;b<b1&&b<spec.length;b++)if(spec[b]>m)m=spec[b];
        if(m>peaks[s2])peaks[s2]=m;else peaks[s2]=Math.max(0,peaks[s2]-1.5);
        g.lineTo(px,h-12-(m/255)*(h-24));}
      g.lineTo(w,h-12);g.closePath();
      var sgr=g.createLinearGradient(0,0,0,h);
      sgr.addColorStop(0,'rgba(226,163,79,.44)');
      sgr.addColorStop(.5,'rgba(49,176,110,.26)');
      sgr.addColorStop(1,'rgba(49,176,110,.03)');
      g.fillStyle=sgr;g.fill();
      g.beginPath();
      for(s2=0;s2<steps;s2++){var py=h-12-(peaks[s2]/255)*(h-24);
        if(s2===0)g.moveTo(0,py);else g.lineTo(s2*2,py);}
      g.strokeStyle='rgba(198,228,208,.32)';g.lineWidth=1;g.stroke();}
    var FL=[31,62,125,250,500,1000,2000,4000,8000,16000];
    var FT=['31','62','125','250','500','1k','2k','4k','8k','16k'];
    g.lineWidth=1;g.font='8px "Share Tech Mono",monospace';
    g.strokeStyle='#0f1d17';g.beginPath();
    FL.forEach(function(fq){var x=LX(fq,w);g.moveTo(x,6);g.lineTo(x,h-12);});
    g.stroke();
    g.fillStyle='#3c5a48';
    FT.forEach(function(t,i2){g.fillText(t,LX(FL[i2],w)+2,h-3);});
    [-12,-6,6,12].forEach(function(db){var y=LY(db,h);
      g.strokeStyle='#101f19';g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();
      g.fillStyle='#31543f';g.fillText((db>0?'+':'')+db,3,y-2);});
    var y0=LY(0,h);
    g.strokeStyle='#1d3a2c';g.beginPath();g.moveTo(0,y0);g.lineTo(w,y0);g.stroke();
    var fl=filtsFor(src),q2;
    if(fl.length){
      for(q2=0;q2<CN;q2++)cmag[q2]=1;
      fl.forEach(function(f2){try{f2.getFrequencyResponse(cf,tmag,cph);
        for(var q3=0;q3<CN;q3++)cmag[q3]*=tmag[q3];}catch(e){}});
      g.beginPath();
      for(q2=0;q2<CN;q2++){
        var db2=UI.clamp(20*Math.log10(Math.max(cmag[q2],1e-4)),-GN,GN);
        var x2=LX(cf[q2],w),y2=LY(db2,h);
        if(q2===0)g.moveTo(x2,y2);else g.lineTo(x2,y2);}
      g.strokeStyle='#e2a34f';g.lineWidth=2;
      g.shadowColor='rgba(226,163,79,.55)';g.shadowBlur=7;g.stroke();g.shadowBlur=0;
      /* shade the curve against the flat line so cut and boost read at a glance */
      g.lineTo(LX(cf[CN-1],w),y0);g.lineTo(LX(cf[0],w),y0);g.closePath();
      var cg=g.createLinearGradient(0,0,0,h);
      cg.addColorStop(0,'rgba(226,163,79,.20)');
      cg.addColorStop(.5,'rgba(226,163,79,.07)');
      cg.addColorStop(1,'rgba(226,163,79,.20)');
      g.fillStyle=cg;g.fill();}
    var ns=nodesFor(src);
    ns.forEach(function(n,i2){
      var x3=LX(n.f,w),y3=LY(UI.clamp(n.db,-GN,GN),h);
      var rr=dragI===i2?8:6;
      g.beginPath();g.moveTo(x3,y0);g.lineTo(x3,y3);
      g.strokeStyle='rgba(226,163,79,.28)';g.lineWidth=1;g.stroke();
      g.beginPath();g.arc(x3,y3,rr,0,7);
      g.fillStyle=n.sweep?'#7ddc82':'hsl('+(96+i2*11)+',48%,'+(dragI===i2?70:56)+'%)';
      g.fill();g.strokeStyle='#05080a';g.lineWidth=2;g.stroke();
      g.fillStyle='#05080a';g.font='bold 7px "Share Tech Mono",monospace';
      g.textAlign='center';g.textBaseline='middle';
      g.fillText(String(i2+1),x3,y3+.5);
      g.textAlign='left';g.textBaseline='alphabetic';});
    /* dB ruler down the right edge */
    g.font='7px "Share Tech Mono",monospace';g.textAlign='right';
    [12,6,0,-6,-12].forEach(function(db){
      g.fillStyle=db===0?'#5f8a70':'#31543f';
      g.fillText((db>0?'+':'')+db,w-3,LY(db,h)-2);});
    g.textAlign='left';
    /* level readout: peak, RMS and the VU equivalent, so the needles and the
       numbers can be checked against each other */
    if(src===0){
      try{
        A.anaL.getFloatTimeDomainData(rdBuf);
        var N=Math.min(A.anaL.fftSize,rdBuf.length),q=0,pmax=0;
        for(var z=0;z<N;z++){var vv=rdBuf[z];q+=vv*vv;if(Math.abs(vv)>pmax)pmax=Math.abs(vv);}
        var rmsD=20*Math.log10(Math.sqrt(q/N)+1e-9),pkD=20*Math.log10(pmax+1e-9);
        if(pkD>rdPk||now0()-rdPkT>1.4){rdPk=pkD;rdPkT=now0();}
        g.font='8px "Share Tech Mono",monospace';
        g.fillStyle=rdPk>-1?'#ff5f4d':'#7fa88c';
        g.fillText('PK '+(rdPk<-99?'--':rdPk.toFixed(1)),w-96,15);
        g.fillStyle='#7fa88c';
        g.fillText('RMS '+(rmsD<-99?'--':rmsD.toFixed(1)),w-96,25);
        var vuv=rmsD+12;
        g.fillStyle=vuv>0?'#e2a34f':'#7fa88c';
        g.fillText('VU '+(vuv<-99?'--':(vuv>0?'+':'')+vuv.toFixed(1)),w-96,35);
      }catch(e){}}
    g.fillStyle='#a9d89a';g.font='11px "Share Tech Mono",monospace';
    g.fillText((src===0?'MASTER':(dev._srcNames[src]||'CH '+src))+' · RTA POST-EQ',8,15);
  }
  requestAnimationFrame(draw);
  function hit(e){
    var r=cv.getBoundingClientRect(),w=r.width,h=SH;
    var px=e.clientX-r.left,py=e.clientY-r.top;
    var ns=nodesFor(dev._scopeSrc||0);
    for(var i2=0;i2<ns.length;i2++){
      var dx=px-LX(ns[i2].f,w),dy=py-LY(UI.clamp(ns[i2].db,-GN,GN),h);
      if(dx*dx+dy*dy<256)return{i:i2,n:ns[i2],px:px,py:py,w:w,h:h};}
    return{i:-1,px:px,py:py,w:w,h:h};}
  function applyNode(n,hh){
    if(dev.P[n.key])dev.P[n.key].set(LG(hh.py,hh.h));
    if(n.sweep&&dev.P['midf'+n.ci])dev.P['midf'+n.ci].set(LF(hh.px,hh.w));
    if(dev.refreshBands)dev.refreshBands();}
  cv.addEventListener('pointerdown',function(e){
    var hh=hit(e);if(hh.i<0)return;
    e.preventDefault();dragI=hh.i;
    try{cv.setPointerCapture(e.pointerId);}catch(_){}
    applyNode(hh.n,hh);tip.textContent=nodeTip(nodesFor(dev._scopeSrc||0)[dragI]);});
  cv.addEventListener('pointermove',function(e){
    var hh=hit(e);
    if(dragI>=0){
      var n=nodesFor(dev._scopeSrc||0)[dragI];
      if(!n){dragI=-1;return;}
      applyNode(n,hh);
      tip.textContent=nodeTip(nodesFor(dev._scopeSrc||0)[dragI]);
      cv.style.cursor='grabbing';return;}
    cv.style.cursor=hh.i>=0?'grab':'crosshair';
    tip.textContent=hh.i>=0?nodeTip(hh.n):'Drag a node — the spectrum shows where the energy is';});
  cv.addEventListener('pointerup',function(){dragI=-1;cv.style.cursor='crosshair';});
  cv.addEventListener('pointercancel',function(){dragI=-1;});
  cv.addEventListener('wheel',function(e){
    var hh=hit(e);if(hh.i<0||!hh.n.sweep)return;
    e.preventDefault();
    var cur=dev.p['midq'+hh.n.ci]||.8;
    if(dev.P['midq'+hh.n.ci])dev.P['midq'+hh.n.ci].set(cur*(e.deltaY>0?.88:1.14));
    tip.textContent=nodeTip(nodesFor(dev._scopeSrc||0)[hh.i]);},{passive:false});
  cv.addEventListener('dblclick',function(e){
    var hh=hit(e);if(hh.i<0)return;
    if(dev.P[hh.n.key])dev.P[hh.n.key].set(0);
    if(dev.refreshBands)dev.refreshBands();
    tip.textContent=nodeTip(nodesFor(dev._scopeSrc||0)[hh.i]);});
  var scopewrap=UI.el('div','scopewrap');
  scopewrap.appendChild(cv);
  scopewrap.appendChild(tip);
  scopewrap.appendChild(srcbar);
  disp.appendChild(scopewrap);
  /* ---------- band sliders (follow SEL) + venue simulation, side by side ---- */
  var eqwrap=UI.el('div','eqwrap');
  var eqleft=UI.el('div','eqleft');
  var eqrow=UI.el('div','eqrow');
  var eqpre=UI.el('div','stprow');eqpre.style.justifyContent='center';
  eqleft.append(eqrow,eqpre);
  /* master GEQ sliders are built once — they own dev.p.eq0..9 */
  var geq=[];
  for(var e1=0;e1<10;e1++)geq.push(UI.eqSlider(dev,e1));
  var bandCache={};
  function buildBands(src){
    eqrow.innerHTML='';eqpre.innerHTML='';
    if(src===0){
      geq.forEach(function(el){eqrow.appendChild(el);});
      Object.keys(EQP).forEach(function(nm){
        var b=UI.el('button','stpb wide',nm);
        b.onclick=function(){EQP[nm].forEach(function(db,i2){dev.P['eq'+i2].set(db);});
          if(dev.refreshBands)dev.refreshBands();UI.toast('MASTER GEQ · '+nm);};
        eqpre.appendChild(b);});
      return;}
    var ci=src-1;
    if(!bandCache[ci])bandCache[ci]=[
      UI.bandSlider(dev,{id:'hpf'+ci,label:'HPF',min:20,max:400,log:1,def:20}),
      UI.bandSlider(dev,{id:'lo'+ci,label:'LO',min:-12,max:12,def:0}),
      UI.bandSlider(dev,{id:'mid'+ci,label:'MID',min:-12,max:12,def:0}),
      UI.bandSlider(dev,{id:'midf'+ci,label:'FREQ',min:150,max:8000,log:1,def:900}),
      UI.bandSlider(dev,{id:'midq'+ci,label:'Q',min:.3,max:8,log:1,def:.8}),
      UI.bandSlider(dev,{id:'hi'+ci,label:'HI',min:-12,max:12,def:0})];
    bandCache[ci].forEach(function(el){el.refresh();eqrow.appendChild(el);});
    var fb=UI.el('button','stpb wide','FLAT');
    fb.onclick=function(){dev.P['lo'+ci].set(0);dev.P['mid'+ci].set(0);dev.P['hi'+ci].set(0);
      dev.P['hpf'+ci].set(20);dev.P['midf'+ci].set(900);dev.P['midq'+ci].set(.8);
      dev.refreshBands();UI.toast('CH'+src+' EQ flat');};
    eqpre.appendChild(fb);}
  dev.refreshBands=function(){
    var src=dev._scopeSrc||0;
    if(src===0)return;
    var arr=bandCache[src-1];
    if(arr)arr.forEach(function(el){el.refresh();});};
  var venbox=UI.el('div','venbox');
  venbox.appendChild(UI.el('div','kl2','VENUE SIMULATION'));
  var vgrid=UI.el('div','vgrid');
  Object.keys(VENUES).forEach(function(nm){
    var b=UI.el('button','stpb wide',nm);
    b.onclick=function(){try{
      var v=VENUES[nm];
      v.eq.forEach(function(db,i2){dev.P['eq'+i2].set(db);});
      dev.P.rsize.set(v.rt60);dev.P.rpre.set(v.pre);dev.P.rdamp.set(v.damp);
      dev.P.rer.set(v.er);dev.P.rlocut.set(v.locut);
      dev.P.rtone.set(UI.clamp(v.damp*1.15,800,14000));
      dev.P.rmix.set(v.wet);dev.P.rOn.set(1);
      if(v.slap){dev.P.dOn.set(1);dev.P.dtime.set(v.slap[0]);dev.P.dfb.set(v.slap[1]);
        dev.P.dmix.set(v.slap[2]);dev.P.dtone.set(UI.clamp(v.damp*.8,500,12000));}
      else{dev.P.dOn.set(0);dev.P.dmix.set(0);}
      dev.P.cth.set(v.cth);dev.P.crat.set(v.crat);dev.P.mvol.set(v.vol);
      clearTimeout(A.irT);A.mkIR(v.rt60,{pre:v.pre,damp:v.damp,er:v.er});
      if(dev.refreshBands)dev.refreshBands();
      UI.toast('VENUE · '+nm+' — RT60 '+v.rt60.toFixed(2)+'s · pre-delay '+v.pre+'ms'+
        (v.slap?' · slap '+Math.round(v.slap[0]*1000)+'ms':' · no discrete slap')+' · wet '+Math.round(v.wet*100)+'%');
    }catch(err){UI.toast('Venue error: '+err.message);}};
    vgrid.appendChild(b);});
  venbox.appendChild(vgrid);
  eqwrap.append(eqleft,venbox);
  disp.appendChild(eqwrap);
  /* ---------- transport + BPM engine window ---------- */
  var tg=UI.el('div','grp trgrp');
  tg.appendChild(UI.el('h5',null,'TRANSPORT · TEMPO ENGINE'));
  var trow=UI.el('div','trow');
  var bp=UI.el('button','trbtn play','<svg viewBox="0 0 16 16"><path d="M4.5 2.6v10.8l8.6-5.4z"/></svg>');
  var bs=UI.el('button','trbtn stop','<svg viewBox="0 0 16 16"><rect x="3.6" y="3.6" width="8.8" height="8.8" rx="1.2"/></svg>');
  bp.onclick=function(){RS.play();};bs.onclick=function(){RS.stop();};
  dev.btnPlay=bp;
  var trbtns=UI.el('div','trbtns');trbtns.append(bp,bs);
  var lcd=UI.el('div','biglcd','<div class="l1"></div><div class="l2"></div>');
  dev.l1=lcd.querySelector('.l1');dev.l2=lcd.querySelector('.l2');
  trow.append(trbtns,lcd);
  tg.appendChild(trow);
  var brow=UI.el('div','gwrap');
  var nud=UI.el('div','stpr');nud.appendChild(UI.el('div','kl2','NUDGE'));
  var nrow=UI.el('div','stprow');
  [['&#8722;10',-10],['&#8722;1',-1],['+1',1],['+10',10]].forEach(function(p){
    var b=UI.el('button','stpb',p[0]);
    b.onclick=function(){RS.S.bpm=UI.clamp(RS.S.bpm+p[1],60,200);dev.P.bpm.set(RS.S.bpm,false);dev.lcd();};
    nrow.appendChild(b);});
  nud.appendChild(nrow);brow.appendChild(nud);
  brow.appendChild(UI.kn(dev,{id:'bpm',label:'BPM',min:60,max:200,def:124,fmt:'bpm',ap:function(v){RS.S.bpm=Math.round(v);dev.lcd();}}));
  var taps=[];
  var ttp=UI.el('div','stpr');ttp.appendChild(UI.el('div','kl2','TAP'));
  var trw=UI.el('div','stprow');
  var tb=UI.el('button','stpb wide','TAP');
  tb.onclick=function(){var n=performance.now();
    if(taps.length&&n-taps[taps.length-1]>1800)taps.length=0;
    taps.push(n);if(taps.length>4)taps.shift();
    if(taps.length>=2){var avg=(taps[taps.length-1]-taps[0])/(taps.length-1);
      RS.S.bpm=UI.clamp(Math.round(60000/avg),60,200);
      dev.P.bpm.set(RS.S.bpm,false);dev.lcd();}};
  trw.appendChild(tb);ttp.appendChild(trw);brow.appendChild(ttp);
  brow.appendChild(UI.kn(dev,{id:'swing',label:'SWING',min:0,max:60,def:RS.S.swing,fmt:'pc',ap:function(v){RS.S.swing=v;}}));
  tg.appendChild(brow);
  /* ---------- MASTER strip, alongside the tempo engine ---------- */
  var mst=UI.el('div','strip mstrip');
  var mbr=UI.el('div','qbtnrow');
  var msel=UI.el('button','qbtn g on','SEL');
  msel.onclick=function(){dev.setScopeSrc(0);};
  var mpfl=UI.el('button','qbtn y pflind','PFL');
  mpfl.title='Lit while any channel PFL is engaged — click to clear all';
  mpfl.onclick=function(){for(var j=0;j<NCH;j++)if(dev.solo[j])dev.P['pfl'+j].set(0);};
  dev.pflLed=mpfl;
  mbr.append(msel,mpfl);mst.appendChild(mbr);
  mst.appendChild(UI.el('div','sname','MASTER LR'));
  var mtwo=UI.el('div');mtwo.style.cssText='display:flex;gap:6px';
  var mc1=UI.el('div','vcol'),mc2=UI.el('div','vcol');
  mc1.appendChild(UI.kn(dev,{id:'mgain',label:'GAIN',min:0,max:2,def:1,size:24,fmt:'x',ap:function(v){mGain.gain.setTargetAtTime(v,ctx.currentTime,.02);}}));
  mc1.appendChild(UI.kn(dev,{id:'mhpf',label:'HPF',min:20,max:400,def:20,log:1,size:24,fmt:'hz',ap:function(v){mHp.frequency.setTargetAtTime(v,ctx.currentTime,.02);}}));
  mc1.appendChild(UI.kn(dev,{id:'mhi',label:'HI',min:-12,max:12,def:0,size:24,fmt:'db',ap:function(v){mHi.gain.setTargetAtTime(v,ctx.currentTime,.02);}}));
  mc1.appendChild(UI.kn(dev,{id:'mmid',label:'MID',min:-12,max:12,def:0,size:24,fmt:'db',ap:function(v){mMid.gain.setTargetAtTime(v,ctx.currentTime,.02);}}));
  mc1.appendChild(UI.kn(dev,{id:'mlo',label:'LO',min:-12,max:12,def:0,size:24,fmt:'db',ap:function(v){mLo.gain.setTargetAtTime(v,ctx.currentTime,.02);}}));
  mc2.appendChild(UI.kn(dev,{id:'mpan',label:'PAN',min:-1,max:1,def:0,size:24,fmt:'pan',ap:function(v){mPan.pan.setTargetAtTime(v,ctx.currentTime,.02);}}));
  /* master sends to the four transport FX units — the same wet amounts the
     modules expose, kept in sync both ways */
  [['mfxg','GATE','gmix',1],['mfxc','COMP','cmix',1],['mfxd','DLY','dmix',.18],['mfxr','RVB','rmix',.22]]
   .forEach(function(fx){
    mc2.appendChild(UI.kn(dev,{id:fx[0],label:fx[1],min:0,max:1,def:fx[3],size:24,fmt:'pc',
      ap:function(v){if(dev.P[fx[2]])dev.P[fx[2]].set(v);}}));});
  mtwo.append(mc1,mc2);mst.appendChild(mtwo);
  var mfw=UI.el('div','fadrow');
  var mf=UI.fad(dev,{id:'mvol',label:'MAIN',def:.82,max:1.2,ap:function(v){A.gain.gain.setTargetAtTime(v,ctx.currentTime,.02);}});
  dev.mmL=UI.meter();dev.mmR=UI.meter();
  mfw.append(mf.querySelector('.ftrack'),dev.mmL.el,dev.mmR.el);
  mst.appendChild(mfw);
  dev.masterStripEl=mst;
  /* ---------- master VU meters — needle, true VU ballistics ---------- */
  var vuw=UI.el('div','grp vublock');
  vuw.appendChild(UI.el('h5',null,'MASTER VU · K-12 · 0 VU = &minus;12 dBFS'));
  var vuCv=document.createElement('canvas');vuCv.className='vucv';
  vuw.appendChild(vuCv);
  var vg=vuCv.getContext('2d');
  /* 0 VU = -12 dBFS (K-12). The old -18 broadcast alignment put a normal
     club mix permanently past the red line even when the peak meters were
     nowhere near clipping. */
  var VUREF=12;
  var vuBuf=new Float32Array(1024),vuV=[-20,-20],vuPk=[-20,-20];
  function rmsDb(ana){
    try{ana.getFloatTimeDomainData(vuBuf);}catch(e){return -60;}
    var n=Math.min(ana.fftSize,vuBuf.length),sum=0;
    for(var i=0;i<n;i++)sum+=vuBuf[i]*vuBuf[i];
    return 20*Math.log10(Math.sqrt(sum/n)+1e-7);}
  function vuFace(k,x,w,h){
    var cx=x+w/2,cy=h-13,R=Math.min(w*.44,h-28);
    var A0=-52*Math.PI/180,A1=52*Math.PI/180;
    function ang(v){return A0+(UI.clamp(v,-20,3)+20)/23*(A1-A0)-Math.PI/2;}
    vg.fillStyle='#e6dcbe';vg.strokeStyle='#0d0e11';vg.lineWidth=1;
    vg.beginPath();vg.rect(x+.5,4.5,w-1,h-9);vg.fill();vg.stroke();
    vg.beginPath();vg.arc(cx,cy,R,ang(-20),ang(0));
    vg.strokeStyle='#2a2a26';vg.lineWidth=1.3;vg.stroke();
    vg.beginPath();vg.arc(cx,cy,R,ang(0),ang(3));
    vg.strokeStyle='#bf3b2b';vg.lineWidth=2.6;vg.stroke();
    vg.font='6px "Share Tech Mono",monospace';vg.textAlign='center';
    [-20,-10,-7,-5,-3,-1,0,1,2,3].forEach(function(v){
      var a=ang(v);
      vg.beginPath();
      vg.moveTo(cx+Math.cos(a)*(R-4),cy+Math.sin(a)*(R-4));
      vg.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);
      vg.strokeStyle=v>=0?'#bf3b2b':'#2a2a26';vg.lineWidth=1;vg.stroke();
      if(v===-20||v===-10||v===-5||v===0||v===3){
        vg.fillStyle=v>=0?'#bf3b2b':'#2a2a26';
        vg.fillText(v>0?'+'+v:String(v),cx+Math.cos(a)*(R-11),cy+Math.sin(a)*(R-11)+2);}});
    var na=ang(vuV[k]);
    vg.beginPath();vg.moveTo(cx,cy);
    vg.lineTo(cx+Math.cos(na)*(R-1),cy+Math.sin(na)*(R-1));
    vg.strokeStyle='#15161a';vg.lineWidth=1.5;vg.stroke();
    vg.beginPath();vg.arc(cx,cy,2.8,0,7);vg.fillStyle='#15161a';vg.fill();
    vg.fillStyle='#6b6455';vg.font='7px "Share Tech Mono",monospace';
    vg.fillText('VU',cx,h-3);
    vg.fillStyle='#2a2a26';vg.fillText(k?'R':'L',x+9,14);
    vg.beginPath();vg.arc(x+w-10,12,3,0,7);
    vg.fillStyle=vuPk[k]>0?'#ff4a35':'#a89f8a';vg.fill();
    vg.strokeStyle='#0d0e11';vg.lineWidth=.8;vg.stroke();}
  function vuTick(){
    var t=[rmsDb(A.anaL)+VUREF,rmsDb(A.anaR)+VUREF];
    for(var k=0;k<2;k++){
      var v=UI.clamp(Number.isFinite(t[k])?t[k]:-20,-24,6);
      vuV[k]+=(v-vuV[k])*.22;                    /* ~300 ms to 99%, VU spec */
      if(vuV[k]>vuPk[k])vuPk[k]=vuV[k];else vuPk[k]-=.05;}
    var W=Math.round(vuCv.clientWidth),H=94;
    if(!W)return;
    if(vuCv.width!==Math.round(W*DPR)||vuCv.height!==Math.round(H*DPR)){
      vuCv.width=Math.round(W*DPR);vuCv.height=Math.round(H*DPR);}
    vg.setTransform(DPR,0,0,DPR,0,0);
    vg.clearRect(0,0,W,H);
    var mw=(W-4)/2;
    vuFace(0,0,mw,H);vuFace(1,mw+4,mw,H);}
  var topline=UI.el('div','topline');
  topline.append(tg,vuw);
  /* ---------- FX rack modules — 2x2 grid under the transport ---------- */
  var fxgrid=UI.el('div','fxgrid');
  function mod(name,controls){
    var m=UI.el('div','fxmod');
    m.appendChild(UI.el('div','fxname',name));
    var gw=UI.el('div','gwrap');
    controls.forEach(function(ct){gw.appendChild(UI.ctl(dev,ct));});
    m.appendChild(gw);fxgrid.appendChild(m);}
  var glc=UI.el('div');glc.style.cssText='display:flex;flex-direction:column;align-items:center;width:26px';
  glc.innerHTML='<div class="gled"></div><div style="font-size:8px;color:#7c828c;margin-top:6px">OPEN</div>';
  dev.gateLed=glc.querySelector('.gled');
  var grc=UI.el('div');grc.style.cssText='display:flex;flex-direction:column;align-items:center;gap:3px;width:26px';
  dev.grm=UI.gr();grc.appendChild(dev.grm.el);
  var grl=UI.el('div','kl','GR');grl.style.fontSize='8px';grl.style.color='#7c828c';grc.appendChild(grl);
  mod('GATE',[
    {t:'st',id:'gOn',label:'POWER',opts:[{t:'ON',v:1},{t:'OFF',v:0}],def:0,ap:function(){A.applyMFX(RS.S.hw.p);}},
    {t:'k',id:'gth',label:'THRESH',min:-80,max:-10,def:-55,fmt:'db'},
    {t:'k',id:'gdec',label:'DECAY',min:.03,max:1,def:.14,fmt:'ms'},
    {t:'k',id:'gmix',label:'MIX',min:0,max:1,def:1,fmt:'pc',ap:function(v){A.applyMFX(RS.S.hw.p);if(dev.P.mfxg)dev.P.mfxg.set(v,false);}},
    {t:'cus',fn:function(){return glc;}}]);
  mod('COMP',[
    {t:'st',id:'cOn',label:'POWER',opts:[{t:'ON',v:1},{t:'OFF',v:0}],def:0,ap:function(){A.applyMFX(RS.S.hw.p);}},
    {t:'k',id:'cth',label:'THRESH',min:-60,max:0,def:-22,fmt:'db',ap:function(v){A.comp.threshold.setTargetAtTime(v,ctx.currentTime,.02);A.smooth(A.compMk.gain,A.compTrim(v,dev.p.crat||4),.03);}},
    {t:'k',id:'crat',label:'RATIO',min:1.5,max:16,def:4,log:1,fmt:'ratio',ap:function(v){A.comp.ratio.setTargetAtTime(v,ctx.currentTime,.02);A.smooth(A.compMk.gain,A.compTrim(dev.p.cth||-22,v),.03);}},
    {t:'k',id:'cmix',label:'MIX',min:0,max:1,def:1,fmt:'pc',ap:function(v){A.applyMFX(RS.S.hw.p);if(dev.P.mfxc)dev.P.mfxc.set(v,false);}},
    {t:'cus',fn:function(){return grc;}}]);
  mod('DELAY',[
    {t:'st',id:'dOn',label:'POWER',opts:[{t:'ON',v:1},{t:'OFF',v:0}],def:0,ap:function(){A.applyMFX(RS.S.hw.p);}},
    {t:'k',id:'dtime',label:'TIME',min:.06,max:1,def:.28,log:1,fmt:'ms',ap:function(v){A.dL.delayTime.setTargetAtTime(v,ctx.currentTime,.05);A.dR.delayTime.setTargetAtTime(v,ctx.currentTime,.05);}},
    {t:'k',id:'dfb',label:'FEEDBK',min:0,max:.85,def:.38,fmt:'pc',ap:function(v){A.dFb.gain.setTargetAtTime(v,ctx.currentTime,.05);}},
    {t:'k',id:'dtone',label:'TONE',min:500,max:12000,def:5500,log:1,fmt:'hz',ap:function(v){A.dTone.frequency.setTargetAtTime(v,ctx.currentTime,.05);}},
    {t:'k',id:'dmix',label:'MIX',min:0,max:1,def:.18,fmt:'pc',ap:function(v){A.applyMFX(RS.S.hw.p);if(dev.P.mfxd)dev.P.mfxd.set(v,false);}}]);
  /* reverb tone + send low-cut stay as parameters the venues drive; the panel
     keeps four knobs so it sits level with the other three modules */
  dev.p.rtone=6500;
  dev.P.rtone={set:function(v){v=UI.clamp(v,800,14000);dev.p.rtone=v;
    A.rTone.frequency.setTargetAtTime(v,ctx.currentTime,.05);}};
  dev.p.rlocut=140;
  dev.P.rlocut={set:function(v){v=UI.clamp(v,20,400);dev.p.rlocut=v;
    A.rHP.frequency.setTargetAtTime(v,ctx.currentTime,.05);}};
  dev.p.rer=.5;
  dev.P.rer={set:function(v){dev.p.rer=UI.clamp(v,0,1);irBuild();}};
  function irBuild(){clearTimeout(A.irT);A.irT=setTimeout(function(){
    try{A.mkIR(dev.p.rsize,{pre:dev.p.rpre,damp:dev.p.rdamp,er:dev.p.rer});}catch(e){}},220);}
  mod('REVERB',[
    {t:'st',id:'rOn',label:'POWER',opts:[{t:'ON',v:1},{t:'OFF',v:0}],def:0,ap:function(){A.applyMFX(RS.S.hw.p);}},
    {t:'k',id:'rsize',label:'RT60',min:.2,max:8,def:2.2,log:1,fmt:'ms',ap:irBuild},
    {t:'k',id:'rpre',label:'PRE-DLY',min:0,max:160,def:18,fmt:function(v){return Math.round(v)+'ms';},ap:irBuild},
    {t:'k',id:'rdamp',label:'DAMP',min:1500,max:14000,def:6000,log:1,fmt:'hz',ap:irBuild},
    {t:'k',id:'rmix',label:'MIX',min:0,max:1,def:.22,fmt:'pc',ap:function(v){A.applyMFX(RS.S.hw.p);if(dev.P.mfxr)dev.P.mfxr.set(v,false);}}]);
  var hwleft=UI.el('div','hwcol');
  hwleft.append(topline,fxgrid);
  var hwtop=UI.el('div','hwtop');
  hwtop.append(hwleft,disp);
  c.appendChild(hwtop);
  /* ---------- channel bank ---------- */
  function chStrip(i2){
    var ch=dev.chs[i2];
    var st=UI.el('div','strip');
    var br=UI.el('div','qbtnrow');
    var sel=UI.el('button','qbtn g','SEL');
    var mut=UI.el('button','qbtn r','MUTE');
    var pfl=UI.el('button','qbtn y','PFL');
    sel.onclick=function(){dev.setScopeSrc(i2+1);};
    dev._selBtns[i2]=sel;
    dev.p['mute'+i2]=0;
    dev.P['mute'+i2]={set:function(v){v=v?1:0;dev.p['mute'+i2]=v;dev.mute[i2]=!!v;
      mut.classList.toggle('on',!!v);dev.updMS();}};
    dev.p['pfl'+i2]=0;
    dev.P['pfl'+i2]={set:function(v){v=v?1:0;dev.p['pfl'+i2]=v;dev.solo[i2]=!!v;
      pfl.classList.toggle('on',!!v);dev.updMS();}};
    mut.onclick=function(){dev.P['mute'+i2].set(dev.mute[i2]?0:1);};
    pfl.onclick=function(){dev.P['pfl'+i2].set(dev.solo[i2]?0:1);};
    br.append(sel,mut,pfl);st.appendChild(br);
    st.appendChild(UI.el('div','sname','CH '+(i2+1)));
    var two=UI.el('div');two.style.cssText='display:flex;gap:6px';
    var c1=UI.el('div','vcol'),c2=UI.el('div','vcol');
    c1.appendChild(UI.kn(dev,{id:'gain'+i2,label:'GAIN',min:0,max:2,def:1,size:24,fmt:'x',ap:function(v){ch.gn.gain.setTargetAtTime(v,ctx.currentTime,.02);}}));
    c1.appendChild(UI.kn(dev,{id:'hpf'+i2,label:'HPF',min:20,max:400,def:20,log:1,size:24,fmt:'hz',ap:function(v){ch.hp.frequency.setTargetAtTime(v,ctx.currentTime,.02);dev.refreshBands&&dev.refreshBands();}}));
    c1.appendChild(UI.kn(dev,{id:'hi'+i2,label:'HI',min:-12,max:12,def:0,size:24,fmt:'db',ap:function(v){ch.hi.gain.setTargetAtTime(v,ctx.currentTime,.02);dev.refreshBands&&dev.refreshBands();}}));
    c1.appendChild(UI.kn(dev,{id:'mid'+i2,label:'MID',min:-12,max:12,def:0,size:24,fmt:'db',ap:function(v){ch.mid.gain.setTargetAtTime(v,ctx.currentTime,.02);dev.refreshBands&&dev.refreshBands();}}));
    c1.appendChild(UI.kn(dev,{id:'lo'+i2,label:'LO',min:-12,max:12,def:0,size:24,fmt:'db',ap:function(v){ch.lo.gain.setTargetAtTime(v,ctx.currentTime,.02);dev.refreshBands&&dev.refreshBands();}}));
    c2.appendChild(UI.kn(dev,{id:'pan'+i2,label:'PAN',min:-1,max:1,def:0,size:24,fmt:'pan',ap:function(v){ch.pan.pan.setTargetAtTime(v,ctx.currentTime,.02);}}));
    ch.sends.forEach(function(sg3,si){
      c2.appendChild(UI.kn(dev,{id:'s'+si+'_'+i2,label:'AUX'+(si+1),min:0,max:1,def:0,size:24,fmt:'pc',
        ap:function(v){sg3.gain.setTargetAtTime(v,ctx.currentTime,.02);}}));});
    two.append(c1,c2);st.appendChild(two);
    var mtL=UI.meter(),mtR=UI.meter();
    dev.meters.push([mtL,mtR]);
    var fw=UI.el('div','fadrow');
    var fd=UI.fad(dev,{id:'fdr'+i2,label:'CH '+(i2+1),def:.62,ap:function(v){ch.fad.gain.setTargetAtTime(v,ctx.currentTime,.02);}});
    fw.append(fd.querySelector('.ftrack'),mtL.el,mtR.el);st.appendChild(fw);
    return st;}
  dev._selBtns=[];
  var bank=UI.el('div','grp');
  bank.appendChild(UI.el('h5','CHANNEL BANK · INPUTS 1&ndash;'+NCH+' + MASTER LR'));
  var strips=UI.el('div','strips');
  for(i=0;i<NCH;i++){var st2=chStrip(i);dev.stripEls.push(st2);strips.appendChild(st2);}
  strips.appendChild(mst);
  bank.appendChild(strips);
  c.appendChild(bank);
  /* ---------- aux FX rack ---------- */
  var fxct=[];
  for(var bi=1;bi<=4;bi++){
    (function(bi){
      var fx=dev.fxs[bi-1];
      fxct.push({t:'sel',id:'fxt'+bi,label:'AUX '+bi,opts:A.FXTYPES.map(function(t){return{v:t,t:t};}),def:defT[bi-1],
        ap:function(v){try{fx.setType(v);UI.toast('AUX '+bi+' · '+v);}catch(e){UI.toast('FX error: '+e.message);}}});
      fxct.push({t:'k',id:'fxa'+bi,label:'AMOUNT',min:0,max:1,def:.5,fmt:'pc',ap:function(v){fx.setAmount(v);}});
      fxct.push({t:'k',id:'fxm'+bi,label:'MIX',min:0,max:1,def:.3,fmt:'pc',ap:function(v){fx.setMix(v);}});
      fxct.push({t:'k',id:'fxr'+bi,label:'RETURN',min:0,max:1.2,def:.8,fmt:'pc',
        ap:function(v){dev.retG[bi-1].gain.setTargetAtTime(v,ctx.currentTime,.02);}});
    })(bi);}
  c.appendChild(UI.panels(dev,[{title:'FX RACK · AUX 1&ndash;4 SEND / RETURN (POST-FADER, POST-MUTE)',controls:fxct}]));
  dev.chassis=c;
  /* ---------- scope source + labels + tick ---------- */
  dev._scopeSrc=0;
  function srcLabel(i2){
    var n=dev._srcNames[i2]||('CH '+i2);
    return n==='CH '+i2?('CH'+i2):('CH'+i2+' · '+n);}
  dev.setScopeSrc=function(i2){
    i2=UI.clamp(i2|0,0,NCH);
    dev._scopeSrc=i2;
    sbtns.forEach(function(b,j){b.classList.toggle('on',j===i2);});
    dev.stripEls.forEach(function(s,j){s.classList.toggle('sel',j===i2-1);});
    if(dev._selBtns)dev._selBtns.forEach(function(b,j){if(b)b.classList.toggle('on',j===i2-1);});
    if(msel)msel.classList.toggle('on',i2===0);
    if(dev.masterStripEl)dev.masterStripEl.classList.toggle('sel',i2===0);
    dispH.textContent='PROCESSING DISPLAY · '+(i2===0?'MASTER':srcLabel(i2));
    buildBands(i2);};
  dev.updateLabels=function(){
    for(var i2=0;i2<NCH;i2++){
      var cb=RS.S.cables.find(function(c2){return c2.kind==='audio'&&c2.to.dev===dev.id&&c2.to.jack==='ch'+(i2+1);});
      var src=cb&&RS.byId(cb.from.dev);
      dev._srcNames[i2+1]=src?src.name:'CH '+(i2+1);
      if(dev.stripEls[i2]){var sn=dev.stripEls[i2].querySelector('.sname');
        if(sn)sn.textContent=src?src.name:'CH '+(i2+1);}}
    if(dev._scopeSrc>0)dispH.textContent='PROCESSING DISPLAY · '+srcLabel(dev._scopeSrc);};
  dev.tick=function(){
    var now=A.ctx.currentTime;
    var p=dev.p;
    var db=A.dbOf(A.gateAna);
    if(!dev._gOpen&&db>p.gth)dev._gOpen=true;
    else if(dev._gOpen&&db<p.gth-8)dev._gOpen=false;
    A.gateG.gain.setTargetAtTime(dev._gOpen?1:0,now,Math.max(p.gdec/3,.012));
    dev.gateLed.classList.toggle('on',dev._gOpen);
    var red=A.comp.reduction;
    dev.grm.set(Number.isFinite(red)?red:0);
    dev.mmL.set(A.dbOf(A.anaL));dev.mmR.set(A.dbOf(A.anaR));
    dev.chs.forEach(function(ch,i2){var m=dev.meters[i2];
      if(m){m[0].set(A.dbOf(ch.anL));m[1].set(A.dbOf(ch.anR));}});
    try{vuTick();}catch(e){}};
  dev.lcd=function(){var vc=0;RS.S.devices.forEach(function(d){if(d.voices)vc+=d.voices.size;});
    dev.l1.innerHTML=RS.S.bpm+' BPM <span class="amber">'+(RS.S.playing?'&#9654; RUNNING':'&#9632; STOPPED')+'</span>';
    dev.l2.textContent='MASTER FX · SWING '+Math.round(RS.S.swing)+'% · VOICES '+vc;};
  buildBands(0);
  dev.lcd();
},
back:[
  {title:'CHANNEL IN 1-8',jacks:[1,2,3,4,5,6,7,8].map(function(n){return['ch'+n,'in','audio',null,'CH'+n];})},
  {title:'AUX SEND',jacks:[1,2,3,4].map(function(n){return['aux'+n,'out','audio',null,'AUX'+n];})},
  {title:'AUX RETURN',jacks:[1,2,3,4].map(function(n){return['ret'+n,'in','audio',null,'RET'+n];})},
  {title:'DIRECT BUS',jacks:[['in','in','audio',null,'BUS IN']]}]});

/* ============ IN-2 live input — mic / line / interface ============ */
RS.dev('input',{name:'IN-2',sub:'LIVE INPUT · MIC / LINE',accent:'#8ab4ff',
build:function(dev){
  var A=RS.A,UI=RS.UI,ctx=A.ctx;
  dev.raw=ctx.createGain();dev.raw.gain.value=0;      /* muted until armed */
  dev.trim=ctx.createGain();dev.trim.gain.value=1;
  dev.hp=ctx.createBiquadFilter();dev.hp.type='highpass';dev.hp.frequency.value=20;dev.hp.Q.value=.707;
  var saf=A.safeOut();
  dev.trim.connect(dev.hp);dev.hp.connect(dev.raw);dev.raw.connect(saf.input);
  dev.out=saf.output;
  dev.jackNodes.outa=dev.out;dev.outs.add('outa');
  dev.stream=null;dev.srcNode=null;
  var c=UI.el('div','chassis');
  var hd=UI.el('div','pheader');
  hd.appendChild(UI.el('div','plate','IN-2<small>LIVE INPUT</small>'));
  hd.appendChild(UI.el('div','sp'));
  dev.mchip=UI.el('div','mchip','<i></i>NOT ARMED');
  hd.appendChild(dev.mchip);
  c.appendChild(hd);
  var pick=UI.el('select','selbox');
  pick.innerHTML='<option value="">Default input</option>';
  pick.style.maxWidth='260px';
  function listDevices(){
    if(!navigator.mediaDevices||!navigator.mediaDevices.enumerateDevices)return;
    navigator.mediaDevices.enumerateDevices().then(function(ds){
      var cur=pick.value;
      pick.innerHTML='<option value="">Default input</option>';
      ds.filter(function(d2){return d2.kind==='audioinput';}).forEach(function(d2){
        var o=UI.el('option',null,d2.label||('Input '+pick.length));
        o.value=d2.deviceId;pick.appendChild(o);});
      pick.value=cur;
    }).catch(function(){});}
  listDevices();
  function status(txt,cls){
    dev.mchip.innerHTML='<i></i>'+txt;
    dev.mchip.classList.toggle('on',cls==='on');}
  function stop(){
    try{if(dev.srcNode)dev.srcNode.disconnect();}catch(e){}
    if(dev.stream)dev.stream.getTracks().forEach(function(t){try{t.stop();}catch(e){}});
    dev.stream=null;dev.srcNode=null;
    dev.raw.gain.setTargetAtTime(0,ctx.currentTime,.02);
    status('NOT ARMED');}
  function arm(){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      UI.toast('This browser exposes no audio input API','#ff6a55');return;}
    status('REQUESTING…');
    var con={audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}};
    if(pick.value)con.audio.deviceId={exact:pick.value};
    navigator.mediaDevices.getUserMedia(con).then(function(st){
      stop();
      dev.stream=st;
      dev.srcNode=ctx.createMediaStreamSource(st);
      dev.srcNode.connect(dev.trim);
      dev.raw.gain.setTargetAtTime(dev.p.lvl,ctx.currentTime,.05);
      var tr=st.getAudioTracks()[0];
      status(tr&&tr.label?tr.label.slice(0,26):'LIVE','on');
      listDevices();
      UI.toast('IN-2 armed — patch its rear OUT into a console channel. Use headphones.',5000);
    }).catch(function(e){
      status('DENIED');
      UI.toast('Input refused: '+(e&&e.name?e.name:'error')+' — the browser must grant mic access','#ff6a55',6000);});}
  c.appendChild(UI.panels(dev,[
    {title:'SOURCE',controls:[
      {t:'cus',fn:function(){var w=UI.el('div','stpr');
        w.appendChild(UI.el('div','kl2','DEVICE'));w.appendChild(pick);return w;}},
      {t:'bt',group:'ARM',label:'ARM INPUT',wide:1,fn:arm},
      {t:'bt',group:'&nbsp;',label:'RELEASE',wide:1,fn:function(){stop();UI.toast('IN-2 released');}}]},
    {title:'PREAMP',controls:[
      {t:'k',id:'trim',label:'TRIM',min:0,max:4,def:1,fmt:'x',ap:function(v){dev.trim.gain.setTargetAtTime(v,ctx.currentTime,.02);}},
      {t:'k',id:'hpf',label:'HPF',min:20,max:400,def:20,log:1,fmt:'hz',ap:function(v){dev.hp.frequency.setTargetAtTime(v,ctx.currentTime,.02);}},
      {t:'k',id:'lvl',label:'LEVEL',min:0,max:1.2,def:.8,fmt:'pc',
        ap:function(v){if(dev.stream)dev.raw.gain.setTargetAtTime(v,ctx.currentTime,.02);}}]}
  ]));
  var note=UI.el('div','content-note2',
    'Feedback warning: monitoring a live mic through speakers will howl. Use headphones, or keep the channel muted while you set trim.');
  c.appendChild(note);
  dev.chassis=c;
  dev.allOff=stop;
},
back:[{title:'AUDIO OUT',jacks:[['outa','out','audio',null,'OUT']]}]});

/* ============ MIX-14 (optional expander, unchanged) ============ */
RS.dev('mixer',{name:'MIX-14',sub:'LINE MIXER · 4 FX BUS',accent:'#c8b98a',
build:function(dev){
  var A=RS.A,UI=RS.UI,ctx=A.ctx;
  dev.chs=[];dev.mute=[];dev.solo=[];dev.mg=[];dev.ana=[];
  dev.fxs=[];dev.retG=[];dev.meters=[];
  var defT=['PLATE','TAPE ECHO','PING-PONG','TUBE'];
  var defSend=[[.14,.12,.1,.08],[.12,.1,.08,0],[.1,.08,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  var mix=ctx.createGain(),outN=ctx.createGain();
  var safe=A.safeOut();mix.connect(safe.input);safe.output.connect(outN);
  for(var f=0;f<4;f++){
    var fx=A.makeFX();fx.setType(defT[f]);
    var ret=ctx.createGain();ret.gain.value=.8;
    fx.output.connect(ret);ret.connect(mix);
    dev.fxs.push(fx);dev.retG.push(ret);}
  for(var i=0;i<6;i++){
    dev.mute.push(false);dev.solo.push(false);
    var o={};
    o.in=ctx.createGain();
    o.an=ctx.createAnalyser();o.an.fftSize=512;
    o.lo=ctx.createBiquadFilter();o.lo.type='lowshelf';o.lo.frequency.value=120;
    o.mid=ctx.createBiquadFilter();o.mid.type='peaking';o.mid.frequency.value=900;o.mid.Q.value=.8;
    o.hi=ctx.createBiquadFilter();o.hi.type='highshelf';o.hi.frequency.value=7500;
    o.fad=ctx.createGain();o.fad.gain.value=.8;
    o.mute=ctx.createGain();
    o.pan=ctx.createStereoPanner();
    o.in.connect(o.an);
    o.in.connect(o.lo);o.lo.connect(o.mid);o.mid.connect(o.hi);o.hi.connect(o.fad);
    o.fad.connect(o.mute);o.mute.connect(o.pan);o.pan.connect(mix);
    o.sends=[];
    for(var s=0;s<4;s++){var sg=ctx.createGain();sg.gain.value=defSend[i][s];
      o.pan.connect(sg);sg.connect(dev.fxs[s].input);o.sends.push(sg);}
    dev.mg.push(o.mute);dev.chs.push(o);
    dev.jackNodes['ch'+(i+1)]=o.in;dev.ana.push(o.an);}
  dev.updMS=function(){
    var any=dev.solo.indexOf(true)>=0;
    for(var j=0;j<6;j++){
      var on=!(dev.mute[j]||(any&&!dev.solo[j]));
      dev.mg[j].gain.setTargetAtTime(on?1:0,ctx.currentTime,.01);}};
  dev.tick=function(){dev.ana.forEach(function(a,i2){if(dev.meters&&dev.meters[i2])dev.meters[i2].set(A.dbOf(a));});};
  var c=UI.el('div','chassis');
  var hd=UI.el('div','pheader');
  hd.appendChild(UI.el('div','plate','MIX-14<small>LINE MIXER · FX</small>'));
  hd.appendChild(UI.el('div','mchip','<i></i>6 CH · EQ · SOLO/MUTE · 4 AUX'));
  c.appendChild(hd);
  var fxct=[];
  for(var bi=1;bi<=4;bi++){
    (function(bi){
      var fx=dev.fxs[bi-1];
      fxct.push({t:'sel',id:'fxt'+bi,label:'BUS '+bi,opts:A.FXTYPES.map(function(t){return{v:t,t:t};}),def:defT[bi-1],
        ap:function(v){try{fx.setType(v);UI.toast('FX BUS '+bi+' · '+v);}catch(e){UI.toast('FX error: '+e.message);}}});
      fxct.push({t:'k',id:'fxa'+bi,label:'AMOUNT',min:0,max:1,def:.5,fmt:'pc',ap:function(v){fx.setAmount(v);}});
      fxct.push({t:'k',id:'fxm'+bi,label:'MIX',min:0,max:1,def:.3,fmt:'pc',ap:function(v){fx.setMix(v);}});
      fxct.push({t:'k',id:'fxr'+bi,label:'RETURN',min:0,max:1.2,def:.8,fmt:'pc',
        ap:function(v){dev.retG[bi-1].gain.setTargetAtTime(v,ctx.currentTime,.02);}});
    })(bi);}
  c.appendChild(UI.panels(dev,[
    {title:'FX BUSES · 14 PEDAL TYPES · RETURNS FEED MIX BUS',controls:fxct},
    {title:'CHANNEL STRIPS — PAN · EQ · 4 AUX (POST-FADER) · MUTE / SOLO',custom:function(dev){
      var strips=UI.el('div','strips');
      dev.chs.forEach(function(ch,i2){strips.appendChild(mixStrip(dev,i2,ch));});
      dev._strips=strips;
      return strips;}}
  ]));
  dev.chassis=c;
  dev.updateLabels=function(){
    if(!dev._strips)return;
    for(var i2=0;i2<6;i2++){
      var cb=RS.S.cables.find(function(c2){return c2.kind==='audio'&&c2.to.dev===dev.id&&c2.to.jack==='ch'+(i2+1);});
      var src=cb&&RS.byId(cb.from.dev);
      var st=dev._strips.children[i2];
      if(st){var sn=st.querySelector('.sname');if(sn)sn.textContent=src?src.name:'CH '+(i2+1);}}};
  dev.jackNodes.out=outN;dev.outs.add('out');
  dev.tick=function(){dev.ana.forEach(function(a,i2){if(dev.meters[i2])dev.meters[i2].set(A.dbOf(a));});};
},
back:[
  {title:'CHANNEL IN',jacks:[1,2,3,4,5,6].map(function(n){return['ch'+n,'in','audio',null,'CH'+n];})},
  {title:'MIX BUS',jacks:[['out','out','audio',null,'OUT']]}]});
function mixStrip(dev,i,ch){
  var UI=RS.UI,ctx=RS.A.ctx;
  var st=UI.el('div','strip');
  st.appendChild(UI.el('div','sname','CH '+(i+1)));
  var two=UI.el('div');two.style.cssText='display:flex;gap:6px';
  var c1=UI.el('div','vcol'),c2=UI.el('div','vcol');
  c1.appendChild(UI.kn(dev,{id:'pan'+i,label:'PAN',min:-1,max:1,def:0,size:24,fmt:'pan',
    ap:function(v){ch.pan.pan.setTargetAtTime(v,ctx.currentTime,.02);}}));
  c1.appendChild(UI.kn(dev,{id:'eqLo'+i,label:'EQ LO',min:-12,max:12,def:0,size:24,fmt:'db',
    ap:function(v){ch.lo.gain.setTargetAtTime(v,ctx.currentTime,.02);}}));
  c1.appendChild(UI.kn(dev,{id:'eqMid'+i,label:'EQ MID',min:-12,max:12,def:0,size:24,fmt:'db',
    ap:function(v){ch.mid.gain.setTargetAtTime(v,ctx.currentTime,.02);}}));
  c1.appendChild(UI.kn(dev,{id:'eqHi'+i,label:'EQ HI',min:-12,max:12,def:0,size:24,fmt:'db',
    ap:function(v){ch.hi.gain.setTargetAtTime(v,ctx.currentTime,.02);}}));
  ch.sends.forEach(function(sg,si){
    c2.appendChild(UI.kn(dev,{id:'s'+si+'_'+i,label:'FX'+(si+1),min:0,max:1,def:sg.gain.value,size:24,fmt:'pc',
      ap:function(v){sg.gain.setTargetAtTime(v,ctx.currentTime,.02);}}));});
  two.append(c1,c2);
  st.appendChild(two);
  var mt=UI.meter();dev.meters.push(mt);
  var fw=UI.el('div','fadrow');
  var fd=UI.fad(dev,{id:'fdr'+i,label:'CH '+(i+1),def:i===5?.6:.8,
    ap:function(v){ch.fad.gain.setTargetAtTime(v,ctx.currentTime,.02);}});
  fw.append(fd.querySelector('.ftrack'),mt.el);st.appendChild(fw);
  var br=UI.el('div','btnrow');
  var mb=UI.el('button','mbtn','MUTE');
  var sb=UI.el('button','mbtn sbtn','SOLO');
  mb.onclick=function(){dev.mute[i]=!dev.mute[i];mb.classList.toggle('on',dev.mute[i]);dev.updMS();};
  sb.onclick=function(){dev.solo[i]=!dev.solo[i];sb.classList.toggle('on',dev.solo[i]);dev.updMS();};
  br.append(mb,sb);st.appendChild(br);
  return st;}

/* ============ SGE-7 — modular through-zero FM voice ============
   Monophonic, like the modulars it copies. Three operators with true
   through-zero linear FM (the modulator drives carrier .frequency, which is
   allowed to go negative — that is what separates a Rubicon/DPO-style analog
   FM voice from an exponential-FM synth), a folder, a ladder filter, two
   envelopes, an LFO, EQ and an FX slot.

   CLICK-FREE RULES observed throughout:
   - no WaveShaper curve is ever reassigned while audio runs; every
     nonlinearity is a fixed curve and the panel crossfades between them
   - no node is ever connected or disconnected by a panel control; the
     algorithm matrix is a permanently wired set of gains
   - every control lands through setTargetAtTime, never a value write
   - envelope retriggers start from the CURRENT level, never a jump to zero
   - DC blockers after the folder and the VCA */
RS.dev('sub',{name:'SGE-7',sub:'MODULAR FM VOICE · THRU-ZERO',accent:'#e2a34f',channel:'omni',
build:function(dev){
  var A=RS.A,UI=RS.UI,ctx=A.ctx,SM=A.SMOOTH;
  var RAT=[{t:'1/4',v:.25},{t:'1/2',v:.5},{t:'1',v:1},{t:'3/2',v:1.5},{t:'2',v:2},{t:'3',v:3},
           {t:'4',v:4},{t:'5',v:5},{t:'7',v:7},{t:'11',v:11}];
  var WV=[{t:'SIN',v:'sine'},{t:'TRI',v:'triangle'},{t:'SAW',v:'sawtooth'},{t:'SQR',v:'square'}];
  function G(v){var g=ctx.createGain();g.gain.value=v;return g;}
  function OSC(t,f){var o=ctx.createOscillator();o.type=t;o.frequency.value=f||110;o.start();return o;}
  function shaper(k,amp){
    var n=2048,c=new Float32Array(n);
    for(var i=0;i<n;i++){var x=(i/(n-1))*2-1;c[i]=Math.sin(x*Math.PI*k)*(amp||.9);}
    var w=ctx.createWaveShaper();w.curve=c;w.oversample='4x';return w;}
  /* ---------------- operators ---------------- */
  dev.opA=OSC('sine');dev.opB=OSC('sine');dev.opC=OSC('sine');
  dev.aLvl=G(.5);
  /* PARAPHONY — four fixed voice cards, the way a hardware paraphonic synth
     does it. Card 0 is the OP-A / OP-B pair on the front panel; cards 1-3 are
     clones that follow the same panel and get their own gate, so releasing one
     note of a chord releases only that note. All four sum into one folder,
     filter and VCA, which is what makes it paraphonic rather than polyphonic. */
  dev.polySum=G(1);dev.polySum.connect(dev.aLvl);
  dev.slots=[];
  var NSLOT=4;
  dev.bLvl=G(1);dev.opB.connect(dev.bLvl);
  dev.cLvl=G(1);dev.opC.connect(dev.cLvl);
  /* OP-B "feedback": a fixed saturator crossfaded against dry. A true
     delay-free operator loop is impossible in Web Audio (minimum cycle
     latency is one 128-sample render quantum); this reaches the same
     saw-ward spectrum without a curve swap or a comb artefact. */
  dev.bDry=G(1);dev.bWet=G(0);
  dev.bSat=ctx.createWaveShaper();dev.bSat.curve=A.tanh(3.2);dev.bSat.oversample='4x';
  dev.bLvl.connect(dev.bDry);dev.bLvl.connect(dev.bSat);dev.bSat.connect(dev.bWet);
  dev.bSum=G(1);dev.bDry.connect(dev.bSum);dev.bWet.connect(dev.bSum);
  /* depth = index x modulator frequency, so timbre holds across the keyboard */
  dev.bDepth=G(0);dev.bSum.connect(dev.bDepth);
  dev.cDepth=G(0);dev.cLvl.connect(dev.cDepth);
  /* ALGORITHM MATRIX — every route is permanently wired and the panel only
     moves gains, so changing algorithm can never click */
  function route(src,dst){var g=G(0);src.connect(g);g.connect(dst);return g;}
  dev.rBA=route(dev.bDepth,dev.opA.frequency);      /* B -> A   (thru-zero) */
  dev.rCA=route(dev.cDepth,dev.opA.frequency);      /* C -> A */
  dev.rCB=route(dev.cDepth,dev.opB.frequency);      /* C -> B */
  dev.foldIn=G(1);
  dev.rBmix=route(dev.bSum,dev.foldIn);             /* B -> audio (additive) */
  dev.rCmix=route(dev.cLvl,dev.foldIn);             /* C -> audio (additive) */
  dev.bOutN=G(1);dev.bSum.connect(dev.bOutN);
  dev.cOutN=G(1);dev.cLvl.connect(dev.cOutN);
  dev.aFmIn=G(1);dev.aFmIn.connect(dev.opA.frequency);
  dev.bFmIn=G(1);dev.bFmIn.connect(dev.opB.frequency);
  (function(){
    function EGN(){var c=ctx.createConstantSource();c.offset.value=1;c.start();
      var g=G(0);c.connect(g);return g;}
    for(var v=0;v<NSLOT;v++){
      var sl={i:v,note:null,age:0,eg:EGN()};
      if(v===0){sl.car=dev.opA;sl.mod=dev.opB;sl.depth=dev.bDepth;sl.sum=dev.bSum;}
      else{
        sl.car=OSC('sine');sl.mod=OSC('sine');
        var lvl=G(1);sl.mod.connect(lvl);
        var dry=G(1),wet=G(0);
        var sat=ctx.createWaveShaper();sat.curve=A.tanh(3.2);sat.oversample='4x';
        lvl.connect(dry);lvl.connect(sat);sat.connect(wet);
        sl.sum=G(1);dry.connect(sl.sum);wet.connect(sl.sum);
        sl.dry=dry;sl.wet=wet;
        sl.depth=G(0);sl.sum.connect(sl.depth);sl.depth.connect(sl.car.frequency);}
      sl.vca=G(v===0?1:0);
      sl.car.connect(sl.vca);sl.vca.connect(dev.polySum);
      if(v>0)sl.eg.connect(sl.vca.gain);
      dev.rCA.connect(sl.car.frequency);      /* OP-C reaches every card */
      dev.rCB.connect(sl.mod.frequency);
      dev.slots.push(sl);}
    /* card 0's gate is applied by the shared VCA in mono, by its own in poly */
    dev.slots[0].eg.connect(dev.slots[0].vca.gain);})();
  /* ---------------- folder: fixed curves, crossfaded ---------------- */
  dev.foldDrv=G(1);
  dev.foldSym=ctx.createConstantSource();dev.foldSym.offset.value=0;dev.foldSym.start();
  dev.foldSum=G(1);
  dev.foldIn.connect(dev.foldDrv);dev.foldDrv.connect(dev.foldSum);dev.foldSym.connect(dev.foldSum);
  dev.fold1=shaper(1.5);dev.fold2=shaper(3.2);
  dev.gDry=G(1);dev.g1=G(0);dev.g2=G(0);
  dev.foldSum.connect(dev.gDry);
  dev.foldSum.connect(dev.fold1);dev.fold1.connect(dev.g1);
  dev.foldSum.connect(dev.fold2);dev.fold2.connect(dev.g2);
  dev.foldMix=G(1);dev.gDry.connect(dev.foldMix);dev.g1.connect(dev.foldMix);dev.g2.connect(dev.foldMix);
  dev.foldDc=A.dcBlock();
  /* two poles at 15.5k: the folder is oversampled so it does not alias, but
     it makes genuinely harsh top end that reads as crackle */
  dev.foldLp=ctx.createBiquadFilter();dev.foldLp.type='lowpass';dev.foldLp.frequency.value=15500;dev.foldLp.Q.value=.54;
  dev.foldLp2=ctx.createBiquadFilter();dev.foldLp2.type='lowpass';dev.foldLp2.frequency.value=15500;dev.foldLp2.Q.value=1.31;
  dev.foldOut=G(1);
  dev.foldMix.connect(dev.foldDc);dev.foldDc.connect(dev.foldLp);
  dev.foldLp.connect(dev.foldLp2);dev.foldLp2.connect(dev.foldOut);
  function setFold(f){
    /* 0 -> dry, .5 -> gentle fold, 1 -> deep fold; pure gain crossfade */
    f=UI.clamp(f,0,1);
    var d=f<.5?1-f*2:0, a=f<.5?f*2:1-(f-.5)*2, b=f<.5?0:(f-.5)*2;
    A.smooth(dev.gDry.gain,d,.03);A.smooth(dev.g1.gain,a,.03);A.smooth(dev.g2.gain,b,.03);}
  /* ---------------- ladder filter ---------------- */
  dev.fIn=G(1);
  dev.f1=ctx.createBiquadFilter();dev.f1.type='lowpass';dev.f1.frequency.value=12000;dev.f1.Q.value=.7;
  dev.f2=ctx.createBiquadFilter();dev.f2.type='lowpass';dev.f2.frequency.value=12000;dev.f2.Q.value=.5;
  dev.fSat=ctx.createWaveShaper();dev.fSat.curve=A.tanh(1.25);dev.fSat.oversample='2x';
  dev.fTrim=G(1);dev.fOut=G(1);
  dev.fIn.connect(dev.f1);dev.f1.connect(dev.f2);dev.f2.connect(dev.fSat);
  dev.fSat.connect(dev.fTrim);dev.fTrim.connect(dev.fOut);
  dev.fCvIn=G(1);dev.fCvAmt=G(3000);dev.fCvIn.connect(dev.fCvAmt);
  dev.fCvAmt.connect(dev.f1.frequency);dev.fCvAmt.connect(dev.f2.frequency);
  /* SVF — a 12 dB state-variable in the SEM idiom, three parallel outputs
     blended by one knob so LP sweeps through notch to HP. Different animal
     from the ladder: gentler slope, no bass loss, notch in the middle. */
  dev.sIn=G(1);dev.sOut=G(1);
  dev.sLp=ctx.createBiquadFilter();dev.sLp.type='lowpass';
  dev.sBp=ctx.createBiquadFilter();dev.sBp.type='bandpass';
  dev.sHp=ctx.createBiquadFilter();dev.sHp.type='highpass';
  dev.sLpG=G(1);dev.sBpG=G(0);dev.sHpG=G(0);
  [['sLp','sLpG'],['sBp','sBpG'],['sHp','sHpG']].forEach(function(pr){
    var f=dev[pr[0]],g=dev[pr[1]];
    f.frequency.value=12000;f.Q.value=.9;
    dev.sIn.connect(f);f.connect(g);g.connect(dev.sOut);});
  dev.sCvIn=G(1);dev.sCvAmt=G(3000);dev.sCvIn.connect(dev.sCvAmt);
  [dev.sLp,dev.sBp,dev.sHp].forEach(function(f){dev.sCvAmt.connect(f.frequency);});
  function svfBlend(m){
    /* 0 = LP, .5 = notch (LP+HP together), 1 = HP */
    m=UI.clamp(m,0,1);
    A.smooth(dev.sLpG.gain,Math.max(0,1-m*2)+(m>=.5?0:0),.03);
    A.smooth(dev.sHpG.gain,Math.max(0,m*2-1),.03);
    var notch=1-Math.abs(m-.5)*2;
    A.smooth(dev.sLpG.gain,Math.max(Math.max(0,1-m*2),notch*.7),.03);
    A.smooth(dev.sHpG.gain,Math.max(Math.max(0,m*2-1),notch*.7),.03);}
  /* ---------------- VCA ---------------- */
  dev.vIn=G(1);dev.vca=G(0);dev.vDc=A.dcBlock();dev.vOut=G(1);
  dev.vIn.connect(dev.vca);dev.vca.connect(dev.vDc);dev.vDc.connect(dev.vOut);
  /* CV bus feeding the gain, with a selectable law: LIN passes straight
     through, EXP squares it for the natural amplitude taper of a real VCA */
  dev.vCvBus=G(1);dev.vCvIn=G(1);dev.vCvIn.connect(dev.vCvBus);
  (function(){
    var n=1024,c=new Float32Array(n);
    for(var i=0;i<n;i++){var x=(i/(n-1))*2-1;c[i]=x<0?0:x*x;}
    dev.vExp=ctx.createWaveShaper();dev.vExp.curve=c;})();
  dev.vLinG=G(1);dev.vExpG=G(0);
  dev.vCvBus.connect(dev.vLinG);dev.vLinG.connect(dev.vca.gain);
  dev.vCvBus.connect(dev.vExp);dev.vExp.connect(dev.vExpG);dev.vExpG.connect(dev.vca.gain);
  /* ---------------- EQ / FX / out ---------------- */
  dev.eqIn=G(1);
  dev.eLo=ctx.createBiquadFilter();dev.eLo.type='lowshelf';dev.eLo.frequency.value=140;
  dev.eLmid=ctx.createBiquadFilter();dev.eLmid.type='peaking';dev.eLmid.frequency.value=320;dev.eLmid.Q.value=1;
  dev.eMid=ctx.createBiquadFilter();dev.eMid.type='peaking';dev.eMid.frequency.value=900;dev.eMid.Q.value=.9;
  dev.eHmid=ctx.createBiquadFilter();dev.eHmid.type='peaking';dev.eHmid.frequency.value=2400;dev.eHmid.Q.value=1;
  dev.ePres=ctx.createBiquadFilter();dev.ePres.type='peaking';dev.ePres.frequency.value=5200;dev.ePres.Q.value=1.1;
  dev.eHi=ctx.createBiquadFilter();dev.eHi.type='highshelf';dev.eHi.frequency.value=6000;
  dev.eqOut=G(1);
  dev.eqIn.connect(dev.eLo);dev.eLo.connect(dev.eLmid);dev.eLmid.connect(dev.eMid);
  dev.eMid.connect(dev.eHmid);dev.eHmid.connect(dev.ePres);dev.ePres.connect(dev.eHi);
  dev.eHi.connect(dev.eqOut);
  dev.fxIn=G(1);dev.fx=A.makeFX();dev.fxOut=G(1);
  dev.fxIn.connect(dev.fx.input);dev.fx.output.connect(dev.fxOut);
  dev.mIn=G(1);dev.raw=G(.8);
  dev.outLp=ctx.createBiquadFilter();dev.outLp.type='lowpass';dev.outLp.frequency.value=17500;dev.outLp.Q.value=.707;
  var saf=A.safeOut();dev.mIn.connect(dev.outLp);dev.outLp.connect(dev.raw);
  dev.raw.connect(saf.input);dev.out=saf.output;
  dev.pre=G(1);dev.eqOut.connect(dev.pre);
  /* ---------------- envelopes / LFO as real CV ---------------- */
  function EG(){var s=ctx.createConstantSource();s.offset.value=1;s.start();var g=G(0);s.connect(g);return g;}
  dev.eg1=EG();dev.eg2=EG();
  /* a real ladder loses low end as resonance climbs — without this the
     filter just gets louder and boomier instead of nasal */
  dev.fThin=ctx.createBiquadFilter();dev.fThin.type='lowshelf';
  dev.fThin.frequency.value=220;dev.fThin.gain.value=0;
  dev.fSat.disconnect();dev.fSat.connect(dev.fThin);dev.fThin.connect(dev.fTrim);
  /* LFO: oscillator shapes plus a genuine smooth-random source */
  dev.lfo=OSC('sine',4);dev.lfoOscG=G(1);dev.lfo.connect(dev.lfoOscG);
  dev.lfoRndG=G(0);
  (function(){
    var n=A.noiseSrc();
    var r1=ctx.createBiquadFilter();r1.type='lowpass';r1.frequency.value=4;r1.Q.value=.6;
    var r2=ctx.createBiquadFilter();r2.type='lowpass';r2.frequency.value=4;r2.Q.value=.6;
    var boost=G(34);   /* matched to the oscillator shapes' +/-1 swing */
    n.connect(r1);r1.connect(r2);r2.connect(boost);boost.connect(dev.lfoRndG);
    dev.lfoRndF=[r1,r2];n.start(Math.random());})();
  dev.lfoAmt=G(0);dev.lfoOscG.connect(dev.lfoAmt);dev.lfoRndG.connect(dev.lfoAmt);
  dev.lfoAna=ctx.createAnalyser();dev.lfoAna.fftSize=32;dev.lfoAmt.connect(dev.lfoAna);
  dev.bendG=G(0);dev.vibG=G(0);
  [dev.opA,dev.opB,dev.opC].forEach(function(o){dev.bendG.connect(o.detune);dev.vibG.connect(o.detune);});
  /* ANALOG DRIFT — three independent slow random walks on detune. Perfectly
     stable digital oscillators are the main tell that something is not analog;
     a couple of cents of uncorrelated wander is what makes stacked operators
     sound like hardware instead of a calculator. */
  dev.drift=ctx.createConstantSource();dev.drift.offset.value=.35;dev.drift.start();
  [dev.opA,dev.opB,dev.opC].forEach(function(o,i){
    var n=A.noiseSrc();
    var l1=ctx.createBiquadFilter();l1.type='lowpass';l1.frequency.value=.6+i*.17;l1.Q.value=.5;
    var l2=ctx.createBiquadFilter();l2.type='lowpass';l2.frequency.value=1.1+i*.23;l2.Q.value=.5;
    /* two poles under 1.5 Hz throw away all but ~0.4% of the noise energy,
       so the gain has to be large to land a couple of cents of wander */
    var g=G(3600);
    n.connect(l1);l1.connect(l2);l2.connect(g);
    var trim=G(0);g.connect(trim);trim.connect(o.detune);
    dev.drift.connect(trim.gain);
    n.start(Math.random()*1.7);});
  dev.eg1.connect(dev.vCvBus);
  dev.egF=G(0);dev.eg2.connect(dev.egF);
  dev.egF.connect(dev.f1.frequency);dev.egF.connect(dev.f2.frequency);
  dev.lfoPitch=G(0);dev.lfoAmt.connect(dev.lfoPitch);dev.lfoPitch.connect(dev.opA.detune);
  /* ---------------- voice state ---------------- */
  dev.voices=new Map();dev.sustained=new Set();dev.pedal=false;
  dev.held=new Set();dev._dirty=true;dev._ai=0;dev._adir=1;dev._seq=[];dev._arp=false;
  dev._note=null;dev._stack=[];
  function pitchHz(n){return UI.clamp(UI.F2(UI.clamp(n+(dev.p.xpose||0),0,120)),8,12000);}
  function slotTune(sl,note,when){
    var p=dev.p,t=when||ctx.currentTime,gl=Math.max(.002,p.glide||.002);
    if(note==null)return;
    var n=UI.clamp(p.voices||1,1,4);
    var spread=(sl.i-(n-1)/2)*(p.detune||0);
    var f=pitchHz(note);
    var fa=f*Math.pow(2,(p.coarse||0)/12+(p.fine||0)/1200);
    var fb=f*(p.ratB||1)*Math.pow(2,(p.fineB||0)/1200);
    sl.car.frequency.setTargetAtTime(fa,t,gl);
    sl.mod.frequency.setTargetAtTime(fb,t,gl);
    sl.car.detune.setTargetAtTime(spread,t,gl);
    sl.mod.detune.setTargetAtTime(spread,t,gl);
    var ceil=ctx.sampleRate*.42;
    var dv=UI.clamp((p.idxB||0)*fb,0,Math.max(0,ceil-fa-2*fb));
    var on=(ALGO[Number(p.algo)||1]||ALGO[1]).BA?1:0;
    sl.depth.gain.setTargetAtTime(dv*on,t,gl);
    if(sl.dry){A.smooth(sl.wet.gain,p.fb||0,.03);A.smooth(sl.dry.gain,1-(p.fb||0)*.75,.03);}}
  function retune(when){
    var p=dev.p,t=when||ctx.currentTime,gl=Math.max(.002,p.glide||.002);
    dev.slots.forEach(function(sl){if(sl.note!=null)slotTune(sl,sl.note,when);});
    if(dev._note==null)return;
    var f=pitchHz(dev._note);
    var fa=f*Math.pow(2,(p.coarse||0)/12+(p.fine||0)/1200);
    var fb=f*(p.ratB||1)*Math.pow(2,(p.fineB||0)/1200);
    var fc=f*(p.ratC||1);
    dev.opA.frequency.setTargetAtTime(fa,t,gl);
    dev.opB.frequency.setTargetAtTime(fb,t,gl);
    dev.opC.frequency.setTargetAtTime(fc,t,gl);
    /* ANTI-ALIAS: Carson's rule says the occupied band runs to
       fc + deviation + 2*fmod. Anything past Nyquist folds back as the hash
       that sounds like crackle, so the deviation is capped rather than the
       index — the patch keeps its character and only the top stops spitting. */
    var ceil=ctx.sampleRate*.42;
    function cap(dev0,fm){return UI.clamp(dev0,0,Math.max(0,ceil-fa-2*fm));}
    dev.bDepth.gain.setTargetAtTime(cap((p.idxB||0)*fb,fb),t,gl);
    dev.cDepth.gain.setTargetAtTime(cap((p.idxC||0)*fc,fc),t,gl);}
  var ALGO={1:{BA:1},2:{CB:1,BA:1},3:{BA:1,CA:1},4:{CB:1,BA:1,CA:1},
            5:{BA:1,CF:1},6:{Bm:1,Cm:1}};
  function setAlgo(a){
    var m=ALGO[Number(a)||1]||ALGO[1];
    A.smooth(dev.rBA.gain,m.BA?1:0,.03);
    A.smooth(dev.rCA.gain,m.CA?1:0,.03);
    A.smooth(dev.rCB.gain,m.CB?1:0,.03);
    A.smooth(dev.rBmix.gain,m.Bm?1:0,.03);
    A.smooth(dev.rCmix.gain,m.Cm?1:0,.03);
    A.smooth(dev.cFilt.gain,m.CF?1:0,.03);
    var R=dev._routeEls;
    if(R.a)R.a.textContent='OUT \u2192 FOLD';
    if(R.b)R.b.textContent=m.Bm?'OUT \u2192 MIX':(m.BA?'FM \u2192 OP-A':'IDLE');
    if(R.c)R.c.textContent=m.Cm?'OUT \u2192 MIX':m.CB?'FM \u2192 OP-B':
      m.CA?'FM \u2192 OP-A':m.CF?'CV \u2192 VCF':'IDLE';
    if(R.algo)R.algo.textContent='ROUTING '+(Number(dev.p.algo)||1)+' OF 6';}
  dev.cFilt=route(dev.cDepth,dev.f1.frequency);
  dev.cFilt.connect(dev.f2.frequency);
  /* ---------------- chassis ---------------- */
  var c=UI.el('div','chassis');
  var hd=UI.el('div','pheader');
  hd.appendChild(UI.el('div','plate','SGE-7<small>MODULAR FM VOICE</small>'));
  hd.appendChild(UI.el('div','sp'));
  hd.appendChild(UI.presets(dev,[
    {n:'HOUSE SUB BASS',p:{algo:1,coarse:-12,ratB:1,idxB:.85,wA:'sine',wB:'sine',fb:.12,
      fold:0,drive:.2,sym:0,cut:520,res:.18,fenv:.35,fmode:'lp24',vresp:1,
      a:.004,d:.3,s:.55,r:.14,a2:.002,d2:.2,s2:.2,r2:.1,
      lfoW:'sine',lfoR:4,lfoA:0,eqLo:4,eqMid:-1,eqHi:-3,eqMf:900,
      ifx:'OFF',ifxa:.5,ifxm:0,glide:.002,drift:.25,lvl:.7,vcaLvl:1,vol:.9}},
    {n:'TECHNO STAB',p:{algo:4,coarse:0,ratB:2,idxB:2.4,ratC:3,idxC:1.3,wA:'sine',wB:'sine',wC:'sine',fb:.35,
      fold:.35,drive:.45,sym:.15,cut:2400,res:.42,fenv:.55,fmode:'lp24',vresp:0,
      a:.001,d:.16,s:0,r:.09,a2:.001,d2:.12,s2:0,r2:.08,
      lfoW:'sine',lfoR:6,lfoA:0,eqLo:2,eqMid:-2,eqHi:3,eqMf:1400,
      ifx:'PLATE',ifxa:.35,ifxm:.14,glide:.002,drift:.4,lvl:.55,vcaLvl:1,vol:.85}},
    {n:'DNB REESE',p:{algo:3,coarse:-12,ratB:1,fineB:14,idxB:1.6,ratC:1,idxC:1.2,wA:'sine',wB:'sine',wC:'triangle',fb:.5,
      fold:.25,drive:.5,sym:0,cut:1100,res:.3,fenv:.2,fmode:'lp24',vresp:0,
      a:.006,d:.8,s:.85,r:.25,a2:.4,d2:1.2,s2:.5,r2:.4,
      lfoW:'sine',lfoR:.35,lfoA:.12,eqLo:3,eqMid:1,eqHi:0,eqMf:700,
      ifx:'CHORUS',ifxa:.6,ifxm:.3,glide:.02,drift:.6,lvl:.55,vcaLvl:1,vol:.85}},
    {n:'DUB CHORD STAB',p:{algo:2,coarse:0,ratB:1,idxB:1.2,ratC:2,idxC:.8,wA:'sine',wB:'sine',wC:'sine',fb:.2,
      fold:.1,drive:.25,sym:0,cut:1700,res:.25,fenv:.3,fmode:'lp24',vresp:0,
      a:.004,d:.5,s:.15,r:.35,a2:.004,d2:.3,s2:.1,r2:.25,
      lfoW:'sine',lfoR:2,lfoA:0,eqLo:2,eqMid:-3,eqHi:1,eqMf:1100,
      ifx:'TAPE ECHO',ifxa:.7,ifxm:.42,glide:.002,drift:.35,lvl:.5,vcaLvl:1,vol:.75}},
    {n:'AMBIENT GLASS',p:{algo:3,coarse:12,ratB:2,idxB:.55,ratC:5,idxC:.3,wA:'sine',wB:'sine',wC:'sine',fb:.05,
      fold:.18,drive:.1,sym:0,cut:6500,res:.1,fenv:.18,fmode:'lp12',vresp:1,
      a:1.4,d:2.2,s:.8,r:3.4,a2:1.8,d2:2,s2:.6,r2:3,
      lfoW:'sine',lfoR:.22,lfoA:.3,eqLo:-2,eqMid:0,eqHi:3,eqMf:2400,
      ifx:'HALL',ifxa:.8,ifxm:.4,glide:.002,drift:.5,lvl:.4,vcaLvl:1,vol:.7}},
    {n:'ATMOSPHERE',p:{algo:5,coarse:0,ratB:1.5,idxB:.9,ratC:.5,idxC:2.2,wA:'sine',wB:'sine',wC:'sine',fb:.22,
      fold:.3,drive:.15,sym:-.2,cut:2100,res:.22,fenv:.1,fmode:'lp12',vresp:1,
      a:2.6,d:3.5,s:.7,r:5,a2:2.2,d2:3,s2:.5,r2:4.5,
      lfoW:'random',lfoR:.4,lfoA:.5,eqLo:-3,eqMid:-1,eqHi:2,eqMf:3200,
      ifx:'HALL',ifxa:.9,ifxm:.48,glide:.12,drift:.85,lvl:.38,vcaLvl:1,vol:.68}},
    {n:'ACID FM LEAD',p:{algo:1,coarse:0,ratB:1.5,idxB:2.1,wA:'sine',wB:'sine',fb:.4,
      fold:.55,drive:.55,sym:.25,cut:900,res:.72,fenv:.75,fmode:'lp24',vresp:0,
      a:.002,d:.22,s:.2,r:.12,a2:.001,d2:.18,s2:.05,r2:.1,
      lfoW:'sine',lfoR:5,lfoA:0,eqLo:0,eqMid:2,eqHi:2,eqMf:1800,
      ifx:'OVERDRIVE',ifxa:.4,ifxm:.25,glide:.05,drift:.45,lvl:.5,vcaLvl:1,vol:.75}},
    {n:'TRANCE PLUCK',p:{algo:2,coarse:0,ratB:1,idxB:1.4,ratC:7,idxC:.5,wA:'sine',wB:'sine',wC:'sine',fb:.15,
      fold:.2,drive:.2,sym:0,cut:4200,res:.28,fenv:.5,fmode:'lp24',vresp:0,
      a:.001,d:.35,s:.05,r:.28,a2:.001,d2:.25,s2:0,r2:.2,
      lfoW:'sine',lfoR:5.2,lfoA:.05,eqLo:0,eqMid:0,eqHi:4,eqMf:2600,
      ifx:'PING-PONG',ifxa:.5,ifxm:.28,glide:.002,drift:.3,lvl:.5,vcaLvl:1,vol:.78}},
    {n:'DEEP HOUSE KEYS',p:{algo:2,coarse:0,ratB:1,idxB:.9,ratC:4,idxC:.35,wA:'sine',wB:'sine',wC:'sine',fb:.14,
      fold:.08,drive:.15,sym:0,cut:3200,res:.14,fenv:.22,fmode:'lp12',vresp:1,
      a:.004,d:.9,s:.35,r:.4,a2:.004,d2:.5,s2:.2,r2:.3,
      lfoW:'sine',lfoR:4.6,lfoA:.04,eqLo:1,eqMid:-2,eqHi:2,eqMf:1200,
      ifx:'PLATE',ifxa:.45,ifxm:.2,glide:.002,drift:.4,lvl:.5,vcaLvl:1,vol:.78}},
    {n:'DX E.PIANO',p:{algo:2,coarse:0,ratB:1,idxB:1.1,ratC:14,idxC:.35,wA:'sine',wB:'sine',wC:'sine',fb:.1,
      fold:0,drive:.1,sym:0,cut:9000,res:.05,fenv:.15,fmode:'lp12',vresp:1,
      a:.002,d:1.4,s:.06,r:.5,a2:.002,d2:.5,s2:0,r2:.3,
      lfoW:'sine',lfoR:4,lfoA:0,eqLo:1,eqMid:-1,eqHi:2,eqMf:900,
      ifx:'PLATE',ifxa:.4,ifxm:.16,glide:.002,drift:.3,lvl:.6,vcaLvl:1,vol:.8}},
    {n:'TUBULAR BELL',p:{algo:3,coarse:0,ratB:3.5,idxB:2.2,ratC:7,idxC:1.1,wA:'sine',wB:'sine',wC:'sine',fb:0,
      fold:0,drive:0,sym:0,cut:11000,res:.04,fenv:.1,fmode:'lp12',vresp:0,
      a:.001,d:3.2,s:0,r:2.6,a2:.001,d2:1.5,s2:0,r2:2,
      lfoW:'sine',lfoR:4,lfoA:0,eqLo:0,eqMid:0,eqHi:0,eqMf:900,
      ifx:'HALL',ifxa:.7,ifxm:.24,glide:.002,drift:.35,lvl:.55,vcaLvl:1,vol:.75}},
    {n:'INIT SINE',p:{algo:1,coarse:0,fine:0,ratB:1,idxB:0,ratC:2,idxC:0,wA:'sine',wB:'sine',wC:'sine',fb:0,
      fold:0,drive:0,sym:0,cut:14000,res:.05,fenv:0,fmode:'lp24',vresp:0,
      a:.005,d:.3,s:.7,r:.3,a2:.005,d2:.25,s2:.3,r2:.2,
      lfoW:'sine',lfoR:4,lfoA:0,eqLo:0,eqMid:0,eqHi:0,eqMf:900,
      ifx:'OFF',ifxa:.5,ifxm:.2,glide:.002,drift:.35,lvl:.5,vcaLvl:1,vol:.8}}
  ],0));
  dev.mchip=UI.el('div','mchip','<i></i>CH OMNI');
  dev.mchip.onclick=function(){RS.openModal('#midiModal');};
  hd.appendChild(dev.mchip);c.appendChild(hd);
  /* ---------------- vertical module strips, in signal order ---------------- */
  var rowA=UI.el('div','modrow'),rowB=UI.el('div','modrow');
  /* faceplate in the System-500 idiom: function pill, house mark, model
     number, silkscreen sub-legend. The mark is ours — the layout language is
     what is being copied, not anybody's trademark. */
  function panel(row,cls,pill,num,sub,ledKey){
    var m=UI.el('div','modpanel '+cls);
    var t=UI.el('div','modtitle');
    t.innerHTML='<span class="mpill">'+pill+'</span>'+
      '<span class="mbrand">SGE</span><span class="mnum">'+num+'</span>';
    if(ledKey){var led=UI.el('div','modled');t.appendChild(led);dev._leds[ledKey]=led;}
    m.appendChild(t);
    if(sub)m.appendChild(UI.el('div','modsub',sub));
    if(cls.indexOf('m-op')>=0||cls.indexOf('m-algo')>=0){
      var rt=UI.el('div','modroute','');m.appendChild(rt);
      dev._routeEls[cls.indexOf('m-opa')>=0?'a':cls.indexOf('m-opb')>=0?'b':
                    cls.indexOf('m-opc')>=0?'c':'algo']=rt;}
    var body=UI.el('div','modbody');m.appendChild(body);
    var jr=UI.el('div','modjacks');m.appendChild(jr);
    row.appendChild(m);
    return {ctl:function(l){l.forEach(function(x){body.appendChild(UI.ctl(dev,x));});return this;},
            jacks:function(l){l.forEach(function(j){UI.jack(dev,j,jr);});return this;}};}
  dev._leds={};dev._routeEls={};

  panel(rowA,'m-algo dbl','ALGO',501,'OPERATOR MATRIX')
    .ctl([{t:'sel',id:'algo',label:'ALGORITHM',def:1,
            opts:[{t:'1 · B→A',v:1},{t:'2 · C→B→A',v:2},{t:'3 · B+C→A',v:3},
                  {t:'4 · C→B→A+C→A',v:4},{t:'5 · B→A · C→VCF',v:5},{t:'6 · ADDITIVE',v:6}],
            ap:function(v){setAlgo(v);}},
          {t:'k',id:'glide',label:'GLIDE',min:.002,max:.6,def:.002,log:1,fmt:'ms'},
          {t:'st',id:'xpose',label:'OCT',opts:XP,def:0}]);

  panel(rowA,'m-poly narrow','POLY',560,'VOICE CARDS')
    .ctl([{t:'st',id:'voices',label:'VOICES',opts:[{t:'1',v:1},{t:'2',v:2},{t:'3',v:3},{t:'4',v:4}],def:1,
            ap:function(){applyVoiceMode();}},
          {t:'k',id:'detune',label:'SPREAD',min:0,max:25,def:0,fmt:'ct',ap:function(){retune();}}]);

  panel(rowA,'m-op m-opc narrow','VCO',512,'MOD 2')
    .ctl([{t:'st',id:'wC',label:'WAVE',opts:WV,def:'sine',ap:function(v){dev.opC.type=v;}},
          {t:'sel',id:'ratC',label:'RATIO',opts:RAT,def:2,ap:function(){retune();}},
          {t:'v',id:'idxC',label:'INDEX',min:0,max:8,def:0,fmt:'two',ap:function(){retune();}}])
    .jacks([{id:'cOut',dir:'out',kind:'audio',node:function(){return dev.cOutN;},cap:'OUT'}]);

  panel(rowA,'m-op m-opb narrow','VCO',512,'MOD 1')
    .ctl([{t:'st',id:'wB',label:'WAVE',opts:WV,def:'sine',ap:function(v){dev.slots.forEach(function(sl){sl.mod.type=v;});}},
          {t:'sel',id:'ratB',label:'RATIO',opts:RAT,def:1,ap:function(){retune();}},
          {t:'k',id:'fineB',label:'FINE',min:-50,max:50,def:0,fmt:'ct',ap:function(){retune();}},
          {t:'row',items:[
            {t:'v',id:'idxB',label:'INDEX',min:0,max:8,def:0,fmt:'two',ap:function(){retune();}},
            {t:'v',id:'fb',label:'FEEDB',min:0,max:1,def:0,fmt:'pc',
              ap:function(v){A.smooth(dev.bWet.gain,v,.03);A.smooth(dev.bDry.gain,1-v*.75,.03);}}]}])
    .jacks([{id:'bFm',dir:'in',kind:'audio',node:function(){return dev.bFmIn;},cap:'FM'},
            {id:'bOut',dir:'out',kind:'audio',node:function(){return dev.bOutN;},cap:'OUT'}]);

  panel(rowA,'m-op m-opa narrow','VCO',512,'CARRIER TZFM','opa')
    .ctl([{t:'st',id:'wA',label:'WAVE',opts:WV,def:'sine',ap:function(v){dev.slots.forEach(function(sl){sl.car.type=v;});}},
          {t:'k',id:'coarse',label:'COARSE',min:-24,max:24,def:0,fmt:'semi',ap:function(){retune();}},
          {t:'k',id:'fine',label:'FINE',min:-50,max:50,def:0,fmt:'ct',ap:function(){retune();}},
          {t:'v',id:'lvl',label:'LEVEL',min:0,max:1,def:.5,fmt:'pc',ap:function(v){A.smooth(dev.aLvl.gain,v);}}])
    .jacks([{id:'aFm',dir:'in',kind:'audio',node:function(){return dev.aFmIn;},cap:'FM'},
            {id:'aOut',dir:'out',kind:'audio',node:function(){return dev.aLvl;},cap:'OUT'}]);



  panel(rowA,'m-fold narrow','FOLD',515,'WAVEFOLDER')
    .ctl([{t:'row',items:[
            {t:'v',id:'drive',label:'DRIVE',min:0,max:1,def:0,fmt:'pc',
              ap:function(v){A.smooth(dev.foldDrv.gain,1+v*3.5,.03);}},
            {t:'v',id:'fold',label:'FOLD',min:0,max:1,def:0,fmt:'pc',ap:function(v){setFold(v);}}]},
          {t:'k',id:'sym',label:'SYMM',min:-1,max:1,def:0,fmt:'two',
            ap:function(v){A.smooth(dev.foldSym.offset,v*.5,.03);}}])
    .jacks([{id:'foldIn',dir:'in',kind:'audio',node:function(){return dev.foldIn;},cap:'IN'},
            {id:'foldOut',dir:'out',kind:'audio',node:function(){return dev.foldOut;},cap:'OUT'}]);



  panel(rowA,'m-vcf dbl','VCF',521,'LADDER 24 dB/OCT')
    .ctl([{t:'st',id:'fmode',label:'MODE',opts:[{t:'LP24',v:'lp24'},{t:'LP12',v:'lp12'},{t:'BP',v:'bp'},{t:'HP',v:'hp'}],def:'lp24',
            ap:function(v){
              dev.f1.type=v==='hp'?'highpass':v==='bp'?'bandpass':'lowpass';
              dev.f2.type=v==='lp24'?'lowpass':v==='hp'?'highpass':'allpass';}},
          {t:'k',id:'cut',label:'CUTOFF',min:30,max:16000,def:14000,log:1,fmt:'hz',
            ap:function(v){A.smooth(dev.f1.frequency,v);A.smooth(dev.f2.frequency,v);}},
          {t:'k',id:'res',label:'RESO',min:0,max:1,def:.05,fmt:'pc',
            ap:function(v){A.smooth(dev.f1.Q,.7+v*22,.03);A.smooth(dev.fTrim.gain,1/(1+v*1.5),.03);A.smooth(dev.fThin.gain,-v*11,.03);}},
          {t:'k',id:'fenv',label:'ENV',min:-1,max:1,def:0,fmt:'two',
            ap:function(v){A.smooth(dev.egF.gain,v*7000,.03);}}])
    .jacks([{id:'fIn',dir:'in',kind:'audio',node:function(){return dev.fIn;},cap:'IN'},
            {id:'fCv',dir:'in',kind:'mod',node:function(){return dev.fCvIn;},cap:'CV'},
            {id:'fOut',dir:'out',kind:'audio',node:function(){return dev.fOut;},cap:'OUT'}]);

  panel(rowA,'m-svf narrow','SVF',523,'SEM 12 dB')
    .ctl([{t:'k',id:'scut',label:'FREQ',min:30,max:16000,def:14000,log:1,fmt:'hz',
            ap:function(v){[dev.sLp,dev.sBp,dev.sHp].forEach(function(f){A.smooth(f.frequency,v);});}},
          {t:'k',id:'sres',label:'RESO',min:0,max:1,def:.08,fmt:'pc',
            ap:function(v){[dev.sLp,dev.sBp,dev.sHp].forEach(function(f){A.smooth(f.Q,.7+v*14,.03);});}},
          {t:'k',id:'smode',label:'LP-N-HP',min:0,max:1,def:0,fmt:'pc',ap:function(v){svfBlend(v);}},
          {t:'v',id:'sbp',label:'BAND',min:0,max:1,def:0,fmt:'pc',ap:function(v){A.smooth(dev.sBpG.gain,v);}}])
    .jacks([{id:'sIn',dir:'in',kind:'audio',node:function(){return dev.sIn;},cap:'IN'},
            {id:'sCv',dir:'in',kind:'mod',node:function(){return dev.sCvIn;},cap:'CV'},
            {id:'sOut',dir:'out',kind:'audio',node:function(){return dev.sOut;},cap:'OUT'}]);

  panel(rowB,'m-vca narrow','VCA',530,'LIN / EXP')
    .ctl([{t:'st',id:'vresp',label:'LAW',opts:[{t:'LIN',v:0},{t:'EXP',v:1}],def:0,
            ap:function(v){A.smooth(dev.vLinG.gain,v?0:1,.03);A.smooth(dev.vExpG.gain,v?1:0,.03);}},
          {t:'v',id:'vcaLvl',label:'LEVEL',min:0,max:1.5,def:1,fmt:'pc',ap:function(v){A.smooth(dev.vOut.gain,v);}}])
    .jacks([{id:'vIn',dir:'in',kind:'audio',node:function(){return dev.vIn;},cap:'IN'},
            {id:'vCv',dir:'in',kind:'mod',node:function(){return dev.vCvIn;},cap:'CV'},
            {id:'vOut',dir:'out',kind:'audio',node:function(){return dev.vOut;},cap:'OUT'}]);

  panel(rowB,'m-eg m-eg1 narrow','ENV',540,'AMP','eg1')
    .ctl([{t:'row',items:[
            {t:'v',id:'a',label:'A',min:.001,max:3,def:.005,log:1,fmt:'ms'},
            {t:'v',id:'d',label:'D',min:.005,max:4,def:.3,log:1,fmt:'ms'},
            {t:'v',id:'s',label:'S',min:0,max:1,def:.7,fmt:'pc'},
            {t:'v',id:'r',label:'R',min:.005,max:6,def:.3,log:1,fmt:'ms'}]}])
    .jacks([{id:'e1Out',dir:'out',kind:'mod',node:function(){return dev.eg1;},cap:'OUT'}]);

  panel(rowB,'m-eg m-eg2 narrow','ENV',540,'MOD','eg2')
    .ctl([{t:'row',items:[
            {t:'v',id:'a2',label:'A',min:.001,max:3,def:.005,log:1,fmt:'ms'},
            {t:'v',id:'d2',label:'D',min:.005,max:4,def:.25,log:1,fmt:'ms'},
            {t:'v',id:'s2',label:'S',min:0,max:1,def:.3,fmt:'pc'},
            {t:'v',id:'r2',label:'R',min:.005,max:6,def:.2,log:1,fmt:'ms'}]}])
    .jacks([{id:'e2Out',dir:'out',kind:'mod',node:function(){return dev.eg2;},cap:'OUT'}]);

  panel(rowB,'m-lfo narrow','LFO',555,'MODULATION SOURCE','lfo')
    .ctl([{t:'st',id:'lfoW',label:'SHAPE',
            opts:[{t:'SIN',v:'sine'},{t:'TRI',v:'triangle'},{t:'SAW',v:'sawtooth'},
                  {t:'SQR',v:'square'},{t:'RND',v:'random'}],def:'sine',
            ap:function(v){
              var rnd=v==='random';
              if(!rnd)dev.lfo.type=v;
              A.smooth(dev.lfoOscG.gain,rnd?0:1,.03);
              A.smooth(dev.lfoRndG.gain,rnd?1:0,.03);}},
          {t:'k',id:'lfoR',label:'RATE',min:.05,max:30,def:4,log:1,fmt:function(v){return v.toFixed(2)+'Hz';},
            ap:function(v){A.smooth(dev.lfo.frequency,v);
              dev.lfoRndF.forEach(function(f){A.smooth(f.frequency,UI.clamp(v,.05,30));});}},
          {t:'v',id:'lfoA',label:'AMOUNT',min:0,max:1,def:0,fmt:'pc',
            ap:function(v){A.smooth(dev.lfoAmt.gain,v);A.smooth(dev.lfoPitch.gain,v*90,.03);}}])
    .jacks([{id:'lfoOut',dir:'out',kind:'mod',node:function(){return dev.lfoAmt;},cap:'OUT'}]);

  panel(rowB,'m-eq dbl','EQ',572,'6-BAND SHELVING')
    .ctl([{t:'row',items:[
            {t:'v',id:'eqLo',label:'LO',min:-15,max:15,def:0,fmt:'db',ap:function(v){A.smooth(dev.eLo.gain,v);}},
            {t:'v',id:'eqLm',label:'L-MID',min:-15,max:15,def:0,fmt:'db',ap:function(v){A.smooth(dev.eLmid.gain,v);}},
            {t:'v',id:'eqMid',label:'MID',min:-15,max:15,def:0,fmt:'db',ap:function(v){A.smooth(dev.eMid.gain,v);}}]},
          {t:'row',items:[
            {t:'v',id:'eqHm',label:'H-MID',min:-15,max:15,def:0,fmt:'db',ap:function(v){A.smooth(dev.eHmid.gain,v);}},
            {t:'v',id:'eqPr',label:'PRES',min:-15,max:15,def:0,fmt:'db',ap:function(v){A.smooth(dev.ePres.gain,v);}},
            {t:'v',id:'eqHi',label:'HI',min:-15,max:15,def:0,fmt:'db',ap:function(v){A.smooth(dev.eHi.gain,v);}}]},
          {t:'k',id:'eqLf',label:'LO F',min:40,max:500,def:140,log:1,fmt:'hz',ap:function(v){A.smooth(dev.eLo.frequency,v);}},
          {t:'k',id:'eqMf',label:'MID F',min:150,max:6000,def:900,log:1,fmt:'hz',ap:function(v){A.smooth(dev.eMid.frequency,v);}},
          {t:'k',id:'eqMq',label:'MID Q',min:.3,max:8,def:.9,log:1,fmt:'two',ap:function(v){A.smooth(dev.eMid.Q,v);}},
          {t:'k',id:'eqHf',label:'HI F',min:1500,max:14000,def:6000,log:1,fmt:'hz',ap:function(v){A.smooth(dev.eHi.frequency,v);}}])
    .jacks([{id:'eqIn',dir:'in',kind:'audio',node:function(){return dev.eqIn;},cap:'IN'},
            {id:'eqOut',dir:'out',kind:'audio',node:function(){return dev.eqOut;},cap:'OUT'}]);

  panel(rowB,'m-fx narrow','FX',572,'EFFECT INSERT')
    .ctl([{t:'sel',id:'ifx',label:'TYPE',opts:A.FXTYPES.map(function(t){return{v:t,t:t};}),def:'OFF',ap:function(v){dev.fx.setType(v);}},
          {t:'k',id:'ifxa',label:'AMOUNT',min:0,max:1,def:.5,fmt:'pc',ap:function(v){dev.fx.setAmount(v);}},
          {t:'k',id:'ifxm',label:'MIX',min:0,max:1,def:.2,fmt:'pc',ap:function(v){dev.fx.setMix(v);}}])
    .jacks([{id:'fxIn',dir:'in',kind:'audio',node:function(){return dev.fxIn;},cap:'IN'},
            {id:'fxOut',dir:'out',kind:'audio',node:function(){return dev.fxOut;},cap:'OUT'}]);

  dev.mixA=G(0);dev.mixB=G(0);dev.mixC=G(0);dev.mixOut=G(1);
  dev.mixA.connect(dev.mixOut);dev.mixB.connect(dev.mixOut);dev.mixC.connect(dev.mixOut);
  panel(rowB,'m-mix narrow','MIX',570,'3 x 1 UTILITY')
    .ctl([{t:'row',items:[
            {t:'v',id:'mx1',label:'1',min:0,max:1.2,def:0,fmt:'pc',ap:function(v){A.smooth(dev.mixA.gain,v);}},
            {t:'v',id:'mx2',label:'2',min:0,max:1.2,def:0,fmt:'pc',ap:function(v){A.smooth(dev.mixB.gain,v);}},
            {t:'v',id:'mx3',label:'3',min:0,max:1.2,def:0,fmt:'pc',ap:function(v){A.smooth(dev.mixC.gain,v);}}]}])
    .jacks([{id:'mix1',dir:'in',kind:'audio',node:function(){return dev.mixA;},cap:'1'},
            {id:'mix2',dir:'in',kind:'audio',node:function(){return dev.mixB;},cap:'2'},
            {id:'mix3',dir:'in',kind:'audio',node:function(){return dev.mixC;},cap:'3'},
            {id:'mixOut',dir:'out',kind:'audio',node:function(){return dev.mixOut;},cap:'OUT'}]);

  panel(rowB,'m-out dbl','OUT',580,'VOICE OUTPUT')
    .ctl([{t:'st',id:'arp',label:'ARP',opts:[{t:'OFF',v:'OFF'},{t:'UP',v:'UP'},{t:'DN',v:'DOWN'},{t:'U-D',v:'UD'},{t:'RND',v:'RND'}],def:'OFF',
            ap:function(){dev.held.clear();dev._dirty=true;}},
          {t:'st',id:'arpRate',label:'RATE',opts:[{t:'1/4',v:4},{t:'1/8',v:2},{t:'1/16',v:1}],def:2},
          {t:'k',id:'arpGate',label:'GATE',min:.2,max:.95,def:.8,fmt:'pc'},
          {t:'k',id:'drift',label:'DRIFT',min:0,max:1,def:.35,fmt:'pc',ap:function(v){A.smooth(dev.drift.offset,v,.05);}},
          {t:'v',id:'vol',label:'VOLUME',min:0,max:1.2,def:.8,fmt:'pc',ap:function(v){A.smooth(dev.raw.gain,v);}}])
    .jacks([{id:'mIn',dir:'in',kind:'audio',node:function(){return dev.mIn;},cap:'IN'}]);


  c.append(rowA,rowB);
  dev.kbWrap=UI.keys(dev);c.appendChild(dev.kbWrap);
  dev.chassis=c;
  /* ---------------- normalling ---------------- */
  var NORMS=[['foldIn','aOut'],['fIn','foldOut'],['sIn','fOut'],['vIn','sOut'],
             ['eqIn','vOut'],['fxIn','eqOut'],['mIn','fxOut']];
  dev.jackFlow={aFm:['aOut'],bFm:['bOut'],foldIn:['foldOut'],fIn:['fOut'],fCv:['fOut'],
    sIn:['sOut'],sCv:['sOut'],
    vIn:['vOut'],vCv:['vOut'],eqIn:['eqOut'],fxIn:['fxOut'],mIn:[],
    mix1:['mixOut'],mix2:['mixOut'],mix3:['mixOut']};
  dev.repatch=function(){
    NORMS.forEach(function(nm){
      if(RS.S.cables.some(function(cb){return cb.to.dev===dev.id&&cb.to.jack===nm[0];}))return;
      var o=dev.jackNodes[nm[1]],i=dev.jackNodes[nm[0]];
      if(o&&i){try{o.connect(i);}catch(e){}}});};
  /* ---------------- notes ---------------- */
  function hold(param,t){
    /* cancelScheduledValues does NOT stop a setTargetAtTime that already
       started, so the old ramp keeps pulling against the new one and the
       envelope steps. cancelAndHoldAtTime freezes it at its current value. */
    if(param.cancelAndHoldAtTime){try{param.cancelAndHoldAtTime(t);return;}catch(e){}}
    var cur=param.value;
    param.cancelScheduledValues(t);
    param.setValueAtTime(Number.isFinite(cur)?cur:0,t);}
  function attack(param,t,peak,At,D,S){
    hold(param,t);
    var at=Math.max(At||.002,.002);
    param.linearRampToValueAtTime(peak,t+at);
    param.setTargetAtTime(peak*UI.clamp(S,0,1),t+at,Math.max((D||.1)/3,.008));}
  function release(param,t,R){
    hold(param,t);
    param.setTargetAtTime(0,t,Math.max((R||.2)/3,.008));}
  var slotClock=0;
  function polyN(){return UI.clamp(Math.round(dev.p.voices||1),1,4);}
  function applyVoiceMode(){
    var n=polyN(),t=ctx.currentTime;
    dev.slots.forEach(function(sl,i){
      if(n===1){                       /* mono: card 0 open, shared VCA shapes it */
        if(i===0){try{sl.eg.disconnect(sl.vca.gain);}catch(e){}
          A.smooth(sl.vca.gain,1,.02);}
        else A.smooth(sl.vca.gain,0,.02);
      }else{
        if(i===0){try{sl.eg.connect(sl.vca.gain);}catch(e){}
          A.smooth(sl.vca.gain,0,.02);}
        if(i>=n){sl.note=null;A.smooth(sl.eg.gain,0,.02);}}});
    if(n>1)dev._stack=[];}
  dev.noteOn=function(n,vel,when){
    n=Math.round(+n);
    if(!Number.isFinite(n)||n<0||n>120)return;
    if(vel===undefined||!Number.isFinite(vel))vel=.9;
    vel=UI.clamp(vel,.05,1);
    if(dev.p.arp!=='OFF'&&!dev._arp){dev.held.add(n);dev._dirty=true;return;}
    var p=dev.p,t=Math.max(when||ctx.currentTime,ctx.currentTime),N=polyN();
    if(N>1){
      var free=null,oldest=dev.slots[0];
      for(var i=0;i<N;i++){var sl=dev.slots[i];
        if(sl.note===n){free=sl;break;}
        if(sl.note==null&&!free)free=sl;
        if(sl.age<oldest.age)oldest=sl;}
      var use=free||oldest;
      use.note=n;use.age=++slotClock;
      dev.voices.set(n,1);
      slotTune(use,n,t);
      attack(use.eg.gain,t,vel,p.a,p.d,p.s);
      if(dev.voices.size===1){attack(dev.eg1.gain,t,1,.004,.01,1);
        attack(dev.eg2.gain,t,1,p.a2,p.d2,p.s2);}
      return;}
    var legato=dev._stack.length>0&&p.glide>.01;
    dev._stack=dev._stack.filter(function(x){return x!==n;});
    dev._stack.push(n);
    dev._note=n;dev.voices.set(n,1);
    dev.slots[0].note=n;
    retune(t);
    if(!legato){attack(dev.eg1.gain,t,vel,p.a,p.d,p.s);attack(dev.eg2.gain,t,1,p.a2,p.d2,p.s2);}};
  dev.noteOff=function(n,when){
    n=Math.round(+n);
    if(!Number.isFinite(n))return;
    if(dev.p.arp!=='OFF'&&!dev._arp){dev.held.delete(n);dev._dirty=true;return;}
    if(dev.pedal){dev.sustained.add(n);return;}
    var t=Math.max(when||ctx.currentTime,ctx.currentTime),N=polyN();
    if(N>1){
      dev.voices.delete(n);
      dev.slots.forEach(function(sl){
        if(sl.note===n){sl.note=null;release(sl.eg.gain,t,dev.p.r);}});
      if(!dev.voices.size){release(dev.eg1.gain,t,Math.max(dev.p.r,.01));
        release(dev.eg2.gain,t,dev.p.r2);}
      return;}
    dev._stack=dev._stack.filter(function(x){return x!==n;});
    dev.voices.delete(n);
    if(dev._stack.length){dev._note=dev._stack[dev._stack.length-1];dev.slots[0].note=dev._note;retune(t);}
    else{dev._note=null;dev.slots[0].note=null;
      release(dev.eg1.gain,t,dev.p.r);release(dev.eg2.gain,t,dev.p.r2);}};
  dev.allOff=function(){dev._stack=[];dev._note=null;dev.voices.clear();
    dev.sustained.clear();dev.held.clear();dev._dirty=true;
    var t=ctx.currentTime;
    dev.slots.forEach(function(sl){sl.note=null;release(sl.eg.gain,t,.05);});
    release(dev.eg1.gain,t,.05);release(dev.eg2.gain,t,.05);};
  dev.mod=function(v){A.smooth(dev.vibG.gain,Math.abs(v)*40);};
  dev.bend=function(v){A.smooth(dev.bendG.gain,v*200,.005);};
  var lfoBuf=new Float32Array(32);
  dev.tick=function(){
    var L=dev._leds;
    function lamp(el,v,col){
      if(!el)return;
      v=UI.clamp(v,0,1);
      var on=v>=.02;
      el.style.background=on?col:'#1b1d21';
      el.style.opacity=on?(.35+v*.65):1;
      el.style.boxShadow=on?('0 0 '+(3+v*5).toFixed(1)+'px '+col):'inset 0 0 2px rgba(0,0,0,.9)';}
    lamp(L.eg1,dev.eg1.gain.value,'#f2f2f2');
    lamp(L.eg2,dev.eg2.gain.value,'#ff7a5c');
    lamp(L.opa,dev.eg1.gain.value*(dev.p.lvl||0)*2,'#cbe86a');
    try{dev.lfoAna.getFloatTimeDomainData(lfoBuf);
      lamp(L.lfo,Math.abs(lfoBuf[0])*1.6,'#2f7fbf');}catch(e){}};
  dev.jackNodes.outa=dev.out;dev.jackNodes.outb=dev.pre;
  dev.outs.add('outa');dev.outs.add('outb');
  dev.jackNodes.cvin=G(1);dev.jackNodes.gatein=G(1);
  dev.jackNodes.extIn=dev.foldIn;
  setAlgo(1);setFold(0);svfBlend(0);applyVoiceMode();
},
back:[
  {title:'AUDIO OUT A',jacks:[['outa','out','audio',null,'OUT A · POST-FX']]},
  {title:'AUDIO OUT B',jacks:[['outb','out','audio',null,'OUT B · PRE-FX']]},
  {title:'EXT IN',jacks:[['extIn','in','audio',null,'EXT · TO FOLDER']]},
  {title:'CV / GATE IN',jacks:[['cvin','in','cv',null,'CV IN'],['gatein','in','cv',null,'GATE IN']]}]});

/* ---- NRD-2 sound bank ---- */
var PRESETS_NRD=(function(){
  function P(n,o){
    var d={sq1:.8,sw1:0,nz1:0,pw1:.5,pwm1:.15,pws1:.3,
      hpf1:0,hres1:0,lpf1:.7,lres1:.1,fil1:0,fal1:1,fa1:.02,fd1:.35,fr1:.3,flv1:.8,
      sin1:0,aa1:.02,ad1:.4,as1:.7,ar1:.35,alv1:.8,rvcf1:.5,rvel1:.4,rkey1:.3,raft1:.2,
      sq2:0,sw2:.7,nz2:0,pw2:.5,pwm2:.3,pws2:.3,
      hpf2:0,hres2:0,lpf2:.55,lres2:.2,fil2:0,fal2:1,fa2:.06,fd2:.5,fr2:.4,flv2:.8,
      sin2:.2,aa2:.15,ad2:.5,as2:.6,ar2:.5,alv2:.8,rvcf2:.35,rvel2:.4,rkey2:.3,raft2:.2,
      coarse:0,fine:0,det2:8,drift:.25,ibend:.5,
      rmA:.1,rmD:.4,rmDep:0,rmSpd:.35,rmMod:0,
      lfo1:0,lfo2:1,lspd:.3,lvco:0,lvcf:0,lvca:0,laft:.2,
      ft1:1,ft2:1,fxr:.18,fxd:.1,fxc:.3,mix:.5,vol:.8,drive:0,
      rmOn:0,arpOn:0,cmpOn:1};
    for(var k in o)d[k]=o[k];
    return {n:n,p:d};}
  return [
    P('Blade Runner Brass',{sq1:.9,sw1:.5,pw1:.42,pwm1:.28,pws1:.18,lpf1:.52,lres1:.28,
      fa1:.05,fd1:.55,fr1:.5,rvcf1:.62,aa1:.08,ad1:.6,as1:.72,ar1:.55,
      sq2:.6,sw2:.8,pw2:.36,pwm2:.42,lpf2:.46,lres2:.24,fa2:.11,fd2:.6,fr2:.55,rvcf2:.5,
      sin2:.3,aa2:.16,ad2:.7,as2:.68,ar2:.7,det2:14,drift:.45,
      lspd:.22,lvco:.05,fxr:.34,fxd:.16,fxc:.42,mix:.5,drive:.22,vol:.8}),
    P('Juno Poly Strings',{sq1:.55,sw1:.85,pw1:.5,pwm1:.55,pws1:.14,lpf1:.62,lres1:.12,
      fa1:.22,fd1:.6,fr1:.6,rvcf1:.3,aa1:.3,ad1:.7,as1:.85,ar1:.65,
      sq2:.5,sw2:.9,pwm2:.62,lpf2:.58,fa2:.3,fd2:.65,fr2:.65,rvcf2:.26,
      aa2:.38,ad2:.75,as2:.85,ar2:.75,det2:16,drift:.5,
      lspd:.18,lvco:.04,fxr:.4,fxc:.62,mix:.5,vol:.75}),
    P('Vangelis Lead',{sq1:.95,sw1:.35,pw1:.3,pwm1:.2,pws1:.1,lpf1:.58,lres1:.42,
      fa1:.03,fd1:.5,fr1:.45,rvcf1:.7,aa1:.04,ad1:.5,as1:.8,ar1:.5,
      sq2:.4,sw2:.75,lpf2:.5,lres2:.3,rvcf2:.55,aa2:.06,ad2:.55,as2:.78,ar2:.55,
      sin2:.35,det2:11,drift:.4,ft2:2,
      lspd:.26,lvco:.07,fxr:.42,fxd:.26,fxc:.36,mix:.45,drive:.18,vol:.78}),
    P('Analog Brass Section',{sq1:.8,sw1:.7,pw1:.45,pwm1:.18,lpf1:.5,lres1:.3,
      fa1:.04,fd1:.45,fr1:.35,rvcf1:.75,rvel1:.6,aa1:.05,ad1:.45,as1:.75,ar1:.35,
      sq2:.55,sw2:.85,lpf2:.44,lres2:.26,fa2:.07,fd2:.5,rvcf2:.6,
      aa2:.09,ad2:.5,as2:.72,ar2:.4,det2:10,drift:.35,
      fxr:.22,fxc:.28,mix:.5,drive:.3,vol:.8}),
    P('Warm Choir Pad',{sq1:.45,sw1:.6,nz1:.05,pw1:.5,pwm1:.6,pws1:.09,
      hpf1:.12,lpf1:.5,lres1:.08,fa1:.4,fd1:.7,fr1:.8,rvcf1:.24,
      aa1:.5,ad1:.8,as1:.9,ar1:.85,sin1:.25,
      sq2:.4,sw2:.65,pwm2:.7,lpf2:.46,fa2:.5,fd2:.75,fr2:.85,rvcf2:.2,
      aa2:.6,ad2:.85,as2:.9,ar2:.9,sin2:.3,det2:20,drift:.6,
      lspd:.12,lvco:.06,fxr:.55,fxc:.7,mix:.5,vol:.72}),
    P('Dark Sweep Pad',{sq1:.6,sw1:.75,pw1:.38,pwm1:.5,pws1:.06,
      hpf1:.2,lpf1:.34,lres1:.5,fil1:.05,fa1:.6,fd1:.85,fr1:.9,rvcf1:.85,
      aa1:.55,ad1:.9,as1:.85,ar1:.9,
      sq2:.5,sw2:.7,lpf2:.3,lres2:.45,fa2:.7,fd2:.9,fr2:.95,rvcf2:.8,
      aa2:.65,ad2:.9,as2:.85,ar2:.95,det2:18,drift:.55,ft2:0,
      lspd:.08,lvcf:.3,fxr:.6,fxd:.3,fxc:.5,mix:.5,vol:.7}),
    P('Poly Bass',{sq1:.9,sw1:.4,pw1:.34,pwm1:.1,lpf1:.3,lres1:.35,
      fa1:.02,fd1:.3,fr1:.18,rvcf1:.6,rvel1:.6,aa1:.02,ad1:.35,as1:.5,ar1:.18,
      sq2:0,sw2:0,sin2:.7,lpf2:.3,aa2:.02,ad2:.35,as2:.6,ar2:.2,
      ft1:0,ft2:0,det2:4,drift:.2,fxr:.06,fxc:.12,mix:.42,drive:.25,vol:.85}),
    P('Glass Bell Keys',{sq1:.3,sw1:.2,sin1:.8,lpf1:.85,lres1:.05,
      fa1:.01,fd1:.4,fr1:.5,rvcf1:.35,aa1:.005,ad1:.5,as1:.15,ar1:.5,
      sq2:0,sw2:.25,sin2:.6,lpf2:.9,fa2:.01,fd2:.55,rvcf2:.3,
      aa2:.005,ad2:.6,as2:.1,ar2:.6,det2:24,ft2:3,drift:.3,
      fxr:.45,fxd:.2,fxc:.4,mix:.5,vol:.75}),
    P('Resonant Sweep',{sq1:.7,sw1:.8,pw1:.4,pwm1:.35,lpf1:.28,lres1:.78,
      fil1:.02,fal1:1,fa1:.35,fd1:.7,fr1:.6,rvcf1:.9,
      aa1:.1,ad1:.6,as1:.8,ar1:.5,
      sq2:.5,sw2:.7,lpf2:.24,lres2:.72,fa2:.45,fd2:.75,rvcf2:.85,
      aa2:.15,ad2:.65,as2:.78,ar2:.6,det2:12,drift:.4,
      lspd:.1,lvcf:.22,fxr:.3,fxd:.24,fxc:.34,mix:.5,drive:.15,vol:.75}),
    P('Hollow Fifths',{sq1:.85,sw1:0,pw1:.22,pwm1:.08,lpf1:.6,lres1:.18,
      fa1:.03,fd1:.4,fr1:.35,rvcf1:.45,aa1:.03,ad1:.45,as1:.7,ar1:.35,
      sq2:.85,sw2:0,pw2:.24,lpf2:.56,rvcf2:.4,aa2:.04,ad2:.45,as2:.7,ar2:.4,
      ft1:1,ft2:2,det2:6,drift:.3,fxr:.28,fxc:.3,mix:.5,vol:.78}),
    P('Noise Sweep FX',{sq1:.2,sw1:.2,nz1:.9,hpf1:.3,lpf1:.4,lres1:.6,
      fil1:0,fal1:1,fa1:.7,fd1:.8,fr1:.7,rvcf1:.95,
      aa1:.4,ad1:.8,as1:.7,ar1:.8,
      sq2:0,sw2:.3,nz2:.7,hpf2:.4,lpf2:.35,lres2:.55,fa2:.8,rvcf2:.9,
      aa2:.5,ad2:.85,as2:.7,ar2:.85,drift:.7,
      lspd:.06,lvcf:.4,fxr:.65,fxd:.4,fxc:.4,mix:.5,vol:.7}),
    P('Ring Mod Metal',{sq1:.8,sw1:.5,lpf1:.6,lres1:.3,fa1:.01,fd1:.45,rvcf1:.6,
      aa1:.005,ad1:.5,as1:.4,ar1:.4,
      sq2:.6,sw2:.6,lpf2:.55,aa2:.005,ad2:.55,as2:.35,ar2:.45,
      rmOn:1,rmA:.05,rmD:.5,rmDep:.7,rmSpd:.5,rmMod:.3,det2:9,drift:.35,
      fxr:.35,fxd:.18,mix:.5,drive:.2,vol:.72}),
    P('Soft Electric Piano',{sq1:.35,sw1:.25,sin1:.75,lpf1:.72,lres1:.06,
      fa1:.005,fd1:.45,fr1:.4,rvcf1:.4,rvel1:.7,
      aa1:.005,ad1:.55,as1:.25,ar1:.4,
      sq2:0,sw2:.2,sin2:.5,lpf2:.68,aa2:.008,ad2:.6,as2:.2,ar2:.45,
      det2:7,drift:.25,fxr:.3,fxc:.35,mix:.45,vol:.78}),
    P('Init Poly',{})
  ];})();

/* ============ NRD-2 — dual-layer polyphonic synthesizer ============
   Two complete synth layers stacked per key, each with its own oscillator
   bank, dual HPF/LPF filter with a five-stage envelope, VCA and response
   matrix; shared tuning, ring modulator, two LFOs, footage, effects and a
   layer mixer. Eight-voice polyphony, both layers per voice.

   Pulse width is a real pulse: a sawtooth minus a delayed copy of itself,
   the delay being width/frequency, so PW and PWM behave the way they do on
   hardware rather than being a fixed 50% square. */
RS.dev('fm',{name:'NRD-2',sub:'DUAL-LAYER POLYSYNTH',accent:'#d98fd6',channel:'omni',
build:function(dev){
  var A=RS.A,UI=RS.UI,ctx=A.ctx;
  function G(v){var g=ctx.createGain();g.gain.value=v;return g;}
  var NV=8;                                   /* voices */
  var FEET=[16,8,16/3,4,8/3,2];               /* 16' 8' 5 1/3' 4' 2 2/3' 2' */
  var FEETL=['16&Prime;','8&Prime;','5&#8531;&Prime;','4&Prime;','2&#8532;&Prime;','2&Prime;'];
  var SHAPES=['sine','sawtooth','triangle','square','random'];
  /* ---------------- shared back end ---------------- */
  dev.layerG=[G(.7),G(.7)];                   /* layer bus I / II */
  dev.sum=G(1);
  dev.layerG.forEach(function(g){g.connect(dev.sum);});
  /* ring modulator: layer II ring-modulates layer I, through its own AD env */
  dev.rmIn=G(0);dev.rmCar=G(1);
  dev.rmGate=G(0);                            /* the AD envelope */
  dev.rmOsc=ctx.createOscillator();dev.rmOsc.type='sine';dev.rmOsc.frequency.value=220;dev.rmOsc.start();
  dev.rmDepthG=G(0);dev.rmOsc.connect(dev.rmDepthG);
  dev.rmRing=G(0);                            /* carrier x modulator */
  dev.layerG[0].connect(dev.rmRing);
  dev.rmDepthG.connect(dev.rmRing.gain);
  dev.rmRing.connect(dev.rmGate);dev.rmGate.connect(dev.sum);
  /* drive + effects + output */
  dev.drivePre=G(1);
  dev.driveSh=ctx.createWaveShaper();dev.driveSh.curve=A.tanh(2.2);dev.driveSh.oversample='2x';
  dev.driveDry=G(1);dev.driveWet=G(0);dev.driveSum=G(1);
  dev.sum.connect(dev.driveDry);dev.driveDry.connect(dev.driveSum);
  dev.sum.connect(dev.drivePre);dev.drivePre.connect(dev.driveSh);
  dev.driveSh.connect(dev.driveWet);dev.driveWet.connect(dev.driveSum);
  dev.fxRev=A.makeFX();dev.fxRev.setType('HALL');dev.fxRev.setAmount(.7);dev.fxRev.setMix(1);
  dev.fxDly=A.makeFX();dev.fxDly.setType('TAPE ECHO');dev.fxDly.setAmount(.5);dev.fxDly.setMix(1);
  dev.fxCho=A.makeFX();dev.fxCho.setType('CHORUS');dev.fxCho.setAmount(.6);dev.fxCho.setMix(1);
  dev.sRev=G(0);dev.sDly=G(0);dev.sCho=G(0);
  dev.driveSum.connect(dev.sRev);dev.sRev.connect(dev.fxRev.input);
  dev.driveSum.connect(dev.sDly);dev.sDly.connect(dev.fxDly.input);
  dev.driveSum.connect(dev.sCho);dev.sCho.connect(dev.fxCho.input);
  dev.post=G(1);
  dev.driveSum.connect(dev.post);
  dev.fxRev.output.connect(dev.post);dev.fxDly.output.connect(dev.post);dev.fxCho.output.connect(dev.post);
  dev.comp=ctx.createDynamicsCompressor();
  dev.comp.threshold.value=-20;dev.comp.knee.value=8;dev.comp.ratio.value=3;
  dev.comp.attack.value=.006;dev.comp.release.value=.16;
  dev.compMk=G(A.compTrim(-20,3));
  dev.compDry=G(1);dev.compWet=G(0);dev.compSum=G(1);
  dev.post.connect(dev.compDry);dev.compDry.connect(dev.compSum);
  dev.post.connect(dev.comp);dev.comp.connect(dev.compMk);dev.compMk.connect(dev.compWet);
  dev.compWet.connect(dev.compSum);
  dev.raw=G(.8);
  var saf=A.safeOut();dev.compSum.connect(dev.raw);dev.raw.connect(saf.input);dev.out=saf.output;
  dev.jackNodes.outa=dev.out;dev.outs.add('outa');
  /* ---------------- two LFOs, shared destinations ---------------- */
  function mkLfo(){
    var o=ctx.createOscillator();o.type='sine';o.frequency.value=4;o.start();
    var oscG=G(1),rndG=G(0),outG=G(1);
    o.connect(oscG);oscG.connect(outG);
    var n=A.noiseSrc();
    var r1=ctx.createBiquadFilter();r1.type='lowpass';r1.frequency.value=4;
    var r2=ctx.createBiquadFilter();r2.type='lowpass';r2.frequency.value=4;
    var boost=G(34);
    n.connect(r1);r1.connect(r2);r2.connect(boost);boost.connect(rndG);rndG.connect(outG);
    n.start(Math.random());
    return {osc:o,oscG:oscG,rndG:rndG,out:outG,rnd:[r1,r2]};}
  dev.lfo1=mkLfo();dev.lfo2=mkLfo();
  dev.lfoBus=G(1);dev.lfo1.out.connect(dev.lfoBus);dev.lfo2.out.connect(dev.lfoBus);
  dev.lVco=G(0);dev.lVcf=G(0);dev.lVca=G(0);
  dev.lfoBus.connect(dev.lVco);dev.lfoBus.connect(dev.lVcf);dev.lfoBus.connect(dev.lVca);
  dev.bendG=G(0);dev.aftG=G(0);
  /* ---------------- voices ---------------- */
  dev.voices=new Map();dev.sustained=new Set();dev.pedal=false;
  dev.held=new Set();dev._dirty=true;dev._ai=0;dev._adir=1;dev._seq=[];dev._arp=false;
  function P(k,d){var v=dev.p[k];return v===undefined?d:v;}
  function layerVoice(L,note,vel,t){
    var s=String(L+1);
    var foot=FEET[Math.round(P('ft'+s,1))]||8;
    var base=UI.F2(UI.clamp(note+(P('coarse',0)|0),0,120))*(8/foot);
    var det=L===1?P('det2',0):0;
    var f=UI.clamp(base*Math.pow(2,(P('fine',0)+det)/1200),8,12000);
    var nodes=[],oscs=[],src={};
    function N(x){nodes.push(x);return x;}
    function O(x){oscs.push(x);x.start(t);return x;}
    /* --- pulse: saw minus a delayed saw, delay = width / frequency --- */
    var mix=N(G(1));
    var pwLvl=P('sq'+s,0);
    if(pwLvl>.001){
      var s1=O(ctx.createOscillator()),s2=O(ctx.createOscillator());
      s1.type='sawtooth';s2.type='sawtooth';
      s1.frequency.value=f;s2.frequency.value=f;
      var dly=N(ctx.createDelay(.05));
      var w=UI.clamp(P('pw'+s,.5),.02,.5);
      dly.delayTime.value=w/f;
      var pwmG=N(G(0));
      var pwmOsc=O(ctx.createOscillator());
      pwmOsc.type='triangle';pwmOsc.frequency.value=.05+P('pws'+s,.3)*11;
      pwmG.gain.value=P('pwm'+s,0)*.45/f;
      pwmOsc.connect(pwmG);pwmG.connect(dly.delayTime);
      var inv=N(G(-1)),pg=N(G(pwLvl*.5));
      src.pulse=pg;src.dly=dly;src.pwm=pwmG;src.pwmOsc=pwmOsc;src.f=f;
      s1.connect(pg);s2.connect(dly);dly.connect(inv);inv.connect(pg);
      pg.connect(mix);
      dev.bendG.connect(s1.detune);dev.bendG.connect(s2.detune);
      dev.lVco.connect(s1.detune);dev.lVco.connect(s2.detune);}
    if(P('sw'+s,0)>.001){
      var sa=O(ctx.createOscillator());sa.type='sawtooth';sa.frequency.value=f;
      var sg=N(G(P('sw'+s,0)*.5));sa.connect(sg);sg.connect(mix);src.saw=sg;
      dev.bendG.connect(sa.detune);dev.lVco.connect(sa.detune);}
    if(P('sin'+s,0)>.001){
      var si=O(ctx.createOscillator());si.type='sine';si.frequency.value=f;
      var sig=N(G(P('sin'+s,0)*.6));si.connect(sig);sig.connect(mix);src.sine=sig;
      dev.bendG.connect(si.detune);dev.lVco.connect(si.detune);}
    if(P('nz'+s,0)>.001){
      var nz=A.noiseSrc();oscs.push(nz);nz.start(t,Math.random()*1.5);
      var ng=N(G(P('nz'+s,0)*.25));nz.connect(ng);ng.connect(mix);src.noise=ng;}
    /* --- filter: HPF then LPF, each with resonance --- */
    var hp=N(ctx.createBiquadFilter());hp.type='highpass';
    hp.frequency.value=UI.clamp(20*Math.pow(400,P('hpf'+s,0)),20,8000);
    hp.Q.value=.7+P('hres'+s,0)*12;
    var lp=N(ctx.createBiquadFilter());lp.type='lowpass';
    var key=P('rkey'+s,0)*(note-60)/12;
    var cut=UI.clamp(60*Math.pow(260,P('lpf'+s,.8))*Math.pow(2,key),40,17000);
    lp.frequency.value=cut;
    lp.Q.value=.7+P('lres'+s,0)*22;
    var lpTrim=N(G(1/(1+P('lres'+s,0)*.55)));
    mix.connect(hp);hp.connect(lp);lp.connect(lpTrim);
    /* filter envelope: IL -> AL over A, decay to IL over D, release over R */
    var envAmt=P('rvcf'+s,0)*(1+P('rvel'+s,0)*(vel-.5)*2);
    var fEnv=N(G(0));
    var fSrc=ctx.createConstantSource();fSrc.offset.value=1;fSrc.start(t);oscs.push(fSrc);
    fSrc.connect(fEnv);
    var fAmt=N(G(envAmt*6500));
    fEnv.connect(fAmt);fAmt.connect(lp.frequency);
    dev.lVcf.connect(lp.frequency);
    var IL=P('fil'+s,0),AL=P('fal'+s,1),At=.002+P('fa'+s,0)*3,Dt=.01+P('fd'+s,.3)*4;
    fEnv.gain.setValueAtTime(IL,t);
    fEnv.gain.linearRampToValueAtTime(AL,t+At);
    fEnv.gain.setTargetAtTime(IL,t+At,Math.max(Dt/3,.01));
    /* --- VCA --- */
    var outG=N(G(P('flv'+s,.8)));
    lpTrim.connect(outG);
    var vca=N(G(0));
    outG.connect(vca);
    var peak=UI.clamp(vel,.05,1)*P('alv'+s,.8)*.5;
    var aA=.002+P('aa'+s,.02)*3,aD=.01+P('ad'+s,.3)*4,aS=P('as'+s,.7),aR=.01+P('ar'+s,.3)*5;
    vca.gain.setValueAtTime(0,t);
    vca.gain.linearRampToValueAtTime(peak,t+aA);
    vca.gain.setTargetAtTime(peak*aS,t+aA,Math.max(aD/3,.01));
    dev.lVca.connect(vca.gain);
    dev.aftG.connect(vca.gain);
    vca.connect(dev.layerG[L]);
    var part={nodes:nodes,oscs:oscs,vca:vca,fEnv:fEnv,fr:.01+P('fr'+s,.3)*5,ar:aR,IL:IL,
      L:L,note:note,vel:vel,hp:hp,lp:lp,lpTrim:lpTrim,fAmt:fAmt,outG:outG,src:src};
    /* re-read the panel and push it at the live nodes, so turning a knob
       changes notes that are already sounding, the way hardware does */
    part.apply=function(){
      var q=String(L+1),now=ctx.currentTime;
      A.smooth(hp.frequency,UI.clamp(20*Math.pow(400,P('hpf'+q,0)),20,8000));
      A.smooth(hp.Q,.7+P('hres'+q,0)*12,.03);
      var kk=P('rkey'+q,0)*(note-60)/12;
      A.smooth(lp.frequency,UI.clamp(60*Math.pow(260,P('lpf'+q,.8))*Math.pow(2,kk),40,17000));
      A.smooth(lp.Q,.7+P('lres'+q,0)*22,.03);
      A.smooth(lpTrim.gain,1/(1+P('lres'+q,0)*.55),.03);
      A.smooth(fAmt.gain,P('rvcf'+q,0)*(1+P('rvel'+q,0)*(vel-.5)*2)*6500,.03);
      A.smooth(outG.gain,P('flv'+q,.8));
      if(src.pulse)A.smooth(src.pulse.gain,P('sq'+q,0)*.5);
      if(src.saw)A.smooth(src.saw.gain,P('sw'+q,0)*.5);
      if(src.sine)A.smooth(src.sine.gain,P('sin'+q,0)*.6);
      if(src.noise)A.smooth(src.noise.gain,P('nz'+q,0)*.25);
      if(src.dly){
        A.smooth(src.dly.delayTime,UI.clamp(P('pw'+q,.5),.02,.5)/src.f,.03);
        A.smooth(src.pwm.gain,P('pwm'+q,0)*.45/src.f,.03);
        A.smooth(src.pwmOsc.frequency,.05+P('pws'+q,.3)*11,.03);}};
    dev.live.push(part);
    return part;}
  dev.live=[];
  dev.applyLive=function(){
    for(var i=0;i<dev.live.length;i++){try{dev.live[i].apply();}catch(e){}}};
  function mkVoice(note,vel,t){
    var parts=[];
    if(P('mix',.5)<.995)parts.push(layerVoice(0,note,vel,t));
    if(P('mix',.5)>.005)parts.push(layerVoice(1,note,vel,t));
    return {note:note,parts:parts,
      off:function(tO){
        var end=tO;
        parts.forEach(function(pt){
          var cur=pt.vca.gain.value;
          pt.vca.gain.cancelScheduledValues(tO);
          pt.vca.gain.setValueAtTime(Number.isFinite(cur)?cur:0,tO);
          pt.vca.gain.setTargetAtTime(0,tO,Math.max(pt.ar/3,.01));
          var fc=pt.fEnv.gain.value;
          pt.fEnv.gain.cancelScheduledValues(tO);
          pt.fEnv.gain.setValueAtTime(Number.isFinite(fc)?fc:0,tO);
          pt.fEnv.gain.setTargetAtTime(pt.IL,tO,Math.max(pt.fr/3,.01));
          var e=tO+Math.max(pt.ar*3,.2)+.1;if(e>end)end=e;
          pt.oscs.forEach(function(o){try{o.stop(e);}catch(err){}});
          if(pt.oscs[0])pt.oscs[0].onended=function(){
            pt.nodes.forEach(function(n){try{n.disconnect();}catch(err){}});
            var ix=dev.live.indexOf(pt);if(ix>=0)dev.live.splice(ix,1);};});
        return end;}};}
  /* ---------------- panel ---------------- */
  /* ---------------- panel ----------------
     Two blocks, as on a Prophet-style plate: a brushed dark block carrying the
     signal path (oscillators, filters, envelopes) with its section names set
     into the bottom rail, and a red block underneath for modulation, tuning,
     amplifier, voicing and effects. Controls run in signal order. */
  var c=UI.el('div','chassis pv');
  var hd=UI.el('div','pheader pvhead');
  hd.appendChild(UI.el('div','pvbrand','<b>NRD&#8209;2</b><small>DUAL&#8209;LAYER POLYPHONIC SYNTHESIZER</small>'));
  hd.appendChild(UI.el('div','sp'));
  hd.appendChild(UI.presets(dev,PRESETS_NRD,0));
  dev.mchip=UI.el('div','mchip','<i></i>CH OMNI');
  dev.mchip.onclick=function(){RS.openModal('#midiModal');};
  hd.appendChild(dev.mchip);
  c.appendChild(hd);
  /* --- spec helpers --- */
  function K(id,label,def,fmt,min,max,ap){
    return {t:'k',id:id,label:label,min:min===undefined?0:min,max:max===undefined?1:max,
            def:def,fmt:fmt||'pc',ap:ap};}
  function F(id,label,def,fmt,min,max,ap){
    return {t:'v',id:id,label:label,min:min===undefined?0:min,max:max===undefined?1:max,
            def:def,fmt:fmt||'pc',ap:ap};}
  function autoAp(it){if((it.t==='k'||it.t==='v')&&!it.ap)it.ap=function(){dev.applyLive();};return it;}
  /* a labelled cluster of knobs */
  function knobs(cap,items){
    var g=UI.el('div','pvgrp');
    if(cap)g.appendChild(UI.el('div','pvcap',cap));
    var b=UI.el('div','pvknobs');
    items.forEach(function(it){b.appendChild(UI.ctl(dev,autoAp(it)));});
    g.appendChild(b);return g;}
  /* a labelled bank of faders sharing one graduation ruler */
  function faders(cap,items){
    var g=UI.el('div','pvgrp');
    if(cap)g.appendChild(UI.el('div','pvcap',cap));
    var b=UI.el('div','pvfaders');
    items.forEach(function(it){b.appendChild(UI.ctl(dev,autoAp(it)));});
    g.appendChild(b);return g;}
  /* text buttons in the plate style; active option lights red */
  function chooser(cap,id,opts,def,ap){
    var g=UI.el('div','pvgrp');
    if(cap)g.appendChild(UI.el('div','pvcap',cap));
    var row=UI.el('div','pvbtns');
    dev.p[id]=def;
    var bs=[];
    opts.forEach(function(o){
      var b=UI.el('button','pvbtn',o.t);
      b.onclick=function(){dev.P[id].set(o.v);};
      row.appendChild(b);bs.push(b);});
    dev.P[id]={set:function(v){dev.p[id]=v;
      bs.forEach(function(b,i){b.classList.toggle('on',String(opts[i].v)===String(v));});
      if(ap)try{ap(v);}catch(e){}},_def:def};
    dev.P[id].set(def);
    g.appendChild(row);return g;}
  function led(cap,id,def,ap){
    var g=UI.el('div','pvgrp pvledg');
    var b=UI.el('button','pvled');
    dev.p[id]=def?1:0;
    dev.P[id]={set:function(v){v=v?1:0;dev.p[id]=v;b.classList.toggle('on',!!v);
      if(ap)try{ap(v);}catch(e){}},_def:def?1:0};
    b.onclick=function(){dev.P[id].set(dev.p[id]?0:1);};
    dev.P[id].set(def?1:0);
    g.appendChild(b);
    if(cap)g.appendChild(UI.el('div','pvcap',cap));
    return g;}
  function panel(block,cls,title,dark){
    var p=UI.el('div','pvpanel '+cls);
    var body=UI.el('div','pvbody');
    var rail=UI.el('div','pvrail','<i>&#9660;</i>'+title);
    if(dark){p.append(body,rail);}else{p.append(rail,body);}
    block.appendChild(p);
    return {add:function(){for(var i=0;i<arguments.length;i++)body.appendChild(arguments[i]);return this;}};}
  var FEETO=[{t:'32',v:0},{t:'16',v:1},{t:'8',v:2},{t:'4',v:3},{t:'2',v:4},{t:'1',v:5}];
  var SHP=[{t:'&#8767;',v:0},{t:'&#9585;',v:1},{t:'&#9651;',v:2},{t:'&#9633;',v:3},{t:'RND',v:4}];
  /* ================= DARK BLOCK ================= */
  var dark=UI.el('div','pvblock');
  var rA=UI.el('div','pvrow');
  panel(rA,'w-vco','DUAL VCO',1).add(
    knobs('VCO 1',[K('sq1','Square',.8),K('sw1','Saw',0),K('sin1','Sine',0),K('nz1','Noise',0)]),
    chooser('FEET 1','ft1',FEETO,1,function(){dev.applyLive();}),
    knobs('VCO 2',[K('sq2','Square',0),K('sw2','Saw',.7),K('sin2','Sine',.2),K('nz2','Noise',0)]),
    chooser('FEET 2','ft2',FEETO,1,function(){dev.applyLive();}),
    faders('PULSE',[F('pw1','PW 1',.5,'pc',.02,.5),F('pwm1','PWM 1',.15),
                    F('pw2','PW 2',.5,'pc',.02,.5),F('pwm2','PWM 2',.3)]),
    knobs('PW RATE',[K('pws1','Speed 1',.3),K('pws2','Speed 2',.3)]),
    knobs('TUNE',[K('coarse','Coarse',0,'semi',-24,24,function(){dev.applyLive();}),
                  K('fine','Fine',0,'ct',-50,50,function(){dev.applyLive();}),
                  K('det2','Detune',8,'ct',0,40),
                  K('mix','Mix',.5,'pc',0,1,function(v){
                    A.smooth(dev.layerG[0].gain,Math.cos(v*Math.PI/2)*.9);
                    A.smooth(dev.layerG[1].gain,Math.sin(v*Math.PI/2)*.9);})]));
  panel(rA,'w-hpf','HPF | PRE',1).add(
    faders('FREQUENCY',[F('hpf1','I',0),F('hpf2','II',0)]),
    faders('RES',[F('hres1','I',0),F('hres2','II',0)]));
  panel(rA,'w-vcf','VCF | MULTIMODE',1).add(
    faders('CUTOFF',[F('lpf1','I',.7),F('lpf2','II',.55)]),
    faders('RES',[F('lres1','I',.1),F('lres2','II',.2)]),
    faders('KYBD',[F('rkey1','I',.3),F('rkey2','II',.3)]),
    knobs('ENV AMT',[K('rvcf1','VCF 1',.5),K('rvcf2','VCF 2',.35)]),
    knobs('LFO&#8594;VCF',[K('lvcf','Amount',0,'pc',0,1,function(v){A.smooth(dev.lVcf.gain,v*4200);})]));
  dark.appendChild(rA);
  var rB=UI.el('div','pvrow');
  panel(rB,'w-env','DIGITAL ENV 1  &#183;  LAYER I',1).add(
    faders('FILTER',[F('fil1','IL',0),F('fal1','AL',1),F('fa1','A',.02),F('fd1','D',.35),F('fr1','R',.3)]),
    faders('AMPLIFIER',[F('aa1','A',.02),F('ad1','D',.4),F('as1','S',.7),F('ar1','R',.35)]),
    faders('LEVEL',[F('flv1','VCF',.8),F('alv1','VCA',.8)]),
    knobs('RESPONSE',[K('rvel1','Vel',.4),K('raft1','Aft',.2)]));
  panel(rB,'w-env','DIGITAL ENV 2  &#183;  LAYER II',1).add(
    faders('FILTER',[F('fil2','IL',0),F('fal2','AL',1),F('fa2','A',.06),F('fd2','D',.5),F('fr2','R',.4)]),
    faders('AMPLIFIER',[F('aa2','A',.15),F('ad2','D',.5),F('as2','S',.6),F('ar2','R',.5)]),
    faders('LEVEL',[F('flv2','VCF',.8),F('alv2','VCA',.8)]),
    knobs('RESPONSE',[K('rvel2','Vel',.4),K('raft2','Aft',.2)]));
  dark.appendChild(rB);
  c.appendChild(dark);
  /* ================= RED BLOCK ================= */
  var red=UI.el('div','pvblock pvred');
  var rC=UI.el('div','pvrow');
  panel(rC,'w-lfo','LFO 1  |  VIBRATO').add(
    chooser('WAVEFORM','lfo1',SHP,0,function(v){setShape(dev.lfo1,v);}),
    knobs('',[K('lspd','Rate',.3,'hz',.05,24,function(v){
        A.smooth(dev.lfo1.osc.frequency,v);A.smooth(dev.lfo2.osc.frequency,v*1.37);
        dev.lfo1.rnd.concat(dev.lfo2.rnd).forEach(function(f){A.smooth(f.frequency,UI.clamp(v,.05,24));});}),
      K('lvco','Depth',0,'pc',0,1,function(v){A.smooth(dev.lVco.gain,v*70);})]));
  panel(rC,'w-lfo','LFO 2  |  MOD').add(
    chooser('WAVEFORM','lfo2',SHP,1,function(v){setShape(dev.lfo2,v);}),
    knobs('',[K('lvca','&#8594;VCA',0,'pc',0,1,function(v){A.smooth(dev.lVca.gain,v*.35);}),
              K('laft','&#8594;Aft',.2)]));
  panel(rC,'w-tune','TUNING  |  VOICE').add(
    knobs('',[K('drift','Drift',.25),K('ibend','Bend',.5,'two',-1,1)]),
    chooser('VOICE MODE','arpOn',[{t:'poly',v:0},{t:'arp',v:1}],0,function(v){
      dev.p.arp=v?'UP':'OFF';dev.held.clear();dev._dirty=true;}));
  panel(rC,'w-amp','AMPLIFIER  |  OUT').add(
    knobs('',[K('vol','Volume',.8,'pc',0,1.2,function(v){A.smooth(dev.raw.gain,v);}),
              K('drive','Drive',0,'pc',0,1,function(v){
                A.smooth(dev.drivePre.gain,1+v*5,.03);
                A.smooth(dev.driveWet.gain,v,.03);A.smooth(dev.driveDry.gain,1-v*.8,.03);})]),
    led('COMP','cmpOn',1,function(v){
      A.smooth(dev.compWet.gain,v?1:0,.03);A.smooth(dev.compDry.gain,v?0:1,.03);}));
  red.appendChild(rC);
  var rD=UI.el('div','pvrow');
  panel(rD,'w-ring','RING MODULATOR').add(
    led('ON','rmOn',0,function(v){A.smooth(dev.rmGate.gain,v?1:0,.03);}),
    knobs('',[K('rmA','Attack',.1),K('rmD','Decay',.4),K('rmDep','Depth',0),
              K('rmSpd','Speed',.35,'hz',20,2000),K('rmMod','Mod',0)]));
  panel(rD,'w-fx','EFFECT 1  |  MODULATION').add(
    knobs('',[K('fxc','Chorus',.3,'pc',0,1,function(v){A.smooth(dev.sCho.gain,v);}),
              K('fxd','Delay',.1,'pc',0,1,function(v){A.smooth(dev.sDly.gain,v);})]));
  panel(rD,'w-fx','EFFECT 2  |  SPACE').add(
    knobs('',[K('fxr','Reverb',.18,'pc',0,1,function(v){A.smooth(dev.sRev.gain,v);})]));
  red.appendChild(rD);
  c.appendChild(red);
  dev.kbWrap=UI.keys(dev);c.appendChild(dev.kbWrap);
  dev.chassis=c;
  function setShape(l,i){
    var rnd=i===4;
    if(!rnd)l.osc.type=SHAPES[i];
    A.smooth(l.oscG.gain,rnd?0:1,.03);A.smooth(l.rndG.gain,rnd?1:0,.03);}
  /* ---------------- note handling ---------------- */
  dev.p.arp='OFF';dev.p.arpRate=2;dev.p.arpOct=1;dev.p.arpGate=.8;
  dev.noteOn=function(n,vel,when){
    n=Math.round(+n);
    if(!Number.isFinite(n)||n<0||n>120)return;
    if(vel===undefined||!Number.isFinite(vel))vel=.9;
    vel=UI.clamp(vel,.05,1);
    if(dev.p.arp!=='OFF'&&!dev._arp){dev.held.add(n);dev._dirty=true;return;}
    var t=Math.max(when||ctx.currentTime,ctx.currentTime);
    var old=dev.voices.get(n);if(old){old.off(t);dev.voices.delete(n);}
    if(dev.voices.size>=NV){var k=dev.voices.keys().next().value;
      dev.voices.get(k).off(t);dev.voices.delete(k);}
    dev.voices.set(n,mkVoice(n,vel,t));
    if(dev.p.rmOn)A.smooth(dev.rmGate.gain,1,.02+P('rmA',.1)*.6);};
  dev.noteOff=function(n,when){
    n=Math.round(+n);
    if(!Number.isFinite(n))return;
    if(dev.p.arp!=='OFF'&&!dev._arp){dev.held.delete(n);dev._dirty=true;return;}
    if(dev.pedal){dev.sustained.add(n);return;}
    var t=Math.max(when||ctx.currentTime,ctx.currentTime);
    var v=dev.voices.get(n);if(v){v.off(t);dev.voices.delete(n);}
    if(!dev.voices.size&&dev.p.rmOn)A.smooth(dev.rmGate.gain,0,.02+P('rmD',.4)*.8);};
  dev.allOff=function(){var t=ctx.currentTime;
    dev.voices.forEach(function(v){v.off(t);});dev.voices.clear();
    dev.sustained.clear();dev.held.clear();dev._dirty=true;
    A.smooth(dev.rmGate.gain,0,.05);};
  dev.mod=function(v){A.smooth(dev.lVca.gain,UI.clamp(v,0,1)*.2);};
  dev.bend=function(v){A.smooth(dev.bendG.gain,v*200,.005);};
  dev.tick=function(){
    if(!dev.nameTag||!dev.loadPreset)return;};
  /* drift + initial bend land on the shared bend bus */
  (function(){
    var n=A.noiseSrc();
    var l1=ctx.createBiquadFilter();l1.type='lowpass';l1.frequency.value=.8;
    var l2=ctx.createBiquadFilter();l2.type='lowpass';l2.frequency.value=1.3;
    var g=G(2600),trim=G(0);
    n.connect(l1);l1.connect(l2);l2.connect(g);g.connect(trim);trim.connect(dev.bendG);
    n.start(Math.random());
    dev.driftSrc=ctx.createConstantSource();dev.driftSrc.offset.value=.25;dev.driftSrc.start();
    dev.driftSrc.connect(trim.gain);})();
  dev.P.drift={set:function(v){dev.p.drift=UI.clamp(v,0,1);
    A.smooth(dev.driftSrc.offset,dev.p.drift,.05);},_def:.25};
  setShape(dev.lfo1,0);setShape(dev.lfo2,1);
},
back:[{title:'AUDIO OUT',jacks:[['outa','out','audio',null,'OUT']]}]});

/* ============ RD-8 (unchanged) ============ */
RS.dev('rd',{name:'RD-8',sub:'RHYTHM COMPOSER · 808',accent:'#f2a33c',channel:'omni',
build:function(dev){
  var A=RS.A,UI=RS.UI,ctx=A.ctx;
  dev.raw=ctx.createGain();dev.raw.gain.value=.85;
  var saf=A.safeOut();dev.raw.connect(saf.input);dev.bus=saf.output;
  dev.jackNodes.outa=dev.bus;dev.outs.add('outa');
  dev.sel=0;dev.viewBar=0;
  dev.p.bank=0;dev.p.bars=1;dev.p.rswing=14;dev.p.res=16;dev.p.dset='808';
  dev._st=0;dev._nt=0;
  dev.pat=[];
  for(var b=0;b<8;b++){var nb=[];
    for(var t=0;t<NTRK;t++){var row=[];for(var k=0;k<16;k++)row.push(0);nb.push(row);}
    dev.pat.push(nb);}
  dev.drum=Array.from({length:NTRK},function(){return{tune:1,dec:.4,lvl:.85};});
  dev.dmap={};
  function dm(tr,notes){notes.forEach(function(n){dev.dmap[n]=tr;});}
  dm(0,[35,36]);dm(1,[37,38,40]);dm(2,[39]);dm(3,[41,45]);
  dm(4,[47,50]);dm(5,[42,44]);dm(6,[46,49,51,55,59]);dm(7,[53,56,57,62,63,69,75]);
  dm(8,[33,34,43,58]);
  function reshape(){
    var res=dev.p.res||16,bars=dev.p.bars||1,need=bars*res;
    while(dev.pat.length<8)dev.pat.push([]);
    for(var b=0;b<8;b++){
      var bk=dev.pat[b];
      if(!Array.isArray(bk)){bk=[];dev.pat[b]=bk;}
      while(bk.length<NTRK)bk.push([]);
      for(var t=0;t<NTRK;t++){
        var tr=bk[t];
        if(!Array.isArray(tr)){tr=[];bk[t]=tr;}
        for(var i=0;i<need;i++)if(typeof tr[i]!=='number')tr[i]=0;
        if(tr.length>need)tr.length=need;}}}
  dev.reshape=reshape;
  dev.getStep=function(pos,tr){
    var bk=dev.pat[dev.p.bank];
    if(!bk||!bk[tr])return 0;
    var v=bk[tr][pos];
    return typeof v==='number'?v:0;};
  function applySet(nm){
    var s=DSETS[nm]||DSETS['808'];
    for(var t=0;t<NTRK;t++){
      dev.drum[t].tune=UI.clamp(DDEF[t][0]*s.tune,.4,2.5);
      dev.drum[t].dec=UI.clamp(DDEF[t][1]*s.dec,0,1);
      dev.drum[t].lvl=DDEF[t][2];}
    dev.p.dset=nm;
    var dr=dev.drum[dev.sel];
    dev.P.tune.set(dr.tune,false);
    dev.P.dec.set(dr.dec,false);
    dev.P.lvl.set(dr.lvl,false);}
  function loadKit(nm,quiet){
    try{
      var kit=RGEN[nm];
      var b=UI.clamp(dev.p.bank|0,0,7);
      var res=dev.p.res||16,bars=dev.p.bars||1;
      var nb=[];
      for(var t=0;t<NTRK;t++){
        var kp=(kit.pat&&kit.pat[t])||'................';
        var row=[];
        for(var s=0;s<bars*res;s++){
          var src=kp.charAt(Math.floor((s%res)*16/res));
          row.push(src==='X'?2:src==='x'?1:0);}
        nb.push(row);}
      dev.pat[b]=nb;
      dev.drum[0].dec=kit.bd;
      if(dev.sel===0&&dev.P.dec)dev.P.dec.set(kit.bd,false);
      renderSteps();
      if(!quiet)UI.toast('RD-8 · '+nm+' kit loaded');
    }catch(e){UI.toast('RD-8 kit error: '+e.message,6000);}}
  function rndBar(){
    try{
      var b=UI.clamp(dev.p.bank|0,0,7);
      var res=dev.p.res||16;
      var off=dev.viewBar*res;
      for(var t=0;t<NTRK;t++){
        var tr=dev.pat[b][t];
        if(!tr)continue;
        for(var s=0;s<res;s++){
          var p=0;
          if(t===0)p=(s%Math.max(1,Math.round(res/4))===0)?.85:(s%2===0?.3:.08);
          else if(t===1)p=(s%Math.max(1,Math.round(res/2))===Math.round(res/4))?.8:.05;
          else if(t===2)p=(s%Math.max(1,Math.round(res/4))===Math.round(res/8))?.35:.04;
          else if(t===5)p=.7;
          else if(t===6)p=(s%Math.max(1,Math.round(res/2))===Math.round(res/4))?.4:.05;
          else if(t===8)p=(s%Math.max(1,Math.round(res/4))===0||s%Math.max(1,Math.round(res/4))===3)?.3:.04;
          else p=.06;
          var r=Math.random();
          tr[off+s]=r<p?(Math.random()<.3?2:1):0;}}
      renderSteps();
      UI.toast('RD-8 · randomized bar '+(dev.viewBar+1));
    }catch(e){UI.toast('RD-8 RND error: '+e.message,6000);}}
  var c=UI.el('div','chassis');
  var hd=UI.el('div','pheader');
  hd.appendChild(UI.el('div','plate','RD-8<small>RHYTHM COMPOSER</small>'));
  hd.appendChild(UI.el('div','sp'));
  dev.mchip=UI.el('div','mchip','<i></i>CH OMNI');
  dev.mchip.onclick=function(){RS.openModal('#midiModal');};
  hd.appendChild(dev.mchip);c.appendChild(hd);
  var grid=UI.el('div','trks');
  dev.stepBtns=[];
  function buildGrid(){
    grid.innerHTML='';
    dev.stepBtns=[];
    var res=dev.p.res||16;
    for(var i=0;i<NTRK;i++){
      var row=UI.el('div','steprow');
      row.appendChild(UI.el('div','trlab',DRLAB[i][0]));
      var btns=[];
      for(var k=0;k<res;k++){
        var bb=UI.el('button','stepbtn','<i></i>');
        (function(ti,sk){
        bb.onclick=function(){try{
          reshape();
          var src=dev.pat[dev.p.bank];
          if(!src||!src[ti])return;
          var off=dev.viewBar*(dev.p.res||16);
          src[ti][off+sk]=((src[ti][off+sk]||0)+1)%3;
          renderSteps();
        }catch(e){UI.toast('Step error: '+e.message);}};
        })(i,k);
        row.appendChild(bb);btns.push(bb);}
      dev.stepBtns.push(btns);
      grid.appendChild(row);}}
  function renderSteps(){
    if(!dev.stepBtns||!dev.stepBtns.length)return;
    reshape();
    var res=dev.p.res||16;
    var src=dev.pat[dev.p.bank],off=dev.viewBar*res;
    dev.barLab.textContent='BAR '+(dev.viewBar+1)+'/'+(dev.p.bars||1);
    for(var i=0;i<NTRK;i++){
      var tr=src[i];
      for(var k=0;k<res;k++){
        var b=dev.stepBtns[i][k];
        if(b)b.dataset.v=(tr&&(typeof tr[off+k]==='number'?tr[off+k]:0))||0;}}}
  dev.renderSteps=renderSteps;
  c.appendChild(UI.panels(dev,[
    {title:'COMPOSER',controls:[
      {t:'sel',id:'bank',label:'BANK',opts:'ABCDEFGH'.split('').map(function(b){return{v:'ABCDEFGH'.indexOf(b),t:b};}),def:0,
        ap:function(v){dev.p.bank=UI.clamp(v|0,0,7);dev.viewBar=0;reshape();renderSteps();}},
      {t:'sel',id:'bars',label:'BARS',opts:[1,2,4,8,16,32].map(function(n){return{v:n,t:String(n)};}),def:1,
        ap:function(v){dev.p.bars=UI.clamp(Number(v)||1,1,32);dev.viewBar=0;reshape();renderSteps();}},
      {t:'sel',id:'res',label:'METER',opts:[{v:16,t:'16'},{v:12,t:'12 · TRIPLET'},{v:8,t:'8'}],def:16,
        ap:function(v){dev.p.res=UI.clamp(Number(v)||16,1,32);dev.viewBar=0;reshape();buildGrid();renderSteps();
          UI.toast('RD-8 · '+(dev.p.res===12?'TRIPLETS':dev.p.res+' steps/bar'));}},
      {t:'sel',id:'dset',label:'DRUM SET',opts:Object.keys(DSETS).map(function(n){return{v:n,t:n};}),def:'808',
        ap:function(v){try{applySet(v);UI.toast('RD-8 · '+v+' drum set');}catch(e){UI.toast('Set error: '+e.message);}}},
      {t:'cus',fn:function(){
        var nav=UI.el('div','stpr');nav.appendChild(UI.el('div','kl2','EDIT BAR'));
        var nrw=UI.el('div','stprow');
        var bl=UI.el('button','stpb','&#9664;');
        dev.barLab=UI.el('span','blab','BAR 1/1');
        var brr=UI.el('button','stpb','&#9654;');
        bl.onclick=function(){dev.viewBar=Math.max(0,dev.viewBar-1);renderSteps();};
        brr.onclick=function(){dev.viewBar=Math.min((dev.p.bars||1)-1,dev.viewBar+1);renderSteps();};
        nrw.append(bl,dev.barLab,brr);nav.appendChild(nrw);return nav;}},
      {t:'bt',group:'TOOLS',label:'COPY',wide:1,fn:function(){reshape();
        if(dev.viewBar+1>=(dev.p.bars||1)){UI.toast('No next bar — raise BARS first');return;}
        var res=dev.p.res||16,src=dev.pat[dev.p.bank],off=dev.viewBar*res;
        for(var t=0;t<NTRK;t++)for(var k=0;k<res;k++)src[t][off+res+k]=src[t][off+k]||0;
        dev.viewBar++;renderSteps();UI.toast('Bar copied to '+(dev.viewBar+1));}},
      {t:'bt',label:'FILL',wide:1,fn:function(){reshape();var res=dev.p.res||16,src=dev.pat[dev.p.bank],off=dev.viewBar*res;
        for(var bar=0;bar<(dev.p.bars||1);bar++){if(bar===dev.viewBar)continue;
          for(var t=0;t<NTRK;t++)for(var k=0;k<res;k++)src[t][bar*res+k]=src[t][off+k]||0;}
        UI.toast('All bars filled with bar '+(dev.viewBar+1));}},
      {t:'bt',label:'RND',wide:1,fn:rndBar},
      {t:'bt',label:'CLR',wide:1,fn:function(){reshape();var res=dev.p.res||16,src=dev.pat[dev.p.bank],off=dev.viewBar*res;
        for(var t=0;t<NTRK;t++)for(var k=0;k<res;k++)src[t][off+k]=0;
        renderSteps();}}]},
    {title:'TUNE · DECAY · LEVEL · SWING',controls:[
      {t:'k',id:'tune',label:'TUNE',min:.5,max:2,def:1,fmt:'x',ap:function(v){if(dev.drum[dev.sel])dev.drum[dev.sel].tune=v;}},
      {t:'k',id:'dec',label:'DECAY',min:0,max:1,def:.32,fmt:'pc',ap:function(v){if(dev.drum[dev.sel])dev.drum[dev.sel].dec=v;}},
      {t:'k',id:'lvl',label:'LEVEL',min:0,max:1.2,def:.95,fmt:'pc',ap:function(v){if(dev.drum[dev.sel])dev.drum[dev.sel].lvl=v;}},
      {t:'k',id:'rswing',label:'SWING',min:0,max:60,def:14,fmt:'pc'},
      {t:'k',id:'vol',label:'VOLUME',min:0,max:1.2,def:.85,fmt:'pc',ap:function(v){dev.raw.gain.setTargetAtTime(v,ctx.currentTime,.02);}},
      {t:'st',id:'run',label:'RUN',opts:[{t:'OFF',v:0},{t:'ON',v:1}],def:1}]},
    {title:'STYLE KITS · RM1X',controls:KITNAMES.map(function(nm){
      return{t:'bt',label:nm,wide:1,fn:function(){loadKit(nm);}};})}
  ]));
  var main=UI.el('div','rows');
  var pads=UI.el('div','pads');
  DRLAB.forEach(function(d,i){var p=UI.el('button','pad'+(i===0?' sel':''),'<b>'+d[0]+'</b><small>'+d[1]+'</small>');
    p.onclick=function(){try{
      dev.sel=UI.clamp(i,0,NTRK-1);
      Array.prototype.forEach.call(pads.children,function(x){x.classList.remove('sel');});
      p.classList.add('sel');
      var dr=dev.drum[dev.sel];
      dev.P.tune.set(dr.tune,false);
      dev.P.dec.set(dr.dec,false);
      dev.P.lvl.set(dr.lvl,false);
      dev.hit(dev.sel,ctx.currentTime,.9);
    }catch(e){UI.toast('RD-8 pad error: '+e.message,5000);}};
    pads.appendChild(p);});
  main.appendChild(pads);
  main.appendChild(grid);
  c.appendChild(main);dev.chassis=c;
  buildGrid();
  applySet('808');
  KITNAMES.forEach(function(nm,i){dev.p.bank=i;dev.viewBar=0;loadKit(nm,true);});
  dev.p.bank=0;dev.viewBar=0;
  reshape();renderSteps();
  dev.setNow=function(step){
    if(!dev.stepBtns||!dev.stepBtns.length)return;
    var res=dev.p.res||16;
    var col=step%res,bar=Math.floor(step/res);
    if(dev._pk!=null&&dev.stepBtns[0]&&dev.stepBtns[0][dev._pk])
      for(var i=0;i<NTRK;i++){var b=dev.stepBtns[i][dev._pk];if(b)b.classList.remove('now');}
    if(bar===dev.viewBar)
      for(i=0;i<NTRK;i++){var b2=dev.stepBtns[i][col];if(b2)b2.classList.add('now');}
    dev._pk=col;};
  function metal(t,tu,dur,amp){
    var bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=9600*tu;bp.Q.value=.7;
    var hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=7000*tu;
    var g=ctx.createGain();g.gain.setValueAtTime(amp,t);
    g.gain.exponentialRampToValueAtTime(.001,t+dur);
    bp.connect(hp);hp.connect(g);
    var oscs=[263,400,421,474,587,845].map(function(f){
      var o=ctx.createOscillator();o.type='square';o.frequency.value=f*tu;
      o.connect(bp);o.start(t);o.stop(t+dur+.05);return o;});
    return{g:g,anchor:oscs[0]};}
  var V={
    0:function(t,v,tu,dc){var o=ctx.createOscillator();o.type='sine';
      o.frequency.setValueAtTime(115*tu,t);
      o.frequency.exponentialRampToValueAtTime(Math.max(44*tu,20),t+.09);
      var g=ctx.createGain();g.gain.setValueAtTime(v,t);
      g.gain.exponentialRampToValueAtTime(.001,t+.16+dc*1.5);
      var n=A.noiseSrc(),hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=5000;
      var ng=ctx.createGain();ng.gain.setValueAtTime(v*.3,t);
      ng.gain.exponentialRampToValueAtTime(.001,t+.012);
      o.connect(g);n.connect(hp);hp.connect(ng);
      o.start(t);o.stop(t+.2+dc*1.6);n.start(t,Math.random()*1.5);n.stop(t+.03);
      return[[g,ng],[o,n]];},
    1:function(t,v,tu,dc){var g=ctx.createGain();g.gain.setValueAtTime(v*.85,t);
      g.gain.exponentialRampToValueAtTime(.001,t+.12+dc*.35);
      var o=ctx.createOscillator();o.type='triangle';o.frequency.value=185*tu;
      var g1=ctx.createGain();g1.gain.setValueAtTime(v*.55,t);
      g1.gain.exponentialRampToValueAtTime(.001,t+.07);
      var n=A.noiseSrc(),bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1750*tu;bp.Q.value=.8;
      o.connect(g1);n.connect(bp);bp.connect(g);
      o.start(t);o.stop(t+.2);n.start(t,Math.random()*1.5);n.stop(t+.6);
      return[[g,g1],[o,n]];},
    2:function(t,v,tu,dc){var n=A.noiseSrc();
      var bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1150*tu;bp.Q.value=1.6;
      var g=ctx.createGain();
      for(var i=0;i<3;i++){g.gain.setValueAtTime(v*(1-.28*i),t+i*.011);
        g.gain.exponentialRampToValueAtTime(.05,t+i*.011+.01);}
      g.gain.setValueAtTime(v*.5,t+.033);
      g.gain.exponentialRampToValueAtTime(.001,t+.033+.2+dc*.3);
      n.connect(bp);bp.connect(g);
      n.start(t,Math.random()*1.5);n.stop(t+.7+dc);
      return[[g],[n]];},
    3:function(t,v,tu,dc){var o=ctx.createOscillator();o.type='sine';
      o.frequency.setValueAtTime(150*tu,t);
      o.frequency.exponentialRampToValueAtTime(95*tu,t+.09);
      var g=ctx.createGain();g.gain.setValueAtTime(v*.85,t);
      g.gain.exponentialRampToValueAtTime(.001,t+.2+dc*.55);
      o.connect(g);o.start(t);o.stop(t+.7+dc);return[[g],[o]];},
    4:function(t,v,tu,dc){var o=ctx.createOscillator();o.type='sine';
      o.frequency.setValueAtTime(240*tu,t);
      o.frequency.exponentialRampToValueAtTime(165*tu,t+.08);
      var g=ctx.createGain();g.gain.setValueAtTime(v*.8,t);
      g.gain.exponentialRampToValueAtTime(.001,t+.15+dc*.45);
      o.connect(g);o.start(t);o.stop(t+.6+dc);return[[g],[o]];},
    5:function(t,v,tu,dc){var m=metal(t,tu,.03+dc*.05,v*.7);return[[m.g],[m.anchor]];},
    6:function(t,v,tu,dc){var m=metal(t,tu,.24+dc*.7,v*.6);return[[m.g],[m.anchor]];},
    7:function(t,v,tu,dc){var o1=ctx.createOscillator();o1.type='square';o1.frequency.value=540*tu;
      var o2=ctx.createOscillator();o2.type='square';o2.frequency.value=800*tu;
      var bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1750*tu;bp.Q.value=1.3;
      var g=ctx.createGain();g.gain.setValueAtTime(v*.8,t);
      g.gain.exponentialRampToValueAtTime(Math.max(v*.25,.001),t+.05);
      g.gain.exponentialRampToValueAtTime(.001,t+.22+dc*.35);
      o1.connect(bp);o2.connect(bp);bp.connect(g);
      o1.start(t);o2.start(t);o1.stop(t+.5+dc);o2.stop(t+.5+dc);
      return[[g],[o1]];},
    8:function(t,v,tu,dc){var o=ctx.createOscillator();o.type='sine';
      o.frequency.setValueAtTime(78*tu,t);
      o.frequency.exponentialRampToValueAtTime(Math.max(48*tu,18),t+.05);
      var g=ctx.createGain();g.gain.setValueAtTime(v,t);
      g.gain.exponentialRampToValueAtTime(.001,t+.3+dc*2.4);
      o.connect(g);o.start(t);o.stop(t+.35+dc*2.6);
      return[[g],[o]];}};
  dev.hit=function(tr,t,vel){
    tr=Number(tr);
    if(!Number.isFinite(tr)||tr<0||tr>=NTRK||!Number.isFinite(t)||!V[tr])return;
    var d=dev.drum[tr]||dev.drum[0];
    if(!Number.isFinite(vel))vel=.8;
    vel=UI.clamp(vel,.05,1.5);
    var out=ctx.createGain();out.gain.value=UI.clamp(d.lvl,0,1.5);out.connect(dev.bus);
    var r=V[tr](t,vel,UI.clamp(d.tune,.4,2.5),UI.clamp(d.dec,0,1));
    r[0].forEach(function(gn){gn.connect(out);});
    r[1][0].onended=function(){r[0].forEach(function(gn){try{gn.disconnect();}catch(e){}});try{out.disconnect();}catch(e){}};
    if(dev.mchip){dev.mchip.classList.add('lit');clearTimeout(dev._ft);dev._ft=setTimeout(function(){dev.mchip.classList.remove('lit');},110);}};
},
back:[{title:'AUDIO OUT',jacks:[['outa','out','audio',null,'OUT']]}]});

/* ============ MTRX-16 (unchanged) ============ */
RS.dev('mx',{name:'MTRX-16',sub:'STEP SEQUENCER · CV / GATE',accent:'#5fc9b8',
build:function(dev){
  var A=RS.A,UI=RS.UI,ctx=A.ctx;
  dev.viewBar=0;dev.p.bars=1;
  dev.cols=RIFFS.ACID.rows.map(function(r,i){return{row:r,val:RIFFS.ACID.vals[i]||0};});
  while(dev.cols.length<16)dev.cols.push({row:null,val:.6});
  var c=UI.el('div','chassis');
  var hd=UI.el('div','pheader');
  hd.appendChild(UI.el('div','plate','MTRX-16<small>CV PATTERN SEQUENCER</small>'));
  hd.appendChild(UI.el('div','sp'));
  hd.appendChild(UI.el('div','mchip','<i></i>MULTI-BAR · 16 × 8'));
  c.appendChild(hd);
  var mg=UI.el('div','grp');
  mg.appendChild(UI.el('h5','PATTERN — CLICK LANE · DRAG SLIDER FOR VELOCITY'));
  var grid=UI.el('div','mgrid'),labs=UI.el('div','mlabels');
  for(var r=7;r>=0;r--)labs.appendChild(UI.el('b',null,String(r+1)));
  grid.appendChild(labs);
  var colsEl=UI.el('div','mcols');
  dev.colEls=[];
  for(var k=0;k<16;k++){var mc=UI.el('div','mcol');
    var cells=[];
    for(var ri=0;ri<8;ri++){var cell=UI.el('div','cell');
      (function(ri,ki){
      cell.onclick=function(){var i=dev.viewBar*16+ki;
        var col=dev.cols[i];if(!col)return;
        col.row=col.row===ri?null:ri;refresh();};
      })(ri,k);
      mc.appendChild(cell);cells.push(cell);}
    var vc=UI.el('div','vc','<i></i>'),fill=vc.querySelector('i');
    var vd=false;
    (function(k,vc,fill){
    function mv(e){var i=dev.viewBar*16+k;
      var col=dev.cols[i];if(!col)return;
      var r2=vc.getBoundingClientRect();
      col.val=UI.clamp(1-(e.clientY-r2.top)/r2.height,0,1);
      fill.style.height=(col.val*100)+'%';}
    vc.addEventListener('pointerdown',function(e){vd=true;vc.setPointerCapture(e.pointerId);mv(e);e.preventDefault();});
    vc.addEventListener('pointermove',function(e){if(vd)mv(e);});
    vc.addEventListener('pointerup',function(){vd=false;});
    vc.addEventListener('pointercancel',function(){vd=false;});
    })(k,vc,fill);
    mc.appendChild(vc);colsEl.appendChild(mc);
    dev.colEls.push({mc:mc,cells:cells,fill:fill});}
  grid.appendChild(colsEl);mg.appendChild(grid);
  function resize(){
    var need=(dev.p.bars||1)*16;
    while(dev.cols.length<need)dev.cols.push({row:null,val:.6});
    if(dev.cols.length>need)dev.cols.length=need;}
  function refresh(){
    resize();
    var off=dev.viewBar*16;
    dev.barLab.textContent='BAR '+(dev.viewBar+1)+'/'+(dev.p.bars||1);
    for(var k=0;k<16;k++){var col=dev.cols[off+k]||{row:null,val:0},ce=dev.colEls[k];
      ce.cells.forEach(function(cell,r){cell.classList.toggle('on',col.row===r);});
      ce.fill.style.height=(col.val*100)+'%';}}
  dev.refresh=refresh;
  c.appendChild(UI.panels(dev,[
    {title:'CLOCK / PITCH / COMPOSE',controls:[
      {t:'st',id:'run',label:'RUN',opts:[{t:'OFF',v:0},{t:'ON',v:1}],def:1},
      {t:'k',id:'base',label:'BASE NOTE',min:24,max:60,def:33,fmt:'note'},
      {t:'sel',id:'bars',label:'BARS',opts:[1,2,4,8,16,32].map(function(n){return{v:n,t:String(n)};}),def:1,
        ap:function(v){dev.p.bars=UI.clamp(Number(v)||1,1,32);dev.viewBar=0;resize();refresh();}},
      {t:'cus',fn:function(){
        var nav=UI.el('div','stpr');nav.appendChild(UI.el('div','kl2','EDIT BAR'));
        var nrw=UI.el('div','stprow');
        var bl=UI.el('button','stpb','&#9664;');
        dev.barLab=UI.el('span','blab','BAR 1/1');
        var brr=UI.el('button','stpb','&#9654;');
        bl.onclick=function(){dev.viewBar=Math.max(0,dev.viewBar-1);refresh();};
        brr.onclick=function(){dev.viewBar=Math.min((dev.p.bars||1)-1,dev.viewBar+1);refresh();};
        nrw.append(bl,dev.barLab,brr);nav.appendChild(nrw);return nav;}},
      {t:'bt',group:'TOOLS',label:'COPY',wide:1,fn:function(){var off=dev.viewBar*16;
        if(dev.viewBar+1>=(dev.p.bars||1)){UI.toast('No next bar — raise BARS first');return;}
        for(var k=0;k<16;k++)dev.cols[off+16+k]={row:dev.cols[off+k].row,val:dev.cols[off+k].val};
        dev.viewBar++;refresh();UI.toast('Bar copied');}},
      {t:'bt',label:'FILL',wide:1,fn:function(){var off=dev.viewBar*16;
        for(var b=0;b<(dev.p.bars||1);b++){if(b===dev.viewBar)continue;
          for(var k=0;k<16;k++)dev.cols[b*16+k]={row:dev.cols[off+k].row,val:dev.cols[off+k].val};}
        UI.toast('All bars filled');}},
      {t:'bt',label:'RND',wide:1,fn:function(){var off=dev.viewBar*16;
        for(var k=0;k<16;k++){
          var lane=Math.random()<.62?Math.floor(Math.random()*8):null;
          dev.cols[off+k]={row:lane,val:UI.clamp(.3+Math.random()*.65,0,1)};}
        refresh();UI.toast('MTRX · randomized bar '+(dev.viewBar+1));}},
      {t:'bt',label:'CLR',wide:1,fn:function(){var off=dev.viewBar*16;
        for(var k=0;k<16;k++)dev.cols[off+k]={row:null,val:.6};
        refresh();}}]},
    {title:'RIFF PRESETS · EDM',controls:Object.keys(RIFFS).map(function(nm){
      return{t:'bt',label:nm,wide:1,fn:function(){var r=RIFFS[nm],off=dev.viewBar*16;
        for(var k=0;k<16;k++){var rw=r.rows[k];
          dev.cols[off+k]={row:(Number.isInteger(rw)&&rw>=0&&rw<8)?rw:null,
            val:UI.clamp((r.vals&&r.vals[k])||0,0,1)};}
        refresh();UI.toast('MTRX · '+nm+' riff loaded');}};})},
    {custom:function(){return mg;}}
  ]));
  dev.chassis=c;
  refresh();
  dev.setNow=function(pos){
    if(!dev.colEls)return;
    if(dev._pk!=null&&dev.colEls[dev._pk])dev.colEls[dev._pk].mc.classList.remove('now');
    var k=pos%16;
    if(Math.floor(pos/16)===dev.viewBar&&dev.colEls[k])dev.colEls[k].mc.classList.add('now');
    dev._pk=k;};
  var cvN=ctx.createGain(),gtN=ctx.createGain();
  dev.jackNodes.cvout=cvN;dev.jackNodes.gateout=gtN;
  dev.outs.add('cvout');dev.outs.add('gateout');
},
back:[{title:'CV / GATE OUT',jacks:[
  ['cvout','out','cv',null,'CV'],['gateout','out','cv',null,'GATE']]}]});