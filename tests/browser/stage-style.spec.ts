import {test,expect} from '@playwright/test';
import {campaignQuests} from '../../src/game/campaign';
import {ready,selectCell,position} from './helpers/driver';

test('エリアの外観、欠けた床の進入禁止、出発音の使い分けを確認する',async({page},info)=>{
 test.skip(info.project.name!=='desktop','外観の各画面サイズは既存の全画面検証で確認');test.setTimeout(120000);
 await page.addInitScript(cleared=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared,wins:15,user:5,uxp:0,materials:{metal:20,crystal:20},light:{level:5,xp:0,power:0,guard:0,gear:true},shadow:{level:5,xp:0,power:0,guard:0,gear:true}})),campaignQuests.map(q=>q.id));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
 await page.evaluate(async()=>{
  const path='/src/audio/sfx.js',Sfx=(await import(path)).Sfx,play=Sfx.play;
  (window as any).clickedSounds=[];Sfx.play=(name:string,...args:any[])=>{(window as any).clickedSounds.push(name);return play(name,...args)};
 });
 for(const [id,area,theme]of [['hunt','0','city'],['relic','0','city'],['forest-edge','1','forest'],['castle-heart','2','castle']]){
  await page.locator('#homeGo').click();await page.locator(`[data-area="${area}"]`).click();await page.locator(`[data-quest-id="${id}"] button`).click();
  await page.evaluate(()=>{(window as any).clickedSounds=[]});await page.locator('#questConfirm').click();await ready(page);
  await expect(page.locator('#mapViewport')).toHaveAttribute('data-theme',theme);
  expect(await page.evaluate(()=>(window as any).clickedSounds)).toEqual(['departure']);
  await page.screenshot({path:info.outputPath(id+'-stage.png')});
  await page.locator('#restart').click();await page.evaluate(()=>{(window as any).clickedSounds=[]});await page.locator('#questConfirm').click();
  expect(await page.evaluate(()=>(window as any).clickedSounds)).toEqual(['failure','ui']);await page.locator('#resultHome').click();
 }
 const audio=await page.evaluate(async()=>{const c=new AudioContext();try{const b=await c.decodeAudioData(await (await fetch('/audio/sfx/departure.ogg')).arrayBuffer());return {duration:b.duration,channels:b.numberOfChannels};}finally{await c.close()}});
 expect(audio.duration).toBeGreaterThan(.5);expect(audio.duration).toBeLessThan(10);expect(audio.channels).toBeGreaterThan(0);
 await page.evaluate(async()=>{const path='/src/game/campaign.ts';const q=(await import(path)).campaignQuests.find((q:any)=>q.id==='relic');q.spawn={light:{x:5,y:4},shadow:{x:2,y:6}};});
 await page.locator('#homeGo').click();await page.locator('[data-area="0"]').click();await page.locator('[data-quest-id="relic"] button').click();await page.locator('#questConfirm').click();await ready(page);
 await selectCell(page,6,4);expect(await position(page,'light')).toEqual({x:5,y:4});
 await selectCell(page,5,3);await ready(page);expect(await position(page,'light')).toEqual({x:5,y:3});expect(errors).toEqual([]);
});
