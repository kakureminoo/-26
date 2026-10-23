import type {CampaignQuest} from './campaign';
/** Two short skirmishes lead into the original objective. Original quest IDs and rewards remain intact. */
export function questStages(m:CampaignQuest&{extra?:boolean;practice?:boolean;fixed?:boolean}){
 if(m.extra||m.practice||m.fixed)return undefined;
 const guards=m.enemies.filter(e=>!e.boss),base=guards.length?guards:m.enemies.map(e=>({...e,boss:false,kind:'sentinel' as const,species:'mercenary' as const}));
 const wave=(count:number,factor:number)=>base.slice(0,count).map(e=>({...e,boss:false,hp:Math.max(2,Math.ceil(e.hp*factor)),damage:Math.max(1,(e.damage??3)-1)}));
 return [wave(1,.45),wave(2,.55),m.enemies.map(e=>({...e}))];
}
export const stageLabel=(index:number)=>['前哨戦','増援','最終目標'][Math.max(0,Math.min(2,index))];
