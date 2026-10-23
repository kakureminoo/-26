import type {Terrain} from './terrain';
import type {DogKind} from './affinity';
import {assessPlan,type EnemyPlan,type TacticalEnemy,type TacticalDog} from './tactics';
import {applyPlannedLight,plannedBrightness,shadowRetreatTarget} from './light-effects';
import type {Cell} from './pathfinding';
export type ForecastDog=TacticalDog&{kind:DogKind;[key:string]:unknown};
/** Project fixed plans in order; both the forecast UI and evacuation suggestions use this projection. */
export function forecastEnemyPlans(plans:readonly EnemyPlan[],enemies:readonly TacticalEnemy[],inputDogs:readonly ForecastDog[],inputField:readonly number[][],blocks:readonly Cell[],walkable:(x:number,y:number)=>boolean,resolved:readonly number[]=[],terrain?:Terrain){
 let field=inputField.map(row=>[...row]);
 const dogs=inputDogs.map(d=>({...d})),simulated=enemies.filter(e=>e.hp>0).map(e=>({...e})),displaced=new Set<DogKind>();
 const retreat=()=>{
  const shadow=dogs.find(d=>d.kind==='shadow'),light=dogs.find(d=>d.kind==='light');if(!shadow||!light)return false;
  const target=shadowRetreatTarget(shadow,light,field,(x,y)=>!walkable(x,y)||blocks.some(b=>b.x===x&&b.y===y),(x,y)=>dogs.some(d=>d!==shadow&&d.hp>0&&d.x===x&&d.y===y)||simulated.some(e=>e.hp>0&&e.x===x&&e.y===y));
  if(target){Object.assign(shadow,target);displaced.add('shadow');}return !!target;
 };
 retreat();
 const entries=[];
 for(const [i,plan] of plans.entries()){
  const enemy=enemies.find(e=>e.id===plan.enemyId);if(!enemy||enemy.hp<=0||resolved.includes(enemy.id))continue;
  const assessment=assessPlan(plan,enemy,field,blocks,(x,y)=>dogs.some(d=>d.hp>0&&d.x===x&&d.y===y)||simulated.some(e=>e.id!==enemy.id&&e.x===x&&e.y===y),terrain);
  if(['move','warp'].includes(plan.type)&&assessment.status==='ready'){const e=simulated.find(e=>e.id===enemy.id);if(e)Object.assign(e,plan.destination);}
  if(plan.type==='summon'&&assessment.status==='ready')simulated.push({id:-enemy.id-1,hp:1,...plan.destination!});
  const snapshot=dogs.map(d=>({...d})),beforeField=field;let forcedRetreat=false;
  if(plan.type==='displace'&&assessment.status==='ready'){
   const dog=dogs.find(d=>d.hp>0&&assessment.cells.some(p=>p.x===d.x&&p.y===d.y));if(dog){Object.assign(dog,plan.destination);displaced.add(dog.kind);}
  }
  if(plannedBrightness(plan)!==undefined){field=applyPlannedLight(field,plan,assessment);forcedRetreat=retreat();}
  entries.push({plan,enemy,assessment,number:i+1,field:beforeField,dogs:snapshot,forcedRetreat});
 }
 return {entries,displaced};
}
export function forecastSafe(result:ReturnType<typeof forecastEnemyPlans>,kind:DogKind):boolean{
 if(result.displaced.has(kind))return false;
 return !result.entries.some(a=>{
  if(a.assessment.status!=='ready'||['illuminate','darken'].includes(a.plan.type))return false;
  const dog=a.dogs.find(d=>d.kind===kind&&d.hp>0);return !!dog&&a.assessment.cells.some(p=>p.x===dog.x&&p.y===dog.y);
 });
}
