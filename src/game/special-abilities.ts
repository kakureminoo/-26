import type { Cell } from './pathfinding';
import type { DogKind } from './affinity';
export interface AbilityDog extends Cell { hp:number; stillRounds?:number; anchor?:Cell; movedThisRound?:boolean; stunned?:boolean; incapacitated?:boolean }
export function normalizeName(value:unknown):string {
 return typeof value==='string'?Array.from(value.replace(/[\u0000-\u001f\u007f]/g,'').trim()).slice(0,12).join(''):'';
}
export function ambushBonus(dog:AbilityDog):number { return dog.hp>0&&!dog.movedThisRound&&(dog.stillRounds??0)>=2?1:0; }
/** Track a complete round, including displacement and out-and-back movement. */
export function settlePosition(dog:AbilityDog){
 const stayed=!dog.movedThisRound&&dog.anchor?.x===dog.x&&dog.anchor?.y===dog.y;
 return {stillRounds:dog.hp>0?(stayed?Math.min(2,(dog.stillRounds??0)+1):0):0,anchor:{x:dog.x,y:dog.y},movedThisRound:false};
}
export function comboState(dogs:Record<DogKind,AbilityDog>,blocks:readonly Cell[],charge:number,used:boolean){
 const a=dogs.light,b=dogs.shadow,cells:Cell[]=[];
 let reason='';
 if(a.hp<=0||b.hp<=0)reason='二匹の生存が必要';
 else if(a.stunned||b.stunned||a.incapacitated||b.incapacitated)reason='相棒が行動不能';
 else if(a.x!==b.x&&a.y!==b.y)reason='二匹を同じ行か列に並べる';
 else if(a.x===b.x&&a.y===b.y)reason='二匹を別のマスに並べる';
 else {
  const dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y);
  for(let x=a.x,y=a.y;x!==b.x||y!==b.y;x+=dx,y+=dy)cells.push({x,y});
  cells.push({x:b.x,y:b.y});
  if(cells.some(p=>blocks.some(q=>q.x===p.x&&q.y===p.y)))reason='二匹の間の遮蔽物を避ける';
 }
 if(!reason&&used)reason='このラウンドは使用済み';
 if(!reason&&charge<3)reason='チャージ3が必要';
 return {ready:!reason,reason,cells};
}
/** Full row/column through the pair; obstacles stop the surge in both directions. */
export function comboCells(dogs:Record<DogKind,AbilityDog>,blocks:readonly Cell[],width:number,height:number):Cell[]{
 const a=dogs.light,b=dogs.shadow;
 if(!comboState(dogs,blocks,3,false).ready)return [];
 const dx=a.x===b.x?0:1,dy=a.x===b.x?1:0,result:Cell[]=[{x:a.x,y:a.y}];
 for(const sign of [-1,1])for(let n=1;n<Math.max(width,height);n++){
  const p={x:a.x+dx*n*sign,y:a.y+dy*n*sign};
  if(p.x<0||p.y<0||p.x>=width||p.y>=height||blocks.some(q=>q.x===p.x&&q.y===p.y))break;
  result.push(p);
 }
 return result;
}
export const comboDamage=(lightAttack:number,shadowAttack:number)=>Math.max(1,Math.floor((lightAttack+shadowAttack)/2)+2);
