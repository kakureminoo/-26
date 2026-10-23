import { describe, expect, it } from 'vitest';
import { craftEquipment, equipEquipment, equipmentBonus, equipmentCatalog, migrateEquipment } from '../src/game/equipment';
describe('装備の作成・解放・着用',()=>{
 it('旧専用装備と装備なしを保持し、物語クリアを必要としない',()=>{
   expect(migrateEquipment({gear:true},'light')).toMatchObject({equipment:'lantern-collar',ownedEquipment:['lantern-collar']});
   expect(migrateEquipment({gear:true},'shadow').equipment).toBe('shadow-weave');
   expect(migrateEquipment({gear:false},'light').ownedEquipment).toEqual([]);
 });
 it('不正・重複・他犬専用のIDを除外し、装備を外した状態を維持する',()=>{
   expect(migrateEquipment({ownedEquipment:['ward','ward','shadow-weave','<script>'],equipment:null},'light')).toMatchObject({ownedEquipment:['ward'],equipment:null});
 });
 it('前半の専用品作成と素材不足は素材を消費しない',()=>{
   const dog=migrateEquipment({},'light'),money={metal:99,crystal:99};
   expect(craftEquipment(dog,money,'lantern-collar','light',2)).toBe(false);
   expect(money).toEqual({metal:99,crystal:99});
   expect(craftEquipment(dog,{metal:0,crystal:0},'ward','light',4)).toBe(false);
 });
 it('作成は1回だけ消費し、付け替えと取り外しは無料',()=>{
   const dog=migrateEquipment({},'light'),money={metal:5,crystal:5};
   expect(craftEquipment(dog,money,'fang','light',2)).toBe(true);
   expect(craftEquipment(dog,money,'ward','light',2)).toBe(true);
   expect(money).toEqual({metal:2,crystal:3});
   expect(craftEquipment(dog,money,'fang','light',2)).toBe(false);
   expect(equipEquipment(dog,'fang','light')).toBe(true);
   expect(equipEquipment(dog,null,'light')).toBe(true);
   expect(dog.equipment).toBeNull();expect(money).toEqual({metal:2,crystal:3});
 });
 it('専用品の装備先と未所持品を検証する',()=>{
   const dog=migrateEquipment({ownedEquipment:['fang']},'shadow');
   expect(equipEquipment(dog,'lantern-collar','shadow')).toBe(false);
   expect(equipEquipment(dog,'ward','shadow')).toBe(false);
   expect(craftEquipment(dog,{metal:99,crystal:99},'lantern-collar','shadow',4)).toBe(false);
 });
 it('明暗条件は境界値を含め、効果を重複付与しない',()=>{
   expect(equipmentBonus('ember',2).attack).toBe(0);expect(equipmentBonus('ember',3).attack).toBe(2);
   expect(equipmentBonus('dusk',1).evade).toBe(.1);expect(equipmentBonus('dusk',2).evade).toBe(0);
   expect(equipmentBonus('lantern-collar',3)).toMatchObject({attack:1,armor:1});
   expect(equipmentBonus('vitality',0).hp).toBe(2);
 });
 it('セーブ再読込と出発時のコピーで装備選択を保持する',()=>{
   const dog=migrateEquipment({ownedEquipment:['fang','ward'],equipment:'ward'},'light');
   const departure=structuredClone(dog);equipEquipment(dog,'fang','light');
   expect(departure.equipment).toBe('ward');
   expect(migrateEquipment(JSON.parse(JSON.stringify(dog)),'light').equipment).toBe('fang');
 });
 it('各レシピは一意で、装備形状と解放条件を持つ',()=>{
   expect(new Set(equipmentCatalog.map(e=>e.id)).size).toBe(8);
   expect(equipmentCatalog.filter(e=>e.category==='特製').every(e=>e.unlock>=3&&e.kind!=='both')).toBe(true);
 });
});
