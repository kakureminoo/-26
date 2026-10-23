import {terrainSight,terrainStep,type Terrain} from './terrain.ts';
import {identityName,type EnemyIdentity} from './enemy-identity.ts';
import {wideAttackArea,wideAttackInfo,wideAttackProtected} from './wide-attacks.ts';
import { enemyNextStep, type Cell } from './pathfinding.ts';
export type EnemyKind = 'sentinel'|'shadeGuard'|'sunArcher'|'binder'|'warper'|'illusionist'|'decoy'|'lightWarden'|'shadowWeaver'|'displacer'|'eclipseLord';
export interface TacticalEnemy extends Cell, EnemyIdentity { id:number; hp:number; boss?:boolean; kind?:EnemyKind;nextLightRound?:number;nextDisplaceRound?:number;damage?:number }
export interface TacticalDog extends Cell { hp:number; incapacitated?:boolean }
export interface EnemyPlan {
 readonly enemyId:number; readonly origin:Cell; readonly type:'attack'|'ray'|'move'|'wait'|'bind'|'warp'|'summon'|'illuminate'|'darken'|'displace'|'nightfall'|'solarFlare';
 readonly cells:readonly Cell[]; readonly damage:number; readonly destination?:Cell; readonly refuges?:readonly Cell[];
}
const distance=(a:Cell,b:Cell)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const key=(p:Cell)=>p.x+','+p.y;
export const enemyName=(e:TacticalEnemy)=>identityName(e)??(e.boss?'影喰らい':e.kind==='displacer'?'転位師':e.kind==='lightWarden'?'灯術師':e.kind==='shadowWeaver'?'影織り師':e.kind==='binder'?'縛影師':e.kind==='warper'?'跳影獣':e.kind==='illusionist'?'幻灯師':e.kind==='decoy'?'幻影の囮':e.kind==='shadeGuard'?'影鎧兵':e.kind==='sunArcher'?'灯射兵':'砦の番兵');
export const enemyArmor=(enemy:TacticalEnemy,brightness:number)=>enemy.kind==='shadeGuard'&&brightness<=1?2:0;
export const attackDamage=(attack:number,enemy:TacticalEnemy,brightness:number)=>Math.max(0,attack-enemyArmor(enemy,brightness));
export function rayCells(origin:Cell,target:Cell,width:number,height:number):Cell[]{
 if(origin.x!==target.x&&origin.y!==target.y ||distance(origin,target)===0)return [];
 const dx=Math.sign(target.x-origin.x),dy=Math.sign(target.y-origin.y),cells:Cell[]=[];
 for(let i=1;i<=4;i++){const p={x:origin.x+dx*i,y:origin.y+dy*i};if(p.x<0||p.y<0||p.x>=width||p.y>=height)break;cells.push(p);}
 return cells;
}
function visibleRay(origin:Cell,target:Cell,blocks:readonly Cell[],width:number,height:number):Cell[]{
 const cells=rayCells(origin,target,width,height),result:Cell[]=[];
 for(const cell of cells){if(blocks.some(b=>b.x===cell.x&&b.y===cell.y))break;result.push(cell);}
 return result;
}
/** Plans copy positions at round start. They are never retargeted after player actions. */
export function planEnemies(enemies:readonly TacticalEnemy[],dogs:readonly TacticalDog[],field:readonly number[][],blocks:readonly Cell[],width:number,height:number,round=1,walkable:(x:number,y:number)=>boolean=()=>true,terrain?:Terrain):EnemyPlan[]{
 const alive=dogs.filter(d=>d.hp>0),occupied=new Set([...enemies.filter(e=>e.hp>0),...alive,...blocks].map(key));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!walkable(x,y))occupied.add(x+','+y);
 return enemies.filter(e=>e.hp>0).map(enemy=>{
   const targets=[...alive].sort((a,b)=>distance(enemy,a)-distance(enemy,b)),origin={x:enemy.x,y:enemy.y},damage=enemy.damage??(enemy.boss?3:2);
   const create=(type:EnemyPlan['type'],cells:Cell[]=[],destination?:Cell):EnemyPlan=>Object.freeze({enemyId:enemy.id,origin:Object.freeze(origin),type,cells:Object.freeze(cells.map(c=>Object.freeze({...c}))),damage:type==='illuminate'||type==='darken'||type==='displace'?0:damage,destination:destination?Object.freeze({...destination}):undefined});
   if(!targets.length||enemy.kind==='decoy')return create('wait');
   if(enemy.kind==='eclipseLord'&&round%2===1){
    const area=wideAttackArea(width,height,walkable,blocks),type=enemy.species==='devourer'?(enemy.affinity==='light'?'solarFlare':'nightfall'):round%4===1?'nightfall':'solarFlare';
    return Object.freeze({...create(type,area.cells),refuges:Object.freeze(area.refuges.map(p=>Object.freeze({...p})))});
   }
   if((enemy.kind==='lightWarden'||enemy.kind==='shadowWeaver')&&(enemy.nextLightRound??0)<=round){
     const light=enemy.kind==='lightWarden';
     const target=targets.find(t=>distance(enemy,t)<=4&&(light?field[t.y][t.x]<3:field[t.y][t.x]>1));
     if(target){const cells:Cell[]=[];for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const p={x:target.x+dx,y:target.y+dy};if(p.x>=0&&p.y>=0&&p.x<width&&p.y<height&&walkable(p.x,p.y))cells.push(p);}return create(light?'illuminate':'darken',cells);}
   }
   if(enemy.kind==='displacer'&&(enemy.nextDisplaceRound??0)<=round){
     const target=targets.find(t=>distance(enemy,t)<=4);
     if(target){const partner=alive.find(d=>d!==target)??enemy,options:Cell[]=[];
       for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(walkable(x,y)&&!occupied.has(x+','+y)&&field[y][x]<4&&distance(target,{x,y})>0&&distance(target,{x,y})<=3)options.push({x,y});
       options.sort((a,b)=>distance(b,partner)-distance(a,partner)||distance(b,target)-distance(a,target)||a.y-b.y||a.x-b.x);
       if(options[0]){occupied.add(key(options[0]));return create('displace',[{x:target.x,y:target.y}],options[0]);}
     }
   }
   if(enemy.kind==='binder'){
     const t=targets.find(t=>!t.incapacitated&&distance(enemy,t)<=3&&visibleRay(enemy,t,blocks,width,height).filter(p=>terrainSight(terrain,enemy,p)).some(p=>p.x===t.x&&p.y===t.y));
     if(t)return create('bind',[{x:t.x,y:t.y}]);
   }
   if(enemy.kind==='warper'||enemy.kind==='illusionist'){
     const options:Cell[]=[];
     for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!occupied.has(x+','+y)&&distance(enemy,{x,y})<=3&&distance(enemy,{x,y})>0)options.push({x,y});
     options.sort((a,b)=>distance(a,targets[0])-distance(b,targets[0])||a.y-b.y||a.x-b.x);
     const destination=options[0];
     if(destination&&(enemy.kind==='illusionist'?!enemies.some(e=>e.hp>0&&e.kind==='decoy'):distance(enemy,targets[0])>1)){
       if(enemy.kind==='warper')occupied.delete(key(enemy));occupied.add(key(destination));
       return create(enemy.kind==='warper'?'warp':'summon',[],destination);
     }
   }
   if(enemy.kind==='sunArcher'){
     if((field[enemy.y]?.[enemy.x]??0)>=3){
       const target=targets.find(t=>visibleRay(enemy,t,blocks,width,height).filter(p=>terrainSight(terrain,enemy,p)).some(p=>p.x===t.x&&p.y===t.y));
       if(target)return create('ray',rayCells(enemy,target,width,height));
     }
   }else{
     const target=targets.find(t=>distance(enemy,t)===1);
     if(target)return create('attack',[{x:target.x,y:target.y}]);
   }
   const destination=enemyNextStep(enemy,targets[0],width,height,(x,y)=>occupied.has(x+','+y),(from,to)=>Number.isFinite(terrainStep(terrain,from,to)));
   if(!destination)return create('wait');
   occupied.delete(key(enemy));occupied.add(key(destination));
   return create('move',[],destination);
 });
}
export interface PlanAssessment { status:'ready'|'dark'|'blocked'|'defeated'|'wait'; cells:Cell[] }
/** The same assessment drives the preview and the actual impact. */
export function assessPlan(plan:EnemyPlan,enemy:TacticalEnemy,field:readonly number[][],blocks:readonly Cell[],occupied?:((x:number,y:number)=>boolean),terrain?:Terrain):PlanAssessment{
 if(enemy.hp<=0)return {status:'defeated',cells:[]};
 const blocked=(p:Cell)=>blocks.some(b=>b.x===p.x&&b.y===p.y);
 if(wideAttackInfo(plan.type)){const cells=plan.cells.filter(p=>!blocked(p)&&!wideAttackProtected(plan,p,field)).map(p=>({...p}));return {status:'ready',cells};}
 if(plan.type==='wait')return {status:'wait',cells:[]};
 if(plan.type==='displace'){
  const p=plan.destination;
  if(!p||blocked(p)||occupied?.(p.x,p.y))return {status:'blocked',cells:[]};
  if((field[p.y]?.[p.x]??4)>=4)return {status:'blocked',cells:[]};
  return {status:'ready',cells:plan.cells.filter(p=>!blocked(p)).map(p=>({...p}))};
 }
 if(['move','warp','summon'].includes(plan.type))return {status:plan.destination&&(blocked(plan.destination)||occupied?.(plan.destination.x,plan.destination.y))?'blocked':'ready',cells:[]};
 if(plan.type==='ray'&&(field[enemy.y]?.[enemy.x]??0)<3)return {status:'dark',cells:[]};
 if(plan.type==='bind'&&plan.cells.some(p=>!visibleRay(enemy,p,blocks,field[0].length,field.length).some(c=>c.x===p.x&&c.y===p.y)))return {status:'blocked',cells:[]};
 if(plan.type==='illuminate'||plan.type==='darken')return {status:'ready',cells:plan.cells.filter(p=>!blocked(p)).map(p=>({...p}))};
 const cells:Cell[]=[];
 for(const p of plan.cells){if(blocked(p)||(['ray','bind'].includes(plan.type)&&!terrainSight(terrain,plan.origin,p)))break;cells.push({...p});}
 return {status:cells.length?'ready':'blocked',cells};
}
