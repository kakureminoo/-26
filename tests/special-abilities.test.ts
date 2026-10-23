import {describe,it,expect} from 'vitest';
import {normalizeName,ambushBonus,settlePosition,comboState,comboCells,comboDamage} from '../src/game/special-abilities';
import {planEnemies,assessPlan} from '../src/game/tactics';
import {beginPlayerRound} from '../src/game/turn-order';
const dogs=()=>({light:{x:2,y:2,hp:10},shadow:{x:4,y:2,hp:9}});
const field=()=>Array.from({length:8},()=>Array(14).fill(1));
describe('相棒の条件付き能力',()=>{
 it('名前の旧データ・空白・制御文字・文字数を正規化する',()=>{
  expect(normalizeName(undefined)).toBe('');expect(normalizeName('  ルナ\n ')).toBe('ルナ');expect(Array.from(normalizeName('🐕'.repeat(13)))).toHaveLength(12);
 });
 it('一直線・生存・遮蔽・チャージ・使用済みを条件にする',()=>{
  const d=dogs();expect(comboState(d,[],3,false).ready).toBe(true);
  expect(comboState(d,[{x:3,y:2}],3,false).ready).toBe(false);
  expect(comboState(d,[],2,false).ready).toBe(false);expect(comboState(d,[],3,true).ready).toBe(false);
  d.shadow.y=3;expect(comboState(d,[],3,false).ready).toBe(false);
  d.shadow.y=2;d.shadow.hp=0;expect(comboCells(d,[],14,8)).toEqual([]);
 });
 it('合体技は二方向へ延び、壁と盤面端で止まり、威力を一元計算する',()=>{
  const cells=comboCells(dogs(),[{x:6,y:2}],14,8);
  expect(cells).toContainEqual({x:0,y:2});expect(cells).toContainEqual({x:5,y:2});expect(cells).not.toContainEqual({x:6,y:2});expect(comboDamage(3,4)).toBe(5);
 });
 it('静止2ラウンドで強化し、往復移動でも解除する',()=>{
  let d={x:2,y:2,hp:10,anchor:{x:2,y:2},stillRounds:0,movedThisRound:false};
  d={...d,...settlePosition(d)};expect(ambushBonus(d)).toBe(0);
  d={...d,...settlePosition(d)};expect(ambushBonus(d)).toBe(1);
  d.movedThisRound=true;expect(ambushBonus(d)).toBe(0);d={...d,...settlePosition(d)};expect(d.stillRounds).toBe(0);
 });
});
describe('特殊な敵も固定予告で対処できる',()=>{
 it('影縛りは元のマスを狙い、後から置いた遮蔽物で中止する',()=>{
  const e={id:1,x:5,y:2,hp:4,kind:'binder' as const},f=field(),d=dogs();
  const p=planEnemies([e],Object.values(d),f,[],14,8)[0];expect(p.type).toBe('bind');expect(p.cells).toEqual([{x:4,y:2}]);
  expect(assessPlan(p,e,f,[{x:4,y:2}]).status).toBe('blocked');
  d.shadow.y=3;expect(p.cells).toEqual([{x:4,y:2}]);
 });
 it('行動不能は次の手番を省略し、倒れた犬と重なっても一回だけ扱う',()=>{
  expect(beginPlayerRound({light:{hp:10,stunned:true},shadow:{hp:9}},false).phase).toBe('shadow');
  expect(beginPlayerRound({light:{hp:0,stunned:true},shadow:{hp:9,stunned:true}},false).phase).toBe('enemy');
 });
 it('ワープ先を固定し、占有されたら別の場所へ飛ばない',()=>{
  const e={id:1,x:8,y:2,hp:4,kind:'warper' as const},f=field();
  const p=planEnemies([e],Object.values(dogs()),f,[],14,8)[0];expect(p.type).toBe('warp');
  const dest={...p.destination!};expect(assessPlan(p,e,f,[],()=>true).status).toBe('blocked');expect(p.destination).toEqual(dest);
 });
 it('囮は攻撃せず、一体いる間は追加召喚しない',()=>{
  const e={id:1,x:8,y:2,hp:4,kind:'illusionist' as const},f=field();
  expect(planEnemies([e],Object.values(dogs()),f,[],14,8)[0].type).toBe('summon');
  const decoy={id:2,x:7,y:2,hp:1,kind:'decoy' as const};const plans=planEnemies([e,decoy],Object.values(dogs()),f,[],14,8);
  expect(plans[0].type).not.toBe('summon');expect(plans[1].type).toBe('wait');
 });
});
