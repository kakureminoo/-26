import {activities} from '../../src/game/activities';
import {test,expect,type Page} from '@playwright/test';
import {campaignQuests} from '../../src/game/campaign';
import {ready,position,selectCell} from './helpers/driver';
async function setup(page:Page){
 await page.addInitScript(cleared=>{if(!localStorage.getItem('lightShadowSave'))localStorage.setItem('lightShadowSave',JSON.stringify({cleared,wins:15,user:5,uxp:0,materials:{metal:12,crystal:14},introSeen:true,light:{level:1,xp:0,power:20,guard:0,ownedEquipment:['fang'],equipment:'fang'},shadow:{level:1,xp:0,power:20,guard:0,ownedEquipment:['fang'],equipment:'fang'},expansion:{shards:30,sigils:{wind:1,stone:1},sockets:{light:{},shadow:{}}}}));},campaignQuests.map(q=>q.id));
 await page.goto('/');await page.locator('#titleStart').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
}
async function launch(page:Page,id:string){await page.locator('#homeGo').click();await page.locator('[data-category="endgame"]').click();await page.locator('[data-activity="'+id+'"] button').click();await page.locator('#questConfirm').click();await ready(page);}
async function guard(page:Page){await ready(page);await page.locator('#pass').click();await page.locator('[data-skill="guard"]').click();await ready(page);}
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('lightShadowSave')!));
test('刻印の抽選・希少保証・装着と図鑑を保存し、戦闘能力に反映する',async({page},info)=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);const original=await saved(page);
 await page.locator('#homeSigils').click();await page.locator('[data-gacha-tab="sigils"]').click();await page.evaluate(()=>Math.random=()=>0);
 await page.locator('#drawSigil').click();for(let i=0;i<10;i++){await page.locator('#skipSigilReveal').click();if(i<9)await page.locator('#drawSigilAgain').click();else await page.locator('#closeSigilReveal').click();}await expect(page.locator('#shardBalance')).toHaveText('灯の欠片 0');await expect(page.locator('#gachaNotice')).toContainText('保存');await expect(page.locator('#drawSigil')).toBeDisabled();
 await page.locator('#closeGacha').click();await page.locator('#homeRoster').click();await page.locator('[data-train-open="dawn"]').click();await page.locator('#growthSigil').selectOption('wind');await page.locator('#closeTraining').click();await page.locator('[data-train-open="dusk"]').click();await page.locator('#growthSigil').selectOption('wind');await expect(page.locator('#hubNotice')).toContainText('使用中');await page.locator('#closeHub').click();
 let p=await saved(page);expect(p.expansion.sigils.spark).toBe(9);expect(p.expansion.sigils.life).toBe(1);expect(p.expansion.sockets.light.fang).toBe('wind');expect(p.expansion.sockets.shadow.fang).toBeUndefined();expect(p.cleared).toEqual(original.cleared);expect(p.materials).toEqual(original.materials);
 await page.screenshot({path:info.outputPath('inscriptions.png'),animations:'disabled'});
 await page.locator('#homeCollection').click();await expect(page.locator('#collectionPanel')).toContainText('装備 1 / 8');await expect(page.locator('#collectionPanel')).toContainText('地域の遺物 3 / 7');await page.screenshot({path:info.outputPath('collection.png'),animations:'disabled'});expect(await page.locator('#collectionPanel').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.reload();await page.locator('#titleStart').click();await launch(page,'heights');await expect(page.locator('#lightStatus')).toContainText('移 7');expect(errors).toEqual([]);
});
test('7種の追加ステージへ出発でき、固定試練は育成と刻印を持ち込まない',async({page},info)=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);await page.locator('#homeGo').click();await page.locator('[data-category="endgame"]').click();await expect(page.locator('[data-activity]')).toHaveCount(activities.length);await page.screenshot({path:info.outputPath('activities.png'),animations:'disabled'});expect(await page.locator('#activitiesPanel').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 for(const id of ['expedition','puzzle','defense','request','trial','rematch','heights']){
  await page.locator('[data-activity="'+id+'"] button').click();await page.locator('#questConfirm').click();await ready(page);
  if(id==='trial'){await expect(page.locator('#lightStatus')).toContainText('HP 10/10');await expect(page.locator('#shadowStatus')).toContainText('HP 9/9');expect(Number(await page.locator('#lightStatus .stat-values strong').first().textContent())).toBeLessThan(8);}
  if(id==='rematch')await expect(page.locator('#charge')).toContainText('/3');
  if(id==='heights'){await expect(page.locator('#mapViewport')).toHaveAttribute('data-height','true');await page.screenshot({path:info.outputPath('heights.png'),animations:'disabled'});}
  await page.locator('#restart').click();await page.locator('#questConfirm').click();await expect(page.locator('#resultTitle')).toHaveText('クエスト撤退');await page.locator('#resultContinue').click();await expect(page.locator('#activitiesPanel')).toBeVisible();
 }
 const p=await saved(page);expect(p.expansion.shards).toBe(30);expect(p.expansion.clears).toEqual([]);expect(p.materials).toEqual({metal:12,crystal:14});expect(errors).toEqual([]);
});
test('明暗パズルを位置と明るさで解き、報酬と遺物を一度だけ受け取る',async({page})=>{
 test.setTimeout(120000);await setup(page);await launch(page,'puzzle');
 await selectCell(page,4,4);await ready(page);expect(await position(page,'light')).toEqual({x:4,y:4});await page.locator('[data-skill="beam"]').click();await selectCell(page,5,4);await ready(page);
 await selectCell(page,7,5);await ready(page);await page.locator('[data-skill="guard"]').click();await ready(page);
 await selectCell(page,5,4);await ready(page);await page.locator('[data-skill="lamp"]').click();await selectCell(page,5,3);await ready(page);
 await page.locator('#pass').click();await page.locator('[data-skill="veil"]').click();await selectCell(page,7,4);await ready(page);
 await guard(page);await selectCell(page,7,4);await ready(page);await expect(page.locator('#resultTitle')).toHaveText('クエスト達成！');
 const p=await saved(page);expect(p.expansion.shards).toBe(36);expect(p.expansion.clears).toContain('puzzle');expect(p.expansion.relics).toContain('prism');expect(p.wins).toBe(15);expect(p.light.xp).toBe(0);expect(p.materials).toEqual({metal:12,crystal:14});
 await page.locator('#resultMap').click();await page.locator('#resultAgain').click();expect((await saved(page)).expansion.shards).toBe(36);
});
test('連戦でHPとチャージを持ち越し、3波の途中では報酬を付与しない',async({page})=>{
 await setup(page);await page.evaluate(async()=>{const path='/src/game/activities.ts';const q=(await import(path)).activities.find((q:any)=>q.id==='expedition');const e={x:2,y:4,hp:1,damage:3,kind:'sentinel',species:'goblin',affinity:'light'};q.enemies=[e];q.waves=[[{...e}],[{...e}]];});await launch(page,'expedition');
 await guard(page);await guard(page);await expect(page.locator('#lightStatus')).toContainText('HP 7/8');await expect(page.locator('#charge')).toContainText('3/3');
 for(let wave=1;wave<=3;wave++){
  await page.locator('#pass').click();await page.locator('#attackTargets button[data-enemy-id]').first().click();await ready(page);
  if(wave<3){await expect(page.locator('#objective')).toContainText('第'+(wave+1)+'/3波');await expect(page.locator('#lightStatus')).toContainText('HP 7/8');await expect(page.locator('#charge')).toContainText('3/3');expect((await saved(page)).expansion.shards).toBe(30);}
 }
 await expect(page.locator('#resultTitle')).toHaveText('クエスト達成！');expect((await saved(page)).expansion.shards).toBe(36);expect((await saved(page)).expansion.relics).toContain('expedition-map');
});
test('防衛対象に予告が命中し、生存期限で達成する',async({page})=>{
 await setup(page);await page.evaluate(async()=>{const path='/src/game/activities.ts';const q=(await import(path)).activities.find((q:any)=>q.id==='defense');q.beacon.hp=20;q.surviveRounds=2;q.enemies=[{x:4,y:4,hp:20,damage:3,kind:'sentinel',species:'mercenary',affinity:'shadow'}];});await launch(page,'defense');
 await guard(page);await guard(page);await expect(page.locator('#objective')).toContainText('核 17/20');await guard(page);await guard(page);await expect(page.locator('#resultTitle')).toHaveText('クエスト達成！');expect((await saved(page)).expansion.relics).toContain('guardian-bell');
});
test('制限依頼の禁止技と期限切れを適用し、失敗時は報酬なし',async({page})=>{
 await setup(page);await page.evaluate(async()=>{const path='/src/game/activities.ts';const q=(await import(path)).activities.find((q:any)=>q.id==='request');q.maxRounds=1;q.enemies=[];});await launch(page,'request');
 await guard(page);await page.locator('#pass').click();await expect(page.locator('[data-skill="block"]')).toBeDisabled();await page.locator('[data-skill="guard"]').click();await ready(page);await expect(page.locator('#resultTitle')).toHaveText('クエスト失敗');expect((await saved(page)).expansion.shards).toBe(30);expect((await saved(page)).expansion.clears).toEqual([]);
});
test('高い床を選択して階段を登り、高所攻撃の予測と命中が一致する',async({page},info)=>{
 await setup(page);await page.evaluate(async()=>{const path='/src/game/activities.ts';const q=(await import(path)).activities.find((q:any)=>q.id==='heights');q.spawn={light:{x:5,y:4},shadow:{x:2,y:6}};});await launch(page,'heights');await selectCell(page,6,4);await ready(page);expect(await position(page,'light')).toEqual({x:6,y:4});await page.screenshot({path:info.outputPath('stairs.png'),animations:'disabled'});
 await page.locator('#restart').click();await page.locator('#questConfirm').click();await page.locator('#resultHome').click();
 await page.evaluate(async()=>{const path='/src/game/activities.ts';const q=(await import(path)).activities.find((q:any)=>q.id==='heights');q.spawn={light:{x:6,y:4},shadow:{x:2,y:6}};q.enemies=[{x:5,y:4,hp:50,damage:1,kind:'sentinel',species:'goblin',affinity:'shadow'}];});await launch(page,'heights');
 await page.locator('#pass').click();const attack=Number(await page.locator('#lightStatus .stat-values strong').first().textContent());await expect(page.locator('#attackTargets button[data-enemy-id]')).toContainText('→ '+(50-attack-1));await page.locator('#attackTargets button[data-enemy-id]').click();await ready(page);await expect(page.locator('#log')).toContainText('へ'+(attack+1)+'ダメージ');
});
