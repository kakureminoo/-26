import {installLegacyPractice} from './helpers/legacy-practice';
import {test,expect} from '@playwright/test';
import {ready,selectCell,position} from './helpers/driver';
async function setup(page:any,displace=false){
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
 await page.evaluate(async(displace:boolean)=>{const path='/src/game/tactics-stage.ts';const q=(await import(path)).tacticsStage;q.lights=displace?[{x:6,y:0,r:4}]:[];q.lamp={x:13,y:0};q.blocks=[];q.spawn={light:{x:4,y:4},shadow:{x:6,y:4}};q.enemies=displace?[{x:7,y:4,hp:20,kind:'displacer'},{x:6,y:0,hp:20,kind:'sunArcher'}]:[{x:5,y:4,hp:20}];},displace);
 await page.locator('#homeGo').click();await installLegacyPractice(page);await page.locator('[data-area="0"]').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);
}
test('自分のマスで移動を省略し、挟み撃ち専用技を二匹で放つ',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);const saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));
 await selectCell(page,4,4);await expect(page.locator('#pass')).toHaveText('技を使わず終了');expect(await position(page,'light')).toEqual({x:4,y:4});
 await expect(page.locator('#actions button')).toHaveCount(4);await expect(page.locator('[data-skill="attack"]')).toContainText('双牙の交差');await expect(page.locator('#attackTargets button').first()).toContainText('HP 20 → 13');await page.locator('#attackTargets button').first().click();
 await page.screenshot({path:info.outputPath('pincer.png')});await ready(page);
 // Light attack 1 and shadow attack 4 in darkness; each gains +1 for the dedicated skill.
 await expect(page.locator('.enemy-plan')).toContainText('HP 13/20');await expect(page.locator('#charge')).toHaveText('チャージ 3/3');
 await selectCell(page,6,4);await expect(page.locator('#pass')).toHaveText('技を使わず終了');await expect(page.locator('[data-skill="pincer"]')).toHaveCount(0);await expect(page.locator('[data-skill="attack"]')).toContainText('双牙の交差');await expect(page.locator('#attackTargets button').first()).toContainText('HP 13 → 6');await page.locator('#attackTargets button').first().click();await ready(page);await expect(page.locator('#charge')).toHaveText('チャージ 3/3');
 expect(await position(page,'shadow')).toEqual({x:6,y:4});expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);expect(errors).toEqual([]);
});
test('転位師が固定予告先へ猟犬を移し、予告マスを離れると回避できる',async({page},info)=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page,true);
 const plan=page.locator('.enemy-plan[data-enemy-id="0"]');await expect(plan).toHaveAttribute('data-plan','displace');const dest=(await plan.getAttribute('data-destination'))!.split(',').map(Number),saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));
 await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);
 await page.locator('#pass').click();
 // The transfer is forecast before a fixed ray. The forecast must use the new brightness and location.
 await expect(page.locator('.enemy-plan[data-enemy-id="1"]')).toHaveAttribute('data-plan','ray');
 await expect(page.locator('.enemy-plan[data-enemy-id="1"]')).toContainText('影に最大2ダメージ');
 await expect(page.locator('.enemy-plan[data-enemy-id="1"]')).not.toContainText('回避');
 await page.locator('[data-skill="guard"]').click();await ready(page);
 await expect(page.locator('#shadowStatus')).toContainText('HP 8/9');
 expect(await position(page,'shadow')).toEqual({x:dest[0],y:dest[1]});await expect(page.locator('#round')).toHaveText('第2ターン');await expect(plan).not.toHaveAttribute('data-plan','displace');
 await page.screenshot({path:info.outputPath('displaced.png')});expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);
 // Restart the controlled practice and leave the fixed source cell before enemy resolution.
 await page.locator('#restart').click();await page.locator('#questConfirm').click();await page.locator('#resultContinue').click();await page.locator('#questConfirm').click();await ready(page);
 await page.locator('#orderShadow').click();await selectCell(page,6,5);await ready(page);await page.locator('[data-skill="guard"]').click();await ready(page);
 await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);
 expect(await position(page,'shadow')).toEqual({x:6,y:5});await expect(page.locator('#log')).toContainText('転位師の技は空振り');expect(errors).toEqual([]);
});
