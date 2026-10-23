import {test,expect} from '@playwright/test';
import {campaignQuests} from '../../src/game/campaign';
import {ready} from './helpers/driver';

test('開始時の兵士・魔物・竜・喰らいが猟犬側を向き、再入場でも維持する',async({page},info)=>{
 test.setTimeout(60000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(cleared=>localStorage.setItem('lightShadowSave',JSON.stringify({cleared,introSeen:true,wins:25,user:5,uxp:0,materials:{metal:0,crystal:0},light:{level:5,xp:0,power:0,guard:0,gear:false},shadow:{level:5,xp:0,power:0,guard:0,gear:false}})),campaignQuests.map(q=>q.id));
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();
 await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();
 await page.evaluate(async()=>{
  const path='/src/render/mesh-builder.js';const {MeshBuilder}=await import(path),original=MeshBuilder.prototype.goblin;
  (window as any).enemyFacing=new Map();
  MeshBuilder.prototype.goblin=function(x:number,z:number,boss:boolean,pose:any){
   (window as any).enemyFacing.set(x+','+z,{x:x-.5,y:z-.5,yaw:pose.yaw,species:pose.species});return original.call(this,x,z,boss,pose);
  };
 });
 for(const id of ['hunt','sun-heart','castle-heart','hunt']){
  const q=campaignQuests.find(q=>q.id===id)!;
  await page.locator('#homeGo').click();await page.locator(`[data-area="${q.area}"]`).click();await page.locator(`[data-quest-id="${id}"] button`).click();await page.locator('#questConfirm').click();await ready(page);
  await page.evaluate(()=>(window as any).enemyFacing.clear());
  await expect.poll(()=>page.evaluate(()=>(window as any).enemyFacing.size)).toBe(q.enemies.length);
  const poses=await page.evaluate(()=>Array.from((window as any).enemyFacing.values())) as {x:number;y:number;yaw:number}[];
  for(const p of poses){
   expect(p.yaw).toBeCloseTo(Math.PI);
   // Dot product with the vector toward the two starting dogs must be positive.
   expect(Math.cos(p.yaw)*(1.5-p.x)+Math.sin(p.yaw)*(5-p.y)).toBeGreaterThan(0);
  }
  await page.screenshot({path:info.outputPath(id+'-facing.png'),animations:'disabled'});
  await page.locator('#restart').click();await page.locator('#questConfirm').click();await page.locator('#resultHome').click();
 }
 expect(errors).toEqual([]);
});
