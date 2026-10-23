import {installLegacyPractice} from './helpers/legacy-practice';
import {test,expect,type Page} from '@playwright/test';
import {ready,selectCell} from './helpers/driver';
async function practice(page:Page){
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
 await page.locator('#homeGo').click();await installLegacyPractice(page);await page.locator('[data-area="0"]').click();await page.locator('[data-quest-id="hunt"] button').click();await expect(page.locator('#questDialog')).toContainText('影鎧兵');await page.locator('#questConfirm').click();await ready(page);
}
async function move(page:Page,x:number,y:number){await selectCell(page,x,y);await ready(page);}
async function skill(page:Page,name:RegExp,x:number,y:number){await page.getByRole('button',{name}).click();await selectCell(page,x,y);await ready(page);}
async function frozenTargets(page:Page){return page.locator('.enemy-plan').evaluateAll(nodes=>nodes.map(e=>[e.getAttribute('data-plan'),e.getAttribute('data-target-cells'),e.getAttribute('data-destination')]));}

test('行動順を選び、遮蔽物で固定予告を防ぐ',async({page},info)=>{
 await practice(page);const saved=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));
 await expect(page.locator('#enemyPlanSummary')).toHaveText('敵の予告：攻撃 1／移動 1');
 const before=await frozenTargets(page);
 await page.locator('#orderShadow').click();await expect(page.locator('#phaseTitle')).toHaveText('影の行動');
 await expect(page.locator('#orderLight')).toBeEnabled();
 await page.locator('#pass').click();await expect(page.locator('#orderLight')).toBeDisabled();
 await skill(page,/遮蔽物を置く/,5,4);
 await expect(page.locator('#phaseTitle')).toHaveText('光の行動');
 await expect(page.locator('[data-enemy-id="0"].enemy-plan')).toHaveAttribute('data-status','blocked');
 await expect(page.locator('[data-enemy-id="1"].enemy-plan')).toContainText('命中する相棒なし');
 expect(await frozenTargets(page)).toEqual(before);
 await page.locator('#enemyPlanDetails').evaluate(e=>(e as HTMLDetailsElement).open=true);
 await page.screenshot({path:info.outputPath('wall-counter.png')});
 await page.locator('#enemyPlanDetails').evaluate(e=>(e as HTMLDetailsElement).open=false);
 await page.locator('#pass').click();await page.getByRole('button',{name:/防御/}).click();await ready(page);
 await expect(page.locator('#round')).toHaveText('第2ターン');await expect(page.locator('#orderShadow')).toBeEnabled();
 await expect(page.locator('#lightStatus')).toContainText('HP 10/10');await expect(page.locator('#shadowStatus')).toContainText('HP 9/9');
 expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(saved);
});

test('影の帯で灯射兵を暗くし、射撃を中止させる',async({page})=>{
 await practice(page);const before=await frozenTargets(page);
 await page.locator('#orderShadow').click();await move(page,5,4);
 await skill(page,/影の帯/,8,4);
 await expect(page.locator('[data-enemy-id="1"].enemy-plan')).toHaveAttribute('data-status','dark');
 await expect(page.locator('[data-enemy-id="1"].enemy-plan')).toContainText('射撃中止');
 expect(await frozenTargets(page)).toEqual(before);
 await page.locator('#pass').click();await page.getByRole('button',{name:/防御/}).click();await ready(page);
 await expect(page.locator('#round')).toHaveText('第2ターン');await expect(page.locator('#lightStatus')).toContainText('HP 10/10');
});

test('光から灯火を移し、影の攻撃前に鎧を解除できる',async({page})=>{
 await practice(page);await expect(page.locator('[data-enemy-id="0"].enemy-plan')).toContainText('防御2');
 await page.locator('#pass').click();await skill(page,/灯火を移す/,6,3);
 await expect(page.locator('[data-enemy-id="0"].enemy-plan')).toContainText('鎧が解除');
 await move(page,6,5);await expect(page.locator('#attackTargets button[data-enemy-id="0"]')).toContainText('HP 5 → 3');
 await page.locator('#attackTargets button[data-enemy-id="0"]').click();await ready(page);
 await expect(page.locator('[data-enemy-id="0"].enemy-plan')).toContainText('HP 3/5');
});

test('固定能力の演習を連携でクリアしても、育成・素材・進行を変えない',async({page})=>{
 test.setTimeout(60000);await practice(page);const before=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));
 // Round 1: shadow blocks both the advance and line of fire; light repositions the lamp.
 await page.locator('#orderShadow').click();await page.locator('#pass').click();await skill(page,/遮蔽物を置く/,5,4);
 await move(page,4,3);await skill(page,/灯火を移す/,6,3);
 await expect(page.locator('#round')).toHaveText('第2ターン');
 // Round 2: exposed armor allows both dogs to remove the guard.
 await page.locator('#orderShadow').click();await move(page,6,5);await page.locator('#attackTargets button[data-enemy-id="0"]').click();await ready(page);
 await move(page,6,3);await page.locator('#attackTargets button[data-enemy-id="0"]').click();await ready(page);
 await expect(page.locator('#round')).toHaveText('第3ターン');
 // The archer reserved a route around the guard's planned move; killing the guard does not retarget that move.
 await expect(page.locator('[data-enemy-id="1"].enemy-plan')).toHaveAttribute('data-x','8');
 await expect(page.locator('[data-enemy-id="1"].enemy-plan')).toHaveAttribute('data-y','5');
 // Round 3: shadow approaches from the side, then light finishes from the north.
 await page.locator('#orderShadow').click();await move(page,7,5);await page.locator('#attackTargets button[data-enemy-id="1"]').click();await ready(page);
 await move(page,8,4);await page.locator('#attackTargets button[data-enemy-id="1"]').click();await ready(page);
 await expect(page.locator('#resultTitle')).toHaveText('演習達成！');await expect(page.locator('#resultRewards')).toBeHidden();
 expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(before);
});
