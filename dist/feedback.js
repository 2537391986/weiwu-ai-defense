// Presentation only. This module never changes the simulation or consumes its RNG.
export const WEAPON_POSES={
 m4:{barrel:6.4,width:1.05,stance:2.5,recoil:.7,grip:3.1},
 mp5:{barrel:5.2,width:1,stance:2.4,recoil:.45,grip:2.7},
 benelli:{barrel:7.3,width:1.2,stance:2.8,recoil:1.15,grip:3.6},
 m249:{barrel:7.6,width:1.55,stance:3,recoil:.85,grip:3.5,bipod:true,belt:true},
 m110:{barrel:8.3,width:1.1,stance:2.7,recoil:1.05,grip:3.6,scope:true},
 m203:{barrel:6.7,width:1.5,stance:2.7,recoil:1.1,grip:3.1,tube:true},
 m2:{barrel:9.2,width:2.1,stance:3.6,recoil:1.3,grip:3.4,bipod:true,belt:true,fixed:true}
};
export function reloadPose(s,weapon,reloadRate=1){
 const total=weapon.reload/reloadRate,progress=Math.max(0,Math.min(1,1-Math.max(0,s.reload)/total)),stage=Math.min(2,Math.floor(progress*3));
 return {progress,stage,label:(weapon.belt?['开盖','装链','合盖']:s.weapon==='benelli'?['取弹','装填','复位']:['取匣','换匣','复位'])[stage],reach:Math.sin(progress*Math.PI)};
}
export class CombatFeedback{
 constructor(){this.game=null;this.units=new Map();this.seen=new WeakSet();}
 reset(game){this.game=game;this.waveKey=game.nodeIndex+':'+game.wave;this.units=new Map(game.soldiers.map(s=>[s.id,{shots:s.shots,reload:s.reload}]));this.seen=new WeakSet(game.effects);}
 collect(game){
  if(this.game!==game||this.waveKey!==game.nodeIndex+':'+game.wave){this.reset(game);return [];}
  const cues=[];
  for(const s of game.soldiers){const prev=this.units.get(s.id);if(prev&&s.hp>0){if(s.shots>prev.shots)cues.push({type:'shot',weapon:s.weapon,id:s.id,shot:s.shots,x:s.x,y:s.y,angle:s.facing||0});if(s.reload>0&&prev.reload<=0)cues.push({type:'reload',weapon:s.weapon,id:s.id,x:s.x,y:s.y});if(s.reload<=0&&prev.reload>0)cues.push({type:'ready',weapon:s.weapon,id:s.id,x:s.x,y:s.y});}this.units.set(s.id,{shots:s.shots,reload:s.reload});}
  for(const e of game.effects){if(this.seen.has(e))continue;this.seen.add(e);if(e.type==='blast'||e.type==='impact'&&e.color==='#d2a2ef')cues.push({type:e.type,x:e.x,y:e.y});}
  return cues;
 }
}
const TIMBRES={m4:[.075,1900,110,.5],mp5:[.055,2600,150,.35],benelli:[.19,1050,75,.8],m249:[.09,1500,100,.55],m110:[.15,2200,90,.7],m203:[.18,500,65,.75],m2:[.17,850,55,.85]};
export class BattleAudio{
 constructor({contextFactory=()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;return C?new C():null;}}={}){this.factory=contextFactory;this.context=null;this.enabled=false;this.active=false;this.voices=new Set();this.last=new Map();this.tokens=8;this.tokenAt=0;this.error=false;}
 async unlock(){
  if(!this.enabled)return false;
  try{
   if(!this.context){const c=this.factory();if(!c)throw new Error('Audio unavailable');this.context=c;this.master=c.createGain();this.master.gain.value=0;this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-18;this.limiter.knee.value=12;this.limiter.ratio.value=8;this.limiter.attack.value=.003;this.limiter.release.value=.12;this.master.connect(this.limiter);this.limiter.connect(c.destination);
    this.noise=c.createBuffer(1,Math.floor(c.sampleRate*.45),c.sampleRate);const data=this.noise.getChannelData(0);let seed=70;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
   }
   if(this.context.state!=='running')await this.context.resume();
   this.error=this.context.state!=='running';this.setActive(this.active);return !this.error&&this.enabled;
  }catch{this.error=true;return false;}
 }
 setEnabled(value){this.enabled=!!value;if(!this.enabled){this.stop();this.context?.suspend().catch(()=>{});}}
 setActive(value){const next=!!value;this.active=next;if(!next||!this.enabled||this.context?.state!=='running'){this.stop();return;}if(this.master)this.master.gain.setTargetAtTime(.22,this.context.currentTime,.015);}
 stop(){if(this.master){this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setValueAtTime(0,this.context.currentTime);}for(const v of [...this.voices]){for(const n of v.nodes){try{n.stop?.();n.disconnect();}catch{}}this.voices.delete(v);}this.last.clear();this.tokens=8;this.tokenAt=this.context?.currentTime||0;}
 sleep(){this.active=false;this.stop();this.context?.suspend().catch(()=>{});}
 playBatch(cues,view={x:200,y:205}){
  const c=this.context;if(!this.enabled||!this.active||!c||c.state!=='running')return [];
  const now=c.currentTime;this.tokens=Math.min(8,this.tokens+Math.max(0,now-this.tokenAt)*32);this.tokenAt=now;
  const priority={blast:5,shot:4,ready:2,reload:2,impact:1},played=[],groups=new Set();
  for(const cue of [...cues].sort((a,b)=>(priority[b.type]||0)-(priority[a.type]||0))){
   const key=cue.type==='shot'?'shot-'+cue.weapon:cue.type;
   if(groups.has(key)||played.length>=4||this.voices.size>=10||this.tokens<1||now-(this.last.get(key)??-99)<(cue.type==='shot'?.04:cue.type==='impact'?.09:.1))continue;
   if(!priority[cue.type])continue;groups.add(key);this.tokens--;this.last.set(key,now);
   const pan=Math.max(-.7,Math.min(.7,((cue.x??200)-view.x)/160)),distance=Math.hypot((cue.x??200)-view.x,(cue.y??205)-view.y),gain=Math.max(.35,1-distance/400);
   try{this.voice(cue,pan,gain);played.push(cue);}catch{this.error=true;this.stop();break;}
  }
  return played;
 }
 voice(cue,pan,attenuation){
  const c=this.context,shot=cue.type==='shot',blast=cue.type==='blast',mechanic=cue.type==='reload'||cue.type==='ready',profile=TIMBRES[cue.weapon]||TIMBRES.m4;
  const duration=blast?.34:shot?profile[0]:mechanic?.055:.025,frequency=blast?280:shot?profile[1]:mechanic?3200:2300,body=blast?45:shot?profile[2]:mechanic?420:850;
  const src=c.createBufferSource(),filter=c.createBiquadFilter(),env=c.createGain(),tone=c.createOscillator(),toneGain=c.createGain(),nodes=[src,filter,env,tone,toneGain],now=c.currentTime;
  src.buffer=this.noise;filter.type=mechanic?'highpass':'lowpass';filter.frequency.value=frequency;src.connect(filter);filter.connect(env);tone.type=mechanic?'triangle':'sine';tone.frequency.setValueAtTime(body,now);tone.frequency.exponentialRampToValueAtTime(Math.max(25,body*.45),now+duration);tone.connect(toneGain);
  const peak=(blast?.32:shot?.18:mechanic?.07:.055)*attenuation;
  env.gain.setValueAtTime(.0001,now);env.gain.linearRampToValueAtTime(peak,now+.002);env.gain.exponentialRampToValueAtTime(.0001,now+duration);
  toneGain.gain.setValueAtTime(peak*(shot?profile[3]:.45),now);toneGain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan;env.connect(p);toneGain.connect(p);p.connect(this.master);nodes.push(p);}else{env.connect(this.master);toneGain.connect(this.master);}
  const voice={nodes};this.voices.add(voice);let ended=0;const cleanup=()=>{if(++ended<2)return;for(const n of nodes){try{n.disconnect();}catch{}}this.voices.delete(voice);};src.onended=cleanup;tone.onended=cleanup;
  src.start(now);tone.start(now);src.stop(now+duration+.01);tone.stop(now+duration+.01);
 }
}
