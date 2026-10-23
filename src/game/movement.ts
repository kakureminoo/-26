import { movementCost, type DogKind, type Brightness } from './affinity';
import type { Cell } from './pathfinding';
/** Dijkstra search. The starting tile never changes the fixed budget or costs points. */
export function movementRange(kind:DogKind,start:Cell,field:readonly number[][],budget:number,blocked:(x:number,y:number)=>boolean,edgeCost:(from:Cell,to:Cell)=>number=()=>0){
 const h=field.length,w=field[0]?.length??0,cost=Array.from({length:h},()=>Array(w).fill(Infinity)),queue=[{...start,c:0}];
 cost[start.y][start.x]=0;
 while(queue.length){
  queue.sort((a,b)=>a.c-b.c);const q=queue.shift()!;if(q.c!==cost[q.y][q.x])continue;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=q.x+dx,y=q.y+dy;if(x<0||y<0||x>=w||y>=h||blocked(x,y))continue;
   const c=q.c+movementCost(kind,field[y][x] as Brightness)+edgeCost(q,{x,y});
   if(c<=budget&&c<cost[y][x]){cost[y][x]=c;queue.push({x,y,c});}
  }
 }
 return cost;
}
export function movementPath(kind:DogKind,start:Cell,target:Cell,field:readonly number[][],cost:readonly number[][],edgeCost:(from:Cell,to:Cell)=>number=()=>0):Cell[]{
 if(!Number.isFinite(cost[target.y]?.[target.x]))return [];
 const path=[{...target}];let p={...target};
 for(let i=0;i<field.length*field[0].length;i++){
  if(p.x===start.x&&p.y===start.y)return path;
  const step=movementCost(kind,field[p.y][p.x] as Brightness);
  const previous=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).find(c=>Number.isFinite(cost[c.y]?.[c.x])&&cost[c.y][c.x]+step+edgeCost(c,p)===cost[p.y][p.x]);
  if(!previous)return [];p=previous;path.unshift(p);
 }
 return [];
}
