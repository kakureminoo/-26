import {AmbientLight} from 'three';
import {modelFraming} from './model-framing';
import type {EnemyIdentity} from '../game/enemy-identity';
import {HoundWorld} from './three-world';
import {MeshBuilder} from './mesh-builder.js';
import {houndByID} from '../game/roster';
const cache=new Map<string,string>();
let world:HoundWorld|undefined;let enemyFill:AmbientLight|undefined;
/** One shared context; cards display snapshots of the actual original game models. */
export function houndPreview(id:string){
 if(cache.has(id))return cache.get(id)!;
 const h=houndByID(id);if(!h)return '';
 if(!world){const canvas=document.createElement('canvas');canvas.width=480;canvas.height=340;world=new HoundWorld(canvas);world.sky=[.025,.035,.05];world.static([],[[1,3,3]],[]);}
 world.canvas.width=480;world.canvas.height=340;
 world.camera([2.5,1.6,3.4],[0,.49,0],1.7);
 const mesh=new MeshBuilder();mesh.hound(0,0,h.kind,0,1,2,{hound:id,yaw:-.15});world.draw(mesh.v);
 const url=world.canvas.toDataURL('image/png');cache.set(id,url);return url;
}

/** Enemy snapshots reuse the same offscreen WebGL context and are cached by identity. */
export function enemyPreview(enemy:EnemyIdentity){
 const key='enemy:'+JSON.stringify([enemy.species,enemy.affinity,!!enemy.boss]);if(cache.has(key))return cache.get(key)!;
 if(!world){houndPreview('dawn');}
 const renderer=world!;renderer.canvas.width=384;renderer.canvas.height=320;
 const mesh=new MeshBuilder();mesh.goblin(0,0,enemy.boss??false,{...enemy,time:0,yaw:enemy.species==='dragon'?.1:.95});
 const {center,width}=modelFraming(mesh.v,384/320);renderer.camera([center[0]+2.6,center[1]+1.6,center[2]+3.4],center,width);
 if(!enemyFill){enemyFill=new AmbientLight(0xb4c9dc,.9);renderer.scene.add(enemyFill);}enemyFill.visible=true;const intensity=renderer.key.intensity;renderer.key.intensity=1.5;
 try{renderer.draw(mesh.v);const url=renderer.canvas.toDataURL('image/png');cache.set(key,url);return url;}finally{enemyFill.visible=false;renderer.key.intensity=intensity;}
}
