import {it,expect} from 'vitest';
import {movementRange,movementPath} from '../src/game/movement';
import {movementBudget,movementCost, type Brightness} from '../src/game/affinity';
it('固定予算は出発マスの明るさに依存しない',()=>{
 const field=[[0,3,3,3,3,3,3]];
 for(const level of [0,1,2,3,4]){field[0][0]=level;expect(movementRange('light',{x:0,y:0},field,movementBudget.light,()=>false)[0][6]).toBe(6);}
});
it('進入マスを積算し、予算と壁を越えない',()=>{
 const f=[[4,3,2,1,0,3]];const r=movementRange('light',{x:0,y:0},f,6,()=>false);
 expect(r[0].slice(0,4)).toEqual([0,1,3,5]);expect(r[0][4]).toBe(Infinity);
 expect(movementPath('light',{x:0,y:0},{x:3,y:0},f,r)).toHaveLength(4);
 expect(movementRange('light',{x:0,y:0},f,8,x=>x===2)[0][3]).toBe(Infinity);
});
it('影は強い光を迂回し、同じ判定で最安経路を再現する',()=>{
 const f=[[0,4,0],[0,0,0]],start={x:0,y:0},target={x:2,y:0},r=movementRange('shadow',start,f,8,()=>false);
 expect(r[0][1]).toBe(Infinity);const path=movementPath('shadow',start,target,f,r);
 expect(path).toEqual([start,{x:0,y:1},{x:1,y:1},{x:2,y:1},target]);
 expect(path.slice(1).reduce((n,p)=>n+movementCost('shadow',f[p.y][p.x] as Brightness),0)).toBe(r[0][2]);
});
it('暗い最短路より明るい迂回の方が安ければ光は迂回する',()=>{
 const f=[[4,0,0,4],[4,4,4,4]],s={x:0,y:0},t={x:3,y:0},r=movementRange('light',s,f,6,()=>false);
 expect(r[0][3]).toBe(5);expect(movementPath('light',s,t,f,r)).toHaveLength(6);
});
