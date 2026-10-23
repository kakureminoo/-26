import {houndCatalog} from '../../src/game/roster';
import {test,expect,type Page} from '@playwright/test';
import {campaignQuests} from '../../src/game/campaign';
import {cpuCommands,activePawn,type Match} from '../../src/game/multiplayer';
import {ready} from './helpers/driver';
async function setup(page:Page,cleared=true){await page.addInitScript(ids=>{if(!localStorage.getItem('lightShadowSave'))localStorage.setItem('lightShadowSave',JSON.stringify({cleared:ids,introSeen:true,wins:ids.length,user:5,uxp:0,materials:{metal:12,crystal:14},light:{level:5,xp:0,power:10,guard:10,gear:false},shadow:{level:5,xp:0,power:10,guard:10,gear:false},roster:{stones:100}}));},cleared?campaignQuests.map(q=>q.id):[]);await page.goto('/');await page.locator('#titleStart').click();await page.locator('#preferences').click();await page.locator('#reduceMotion').check();await page.locator('#closePreferences').click();}
async function hub(page:Page,tab:string){await page.locator('#homeRoster').click();await page.locator(`[data-hub-tab="${tab}"]`).click();}
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('lightShadowSave')!));
test('仲間の編成・猟犬召喚・指名交換・ミッションを保存する',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);await hub(page,'roster');await expect(page.locator('[data-equip-hound]')).toHaveCount(houndCatalog.length);await page.locator('[data-equip-hound="bulwark"]').click();expect((await saved(page)).roster.party.light).toBe('bulwark');await page.screenshot({path:info.outputPath('roster.png')});
 await page.locator('[data-hub-tab="missions"]').click();await page.locator('[data-claim-mission="welcome"]').click();await expect(page.locator('[data-claim-mission="welcome"]')).toBeDisabled();expect((await saved(page)).roster.stones).toBe(110);
 await page.locator('#closeHub').click();await page.locator('#homeSigils').click();await page.evaluate(()=>Math.random=()=>0);await page.locator('#summonTen').click();await expect(page.locator('#houndSummonResults .hound-card')).toHaveCount(10);let p=await saved(page);expect(p.roster.owned).toContain('ember');expect(p.roster.bonds).toBe(180);await page.screenshot({path:info.outputPath('hound-summon.png')});
 await page.locator('#closeHoundResults').click();await page.locator('[data-exchange-hound="frost"]').click();await page.locator('#closeGacha').click();await page.locator('#homeRoster').click();await page.locator('[data-equip-hound="frost"]').click();await page.locator('#closeHub').click();await page.reload();await page.locator('#titleStart').click();await hub(page,'roster');p=await saved(page);expect(p.roster.party).toEqual({light:'bulwark',shadow:'frost'});expect(p.roster.stones).toBe(10);expect(p.materials).toEqual({metal:12,crystal:14});expect(errors).toEqual([]);
});
test('本編は3段階を突破してから一度だけ報酬を付与する',async({page},info)=>{
 await setup(page,false);await page.evaluate(async()=>{const path='/src/game/campaign.ts';const q=(await import(path)).campaignQuests[0];q.enemies=[{x:2,y:4,hp:1,kind:'sentinel',species:'goblin',affinity:'shadow',damage:1}];q.blocks=[];q.lights=[];});await page.locator('#homeGo').click();await page.locator('[data-quest-id="hunt"] button').click();await page.locator('#questConfirm').click();await ready(page);
 for(let stage=1;stage<=3;stage++){
  await expect(page.locator('#objective')).toContainText(stage+'/3');if(stage<3){expect((await saved(page)).roster.stones).toBe(100);expect((await saved(page)).light.xp).toBe(0);}
  await page.locator('#pass').click();await page.locator('#attackTargets button[data-enemy-id]').first().click();await ready(page);
 }
 await expect(page.locator('#resultTitle')).toHaveText('クエスト達成！');let p=await saved(page);expect(p.roster.stones).toBe(110);expect(p.light.xp).toBe(2);expect(p.cleared).toEqual(['hunt']);await page.screenshot({path:info.outputPath('three-stage-result.png')});await page.locator('#resultMap').click();await page.locator('#resultAgain').click();p=await saved(page);expect(p.roster.stones).toBe(110);
});
test('周回遠征を繰り返して召喚石を集められる',async({page})=>{
 await setup(page);await page.evaluate(async()=>{const path='/src/game/activities.ts';const q=(await import(path)).activities.find((q:any)=>q.id==='farm');const e={x:2,y:4,hp:1,kind:'sentinel',species:'goblin',affinity:'shadow',damage:1};q.enemies=[e];q.waves=[[e],[e]];q.blocks=[];});
 for(let run=0;run<2;run++){
  await hub(page,'missions');await page.locator('#launchFarm').click();await page.locator('#questConfirm').click();await ready(page);
  for(let i=0;i<3;i++){await page.locator('#pass').click();await page.locator('#attackTargets button[data-enemy-id]').first().click();await ready(page);}
  await expect(page.locator('#resultTitle')).toHaveText('クエスト達成！');expect((await saved(page)).roster.stones).toBe(108+run*8);expect((await saved(page)).roster.metrics.farm).toBe(run+1);expect((await saved(page)).light.xp).toBe(0);await page.locator('#resultHome').click();
 }
});
test('CPU対戦は二匹ずつ・育成を持ち込まず交互に操作できる',async({page},info)=>{
 await setup(page);await hub(page,'duel');await page.locator('#startCPU').click();await expect(page.locator('.match-meta')).toContainText('全員 Lv.5');await expect(page.locator('.pawn')).toHaveCount(4);await expect(page.locator('.match-turn')).toContainText('あなたの手番');await page.locator('[data-match-order="0-1"]').click();await expect(page.locator('.active-pawn')).toHaveAttribute('aria-label',/宵の猟犬/);await page.locator('[data-match-order="0-0"]').click();await page.locator('[data-cell-x="2"][data-cell-y="2"]').click();await expect(page.locator('.match-turn')).toContainText('移動済み');await page.locator('[data-match-command="guard"]').click();await expect(page.locator('.match-turn')).toContainText('仲間・相手の手番');await expect(page.locator('.match-turn')).toContainText('あなたの手番',{timeout:10000});await page.screenshot({path:info.outputPath('cpu-duel.png')});expect((await saved(page)).light.power).toBe(10);await page.locator('#leaveLocal').click();
});
test('別ブラウザ同士で対戦し、サーバーの勝敗でレートが変わる',async({browser},info)=>{
 test.skip(info.project.name!=='desktop','実通信はPCの独立した二つのブラウザコンテキストで確認');test.setTimeout(60000);const a=await browser.newContext(),b=await browser.newContext();const pa=await a.newPage(),pb=await b.newPage();
 try{
  await setup(pa);await setup(pb);await hub(pa,'duel');await hub(pb,'duel');for(const p of [pa,pb])await p.locator('#onlineEndpoint').fill('http://127.0.0.1:8787/api/play');
  await pa.locator('#onlineCreate').click();const code=await pa.locator('#roomCode').textContent();await pb.locator('#joinCode').fill(code!);await pb.locator('#onlineJoin').click();await expect(pa.locator('.room-members span')).toHaveCount(2);await pa.locator('#onlineStart').click();await expect(pb.locator('[data-match-kind="online"] .match-board')).toBeVisible();await expect(pb.locator('[data-match-command="guard"]')).toBeDisabled();
  await pa.locator('[data-match-command="guard"]').click();await expect(pb.locator('.match-turn')).toContainText('あなたの手番');await pb.locator('[data-match-command="pulse"]').click();await expect(pa.locator('.match-turn')).toContainText('あなたの手番');await pb.locator('#onlineLeave').click();await expect(pa.locator('.match-outcome')).toContainText('勝利');await expect(pa.locator('.online-settings summary')).toContainText('1012');await expect(pb.locator('.online-settings summary')).toContainText('988');await pa.screenshot({path:info.outputPath('online-duel.png')});
 }finally{await a.close();await b.close();}
});
test('4人レイドを実通信で討伐し、オンライン報酬を一度だけ受け取る',async({page},info)=>{
 test.skip(info.project.name!=='desktop','4人分の実通信と報酬の統合はPCで確認');test.setTimeout(60000);await setup(page);await hub(page,'raid');await page.locator('#onlineEndpoint').fill('http://127.0.0.1:8787/api/play');await page.locator('#onlineCreate').click();const code=await page.locator('#roomCode').textContent(),root='http://127.0.0.1:8787/api/play';const hostToken=await page.evaluate(()=>localStorage.getItem('houndOnlineToken:http://127.0.0.1:8787/api/play'));
 async function api(path:string,token:string|null,body?:unknown){const r=await page.request.fetch(root+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{data:body})});expect(r.ok()).toBe(true);return r.json();}
 const host=await api('/me',hostToken),tokens:Record<string,string>={[host.id]:hostToken!};
 for(let i=0;i<3;i++){const c=await api('/session',null,{name:'共闘検証'+i});tokens[c.account.id]=c.token;await api('/join',c.token,{code,party:[i===1?'moon':'bulwark']});}
 await expect(page.locator('.room-members span')).toHaveCount(4);await page.locator('#onlineStart').click();await expect(page.locator('.match-board .pawn')).toHaveCount(4);await page.screenshot({path:info.outputPath('four-player-raid.png')});
 let room=await api('/rooms/'+code,hostToken);for(let i=0;i<1200&&room.match.status==='playing';i++){const m=room.match as Match;room=await api('/rooms/'+code+'/command',tokens[activePawn(m).owner],{revision:m.revision,command:cpuCommands(m)[0]});}expect(room.match.winner).toBe(0);await expect(page.locator('.match-outcome')).toContainText('討伐成功');
 // The selected host must survive this deterministic fixture to receive the server reward.
 expect(room.match.pawns.find((p:any)=>p.owner===host.id).hp).toBeGreaterThan(0);await expect.poll(async()=>(await saved(page)).roster.stones).toBe(150);expect((await saved(page)).expansion.shards).toBe(20);await page.locator('#onlineLeave').click();await page.locator('#onlineConnect').click();expect((await saved(page)).roster.stones).toBe(150);
});
