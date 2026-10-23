import {describe,it,expect} from 'vitest';
import {liberationState,strongholds} from '../src/game/liberation';
import {campaignQuests,questUnlocked} from '../src/game/campaign';
import {identityName} from '../src/game/enemy-identity';
import {planEnemies} from '../src/game/tactics';
import {combatObjectiveComplete} from '../src/game/quest';
describe('stronghold liberation',()=>{
 it('requires all three strongholds even if the previous quest is cleared out of order',()=>{
  expect(questUnlocked('castle-heart',['castle-eclipse'])).toBe(false);
  expect(questUnlocked('castle-heart',strongholds.map(s=>s.id))).toBe(true);
  expect(questUnlocked('castle-heart',['castle-heart'])).toBe(true); // completed legacy replay
 });
 it('unlocks powers once, shrinks enemy supply, and never mutates the existing save',()=>{
  const cleared=['boss','boss'];const before=JSON.stringify(cleared),state=liberationState(cleared);
  expect(state.released).toHaveLength(1);expect(state.lightAttack).toBe(1);expect(state.shadowAttack).toBe(0);expect(state.armor).toBe(0);
  expect(state.bossHPBonus).toBe(24);expect(state.bossDamageBonus).toBe(2);expect(JSON.stringify(cleared)).toBe(before);
  const all=liberationState(strongholds.map(s=>s.id));expect(all).toMatchObject({finalReady:true,lightAttack:1,shadowAttack:1,armor:1,bossHPBonus:0,bossDamageBonus:0});
  expect(liberationState([])).toMatchObject({lightAttack:0,shadowAttack:0,armor:0});
 });
 it('requires both final bosses and gives them distinct fixed brightness attacks',()=>{
  const bosses=campaignQuests.at(-1)!.enemies.filter(e=>e.boss);
  expect(bosses.map(identityName)).toEqual(['影喰らい','光喰らい']);
  expect(combatObjectiveComplete('boss',[{...bosses[0],hp:0},bosses[1]])).toBe(false);
  expect(combatObjectiveComplete('boss',bosses.map(e=>({...e,hp:0})))).toBe(true);
  const field=Array.from({length:8},()=>Array(14).fill(2));
  const plans=planEnemies(bosses.map((e,id)=>({...e,id})),[{x:1,y:4,hp:10}],field,[],14,8,1);
  expect(plans.map(p=>p.type)).toEqual(['nightfall','solarFlare']);
 });
 it('contains both colors of mercenaries, goblins and dragons plus mixed advanced enemies',()=>{
  const enemies=campaignQuests.flatMap(q=>q.enemies);
  for(const species of ['mercenary','goblin','dragon'])for(const affinity of ['light','shadow'])expect(enemies.some(e=>e.species===species&&e.affinity===affinity)).toBe(true);
  expect(enemies.some(e=>e.affinity==='yinYang')).toBe(true);
 });
});
