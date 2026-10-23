import {test,expect} from '@playwright/test';
import {ready} from './helpers/driver';
const music=(page:any)=>page.evaluate(async()=>{const path='/src/audio/sfx.js';return (await import(path)).Sfx.state().currentMusic;});
test('クリアは専用BGM、拠点へ戻ると拠点BGMに切り替わる',async({page})=>{
 test.setTimeout(60000);const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/audio/music/'))requests.push(r.url());});
 await page.addInitScript(()=>localStorage.setItem('lightShadowSave',JSON.stringify({introSeen:true,cleared:[],materials:{metal:0,crystal:0},light:{level:1,xp:0,power:20,guard:0},shadow:{level:1,xp:0,power:20,guard:0}})));
 await page.goto('/');await page.locator('#titleStart').click();await expect.poll(()=>music(page),{timeout:20000}).toBe('home');
 await page.evaluate(async()=>{const path='/src/game/campaign.ts';const q=(await import(path)).campaignQuests[0];q.enemies=[{x:2,y:4,hp:1,kind:'sentinel',species:'goblin',affinity:'shadow',damage:1}];q.blocks=[];q.lights=[];});
 await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();await page.locator('#homeGo').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);await expect.poll(()=>music(page),{timeout:20000}).toBe('battle');
 for(let i=0;i<3;i++){await page.locator('#pass').click();await page.locator('#attackTargets button[data-enemy-id]').first().click();await ready(page);}
 await expect(page.locator('#resultTitle')).toHaveText('クエスト達成！');await expect.poll(()=>music(page),{timeout:20000}).toBe('victory');expect(requests.some(u=>u.endsWith('/victory.ogg'))).toBe(true);
 await page.locator('#resultMap').click();await expect.poll(()=>music(page)).toBe('victory');await page.locator('#resultAgain').click();await page.locator('#resultHome').click();await expect.poll(()=>music(page)).toBe('home');
 const state=await page.evaluate(async()=>{const path='/src/audio/sfx.js';return (await import(path)).Sfx.state();});expect(state.error).toBe('');
});
