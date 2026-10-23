import type { Cell } from './pathfinding';
import type { EnemyPlan,PlanAssessment } from './tactics';
export function plannedBrightness(plan:EnemyPlan):0|4|undefined{return plan.type==='illuminate'?4:plan.type==='darken'?0:undefined;}
export function applyPlannedLight(field:readonly number[][],plan:EnemyPlan,assessment:PlanAssessment):number[][]{
 const next=field.map(row=>[...row]),value=plannedBrightness(plan);
 if(value!==undefined&&assessment.status==='ready')for(const p of assessment.cells)next[p.y][p.x]=value;
 return next;
}
/** Shared by actual forced retreat and forecasts, including coordinate tie breaks. */
export function shadowRetreatTarget(shadow:Cell&{hp:number},light:Cell,field:readonly number[][],blocked:(x:number,y:number)=>boolean,occupied:(x:number,y:number)=>boolean):Cell|undefined{
 if(shadow.hp<=0||field[shadow.y][shadow.x]<4)return;
 const options:{x:number;y:number;score:number}[]=[];
 for(let y=0;y<field.length;y++)for(let x=0;x<field[y].length;x++)if(field[y][x]<4&&!blocked(x,y)&&!occupied(x,y))options.push({x,y,score:Math.abs(x-light.x)+Math.abs(y-light.y)});
 options.sort((a,b)=>a.score-b.score||a.y-b.y||a.x-b.x);const target=options[0];return target?{x:target.x,y:target.y}:undefined;
}
