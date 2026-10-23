import {describe,it,expect} from 'vitest';
import {stageLayout,stageContains} from '../src/game/stage-layout';
import {campaignAreas,campaignQuests} from '../src/game/campaign';
import {movementRange} from '../src/game/movement';
import {planEnemies} from '../src/game/tactics';
import {MeshBuilder} from '../src/render/mesh-builder.js';
import {equipmentCatalog} from '../src/game/equipment';
describe('stage footprints',()=>{
 it('keeps each area coherent, each quest distinct, and every floor connected',()=>{
  const shapes=new Set<string>();
  for(const q of campaignQuests){
   const layout=stageLayout(q);expect(layout.theme).toBe(campaignAreas[q.area].theme);
   expect(layout.voids.length).toBeGreaterThan(0);shapes.add(JSON.stringify(layout.voids));
   const reached=new Set(['1,4']),queue=[{x:1,y:4}];
   for(const p of queue)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=x+','+y;if(stageContains(layout,x,y)&&!reached.has(k)){reached.add(k);queue.push({x,y});}}
   for(let y=0;y<8;y++)for(let x=0;x<14;x++)if(stageContains(layout,x,y))expect(reached.has(x+','+y),q.id+' '+x+','+y).toBe(true);
  }
  expect(shapes.size).toBe(25);expect(stageLayout({id:'tactics'}).voids).toHaveLength(0);
 });
 it('excludes voids from player paths, enemy steps, warps, and summons',()=>{
  const layout=stageLayout({id:'relic'}),field=Array.from({length:8},()=>Array(14).fill(0)),walkable=(x:number,y:number)=>stageContains(layout,x,y);
  const range=movementRange('light',{x:4,y:4},field,99,(x,y)=>!walkable(x,y));
  for(const p of layout.voids)expect(range[p.y][p.x]).toBe(Infinity);
  for(const kind of ['sentinel','warper','illusionist'] as const){
   const plans=planEnemies([{id:0,x:5,y:4,hp:8,kind}],[{x:7,y:4,hp:8}],field,[],14,8,1,walkable);
   for(const p of plans)if(p.destination)expect(walkable(p.destination.x,p.destination.y)).toBe(true);
  }
 });
});
it('all fitted equipment meshes remain finite during motion on both dogs',()=>{
 for(const item of equipmentCatalog)for(const kind of ['light','shadow'])for(const time of [0,1.5]){
  const m=new MeshBuilder();m.hound(0,0,kind,time,1,2,{equipment:item.id,yaw:1.1,walk:.8,gait:time});
  expect(m.v.length%33).toBe(0);expect(m.v.every(Number.isFinite),item.id+' '+kind).toBe(true);
 }
});
