import http from 'node:http';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import {createMatch,applyMatchCommand,activePawn,eloRatings} from '../src/game/multiplayer.ts';
import {houndByID} from '../src/game/roster.ts';
const port=Number(process.env.PLAY_PORT||8787),dir=resolve(process.env.PLAY_DATA_DIR||'server/data');mkdirSync(dir,{recursive:true});const file=resolve(dir,'accounts.json');
let accounts={};try{accounts=JSON.parse(readFileSync(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const rooms=new Map(),allowed=new Set((process.env.PLAY_ORIGINS||'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173').split(','));
function persist(){writeFileSync(file+'.tmp',JSON.stringify(accounts));renameSync(file+'.tmp',file);}
function fail(status,message){throw Object.assign(new Error(message),{status});}
function account(req){const token=req.headers.authorization?.replace(/^Bearer /,'');const a=accounts[token];if(!a)fail(401,'ログインし直してください');return a;}
function party(value,mode){if(!Array.isArray(value)||value.length!==(mode==='duel'?2:1)||value.some(v=>typeof v!=='string'||!houndByID(v))||new Set(value).size!==value.length)fail(400,'編成が不正です');return value;}
function cleanName(v){return String(v||'旅人').replace(/[\x00-\x1f<>]/g,'').slice(0,20)||'旅人';}
function participating(a,r){return r.players.some(p=>p.id===a.id)&&(!r.match||r.match.status==='playing'&&!r.players.find(p=>p.id===a.id)?.left);}
function publicAccount(a){return {roomCode:[...rooms.values()].find(r=>participating(a,r))?.code,id:a.id,name:a.name,rating:a.rating,wins:a.wins,losses:a.losses,rewards:a.rewards};}
function snapshot(r){return {code:r.code,mode:r.mode,host:r.host,players:r.players.map(p=>({id:p.id,name:p.name,party:p.party,ready:p.ready})),match:r.match||null};}
function roomFor(a,code){const r=rooms.get(String(code).toUpperCase());if(!r||!r.players.some(p=>p.id===a.id))fail(404,'参加中の部屋がありません');return r;}
function settle(r){
 const s=r.match;if(!s||s.status==='playing'||r.settled)return;r.settled=true;
 const members=r.players.map(p=>Object.values(accounts).find(a=>a.id===p.id)).filter(Boolean);
 if(r.mode==='duel'&&members.length===2){const result=s.status==='draw'?.5:s.winner===0?1:0,ratings=eloRatings(members[0].rating,members[1].rating,result);members.forEach((a,i)=>{a.rating=ratings[i];if(result!==.5){if((i===0)===(result===1))a.wins++;else a.losses++;}});}
 if(r.mode==='raid'&&s.winner===0)for(const a of members)if(!r.players.find(p=>p.id===a.id)?.left)a.rewards.push({id:s.id,stones:50,shards:20,raid:true});
 persist();
}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>8192)fail(413,'送信内容が大きすぎます');}try{return text?JSON.parse(text):{};}catch{fail(400,'JSONが不正です');}}
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin;if(origin&&!allowed.has(origin)){res.writeHead(403);res.end('Origin denied');return;}if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Cache-Control','no-store');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 try{
  const url=new URL(req.url,'http://localhost'),path=url.pathname.replace(/^\/api\/play/,'');let result;
  if(path==='/health'){result={ok:true};}
  else if(path==='/session'&&req.method==='POST'){
   const b=await body(req),token=req.headers.authorization?.replace(/^Bearer /,'');let a=accounts[token],key=token;
   if(!a){if(Object.keys(accounts).length>=10000)fail(503,'登録上限です');key=randomBytes(32).toString('hex');a=accounts[key]={id:randomUUID(),name:cleanName(b.name),rating:1000,wins:0,losses:0,rewards:[]};}else a.name=cleanName(b.name||a.name);persist();result={token:key,account:publicAccount(a)};
  }else{
   const a=account(req);
   if(path==='/me'&&req.method==='GET')result=publicAccount(a);
   else if(path==='/rooms'&&req.method==='POST'){
    const b=await body(req),mode=b.mode;if(!['duel','raid'].includes(mode))fail(400,'形式を選択してください');
    const existing=[...rooms.values()].find(r=>participating(a,r));if(existing)fail(409,'参加中の部屋から退出してください');
    if(rooms.size>=256)fail(503,'部屋の上限です');let r=b.queue&&mode==='duel'?[...rooms.values()].find(r=>r.mode==='duel'&&r.queue&&!r.match&&r.players.length===1):undefined;
    const member={id:a.id,name:a.name,party:party(b.party,mode),ready:true};
    if(r)r.players.push(member);else{let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));r={code,mode,host:a.id,players:[member],queue:!!b.queue,created:Date.now()};rooms.set(code,r);}if(b.queue&&r.players.length===2)r.match=createMatch(randomUUID(),mode,r.players);result=snapshot(r);
   }else if(path==='/join'&&req.method==='POST'){
    const b=await body(req),r=rooms.get(String(b.code).toUpperCase());if(!r)fail(404,'部屋が見つかりません');if(r.match)fail(409,'開始済みです');if(r.players.length>=(r.mode==='raid'?4:2))fail(409,'満員です');if([...rooms.values()].some(v=>participating(a,v)))fail(409,'参加中の部屋から退出してください');r.players.push({id:a.id,name:a.name,party:party(b.party,r.mode),ready:true});result=snapshot(r);
   }else if(path.startsWith('/rooms/')){
    const [, ,code,action]=path.split('/'),r=roomFor(a,code);
    if(req.method==='GET')result=snapshot(r);
    else if(action==='start'&&req.method==='POST'){
     if(r.host!==a.id)fail(403,'部屋主が開始してください');if(r.match)fail(409,'開始済みです');if(r.mode==='duel'&&r.players.length!==2)fail(409,'二人必要です');r.match=createMatch(randomUUID(),r.mode,r.players);result=snapshot(r);
    }else if(action==='command'&&req.method==='POST'){
     const b=await body(req);if(!r.match)fail(409,'開始前です');if(b.revision!==r.match.revision)fail(409,'状態を更新してから操作してください');if(!b.command||typeof b.command.type!=='string')fail(400,'操作が不正です');const applied=applyMatchCommand(r.match,a.id,b.command);if(applied.ok&&b.command.type==='surrender')r.players.find(p=>p.id===a.id).left=true;if(!applied.ok)fail(409,applied.error);settle(r);result=snapshot(r);
    }else if(action==='leave'&&req.method==='POST'){
     if(r.match?.status==='playing'){r.players.find(p=>p.id===a.id).left=true;applyMatchCommand(r.match,a.id,{type:'surrender'});settle(r);}else if(!r.match){r.players=r.players.filter(p=>p.id!==a.id);r.host=r.players[0]?.id;}if(!r.players.length)rooms.delete(r.code);result={ok:true};
    }else fail(404,'操作がありません');
   }else fail(404,'APIがありません');
  }
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(result));
 }catch(error){res.writeHead(error.status||500,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:error.status?error.message:'サーバー処理に失敗しました'}));if(!error.status)console.error(error);}
});
const timer=setInterval(()=>{
 const now=Date.now();for(const r of rooms.values()){
  if(r.match?.status==='playing'&&now>=r.match.deadline){applyMatchCommand(r.match,activePawn(r.match).owner,{type:'guard'},now);settle(r);}
  if(now-r.created>6*3600000){if(r.match?.status==='playing'){r.match.status='draw';settle(r);}rooms.delete(r.code);}
 }
},1000);timer.unref();
server.listen(port,process.env.PLAY_HOST||'127.0.0.1',()=>console.log(`Multiplayer server: http://${process.env.PLAY_HOST||'127.0.0.1'}:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{clearInterval(timer);server.close(()=>process.exit(0));});
