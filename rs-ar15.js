/* RACKSMITH AR-15 — resonant filter instrument / generative sampler.
   The core mechanism: any loaded sample runs through 8 tuned harmonic
   bandpass filters that retune, per voice, to harmonic intervals of
   WHATEVER MIDI note is currently playing — that's what turns arbitrary
   source material (birdsong, creek water, a voice) into a pitched,
   chime-like tone. MATERIAL swaps the 8 ratios between physically-modeled
   sets (string/membrane/bar/plate/bell); PITCH MODE chooses whether the
   sample's own playback speed also follows the note (Pitched) or stays at
   its recorded speed while only the harmonics retune (Fixed).
   Two independent sample slots (A/B) each carry their own sample, loop
   points, ADSR, input filter, harmonic resonator and reverb; BLEND
   crossfades between them and LINK syncs parameter edits across both.
   On top of that: GRAIN scatters a slot into overlapping grains, EXTRACT
   reads a slot's own loud/quiet peaks into a note phrase, AUTO PLAY can
   run that phrase (or a random one) hands-free, and MPE lets a per-note
   controller bend/press each held note independently. */
'use strict';
window.RS=window.RS||{};RS.mods=RS.mods||{};RS.mods.ar15='ok';

/* ---- 72 scales across 16 categories (semitone offsets from the root) ---- */
var SCALES=[
  [0,2,4,5,7,9,11],[0,2,3,5,7,9,10],[0,1,3,5,7,8,10],[0,2,4,6,7,9,11],[0,2,4,5,7,9,10],
  [0,2,3,5,7,8,10],[0,1,3,5,6,8,10],[0,2,3,5,7,8,11],[0,2,3,5,7,9,11],
  [0,2,4,7,9],[0,3,5,7,10],[0,2,3,4,7,9],[0,3,5,6,7,10],
  [0,2,4,5,7,9,10,11],[0,2,4,5,7,8,9,11],[0,2,3,4,5,7,9,10],[0,2,3,4,5,7,9,10],[0,1,3,4,6,8,10],
  [0,1,2,3,4,5,6,7,8,9,10,11],[0,2,4,6,8,10],[0,1,3,4,6,7,9,10],[0,2,3,5,6,8,9,11],[0,3,4,7,8,11],[0,1,4,6,7,10],
  [0,2,3,6,7,8,11],[0,3,4,6,7,9,10],[0,2,3,6,7,9,10],[0,2,3,6,7,9,10],
  [0,1,4,5,7,8,11],[0,1,4,5,7,8,10],[0,1,3,5,7,8,10],
  [0,1,4,5,7,8,11],[0,1,4,5,6,8,11],[0,1,4,5,7,8,10],[0,2,5,7,10],[0,1,4,5,7,8,10],
  [0,2,3,6,7,9,10],[0,2,4,5,7,8,10],
  [0,1,4,5,7,8,11],[0,2,4,6,7,9,11],[0,2,3,5,7,9,10],[0,2,3,5,7,8,10],[0,1,3,6,7,8,11],
  [0,2,3,7,8],[0,1,5,7,10],[0,1,5,6,10],[0,2,3,7,9],[0,2,5,7,9],
  [0,2,4,7,9],[0,2,5,7,10],[0,3,5,8,10],
  [0,2,4,5,7,9,10],[0,2,3,5,7,8,10],[0,1,5,7,8],[0,3,5,7,10],
  [0,2,4,5,7,9,10],[0,2,4,7,9],
  [0,1,3,7,8],[0,1,4,7,9],[0,2,5,7,9],[0,2,4,7,9],[0,2,4,5,7,9,11],
  [0,2,4,7,9],[0,2,5,7,9],[0,2,4,5,7,8,10],
  [0,1,4,6,8,10,11],[0,2,3,6,7,8,11],[0,1,3,5,7,9,11],[0,1,3,5,7,8,11],[0,1,4,5,6,8,11],[0,2,4,6,9,10],[0,1,3,4,6,8,10]
];
var SCALE_NAMES=[
  'Ionian','Dorian','Phrygian','Lydian','Mixolydian','Aeolian','Locrian','Harmonic Minor','Melodic Minor',
  'Major Pentatonic','Minor Pentatonic','Blues','Minor Blues',
  'Bebop Dominant','Bebop Major','Bebop Minor','Bebop Dorian','Altered',
  'Chromatic','Whole Tone','Octatonic H-W','Octatonic W-H','Augmented','Tritone',
  'Hungarian Minor','Hungarian Major','Hungarian Gypsy','Romanian Minor',
  'Double Harmonic','Por Arriba','Por Medio',
  'Arabic','Persian','Turkish','Egyptian','Hijaz',
  'Mi Sheberach','Adonai Malakh',
  'Bhairav','Yaman','Kafi','Asavari','Todi',
  'Hirajoshi','In-Sen','Iwato','Kumoi','Yo',
  'Gong','Shang','Jue',
  'Tizita Major','Tizita Minor','Ambassel','Anchihoye',
  'Maqam Rast','West African',
  'Pelog Bem','Pelog Barang','Slendro','Thai Pentatonic','Thai Heptatonic',
  'Celtic','Scottish','Mixolydian b6',
  'Enigmatic','Double Harmonic Minor','Neapolitan Major','Neapolitan Minor','Persian (Exotic)','Prometheus','Super Locrian'
];
/* ---- default presets: optimized starting points for common ambient beds.
   Each sets the FOCUSED slot's sound plus the global params; scaleType
   indices below point into the 72-scale list above (0=Ionian, 5=Aeolian,
   1=Dorian, 9=Major Pentatonic, 10=Minor Pentatonic, 2=Phrygian). ---- */
var PRESETS_AR15=[
  {n:'INIT',p:{root:60,trans:0,fine:0,pitchMode:0,direction:0,size:100,dens:10,pos:.17,pan:0,drift:.13,start:0,length:1,
    blend:.5,link:0,
    eA:.1,eD:.3,eS:.7,eR:.4,hpf:0,hres:0,lpf:.85,lres:0,inputGain:0,
    material:0,hLvl0:.55,hLvl1:.4,hLvl2:.65,hLvl3:.3,hLvl4:.5,hLvl5:.25,hLvl6:.35,hLvl7:.2,
    ringAmt:.4,resSpread:.2,resLife:.4,resDW:.4,stereoSpread:.2,
    revMix:.35,revTime:2.4,revDamp:6000,revDiff:.5,
    scaleRoot:0,scaleType:5,quant:0,autoOn:0,autoSrc:0,autoRate:2.2,autoSpan:2,autoHold:3,mpeAmpMode:0,vol:.85,inLvl:.85}},
  {n:'BIRDSONG CHIMES',p:{root:76,trans:0,fine:0,pitchMode:1,direction:0,size:45,dens:22,pos:.6,pan:0,drift:.35,start:.05,length:.4,
    blend:.5,link:0,
    eA:.02,eD:.15,eS:.5,eR:.25,hpf:.35,hres:.1,lpf:1,lres:.05,inputGain:0,
    material:4,hLvl0:.2,hLvl1:.25,hLvl2:.3,hLvl3:.45,hLvl4:.55,hLvl5:.6,hLvl6:.5,hLvl7:.4,
    ringAmt:.5,resSpread:.5,resLife:.3,resDW:.55,stereoSpread:.4,
    revMix:.3,revTime:1.6,revDamp:9000,revDiff:.4,
    scaleRoot:0,scaleType:9,quant:1,autoOn:1,autoSrc:0,autoRate:1.1,autoSpan:2,autoHold:1.4,mpeAmpMode:0,vol:.85,inLvl:.85}},
  {n:'CREEK CASCADE',p:{root:52,trans:0,fine:0,pitchMode:1,direction:0,size:70,dens:34,pos:.4,pan:0,drift:.5,start:.1,length:.7,
    blend:.5,link:0,
    eA:.05,eD:.4,eS:.6,eR:.6,hpf:.15,hres:0,lpf:.55,lres:.1,inputGain:0,
    material:1,hLvl0:.6,hLvl1:.55,hLvl2:.45,hLvl3:.4,hLvl4:.3,hLvl5:.25,hLvl6:.2,hLvl7:.15,
    ringAmt:.5,resSpread:.35,resLife:.55,resDW:.5,stereoSpread:.3,
    revMix:.4,revTime:3.2,revDamp:5000,revDiff:.6,
    scaleRoot:2,scaleType:10,quant:1,autoOn:1,autoSrc:1,autoRate:.8,autoSpan:2,autoHold:2.2,mpeAmpMode:0,vol:.85,inLvl:.85}},
  {n:'ANGELIC CHOIR',p:{root:60,trans:0,fine:0,pitchMode:0,direction:0,size:220,dens:6,pos:.3,pan:0,drift:.18,start:.05,length:.85,
    blend:.5,link:0,
    eA:.55,eD:.5,eS:.85,eR:.9,hpf:.05,hres:0,lpf:.9,lres:.05,inputGain:0,
    material:0,hLvl0:.6,hLvl1:.55,hLvl2:.5,hLvl3:.5,hLvl4:.45,hLvl5:.4,hLvl6:.35,hLvl7:.3,
    ringAmt:.65,resSpread:.15,resLife:.25,resDW:.45,stereoSpread:.3,
    revMix:.55,revTime:5.5,revDamp:7000,revDiff:.7,
    scaleRoot:0,scaleType:0,quant:1,autoOn:1,autoSrc:0,autoRate:3.5,autoSpan:2,autoHold:6,mpeAmpMode:0,vol:.85,inLvl:.85}},
  {n:'ANDROMEDA DRIFT',p:{root:48,trans:-5,fine:10,pitchMode:1,direction:0,size:380,dens:3,pos:.5,pan:0,drift:.7,start:.15,length:.9,
    blend:.5,link:0,
    eA:1,eD:.8,eS:.9,eR:1,hpf:0,hres:0,lpf:.6,lres:.15,inputGain:0,
    material:2,hLvl0:.5,hLvl1:.6,hLvl2:.4,hLvl3:.55,hLvl4:.35,hLvl5:.45,hLvl6:.3,hLvl7:.5,
    ringAmt:.75,resSpread:.6,resLife:.6,resDW:.55,stereoSpread:.5,
    revMix:.65,revTime:7.5,revDamp:4500,revDiff:.85,
    scaleRoot:9,scaleType:1,quant:1,autoOn:1,autoSrc:0,autoRate:5.5,autoSpan:3,autoHold:9,mpeAmpMode:0,vol:.8,inLvl:.85}},
  {n:'WIND CHIMES',p:{root:84,trans:0,fine:0,pitchMode:1,direction:3,size:35,dens:18,pos:.5,pan:0,drift:.4,start:.1,length:.5,
    blend:.5,link:0,
    eA:.01,eD:.2,eS:.4,eR:.35,hpf:.3,hres:.1,lpf:1,lres:0,inputGain:0,
    material:4,hLvl0:.15,hLvl1:.2,hLvl2:.35,hLvl3:.5,hLvl4:.6,hLvl5:.55,hLvl6:.45,hLvl7:.3,
    ringAmt:.6,resSpread:.55,resLife:.35,resDW:.6,stereoSpread:.55,
    revMix:.35,revTime:2.2,revDamp:10000,revDiff:.5,
    scaleRoot:0,scaleType:9,quant:1,autoOn:1,autoSrc:0,autoRate:.9,autoSpan:2,autoHold:1.2,mpeAmpMode:0,vol:.85,inLvl:.85}},
  {n:'KOTO MOUNTAIN',p:{root:64,trans:0,fine:0,pitchMode:0,direction:0,size:90,dens:8,pos:.25,pan:0,drift:.15,start:.05,length:.6,
    blend:.5,link:0,
    eA:.005,eD:.35,eS:.35,eR:.5,hpf:.1,hres:0,lpf:.8,lres:0,inputGain:0,
    material:0,hLvl0:.6,hLvl1:.35,hLvl2:.5,hLvl3:.25,hLvl4:.4,hLvl5:.2,hLvl6:.3,hLvl7:.15,
    ringAmt:.55,resSpread:.25,resLife:.45,resDW:.5,stereoSpread:.25,
    revMix:.4,revTime:3.5,revDamp:5500,revDiff:.6,
    scaleRoot:9,scaleType:43,quant:1,autoOn:1,autoSrc:0,autoRate:1.6,autoSpan:2,autoHold:2.8,mpeAmpMode:0,vol:.85,inLvl:.85}},
  {n:'ABYSS',p:{root:36,trans:-12,fine:0,pitchMode:1,direction:1,size:450,dens:2,pos:.5,pan:0,drift:.6,start:.2,length:.95,
    blend:.5,link:0,
    eA:1,eD:1,eS:.95,eR:1,hpf:0,hres:0,lpf:.35,lres:0,inputGain:0,
    material:4,hLvl0:.7,hLvl1:.6,hLvl2:.5,hLvl3:.35,hLvl4:.25,hLvl5:.15,hLvl6:.1,hLvl7:.05,
    ringAmt:.85,resSpread:.7,resLife:.7,resDW:.65,stereoSpread:.6,
    revMix:.75,revTime:8,revDamp:2500,revDiff:.9,
    scaleRoot:0,scaleType:6,quant:1,autoOn:1,autoSrc:0,autoRate:8,autoSpan:2,autoHold:14,mpeAmpMode:0,vol:.8,inLvl:.85}},
  {n:'WARP TUNNEL',p:{root:60,trans:0,fine:35,pitchMode:0,direction:3,size:25,dens:30,pos:.5,pan:0,drift:.8,start:0,length:1,
    blend:.5,link:0,
    eA:.02,eD:.1,eS:.3,eR:.15,hpf:.2,hres:.15,lpf:.95,lres:.1,inputGain:0,
    material:3,hLvl0:.4,hLvl1:.55,hLvl2:.3,hLvl3:.6,hLvl4:.35,hLvl5:.5,hLvl6:.25,hLvl7:.45,
    ringAmt:.6,resSpread:.85,resLife:.6,resDW:.6,stereoSpread:.85,
    revMix:.45,revTime:2.8,revDamp:11000,revDiff:.75,
    scaleRoot:0,scaleType:19,quant:1,autoOn:1,autoSrc:0,autoRate:.5,autoSpan:3,autoHold:1,mpeAmpMode:0,vol:.85,inLvl:.85}},
  {n:'WAVES',p:{root:55,trans:0,fine:0,pitchMode:1,direction:2,size:280,dens:5,pos:.35,pan:0,drift:.45,start:.1,length:.8,
    blend:.5,link:0,
    eA:.6,eD:.6,eS:.8,eR:.75,hpf:.05,hres:0,lpf:.7,lres:0,inputGain:0,
    material:1,hLvl0:.5,hLvl1:.45,hLvl2:.55,hLvl3:.4,hLvl4:.35,hLvl5:.3,hLvl6:.25,hLvl7:.2,
    ringAmt:.45,resSpread:.3,resLife:.5,resDW:.45,stereoSpread:.5,
    revMix:.5,revTime:4.5,revDamp:6500,revDiff:.6,
    scaleRoot:7,scaleType:4,quant:1,autoOn:1,autoSrc:0,autoRate:2.8,autoSpan:2,autoHold:4.5,mpeAmpMode:0,vol:.85,inLvl:.85}},
  {n:'GLASS RAIN',p:{root:79,trans:0,fine:0,pitchMode:1,direction:3,size:20,dens:14,pos:.6,pan:0,drift:.3,start:.02,length:.35,
    blend:.5,link:0,
    eA:.005,eD:.12,eS:.15,eR:.3,hpf:.4,hres:.1,lpf:1,lres:0,inputGain:0,
    material:3,hLvl0:.15,hLvl1:.2,hLvl2:.3,hLvl3:.45,hLvl4:.55,hLvl5:.6,hLvl6:.5,hLvl7:.4,
    ringAmt:.5,resSpread:.4,resLife:.25,resDW:.55,stereoSpread:.6,
    revMix:.3,revTime:1.8,revDamp:12000,revDiff:.45,
    scaleRoot:0,scaleType:46,quant:1,autoOn:1,autoSrc:0,autoRate:.6,autoSpan:2,autoHold:.8,mpeAmpMode:0,vol:.85,inLvl:.85}}
];
/* param ids that live PER SLOT (A and B each keep their own value) —
   everything else in dev.p is global, shared regardless of slot focus */
var SLOT_PARAM_IDS=['start','length','root','eA','eD','eS','eR','hpf','hres','lpf','lres','inputGain',
  'material','ringAmt','resSpread','resLife','resDW','revMix','revTime','revDamp','revDiff'];
(function(){for(var i=0;i<8;i++)SLOT_PARAM_IDS.push('hLvl'+i,'hMute'+i,'hSolo'+i,'hPan'+i);})();

RS.dev('ar15',{name:'AR-15',sub:'RESONANT FILTER INSTRUMENT · DUAL SLOT',accent:'#ff3b1f',channel:'omni',
build:function(dev){
  var A=RS.A,UI=RS.UI,ctx=A.ctx;
  function G(v){var g=ctx.createGain();g.gain.value=v;return g;}
  function P(k,d){var v=dev.p[k];return v===undefined?d:v;}
  /* per-slot param read: the FOCUSED slot's values live in dev.p (driven
     live by the knobs); the OTHER slot's values live in its own stored
     snapshot, only touched when that slot is focused or when LINK mirrors
     an edit into it */
  function PS(slot,k,d){
    if(slot===dev.focusSlot)return P(k,d);
    var v=dev.slotState[slot].p[k];return v===undefined?d:v;}
  var NNAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  var MATERIALS=['STRING','MEMBRANE','BAR','PLATE','BELL'];
  var MATERIAL_RATIOS=[
    [.5,1,2,3,4,5,6,8],
    [.5,1,1.59,2.14,2.30,2.65,2.92,3.60],
    [.5,1,2.76,5.40,8.93,13.3,18.6,24.8],
    [.5,1,1.73,2.09,2.56,3.01,3.65,4.42],
    [.5,1,2.4,3.0,4.2,5.4,6.8,8.5]];
  function maxV(){return Math.round(UI.clamp(P('maxVoices',12),1,32));}

  /* ================= dual slot state =================
     Each slot carries its own sample + reversed copy; per-slot KNOB values
     live in dev.p while that slot is focused, or in slotState[x].p while
     it's the other one. dev.buffer/dev.bufferRev always alias the FOCUSED
     slot's audio, for the waveform display / DETECT / EXTRACT / record. */
  dev.slotState={A:{buffer:null,bufferRev:null,p:{}},B:{buffer:null,bufferRev:null,p:{}}};
  dev.focusSlot='B';
  dev.buffer=null;dev.bufferRev=null;dev.stream=null;dev.micSrc=null;dev.recorder=null;dev.recChunks=[];

  /* ================= signal chain =================
     Everything note-dependent (input filter, the 8 harmonic resonators,
     stereo spread) happens INSIDE mkVoice, per voice, per slot. Only
     REVERB is pitch-independent — but it IS per-slot (its own Mix/Time/
     Damp/Diff), so each slot gets its own bus + convolver; BLEND happens
     at the per-voice layer gain, before either bus. */
  function mkRevChain(){
    var conv=ctx.createConvolver();
    var bus=G(1),dry=G(1),wet=G(0),sum=G(1);
    bus.connect(dry);dry.connect(sum);
    bus.connect(conv);conv.connect(wet);wet.connect(sum);
    return{bus:bus,conv:conv,dry:dry,wet:wet,sum:sum};}
  dev.revA=mkRevChain();dev.revB=mkRevChain();
  /* SURGE PROTECTION — same pattern NRD-2 uses ahead of its own safeOut():
     up to 12 voices' worth of continuously-running additive harmonic
     oscillators (each note keeps 8 running for its full hold time plus a
     RING tail after release) can pile up well past what a single soft-clip
     stage handles gracefully, especially once AUTO PLAY overlaps new notes
     on top of previous ones still ringing out — that's the "washed out /
     surge / distort" building up over time. This catches it first. */
  dev.lim=ctx.createDynamicsCompressor();
  dev.lim.threshold.value=-14;dev.lim.knee.value=4;dev.lim.ratio.value=20;
  dev.lim.attack.value=.002;dev.lim.release.value=.18;
  dev.limMk=G(A.compTrim(-14,20));
  dev.revA.sum.connect(dev.lim);dev.revB.sum.connect(dev.lim);
  dev.lim.connect(dev.limMk);
  dev.outVol=G(.8);
  dev.limMk.connect(dev.outVol);
  var saf=A.safeOut();dev.outVol.connect(saf.input);dev.out=saf.output;
  dev.jackNodes.outa=dev.out;dev.outs.add('outa');
  dev.jackNodes.cvin=G(1);dev.jackNodes.gatein=G(1);dev.jackNodes.envin=G(1);
  dev.micGain=G(.85);dev.micGain.connect(dev.outVol);

  function buildIR(slot){
    var rev=dev['rev'+slot];
    var rt=UI.clamp(PS(slot,'revTime',2.2),.2,8),damp=UI.clamp(PS(slot,'revDamp',6000),800,16000),
        diff=UI.clamp(PS(slot,'revDiff',.5),0,1);
    var sr=ctx.sampleRate,len=Math.max(64,Math.floor(rt*1.05*sr));
    var b=ctx.createBuffer(2,len,sr);
    var k=Math.log(1000)/(rt*sr);
    for(var ch=0;ch<2;ch++){
      var d=b.getChannelData(ch),z=0,sq=0,f0=Math.min(damp,sr*.45);
      var build=Math.max(32,Math.floor((.01+diff*.09)*sr));
      for(var i=0;i<len;i++){
        var env=Math.exp(-k*i);
        var a=1-Math.exp(-2*Math.PI*(f0*(.4+.6*env))/sr);
        z+=a*((Math.random()*2-1)-z);
        var grow=i<build?(i/build)*(i/build):1;
        d[i]=z*env*grow;sq+=d[i]*d[i];}
      var g=.9/Math.sqrt(sq||1);
      for(i=0;i<len;i++)d[i]*=g;}
    rev.conv.buffer=b;}
  var irT={A:null,B:null};
  function scheduleIR(slot){clearTimeout(irT[slot]);irT[slot]=setTimeout(function(){buildIR(slot);},50);}
  function applyRevMix(slot){
    var rev=dev['rev'+slot],mix=UI.clamp(PS(slot,'revMix',.35),0,1);
    A.smooth(rev.dry.gain,1-mix,.03);A.smooth(rev.wet.gain,mix*1.3,.03);}

  /* ================= sample: record / upload / reverse / detect =================
     All of these act on the CURRENTLY FOCUSED slot — same as clicking a
     slot tab in the real instrument before working its waveform. */
  function activeBuffer(){
    var st=dev.slotState[dev.focusSlot];
    return P('reverse',0)&&st.bufferRev?st.bufferRev:st.buffer;}
  function ensureReverse(){
    var st=dev.slotState[dev.focusSlot];
    if(!st.buffer||st.bufferRev)return;
    ensureReverseFor(dev.focusSlot);}
  function ensureReverseFor(slot){
    var st=dev.slotState[slot];
    if(!st.buffer||st.bufferRev)return;
    var src=st.buffer;
    var rev=ctx.createBuffer(src.numberOfChannels,src.length,src.sampleRate);
    for(var c=0;c<src.numberOfChannels;c++){
      var d=src.getChannelData(c),rd=rev.getChannelData(c);
      for(var i=0;i<d.length;i++)rd[i]=d[d.length-1-i];}
    st.bufferRev=rev;}
  function stopMic(){
    try{if(dev.micSrc)dev.micSrc.disconnect();}catch(e){}
    if(dev.stream)dev.stream.getTracks().forEach(function(t){try{t.stop();}catch(e){}});
    dev.stream=null;dev.micSrc=null;}
  function status(txt,cls){dev.sampleStat.textContent=txt;dev.sampleStat.className='ar15stat'+(cls?' '+cls:'');}
  function setBuffer(buf){
    var st=dev.slotState[dev.focusSlot];
    st.buffer=buf;st.bufferRev=null;
    dev.buffer=buf;dev.bufferRev=null;
    if(dev.P.start)dev.P.start.set(0,false);
    if(dev.P.length)dev.P.length.set(1,false);
    if(dev.P.reverse)dev.P.reverse.set(0,false);
    status(buf.duration.toFixed(1)+'s loaded');
    drawWave();}
  function loadFile(f){
    if(!f)return;
    status('DECODING…');
    f.arrayBuffer().then(function(ab){return ctx.decodeAudioData(ab);}).then(function(buf){
      setBuffer(buf);UI.toast('AR-15: loaded "'+f.name+'" into SLOT '+dev.focusSlot+' ('+buf.duration.toFixed(1)+'s)');
    }).catch(function(e){status('DECODE FAILED');UI.toast('AR-15 could not decode that file: '+e.message,'#ff6a55',5000);});}
  /* input-device picker — same pattern IN-2 uses. Device labels are blank
     until a getUserMedia call has succeeded at least once (browser privacy
     rule), so this is called again after a successful arm too. */
  var micPick=UI.el('select','selbox');
  micPick.innerHTML='<option value="">Default input</option>';
  micPick.style.maxWidth='170px';micPick.title='Input device to record from';
  function listMicDevices(){
    if(!navigator.mediaDevices||!navigator.mediaDevices.enumerateDevices)return;
    navigator.mediaDevices.enumerateDevices().then(function(ds){
      var cur=micPick.value;
      micPick.innerHTML='<option value="">Default input</option>';
      ds.filter(function(d){return d.kind==='audioinput';}).forEach(function(d){
        var o=UI.el('option',null,d.label||('Input '+micPick.length));
        o.value=d.deviceId;micPick.appendChild(o);});
      micPick.value=cur;}).catch(function(){});}
  listMicDevices();
  /* switching the device WHILE already armed has to re-arm on the new
     device immediately — otherwise the old stream just keeps running and
     picking your mic from the list silently does nothing until you cycle
     ARM off/on by hand, which reads as "recording doesn't work" */
  micPick.onchange=function(){
    if(dev.stream){disarmMic();armMic().catch(function(){});}};
  /* TELEMETRY — a single 3-color peak LED (dark/green/yellow/red) on the
     raw mic signal, tapped BEFORE the IN fader so it works regardless of
     where that knob is set. If this never leaves dark while you're
     speaking into the mic, the browser isn't capturing anything — that's
     a device-select/permission/OS problem upstream of this app, not a
     recording bug. If it DOES light up but REC still produces nothing,
     the toast on STOP below reports exactly how many bytes were
     captured, which narrows it to the MediaRecorder/decode step instead. */
  dev.micPeakAna=ctx.createAnalyser();dev.micPeakAna.fftSize=512;
  var micPeakLed=UI.el('div','ar15peakled');micPeakLed.title='Mic input: dark=silent, green=signal, yellow=hot, red=peaking';
  /* ARM — same POWER/arm split IN-2 uses: arming just requests the mic and
     starts live monitoring (so the PEAK LED and the IN fader confirm signal
     is arriving) WITHOUT recording anything yet. REC then records from the
     already-armed stream, or arms automatically first if you skip that
     step. Staying armed after a take (until you switch ARM off) means you
     can record several takes in a row without re-granting permission. */
  var armBtn=UI.el('button','ar15icon','ARM');armBtn.title='Arm the input — request mic access and start monitoring';
  function armMic(){
    /* a stream can die out from under us — device unplugged, OS/browser
       revokes the permission, another app grabs exclusive access — without
       any of our own code running. Treating a stale dev.stream as still
       live silently "monitors" a dead track forever, which is exactly what
       an intermittent mic looks like from here: ARMED never changes, but
       no audio ever arrives again until you catch it and re-arm. */
    if(dev.stream&&dev.stream.getAudioTracks().every(function(t){return t.readyState==='live';}))
      return Promise.resolve(dev.stream);
    if(dev.stream){stopMic();}
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      UI.toast('This browser exposes no microphone API','#ff6a55',5000);
      if(dev.P.armed)dev.P.armed.set(0,false);
      return Promise.reject(new Error('no getUserMedia'));}
    status('REQUESTING…');
    var con={audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}};
    if(micPick.value)con.audio.deviceId={exact:micPick.value};
    return navigator.mediaDevices.getUserMedia(con).then(function(st){
      dev.stream=st;dev.micSrc=ctx.createMediaStreamSource(st);
      dev.micSrc.connect(dev.micGain);dev.micGain.connect(dev.micPeakAna);
      listMicDevices();
      var tr=st.getAudioTracks()[0],settings=tr&&tr.getSettings?tr.getSettings():{};
      tr&&(tr.onended=function(){
        if(dev.stream!==st)return;
        stopMic();status('INPUT LOST');
        if(dev.P.armed)dev.P.armed.set(0,false);
        UI.toast('AR-15: the input device disconnected (unplugged, permission revoked, or grabbed by another app) — '+
          'ARM again once it\'s back','#ff6a55',6000);});
      status(tr&&tr.label?tr.label.slice(0,22):'ARMED','on');
      /* the exact track that was actually opened — if this names the wrong
         device (or a virtual/loopback one you didn't expect), that alone
         explains "no signal": the app is listening to the right thing, on
         the wrong physical input */
      UI.toast('AR-15 armed: "'+(tr&&tr.label?tr.label:'unnamed device')+'"'+
        (settings.sampleRate?' · '+settings.sampleRate+'Hz':'')+
        (settings.channelCount?' · '+settings.channelCount+'ch':'')+
        ' — watch the PEAK LED, then hit REC to capture into SLOT '+dev.focusSlot,6000);
      return st;
    }).catch(function(e){
      status('MIC DENIED');
      UI.toast('Mic refused: '+(e&&e.name?e.name:'error'),'#ff6a55',5000);
      if(dev.P.armed)dev.P.armed.set(0,false);
      throw e;});}
  function disarmMic(){
    if(dev.recorder&&dev.recorder.state==='recording')try{dev.recorder.stop();}catch(e){}
    stopMic();
    status(dev.buffer?dev.buffer.duration.toFixed(1)+'s loaded':'EMPTY');}
  dev.P.armed={set:function(v){
    dev.p.armed=v?1:0;
    armBtn.classList.toggle('on',!!v);
    if(v)armMic().catch(function(){/* armMic already surfaced the error */});else disarmMic();},_def:0};
  dev.p.armed=0;
  armBtn.onclick=function(){dev.P.armed.set(P('armed',0)?0:1);};
  function startRecord(){
    if(typeof MediaRecorder==='undefined'){
      UI.toast('This browser exposes no recording API — try LOAD instead','#ff6a55',5000);return;}
    (dev.stream?Promise.resolve(dev.stream):armMic()).then(function(st){
      if(dev.P.armed)dev.P.armed.set(1,false);
      dev.recChunks=[];
      var mime=(window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported('audio/webm'))?'audio/webm':'';
      try{dev.recorder=mime?new MediaRecorder(st,{mimeType:mime}):new MediaRecorder(st);}
      catch(e){dev.recorder=new MediaRecorder(st);}
      dev.recorder.ondataavailable=function(e){if(e.data&&e.data.size)dev.recChunks.push(e.data);};
      dev.recorder.onstop=function(){
        var totalBytes=dev.recChunks.reduce(function(s,c){return s+c.size;},0);
        if(!totalBytes){
          status('0 BYTES CAPTURED');
          UI.toast('AR-15: REC ran but captured 0 bytes — the mic input itself is silent at the OS/driver level '+
            '(check the OS input volume isn\'t muted/zeroed, or that another app hasn\'t taken exclusive control '+
            'of the device). This is not a decode problem.','#ff6a55',8000);
          return;}
        var blob=new Blob(dev.recChunks,{type:mime||'audio/webm'});
        blob.arrayBuffer().then(function(ab){return ctx.decodeAudioData(ab);}).then(function(buf){
          setBuffer(buf);UI.toast('AR-15: recorded '+buf.duration.toFixed(1)+'s ('+totalBytes+' bytes) into SLOT '+dev.focusSlot);
        }).catch(function(e){
          status('DECODE FAILED');
          UI.toast('AR-15: captured '+totalBytes+' bytes but could not decode them ('+e.message+') — the audio '+
            'arrived, this browser just can\'t decode its own '+(mime||'default')+' recording. Try a different '+
            'browser, or LOAD a file instead.','#ff6a55',8000);});
        /* stay armed for a quick re-take; ARM off explicitly releases the mic */};
      dev.recorder.start();
      status('RECORDING…','on');dev.recBtn.innerHTML='&#9632; STOP';
      UI.toast('AR-15: recording into SLOT '+dev.focusSlot+'… click REC again to stop',3000);
      clearTimeout(dev._recCap);
      dev._recCap=setTimeout(function(){if(dev.recorder&&dev.recorder.state==='recording')stopRecord();},60000);
    }).catch(function(){/* armMic already surfaced the error */});}
  function stopRecord(){
    clearTimeout(dev._recCap);
    if(dev.recorder&&dev.recorder.state==='recording')dev.recorder.stop();
    dev.recBtn.innerHTML='&#9679; REC';}
  function detectPitch(){
    var buf=activeBuffer();if(!buf){UI.toast('AR-15: nothing loaded to analyze','#ff6a55');return;}
    var data=buf.getChannelData(0),sr=buf.sampleRate;
    var s0=Math.floor(UI.clamp(P('start',0),0,1)*data.length);
    var N=Math.min(sr*1.2,data.length-s0);
    if(N<sr*.05){UI.toast('AR-15: region too short to analyze','#ff6a55');return;}
    var minLag=Math.floor(sr/900),maxLag=Math.floor(sr/50),best=-1,bestVal=0;
    for(var lag=minLag;lag<=maxLag;lag++){
      var sum=0;
      for(var i=0;i<N-lag;i+=4)sum+=data[s0+i]*data[s0+i+lag];
      if(sum>bestVal){bestVal=sum;best=lag;}}
    if(best<=0){UI.toast('AR-15: could not detect a clear pitch','#ff6a55');return;}
    var f=sr/best,note=UI.clamp(Math.round(69+12*Math.log2(f/440)),24,96);
    if(dev.P.root)dev.P.root.set(note);
    UI.toast('AR-15: detected ~'+Math.round(f)+'Hz — SLOT '+dev.focusSlot+' root set to '+UI.noteName(note));}

  /* ---- EXTRACT: read the focused slot's own amplitude contour and turn
     each peak into a note, loud->high quiet->low, snapped to KEY/SCALE ---- */
  dev.extractedSeq=null;
  function extractPeaks(){
    var buf=activeBuffer();if(!buf){UI.toast('AR-15: nothing loaded to analyze','#ff6a55');return;}
    var data=buf.getChannelData(0),sr=buf.sampleRate;
    var s0=Math.floor(UI.clamp(P('start',0),0,1)*data.length);
    var s1=Math.floor(UI.clamp(s0/data.length+P('length',1),0,1)*data.length);
    if(s1-s0<sr*.2){UI.toast('AR-15: region too short to extract from','#ff6a55');return;}
    var hop=Math.max(64,Math.floor(sr*.03));
    var env=[];
    for(var i=s0;i<s1;i+=hop){
      var sum=0,n=0,end=Math.min(i+hop,s1);
      for(var j=i;j<end;j++){sum+=data[j]*data[j];n++;}
      env.push(Math.sqrt(sum/Math.max(n,1)));}
    var mx=0;for(i=0;i<env.length;i++)if(env[i]>mx)mx=env[i];
    if(mx<1e-4){UI.toast('AR-15: region is silent, nothing to extract','#ff6a55');return;}
    var norm=env.map(function(v){return v/mx;});
    var scale=SCALES[Math.round(P('scaleType',5))]||SCALES[5];
    var rootPc=Math.round(P('scaleRoot',0));
    var events=[],lastPeak=-999,minGap=3;
    for(i=1;i<norm.length-1;i++){
      if(norm[i]>=norm[i-1]&&norm[i]>norm[i+1]&&norm[i]>.12&&(i-lastPeak)>=minGap){
        var span=scale.length*2;
        var idx=UI.clamp(Math.floor(norm[i]*span),0,span-1);
        var oct=Math.floor(idx/scale.length),deg=scale[idx%scale.length];
        events.push({t:(i*hop)/sr,note:UI.clamp(48+rootPc+deg+12*oct,24,96),vel:UI.clamp(.3+norm[i]*.6,.15,1)});
        lastPeak=i;}}
    if(!events.length){UI.toast('AR-15: no clear peaks found — try lowering the region or raising input level','#ff6a55',5000);return;}
    dev.extractedSeq=events;dev._extIdx=0;
    UI.toast('AR-15: extracted '+events.length+' notes from SLOT '+dev.focusSlot+'’s own peaks — set AUTO SOURCE to EXTRACTED',5000);}

  /* ---- waveform display + draggable start/length region + position marker,
     plus drag-and-drop file loading straight onto the canvas ---- */
  var waveGrp=UI.el('div','grp');
  var pillRow=UI.el('div','ar15pillrow');
  function mkSlotPill(slot){
    var pill=UI.el('div','ar15pill'+(dev.focusSlot===slot?' on':''));
    pill.appendChild(UI.el('b',null,'SLOT '+slot));
    var stat=UI.el('span',null,'EMPTY');
    pill.appendChild(stat);
    pill.style.cursor='pointer';
    pill.onclick=function(){if(dev.focusSlot!==slot)switchFocus(slot);};
    return{el:pill,stat:stat};}
  var pillA=mkSlotPill('A'),pillB=mkSlotPill('B');
  var blendKnobWrap=UI.el('div');
  var linkBtn=UI.el('button','ar15icon','LINK');
  linkBtn.title='LINK — parameter edits apply to both slots at once';
  dev.P.link={set:function(v){dev.p.link=v?1:0;linkBtn.classList.toggle('on',!!v);},_def:0};
  dev.P.link.set(0);
  linkBtn.onclick=function(){dev.P.link.set(P('link',0)?0:1);};
  pillRow.append(pillA.el,blendKnobWrap,linkBtn,pillB.el);
  waveGrp.appendChild(pillRow);
  dev.sampleStat=pillB.stat; /* status() writes into whichever pill is currently focused, refreshed in switchFocus */

  /* canvas created up front — several controls below call drawWave() as
     soon as they're wired (to paint their initial state), so it has to
     exist before any of that happens */
  var cv=document.createElement('canvas');cv.className='scope';cv.style.cursor='ew-resize';
  var DPR=Math.min(window.devicePixelRatio||1,2),LH=176;

  var fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='audio/*';fileInput.style.display='none';
  fileInput.onchange=function(){loadFile(fileInput.files&&fileInput.files[0]);fileInput.value='';};
  var loadBtn=UI.el('button','ar15icon','LOAD');loadBtn.title='Load a file into the focused slot';
  loadBtn.onclick=function(){fileInput.click();};
  dev.recBtn=UI.el('button','ar15icon','REC');dev.recBtn.title='Record from input into the focused slot';
  dev.recBtn.onclick=function(){if(dev.recorder&&dev.recorder.state==='recording')stopRecord();else startRecord();};
  /* PLAY/audition transport — holds a sustained voice at the focused slot's
     ROOT pitch so you can hear the loop without needing a MIDI note. Scrub
     dragging on the waveform (below) shares this same voice: since GRAIN
     mode re-reads POS on every grain (see spawnGrain), dragging the wave
     while a voice sounds moves playback through the sample live. */
  var playBtn=UI.el('button','ar15icon','PLAY');playBtn.title='Audition — play the loop at ROOT pitch';
  var playOn=false,scrubOn=false,previewVoice=null;
  function ensurePreviewVoice(){
    if(previewVoice)return;
    if(!anyBufferLoaded())return;
    previewVoice=mkVoice(Math.round(P('root',60)),.85);}
  function releasePreviewVoice(){
    if(playOn||scrubOn)return;
    if(previewVoice){previewVoice.off();previewVoice=null;}}
  playBtn.onclick=function(){
    if(playOn){playOn=false;playBtn.classList.remove('on');playBtn.innerHTML='PLAY';releasePreviewVoice();}
    else{
      if(!anyBufferLoaded()){UI.toast('AR-15: load or record a sample into a slot first','#ff6a55',2200);return;}
      playOn=true;playBtn.classList.add('on');playBtn.innerHTML='&#9632; STOP';
      ensurePreviewVoice();}};
  /* DIRECTION cycles Forward -> Reverse -> Ping-Pong -> Random(per note-on) */
  var DIR_LABELS=['FWD','REV','P-P','RND'];
  var dirBtn=UI.el('button','ar15icon','FWD');dirBtn.title='Playback direction';
  dev.P.direction={set:function(v){dev.p.direction=UI.clamp(Math.round(v),0,3);dirBtn.textContent=DIR_LABELS[dev.p.direction];drawWave();},_def:0};
  dev.P.direction.set(0);
  dirBtn.onclick=function(){dev.P.direction.set((P('direction',0)+1)%4);};
  var loopBtn=UI.el('button','ar15icon on','LOOP');loopBtn.title='Wrap grain position within the region';
  dev.P.loopWrap={set:function(v){dev.p.loopWrap=v?1:0;loopBtn.classList.toggle('on',!!v);},_def:1};
  dev.P.loopWrap.set(1);
  loopBtn.onclick=function(){dev.P.loopWrap.set(P('loopWrap',1)?0:1);};
  var grainBtn=UI.el('button','ar15icon on','GRAIN');grainBtn.title='GRAIN mode — off plays a sustained loop instead';
  dev.P.grainOn={set:function(v){dev.p.grainOn=v?1:0;grainBtn.classList.toggle('on',!!v);},_def:1};
  dev.P.grainOn.set(1);
  grainBtn.onclick=function(){dev.P.grainOn.set(P('grainOn',1)?0:1);};
  var detBtn=UI.el('button','ar15icon','DETECT');detBtn.title='Detect pitch → set this slot\'s ROOT';
  detBtn.onclick=detectPitch;
  var extBtn=UI.el('button','ar15icon','EXTRACT');extBtn.title='Extract a note phrase from this slot\'s own peaks';
  extBtn.onclick=extractPeaks;

  waveGrp.appendChild(cv);waveGrp.appendChild(fileInput);
  function sizeCanvas(){
    var r=cv.getBoundingClientRect();
    cv.width=Math.max(200,Math.round(r.width*DPR));cv.height=Math.round(LH*DPR);
    var c2=cv.getContext('2d');c2.setTransform(DPR,0,0,DPR,0,0);
    drawWave();}
  function drawWave(){
    var c2=cv.getContext('2d'),W=cv.width/DPR,H=LH;
    c2.clearRect(0,0,W,H);
    var buf=activeBuffer();
    if(!buf){
      c2.fillStyle='#4a4f58';c2.font='11px "Share Tech Mono",monospace';c2.textAlign='center';
      c2.fillText('NO SAMPLE IN SLOT '+dev.focusSlot+' — LOAD, RECORD, OR DROP A FILE HERE',W/2,H/2+4);return;}
    var data=buf.getChannelData(0),step=Math.max(1,Math.floor(data.length/W));
    c2.strokeStyle=dev.accent;c2.lineWidth=1;c2.beginPath();
    for(var x=0;x<W;x++){
      var i0=x*step,mn=1,mx=-1;
      for(var i=0;i<step;i++){var s=data[i0+i]||0;if(s<mn)mn=s;if(s>mx)mx=s;}
      var y1=(1-((mx+1)/2))*H,y2=(1-((mn+1)/2))*H;
      c2.moveTo(x+.5,y1);c2.lineTo(x+.5,y2);}
    c2.stroke();
    var s0f=UI.clamp(P('start',0),0,1),s1f=UI.clamp(s0f+P('length',1),0,1);
    var s0=s0f*W,s1=s1f*W;
    c2.fillStyle='rgba(255,59,31,.18)';c2.fillRect(s0,0,Math.max(1,s1-s0),H);
    c2.strokeStyle='rgba(255,59,31,.95)';c2.lineWidth=2;
    c2.beginPath();c2.moveTo(s0,0);c2.lineTo(s0,H);c2.stroke();
    c2.beginPath();c2.moveTo(s1,0);c2.lineTo(s1,H);c2.stroke();
    var posX=s0+(s1-s0)*UI.clamp(P('pos',.17),0,1);
    c2.strokeStyle='#fff';c2.lineWidth=1;c2.globalAlpha=.85;
    c2.beginPath();c2.moveTo(posX,0);c2.lineTo(posX,H);c2.stroke();c2.globalAlpha=1;}
  (function(){
    var dragMode=null;
    function frac(e){var r=cv.getBoundingClientRect();return UI.clamp((e.clientX-r.left)/r.width,0,1);}
    cv.addEventListener('pointerdown',function(e){
      if(!activeBuffer())return;cv.setPointerCapture(e.pointerId);
      var f=frac(e),r=cv.getBoundingClientRect(),px=8/r.width;
      var s0=P('start',0),s1=UI.clamp(s0+P('length',1),0,1);
      if(Math.abs(f-s0)<px)dragMode='start';
      else if(Math.abs(f-s1)<px)dragMode='end';
      else{dragMode='pos';if(!playOn){scrubOn=true;ensurePreviewVoice();}}
      handleDrag(f);});
    cv.addEventListener('pointermove',function(e){if(dragMode)handleDrag(frac(e));});
    cv.addEventListener('pointerup',function(){dragMode=null;if(scrubOn){scrubOn=false;releasePreviewVoice();}});
    cv.addEventListener('pointercancel',function(){dragMode=null;if(scrubOn){scrubOn=false;releasePreviewVoice();}});
    function handleDrag(f){
      if(dragMode==='start'){
        var s1=UI.clamp(P('start',0)+P('length',1),0,1);
        var ns=UI.clamp(Math.min(f,s1-.01),0,.98);
        dev.P.start.set(ns);dev.P.length.set(UI.clamp(s1-ns,.01,1));
      }else if(dragMode==='end'){
        var s0b=P('start',0),ne=UI.clamp(Math.max(f,s0b+.01),.02,1);
        dev.P.length.set(UI.clamp(ne-s0b,.01,1));
      }else{
        var s0c=P('start',0),s1c=UI.clamp(s0c+P('length',1),0,1),span=Math.max(s1c-s0c,.001);
        dev.P.pos.set(UI.clamp((f-s0c)/span,0,1));}}
    /* drag-and-drop: drop an audio file straight onto the waveform */
    cv.addEventListener('dragover',function(e){e.preventDefault();cv.classList.add('dragover');});
    cv.addEventListener('dragleave',function(){cv.classList.remove('dragover');});
    cv.addEventListener('drop',function(e){
      e.preventDefault();cv.classList.remove('dragover');
      var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];
      if(f)loadFile(f);});
  })();
  dev.P.reverse={set:function(v){dev.p.reverse=v?1:0;},_def:0};
  dev.P.reverse.set(0);

  /* ================= panel layout helpers ================= */
  function knobRow(items,opts){
    var nowrap=opts&&opts.nowrap;
    var w=UI.el('div');
    /* nowrap rows need overflow-x:auto to scroll instead of wrapping, but per
       the CSS overflow spec a non-visible overflow-x forces the OTHER axis's
       used value to 'auto' too — and the knob dial's own SVG deliberately
       overhangs its box by 5px on every side (inset:-5px, for the ring/
       pointer) to draw outside its nominal box. With overflow-y visible that
       overhang just shows; once it's forced to 'auto' it gets clipped, which
       is why knob tops looked cut off. Padding the row past that overhang
       keeps it inside the clip rect instead of removing the clip itself. */
    w.style.cssText='display:flex;justify-content:center;align-items:center;gap:10px 14px'+
      (nowrap?';flex-wrap:nowrap;overflow-x:auto;padding:8px 4px':';flex-wrap:wrap');
    items.forEach(function(spec){var el=UI.ctl(dev,spec);if(nowrap)el.style.flex='none';w.appendChild(el);});
    return w;}
  function grp(title,contentEl){
    var g=UI.el('div','grp');
    if(title)g.appendChild(UI.el('h5',null,title));
    g.appendChild(contentEl);return g;}
  function flexRow(children,ratios){
    var r=UI.el('div');
    r.style.cssText='display:flex;gap:10px;align-items:stretch;flex-wrap:wrap';
    children.forEach(function(ch,i){ch.style.flex=(ratios&&ratios[i]?ratios[i]:'1')+' 1 220px';ch.style.minWidth='0';});
    r.append.apply(r,children);return r;}

  /* ================= patch export / import (self-contained, embeds audio) ================= */
  function bufferToWavBlob(buf){
    var numCh=buf.numberOfChannels,sr=buf.sampleRate,len=buf.length;
    var blockAlign=numCh*2,dataSize=len*blockAlign;
    var out=new ArrayBuffer(44+dataSize),view=new DataView(out);
    function ws(off,str){for(var i=0;i<str.length;i++)view.setUint8(off+i,str.charCodeAt(i));}
    ws(0,'RIFF');view.setUint32(4,36+dataSize,true);ws(8,'WAVE');
    ws(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);
    view.setUint16(22,numCh,true);view.setUint32(24,sr,true);
    view.setUint32(28,sr*blockAlign,true);view.setUint16(32,blockAlign,true);view.setUint16(34,16,true);
    ws(36,'data');view.setUint32(40,dataSize,true);
    var off=44,chans=[];for(var c=0;c<numCh;c++)chans.push(buf.getChannelData(c));
    for(var i=0;i<len;i++)for(var c2=0;c2<numCh;c2++){
      var s=UI.clamp(chans[c2][i],-1,1);
      view.setInt16(off,s<0?s*0x8000:s*0x7FFF,true);off+=2;}
    return new Blob([out],{type:'audio/wav'});}
  function blobToBase64(blob){
    return new Promise(function(res,rej){
      var r=new FileReader();
      r.onload=function(){res(String(r.result).split(',')[1]||'');};
      r.onerror=rej;r.readAsDataURL(blob);});}
  function base64ToArrayBuffer(b64){
    var bin=atob(b64),bytes=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    return bytes.buffer;}
  function exportPatch(){
    syncFocusedIntoSlotState();
    var globalP={};
    for(var k in dev.p)if(SLOT_PARAM_IDS.indexOf(k)<0)globalP[k]=dev.p[k];
    var jobs=['A','B'].map(function(slot){
      var st=dev.slotState[slot];
      if(!st.buffer)return Promise.resolve({p:st.p,audio:null});
      return blobToBase64(bufferToWavBlob(st.buffer)).then(function(b64){return{p:st.p,audio:b64};});});
    Promise.all(jobs).then(function(res){
      var patch={version:1,global:globalP,focusSlot:dev.focusSlot,slotA:res[0],slotB:res[1]};
      var blob=new Blob([JSON.stringify(patch)],{type:'application/json'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');a.href=url;a.download='AR-15-patch.json';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(function(){URL.revokeObjectURL(url);},4000);
      UI.toast('AR-15: patch exported (self-contained, includes sample audio)');
    }).catch(function(e){UI.toast('AR-15 export failed: '+e.message,'#ff6a55',5000);});}
  function importPatch(file){
    if(!file)return;
    file.text().then(function(txt){return JSON.parse(txt);}).then(function(patch){
      var decodeSlot=function(slotData){
        if(!slotData||!slotData.audio)return Promise.resolve(null);
        return ctx.decodeAudioData(base64ToArrayBuffer(slotData.audio));};
      return Promise.all([decodeSlot(patch.slotA),decodeSlot(patch.slotB)]).then(function(bufs){
        dev.slotState.A={buffer:bufs[0],bufferRev:null,p:(patch.slotA&&patch.slotA.p)||{}};
        dev.slotState.B={buffer:bufs[1],bufferRev:null,p:(patch.slotB&&patch.slotB.p)||{}};
        for(var k in patch.global)if(dev.P[k])try{dev.P[k].set(patch.global[k]);}catch(e){}
        switchFocus(patch.focusSlot==='A'?'A':'B',true);
        UI.toast('AR-15: patch imported');});
    }).catch(function(e){UI.toast('AR-15 import failed: '+e.message,'#ff6a55',5000);});}
  var patchInput=document.createElement('input');patchInput.type='file';patchInput.accept='application/json';patchInput.style.display='none';
  patchInput.onchange=function(){importPatch(patchInput.files&&patchInput.files[0]);patchInput.value='';};

  /* ================= panel: header + sections ================= */
  var c=UI.el('div','chassis');
  var hd=UI.el('div','pheader');
  hd.appendChild(UI.el('div','plate','AR-15<small>RESONANT FILTER INSTRUMENT</small>'));
  hd.appendChild(UI.ctl(dev,{t:'sel',id:'scaleRoot',label:'KEY',opts:NNAMES.map(function(n,i){return{v:i,t:n};}),def:0}));
  hd.appendChild(UI.ctl(dev,{t:'sel',id:'scaleType',label:'SCALE',opts:SCALE_NAMES.map(function(n,i){return{v:i,t:n};}),def:5}));
  var noteBtn=UI.el('button','ar15icon','&#9834;');
  noteBtn.title='QUANTIZE to key/scale';
  dev.P.quant={set:function(v){dev.p.quant=v?1:0;noteBtn.classList.toggle('on',!!v);},_def:0};
  dev.P.quant.set(0);
  noteBtn.onclick=function(){dev.P.quant.set(P('quant',0)?0:1);};
  hd.appendChild(noteBtn);
  hd.appendChild(UI.el('div','sp'));
  hd.appendChild(UI.ctl(dev,{t:'sel',id:'maxVoices',label:'VOICES',
    opts:[1,4,8,12,16].map(function(n){return{v:n,t:String(n)};}),def:12}));
  hd.appendChild(UI.presets(dev,PRESETS_AR15,0));
  var expBtn=UI.el('button','ar15icon','EXPORT');expBtn.title='Export a self-contained patch (embeds both slots\' audio)';
  expBtn.onclick=exportPatch;
  var impBtn=UI.el('button','ar15icon','IMPORT');impBtn.title='Import a patch file';
  impBtn.onclick=function(){patchInput.click();};
  hd.append(expBtn,impBtn,patchInput);
  var saveBtn=UI.el('button','ar15icon','SAVE');
  saveBtn.title='Open the rack preset bank';
  saveBtn.onclick=function(){RS.openModal('#bankModal');};
  hd.appendChild(saveBtn);
  dev.mchip=UI.el('div','mchip','<i></i>CH OMNI · MPE');
  dev.mchip.onclick=function(){RS.openModal('#midiModal');};
  hd.appendChild(dev.mchip);
  c.appendChild(hd);

  var body=UI.el('div');body.style.cssText='display:flex;gap:14px;align-items:stretch';
  function edgeFader(spec){
    var w=UI.el('div');w.style.cssText='display:flex;align-items:center;justify-content:center';
    w.appendChild(UI.fad(dev,spec));return w;}
  var inFader=edgeFader({id:'inLvl',label:'IN',def:.85,max:1.2,ap:function(v){A.smooth(dev.micGain.gain,v,.03);}});
  var outFader=edgeFader({id:'vol',label:'OUT',def:.85,max:1.2,ap:function(v){A.smooth(dev.outVol.gain,v,.03);}});
  var mainCol=UI.el('div');mainCol.style.cssText='display:flex;flex-direction:column;gap:10px;flex:1;min-width:0';
  body.append(inFader,mainCol,outFader);
  c.appendChild(body);

  mainCol.appendChild(waveGrp);
  blendKnobWrap.appendChild(UI.ctl(dev,{t:'k',id:'blend',label:'BLEND',min:0,max:1,def:.5,size:28,
    fmt:function(v){return v<=.02?'A':v>=.98?'B':Math.round(v*100)+'%';}}));

  /* three explicit rows, not one big wrapping list — organic flex-wrap
     places items by however much width happens to be free, which doesn't
     reliably land a specific control at the start of a specific row (e.g.
     EXTRACT kept wrapping onto row 1 next to LOOP instead of starting row
     2). Stacking three separately-wrapped rows pins the row boundaries
     themselves, regardless of panel width. */
  var srcRow1=knobRow([
    {t:'cus',fn:function(){return loadBtn;}},
    {t:'cus',fn:function(){return armBtn;}},
    {t:'cus',fn:function(){return dev.recBtn;}},
    {t:'cus',fn:function(){return playBtn;}},
    {t:'cus',fn:function(){
      var w=UI.el('div');w.style.cssText='display:flex;align-items:center;gap:6px';
      w.append(micPick,micPeakLed);return w;}},
    {t:'cus',fn:function(){return dirBtn;}},
    {t:'cus',fn:function(){return loopBtn;}}]);
  var srcRow2=knobRow([
    {t:'cus',fn:function(){return extBtn;}},
    {t:'st',id:'pitchMode',label:'PITCH MODE',opts:[{t:'PITCHED',v:0},{t:'FIXED',v:1}],def:0},
    {t:'k',id:'trans',label:'TRANS',min:-24,max:24,def:0,fmt:'semi'},
    {t:'k',id:'fine',label:'FINE',min:-100,max:100,def:0,fmt:function(v){return(v>0?'+':'')+Math.round(v)+'ct';}},
    {t:'k',id:'start',label:'START',min:0,max:1,def:0,fmt:'pc',ap:drawWave},
    {t:'k',id:'length',label:'SPREAD',min:.01,max:1,def:1,fmt:'pc',ap:drawWave},
    {t:'cus',fn:function(){return grainBtn;}},
    {t:'k',id:'size',label:'SIZE',min:10,max:500,def:100,fmt:function(v){return Math.round(v)+'ms';}}]);
  var srcRow3=knobRow([
    {t:'k',id:'dens',label:'DENS',min:.5,max:40,def:10,log:1,fmt:function(v){return v.toFixed(1)+'/s';}},
    {t:'k',id:'pos',label:'POS',min:0,max:1,def:.17,fmt:'pc',ap:drawWave},
    {t:'k',id:'pitch',label:'PITCH',min:-24,max:24,def:0,fmt:'semi'},
    {t:'k',id:'pan',label:'PAN',min:-1,max:1,def:0,fmt:function(v){return(v>0?'+':'')+Math.round(v*100)+'%';}},
    {t:'k',id:'drift',label:'DRIFT',min:0,max:1,def:.13,fmt:'pc'},
    {t:'cus',fn:function(){return detBtn;}},
    {t:'k',id:'root',label:'ROOT',min:24,max:96,def:60,fmt:'note',size:28}]);
  var srcInner=UI.el('div');srcInner.style.cssText='display:flex;flex-direction:column;gap:8px;width:100%';
  srcInner.append(srcRow1,srcRow2,srcRow3);
  var sourceGrp=grp('SOURCE',srcInner);

  var genRowTop=knobRow([
    {t:'st',id:'autoOn',label:'AUTO PLAY',opts:[{t:'OFF',v:0},{t:'ON',v:1}],def:0,ap:function(){scheduleAuto();}},
    {t:'st',id:'autoSrc',label:'SOURCE',opts:[{t:'RANDOM',v:0},{t:'EXTRACTED',v:1}],def:0,ap:function(){scheduleAuto();}}]);
  var genRowMid=knobRow([
    {t:'k',id:'autoRate',label:'RATE',min:.2,max:10,def:2.2,log:1,fmt:'ms'},
    {t:'k',id:'autoSpan',label:'SPAN',min:1,max:4,def:2,fmt:function(v){return Math.round(v)+' oct';}},
    {t:'k',id:'autoHold',label:'HOLD',min:.3,max:14,def:3,log:1,fmt:'ms'},
    {t:'k',id:'stereoSpread',label:'SPREAD',min:0,max:1,def:.2,fmt:'pc'}],{nowrap:true});
  var genRowBottom=knobRow([
    {t:'st',id:'mpeAmpMode',label:'MPE AMP',opts:[{t:'VELOCITY',v:0},{t:'PRESSURE',v:1}],def:0}]);
  var genInner=UI.el('div');genInner.style.cssText='display:flex;flex-direction:column;gap:8px;width:100%';
  genInner.append(genRowTop,genRowMid,genRowBottom);
  var genGrp=grp('GENERATIVE',genInner);
  mainCol.appendChild(flexRow([sourceGrp,genGrp],[2.3,1]));

  var envGrp=grp('ENVELOPE',knobRow([
    {t:'k',id:'eA',label:'A',min:0,max:1,def:.1,fmt:function(v){return Math.round((.003+v*1.5)*1000)+'ms';}},
    {t:'k',id:'eD',label:'D',min:0,max:1,def:.3,fmt:function(v){return Math.round((.01+v*3)*1000)+'ms';}},
    {t:'k',id:'eS',label:'S',min:0,max:1,def:.7,fmt:'pc'},
    {t:'k',id:'eR',label:'R',min:0,max:1,def:.4,fmt:function(v){return((.05+v*5)).toFixed(2)+'s';}}]));

  var harmInner=UI.el('div');harmInner.style.cssText='display:flex;flex-direction:column;gap:8px;width:100%';
  harmInner.appendChild(knobRow([
    {t:'sel',id:'material',label:'MATERIAL',opts:MATERIALS.map(function(m,i){return{v:i,t:m};}),def:0}]));
  var harmRow=UI.el('div');harmRow.style.cssText='display:flex;gap:5px;justify-content:center;flex-wrap:nowrap;overflow-x:auto;padding:8px 4px 2px';
  var HDEF=[.55,.4,.65,.3,.5,.25,.35,.2];
  for(var hi=0;hi<8;hi++){(function(i){
    var col=UI.el('div');col.style.cssText='display:flex;flex-direction:column;align-items:center;gap:2px;flex:none';
    var panKnob=UI.ctl(dev,{t:'k',id:'hPan'+i,label:'',min:-1,max:1,def:0,size:20,
      fmt:function(v){return Math.round(v*100)+'%';}});
    panKnob.style.width='28px';
    col.appendChild(panKnob);
    col.appendChild(UI.ctl(dev,{t:'v',id:'hLvl'+i,label:'',min:0,max:1,def:HDEF[i],fmt:'pc'}));
    var sm=UI.el('div','qbtnrow');sm.style.width='28px';
    var sB=UI.el('button','qbtn y','S'),mB=UI.el('button','qbtn r','M');
    dev.P['hSolo'+i]={set:function(v){dev.p['hSolo'+i]=v?1:0;sB.classList.toggle('on',!!v);},_def:0};
    dev.P['hMute'+i]={set:function(v){dev.p['hMute'+i]=v?1:0;mB.classList.toggle('on',!!v);},_def:0};
    dev.P['hSolo'+i].set(0);dev.P['hMute'+i].set(0);
    sB.onclick=function(){dev.P['hSolo'+i].set(P('hSolo'+i,0)?0:1);};
    mB.onclick=function(){dev.P['hMute'+i].set(P('hMute'+i,0)?0:1);};
    sm.append(sB,mB);col.appendChild(sm);harmRow.appendChild(col);})(hi);}
  harmInner.appendChild(harmRow);
  var harmGrp=grp('HARMONICS',harmInner);

  var resGrp=grp('RESONANCE',knobRow([
    {t:'k',id:'ringAmt',label:'RING',min:0,max:1,def:.4,fmt:'pc'},
    {t:'k',id:'resSpread',label:'SPREAD',min:0,max:1,def:.2,fmt:'pc'},
    {t:'k',id:'resLife',label:'LIFE',min:0,max:1,def:.4,fmt:'pc'},
    {t:'k',id:'resDW',label:'D/W',min:0,max:1,def:.4,fmt:'pc'}]));

  var filtGrp=grp('FILTER',knobRow([
    {t:'k',id:'hpf',label:'HP',min:0,max:1,def:0,fmt:function(v){return Math.round(UI.clamp(20*Math.pow(400,v),20,8000))+'Hz';}},
    {t:'k',id:'hres',label:'RES',min:0,max:1,def:0,fmt:'pc'},
    {t:'k',id:'lpf',label:'LP',min:0,max:1,def:.85,fmt:function(v){return Math.round(UI.clamp(60*Math.pow(280,v),60,17000))+'Hz';}},
    {t:'k',id:'lres',label:'RES',min:0,max:1,def:0,fmt:'pc'},
    {t:'k',id:'inputGain',label:'IN GAIN',min:-24,max:24,def:0,fmt:'db'}]));

  var revGrp=grp('REVERB',knobRow([
    {t:'k',id:'revMix',label:'MIX',min:0,max:1,def:.35,fmt:'pc',ap:function(){applyRevMix(dev.focusSlot);}},
    {t:'k',id:'revTime',label:'TIME',min:.2,max:8,def:2.4,log:1,fmt:'ms',ap:function(){scheduleIR(dev.focusSlot);}},
    {t:'k',id:'revDamp',label:'DAMP',min:800,max:14000,def:6000,log:1,fmt:'hz',ap:function(){scheduleIR(dev.focusSlot);}},
    {t:'k',id:'revDiff',label:'DIFF',min:0,max:1,def:.5,fmt:'pc',ap:function(){scheduleIR(dev.focusSlot);}}]));

  var leftCol=UI.el('div');leftCol.style.cssText='display:flex;flex-direction:column;gap:10px;flex:1;min-width:0';
  leftCol.append(envGrp,filtGrp);
  var rightCol=UI.el('div');rightCol.style.cssText='display:flex;flex-direction:column;gap:10px;flex:1;min-width:0';
  rightCol.append(resGrp,revGrp);
  mainCol.appendChild(flexRow([leftCol,harmGrp,rightCol],[1,1.1,1]));

  dev.kbWrap=UI.keys(dev,3);mainCol.appendChild(dev.kbWrap);
  mainCol.appendChild(UI.el('div','content-note2',
    'Two independent slots — SLOT A / SLOT B — each keep their own sample, loop points, ADSR, filter, harmonics and '+
    'reverb; click a pill to edit that slot (both still sound together). BLEND crossfades between them; LINK mirrors '+
    'every edit onto both. HARMONICS is additive, not an EQ: its 8 levels set the volume of generated overtones '+
    '(MATERIAL picks the ratio set) at whatever note you play, and that tone\'s loudness is shaped by this slot\'s own '+
    'amplitude peaks — the recording\'s own dynamics become the harmonics\' rhythm. RING controls how long that chime '+
    'keeps ringing after the note releases; RESONANCE\'s D/W blends it against the dry sample underneath. EXTRACT '+
    'reads a slot\'s peaks into a note phrase for AUTO PLAY to run hands-free. An MPE controller can bend and press '+
    'each held note independently. EXPORT/IMPORT save a self-contained patch, audio included.'));
  dev.chassis=c;

  /* ================= slot focus + LINK wiring ================= */
  function syncFocusedIntoSlotState(){
    var st=dev.slotState[dev.focusSlot];
    SLOT_PARAM_IDS.forEach(function(id){st.p[id]=dev.p[id];});
    st.buffer=dev.buffer;st.bufferRev=dev.bufferRev;}
  function switchFocus(slot,skipSaveCurrent){
    if(!skipSaveCurrent)syncFocusedIntoSlotState();
    dev.focusSlot=slot;
    var st=dev.slotState[slot];
    SLOT_PARAM_IDS.forEach(function(id){
      if(dev.P[id]&&st.p[id]!==undefined)dev.P[id].set(st.p[id],false);});
    dev.buffer=st.buffer;dev.bufferRev=st.bufferRev;
    pillA.el.classList.toggle('on',slot==='A');pillB.el.classList.toggle('on',slot==='B');
    dev.sampleStat=slot==='A'?pillA.stat:pillB.stat;
    status(dev.buffer?dev.buffer.duration.toFixed(1)+'s loaded':'EMPTY');
    buildIR('A');buildIR('B');applyRevMix('A');applyRevMix('B');
    drawWave();}
  dev.switchSlotFocus=switchFocus;
  /* LINK: mirror every per-slot control's edits into the OTHER slot's
     stored snapshot the moment they happen, so switching to it later
     already shows the synced value */
  SLOT_PARAM_IDS.forEach(function(id){
    var entry=dev.P[id];if(!entry)return;
    var origSet=entry.set;
    entry.set=function(v,fire){
      origSet(v,fire);
      if(dev.p.link){var other=dev.focusSlot==='A'?'B':'A';dev.slotState[other].p[id]=dev.p[id];}};});
  status('EMPTY');

  /* ================= note handling ================= */
  dev.voices=new Map();dev.sustained=new Set();dev.pedal=false;
  dev.mpe=true;                      /* opt into rs-midi.js's per-channel MPE routing */
  var bendSemi=0,modDrift=0;
  dev.bend=function(v){bendSemi=UI.clamp(v,-1,1)*2;};
  dev.mod=function(v){modDrift=UI.clamp(v,0,1);};
  function quantize(note){
    if(!P('quant',0))return note;
    var scale=SCALES[Math.round(P('scaleType',5))]||SCALES[5];
    var rootPc=((Math.round(P('scaleRoot',0))%12)+12)%12;
    var pc=(((note-rootPc)%12)+12)%12;
    var best=scale[0],bd=99;
    scale.forEach(function(d){var dist=Math.min(Math.abs(d-pc),12-Math.abs(d-pc));if(dist<bd){bd=dist;best=d;}});
    return note-pc+best;}

  /* the harmonics' own excitation source: an RMS-per-hop amplitude curve
     across a region, normalized 0-1 — the "waveform peaks" that get played
     back as an AudioParam curve to shape the additive harmonic stack, so
     its loudness literally comes from the source recording's own dynamics
     rather than a synthesizer's fixed envelope */
  function buildPeakEnvelope(buf,startSec,lenSec){
    var N2=64,data=buf.getChannelData(0),sr=buf.sampleRate;
    var s0=Math.max(0,Math.floor(startSec*sr)),s1=Math.min(data.length,Math.floor((startSec+lenSec)*sr));
    var span=Math.max(s1-s0,1),curve=new Float32Array(N2);
    for(var i=0;i<N2;i++){
      var i0=s0+Math.floor((i/N2)*span),i1=s0+Math.floor(((i+1)/N2)*span),sum=0,n=0;
      for(var j=i0;j<Math.min(i1,data.length);j++){sum+=data[j]*data[j];n++;}
      curve[i]=Math.sqrt(sum/Math.max(n,1));}
    var mx=0;for(i=0;i<N2;i++)if(curve[i]>mx)mx=curve[i];
    if(mx>1e-5)for(i=0;i<N2;i++)curve[i]=curve[i]/mx;
    for(i=0;i<N2;i++)curve[i]=Math.max(curve[i],.0008);
    return curve;}

  /* one slot's full chain for one note: input filter -> additive harmonics
     (excited by this slot's own peaks) blended with the dry grain/sustain
     source -> that slot's reverb bus. Returns null if nothing is loaded. */
  function buildSlotLayer(slot,note,vel,blendGain){
    var st=dev.slotState[slot];
    var dirMode=Math.round(P('direction',0));
    var useRev=dirMode===1?true:dirMode===3?Math.random()<.5:
      dirMode===2?(dev['_ping'+slot]=1-(dev['_ping'+slot]||0)):false;
    if(useRev)ensureReverseFor(slot);
    var buf=(useRev&&st.bufferRev)?st.bufferRev:st.buffer;
    if(!buf)return null;
    var bufDur=buf.duration;
    var t0=ctx.currentTime;
    var trans=P('trans',0),pitch=P('pitch',0),fineCt=P('fine',0)/100;
    var pitchedMode=!P('pitchMode',0);
    var semis=(note-Math.round(PS(slot,'root',60)))+trans+pitch+fineCt;
    var baseRate=pitchedMode?Math.pow(2,semis/12):1;
    var startSec=UI.clamp(PS(slot,'start',0),0,1)*bufDur;
    var lenSec=Math.max(UI.clamp(PS(slot,'length',1),.01,1)*bufDur,.03);
    /* polyphony compensation — same RMS-style 1/sqrt(n) idea as bandNorm
       below, but across VOICES instead of harmonic bands: rapid-fire
       triggering (AUTO PLAY, especially SOURCE=EXTRACTED replaying a dense
       peak sequence) can pile many overlapping notes — each already
       individually safe — into a sum hot enough that only the limiter/
       soft-clip stood between it and audible distortion. Scaling each
       voice down as active polyphony rises keeps the sum roughly constant
       instead of climbing with note count, so the safety net downstream
       isn't doing all the work on its own. */
    var polyComp=1/Math.sqrt(Math.max(dev.voices.size,0)+1);
    var peak=UI.clamp(vel,.05,1)*.85*blendGain*polyComp;
    var aA=.003+UI.clamp(PS(slot,'eA',.1),0,1)*1.5,aD=.01+UI.clamp(PS(slot,'eD',.3),0,1)*3,
        aS=UI.clamp(PS(slot,'eS',.7),0,1),aR=.05+UI.clamp(PS(slot,'eR',.4),0,1)*5;
    var timer=null,stopped=false,oneShot=null,lifeOsc=null,extraNodes=[];
    function N(n){extraNodes.push(n);return n;}

    var preSum=N(G(1));
    var vHp=N(ctx.createBiquadFilter());vHp.type='highpass';
    vHp.frequency.value=UI.clamp(20*Math.pow(400,UI.clamp(PS(slot,'hpf',0),0,1)),20,8000);
    vHp.Q.value=.7+UI.clamp(PS(slot,'hres',0),0,1)*12;
    var vLp=N(ctx.createBiquadFilter());vLp.type='lowpass';
    vLp.frequency.value=UI.clamp(60*Math.pow(280,UI.clamp(PS(slot,'lpf',.85),0,1)),60,17000);
    vLp.Q.value=.7+UI.clamp(PS(slot,'lres',0),0,1)*20;
    var vInGain=N(G(Math.pow(10,UI.clamp(PS(slot,'inputGain',0),-24,24)/20)));
    preSum.connect(vHp);vHp.connect(vLp);vLp.connect(vInGain);

    var ratios=MATERIAL_RATIOS[UI.clamp(Math.round(PS(slot,'material',0)),0,MATERIAL_RATIOS.length-1)];
    var noteFreq=UI.F2(UI.clamp(note,0,127))*Math.pow(2,(trans+pitch+fineCt)/12);
    var ringAmt=UI.clamp(PS(slot,'ringAmt',.4),0,1),spreadAmt=UI.clamp(PS(slot,'resSpread',.2),0,1),
        lifeAmt=UI.clamp(PS(slot,'resLife',.4),0,1),dw=UI.clamp(PS(slot,'resDW',.4),0,1);
    var anySolo=false;for(var si=0;si<8;si++)if(PS(slot,'hSolo'+si,0)){anySolo=true;break;}
    if(lifeAmt>.01){
      lifeOsc=ctx.createOscillator();lifeOsc.type='sine';lifeOsc.frequency.value=.06+Math.random()*.18;
      try{lifeOsc.start(t0);}catch(e){}}
    /* ============ HARMONICS: additive synthesis, driven by this slot's own
       peaks — NOT a filter/EQ on the sample. Each of the 8 levels sets the
       amplitude of a GENERATED sine partial (its ratio to the played note
       from MATERIAL); the whole stack's loudness is then shaped by an
       envelope read straight off this slot's own amplitude contour over
       its START/SPREAD region — literally harmonics created out of the
       waveform's peaks — looping for as long as the note is held, so the
       chime breathes in time with the recording's own dynamics instead of
       just following the note's ADSR. RING controls how long that chime
       rings on after the note releases; SPREAD/LIFE detune and wobble the
       partials for an inharmonic/bell-like spread. */
    /* normalize by how many bands are actually sounding (RMS-style 1/sqrt(n))
       so lighting up more harmonics adds richness, not raw loudness — the
       biggest single source of the additive stack piling up too hot */
    var activeBandCount=0;
    for(var pi=0;pi<8;pi++){
      var pLvl=UI.clamp(PS(slot,'hLvl'+pi,.5),0,1),pMuted=!!PS(slot,'hMute'+pi,0),pActive=anySolo?!!PS(slot,'hSolo'+pi,0):true;
      if(!pMuted&&pActive&&pLvl>.003)activeBandCount++;}
    var bandNorm=.6/Math.sqrt(Math.max(activeBandCount,1));
    var harmSum=N(G(1)),harmOscs=[];
    for(var hi=0;hi<8;hi++){
      var lvl=UI.clamp(PS(slot,'hLvl'+hi,.5),0,1),muted=!!PS(slot,'hMute'+hi,0),active=anySolo?!!PS(slot,'hSolo'+hi,0):true;
      if(muted||!active||lvl<=.003)continue;
      var detune=1+(spreadAmt*(hi/7))*(Math.random()*2-1)*.06;
      var freq=UI.clamp(noteFreq*ratios[hi]*detune,20,18000);
      var hOsc=ctx.createOscillator();hOsc.type='sine';hOsc.frequency.value=freq;
      var hg=N(G(lvl*bandNorm)),hpan=N(ctx.createStereoPanner());hpan.pan.value=UI.clamp(PS(slot,'hPan'+hi,0),-1,1);
      hOsc.connect(hg);hg.connect(hpan);hpan.connect(harmSum);
      if(lifeOsc){var lg=N(G(freq*lifeAmt*.025));lifeOsc.connect(lg);lg.connect(hOsc.frequency);}
      try{hOsc.start(t0);}catch(e){}
      harmOscs.push(hOsc);}
    var harmEnvGain=N(G(0));harmSum.connect(harmEnvGain);
    var envCurve=buildPeakEnvelope(buf,startSec,lenSec);
    var envDur=Math.max(lenSec,.25);
    var envTimer=null;
    function loopEnv(){
      if(stopped)return;
      try{
        harmEnvGain.gain.cancelScheduledValues(ctx.currentTime);
        harmEnvGain.gain.setValueCurveAtTime(envCurve,ctx.currentTime,envDur);
      }catch(e){}
      envTimer=setTimeout(loopEnv,envDur*1000);}
    loopEnv();
    var dryTap=N(G(1-dw)),harmWet=N(G(dw));
    vInGain.connect(dryTap);harmEnvGain.connect(harmWet);
    var voiceSum=N(G(1));dryTap.connect(voiceSum);harmWet.connect(voiceSum);
    var spreadPan=N(ctx.createStereoPanner());
    spreadPan.pan.value=UI.clamp((Math.random()*2-1)*UI.clamp(P('stereoSpread',0),0,1),-1,1);
    voiceSum.connect(spreadPan);

    /* MPE PRESSURE lands here — a live multiplier on top of the ADSR,
       untouched (gain 1) until a per-note controller actually sends
       channel pressure, so non-MPE gear behaves exactly as before */
    var pressMult=N(G(1));
    spreadPan.connect(pressMult);
    var vGain=G(0);pressMult.connect(vGain);vGain.connect(dev['rev'+slot].bus);
    vGain.gain.setValueAtTime(0,t0);
    vGain.gain.linearRampToValueAtTime(peak,t0+aA);
    vGain.gain.setTargetAtTime(peak*aS,t0+aA,Math.max(aD/3,.02));

    var bendExtra=0;
    function calcRate(){return baseRate*Math.pow(2,(bendSemi+bendExtra)/12);}
    if(!P('grainOn',1)){
      var s=ctx.createBufferSource();s.buffer=buf;s.playbackRate.value=baseRate;
      s.loop=true;s.loopStart=startSec;s.loopEnd=Math.min(startSec+lenSec,bufDur);
      var p0=ctx.createStereoPanner();p0.pan.value=UI.clamp(P('pan',0),-1,1);
      s.connect(p0);p0.connect(preSum);
      try{s.start(t0,startSec);}catch(e){}
      oneShot=s;
    }else{
    function spawnGrain(){
      if(stopped)return;
      var dens=UI.clamp(P('dens',10),.5,60),sizeMs=UI.clamp(P('size',110),10,600),
          drift=UI.clamp(UI.clamp(P('drift',.13),0,1)+modDrift*.3,0,1),
          posFrac=UI.clamp(P('pos',.17),0,1),wrap=!!P('loopWrap',1);
      var jitter=(Math.random()*2-1)*drift*lenSec*.5;
      var raw=posFrac*lenSec+jitter;
      var off;
      if(wrap){var m=((raw%lenSec)+lenSec)%lenSec;off=UI.clamp(startSec+m,0,Math.max(bufDur-.02,0));}
      else off=UI.clamp(startSec+UI.clamp(raw,0,lenSec),0,Math.max(bufDur-.02,0));
      var rate=calcRate()*Math.pow(2,((Math.random()*2-1)*drift*.6)/12);
      var durSec=sizeMs/1000;
      var maxDur=(bufDur-off)/Math.max(rate,.05);
      if(durSec>maxDur)durSec=Math.max(maxDur,.015);
      var src=ctx.createBufferSource();src.buffer=buf;src.playbackRate.value=rate;
      var gg=G(0),pan=ctx.createStereoPanner();
      pan.pan.value=UI.clamp(UI.clamp(P('pan',0),-1,1)+(Math.random()*2-1)*drift*.9,-1,1);
      src.connect(gg);gg.connect(pan);pan.connect(preSum);
      var t=ctx.currentTime,atk=Math.min(durSec*.4,.015),rel=Math.min(durSec*.4,.02);
      gg.gain.setValueAtTime(0,t);
      gg.gain.linearRampToValueAtTime(1,t+atk);
      gg.gain.setValueAtTime(1,Math.max(t+atk,t+durSec-rel));
      gg.gain.linearRampToValueAtTime(0,t+durSec);
      try{src.start(t,off,durSec);}catch(e){}
      try{src.stop(t+durSec+.03);}catch(e){}
      src.onended=function(){try{src.disconnect();gg.disconnect();pan.disconnect();}catch(e){}};
      timer=setTimeout(spawnGrain,Math.max(1000/dens*(.82+Math.random()*.36),8));}
    spawnGrain();
    }
    return{
      setBend:function(semis){bendExtra=semis;if(oneShot)A.smooth(oneShot.playbackRate,calcRate(),.02);},
      setPressure:function(amt){
        amt=UI.clamp(amt,0,1);
        var target=Math.round(P('mpeAmpMode',0))===0?(.5+.5*amt):Math.max(amt,.05);
        A.smooth(pressMult.gain,target,.03);},
      off:function(){
        stopped=true;clearTimeout(timer);clearTimeout(envTimer);
        /* RING: the harmonic chime rings on independently of the sample's
           own release — longer RING keeps it audible well after note-off */
        var ringTail=.1+ringAmt*2.5;
        var tH=ctx.currentTime,curH=harmEnvGain.gain.value;
        harmEnvGain.gain.cancelScheduledValues(tH);
        harmEnvGain.gain.setValueAtTime(Number.isFinite(curH)?curH:0,tH);
        harmEnvGain.gain.setTargetAtTime(0,tH,Math.max(ringTail/3,.03));
        var relEnd=ctx.currentTime+Math.max(aR*3,.3)+.2;
        var harmRelEnd=ctx.currentTime+ringTail+.15;
        if(oneShot)try{oneShot.stop(relEnd);}catch(e){}
        harmOscs.forEach(function(o){try{o.stop(harmRelEnd);}catch(e){}});
        if(lifeOsc)try{lifeOsc.stop(Math.max(relEnd,harmRelEnd));}catch(e){}
        var tO=ctx.currentTime,cur=vGain.gain.value;
        vGain.gain.cancelScheduledValues(tO);
        vGain.gain.setValueAtTime(Number.isFinite(cur)?cur:0,tO);
        vGain.gain.setTargetAtTime(0,tO,Math.max(Math.max(aR,ringTail)/3,.02));
        setTimeout(function(){
          try{vGain.disconnect();}catch(e){}
          extraNodes.forEach(function(n){try{n.disconnect();}catch(e){}});
        },Math.max(aR*3,ringTail*3,.3)*1000+250);}};}

  function mkVoice(note,vel){
    var blend=UI.clamp(P('blend',.5),0,1);
    var gA=Math.cos(blend*Math.PI/2),gB=Math.sin(blend*Math.PI/2);
    var hasA=!!dev.slotState.A.buffer,hasB=!!dev.slotState.B.buffer;
    var layers=[];
    if(hasA){var lA=buildSlotLayer('A',note,vel,hasB?gA:1);if(lA)layers.push(lA);}
    if(hasB){var lB=buildSlotLayer('B',note,vel,hasA?gB:1);if(lB)layers.push(lB);}
    if(!layers.length)return null;
    return{
      setBend:function(semis){layers.forEach(function(l){l.setBend(semis);});},
      setPressure:function(amt){layers.forEach(function(l){l.setPressure(amt);});},
      off:function(){layers.forEach(function(l){l.off();});}};}

  function flashChip(){
    if(!dev.mchip)return;
    dev.mchip.classList.add('lit');clearTimeout(dev._fchT);
    dev._fchT=setTimeout(function(){dev.mchip.classList.remove('lit');},110);}
  function anyBufferLoaded(){return !!(dev.slotState.A.buffer||dev.slotState.B.buffer);}
  dev.noteOn=function(rawNote,vel){
    if(!anyBufferLoaded()){UI.toast('AR-15: load or record a sample into a slot first','#ff6a55',2200);return;}
    var note=quantize(Math.round(rawNote));
    if(vel===undefined||!Number.isFinite(vel))vel=.8;
    var key=String(note);
    var old=dev.voices.get(key);if(old)old.off();
    if(dev.voices.size>=maxV()){var k0=dev.voices.keys().next().value;
      var ov=dev.voices.get(k0);if(ov)ov.off();dev.voices.delete(k0);}
    var v=mkVoice(note,vel);
    if(v)dev.voices.set(key,v);};
  dev.noteOff=function(rawNote){
    var note=Math.round(rawNote);
    if(dev.pedal){dev.sustained.add(note);return;}
    var key=String(quantize(note));
    var v=dev.voices.get(key);if(v){v.off();dev.voices.delete(key);}};
  /* MPE: per-note pitch bend / channel pressure, routed here by rs-midi.js
     once it knows which note is on which channel (dev.mpe=true above) */
  dev.noteBend=function(rawNote,bendNorm){
    var key=String(quantize(Math.round(rawNote)));
    var v=dev.voices.get(key);if(v)v.setBend(UI.clamp(bendNorm,-1,1)*2);};
  dev.notePressure=function(rawNote,amt){
    var key=String(quantize(Math.round(rawNote)));
    var v=dev.voices.get(key);if(v)v.setPressure(amt);};
  dev.allOff=function(){
    dev.voices.forEach(function(v){v.off();});dev.voices.clear();dev.sustained.clear();
    clearTimeout(autoTimer);
    if(dev.recorder&&dev.recorder.state==='recording'){try{dev.recorder.stop();}catch(e){}}
    stopMic();};

  var autoTimer=null,autoCounter=0;
  function usingExtracted(){return !!P('autoSrc',0)&&dev.extractedSeq&&dev.extractedSeq.length>0;}
  function scheduleAuto(){
    clearTimeout(autoTimer);
    if(!P('autoOn',0))return;
    var rate=UI.clamp(P('autoRate',2.2),.2,10),delayMs;
    if(usingExtracted()&&dev.extractedSeq.length>1){
      var seq=dev.extractedSeq,idx=(dev._extIdx||0)%seq.length,nxt=(idx+1)%seq.length;
      var dt=seq[nxt].t-seq[idx].t;
      if(dt<=0){var buf=activeBuffer();dt=(buf?buf.duration:2)*UI.clamp(P('length',1),.05,1)-seq[idx].t;}
      delayMs=UI.clamp(dt*1000*(rate/2.2),120,15000);
    }else delayMs=rate*1000*(.6+Math.random()*.8);
    autoTimer=setTimeout(function(){fireAutoNote();scheduleAuto();},delayMs);}
  function fireAutoNote(){
    if(!anyBufferLoaded()||dev.voices.size>=maxV())return;
    var note,vel;
    if(usingExtracted()){
      var seq=dev.extractedSeq;
      dev._extIdx=((dev._extIdx||0)+1)%seq.length;
      var ev=seq[dev._extIdx];
      note=ev.note;vel=ev.vel;
    }else{
      var scale=SCALES[Math.round(P('scaleType',5))]||SCALES[5];
      var deg=scale[Math.floor(Math.random()*scale.length)];
      var rootPc=Math.round(P('scaleRoot',0));
      var span=UI.clamp(Math.round(P('autoSpan',2)),1,4);
      var oct=Math.floor(Math.random()*span)-Math.floor(span/2);
      note=UI.clamp(60+rootPc+deg+12*oct,24,96);
      vel=.3+Math.random()*.5;}
    var v=mkVoice(note,vel);if(!v)return;
    var key='a'+(autoCounter++);
    dev.voices.set(key,v);flashChip();
    var hold=UI.clamp(P('autoHold',3),.3,14)*1000*(.6+Math.random()*.8);
    setTimeout(function(){var vv=dev.voices.get(key);if(vv){vv.off();dev.voices.delete(key);}},hold);}

  dev.tick=function(){
    try{
      var mdb=A.dbOf(dev.micPeakAna);
      micPeakLed.classList.remove('on','ar15led-y','ar15led-r');
      if(mdb>-3){micPeakLed.classList.add('on','ar15led-r');}
      else if(mdb>-12){micPeakLed.classList.add('on','ar15led-y');}
      else if(mdb>-50){micPeakLed.classList.add('on');}
    }catch(e){}};
  buildIR('A');buildIR('B');applyRevMix('A');applyRevMix('B');
  requestAnimationFrame(sizeCanvas);
},
back:[{title:'CV / GATE / ENV',jacks:[['cvin','in','cv',null,'CV IN'],['gatein','in','cv',null,'GATE IN'],['envin','in','cv',null,'ENV IN']]},
  {title:'AUDIO OUT',jacks:[['outa','out','audio',null,'OUT']]}]});
