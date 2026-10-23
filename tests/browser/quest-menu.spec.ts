import {test,expect} from '@playwright/test';
import {campaignQuests} from '../../src/game/campaign';

test('タイトルから拠点、5エリア各5クエストとチュートリアルへ遷移する',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#titleView')).toBeVisible();await expect(page.locator('#gameShell')).toBeHidden();
 await page.screenshot({path:info.outputPath('title.png'),animations:'disabled'});
 await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await expect(page.locator('#titleView')).toBeHidden();await expect(page.locator('#homeView')).toBeVisible();
 await expect(page.locator('header')).not.toContainText('光と影の猟犬');await expect(page.locator('#homeView')).not.toContainText('明暗の連携演習');
 await page.locator('#homeGo').click();await expect(page.locator('#baseView')).toBeVisible();await expect(page.locator('#questDialog')).not.toBeVisible();await expect(page.locator('#battleView')).toBeHidden();
 await expect(page.locator('[data-area]')).toHaveCount(5);
 for(let area=0;area<5;area++){
  await page.locator('[data-area="'+area+'"]').click();await expect(page.locator('[data-quest-id]')).toHaveCount(5);
  for(const q of campaignQuests.filter(q=>q.area===area)){await expect(page.locator('[data-quest-id="'+q.id+'"]')).toContainText(q.name);if(q.id!=='hunt')await expect(page.locator('[data-quest-id="'+q.id+'"] button')).toBeDisabled();}
  await expect(page.locator('[data-quest-id="tactics"]')).toHaveCount(0);
 }
 await page.screenshot({path:info.outputPath('quest-menu.png')});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('[data-category="tutorial"]').click();await page.locator('[data-tutorial-quest="hunt"] button').click();await page.locator('#questConfirm').click();await expect(page.locator('#missionName')).toHaveText('薄明の遺跡');expect(errors).toEqual([]);
});

test('旧4クエストのセーブを引き継ぎ、未攻略のエリアの開放条件を守る',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared:['hunt','relic','rescue','boss'],wins:4,user:2,uxp:1,materials:{metal:6,crystal:8},light:{level:2,xp:1,power:0,guard:0,gear:false},shadow:{level:2,xp:1,power:0,guard:0,gear:false}})));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await expect(page.locator('#homeCompletion')).toHaveText('4 / 25');await expect(page.locator('#homeRoster')).toBeEnabled();
 await page.locator('#homeGo').click();await expect(page.locator('[data-quest-id="city-gate"] button')).toBeEnabled();await page.locator('[data-area="1"]').click();await expect(page.locator('[data-quest-id="forest-edge"] button')).toBeDisabled();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lightShadowSave')!));expect(saved.cleared).toEqual(['hunt','relic','rescue','boss']);expect(saved.materials).toEqual({metal:6,crystal:8});
});

test('全25クエストを選択して実際の戦場に出発できる',async({page},info)=>{
 test.skip(info.project.name!=='desktop','全盤面の起動はPCで確認');test.setTimeout(180000);
 await page.addInitScript((cleared)=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared,wins:15,user:5,uxp:0,materials:{metal:20,crystal:20},light:{level:5,xp:0,power:0,guard:0,gear:false},shadow:{level:5,xp:0,power:0,guard:0,gear:false}})),campaignQuests.map(q=>q.id));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
 for(const q of campaignQuests){await page.locator('#homeGo').click();await page.locator('[data-area="'+q.area+'"]').click();await page.locator('[data-quest-id="'+q.id+'"] button').click();await page.locator('#questConfirm').click();await expect(page.locator('#missionName')).toHaveText(q.name);await expect(page.locator('#objective')).toContainText('クリア条件：');await page.locator('#restart').click();await page.locator('#questConfirm').click();await page.locator('#resultHome').click();}
 expect(errors).toEqual([]);
});
