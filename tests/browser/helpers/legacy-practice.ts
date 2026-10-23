import type {Page} from '@playwright/test';
/** Preserve combat regression fixtures through the first-quest UI; no production-only test route. */
export async function installLegacyPractice(page:Page){
 await page.evaluate(async()=>{
  const practicePath='/src/game/tactics-stage.ts',campaignPath='/src/game/campaign.ts';
  const q=(await import(practicePath)).tacticsStage,first=(await import(campaignPath)).campaignQuests[0];
  for(const key of Object.keys(q).filter(key=>key!=='id'))Object.defineProperty(first,key,{configurable:true,enumerable:true,get:()=>q[key]});
 });
}
