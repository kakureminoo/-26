import type { DogKind } from './affinity';
import type { AbilityDog } from './special-abilities';
import type { Cell } from './pathfinding';
/** Opposite orthogonal neighbours only; diagonal and merely aligned pairs do not qualify. */
export function pincerState<T extends Cell & {hp:number}>(dogs:Record<DogKind,AbilityDog>,enemies:readonly T[],charge:number,used:boolean){
 const a=dogs.light,b=dogs.shadow;
 const available=a.hp>0&&b.hp>0&&!a.stunned&&!b.stunned&&!a.incapacitated&&!b.incapacitated;
 const target=available?enemies.find(e=>e.hp>0&&a.x+b.x===2*e.x&&a.y+b.y===2*e.y&&Math.abs(a.x-e.x)+Math.abs(a.y-e.y)===1&&Math.abs(b.x-e.x)+Math.abs(b.y-e.y)===1):undefined;
 return {target,ready:!!target&&charge>=2&&!used};
}
export const pincerAttacks=(lightAttack:number,shadowAttack:number)=>[lightAttack+1,shadowAttack+1] as const;
