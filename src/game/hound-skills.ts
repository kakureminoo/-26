import type {Cell} from './pathfinding';
export const houndAttackSkills={
 cleave:{id:'cleave',name:'薙ぎ払う牙',icon:'弧',cost:2,bonus:0,heal:0,description:'前方の横3マスを攻撃'},
 pierce:{id:'pierce',name:'貫く咆哮',icon:'貫',cost:2,bonus:1,heal:0,description:'直線3マスを貫通攻撃'},
 drain:{id:'drain',name:'命喰らいの牙',icon:'吸',cost:2,bonus:0,heal:2,description:'射程2の単体攻撃・命中時HP2回復'},
 burst:{id:'burst',name:'星火の炸裂',icon:'爆',cost:2,bonus:-1,heal:0,description:'射程3・着弾点と隣接4マスを攻撃'},
} as const;
export type AttackSkillID=keyof typeof houndAttackSkills;
export const isHoundAttackSkill=(id:string):id is AttackSkillID=>Object.hasOwn(houndAttackSkills,id);
interface SkillBoard {contains:(x:number,y:number)=>boolean;blocked:(x:number,y:number)=>boolean;sight?:(from:Cell,to:Cell)=>boolean}
/** Pure target and affected-cell calculation shared by preview and execution. Walls stop rays. */
export function attackSkillCells(id:AttackSkillID,origin:Cell,target:Cell,board:SkillBoard):Cell[]{
 const dx=target.x-origin.x,dy=target.y-origin.y,distance=Math.abs(dx)+Math.abs(dy);
 if(!board.contains(target.x,target.y)||board.blocked(target.x,target.y)||!distance||board.sight?.(origin,target)===false)return [];
 const line=(range:number)=>{if(dx&&dy||distance>range)return [];const sx=Math.sign(dx),sy=Math.sign(dy),cells:Cell[]=[];for(let i=1;i<=range;i++){const p={x:origin.x+sx*i,y:origin.y+sy*i};if(!board.contains(p.x,p.y)||board.blocked(p.x,p.y)||board.sight?.(origin,p)===false)break;cells.push(p);}return cells.some(p=>p.x===target.x&&p.y===target.y)?cells:[];};
 if(id==='pierce')return line(3);
 if(id==='cleave'){if(distance!==1)return [];const sx=Math.sign(dx),sy=Math.sign(dy);return [-1,0,1].map(i=>({x:origin.x+sx-sy*i,y:origin.y+sy+sx*i})).filter(p=>board.contains(p.x,p.y)&&!board.blocked(p.x,p.y)&&board.sight?.(origin,p)!==false);}
 if(distance>(id==='drain'?2:3)||!lineClear(origin,target,board))return [];
 return (id==='drain'?[target]:[target,{x:target.x+1,y:target.y},{x:target.x-1,y:target.y},{x:target.x,y:target.y+1},{x:target.x,y:target.y-1}]).filter(p=>board.contains(p.x,p.y)&&!board.blocked(p.x,p.y)&&board.sight?.(target,p)!==false);
}
function lineClear(a:Cell,b:Cell,board:SkillBoard){const steps=Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))*4;for(let i=1;i<steps;i++){const x=Math.round(a.x+(b.x-a.x)*i/steps),y=Math.round(a.y+(b.y-a.y)*i/steps);if((x!==a.x||y!==a.y)&&(x!==b.x||y!==b.y)&&board.blocked(x,y))return false;}return true;}
export function attackSkillPower(id:AttackSkillID,attack:number,heightBonus=0){return Math.max(1,attack+houndAttackSkills[id].bonus+heightBonus);}

export function attackSkillHealing(id:AttackSkillID,damagingHits:number,hp:number,max:number){return damagingHits>0?Math.min(houndAttackSkills[id].heal,Math.max(0,max-hp)):0;}
