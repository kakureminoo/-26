import {describe,it,expect} from 'vitest';
import {attackDamage,assessPlan,planEnemies} from '../src/game/tactics';
import {beginPlayerRound,advancePlayerTurn} from '../src/game/turn-order';
const field=()=>Array.from({length:8},()=>Array(14).fill(3));
describe('明暗と固定予告',()=>{
 it('影鎧兵は0〜1で2軽減、照らすと解除される',()=>{
  const e={id:0,x:4,y:4,hp:5,kind:'shadeGuard' as const};
  expect([0,1,2,3,4].map(b=>attackDamage(3,e,b))).toEqual([1,1,3,3,3]);
  expect(attackDamage(1,e,0)).toBe(0);
 });
 it('予告は座標のコピーで、犬が移動しても狙い直さない',()=>{
  const e={id:0,x:2,y:2,hp:5},dog={x:3,y:2,hp:8},plans=planEnemies([e],[dog],field(),[],14,8);
  dog.y=3;expect(plans[0].cells).toEqual([{x:3,y:2}]);
  expect(assessPlan(plans[0],e,field(),[]).cells).toEqual([{x:3,y:2}]);
 });
 it('灯射兵の射撃は暗くすると中止、途中に壁を置くとその手前で止まる',()=>{
  const e={id:0,x:8,y:4,hp:5,kind:'sunArcher' as const},f=field();
  const plan=planEnemies([e],[{x:4,y:4,hp:8}],f,[],14,8)[0];expect(plan.type).toBe('ray');
  expect(assessPlan(plan,e,f,[{x:5,y:4}]).cells).toEqual([{x:7,y:4},{x:6,y:4}]);
  f[4][8]=2;expect(assessPlan(plan,e,f,[])).toEqual({status:'dark',cells:[]});
  expect(plan.cells).toHaveLength(4);
 });
 it('射撃の閾値と斜め・射程外・初期遮蔽を守る',()=>{
  const e={id:0,x:8,y:4,hp:5,kind:'sunArcher' as const},f=field();
  f[4][8]=2;expect(planEnemies([e],[{x:4,y:4,hp:8}],f,[],14,8)[0].type).not.toBe('ray');
  f[4][8]=3;expect(planEnemies([e],[{x:4,y:4,hp:8}],f,[],14,8)[0].type).toBe('ray');
  for(const dog of [{x:3,y:4,hp:8},{x:4,y:3,hp:8}])expect(planEnemies([e],[dog],f,[],14,8)[0].type).not.toBe('ray');
  expect(planEnemies([e],[{x:4,y:4,hp:8}],f,[{x:6,y:4}],14,8)[0].type).not.toBe('ray');
 });
 it('予約された移動先が塞がっても新しい行動へ変更しない',()=>{
  const e={id:0,x:5,y:4,hp:5},p=planEnemies([e],[{x:2,y:4,hp:8}],field(),[],14,8)[0];
  expect(p.type).toBe('move');expect(p.destination).toEqual({x:4,y:4});
  expect(assessPlan(p,e,field(),[{x:4,y:4}]).status).toBe('blocked');
  expect(assessPlan(p,e,field(),[],()=>true).status).toBe('blocked');
  expect(assessPlan(p,{...e,hp:0},field(),[]).status).toBe('defeated');
 });
 it('複数の敵の移動先を予約し、衝突を避ける',()=>{
  const plans=planEnemies([{id:0,x:4,y:2,hp:5},{id:1,x:3,y:1,hp:5}],[{x:1,y:2,hp:8}],field(),[],14,8);
  const dests=plans.filter(p=>p.destination).map(p=>JSON.stringify(p.destination));expect(new Set(dests).size).toBe(dests.length);
 });
});
describe('二匹の行動順',()=>{
 const dogs={light:{hp:8},shadow:{hp:7}};
 it('影先でも二匹が一回ずつ行動してから敵へ進む',()=>{
  const initial=beginPlayerRound(dogs,false);expect(initial.orderLocked).toBe(false);
  const next=advancePlayerTurn('shadow',initial.acted,dogs,false);expect(next.phase).toBe('light');expect(next.orderLocked).toBe(true);
  expect(advancePlayerTurn('light',next.acted,dogs,false).phase).toBe('enemy');
 });
 it('影が未行動で退避したときは、そのラウンドの行動を失う',()=>{
  expect(advancePlayerTurn('light',[],dogs,true)).toMatchObject({phase:'enemy',skipShadow:false});
 });
 it('影の行動後の退避は、次のラウンドの影を一回だけ省略する',()=>{
  const next=advancePlayerTurn('light',['shadow'],dogs,true);expect(next.skipShadow).toBe(true);
  const start=beginPlayerRound(dogs,next.skipShadow);expect(start.acted).toEqual(['shadow']);expect(start.skipShadow).toBe(false);
  expect(beginPlayerRound(dogs,start.skipShadow).acted).toEqual([]);
 });
 it('戦闘不能と一回省略が重なっても手番を重複させない',()=>{
  expect(beginPlayerRound({light:{hp:0},shadow:{hp:7}},false).phase).toBe('shadow');
  expect(beginPlayerRound({light:{hp:0},shadow:{hp:7}},true).phase).toBe('enemy');
  expect(beginPlayerRound({light:{hp:8},shadow:{hp:0}},false).phase).toBe('light');
 });
});
