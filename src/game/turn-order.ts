import type { DogKind } from './affinity';
type Dogs=Record<DogKind,{hp:number;stunned?:boolean}>;
export function beginPlayerRound(dogs:Dogs,skipShadow:boolean){
 const acted:DogKind[]=[];
 if(dogs.light.hp<=0||dogs.light.stunned)acted.push('light');
 if(dogs.shadow.hp<=0||dogs.shadow.stunned||skipShadow)acted.push('shadow');
 const phase:DogKind|'enemy'=['light','shadow'].find(k=>!acted.includes(k as DogKind)) as DogKind|undefined??'enemy';
 return {phase,acted,skipShadow:false,orderLocked:acted.length>0};
}
export function advancePlayerTurn(phase:DogKind,previous:readonly DogKind[],dogs:Dogs,skipShadow:boolean){
 const acted=[...new Set([...previous,phase])];
 for(const kind of ['light','shadow'] as const)if(dogs[kind].hp<=0&&!acted.includes(kind))acted.push(kind);
 if(skipShadow&&!acted.includes('shadow')){acted.push('shadow');skipShadow=false;}
 const next:DogKind|'enemy'=(['light','shadow'] as const).find(k=>!acted.includes(k))??'enemy';
 return {phase:next,acted,skipShadow,orderLocked:true};
}
