import {describe,it,expect} from 'vitest';
import {surfaceAtlasData,sharedSurfaceAtlas} from '../src/render/surface-textures';
import {MeshBuilder} from '../src/render/mesh-builder.js';
describe('軽量な表面質感',()=>{
 it('石・木・土・金属を同じアトラスに一度生成して共有する',()=>{const texture=sharedSurfaceAtlas();expect(sharedSurfaceAtlas()).toBe(texture);expect(texture.image.width).toBe(256);expect(texture.image.height).toBe(1024);expect(texture.image.data.length).toBe(1048576);const data=surfaceAtlasData(32);expect(data).toEqual(surfaceAtlasData(32));const signatures=[];for(let m=0;m<4;m++){const pixels=Array.from(data.slice(m*32*32*4,(m+1)*32*32*4));expect(new Set(pixels).size).toBeGreaterThan(30);signatures.push(pixels.reduce((a,v)=>a+v,0));}expect(new Set(signatures).size).toBe(4);});
 it('頂点数を増やさず質感を指定し、発光する移動枠を保持する',()=>{const a=new MeshBuilder(),b=new MeshBuilder();a.box([0,0,0],[1,1,1],[.2,.2,.2]);b.surface=1;b.box([0,0,0],[1,1,1],[.2,.2,.2]);expect(a.v.length).toBe(b.v.length);expect(b.v[9]).toBe(-1);b.ring(0,0,[1,1,1]);expect(b.v.at(-2)).toBe(2);});
 it('木箱は木目と金属を使い、後続のオブジェクトへ質感を漏らさない',()=>{const mesh=new MeshBuilder();mesh.crate(0,0);const tags=new Set<number>();for(let i=9;i<mesh.v.length;i+=11)tags.add(mesh.v[i]);expect(tags.has(-2)).toBe(true);expect(tags.has(-4)).toBe(true);expect(mesh.surface).toBe(0);});
});
