export interface Cell { x:number; y:number }
/** One-step enemy movement follows a shortest route to an adjacent attack cell. */
export function enemyNextStep(start:Cell, target:Cell, width:number, height:number, blocked:(x:number,y:number)=>boolean,canStep:(from:Cell,to:Cell)=>boolean=()=>true):Cell|null {
 const key=(p:Cell)=>p.x+','+p.y, queue=[start],seen=new Set([key(start)]),first=new Map<string,Cell>();
 if(Math.abs(start.x-target.x)+Math.abs(start.y-target.y)<=1)return null;
 for(let index=0;index<queue.length;index++){
   const cell=queue[index];
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const next={x:cell.x+dx,y:cell.y+dy},id=key(next);
     if(next.x<0||next.y<0||next.x>=width||next.y>=height||seen.has(id)||blocked(next.x,next.y)||!canStep(cell,next))continue;
     seen.add(id);first.set(id,index===0?next:first.get(key(cell))!);
     if(Math.abs(next.x-target.x)+Math.abs(next.y-target.y)===1)return first.get(id)!;
     queue.push(next);
   }
 }
 return null;
}
