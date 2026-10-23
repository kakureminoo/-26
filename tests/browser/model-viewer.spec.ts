import {houndCatalog} from '../../src/game/roster';
import {test,expect} from '@playwright/test';
import {collectionEnemies} from '../../src/game/expansion';
test('図鑑の味方と敵を360度観察し、閲覧では保存を書き換えない',async({page},info)=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error'&&/shader|WebGL|VALIDATE_STATUS/i.test(message.text()))errors.push(message.text());});
 await page.addInitScript(enemies=>localStorage.setItem('lightShadowSave',JSON.stringify({introSeen:true,cleared:[],materials:{metal:0,crystal:0},light:{level:1,xp:0},shadow:{level:1,xp:0},expansion:{enemies}})),collectionEnemies().map(e=>e.key));
 await page.goto('/');await page.locator('#titleStart').click();await page.locator('#homeCollection').click();
 const before=await page.evaluate(()=>localStorage.getItem('lightShadowSave'));
 await expect(page.locator('[data-view-hound]')).toHaveCount(houndCatalog.length);await expect(page.locator('[data-view-enemy]')).toHaveCount(collectionEnemies().length);
 await page.locator('[data-view-hound="dawn"]').click();await expect(page.locator('#modelViewerTitle')).toHaveText('黎明の猟犬');const canvas=page.locator('#catalogModelCanvas');await expect(canvas).toHaveAttribute('data-yaw','0');
 const front=await canvas.screenshot();await page.locator('#modelRotateRight').click();await expect(canvas).toHaveAttribute('data-yaw','30');
 await canvas.focus();await page.keyboard.press('ArrowRight');await expect(canvas).toHaveAttribute('data-yaw','45');
 const rect=(await canvas.boundingBox())!;await page.mouse.move(rect.x+rect.width*.3,rect.y+rect.height*.5);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.7,rect.y+rect.height*.5,{steps:8});await page.mouse.up();await expect(canvas).not.toHaveAttribute('data-yaw','45');
 // Touch uses the same pointer capture path; touch-action:none prevents page scroll while rotating.
 const touch=await page.context().newCDPSession(page),touchY=rect.y+rect.height*.5,touchX=rect.x+rect.width*.3;
 const touchBefore=await canvas.getAttribute('data-yaw');
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touchX,y:touchY,id:1}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchX+60,y:touchY,id:1}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(canvas).not.toHaveAttribute('data-yaw',touchBefore!);await touch.detach();
 await page.locator('#modelYaw').fill('180');await page.locator('#modelYaw').dispatchEvent('input');await expect(canvas).toHaveAttribute('data-yaw','180');expect(Buffer.compare(front,await canvas.screenshot())).not.toBe(0);
 await page.screenshot({path:info.outputPath('hound-back.png')});await page.locator('#modelYaw').fill('360');await page.locator('#modelYaw').dispatchEvent('input');await expect(canvas).toHaveAttribute('data-yaw','0');
 await page.locator('#modelReset').click();await page.locator('#closeModelViewer').click();await expect(page.locator('#modelViewer')).not.toBeVisible();
 const enemies=info.project.name==='desktop'?collectionEnemies():collectionEnemies().filter(e=>e.species==='dragon'&&e.affinity==='light'||e.species==='devourer'&&e.affinity==='shadow');
 for(const e of enemies){await page.locator(`[data-view-enemy="${e.key}"]`).click();await expect(page.locator('#modelViewerTitle')).toHaveText(e.name);await expect(canvas).toHaveAttribute('data-yaw','0');await page.locator('#modelRotateLeft').click();await expect(canvas).toHaveAttribute('data-yaw','330');if(!e.boss&&e.affinity==='shadow')await page.screenshot({path:info.outputPath('enemy-'+e.species+'.png')});if(e.species==='devourer')await page.screenshot({path:info.outputPath('enemy-'+e.affinity+'.png')});await page.locator('#closeModelViewer').click();}
 await page.locator('[data-view-hound="frost"]').click();await expect(page.locator('#modelViewerTitle')).toHaveText('霜影のフェン');await expect(canvas).toHaveAttribute('data-yaw','0');await page.screenshot({path:info.outputPath('hound-frost.png')});await page.keyboard.press('Escape');await expect(page.locator('#modelViewer')).not.toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('lightShadowSave'))).toBe(before);expect(errors).toEqual([]);
});
test('未発見の敵は閲覧ボタンを出さない',async({page})=>{
 await page.goto('/');await page.locator('#titleStart').click();if(await page.locator('#prologueDialog').isVisible())await page.locator('#prologueSkip').click();await page.locator('#homeCollection').click();await expect(page.locator('[data-view-enemy]')).toHaveCount(0);await expect(page.locator('[data-view-hound]')).toHaveCount(houndCatalog.length);
});
