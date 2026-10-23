// File-based CC0 music and effects. Credits and original licenses: public/audio/.
const base=import.meta.env.BASE_URL+'audio/';
const musicFiles={home:'home.mp3',battle:'battle.wav',victory:'victory.ogg'};
const samples={departure:'departure',ui:'click_001',invalid:'error_001',stepLight:'footstep_concrete_000',stepShadow:'footstep_carpet_000',swish:'open_001',darkSwish:'close_001',hit:'impactPunch_heavy_000',guard:'impactMetal_light_000',miss:'back_001',castLight:'glass_001',castShadow:'glitch_001',lamp:'pluck_001',beam:'maximize_001',veil:'minimize_001',block:'impactWood_heavy_000',defeat:'impactMining_000',pickup:'confirmation_001',turn:'select_001',victory:'confirmation_004',failure:'error_001',train:'confirmation_001',forge:'impactMetal_light_000'};
export const Sfx=(()=>{
 let ctx,master,effectsGain,musicVoice=null,musicGain=null,currentMusic=null,wantedMusic='home',pendingMusic=null,musicTicket=0,epoch=0,lastStep=-1000,lastError='';
 const buffers=new Map(),voices=new Set(),settings={muted:false,volume:.45,musicVolume:.55,effectsVolume:.8};
 const bounded=(v,fallback)=>Number.isFinite(Number(v))?Math.max(0,Math.min(1,Number(v))):fallback;
 try{const saved=JSON.parse(localStorage.getItem('lightShadowAudio'));if(saved){settings.muted=!!saved.muted;for(const k of ['volume','musicVolume','effectsVolume'])if(saved[k]!=null)settings[k]=bounded(saved[k],settings[k]);}}catch{}
 const persist=()=>{try{localStorage.setItem('lightShadowAudio',JSON.stringify(settings))}catch{}};
 function load(path){
  if(!buffers.has(path))buffers.set(path,fetch(base+path).then(r=>{if(!r.ok)throw Error('Audio '+r.status);return r.arrayBuffer()}).then(data=>ctx.decodeAudioData(data)).catch(()=>{lastError='音源を読み込めませんでした';return null}));
  return buffers.get(path);
 }
 function apply(){if(!ctx)return;master.gain.setTargetAtTime(settings.muted?0:settings.volume,ctx.currentTime,.025);effectsGain.gain.setTargetAtTime(settings.effectsVolume*.7,ctx.currentTime,.025);if(musicGain)musicGain.gain.setTargetAtTime(settings.musicVolume*.55,ctx.currentTime,.15);}
 function stopMusic(){musicTicket++;pendingMusic=null;try{musicVoice?.stop()}catch{}musicVoice=null;musicGain=null;currentMusic=null;}
 function syncMusic(){
  if(pendingMusic&&pendingMusic!==wantedMusic){musicTicket++;pendingMusic=null;}
  if(!ctx||ctx.state!=='running'||document.hidden||currentMusic===wantedMusic||pendingMusic===wantedMusic)return;
  const scene=wantedMusic,ticket=++musicTicket;pendingMusic=scene;
  load('music/'+musicFiles[scene]).then(buffer=>{
   if(ticket!==musicTicket)return;pendingMusic=null;if(!buffer||document.hidden||ctx.state!=='running')return;
   const old=musicVoice,oldGain=musicGain,now=ctx.currentTime;
   if(old&&oldGain){oldGain.gain.cancelScheduledValues(now);oldGain.gain.setValueAtTime(oldGain.gain.value,now);oldGain.gain.linearRampToValueAtTime(0,now+.35);try{old.stop(now+.36)}catch{}}
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(master);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(settings.musicVolume*.55,now+.35);source.onended=()=>{source.disconnect();gain.disconnect()};source.start();musicVoice=source;musicGain=gain;currentMusic=scene;
  });
 }
 function unlock(){
  try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;
   if(!ctx){ctx=new Audio();master=ctx.createGain();effectsGain=ctx.createGain();effectsGain.connect(master);master.connect(ctx.destination);apply();for(const file of new Set(Object.values(samples)))load('sfx/'+file+'.ogg');}
   if(ctx.state==='suspended')ctx.resume().then(syncMusic).catch(()=>{});else syncMusic();return true;
  }catch{return false}
 }
 function play(name,x=7){
  if(settings.muted||settings.volume<=0||settings.effectsVolume<=0||document.hidden||!samples[name])return;
  if(!ctx)unlock();if(!ctx)return;const token=epoch;
  load('sfx/'+samples[name]+'.ogg').then(buffer=>{
   if(!buffer||token!==epoch||settings.muted||document.hidden||ctx.state!=='running'||voices.size>=24)return;
   const source=ctx.createBufferSource();source.buffer=buffer;let out=effectsGain;
   if(ctx.createStereoPanner){out=ctx.createStereoPanner();out.pan.value=Math.max(-.65,Math.min(.65,(x/14-.5)*1.1));out.connect(effectsGain);}
   source.connect(out);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();if(out!==effectsGain)out.disconnect()};source.start();
  });
 }
 function stop(){epoch++;for(const source of voices){try{source.stop()}catch{}}voices.clear()}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();stopMusic()}else if(ctx)unlock()});
 return {unlock,play,stop,music(scene){wantedMusic=Object.hasOwn(musicFiles,scene)?scene:'home';syncMusic()},mute(){settings.muted=!settings.muted;apply();persist();return settings.muted},volume(v){settings.volume=bounded(v,.45);apply();persist()},musicVolume(v){settings.musicVolume=bounded(v,.55);apply();persist()},effectsVolume(v){settings.effectsVolume=bounded(v,.8);apply();persist()},state:()=>({...settings,currentMusic,pendingMusic,loadedFiles:buffers.size,error:lastError}),step(kind,x){const now=performance.now();if(now-lastStep<105)return;lastStep=now;play(kind==='shadow'?'stepShadow':'stepLight',x)},action(type,actor,x){if(type==='move'||type==='enemyMove')return;play(type==='attack'||type==='enemyAttack'?'swish':type==='shadowAttack'?'darkSwish':type==='guard'?'guard':actor==='shadow'?'castShadow':'castLight',x)}};
})();
