import {installLegacyPractice} from './helpers/legacy-practice';
import {test,expect,type Page} from '@playwright/test';
import {ready,selectCell,position} from './helpers/driver';
import {campaignQuests} from '../../src/game/campaign';
async function setup(page:Page,mode:'beam'|'veil'|'rune'){
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
 await page.evaluate(async(mode)=>{const path='/src/game/tactics-stage.ts';const q=(await import(path)).tacticsStage;q.blocks=[];q.lights=mode==='veil'?[{x:4,y:3,r:5}]:[];q.lamp={x:13,y:0};q.spawn=mode==='beam'?{light:{x:4,y:4},shadow:{x:3,y:6}}:mode==='veil'?{light:{x:2,y:4},shadow:{x:3,y:6}}:{light:{x:1,y:4},shadow:{x:2,y:6}};q.enemies=[{x:11,y:4,hp:30,boss:true,kind:'eclipseLord'}];Math.random=()=>0;},mode);
 await page.locator('#homeGo').click();await installLegacyPractice(page);await page.locator('[data-area="0"]').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);
}
async function guard(page:Page){await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);}
async function frozen(page:Page){const p=page.locator('.enemy-plan');return [await p.getAttribute('data-target-cells'),await p.getAttribute('data-safe-cells')];}

test('夜蝕の固定予告に、足元を含む光の直線で備える',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page,'beam');const saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave')),before=await frozen(page),plan=page.locator('.enemy-plan');
 await expect(plan).toHaveAttribute('data-plan','nightfall');await expect(plan).toHaveAttribute('data-danger-cells',/4,4/);await expect(page.locator('#hazardNotice')).toContainText('明るさ3〜4');
 await page.locator('#pass').click();await page.locator('[data-skill="beam"]').click();await selectCell(page,5,4);await ready(page);
 await expect(page.locator('#lightStatus .stat-values')).toContainText('4/4');await expect(plan).toContainText('光は安全');await expect(plan).toContainText('影は安全');expect(await frozen(page)).toEqual(before);
 await page.locator('#enemyPlanDetails').evaluate(e=>(e as HTMLDetailsElement).open=true);await page.screenshot({path:info.outputPath('nightfall-light-counter.png'),animations:'disabled'});await page.locator('#enemyPlanDetails').evaluate(e=>(e as HTMLDetailsElement).open=false);
 await guard(page);await expect(page.locator('#round')).toHaveText('第2ターン');await expect(page.locator('#lightStatus')).toContainText('HP 10/10');await expect(page.locator('#shadowStatus')).toContainText('HP 9/9');
 expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);expect(errors).toEqual([]);
});

test('白灼の予告に、足元を含む影の帯で備える',async({page},info)=>{
 test.setTimeout(90000);await setup(page,'veil');
 for(let i=0;i<4;i++)await guard(page);
 await expect(page.locator('#round')).toHaveText('第3ターン');await expect(page.locator('.enemy-plan')).toHaveAttribute('data-plan','solarFlare');await expect(page.locator('#hazardNotice')).toContainText('明るさ0〜1');
 const before=await frozen(page);await page.locator('#orderShadow').click();await selectCell(page,4,5);await ready(page);
 await expect(page.locator('#shadowStatus .stat-values')).toContainText('3/4');await expect(page.locator('.enemy-plan')).not.toContainText('影は安全');
 await page.locator('[data-skill="veil"]').click();await selectCell(page,5,5);await ready(page);
 await expect(page.locator('#shadowStatus .stat-values')).toContainText('0/4');await expect(page.locator('.enemy-plan')).toContainText('影は安全');expect(await frozen(page)).toEqual(before);
 await page.screenshot({path:info.outputPath('solar-shadow-counter.png'),animations:'disabled'});await guard(page);
 await expect(page.locator('#round')).toHaveText('第4ターン');await expect(page.locator('#shadowStatus')).toContainText('HP 9/9');await expect(page.locator('#lightStatus')).toContainText('HP 10/10');
});

test('封印陣へ移動すると無傷、危険な床では通常回避に頼れない',async({page},info)=>{
 await setup(page,'rune');await selectCell(page,2,4);await ready(page);expect(await position(page,'light')).toEqual({x:2,y:4});await expect(page.locator('.enemy-plan')).toContainText('光は安全');
 await expect(page.locator('.enemy-plan')).not.toContainText('回避');await page.screenshot({path:info.outputPath('refuge-counter.png'),animations:'disabled'});
 await page.locator('[data-skill="guard"]').click();await ready(page);await guard(page);
 await expect(page.locator('#lightStatus')).toContainText('HP 10/10');await expect(page.locator('#shadowStatus')).toContainText('HP 7/9');
});

test('旅の理由と光・影の役割を読み、出発する目的を確認できる',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
 await expect(page.locator('#homeStoryCopy')).toContainText('光喰らい');await expect(page.locator('#homeGoal')).toContainText('ゴブリン');
 const saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));await page.screenshot({path:info.outputPath('story-home.png'),animations:'disabled'});await page.locator('#openStory').click();
 await expect(page.locator('#storyDialog')).toBeVisible();await expect(page.locator('#storyBook')).toContainText('均衡');await expect(page.locator('#storyBook')).toContainText('光の猟犬');await expect(page.locator('#storyBook')).toContainText('影の猟犬');await expect(page.locator('.story-ending')).toHaveCount(0);
 expect(await page.locator('#storyDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.screenshot({path:info.outputPath('story-journal.png'),animations:'disabled'});await page.locator('#closeStory').click();await expect(page.locator('#storyDialog')).not.toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);
 await page.locator('#homeGo').click();await page.locator('[data-quest-id="hunt"] button').click();await expect(page.locator('#questDialogBody')).toContainText('住民');await expect(page.locator('#questDialogBody')).toContainText('すべての敵');expect(errors).toEqual([]);
});

test('既存の全踏破セーブから結末を読み返せる',async({page},info)=>{
 test.skip(info.project.name!=='desktop','結末の保存引継ぎはPCで確認');
 await page.addInitScript(cleared=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared,user:5,uxp:0,wins:15,materials:{metal:8,crystal:8},light:{level:5,xp:0,power:0,guard:0,gear:false},shadow:{level:5,xp:0,power:0,guard:0,gear:false}})),campaignQuests.map(q=>q.id));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await expect(page.locator('#homeGoal')).toContainText('支配から解放');const saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));await page.locator('#openStory').click();await expect(page.locator('.story-ending')).toContainText('光喰らいと影喰らいは倒れた');await expect(page.locator('.story-ending')).toContainText('住民はいつものように名前を呼んだ');expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);
});
