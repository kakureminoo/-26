import {installLegacyPractice} from './helpers/legacy-practice';
import {test,expect} from '@playwright/test';
import {ready,selectCell} from './helpers/driver';

test('左上のランクと経験値バーを引き継ぎ、素材BGMを再生し、画面の戻り道を保つ',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared:['hunt'],user:2,uxp:4,wins:1,materials:{metal:3,crystal:0},light:{level:1,xp:0,power:0,guard:0,gear:false},shadow:{level:1,xp:0,power:0,guard:0,gear:false}})));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await expect(page.locator('#userRank')).toHaveText('RANK 2');await expect(page.locator('#rankXP')).toHaveText('4 / 6 EXP');
 await expect(page.locator('#rankMeter')).toHaveAttribute('aria-valuenow','4');await expect(page.locator('.header-nav')).toHaveCount(0);
 const rank=await page.locator('.user-rank').boundingBox();expect(rank!.x).toBeLessThan(30);
 await expect.poll(()=>page.evaluate(async()=>{const path='/src/audio/sfx.js';return (await import(path)).Sfx.state().currentMusic}),{timeout:20000}).toBe('home');
 await page.locator('#preferences').click();await page.locator('#musicVolume').fill('25');await page.locator('#effectsVolume').fill('65');await page.locator('#closePreferences').click();
 await page.locator('#homeGo').click();await page.locator('#baseBack').click();await expect(page.locator('#homeView')).toBeVisible();
 await page.screenshot({path:info.outputPath('rank-home.png')});
 await page.locator('#homeGo').click();await installLegacyPractice(page);await page.locator('[data-area="0"]').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);
 await expect.poll(()=>page.evaluate(async()=>{const path='/src/audio/sfx.js';return (await import(path)).Sfx.state().currentMusic}),{timeout:20000}).toBe('battle');
 const sound=await page.evaluate(async()=>{const path='/src/audio/sfx.js';return (await import(path)).Sfx.state()});expect(sound.error).toBe('');expect(sound.musicVolume).toBe(.25);expect(sound.effectsVolume).toBe(.65);
 await page.locator('#audioToggle').click();await expect(page.locator('#audioToggle')).toHaveText('音 OFF');await page.locator('#audioToggle').click();
 await page.screenshot({path:info.outputPath('rank-battle.png')});expect(errors).toEqual([]);
});

test('遮蔽物を攻撃して壊すと、同じ敵予告の射線が開く',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
 await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
 await page.evaluate(async()=>{const path='/src/game/tactics-stage.ts';const {tacticsStage:q}=await import(path);q.blocks=[[5,4]];q.spawn={light:{x:4,y:4},shadow:{x:6,y:4}};q.enemies=[{x:7,y:4,hp:8,kind:'sunArcher'}];q.lights=[{x:7,y:3,r:4}];q.lamp={x:3,y:3};});
 await page.locator('#homeGo').click();await installLegacyPractice(page);await page.locator('[data-area="0"]').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);
 await expect(page.locator('.enemy-plan')).toHaveAttribute('data-plan','ray');await expect(page.locator('.enemy-plan')).toHaveAttribute('data-status','ready');
 const saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));
 await page.locator('#pass').click();await expect(page.locator('[data-block-x="5"]')).toContainText('耐久 3');
 await page.locator('[data-block-x="5"]').click();await ready(page);
 // The starting light dog has attack 3 here: one hit opens the route.
 await expect(page.locator('#lastLog')).toContainText('破壊');
 await expect(page.locator('#enemyPlans')).toContainText('光に最大');
 expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);expect(errors).toEqual([]);
});

test('灯術師・影織り師が固定した予告マスの明暗を変える',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
 await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
 await page.evaluate(async()=>{const path='/src/game/tactics-stage.ts';const {tacticsStage:q}=await import(path);q.blocks=[];q.spawn={light:{x:4,y:4},shadow:{x:2,y:6}};q.lamp={x:1,y:1};q.lights=[{x:2,y:5,r:4}];q.enemies=[{x:7,y:4,hp:9,kind:'lightWarden'},{x:3,y:7,hp:9,kind:'shadowWeaver'}];});
 await page.locator('#homeGo').click();await installLegacyPractice(page);await page.locator('[data-area="0"]').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);
 await expect(page.locator('.enemy-plan[data-plan="illuminate"]')).toHaveCount(1);await expect(page.locator('.enemy-plan[data-plan="darken"]')).toHaveCount(1);
 const plans=await page.locator('.enemy-plan').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-target-cells')));const saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));
 expect(plans[0]).toContain('4,4');expect(plans[1]).toContain('2,6');
 for(let i=0;i<2;i++){await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);}
 await expect(page.locator('#round')).toHaveText('第2ターン');await expect(page.locator('#lightStatus .stat-values')).toContainText('4/4');await expect(page.locator('#shadowStatus .stat-values')).toContainText('0/4');
 expect(plans[0]).toContain('4,4');expect(plans[1]).toContain('2,6');
 await expect(page.locator('.enemy-plan[data-plan="illuminate"]')).toHaveCount(0);await expect(page.locator('.enemy-plan[data-plan="darken"]')).toHaveCount(0);
 await page.locator('#enemyPlanDetails').evaluate(e=>(e as HTMLDetailsElement).open=true);await page.screenshot({path:info.outputPath('enemy-light.png')});
 expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);expect(errors).toEqual([]);
});

test('暗幕で後続の灯射兵が撃てなくなる予測と実行が一致する',async({page})=>{
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
 await page.evaluate(async()=>{const path='/src/game/tactics-stage.ts';const {tacticsStage:q}=await import(path);q.blocks=[];q.spawn={light:{x:4,y:5},shadow:{x:2,y:6}};q.lamp={x:1,y:1};q.lights=[{x:4,y:4,r:5}];q.enemies=[{x:6,y:4,hp:9,kind:'shadowWeaver'},{x:4,y:4,hp:9,kind:'sunArcher'}];});
 await page.locator('#homeGo').click();await installLegacyPractice(page);await page.locator('[data-area="0"]').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);
 await expect(page.locator('.enemy-plan[data-enemy-id="1"]')).toHaveAttribute('data-plan','ray');await expect(page.locator('.enemy-plan[data-enemy-id="1"]')).toHaveAttribute('data-status','dark');
 for(let i=0;i<2;i++){await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);}
 await expect(page.locator('#round')).toHaveText('第2ターン');await expect(page.locator('#lightStatus')).toContainText('HP 10/10');await expect(page.locator('#shadowStatus')).toContainText('HP 9/9');
});
