import { expect, it } from 'vitest';
import { adjacentCells, clearCondition, combatObjectiveComplete, extractionState } from '../src/game/quest';
it('通常攻撃は上下左右の隣だけで、盤外と斜めを含まない', () => {
  expect(adjacentCells({ x: 1, y: 4 }, 14, 8)).toEqual([{ x: 1, y: 3 }, { x: 2, y: 4 }, { x: 1, y: 5 }, { x: 0, y: 4 }]);
  expect(adjacentCells({ x: 0, y: 0 }, 14, 8)).toEqual([{ x: 1, y: 0 }, { x: 0, y: 1 }]);
});
it('回収と救助は運び手の帰還までをクリア条件に含める', () => {
  expect(clearCondition('relic')).toContain('その場から帰還');
  expect(clearCondition('rescue')).toContain('救助した猟犬が');
  expect(clearCondition('boss')).toContain('ボスゴブリン');
});

it('ボス討伐は護衛が生存していても達成する',()=>{
 expect(combatObjectiveComplete('boss',[{hp:0,boss:true},{hp:8}])).toBe(true);
 expect(combatObjectiveComplete('boss',[{hp:2,boss:true},{hp:0}])).toBe(false);
 expect(combatObjectiveComplete('boss',[])).toBe(false);
});
it('討伐は全滅が必要で、救助と奪取は全滅では達成しない',()=>{
 expect(combatObjectiveComplete('hunt',[{hp:0},{hp:8}])).toBe(false);
 expect(combatObjectiveComplete('hunt',[{hp:0},{hp:0}])).toBe(true);
 expect(combatObjectiveComplete('rescue',[{hp:0}])).toBe(false);
 expect(combatObjectiveComplete('relic',[{hp:0}])).toBe(false);
});

it('物資は敵が残っていてもその場から帰還でき、安全なら回収・救助とも自動帰還する',()=>{
 expect(extractionState('relic',true,8,[{hp:4}])).toEqual({available:true,automatic:false});
 expect(extractionState('relic',true,8,[{hp:0}]).automatic).toBe(true);
 expect(extractionState('rescue',true,8,[{hp:4}]).available).toBe(false);
 expect(extractionState('rescue',true,8,[{hp:0}]).automatic).toBe(true);
 expect(extractionState('relic',false,8,[]).available).toBe(false);
 expect(extractionState('relic',true,0,[]).available).toBe(false);
});
