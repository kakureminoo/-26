import {rallyStrength} from './hound-traits.ts';
import {assessPlan,type EnemyPlan} from './tactics.ts';
import {wideAttackInfo} from './wide-attacks.ts';
import {houndByID,houndBonus} from './roster.ts';
export type DuelMode='duel'|'raid';
export interface Pawn {id:string;owner:string;hound:string;team:number;x:number;y:number;hp:number;max:number;guard:boolean;killBonus?:number;rally?:{attack:number;armor:number;until:number}}
export interface Match {id:string;mode:DuelMode;revision:number;round:number;pawns:Pawn[];turn:number;moved:boolean;field:number[][];status:'playing'|'won'|'draw';winner?:number;log:string[];bossHP:number;bossMax:number;forecast:{x:number;y:number}[];deadline:number;energy:number[];orderLocked:Record<string,boolean>}
export type MatchCommand={type:'order';pawn:string}|{type:'move';x:number;y:number}|{type:'attack';target:string}|{type:'guard'|'pass'|'pulse'|'special'|'surrender'};
export const arenaSize=7,normalizedLevel=5;
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const inBoard=(x:number,y:number)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<arenaSize&&y<arenaSize;
export function pawnStats(p:Pawn,field:readonly number[][]){const light=field[p.y]?.[p.x]??0,b=houndBonus(p.hound,light),kind=houndByID(p.hound)?.kind;return {attack:6+b.attack+(p.killBonus??0)+(p.rally?.attack??0)+(kind==='light'&&light>=3||kind==='shadow'&&light<=1?1:0),armor:Math.max(0,b.armor)+(p.rally?.armor??0)+(p.guard?3:0),move:(kind==='shadow'?5:4)+b.move};}
export function activePawn(s:Match){return s.pawns[s.turn];}
function raidForecast(round:number){const row=(round*2+1)%7;return Array.from({length:7},(_,x)=>({x,y:row}));}
export function createMatch(id:string,mode:DuelMode,players:{id:string;party:string[]}[],now=Date.now()):Match{
 const field=Array.from({length:7},(_,y)=>Array.from({length:7},(_,x)=>Math.max(0,4-Math.floor(Math.min(Math.hypot(x-1,y-1),Math.hypot(x-5,y-5))))));
 const pawns:Pawn[]=[];
 if(mode==='duel'){
  for(let i=0;i<2;i++)for(let team=0;team<2;team++){const hound=players[team].party[i],b=houndBonus(hound,2);pawns.push({id:`${team}-${i}`,owner:players[team].id,hound,team,x:team===0?1:5,y:i===0?2:4,hp:28+b.hp,max:28+b.hp,guard:false});}
 }else players.forEach((p,i)=>{const hound=p.party[0],b=houndBonus(hound,2);pawns.push({id:`raid-${i}`,owner:p.id,hound,team:0,x:i<2?1:2,y:1+i,hp:32+b.hp,max:32+b.hp,guard:false});});
 const bossMax=players.length*45;
 return {id,mode,revision:0,round:1,pawns,turn:0,moved:false,field,status:'playing',log:['戦闘開始 · 育成値と装備補正は統一'],bossHP:bossMax,bossMax,forecast:mode==='raid'?raidForecast(1):[],deadline:now+45000,energy:[3,3],orderLocked:{}};
}
function raidPlan(s:Match):EnemyPlan{return {enemyId:-1,origin:{x:5,y:3},type:s.round%2?'nightfall':'solarFlare',cells:s.forecast,damage:11};}
export function raidProtection(s:Match){return wideAttackInfo(raidPlan(s).type)!.protection.replace('封印陣 または ','');}
export function raidDangerCells(s:Match){return s.mode==='raid'?assessPlan(raidPlan(s),{id:-1,x:5,y:3,hp:s.bossHP},s.field,[]).cells:[];}
export function reachableCells(s:Match,p=activePawn(s)){
 if(!p||p.hp<=0)return [];const budget=pawnStats(p,s.field).move,cost=new Map([[p.x+','+p.y,0]]),queue=[{x:p.x,y:p.y,cost:0}];
 for(let i=0;i<queue.length;i++){const a=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const x=a.x+dx,y=a.y+dy,key=x+','+y;if(!inBoard(x,y)||s.pawns.some(v=>v.id!==p.id&&v.hp>0&&v.x===x&&v.y===y)||s.mode==='raid'&&x===5&&y===3)continue;
  const v=s.field[y][x],kind=houndByID(p.hound)?.kind;if(kind==='shadow'&&v===4)continue;const next=a.cost+(kind==='shadow'?(v===0?1:v===1?2:3):1);if(next>budget||next>=(cost.get(key)??Infinity))continue;cost.set(key,next);queue.push({x,y,cost:next});
 }}return [...cost].map(([key,cost])=>{const [x,y]=key.split(',').map(Number);return {x,y,cost};});
}
function log(s:Match,text:string){s.log.unshift(text);s.log=s.log.slice(0,16);}
function damage(p:Pawn,n:number,s:Match){p.hp=Math.max(0,p.hp-Math.max(1,n-pawnStats(p,s.field).armor));}
function finish(s:Match){
 if(s.mode==='raid'){if(s.bossHP<=0){s.status='won';s.winner=0;}else if(s.pawns.every(p=>p.hp<=0)){s.status='won';s.winner=1;}}
 else for(const team of [0,1])if(s.pawns.filter(p=>p.team===team).every(p=>p.hp<=0)){s.status='won';s.winner=1-team;}
 if(s.status==='playing'&&s.round>60)s.status='draw';
}
function next(s:Match,now:number){
 finish(s);if(s.status!=='playing')return;
 let next=s.turn+1;
 while(next<s.pawns.length&&s.pawns[next].hp<=0)next++;
 if(next>=s.pawns.length){
  if(s.mode==='raid'){
   const danger=raidDangerCells(s);for(const p of s.pawns.filter(p=>p.hp>0))if(danger.some(c=>c.x===p.x&&c.y===p.y))damage(p,11,s);
   log(s,'レイド主が予告した列を攻撃。'+raidProtection(s)+'で防御。');
  }
  s.round++;for(const pawn of s.pawns)if(pawn.rally&&pawn.rally.until<s.round)delete pawn.rally;s.orderLocked={};s.energy=s.energy.map(e=>Math.min(3,e+1));s.forecast=s.mode==='raid'?raidForecast(s.round):[];next=0;
 }
 finish(s);if(s.status!=='playing')return;
 for(let i=0;i<s.pawns.length&&s.pawns[next].hp<=0;i++)next=(next+1)%s.pawns.length;
 s.turn=next;s.pawns[next].guard=false;s.moved=false;s.deadline=now+45000;
}
/** Authoritative transition shared by server and local CPU matches. Invalid commands never mutate state. */
export function applyMatchCommand(s:Match,owner:string,c:MatchCommand,now=Date.now()):{ok:boolean;error?:string}{
 if(s.status!=='playing')return {ok:false,error:'戦闘は終了しています'};
 if(c.type==='surrender'){
  const team=s.pawns.find(p=>p.owner===owner)?.team;if(team===undefined)return {ok:false,error:'参加者ではありません'};
  for(const p of s.pawns.filter(p=>p.owner===owner))p.hp=0;s.revision++;log(s,'参加者が撤退した。');if(s.mode==='duel'){s.status='won';s.winner=1-team;}else {finish(s);if(activePawn(s).hp<=0)next(s,now);}return {ok:true};
 }
 const p=activePawn(s);if(p.owner!==owner)return {ok:false,error:'相手の手番です'};
 const h=houndByID(p.hound)!;
 if(c.type==='order'){
  if(s.mode!=='duel'||s.moved||s.orderLocked[owner])return {ok:false,error:'行動順はラウンド最初の行動前に選んでください'};
  const index=s.pawns.findIndex(v=>v.id===c.pawn&&v.owner===owner&&v.hp>0);if(index<s.turn)return {ok:false,error:'この猟犬は選べません'};
  [s.pawns[s.turn],s.pawns[index]]=[s.pawns[index],s.pawns[s.turn]];s.revision++;return {ok:true};
 }
 if(c.type==='move'){
  if(s.moved)return {ok:false,error:'移動済みです'};const target=reachableCells(s,p).find(v=>v.x===c.x&&v.y===c.y);if(!target)return {ok:false,error:'移動できません'};if(c.x===p.x&&c.y===p.y)return {ok:true};p.x=c.x;p.y=c.y;s.moved=true;s.orderLocked[owner]=true;s.revision++;return {ok:true};
 }
 const livingEnemies=s.pawns.filter(t=>t.hp>0&&t.team!==p.team),oldBoss=s.bossHP;
 if(c.type==='attack'){
  if(c.target==='boss'&&s.mode==='raid'){
   if(distance(p,{x:5,y:3})>3)return {ok:false,error:'ボスは射程3の外です'};s.bossHP=Math.max(0,s.bossHP-pawnStats(p,s.field).attack);log(s,h.name+'がレイド主を攻撃。');
  }else {const target=s.pawns.find(t=>t.id===c.target&&t.hp>0&&t.team!==p.team);if(!target||distance(p,target)>1)return {ok:false,error:'隣接する敵を選んでください'};damage(target,pawnStats(p,s.field).attack,s);log(s,h.name+'が攻撃。');}
 }else if(c.type==='pulse'){
  for(let y=0;y<7;y++)for(let x=0;x<7;x++)if(distance(p,{x,y})<=1)s.field[y][x]=h.kind==='light'?4:0;log(s,h.name+'が周囲の明暗を変えた。');
 }else if(c.type==='special'){
  if(s.energy[p.team]<2)return {ok:false,error:'チャージが足りません'};
  if(h.id==='herald'){for(const ally of s.pawns.filter(t=>t.hp>0&&t.team===p.team))ally.rally={...rallyStrength(),until:s.round+1};log(s,'誓灯の咆哮：味方の攻撃+2・防御+1。');}
  else if(['bulwark','frost'].includes(h.id)){for(const a of s.pawns.filter(a=>a.team===p.team&&a.hp>0&&distance(a,p)<=3)){a.hp=Math.min(a.max,a.hp+5);a.guard=true;}log(s,'守護の咆哮：近くの仲間を回復・防御。');}
  else {const targets=s.pawns.filter(t=>t.hp>0&&t.team!==p.team&&(t.x===p.x||t.y===p.y)&&distance(t,p)<=4);const boss=s.mode==='raid'&&(p.x===5||p.y===3)&&distance(p,{x:5,y:3})<=4;if(!targets.length&&!boss)return {ok:false,error:'同じ行・列の射程4以内に対象が必要です'};for(const t of targets)damage(t,pawnStats(p,s.field).attack+3,s);if(boss)s.bossHP=Math.max(0,s.bossHP-pawnStats(p,s.field).attack-3);log(s,'貫通の牙：直線の対象へ強攻撃。');}s.energy[p.team]-=2;
 }else if(c.type==='guard'){p.guard=true;log(s,h.name+'が防御。');}else if(c.type!=='pass')return {ok:false,error:'不明な操作です'};
 if(p.hound==='reaper'){const kills=livingEnemies.filter(t=>t.hp<=0).length+(s.mode==='raid'&&oldBoss>0&&s.bossHP<=0?1:0);if(kills){p.killBonus=(p.killBonus??0)+kills;log(s,'追猟：攻撃 +'+p.killBonus);}}
 s.orderLocked[owner]=true;s.revision++;next(s,now);return {ok:true};
}
export function cpuCommands(s:Match):MatchCommand[]{
 const p=activePawn(s);
 if(s.mode==='raid'){
  const boss={x:5,y:3},danger=(c:{x:number;y:number})=>raidDangerCells(s).some(v=>v.x===c.x&&v.y===c.y);
  if(!s.moved){const cells=reachableCells(s,p).sort((a,b)=>(Number(danger(a))*100+Math.max(0,distance(a,boss)-3)*10+a.cost)-(Number(danger(b))*100+Math.max(0,distance(b,boss)-3)*10+b.cost)),best=cells[0];if(best&&(best.x!==p.x||best.y!==p.y))return [{type:'move',x:best.x,y:best.y}];}
  if(p.hound==='herald'&&!p.rally&&s.energy[0]>=2)return [{type:'special'}];
  if(['bulwark','frost'].includes(p.hound)&&p.hp<p.max-4&&s.energy[0]>=2)return [{type:'special'}];
  return [distance(p,boss)<=3?{type:'attack',target:'boss'}:{type:'guard'}];
 }
 const targets=s.pawns.filter(t=>t.team!==p.team&&t.hp>0);if(!targets.length)return [{type:'guard'}];
 if(!s.moved){const cells=reachableCells(s,p).sort((a,b)=>Math.min(...targets.map(t=>distance(a,t)))-Math.min(...targets.map(t=>distance(b,t)))||a.cost-b.cost),best=cells[0];if(best&&(best.x!==p.x||best.y!==p.y))return [{type:'move',x:best.x,y:best.y}];}
 if(p.hound==='herald'&&!p.rally&&s.energy[p.team]>=2)return [{type:'special'}];
 const t=targets.find(t=>distance(t,p)<=1);return [t?{type:'attack',target:t.id}:{type:'guard'}];
}
export function eloRatings(a:number,b:number,result:number){const change=Math.round(24*(result-1/(1+10**((b-a)/400))));return [a+change,b-change];}
