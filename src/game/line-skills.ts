import type {Cell} from './pathfinding';
/** Player light/shadow lines affect the caster plus four forward cells. Gaps are crossed, not filled. */
export function lineSkillCells(origin:Cell,target:Cell,width:number,height:number,walkable:(x:number,y:number)=>boolean=()=>true):Cell[]{
 if((origin.x!==target.x&&origin.y!==target.y)||(origin.x===target.x&&origin.y===target.y))return [];
 const dx=Math.sign(target.x-origin.x),dy=Math.sign(target.y-origin.y),cells:Cell[]=[];
 for(let n=0;n<=4;n++){const p={x:origin.x+dx*n,y:origin.y+dy*n};if(p.x<0||p.y<0||p.x>=width||p.y>=height)break;if(walkable(p.x,p.y))cells.push(p);}
 return cells;
}
