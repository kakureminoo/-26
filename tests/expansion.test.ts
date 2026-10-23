import {describe,it,expect} from 'vitest';
import {migrateExpansion,drawSigil,sigils,socketSigil,sigilBonus,grantExpansionReward,recordRelics,recordEncounter,collectionEnemies} from '../src/game/expansion';
import {activities,activityOutcome,placeWave} from '../src/game/activities';
import {terraceTerrain,terrainStep,terrainSight,highGroundBonus} from '../src/game/terrain';
import {movementRange,movementPath} from '../src/game/movement';
import {planEnemies,assessPlan} from '../src/game/tactics';
import {forecastEnemyPlans} from '../src/game/enemy-forecast';
const field=(v=2)=>Array.from({length:8},()=>Array(14).fill(v));
describe('earned inscriptions',()=>{
 it('migrates old and invalid data without granting currency or modifying its input',()=>{
  const old={version:0,shards:-1,draws:Infinity,dry:200,sigils:{stone:1,wind:-1},sockets:{light:{fang:'stone',ward:'stone'},shadow:{fang:'stone'}}};
  const before=JSON.stringify(old),s=migrateExpansion(old);expect(s.shards).toBe(0);expect(s.draws).toBe(0);expect(s.dry).toBe(9);expect(s.sigils.wind).toBe(0);expect(s.sockets).toEqual({light:{fang:'stone'},shadow:{}});expect(JSON.stringify(old)).toBe(before);
  expect(migrateExpansion(undefined).shards).toBe(0);
 });
 it('does not consume currency on shortage or invalid randomness',()=>{
  const s=migrateExpansion({shards:2});const before=JSON.stringify(s);expect(drawSigil(s,.2)).toBeUndefined();expect(JSON.stringify(s)).toBe(before);
  s.shards=3;for(const n of [-1,1,NaN,Infinity]){expect(drawSigil(s,n)).toBeUndefined();expect(s.shards).toBe(3);}
 });
 it('implements the displayed normal probability boundaries and tenth-roll rare guarantee',()=>{
  expect(sigils.reduce((n,s)=>n+s.weight,0)).toBe(100);
  for(const [random,id] of [[0,'spark'],[.22999,'spark'],[.23,'shade'],[.46,'stone'],[.66,'life'],[.76,'wind'],[.86,'eclipse'],[.96,'aurora'],[.99999,'nightwing']] as const){const s=migrateExpansion({shards:3});expect(drawSigil(s,random)?.item.id).toBe(id);expect(s.shards).toBe(0);expect(s.draws).toBe(1);}
  const s=migrateExpansion({shards:30});for(let i=0;i<9;i++)expect(drawSigil(s,0)?.item.rarity).toBe('通常');expect(s.dry).toBe(9);const tenth=drawSigil(s,0);expect(tenth?.guaranteed).toBe(true);expect(tenth?.item.rarity).toBe('希少');expect(s.dry).toBe(0);expect(s.sigils.spark).toBe(9);
 });
 it('shares owned copies across equipment slots and applies only the active equipment',()=>{
  const s=migrateExpansion({sigils:{wind:1,spark:1,life:1}}),p={ownedEquipment:['fang','ward'],equipment:'fang'};
  expect(socketSigil(s,'light',p,'wind')).toBe(true);expect(sigilBonus(s,'light','fang',0).move).toBe(1);expect(sigilBonus(s,'light','ward',0).move).toBe(0);
  expect(socketSigil(s,'shadow',p,'wind')).toBe(false);expect(socketSigil(s,'light',{ownedEquipment:[],equipment:'ward'},'wind')).toBe(false);
  expect(socketSigil(s,'light',p,null)).toBe(true);expect(socketSigil(s,'shadow',p,'wind')).toBe(true);
  expect(socketSigil(s,'light',p,'spark')).toBe(true);expect(sigilBonus(s,'light','fang',2).attack).toBe(0);expect(sigilBonus(s,'light','fang',3).attack).toBe(1);
 });
 it('grants normal and first/repeat activity currency without duplicating first-clear relics',()=>{
  const s=migrateExpansion();expect(grantExpansionReward(s,'hunt').shards).toBe(2);expect(s.clears).toEqual([]);
  expect(grantExpansionReward(s,'expedition',true).shards).toBe(6);expect(grantExpansionReward(s,'expedition',true).shards).toBe(2);expect(s.shards).toBe(10);expect(s.clears).toEqual(['expedition']);
  recordRelics(s,['boss']);recordRelics(s,['boss']);expect(s.relics).toEqual(['city-seal','expedition-map']);
  const e={species:'dragon' as const,affinity:'light' as const};recordEncounter(s,[e,e]);expect(s.enemies).toHaveLength(1);expect(collectionEnemies().some(i=>s.enemies.includes(i.key))).toBe(true);
 });
});
describe('additional objectives',()=>{
 const dogs={light:{x:5,y:4,hp:10},shadow:{x:7,y:4,hp:9}};
 it('requires both marks, both survivors and their actual brightness in the puzzle',()=>{
  const m=activities.find(m=>m.id==='puzzle')!,f=field();f[4][5]=3;f[4][7]=1;
  expect(activityOutcome(m,dogs,f,1)).toBe('success');expect(activityOutcome(m,{...dogs,shadow:{...dogs.shadow,x:8}},f,1)).toBeUndefined();
  expect(activityOutcome(m,{...dogs,shadow:{...dogs.shadow,hp:0}},f,1)).toBeUndefined();f[4][7]=2;expect(activityOutcome(m,dogs,f,9)).toBe('failure');
 });
 it('ends defense after the last enemy round and fails before granting survival success',()=>{
  const m=activities.find(m=>m.id==='defense')!;expect(activityOutcome(m,dogs,field(),5,1)).toBeUndefined();expect(activityOutcome(m,dogs,field(),6,1)).toBe('success');expect(activityOutcome(m,dogs,field(),6,0)).toBe('failure');
 });
 it('places reinforcements without overlapping dogs, objectives, other enemies or walls',()=>{
  const result=placeWave([{x:1,y:1,hp:4},{x:1,y:1,hp:5}],[{x:1,y:1}],(x,y)=>x===0||y===0);
  expect(result).toHaveLength(2);expect(result[0]).not.toMatchObject({x:1,y:1});expect(result[0]).not.toMatchObject({x:0});expect(result[0]).not.toMatchObject({x:result[1].x,y:result[1].y});
 });
});
describe('height, stairs and low cover',()=>{
 it('permits height changes only at stairs and includes climb cost in both paths and ranges',()=>{
  const t=terraceTerrain(),f=field(3),edge=(a:{x:number;y:number},b:{x:number;y:number})=>terrainStep(t,a,b);
  expect(edge({x:5,y:3},{x:6,y:3})).toBe(Infinity);expect(edge({x:5,y:4},{x:6,y:4})).toBe(1);expect(edge({x:6,y:4},{x:5,y:4})).toBe(0);
  const costs=movementRange('light',{x:5,y:4},f,3,()=>false,edge);expect(costs[4][6]).toBe(2);
  expect(movementPath('light',{x:5,y:4},{x:7,y:4},f,costs,edge)).toEqual([{x:5,y:4},{x:6,y:4},{x:7,y:4}]);expect(highGroundBonus(t,{x:6,y:4},{x:5,y:4})).toBe(1);
 });
 it('casts a low-wall shadow on the same height while an elevated source can see over low cover',()=>{
  const t={heights:Array.from({length:8},()=>Array(14).fill(0)),stairs:[],lowWalls:[{x:4,y:4}]};
  expect(terrainSight(t,{x:2,y:4},{x:6,y:4},true)).toBe(false);t.heights[4][2]=1;expect(terrainSight(t,{x:2,y:4},{x:6,y:4},true)).toBe(true);
 });
 it('truncates both ray forecast and impact at the same low wall',()=>{
  const t={heights:field(0),stairs:[],lowWalls:[{x:4,y:4}]},f=field(4),e={id:0,x:2,y:4,hp:5,kind:'sunArcher' as const},dog={x:5,y:4,hp:10,kind:'light' as const};
  const plan={enemyId:0,origin:{x:2,y:4},type:'ray' as const,cells:[{x:3,y:4},{x:4,y:4},{x:5,y:4}],damage:3};
  const hit=assessPlan(plan,e,f,[],undefined,t);expect(hit.cells).not.toContainEqual({x:5,y:4});
  expect(forecastEnemyPlans([plan],[e],[dog],f,[],()=>true,[],t).entries[0].assessment).toEqual(hit);
  const moving=planEnemies([{...e,kind:'sentinel'}],[{x:7,y:2,hp:10}],f,[],14,8,1,()=>true,terraceTerrain());expect(moving).toHaveLength(1);
 });
});
