import { stageLayout } from '../../../src/game/stage-layout';
import { movementBudget, movementCost, type Brightness } from '../../../src/game/affinity';
import { expect, type Page } from '@playwright/test';
const safeLightSteps=Math.max(1,Math.floor(movementBudget.light/Math.max(...([0,1,2,3,4] as Brightness[]).map(v=>movementCost('light',v)))));
export async function ready(page:Page){
 await expect.poll(async()=>await page.locator('#resultView').isVisible()||await page.locator('#pass').isEnabled(),{timeout:15000}).toBe(true);
}
export async function skipOrAttack(page:Page,approachBlocks?:number[][]):Promise<boolean>{
 await ready(page);
 if(await page.locator('#resultView').isVisible())return false;
 if((await page.locator('#pass').textContent())==='移動せず技を選ぶ'){
   let moved=false;
   if(approachBlocks&&(await page.locator('#phaseTitle').textContent())==='光の行動'){
     const start=await position(page,'light'),shadow=await position(page,'shadow');
     const enemies=await page.locator('.enemy-plan').evaluateAll(nodes=>nodes.map(e=>({x:Number((e as HTMLElement).dataset.x),y:Number((e as HTMLElement).dataset.y)})));
     const stage=await page.locator('#mapViewport').getAttribute('data-stage');
     const voids=stageLayout({id:stage??'tactics'}).voids.map(p=>[p.x,p.y]);
     const obstacles=[...voids,...approachBlocks,[shadow.x,shadow.y],...enemies.map(e=>[e.x,e.y])];
     if(!enemies.some(e=>Math.abs(e.x-start.x)+Math.abs(e.y-start.y)===1)){
       const routes=[];
       for(const e of enemies)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
         const goal={x:e.x+dx,y:e.y+dy};if(goal.x<0||goal.y<0||goal.x>=14||goal.y>=8||obstacles.some(b=>b[0]===goal.x&&b[1]===goal.y))continue;
         try{routes.push(route(start,goal,obstacles))}catch{}
       }
       routes.sort((a,b)=>a.length-b.length);const steps=routes[0],next=steps?.[Math.min(safeLightSteps,steps.length)-1];
       if(next){await selectCell(page,next.x,next.y);await expect.poll(async()=>JSON.stringify(await position(page,'light'))).toBe(JSON.stringify(next));await ready(page);moved=true;}
     }
   }
   if(!moved)await page.locator('#pass').click();
 }
 const targets=page.locator('#attackTargets button[data-enemy-id]');
 const attack=(await targets.count())>0;
 if(attack)await targets.first().click();else await page.locator('#pass').click();
 await ready(page);return attack;
}
export async function position(page:Page,kind:string){return page.locator('#'+kind+'Status').evaluate(e=>({x:Number((e as HTMLElement).dataset.x),y:Number((e as HTMLElement).dataset.y)}));}
export async function selectCell(page:Page,x:number,y:number){
 await ready(page);
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 const point=await page.evaluate(async ({x,y})=>{
   const testWindow=window as any;
   if(!testWindow.campaignWorld){const url='/src/render/three-world.ts';const {HoundWorld}=await import(url);testWindow.campaignWorld=new HoundWorld(document.createElement('canvas'));}
   const world=testWindow.campaignWorld,canvas=document.querySelector('#battle') as HTMLCanvasElement,r=canvas.getBoundingClientRect();
   world.canvas.width=canvas.width;world.canvas.height=canvas.height;
   const portrait=innerHeight>innerWidth;
   const eye=portrait?[28,25,4.7]:[10.5,18,25],target=portrait?[7,.15,4]:[7,.25,4.35];
   world.camera(eye,target,1);
   const points:number[][]=[];
   for(const a of [-.75,14.75])for(const b of [-.8,8.8])points.push([a,.05,b]);
   for(const a of [.5,13.5])for(const b of [.5,7.5])points.push([a,1.25,b]);
   for(const a of [-.53,4,9.7,14.53])points.push([a,2.2,-.56]);
   for(const a of [5.8,8.2])points.push([a,-.8,9.6]);
   let needed=1;
   for(const v of points){const p=world.project(v);needed=Math.max(needed,Math.abs(p.x/canvas.width-.5)*2,Math.abs(p.y/canvas.height-.5)*2);}
   world.camera(eye,target,needed*1.035);
   const stage=document.querySelector('#mapViewport')?.getAttribute('data-stage');let height=0;if(stage==='heights'){const path='/src/game/activities.ts';const m=(await import(path)).activities.find((q:any)=>q.id==='heights');height=(m?.terrain?.heights[y]?.[x]??0)*.48;}const p=world.project([x+.5,height,y+.5]);return {x:p.x/canvas.width*r.width,y:p.y/canvas.height*r.height};
 },{x,y});
 await page.locator('#battle').click({position:point});
}
export function route(start:{x:number,y:number},goal:{x:number,y:number},blocks:number[][]){
 const visited=new Set([start.x+','+start.y]),queue=[{...start,path:[] as {x:number,y:number}[]}];
 for(const p of queue)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=p.x+dx,y=p.y+dy,key=x+','+y;
   if(x<0||y<0||x>=14||y>=8||visited.has(key)||blocks.some(b=>b[0]===x&&b[1]===y))continue;
   const path=[...p.path,{x,y}];if(x===goal.x&&y===goal.y)return path;
   visited.add(key);queue.push({x,y,path});
 }
 throw Error('帰還経路が見つからない');
}
export async function walkLight(page:Page,goal:{x:number,y:number},blocks:number[][]){
 for(let turns=0;turns<40;turns++){
   await ready(page);if(await page.locator('#resultView').isVisible())return;
   if((await page.locator('#phaseTitle').textContent())!=='光の行動'){await skipOrAttack(page);continue;}
   if((await page.locator('#pass').textContent())!=='移動せず技を選ぶ'){await page.locator('#pass').click();continue;}
   const p=await position(page,'light');if(p.x===goal.x&&p.y===goal.y)return;
   const stage=await page.locator('#mapViewport').getAttribute('data-stage');
   const voids=stageLayout({id:stage??'tactics'}).voids.map(p=>[p.x,p.y]);
   const shadow=await position(page,'shadow'),steps=route(p,goal,[...voids,...blocks,[shadow.x,shadow.y]]),next=steps[Math.min(safeLightSteps,steps.length)-1];
   await selectCell(page,next.x,next.y);
   await expect.poll(async()=>JSON.stringify(await position(page,'light'))).toBe(JSON.stringify(next));
   await ready(page);
 }
 throw Error('移動回数の上限');
}

