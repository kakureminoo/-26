import {test,expect} from '@playwright/test';
import {campaignQuests} from '../../src/game/campaign';
test('初回の序章を読み進め、スキップして読み返せる',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#titleStart').click();await expect(page.locator('#prologueDialog')).toBeVisible();
 await expect(page.locator('#prologueHeading')).toHaveText('名前を呼ぶ声');await expect(page.locator('#prologueBack')).toBeDisabled();
 await page.locator('#prologueNext').click();await expect(page.locator('#prologueCopy')).toContainText('光喰らいと影喰らい');
 await page.locator('#prologueBack').click();await expect(page.locator('#prologueCount')).toHaveText('1 / 4');
 await page.locator('#prologueSkip').click();await expect(page.locator('#prologueDialog')).toBeHidden();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lightShadowSave')!));expect(saved.introSeen).toBe(true);expect(saved.cleared).toEqual([]);expect(saved.wins).toBe(0);
 await expect(page.locator('#liberationProgress')).toContainText('要所の解放 0 / 3');
 await page.locator('#openStory').click();await page.locator('#replayPrologue').click();
 for(let i=0;i<3;i++)await page.locator('#prologueNext').click();await expect(page.locator('#prologueNext')).toContainText('旅をはじめる');
 await page.screenshot({path:info.outputPath('prologue.png'),animations:'disabled'});await page.locator('#prologueNext').click();
 await page.reload();await page.locator('#titleStart').click();await expect(page.locator('#prologueDialog')).toBeHidden();expect(errors).toEqual([]);
});
test('要所の達成記録から能力と二体の最終決戦へ進む',async({page},info)=>{
 await page.addInitScript(cleared=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared,wins:14,user:5,uxp:0,materials:{metal:8,crystal:8},light:{level:5,xp:0,power:0,guard:0,gear:false},shadow:{level:5,xp:0,power:0,guard:0,gear:false}})),campaignQuests.slice(0,24).map(q=>q.id));
 await page.goto('/');await page.locator('#titleStart').click();await expect(page.locator('#prologueDialog')).toBeHidden();
 await expect(page.locator('#liberationProgress')).toContainText('要所の解放 3 / 3');await expect(page.locator('#liberationProgress')).toContainText('城の中枢');
 await page.locator('#homeGo').click();await expect(page.locator('[data-quest-id="tactics"]')).toHaveCount(0);
 await page.locator('[data-quest-id="castle-heart"] button').click();await expect(page.locator('#questDialogBody')).toContainText('両方');await page.locator('#questConfirm').click();
 await expect(page.locator('.enemy-plan').filter({hasText:'光喰らい'})).toContainText('白灼');await expect(page.locator('.enemy-plan').filter({hasText:'影喰らい'})).toContainText('夜蝕');
 await page.screenshot({path:info.outputPath('dual-boss.png'),animations:'disabled'});
 expect(await page.locator('#battleView').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});
