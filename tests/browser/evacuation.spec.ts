import {installLegacyPractice} from './helpers/legacy-practice';
import {test,expect,type Page} from '@playwright/test';
import {ready,position} from './helpers/driver';
async function setup(page:Page,boxed=false){
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
 await page.evaluate(async(boxed)=>{const path='/src/game/tactics-stage.ts';const q=(await import(path)).tacticsStage;q.blocks=boxed?[[3,4],[5,4],[4,3],[4,5]]:[];q.lights=[];q.lamp={x:13,y:0};q.spawn={light:{x:4,y:4},shadow:{x:3,y:6}};q.enemies=[{x:11,y:4,hp:30,boss:true,kind:'eclipseLord'}];},boxed);
 await page.locator('#homeGo').click();await installLegacyPractice(page);await page.locator('[data-area="0"]').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);
}
test('危険と避難先を区別し、番号付きの避難先へ通常移動できる',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);const saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));
 await expect(page.locator('#evacuationStatus')).toContainText('現在地は危険');await expect(page.locator('#evacuationTargets button')).toHaveCount(1);await expect(page.locator('[data-escape-x="2"][data-escape-y="4"]')).toContainText('消費6');
 const canvasBox=await page.locator('#battle').boundingBox(),legendBox=await page.locator('#hazardNotice').boundingBox();expect(legendBox!.y).toBeGreaterThanOrEqual(canvasBox!.y+canvasBox!.height-1);
 const before=await page.locator('.enemy-plan').getAttribute('data-target-cells');await page.screenshot({path:info.outputPath('escape-forecast.png'),animations:'disabled'});
 await page.locator('#showTerrain').click();await expect(page.locator('#mapViewport')).toHaveAttribute('data-overlay','terrain');await expect(page.locator('#showTerrain')).toHaveAttribute('aria-pressed','true');expect(await page.locator('.enemy-plan').getAttribute('data-target-cells')).toBe(before);
 await page.screenshot({path:info.outputPath('terrain-only.png'),animations:'disabled'});
 await page.locator('#showForecast').click();await expect(page.locator('#mapViewport')).toHaveAttribute('data-overlay','forecast');await page.locator('#evacuationTargets button').first().click();await ready(page);
 expect(await position(page,'light')).toEqual({x:2,y:4});await expect(page.locator('#pass')).toHaveText('技を使わず終了');await expect(page.locator('#evacuationStatus')).toContainText('現在地は安全');await expect(page.locator('#evacuationTargets button')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('escaped.png'),animations:'disabled'});expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);expect(errors).toEqual([]);
});
test('移動できる避難先がないときは、明暗の技による対処を案内する',async({page})=>{
 await setup(page,true);await expect(page.locator('#evacuationTargets button')).toHaveCount(0);await expect(page.locator('#evacuationStatus')).toContainText('明暗の技で対処');
 await page.locator('#pass').click();await expect(page.locator('#evacuationTargets button')).toHaveCount(0);await expect(page.locator('#showForecast')).toBeEnabled();
});
