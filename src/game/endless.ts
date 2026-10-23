import type {CampaignQuest} from './campaign';
export const endlessEnemyLimit=10;
export function endlessWave(phase:number):CampaignQuest['enemies']{
 const n=Number.isSafeInteger(phase)&&phase>0?phase:1,count=Math.min(endlessEnemyLimit,2+Math.floor((n-1)/2));
 return Array.from({length:count},(_,i)=>({x:8+i%5,y:1+Math.floor(i/5)*4,hp:8+(n-1)*3,damage:2+Math.floor((n-1)/3),kind:i%4===0?'sentinel':i%4===1?'sunArcher':i%4===2?'shadeGuard':'binder',species:n%5===0&&i===0?'dragon':i%3===0?'mercenary':'goblin',affinity:n>=5&&i%3===0?'yinYang':i%2?'light':'shadow',boss:n%5===0&&i===0}));
}
export function recordEndlessBest(save:{endlessBest:number},cleared:number){if(!Number.isSafeInteger(cleared)||cleared<0)return false;const next=Math.max(save.endlessBest,cleared),changed=next!==save.endlessBest;save.endlessBest=next;return changed;}
