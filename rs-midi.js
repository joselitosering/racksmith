/* RACKSMITH MIDI bridge — Web MIDI, learn, routing */
'use strict';
window.RS=window.RS||{};RS.mods=RS.mods||{};RS.mods.midi='ok';
RS.MIDI=(function(){
var MIDI={};
var learnState=null;
MIDI.learn=function(dev,id,label,w){
  MIDI.clearLearn();
  learnState={dev:dev,id:id,label:label,el:w};
  w.classList.add('learning');
  RS.UI.toast('MIDI LEARN · '+dev.name+' '+label+' — move an encoder (ESC cancels)',4000);};
MIDI.clearLearn=function(){if(learnState){learnState.el.classList.remove('learning');learnState=null;}};
function flash(dev){if(!dev.mchip)return;
  dev.mchip.classList.add('lit');clearTimeout(dev._ft);
  dev._ft=setTimeout(function(){dev.mchip.classList.remove('lit');},110);}
function applyBinding(cc,d2){
  var b=RS.S.ccBindings[cc];if(!b)return false;
  var bd=RS.byId(b.dev);
  if(!bd||!bd.P[b.id]){delete RS.S.ccBindings[cc];return false;}
  var P=bd.P[b.id],r=P._r||{min:0,max:1.2,log:false};
  var cur=bd.p[b.id];
  if(d2===96||d2===97||d2===1||d2===127||d2===63||d2===65){
    var dir=(d2===96||d2===127||d2===65)?1:-1,v;
    if(r.log&&cur>0&&r.min>0){var n=Math.log(Math.max(cur,r.min)/r.min)/Math.log(r.max/r.min);
      v=r.min*Math.pow(r.max/r.min,Math.max(0,Math.min(1,n+dir*.05)));}
    else v=Math.max(r.min,Math.min(r.max,cur+dir*(r.max-r.min)*.05));
    P.set(v);
  }else{
    var n2=Math.max(0,Math.min(1,d2/127));
    var v2=r.log&&r.min>0?r.min*Math.pow(r.max/r.min,n2):r.min+n2*(r.max-r.min);
    P.set(Math.max(r.min,Math.min(r.max,v2)));}
  flash(bd);
  return true;}
MIDI.onMIDI=function(e){
  var inp=RS.S.midiIns.find(function(i){return i.id===e.target.id;});
  if(inp&&!inp.on)return;
  if(!RS.A.ctx)return;
  var st=e.data[0],d1=e.data[1]||0,d2=e.data[2]||0;
  var cmd=st&0xf0;
  if(cmd===0xB0&&learnState){
    var ls=learnState;
    RS.S.ccBindings[d1]={dev:ls.dev.id,id:ls.id,name:ls.dev.name+' · '+(ls.label||ls.id)};
    MIDI.clearLearn();
    if(RS.UI.$('#midiModal').classList.contains('open'))MIDI.panel();
    RS.UI.toast('Learned: CC '+d1+' \u2192 '+ls.dev.name+' '+(ls.label||''));
    return;}
  if(cmd===0xB0&&applyBinding(d1,d2))return;
  var midiCh=(st&0x0f)+1;
  RS.S.devices.forEach(function(dev){
    if(dev.channel===undefined||dev.channel==='off')return;
    if(dev.channel!=='omni'&&dev.channel!==midiCh)return;
    /* RD-8 always answers a channel/omni match on whatever notes its dmap
       recognizes — a drum machine doesn't need "focus" for its pads to work,
       same as a real one. Every OTHER omni device (synths) would otherwise
       all sound at once for the same key, since 'omni' is the default state
       for every synth in the rack — so once something has focus (clicking a
       device sets RS.S.focus, same as the computer-keyboard shortcut uses),
       an omni synth only responds if it's the focused one. A device given
       its own explicit channel (not omni) still always answers on that
       channel regardless of focus — that's a deliberate multi-timbral
       assignment, not the automatic default. */
    if(dev.type!=='rd'&&dev.channel==='omni'&&RS.S.focus&&RS.S.focus!==dev)return;
    if(cmd===0x90&&d2>0){flash(dev);
      if(dev.type==='rd'){var tr=dev.dmap[d1];if(tr!==undefined)dev.hit(tr,RS.A.ctx.currentTime,d2/127);}
      else if(dev.noteOn)dev.noteOn(d1,d2/127);
    }else if(cmd===0x80||(cmd===0x90&&d2===0)){
      if(dev.type!=='rd'&&dev.noteOff)dev.noteOff(d1);
    }else if(cmd===0xB0){var v=d2/127;
      if(d1===1&&dev.mod)dev.mod(v);
      else if(d1===7&&dev.P.vol)dev.P.vol.set(v*1.2);
      else if(d1===64&&dev.pedal!==undefined){dev.pedal=v>.5;
        if(!dev.pedal){dev.sustained.forEach(function(n){dev.noteOff(n);});dev.sustained.clear();}}
      else if(d1===74&&dev.P.cut)dev.P.cut.set(30*Math.pow(16000/30,v));
    }else if(cmd===0xD0){
      var av=Math.max(0,Math.min(1,d1/127));
      if(dev.mod)dev.mod(av*.8);
      if(dev.aftertouch)dev.aftertouch(av);
    }else if(cmd===0xE0&&dev.bend)dev.bend((((d2<<7)|d1)-8192)/8192);});};
MIDI.panel=function(){
  var ins=RS.UI.$('#midiIns');
  ins.innerHTML=RS.S.midiIns.length?'':'<p>No MIDI inputs found. Connect a controller and refresh.</p>';
  RS.S.midiIns.forEach(function(i){var r=RS.UI.el('div','mrow','<label>'+i.name+'</label>');
    var s=RS.UI.el('select',null,'<option value="1">ENABLED</option><option value="0">DISABLED</option>');
    s.value=i.on?'1':'0';s.onchange=function(){i.on=s.value==='1';};
    r.appendChild(s);ins.appendChild(r);});
  var chs=RS.UI.$('#midiChs');chs.innerHTML='';
  RS.S.devices.forEach(function(d){if(d.channel===undefined)return;
    var r=RS.UI.el('div','mrow','<label>'+d.name+'</label>');
    var s=RS.UI.el('select');
    s.innerHTML=['off','omni'].concat(Array.from({length:16},function(_,i){return i+1;}))
      .map(function(v){return'<option value="'+v+'">'+(v==='off'?'OFF':v==='omni'?'OMNI':'CH '+v)+'</option>';}).join('');
    s.value=String(d.channel);
    s.onchange=function(){d.channel=s.value==='omni'?'omni':s.value==='off'?'off':Number(s.value);
      if(d.mchip)d.mchip.innerHTML='<i></i>'+(d.channel==='off'?'MIDI OFF':'CH '+String(d.channel).toUpperCase());};
    r.appendChild(s);chs.appendChild(r);});
  var bsec=RS.UI.$('#midiBind');bsec.innerHTML='';
  var ccs=Object.keys(RS.S.ccBindings);
  if(!ccs.length)bsec.appendChild(RS.UI.el('p',null,'No bindings yet. Right-click a knob or fader, then move an encoder.'));
  ccs.sort(function(a,b){return a-b;}).forEach(function(cc){
    var b=RS.S.ccBindings[cc];
    var r=RS.UI.el('div','mrow','<label><b style="font-family:Share Tech Mono,monospace">CC '+cc+'</b> &rarr; '+b.name+'</label>');
    var x=RS.UI.el('button','mclose','&times;');
    x.onclick=function(){delete RS.S.ccBindings[cc];MIDI.panel();};
    r.appendChild(x);bsec.appendChild(r);});};
MIDI.init=function(){
  if(!navigator.requestMIDIAccess){MIDI.panel();return;}
  navigator.requestMIDIAccess({sysex:false}).then(function(acc){
    var bind=function(){RS.S.midiIns=Array.from(acc.inputs.values()).map(function(i){
      i.onmidimessage=MIDI.onMIDI;return{id:i.id,name:i.name,on:true};});
      MIDI.panel();};
    acc.onstatechange=bind;bind();
    var ml=RS.S.midiIns.find(function(i){return /minilab/i.test(i.name||'');});
    if(ml)RS.UI.toast('Arturia MiniLab detected — pads always play the RD-8. Keys play whichever synth is focused '+
      '(click its panel to focus it). Right-click any knob or fader to MIDI-learn an encoder.',6000);
    else if(RS.S.midiIns.length)RS.UI.toast(RS.S.midiIns.length+' MIDI input(s) detected');
  }).catch(function(){MIDI.panel();RS.UI.toast('MIDI access denied');});};
return MIDI;})();