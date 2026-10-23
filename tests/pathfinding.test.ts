import { expect,it } from 'vitest';
import { enemyNextStep } from '../src/game/pathfinding';
it('いったん距離が増える迂回でも壁を回り込む',()=>{
 const blocked=(x:number,y:number)=>(x===2&&y<3)||(x===3&&y===1);
 expect(enemyNextStep({x:1,y:1},{x:3,y:1},5,4,blocked)).toEqual({x:1,y:2});
});
it('隣接、包囲、他キャラクターの占有では不正な移動を返さない',()=>{
 expect(enemyNextStep({x:1,y:1},{x:2,y:1},5,5,()=>false)).toBeNull();
 expect(enemyNextStep({x:1,y:1},{x:4,y:4},5,5,()=>true)).toBeNull();
 expect(enemyNextStep({x:0,y:0},{x:3,y:0},4,2,(x,y)=>x===1&&y===0)).toEqual({x:0,y:1});
});
