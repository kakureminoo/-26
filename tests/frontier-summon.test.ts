import {describe,it,expect} from 'vitest';
import {campaignQuests,campaignAreas,questUnlocked,campaignStep} from '../src/game/campaign';
import {environmentalBrightness,climateRadius} from '../src/game/stage-lighting';
import {migrateExpansion,drawSigil,drawManySigils,exchangeSigil,sigilBonus,collectionEnemies,enemyKey} from '../src/game/expansion';
import {activities,activityUnlocked} from '../src/game/activities';
import {renderStoryBook} from '../src/ui/story-book';
describe('frontier expansion and existing progress',()=>{
 it('keeps the old fifteen IDs playable and the old ending readable',()=>{
  const old=campaignQuests.filter(q=>[0,1,4].includes(q.area)).map(q=>q.id);expect(old).toHaveLength(15);expect(campaignStep(old)).toBe(10);
  for(const id of old)expect(questUnlocked(id,old)).toBe(true);expect(questUnlocked('sun-gate',old)).toBe(true);expect(questUnlocked('abyss-gate',old)).toBe(false);
  expect(activityUnlocked(activities.find(m=>m.id==='rematch')!,10,old)).toBe(true);expect(renderStoryBook(old)).toContain('story-ending');
 });
 it('has five distinct connected regions, each with five quests and appropriate climate',()=>{
  expect(campaignAreas).toHaveLength(5);expect(campaignQuests).toHaveLength(25);expect(campaignQuests.filter(q=>q.climate==='radiant')).toHaveLength(5);expect(campaignQuests.filter(q=>q.climate==='umbral')).toHaveLength(5);expect(campaignQuests.at(-1)!.id).toBe('castle-heart');
 });
 it('registers every campaign enemy variant, including the new white dragon boss',()=>{
  const keys=new Set(collectionEnemies().map(e=>e.key));for(const q of campaignQuests)for(const e of q.enemies)expect(keys.has(enemyKey(e)!)).toBe(true);
 });
 it('creates cover shade in radiant areas and consistently reduces lamp radius in umbral areas',()=>{
  expect(environmentalBrightness('radiant',{x:1,y:4},[])).toBe(3);expect(environmentalBrightness('radiant',{x:7,y:4},[{x:5,y:4}])).toBe(1);
  expect(environmentalBrightness('radiant',{x:4,y:4},[{x:5,y:4}])).toBe(3);expect(environmentalBrightness('normal',{x:1,y:4},[])).toBe(0);expect(climateRadius('umbral',4)).toBeCloseTo(2.32);expect(climateRadius('normal',4)).toBe(4);
 });
});
describe('summon goals and legendary inscriptions',()=>{
 it('rejects an unaffordable or invalid ten-pull before consuming any resources',()=>{
  const s=migrateExpansion({shards:29});const before=JSON.stringify(s);expect(drawManySigils(s,10,Array(10).fill(0))).toBeUndefined();expect(JSON.stringify(s)).toBe(before);
  s.shards=30;const snapshot=JSON.stringify(s);expect(drawManySigils(s,10,[...Array(9).fill(0),NaN])).toBeUndefined();expect(JSON.stringify(s)).toBe(snapshot);
 });
 it('keeps the existing rare guarantee within ten pulls and adds duplicate progress',()=>{
  const s=migrateExpansion({shards:30});const rolls=drawManySigils(s,10,Array(10).fill(0))!;expect(rolls).toHaveLength(10);expect(s.draws).toBe(10);expect(s.shards).toBe(0);expect(rolls[9].item.rarity).toBe('希少');expect(s.stardust).toBe(8);
 });
 it('can obtain legendary inscriptions and change the opening charge or movement',()=>{
  const s=migrateExpansion({shards:6});expect(drawSigil(s,.97)!.item.id).toBe('aurora');expect(drawSigil(s,.99)!.item.id).toBe('nightwing');s.sockets.light.fang='aurora';s.sockets.shadow.fang='nightwing';
  expect(sigilBonus(s,'light','fang',3)).toMatchObject({charge:1,attack:1});expect(sigilBonus(s,'shadow','fang',0)).toMatchObject({move:1,evade:.15});
 });
 it('exchanges duplicate currency for the exact selected item without consuming an equipped copy',()=>{
  const s=migrateExpansion({stardust:32,sigils:{spark:1},sockets:{light:{fang:'spark'}}});expect(exchangeSigil(s,'aurora')!.item.id).toBe('aurora');expect(s.stardust).toBe(0);expect(s.sigils.aurora).toBe(1);expect(s.sockets.light.fang).toBe('spark');const before=JSON.stringify(s);expect(exchangeSigil(s,'aurora')).toBeUndefined();expect(JSON.stringify(s)).toBe(before);
 });
});
