import {activities} from '../../src/game/activities';
import {test,expect,type Page} from '@playwright/test';
import {campaignQuests} from '../../src/game/campaign';
import {ready,selectCell,position} from './helpers/driver';
async function start(page:Page,old=false){
 if(old)await page.addInitScript(cleared=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared,introSeen:true,user:4,uxp:2,wins:15,materials:{metal:11,crystal:13},light:{level:4,xp:2,power:7,guard:5,gear:false},shadow:{level:3,xp:1,power:4,guard:3,gear:false}})),campaignQuests.map(q=>q.id));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
}
test('クエストを3分類にまとめ、条件・報酬・説明を区別する',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 await page.screenshot({path:info.outputPath('home.png'),animations:'disabled'});await expect(page.locator('#homeTrain')).toHaveCount(0);await expect(page.locator('#homeActivities')).toHaveCount(0);await page.locator('#homeGo').click();
 await expect(page.locator('#baseView')).not.toContainText('EXPLORE THE WORLD');await expect(page.locator('#baseTabs')).not.toContainText('訓練場');await expect(page.locator('#baseTabs')).not.toContainText('冒険と試練');
 await expect(page.locator('#questCategories [role="tab"]')).toHaveCount(3);await expect(page.locator('#missions [data-quest-id]')).toHaveCount(5);await expect(page.locator('.area-mark').first()).toHaveText('Ⅰ');
 const card=page.locator('[data-quest-id="hunt"]');await expect(card.locator('.quest-description')).toContainText('魔物');await expect(card.locator('.quest-target')).toContainText('すべての敵を倒す');await expect(card.locator('.quest-loot')).toContainText('金属片 ×3');
 await page.screenshot({path:info.outputPath('story.png'),animations:'disabled'});
 await page.locator('#categoryEndgame').click();await expect(page.locator('#activitiesPanel')).toBeVisible();await expect(page.locator('#mainQuestContent')).toBeHidden();await expect(page.locator('[data-activity]')).toHaveCount(activities.length);await page.screenshot({path:info.outputPath('endgame.png'),animations:'disabled'});
 await page.locator('#categoryTutorial').click();await expect(page.locator('[data-tutorial-quest="hunt"]')).toContainText('薄明の遺跡');await expect(page.locator('#tutorialContent')).not.toContainText('明暗の連携演習');await page.screenshot({path:info.outputPath('tutorial.png'),animations:'disabled'});
 expect(await page.locator('#journeyPanel').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);expect(errors).toEqual([]);
});
test('最初の本編ステージに操作ガイドが付き、任意に閉じられる',async({page},info)=>{
 await start(page);await page.locator('#homeGo').click();await page.locator('[data-quest-id="hunt"] button').click();
 await expect(page.locator('#questDialog .quest-target')).toContainText('クリア条件');await expect(page.locator('#questDialog .quest-loot')).toContainText('報酬');await page.screenshot({path:info.outputPath('departure.png'),animations:'disabled'});
 await page.locator('#questConfirm').click();await ready(page);await expect(page.locator('#tutorialGuide')).toBeVisible();await expect(page.locator('#tutorialGuideTitle')).toHaveText('行き先を選ぶ');
 const p=await position(page,'light');await selectCell(page,p.x,p.y);await ready(page);await expect(page.locator('#tutorialGuideTitle')).toHaveText('技を一つ選ぶ');await page.screenshot({path:info.outputPath('first-battle.png'),animations:'disabled'});
 await page.locator('#dismissTutorial').click();await expect(page.locator('#tutorialGuide')).toBeHidden();
 await page.locator('#restart').click();await page.locator('#questConfirm').click();await page.locator('#resultHome').click();
 await page.locator('#homeGo').click();await page.locator('#categoryTutorial').click();await page.locator('[data-tutorial-quest="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);await expect(page.locator('#missionName')).toHaveText('薄明の遺跡');await expect(page.locator('#tutorialGuide')).toBeVisible();
});
test('分類のキーボード操作と旧育成データの保持を確認する',async({page})=>{
 await start(page,true);const before=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));await page.locator('#homeGo').click();
 await page.locator('#categoryStory').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#categoryEndgame')).toBeFocused();await expect(page.locator('#activitiesPanel')).toBeVisible();
 await page.locator('[data-panel="forge"]').click();await page.locator('[data-panel="journey"]').click();await expect(page.locator('#categoryEndgame')).toHaveAttribute('aria-selected','true');
 await page.locator('#categoryTutorial').click();expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(before);await page.locator('[data-tutorial-quest="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);await expect(page.locator('#lightStatus')).toContainText('HP 19/19');await expect(page.locator('#tutorialGuide')).toBeVisible();
 const p=await page.evaluate(()=>JSON.parse(localStorage.getItem('lightShadowSave')!));expect(p.light.power).toBe(7);expect(p.light.guard).toBe(5);expect(p.materials).toEqual({metal:11,crystal:13});
});
