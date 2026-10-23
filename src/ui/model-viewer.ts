import {modelFraming} from '../render/model-framing';
import {renderHoundSkills} from './hound-skills';
import {AmbientLight} from 'three';
import {HoundWorld} from '../render/three-world';
import {MeshBuilder} from '../render/mesh-builder.js';
import type {EnemyIdentity} from '../game/enemy-identity';
import type {HoundKind} from '../game/roster';
export type ModelSubject={name:string;hound:string;kind:HoundKind}|{name:string;enemy:EnemyIdentity};
let dialog:HTMLDialogElement|undefined;
let release:(()=>void)|undefined;
/** A single, on-demand viewer. It shares game geometry and never changes save data. */
export function openModelViewer(subject:ModelSubject){
 release?.();
 if(!dialog){dialog=document.createElement('dialog');dialog.id='modelViewer';dialog.setAttribute('aria-labelledby','modelViewerTitle');document.body.append(dialog);}
 dialog.innerHTML='<div class="dialog-head"><h2 id="modelViewerTitle"></h2><button class="ghost" id="closeModelViewer">閉じる</button></div><canvas id="catalogModelCanvas" tabindex="0" aria-label="キャラクターの3D表示。上下左右の矢印キーで回転、下の倍率で拡大縮小できます"></canvas><p class="model-viewer-hint">上下左右へドラッグで回転 · ホイール／ピンチで拡大縮小</p><div class="model-viewer-controls"><button id="modelRotateLeft" aria-label="左に回転">↶</button><label>左右<input id="modelYaw" type="range" min="0" max="360" step="1" value="0"><output id="modelDegrees">0°</output></label><button id="modelRotateRight" aria-label="右に回転">↷</button><button id="modelReset" class="ghost">表示を戻す</button></div><div class="model-tilt-controls"><button id="modelRotateUp" aria-label="上から見る">↑</button><label>上下<input id="modelTilt" type="range" min="0" max="360" step="1" value="0"><output id="modelTiltDegrees">0°</output></label><button id="modelRotateDown" aria-label="下から見る">↓</button></div><div class="model-zoom-controls"><button id="modelZoomOut" aria-label="縮小">−</button><label>倍率<input id="modelZoom" type="range" min="50" max="250" step="1" value="100"><output id="modelZoomValue">100%</output></label><button id="modelZoomIn" aria-label="拡大">＋</button></div>';
 if('hound'in subject)dialog.insertAdjacentHTML('beforeend',renderHoundSkills(subject.hound));
 dialog.querySelector('#modelViewerTitle')!.textContent=subject.name;
 if(!dialog.open)dialog.showModal();
 const canvas=dialog.querySelector<HTMLCanvasElement>('canvas')!,slider=dialog.querySelector<HTMLInputElement>('#modelYaw')!,degrees=dialog.querySelector<HTMLOutputElement>('#modelDegrees')!;
 const world=new HoundWorld(canvas),hound='hound'in subject;
 world.scene.add(new AmbientLight(0xb4c9dc,.9));world.key.intensity=1.5;
 world.sky=[.025,.035,.05];world.static([],[[1,3,3]],[]);
 let yaw=0,tilt=0,zoom=1,previousX=0,previousY=0,pinchSpan=0,frame=0,disposed=false;const pointers=new Map<number,{x:number;y:number}>();
 const zoomSlider=dialog.querySelector<HTMLInputElement>('#modelZoom')!,zoomValue=dialog.querySelector<HTMLOutputElement>('#modelZoomValue')!;
 const tiltSlider=dialog.querySelector<HTMLInputElement>('#modelTilt')!,tiltDegrees=dialog.querySelector<HTMLOutputElement>('#modelTiltDegrees')!;
 // The model and its shadows remain fixed. Orbiting only updates the camera.
 const mesh=new MeshBuilder(),pose={yaw:'hound'in subject?-.15:subject.enemy.species==='dragon'?.1:.95};
 if('hound'in subject)mesh.hound(0,0,subject.kind,0,1,2,{...pose,hound:subject.hound});else mesh.goblin(0,0,subject.enemy.boss??false,{...pose,...subject.enemy,time:0});
 const framing=modelFraming(mesh.v,1);
 world.renderer.shadowMap.autoUpdate=false;world.renderer.shadowMap.needsUpdate=true;let uploaded=false;
 function draw(){frame=0;if(disposed)return;const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5);const w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
  const center=framing.center,width=framing.width*Math.max(1,canvas.width/canvas.height);
  const azimuth=Math.atan2(2.6,3.4)-yaw*Math.PI/180,elevation=Math.atan2(1.6,Math.hypot(2.6,3.4))+tilt*Math.PI/180,distance=Math.hypot(2.6,1.6,3.4),cos=Math.cos(elevation),sin=Math.sin(elevation);
  world.view.up.set(-sin*Math.sin(azimuth),cos,-sin*Math.cos(azimuth));
  world.camera([center[0]+distance*cos*Math.sin(azimuth),center[1]+distance*sin,center[2]+distance*cos*Math.cos(azimuth)],center,width/zoom);
  if(!uploaded){world.draw(mesh.v);uploaded=true;}else world.redraw();
  canvas.dataset.yaw=String(yaw);canvas.dataset.tilt=String(tilt);canvas.dataset.zoom=String(zoom);
 }

 function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(draw);}
 function rotate(value:number){yaw=((value%360)+360)%360;slider.value=String(Math.round(yaw));degrees.value=Math.round(yaw)+'°';schedule();}
 function rotateVertical(value:number){tilt=((value%360)+360)%360;tiltSlider.value=String(Math.round(tilt));tiltDegrees.value=Math.round(tilt)+'°';schedule();}
 const observer=new ResizeObserver(schedule);observer.observe(canvas);
 function setZoom(value:number){zoom=Math.max(.5,Math.min(2.5,value));zoomSlider.value=String(Math.round(zoom*100));zoomValue.value=Math.round(zoom*100)+'%';(dialog!.querySelector('#modelZoomOut') as HTMLButtonElement).disabled=zoom<=.5;(dialog!.querySelector('#modelZoomIn') as HTMLButtonElement).disabled=zoom>=2.5;schedule();}
 const span=()=>{const a=[...pointers.values()];return a.length>=2?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0;};
 canvas.onpointerdown=e=>{if(e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});previousX=e.clientX;previousY=e.clientY;pinchSpan=span();canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>=2){const distance=span();if(pinchSpan>0)setZoom(zoom*distance/pinchSpan);pinchSpan=distance;}else{rotate(yaw+(e.clientX-previousX)*.65);rotateVertical(tilt-(e.clientY-previousY)*.65);previousX=e.clientX;previousY=e.clientY;}};
 canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=e=>{pointers.delete(e.pointerId);pinchSpan=span();previousX=[...pointers.values()][0]?.x??0;previousY=[...pointers.values()][0]?.y??0;};
 canvas.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*Math.exp(-Math.max(-200,Math.min(200,e.deltaY))*.0015));},{passive:false});
 zoomSlider.oninput=()=>setZoom(Number(zoomSlider.value)/100);
 (dialog.querySelector('#modelZoomOut') as HTMLButtonElement).onclick=()=>setZoom(zoom-.25);
 (dialog.querySelector('#modelZoomIn') as HTMLButtonElement).onclick=()=>setZoom(zoom+.25);

 canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight')rotate(yaw+(e.key==='ArrowLeft'?-15:15));else rotateVertical(tilt+(e.key==='ArrowUp'?15:-15));}};
 tiltSlider.oninput=()=>rotateVertical(Number(tiltSlider.value));
 (dialog.querySelector('#modelRotateUp') as HTMLButtonElement).onclick=()=>rotateVertical(tilt+30);
 (dialog.querySelector('#modelRotateDown') as HTMLButtonElement).onclick=()=>rotateVertical(tilt-30);
 slider.oninput=()=>rotate(Number(slider.value));
 (dialog.querySelector('#modelRotateLeft') as HTMLButtonElement).onclick=()=>rotate(yaw-30);
 (dialog.querySelector('#modelRotateRight') as HTMLButtonElement).onclick=()=>rotate(yaw+30);
 (dialog.querySelector('#modelReset') as HTMLButtonElement).onclick=()=>{rotate(0);rotateVertical(0);setZoom(1);};
 (dialog.querySelector('#closeModelViewer') as HTMLButtonElement).onclick=()=>dialog!.close();
 release=()=>{disposed=true;observer.disconnect();cancelAnimationFrame(frame);world.dispose();release=undefined;};
 dialog.onclose=()=>release?.();schedule();
}
