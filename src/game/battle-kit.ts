import {houndAttackSkills} from './hound-skills';
import {pincerState} from './pincer';
import type {DogKind} from './affinity';
import type {AbilityDog} from './special-abilities';
import type {Cell} from './pathfinding';
const fieldSkills={rally:{id:'rally',name:'誓灯の咆哮',icon:'援',cost:2,description:'生存する味方二匹の攻撃+2・防御+1、次のラウンド終了まで'},lamp:{id:'lamp',name:'灯火を移す',icon:'灯',cost:0,description:'周囲3マスへ灯火を移す'},block:{id:'block',name:'遮蔽物を操る',icon:'壁',cost:2,description:'周囲3マスに設置／箱を選んで移動'},beam:{id:'beam',name:'光の直線',icon:'光',cost:2,description:'自身と前方4マスを強い光に'},veil:{id:'veil',name:'影の帯',icon:'影',cost:2,description:'自身と前方4マスを濃い影に'}} as const;
export const battleSkills={...houndAttackSkills,...fieldSkills};
export type SpecialSkillID=keyof typeof battleSkills;
export const specialAssignments:Record<string,readonly [SpecialSkillID,SpecialSkillID]>={dawn:['lamp','beam'],dusk:['block','veil'],bulwark:['cleave','lamp'],veil:['pierce','block'],sol:['burst','beam'],moon:['pierce','veil'],ember:['burst','lamp'],frost:['drain','veil'],reaper:['cleave','veil'],herald:['rally','lamp']};
export function houndSpecials(id:string){return (specialAssignments[id]??specialAssignments.dawn).map(id=>battleSkills[id]);}
export const questStartingCharge=()=>3;
/** Basic-attack replacement: geometry and living, available partners only. No charge cost. */
export function coordinatedTarget<T extends Cell&{hp:number}>(dogs:Record<DogKind,AbilityDog>,enemies:readonly T[]){return pincerState(dogs,enemies,3,false).target;}
export function canShiftObstacle(origin:Cell,from:Cell,to:Cell,board:{contains:(p:Cell)=>boolean;free:(p:Cell)=>boolean}){
 const distance=(p:Cell)=>Math.abs(p.x-origin.x)+Math.abs(p.y-origin.y);
 return board.contains(from)&&board.contains(to)&&distance(from)<=3&&distance(to)<=3&&distance(to)>0&&(from.x!==to.x||from.y!==to.y)&&board.free(to);
}
