import { stageLayout,stageContains } from '../src/game/stage-layout';
import { describe, expect, it } from 'vitest';
import { campaignAreas, campaignQuests, campaignStep, questUnlocked } from '../src/game/campaign';
import { clearCondition } from '../src/game/quest';

describe('campaign progression',()=>{
 it('has five areas with five unique quests each',()=>{
  expect(campaignAreas).toHaveLength(5);expect(campaignQuests).toHaveLength(25);
  expect(new Set(campaignQuests.map(q=>q.id)).size).toBe(25);
  for(const a of campaignAreas)expect(campaignQuests.filter(q=>q.area===a.id)).toHaveLength(5);
 });
 it('opens quests sequentially and keeps the original save milestones',()=>{
  const cleared:string[]=[];
  for(const [i,q] of campaignQuests.entries()){
   expect(campaignStep(cleared)).toBe(i);expect(questUnlocked(q.id,cleared)).toBe(true);
   if(i<campaignQuests.length-1)expect(questUnlocked(campaignQuests[i+1].id,cleared)).toBe(false);
   cleared.push(q.id);
  }
  expect(campaignStep(['hunt','relic','rescue','boss'])).toBe(4);
  expect(campaignStep(cleared)).toBe(25);
  expect(questUnlocked('tactics',[])).toBe(true);expect(questUnlocked('invalid',[])).toBe(false);
  expect(questUnlocked('boss',[],true)).toBe(true);expect(questUnlocked('forest-edge',[],true)).toBe(false);
  expect(questUnlocked('castle-heart',['castle-heart'])).toBe(true);
 });
 it.each(campaignQuests)('$id has reachable objectives, legal positions and matching goals',q=>{
  const layout=stageLayout(q),blocks=new Set([...q.blocks.map(p=>p.join(',')),...layout.voids.map(p=>p.x+','+p.y)]);
  for(const p of [...q.lights,...q.blocks.map(([x,y])=>({x,y}))])expect(stageContains(layout,p.x,p.y)).toBe(true);
  const targets=[...q.enemies,...(q.item?[q.item]:[]),{x:1,y:4},{x:2,y:6},{x:3,y:3}];
  const actors=new Set<string>();
  for(const p of targets){
   expect(p.x).toBeGreaterThanOrEqual(0);expect(p.x).toBeLessThan(14);expect(p.y).toBeGreaterThanOrEqual(0);expect(p.y).toBeLessThan(8);
   const key=p.x+','+p.y;expect(blocks.has(key)).toBe(false);expect(actors.has(key)).toBe(false);actors.add(key);
  }
  const reached=new Set(['1,4']),queue=[{x:1,y:4}];
  for(const p of queue)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,key=x+','+y;if(x>=0&&x<14&&y>=0&&y<8&&!blocks.has(key)&&!reached.has(key)){reached.add(key);queue.push({x,y})}}
  for(const p of targets)expect(reached.has(p.x+','+p.y)).toBe(true);
  if(q.goal==='relic'||q.goal==='rescue'){expect(q.item).toBeDefined();expect(clearCondition(q.id)).toContain('帰還');}
  if(q.goal==='boss'){expect(q.enemies.filter(e=>e.boss)).toHaveLength(q.id==='castle-heart'?2:1);expect(clearCondition(q.id)).toContain(q.id==='castle-heart'?'両方':'ボス');}
 });
});
