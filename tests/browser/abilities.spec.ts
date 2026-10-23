import {installLegacyPractice} from './helpers/legacy-practice';
import {test,expect} from '@playwright/test';
import {ready,selectCell} from './helpers/driver';
import {campaignQuests} from '../../src/game/campaign';

test('相棒の名前を安全に表示・保存し、既存の育成を維持する',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
 await page.locator('[data-companion="light"]').click();
 await page.locator('#companionName').fill('ハル<光>あいうえおかき');await page.locator('#saveCompanionName').click();
 await expect(page.locator('#companionTitle')).toHaveText('ハル<光>あいうえおかき');await expect(page.locator('#nameFeedback')).toContainText('保存しました');
 await page.screenshot({path:info.outputPath('named-companion.png')});
 await page.locator('#closeCompanion').click();await expect(page.locator('[data-companion="light"]')).toContainText('ハル<光>あいうえおかき');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lightShadowSave')!));
 expect(saved.light.name).toBe('ハル<光>あいうえおかき');expect(saved.light.level).toBe(1);expect(saved.materials).toEqual({metal:0,crystal:0});
 await page.reload();await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await expect(page.locator('[data-companion="light"]')).toContainText('ハル<光>あいうえおかき');
 await page.locator('#homeGo').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();
 await expect(page.locator('#lightStatus')).toContainText('ハル<光>あいうえおかき');expect(errors).toEqual([]);
});

test('戦闘レイアウトと合体技・静止強化を演習で使い、保存を変更しない',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
 const home=await page.locator('#homeScene').boundingBox();await page.screenshot({path:info.outputPath('home-layout.png')});
 await page.locator('#homeGo').click();await installLegacyPractice(page);await page.locator('[data-area="0"]').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();
 await expect(page.locator('body')).toHaveClass(/in-battle/);
 const saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));
 await page.locator('#orderShadow').click();await selectCell(page,5,4);await ready(page);
 await expect(page.locator('[data-skill="combo"]')).toBeEnabled();await expect(page.locator('#bondStatus')).toContainText('発動可能');
 await page.screenshot({path:info.outputPath('battle-combo-ready.png')});
 await page.locator('[data-skill="combo"]').click();await expect(page.locator('#actionCue')).toContainText('双極の奔流');
 await page.screenshot({path:info.outputPath('combo-effect.png')});await ready(page);
 await expect(page.locator('#charge')).toHaveText('チャージ 0/3');
 await expect(page.locator('#bondStatus')).toContainText('使用済み');
 for(let i=0;i<3;i++){await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);}
 await expect(page.locator('#round')).toHaveText('第3ターン');await expect(page.locator('#bondStatus')).toContainText('光 攻撃＋1');
 expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const map=await page.locator('#mapViewport').boundingBox();expect(map!.height).toBeGreaterThan(160);expect(home!.width).toBeGreaterThan(0);
 expect(errors).toEqual([]);
});

test('森で特殊敵が固定した予告を実行し、囮を生成する',async({page},info)=>{
 test.setTimeout(60000);
 await page.addInitScript((cleared)=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared,wins:15,user:5,uxp:0,materials:{metal:20,crystal:20},light:{level:5,xp:0,power:0,guard:5,gear:false},shadow:{level:5,xp:0,power:0,guard:5,gear:false}})),campaignQuests.map(q=>q.id));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.evaluate(async()=>{const path='/src/game/campaign.ts';const q=(await import(path)).campaignQuests.find((q:any)=>q.id==='forest-ember');q.enemies[0]={...q.enemies[0],x:2,y:4,hp:1};});await page.locator('#homeGo').click();await page.locator('[data-area="1"]').click();await page.locator('[data-quest-id="forest-ember"] button').click();await page.locator('#questConfirm').click();
 await ready(page);await page.locator('#pass').click();await page.locator('#attackTargets button[data-enemy-id]').first().click();await ready(page);await expect(page.locator('#objective')).toContainText('2/3');
 await expect(page.locator('.enemy-plan[data-plan="summon"]')).toHaveCount(1);await expect(page.locator('.enemy-plan[data-plan="warp"]')).toHaveCount(1);
 const warperID=await page.locator('.enemy-plan[data-plan="warp"]').getAttribute('data-enemy-id');
 const destination=await page.locator('.enemy-plan[data-plan="warp"]').getAttribute('data-destination');
 await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);
 await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);
 await expect(page.locator('#round')).toHaveText('第3ターン');await expect(page.locator('.enemy-plan')).toHaveCount(3);
 await expect(page.locator('.enemy-plan').filter({hasText:'幻影の囮'})).toContainText('幻影の囮');
 const [x,y]=destination!.split(',');await expect(page.locator('.enemy-plan[data-enemy-id="'+warperID+'"]')).toHaveAttribute('data-x',x);await expect(page.locator('.enemy-plan[data-enemy-id="'+warperID+'"]')).toHaveAttribute('data-y',y);
 await page.locator('#enemyPlanDetails').evaluate(e=>(e as HTMLDetailsElement).open=true);await page.screenshot({path:info.outputPath('special-enemies.png')});expect(errors).toEqual([]);
});

test('影縛りは次の1手番だけを省略し、連続拘束で進行を止めない',async({page})=>{
 test.setTimeout(90000);
 await page.addInitScript((cleared)=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared,wins:15,user:5,uxp:0,materials:{metal:20,crystal:20},light:{level:5,xp:0,power:0,guard:20,gear:false},shadow:{level:5,xp:0,power:0,guard:20,gear:false}})),campaignQuests.map(q=>q.id));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
 await page.locator('#homeGo').click();await page.locator('[data-area="1"]').click();await page.locator('[data-quest-id="forest-edge"] button').click();await page.locator('#questConfirm').click();
 let target='';
 for(let i=0;i<14;i++){
  const bind=page.locator('.enemy-plan[data-plan="bind"]');
  if(await bind.count())target=(await bind.first().getAttribute('data-target-cells'))!;
  const round=await page.locator('#round').textContent();
  do {await ready(page);await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);}while(await page.locator('#round').textContent()===round);
  if(target)break;
 }
 expect(target).not.toBe('');
 const kind=await page.locator('#lightStatus').evaluate((e,target)=>e.getAttribute('data-x')+','+e.getAttribute('data-y')===target?'light':'shadow',target);
 await expect(page.locator(kind==='light'?'#orderLight':'#orderShadow')).toBeDisabled();await expect(page.locator('#bondStatus')).toContainText('行動不能');
 await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);
 await expect(page.locator(kind==='light'?'#orderLight':'#orderShadow')).toBeEnabled();
});
