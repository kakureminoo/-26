import type {Cell} from './pathfinding';
export interface Terrain {heights:readonly (readonly number[])[];stairs:readonly Cell[];lowWalls:readonly Cell[]}
export const heightScale=.48;
export const elevation=(terrain:Terrain|undefined,p:Cell)=>terrain?.heights[p.y]?.[p.x]??0;
export function terrainStep(terrain:Terrain|undefined,from:Cell,to:Cell){
 const delta=elevation(terrain,to)-elevation(terrain,from);
 if(delta===0)return 0;
 if(Math.abs(delta)>1||!terrain?.stairs.some(p=>p.x===from.x&&p.y===from.y||p.x===to.x&&p.y===to.y))return Infinity;
 return delta>0?1:0;
}
export const highGroundBonus=(terrain:Terrain|undefined,from:Cell,to:Cell)=>elevation(terrain,from)>elevation(terrain,to)?1:0;
/** Terrain and low walls intersect the ray between elevated source and ground target. */
export function terrainSight(terrain:Terrain|undefined,from:Cell,to:Cell,light=false):boolean{
 if(!terrain)return true;
 const steps=Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y))*4;
 const source=elevation(terrain,from)+(light?1.4:.8),target=elevation(terrain,to)+.1;
 for(let i=1;i<steps;i++){
  const t=i/steps,x=Math.round(from.x+(to.x-from.x)*t),y=Math.round(from.y+(to.y-from.y)*t);
  if(x===from.x&&y===from.y||x===to.x&&y===to.y)continue;
  const h=elevation(terrain,{x,y})+(terrain.lowWalls.some(p=>p.x===x&&p.y===y)? .7:0);
  if(h>source+(target-source)*t)return false;
 }return true;
}
export function terraceTerrain():Terrain{
 const heights=Array.from({length:8},(_,y)=>Array.from({length:14},(_,x)=>x>=6&&x<=10&&y>=2&&y<=5?1:0));
 return {heights,stairs:[{x:6,y:4},{x:10,y:3}],lowWalls:[{x:7,y:3},{x:9,y:4}]};
}
