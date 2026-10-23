/** Per-expedition effects. They never change saved training levels. */
export interface HoundCombatState {kills:Record<string,number>;rally?:{attack:number;armor:number;until:number}}
export const freshHoundCombat=():HoundCombatState=>({kills:{}});
export const killAttackBonus=(id:string,state:HoundCombatState)=>id==='reaper'?(state.kills.reaper??0):0;
export function recordHoundDefeat(state:HoundCombatState,before:number,after:number,contributors:readonly string[],rank=0){
 if(before<=0||after>0||!contributors.includes('reaper'))return 0;
 const gain=rank>=6?2:1;state.kills.reaper=(state.kills.reaper??0)+gain;return gain;
}
export function rallyStrength(rank=0){return rank>=6?{attack:4,armor:2}:{attack:2,armor:1};}
export function castRally(state:HoundCombatState,round:number,rank=0){state.rally={...rallyStrength(rank),until:round+1};}
export function rallyBonus(state:HoundCombatState,round:number){return state.rally&&state.rally.until>=round?state.rally:{attack:0,armor:0};}
