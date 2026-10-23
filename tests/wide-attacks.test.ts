import {describe,it,expect} from 'vitest';
import {lineSkillCells} from '../src/game/line-skills';
import {wideAttackArea,wideAttackProtected} from '../src/game/wide-attacks';
import {planEnemies,assessPlan,type TacticalEnemy} from '../src/game/tactics';
import {campaignQuests} from '../src/game/campaign';
import {stageLayout,stageContains} from '../src/game/stage-layout';
import {questStories,worldStory} from '../src/game/story';
import {renderStoryBook} from '../src/ui/story-book';
const field=(v=2)=>Array.from({length:8},()=>Array(14).fill(v));
const enemy:TacticalEnemy={id:0,x:11,y:4,hp:20,kind:'eclipseLord',boss:true};
const dogs=[{x:1,y:4,hp:10},{x:2,y:6,hp:9}];
describe('player line skills',()=>{
 it('includes the caster and four forward tiles in all directions',()=>{
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const cells=lineSkillCells({x:5,y:4},{x:5+dx,y:4+dy},14,9);
   expect(cells).toHaveLength(5);expect(cells[0]).toEqual({x:5,y:4});expect(cells[4]).toEqual({x:5+dx*4,y:4+dy*4});
  }
 });
 it('clips at edges, crosses gaps without filling them, and rejects a directionless/diagonal cast',()=>{
  expect(lineSkillCells({x:0,y:0},{x:1,y:0},14,8,(x,y)=>x!==2)).toEqual([{x:0,y:0},{x:1,y:0},{x:3,y:0},{x:4,y:0}]);
  expect(lineSkillCells({x:0,y:0},{x:-1,y:0},14,8)).toEqual([{x:0,y:0}]);
  expect(lineSkillCells({x:2,y:2},{x:2,y:2},14,8)).toEqual([]);expect(lineSkillCells({x:2,y:2},{x:3,y:3},14,8)).toEqual([]);
 });
});
describe('fixed wide attacks',()=>{
 it('alternates night and light waves with a regular-combat round between them',()=>{
  expect(planEnemies([enemy],dogs,field(),[],14,8,1)[0].type).toBe('nightfall');
  expect(planEnemies([enemy],dogs,field(),[],14,8,2)[0].type).toBe('move');
  expect(planEnemies([enemy],dogs,field(),[],14,8,3)[0].type).toBe('solarFlare');
  expect(planEnemies([enemy],dogs,field(),[],14,8,5)[0].type).toBe('nightfall');
 });
 it('has exact brightness thresholds and fixed refuges; neutral brightness is unsafe for both waves',()=>{
  for(const type of ['nightfall','solarFlare']){
   const p={type,cells:[],refuges:[{x:2,y:4}]};
   for(let v=0;v<=4;v++){expect(wideAttackProtected(p,{x:4,y:4},field(v))).toBe(type==='nightfall'?v>=3:v<=1);expect(wideAttackProtected(p,{x:2,y:4},field(v))).toBe(true);}
  }
 });
 it('reassesses danger when light changes but never changes the original footprint or runes',()=>{
  const f=field(),plan=planEnemies([enemy],dogs,f,[],14,8,1)[0],snapshot=JSON.stringify(plan);
  expect(assessPlan(plan,enemy,f,[]).cells).toContainEqual({x:dogs[0].x,y:dogs[0].y});
  f[4][1]=3;expect(assessPlan(plan,enemy,f,[]).cells).not.toContainEqual({x:dogs[0].x,y:dogs[0].y});
  expect(assessPlan(plan,enemy,f,[]).cells).not.toContainEqual({x:2,y:4});
  expect(JSON.stringify(plan)).toBe(snapshot);
  expect(assessPlan(plan,{...enemy,hp:0},f,[]).status).toBe('defeated');
 });
 it('uses legal, reachable refuges on each actual boss stage, with no runes in gaps or crates',()=>{
  for(const q of campaignQuests.filter(q=>q.goal==='boss')){
   const layout=stageLayout(q),blocks=q.blocks.map(([x,y])=>({x,y})),area=wideAttackArea(14,8,(x,y)=>stageContains(layout,x,y),blocks);
   expect(q.enemies.find(e=>e.boss)?.kind).toBe('eclipseLord');expect(area.refuges.length).toBeGreaterThanOrEqual(2);
   for(const r of area.refuges){expect(stageContains(layout,r.x,r.y)).toBe(true);expect(blocks.some(b=>b.x===r.x&&b.y===r.y)).toBe(false);}
   expect(area.cells.every(p=>stageContains(layout,p.x,p.y))).toBe(true);
  }
 });
});
describe('story continuity',()=>{
 it('gives all existing quest IDs a reason and outcome without changing progression',()=>{
  expect(Object.keys(questStories).sort()).toEqual(campaignQuests.map(q=>q.id).sort());
  for(const q of campaignQuests){expect(q.purpose).toBe(questStories[q.id].before);expect(q.after).toBe(questStories[q.id].after);}
  expect(campaignQuests[2].after).toContain('灯台');expect(campaignQuests.at(-1)!.after).toBe(worldStory.ending);
 });
 it('keeps unread future outcomes hidden and unlocks the ending only after all clears',()=>{
  const empty=renderStoryBook([]);expect(empty).toContain('光喰らい');expect(empty).toContain('光の猟犬');expect(empty).toContain('影の猟犬');expect(empty).not.toContain(worldStory.ending);
  expect(renderStoryBook(campaignQuests.map(q=>q.id))).toContain(worldStory.ending);
 });
});
