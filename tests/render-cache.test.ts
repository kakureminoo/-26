import {describe,it,expect} from 'vitest';
import {MeshBuilder} from '../src/render/mesh-builder.js';
import {buildHound} from '../src/render/hound-model.js';
import {buildEnemy} from '../src/render/enemy-model.js';
const difference=(a:number[],b:number[])=>{expect(a.length).toBe(b.length);let max=0;for(let i=0;i<a.length;i++)max=Math.max(max,Math.abs(a[i]-b[i]));return max;};
describe('形状キャッシュ',()=>{
 it('別の位置・向き・装備でも元の形状と被弾・透過を保つ',()=>{for(const kind of ['light','shadow']){const pose={hound:kind==='light'?'ember':'moon',equipment:'fang',sigil:'aurora',yaw:1.1,y:.25,pitch:.1,flash:.4,alpha:.7};const cached=new MeshBuilder(),direct=new MeshBuilder();cached.hound(3,2,kind,0,1,2,pose);buildHound(direct,3,2,kind,0,1,2,pose);expect(difference(cached.v,direct.v)).toBeLessThan(1e-10);}});
 it('異なる敵や囮の透過を混ぜず、位置・向きを正しく反映する',()=>{for(const kind of ['shadeGuard','decoy']){const pose={species:'mercenary',kind,affinity:'shadow',armored:true,lit:false,yaw:2,y:.3,alpha:.5};const cached=new MeshBuilder(),direct=new MeshBuilder();cached.goblin(4,3,false,pose);buildEnemy(direct,4,3,false,pose);expect(difference(cached.v,direct.v)).toBeLessThan(1e-10);}});
 it('移動と口の動き、竜の羽ばたきは元のアニメーションを使う',()=>{const pose={hound:'dawn',walk:1,gait:1.7,jaw:.5,yaw:.7};const cached=new MeshBuilder(),direct=new MeshBuilder();cached.hound(1,2,'light',1.2,1,2,pose);buildHound(direct,1,2,'light',1.2,1,2,pose);expect(difference(cached.v,direct.v)).toBe(0);const dragon={species:'dragon',affinity:'light',time:2};const a=new MeshBuilder(),b=new MeshBuilder();a.goblin(2,3,true,dragon);buildEnemy(b,2,3,true,dragon);expect(difference(a.v,b.v)).toBe(0);});
});
