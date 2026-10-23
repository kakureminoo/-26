import {it,expect} from 'vitest';
import {rankProgress,grantRankXP} from '../src/game/rank';
import {createObstacle,strikeObstacle} from '../src/game/obstacles';
import {planEnemies,assessPlan} from '../src/game/tactics';
it('旧ランクの経験値を保持し、境界でランクアップして余りを残す',()=>{
 expect(rankProgress(2,5)).toMatchObject({rank:2,xp:5,required:6,remaining:1});
 expect(grantRankXP(2,5,1)).toEqual({user:3,uxp:0});expect(grantRankXP(1,2,4)).toEqual({user:2,uxp:3});
 expect(rankProgress(undefined,undefined).fraction).toBe(0);
});
it('遮蔽物を複数回攻撃で破壊し、耐久を負にしない',()=>{
 const block=createObstacle(3,2);expect(strikeObstacle(block,2)).toEqual({damage:2,hp:1,destroyed:false});
 expect(strikeObstacle({...block,hp:1},4)).toEqual({damage:1,hp:0,destroyed:true});expect(block.hp).toBe(3);
});
it('灯術師の固定予告は移動した犬を狙い直さず、明暗変更に直接ダメージはない',()=>{
 const f=Array.from({length:8},()=>Array(14).fill(0)),e={id:1,x:6,y:4,hp:5,kind:'lightWarden' as const},dogs=[{x:4,y:4,hp:8}];
 const p=planEnemies([e],dogs,f,[],14,8)[0];expect(p.type).toBe('illuminate');expect(p.damage).toBe(0);expect(p.cells).toContainEqual({x:4,y:4});
 dogs[0].x=1;const hit=assessPlan(p,e,f,[{x:4,y:4}]);expect(hit.cells).not.toContainEqual({x:4,y:4});expect(p.cells).toContainEqual({x:4,y:4});
 expect(assessPlan(p,{...e,hp:0},f,[]).status).toBe('defeated');
});
it('影織り師は明るい猟犬の位置へ暗幕を予告し、既に暗ければ別の基本行動を使う',()=>{
 const e={id:1,x:6,y:4,hp:5,kind:'shadowWeaver' as const},dogs=[{x:4,y:4,hp:8}],f=Array.from({length:8},()=>Array(14).fill(3));
 expect(planEnemies([e],dogs,f,[],14,8)[0].type).toBe('darken');f[4][4]=0;expect(planEnemies([e],dogs,f,[],14,8)[0].type).not.toBe('darken');
});

import {applyPlannedLight,shadowRetreatTarget} from '../src/game/light-effects';
it('予告した明暗変化を順に適用し、後続射撃の発射可否も変化する',()=>{
 const f=Array.from({length:8},()=>Array(14).fill(3)),enemies=[{id:1,x:6,y:4,hp:5,kind:'shadowWeaver' as const},{id:2,x:4,y:4,hp:5,kind:'sunArcher' as const}],dogs=[{x:4,y:5,hp:8}];
 const plans=planEnemies(enemies,dogs,f,[],14,8),dark=plans[0];expect(dark.type).toBe('darken');expect(plans[1].type).toBe('ray');
 const next=applyPlannedLight(f,dark,assessPlan(dark,enemies[0],f,[]));expect(next[4][4]).toBe(0);expect(f[4][4]).toBe(3);expect(assessPlan(plans[1],enemies[1],next,[]).status).toBe('dark');
});
it('強光による退避先は遮蔽と占有を除外し、光の犬への距離・座標で一意に決まる',()=>{
 const f=Array.from({length:4},()=>Array(5).fill(4));f[1][1]=0;f[2][2]=0;f[0][0]=0;
 expect(shadowRetreatTarget({x:3,y:3,hp:8},{x:2,y:1},f,()=>false,(x,y)=>x===1&&y===1)).toEqual({x:2,y:2});
 expect(shadowRetreatTarget({x:3,y:3,hp:0},{x:2,y:1},f,()=>false,()=>false)).toBeUndefined();
});

it('明暗技の直後は一ラウンドを空け、退避の連打で一匹を行動不能にし続けない',()=>{
 const e={id:1,x:6,y:4,hp:5,kind:'lightWarden' as const,nextLightRound:3},dogs=[{x:4,y:4,hp:8}],f=Array.from({length:8},()=>Array(14).fill(0));
 expect(planEnemies([e],dogs,f,[],14,8,2)[0].type).not.toBe('illuminate');
 expect(planEnemies([e],dogs,f,[],14,8,3)[0].type).toBe('illuminate');
});
