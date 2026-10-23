import {describe,it,expect} from 'vitest';
import {evacuationOptions} from '../src/game/evacuation';
import {forecastEnemyPlans,forecastSafe,type ForecastDog} from '../src/game/enemy-forecast';
import {movementRange} from '../src/game/movement';
import {planEnemies,type TacticalEnemy,type EnemyPlan} from '../src/game/tactics';
const dogs:ForecastDog[]=[{kind:'light',x:4,y:4,hp:10},{kind:'shadow',x:3,y:6,hp:9}];
const boss:TacticalEnemy={id:0,x:11,y:4,hp:30,boss:true,kind:'eclipseLord'};
const field=()=>Array.from({length:8},()=>Array(14).fill(0));
const walkable=(x:number,y:number)=>x>=0&&x<14&&y>=0&&y<8;
function input(){const f=field();return {kind:'light' as const,dogs,enemies:[boss],plans:planEnemies([boss],dogs,f,[],14,8),field:f,blocks:[],range:movementRange('light',dogs[0],f,6,(x,y)=>dogs.slice(1).some(d=>d.x===x&&d.y===y)),walkable};}
describe('evacuation guidance',()=>{
 it('suggests only reachable, unoccupied cells safe from the fixed plans, with actual movement cost',()=>{
  const i=input(),result=evacuationOptions(i);expect(result.currentSafe).toBe(false);expect(result.targets).toEqual([{x:2,y:4,cost:6}]);
  for(const p of result.safeCells){expect(p.cost).toBeLessThanOrEqual(6);const moved=dogs.map(d=>d.kind==='light'?{...d,...p}:d);expect(forecastSafe(forecastEnemyPlans(i.plans,i.enemies,moved,i.field,[],walkable),'light')).toBe(true);}
 });
 it('does not call a refuge safe when a different enemy ray hits it',()=>{
  const i=input(),archer:TacticalEnemy={id:1,x:2,y:0,hp:5,kind:'sunArcher'};i.field[0][2]=4;
  const ray:EnemyPlan={enemyId:1,origin:{x:2,y:0},type:'ray',cells:[{x:2,y:1},{x:2,y:2},{x:2,y:3},{x:2,y:4}],damage:2};
  const result=evacuationOptions({...i,enemies:[boss,archer],plans:[...i.plans,ray]});expect(result.safeCells).not.toContainEqual({x:2,y:4,cost:6});expect(result.targets).toHaveLength(0);
 });
 it('does not suggest places beyond the budget and offers no move after movement is spent',()=>{
  const i=input();expect(evacuationOptions({...i,range:[]}).targets).toHaveLength(0);
  expect(evacuationOptions({...i,range:movementRange('light',dogs[0],i.field,3,()=>false)}).targets).toHaveLength(0);
 });
 it('marks the current tile safe without asking for unnecessary movement',()=>{
  const i=input(),onRune=dogs.map(d=>d.kind==='light'?{...d,x:2,y:4}:d);const result=evacuationOptions({...i,dogs:onRune});expect(result.currentSafe).toBe(true);expect(result.targets).toHaveLength(0);
 });
 it('projects earlier darkening before checking a later nightfall',()=>{
  const i=input();i.field[4][3]=3;
  const weaver:TacticalEnemy={id:1,x:7,y:4,hp:5,kind:'shadowWeaver'},dark:EnemyPlan={enemyId:1,origin:{x:7,y:4},type:'darken',cells:[{x:3,y:4}],damage:0};
  const result=evacuationOptions({...i,enemies:[weaver,boss],plans:[dark,...i.plans]});expect(result.safeCells.some(p=>p.x===3&&p.y===4)).toBe(false);
 });
});
