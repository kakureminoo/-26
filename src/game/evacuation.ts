import type {Terrain} from './terrain';
import type {DogKind} from './affinity';
import type {Cell} from './pathfinding';
import type {EnemyPlan,TacticalEnemy} from './tactics';
import {forecastEnemyPlans,forecastSafe,type ForecastDog} from './enemy-forecast';
export interface EvacuationInput {
 terrain?:Terrain;kind:DogKind;dogs:readonly ForecastDog[];enemies:readonly TacticalEnemy[];plans:readonly EnemyPlan[];
 field:number[][];blocks:readonly Cell[];range:readonly number[][];walkable:(x:number,y:number)=>boolean;resolved?:readonly number[];
}
/** No new combat rules: only suggest reachable cells that avoid every currently fixed enemy action. */
export function evacuationOptions(input:EvacuationInput){
 const {kind,dogs,enemies,plans,field,blocks,range,walkable,resolved=[]}=input,dog=dogs.find(d=>d.kind===kind)!;
 const base=forecastEnemyPlans(plans,enemies,dogs,field,blocks,walkable,resolved,input.terrain),currentSafe=forecastSafe(base,kind),safeCells:(Cell&{cost:number})[]=[];
 if(dog?.hp>0)for(let y=0;y<field.length;y++)for(let x=0;x<field[y].length;x++){
  if(!walkable(x,y)||!Number.isFinite(range[y]?.[x])||(x===dog.x&&y===dog.y)||blocks.some(b=>b.x===x&&b.y===y)||dogs.some(d=>d.kind!==kind&&d.hp>0&&d.x===x&&d.y===y)||enemies.some(e=>e.hp>0&&e.x===x&&e.y===y))continue;
  const result=forecastEnemyPlans(plans,enemies,dogs.map(d=>d.kind===kind?{...d,x,y}:d),field,blocks,walkable,resolved,input.terrain);
  if(forecastSafe(result,kind))safeCells.push({x,y,cost:range[y][x]});
 }
 safeCells.sort((a,b)=>a.cost-b.cost||a.y-b.y||a.x-b.x);
 return {currentSafe,safeCells,targets:currentSafe?[]:safeCells.slice(0,3)};
}
