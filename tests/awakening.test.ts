import {describe,it,expect} from 'vitest';
import {awakeningBonus,migrateAwakenings} from '../src/game/awakening';
import {migrateRoster,summonHounds} from '../src/game/roster';
import {createMatch,pawnStats} from '../src/game/multiplayer';
const inventory=()=>({materials:{metal:0,crystal:0},light:{ownedEquipment:[],equipment:null},shadow:{ownedEquipment:[],equipment:null}});
describe('猟犬の六段階覚醒',()=>{
 it('旧セーブの欠片と天井を保持し、過去の重複を推測しない',()=>{const s=migrateRoster({version:2,owned:['ember'],bonds:180,pity5:49,legacyRareRemaining:3});expect(s.awakenings).toEqual({ember:0});expect(s.bonds).toBe(180);expect(s.pity5).toBe(49);expect(s.legacyRareRemaining).toBe(3);});
 it('新規加入は無凸、同一キャラの重複だけで進み、10連でも六段階で止まる',()=>{const s=migrateRoster({version:2,stones:100});const r=summonHounds(s,10,Array(10).fill(0),inventory())!;expect(r[0].awakening).toBeUndefined();expect(r[6].awakening).toBe(6);expect(r[6].awakeningGained).toBe(true);expect(r[7].awakeningGained).toBe(false);expect(s.awakenings.ember).toBe(6);expect(s.awakenings.frost).toBeUndefined();expect(s.bonds).toBe(180);expect(migrateRoster(JSON.parse(JSON.stringify(s)))).toEqual(s);});
 it('不正な抽選は覚醒も石も消費しない',()=>{const s=migrateRoster({version:2,stones:100,owned:['ember']});const before=structuredClone(s);expect(summonHounds(s,10,[0,NaN,...Array(8).fill(0)],inventory())).toBeUndefined();expect(s).toEqual(before);});
 it('不正な覚醒値・未加入・対象外の値を持ち込まない',()=>{expect(migrateAwakenings({ember:99,sol:2.5,moon:-2,dawn:6,frost:6},['ember','sol','moon','dawn'])).toEqual({ember:6,sol:0,moon:0});expect(awakeningBonus('dawn',6,4).attack).toBe(0);});
 it('六段階目はそれぞれの固有特性を大幅に伸ばす',()=>{expect(awakeningBonus('sol',6,3)).toEqual({hp:8,attack:6,armor:1,move:1});expect(awakeningBonus('sol',6,2).attack).toBe(2);expect(awakeningBonus('moon',6,1).move).toBe(1);expect(awakeningBonus('moon',6,2).move).toBe(0);expect(awakeningBonus('ember',6,0).attack-awakeningBonus('ember',5,0).attack).toBe(4);expect(awakeningBonus('frost',6,4)).toEqual({hp:20,attack:2,armor:3,move:0});});
 it('対戦の固定能力には覚醒補正を追加しない',()=>{const s=createMatch('test','duel',[{id:'you',party:['ember','frost']},{id:'cpu',party:['sol','moon']}]);expect(pawnStats(s,s.pawns[0]).attack).toBeGreaterThan(0);expect(s.pawns[0].hp).toBe(28);});
});
