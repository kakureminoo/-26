import {test,expect} from '@playwright/test';
import {ready,selectCell} from './helpers/driver';

test('ステージ名が戦場で表示されフェードし、説明文を省いた操作へ進む',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#homeGo').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();
 await expect(page.locator('#battleView')).toBeVisible();await expect(page.locator('#questIntroName')).toHaveText('薄明の遺跡');
 await expect(page.locator('#questIntro')).not.toHaveClass(/hidden/);await expect(page.locator('#pass')).toBeDisabled();
 await page.screenshot({path:info.outputPath('quest-intro.png')});await ready(page);await expect(page.locator('#questIntro')).toHaveClass(/hidden/);
 await expect(page.locator('#instruction')).toBeHidden();
 if(info.project.name==='desktop'){await page.locator('#battle').hover();await expect(page.locator('#tilePreview')).toContainText(/消費 (\d+|—)\/6/);await expect(page.locator('#tilePreview')).not.toContainText('Infinity');}
 await page.locator('#pass').click();await expect(page.locator('#attackHelp')).toBeHidden();
 await expect(page.locator('[data-skill="beam"]')).toContainText('◆ 2');await expect(page.locator('[data-skill="attack"]')).not.toContainText('隣接');
 await page.screenshot({path:info.outputPath('compact-battle.png')});expect(errors).toEqual([]);
});

test('敵が残っていても物資確保後にその場から帰還できる',async({page},info)=>{
 test.skip(info.project.name!=='desktop','回収の通しはPC、演出・表示は全サイズで確認');test.setTimeout(120000);
 await page.addInitScript(()=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared:['hunt'],user:1,uxp:2,wins:1,materials:{metal:3,crystal:0},light:{level:1,xp:0,power:0,guard:50,gear:false},shadow:{level:1,xp:0,power:0,guard:50,gear:false}})));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();await page.evaluate(async()=>{const path='/src/game/campaign.ts';const {campaignQuests}=await import(path);const quest=campaignQuests.find((q:any)=>q.id==='relic');quest.spawn={light:{x:10,y:4},shadow:{x:2,y:6}};});
 await page.locator('#homeGo').click();await page.locator('[data-quest-id="relic"] button').click();await page.locator('#questConfirm').click();await ready(page);
 // Controlled start near the item: both enemies are still alive when it is collected.
 await selectCell(page,11,4);
 await ready(page);await expect(page.locator('.enemy-plan')).toHaveCount(2);await expect(page.locator('#extract')).toBeVisible();await expect(page.locator('#resultView')).toBeHidden();
 await expect(page.locator('#lightStatus')).toHaveAttribute('data-x','11');
 await page.screenshot({path:info.outputPath('extract-in-place.png')});await page.locator('#extract').click();await expect(page.locator('#resultTitle')).toHaveText('クエスト達成！');
 await expect(page.locator('#userRank')).toHaveText('RANK 2');await expect(page.locator('#rankXP')).toHaveText('0 / 6 EXP');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lightShadowSave')!));expect(saved.cleared).toEqual(['hunt','relic']);expect(saved.wins).toBe(2);
 await page.locator('#resultMap').click();await page.locator('#resultAgain').click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lightShadowSave')!).wins)).toBe(2);
});
