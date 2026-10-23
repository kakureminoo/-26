import {campaignStep} from './campaign';
import {houndByID,type RosterSave} from './roster';
import type {Materials} from './equipment';
export interface HoundGrowth {level:number;xp:number;power:number;guard:number;attunement:'none'|'fury'|'ward'}
export interface GrowthProfile {cleared?:string[];legacyAccess?:boolean;growth?:Record<string,HoundGrowth>;roster:RosterSave;light:Partial<HoundGrowth>;shadow:Partial<HoundGrowth>;materials:Materials}
const natural=(v:unknown,fallback=0)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:fallback;
export function normalizeGrowth(raw:Partial<HoundGrowth>={}):HoundGrowth{raw=raw&&typeof raw==='object'?raw:{};return {level:Math.max(1,natural(raw.level,1)),xp:natural(raw.xp),power:natural(raw.power),guard:natural(raw.guard),attunement:raw.attunement==='fury'||raw.attunement==='ward'?raw.attunement:'none'};}
/** Existing owned hounds inherit their former shared growth exactly once. New recruits start at Lv.1. */
export function ensureHoundGrowth(p:GrowthProfile){
 const migrating=!p.growth||typeof p.growth!=='object'||Array.isArray(p.growth);if(migrating)p.growth={};p.growth??={};
 for(const id of p.roster.owned){const h=houndByID(id);if(h)p.growth[id]=normalizeGrowth(p.growth[id]??(migrating?p[h.kind]:{}));}
 return p.growth;
}
/** Legacy attribute slots remain equipment containers and projections of the active hounds. */
export function syncActiveGrowth(p:GrowthProfile){const all=ensureHoundGrowth(p);for(const kind of ['light','shadow'] as const)Object.assign(p[kind],all[p.roster.party[kind]]);}
export function grantHoundXP(p:GrowthProfile,ids:readonly string[],amount:number){if(!Number.isSafeInteger(amount)||amount<0)return false;const all=ensureHoundGrowth(p);for(const id of new Set(ids)){if(!p.roster.owned.includes(id))continue;const g=all[id];g.xp+=amount;while(g.xp>=g.level*3){g.xp-=g.level*3;g.level++;}}syncActiveGrowth(p);return true;}
export type TrainingType='level'|'power'|'guard';
export function trainingCost(g:HoundGrowth,type:TrainingType){return type==='level'?{metal:0,crystal:Math.max(1,g.level)}:type==='power'?{metal:2+g.power*2,crystal:0}:{metal:0,crystal:2+g.guard*2};}
export function trainHound(p:GrowthProfile,id:string,type:TrainingType){
 if(!p.roster.owned.includes(id)||!['level','power','guard'].includes(type))return false;const g=ensureHoundGrowth(p)[id],cost=trainingCost(g,type);
 if(!Number.isSafeInteger(p.materials.metal)||!Number.isSafeInteger(p.materials.crystal)||p.materials.metal<cost.metal||p.materials.crystal<cost.crystal)return false;
 p.materials.metal-=cost.metal;p.materials.crystal-=cost.crystal;
 if(type==='level')grantHoundXP(p,[id],g.level*3-g.xp);else g[type]++;syncActiveGrowth(p);return true;
}
export const canTuneHound=(p:GrowthProfile)=>!!p.legacyAccess||campaignStep(p.cleared??[])>=3;
export function tuneHound(p:GrowthProfile,id:string,tune:HoundGrowth['attunement']){if(!canTuneHound(p)||!p.roster.owned.includes(id)||!['none','fury','ward'].includes(tune))return false;ensureHoundGrowth(p)[id].attunement=tune;syncActiveGrowth(p);return true;}
