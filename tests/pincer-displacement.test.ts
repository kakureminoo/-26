import {describe,it,expect} from 'vitest';
import {pincerState,pincerAttacks} from '../src/game/pincer';
import {campaignEnemyStats} from '../src/game/enemy-balance';
import {planEnemies,assessPlan,type TacticalEnemy} from '../src/game/tactics';
const dogs={light:{x:4,y:4,hp:8},shadow:{x:6,y:4,hp:7}},enemy={x:5,y:4,hp:20};
describe('pincer',()=>{
 it('requires two living, able dogs on opposite orthogonal sides',()=>{
  expect(pincerState(dogs,[enemy],2,false).ready).toBe(true);
  expect(pincerState({light:{x:5,y:3,hp:8},shadow:{x:5,y:5,hp:7}},[enemy],2,false).ready).toBe(true);
  for(const shadow of [{x:6,y:5,hp:7},{x:4,y:4,hp:7},{x:6,y:4,hp:0},{x:6,y:4,hp:7,stunned:true}])expect(pincerState({...dogs,shadow},[enemy],2,false).ready).toBe(false);
  expect(pincerState(dogs,[{...enemy,hp:0}],2,false).ready).toBe(false);
 });
 it('requires two charge, is once per round and boosts both separate attacks',()=>{
  expect(pincerState(dogs,[enemy],1,false).ready).toBe(false);expect(pincerState(dogs,[enemy],3,true).ready).toBe(false);
  expect(pincerAttacks(2,4)).toEqual([3,5]);
 });
});
describe('displacement',()=>{
 const field=Array.from({length:8},()=>Array(14).fill(0)),e:TacticalEnemy={id:0,x:7,y:4,hp:10,kind:'displacer'};
 it('fixes the source and legal destination, never chooses voids, light 4 or occupied cells',()=>{
  const f=field.map(row=>[...row]);f[7][6]=4;
  const plan=planEnemies([e],Object.values(dogs),f,[],14,8,1,(x,y)=>x!==9||y!==4)[0];
  expect(plan.type).toBe('displace');expect(plan.damage).toBe(0);expect(plan.cells).toEqual([{x:6,y:4}]);
  expect(plan.destination).toBeDefined();const p=plan.destination!;
  expect(f[p.y][p.x]).toBeLessThan(4);expect(p).not.toEqual({x:9,y:4});expect(Object.values(dogs).some(d=>d.x===p.x&&d.y===p.y)).toBe(false);
  expect(assessPlan(plan,e,f,[]).status).toBe('ready');expect(assessPlan(plan,e,f,[p]).status).toBe('blocked');expect(assessPlan(plan,e,f,[],()=>true).status).toBe('blocked');
  f[p.y][p.x]=4;expect(assessPlan(plan,e,f,[]).status).toBe('blocked');
 });
 it('has a one-round cooldown and falls back to regular combat',()=>{
  const cooldown={...e,nextDisplaceRound:3};
  expect(planEnemies([cooldown],Object.values(dogs),field,[],14,8,2)[0].type).toBe('attack');
  expect(planEnemies([cooldown],Object.values(dogs),field,[],14,8,3)[0].type).toBe('displace');
 });
});
it('campaign enemies gain HP and area damage while unscaled practice defaults stay intact',()=>{
 expect(campaignEnemyStats({hp:5},0)).toEqual({hp:7,damage:3});expect(campaignEnemyStats({hp:10},2)).toEqual({hp:17,damage:4});expect(campaignEnemyStats({hp:28,boss:true},2)).toEqual({hp:39,boss:true,damage:6});
 const f=Array.from({length:8},()=>Array(14).fill(0));
 expect(planEnemies([{id:0,x:3,y:4,hp:5}],[{x:4,y:4,hp:8}],f,[],14,8)[0].damage).toBe(2);
});
