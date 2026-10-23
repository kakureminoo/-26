import {ready,skipOrAttack,walkLight} from './helpers/driver';
import { test, expect } from '@playwright/test';

test('4クエストを開始からリザルトまで通し、回収・救助の帰還と報酬の一回付与を確認する',async({page},info)=>{
 test.skip(info.project.name!=='desktop','通しプレイはPCで行い、表示と装備操作は別テストで全サイズを確認');test.setTimeout(360000);
 await page.addInitScript(()=>localStorage.setItem('lightShadowSave',JSON.stringify({
   cleared:[],user:1,uxp:0,wins:0,materials:{metal:0,crystal:0},
   light:{level:1,xp:0,power:20,guard:50,gear:false},shadow:{level:1,xp:0,power:20,guard:50,gear:false},
 })));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
 await page.locator('#homeGo').click();
 const missions=[
   {id:'hunt',enemies:5,blocks:[[5,1],[5,2],[8,4],[8,5],[10,5]]},
   {id:'relic',enemies:5,item:{x:11,y:4},blocks:[[4,2],[4,3],[7,1],[7,2],[9,4],[9,5]]},
   {id:'rescue',enemies:5,item:{x:11,y:6},blocks:[[5,2],[5,3],[8,1],[8,5],[9,5]]},
   {id:'boss',enemies:3,blocks:[[4,1],[4,2],[6,5],[8,2],[9,5]]},
 ];
 for(let index=0;index<missions.length;index++){
   const mission=missions[index];await page.locator('[data-quest-id="'+mission.id+'"] button').click();await page.locator('#questConfirm').click();
   let defeated=0;
   for(let turn=0;turn<60&&defeated<mission.enemies;turn++)if(await skipOrAttack(page,mission.blocks))defeated++;
   expect(defeated).toBe(mission.enemies);
   if(mission.item){
     await expect(page.locator('#resultView')).toBeHidden();
     await walkLight(page,mission.item,mission.blocks!);
     // With all enemies defeated, pickup now extracts automatically without walking back.
     await expect(page.locator('#resultView')).toBeVisible();
   }
   await expect(page.locator('#resultTitle')).toHaveText('クエスト達成！');
   const saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));
   expect(JSON.parse(saved!).cleared).toEqual(missions.slice(0,index+1).map(m=>m.id));
   await page.locator('#resultMap').click();await page.locator('#resultAgain').click();
   expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);
   if(index<missions.length-1)await page.locator('#resultContinue').click();
 }
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lightShadowSave')!));
 expect(saved.wins).toBe(4);expect(saved.materials).toEqual({metal:6,crystal:8});
 expect(errors).toEqual([]);
});
