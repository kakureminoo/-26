import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {cpuCommands,activePawn} from '../src/game/multiplayer.ts';
const dir=mkdtempSync(join(tmpdir(),'hound-network-')),port=18787,root=`http://127.0.0.1:${port}/api/play`;
let child;
async function start(){child=spawn(process.execPath,['--experimental-strip-types','server/index.mjs'],{env:{...process.env,PLAY_PORT:String(port),PLAY_DATA_DIR:dir},stdio:['ignore','ignore','pipe']});let errors='';child.stderr.on('data',d=>errors+=d);for(let i=0;i<80;i++){try{if((await fetch(root+'/health')).ok)return;}catch{}if(child.exitCode!==null)throw Error(errors);await delay(50);}throw Error('Server startup timeout '+errors);}
async function stop(){if(!child||child.exitCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});}
async function api(path,token,body,status=200){const r=await fetch(root+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;}
try{
 await start();const a=await api('/session',null,{name:'A'}),b=await api('/session',null,{name:'B'}),outsider=await api('/session',null,{name:'C'});
 let room=await api('/rooms',a.token,{mode:'duel',party:['dawn','dusk']});await api('/join',b.token,{code:room.code,party:['sol','moon']});await api('/rooms/'+room.code,outsider.token,undefined,404);room=await api('/rooms/'+room.code+'/start',a.token,{});
 await api('/rooms/'+room.code+'/command',b.token,{revision:0,command:{type:'guard'}},409);await api('/rooms/'+room.code+'/command',a.token,{revision:0,command:null},400);
 room=await api('/rooms/'+room.code+'/command',b.token,{revision:0,command:{type:'surrender'}});assert.equal(room.match.winner,0);
 await api('/rooms/'+room.code+'/command',b.token,{revision:0,command:{type:'surrender'}},409);
 assert.equal((await api('/me',a.token)).rating,1012);assert.equal((await api('/me',b.token)).rating,988);
 await stop();await start();assert.equal((await api('/me',a.token)).rating,1012);console.log('PASS: two-client authorization, turns, stale commands, Elo exactly once, restart persistence');
 const crew=[];for(let i=0;i<5;i++)crew.push(await api('/session',null,{name:'Raid '+i}));
 room=await api('/rooms',crew[0].token,{mode:'raid',party:['bulwark']});for(let i=1;i<4;i++)await api('/join',crew[i].token,{code:room.code,party:[i===2?'moon':'bulwark']});await api('/join',crew[4].token,{code:room.code,party:['dawn']},409);
 room=await api('/rooms/'+room.code+'/start',crew[0].token,{});assert.equal(room.match.pawns.length,4);assert.equal(room.match.bossMax,180);
 for(let i=0;i<1200&&room.match.status==='playing';i++){
  const owner=activePawn(room.match).owner,member=crew.find(c=>c.account.id===owner);room=await api('/rooms/'+room.code+'/command',member.token,{revision:room.match.revision,command:cpuCommands(room.match)[0]});
 }
 assert.equal(room.match.status,'won');assert.equal(room.match.winner,0);
 const survivor=room.match.pawns.find(p=>p.hp>0),member=crew.find(c=>c.account.id===survivor.owner),me=await api('/me',member.token);assert.equal(me.rewards.length,1);assert.equal(me.rewards[0].stones,50);assert.equal(me.rewards[0].shards,20);
 await api('/rooms/'+room.code+'/command',member.token,{revision:room.match.revision,command:{type:'guard'}},409);assert.equal((await api('/me',member.token)).rewards.length,1);console.log('PASS: four-client raid, capacity, legal full battle, server rewards exactly once');
}finally{await stop();rmSync(dir,{recursive:true,force:true});}
