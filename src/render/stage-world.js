import {elevation,heightScale} from '../game/terrain';
import { stageContains } from '../game/stage-layout';
// Decorative geometry only. The shared layout is the sole authority for playable floor.
export const stagePalettes={
 city:{sky:[.018,.033,.051],tiles:[[.025,.04,.06],[.05,.08,.10],[.13,.17,.19],[.28,.27,.21],[.46,.36,.19]],base:[.12,.16,.20],trim:[.26,.29,.30],depth:[.017,.065,.085]},
 forest:{sky:[.014,.033,.030],tiles:[[.024,.043,.037],[.045,.077,.057],[.12,.17,.11],[.27,.25,.14],[.44,.35,.16]],base:[.105,.079,.047],trim:[.22,.18,.10],depth:[.018,.055,.045]},
 sanctum:{sky:[.10,.13,.16],tiles:[[.08,.10,.14],[.14,.19,.23],[.32,.37,.39],[.60,.56,.40],[.84,.74,.44]],base:[.33,.36,.38],trim:[.74,.59,.31],depth:[.05,.12,.17]},
 abyss:{sky:[.008,.012,.028],tiles:[[.012,.023,.038],[.035,.055,.09],[.09,.13,.19],[.24,.27,.30],[.42,.38,.27]],base:[.05,.07,.12],trim:[.22,.29,.38],depth:[.006,.014,.025]},
 castle:{sky:[.027,.020,.044],tiles:[[.037,.032,.061],[.068,.060,.10],[.16,.13,.20],[.29,.23,.23],[.46,.34,.22]],base:[.10,.085,.15],trim:[.35,.27,.15],depth:[.026,.016,.045]},
};
export function buildStage(m,layout){
 const {width:W,height:H,theme}=layout,p=stagePalettes[theme];
 m.surface=1;
 m.surface=3;m.box([W/2,-1.02,H/2],[W+3,.14,H+3],p.depth);m.surface=1;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  if(!stageContains(layout,x,y)){
   if(theme!=='castle'&&(x+y)%3===0)m.rod([x+.15,-.91,y+.35],[x+.8,-.91,y+.35],.009,theme==='forest'?[.07,.12,.08]:[.08,.16,.19],.2);
   continue;
  }
  const rise=elevation(layout.terrain,{x,y})*heightScale;m.box([x+.5,-.43+rise/2,y+.5],[.98,.76+rise,.98],p.base);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(!stageContains(layout,x+dx,y+dy)){
   m.box([x+.5+dx*.478,-.04,y+.5+dy*.478],[dx?.045:.97,.12,dy?.045:.97],p.trim);
   if(theme==='forest'){
    m.rod([x+.5+dx*.39,-.69,y+.5+dy*.39],[x+.5+dx*.39,-.1,y+.5+dy*.39],.045,[.14,.10,.055]);
   }else if((x+y)%2===0)m.box([x+.5+dx*.49,-.43,y+.5+dy*.49],[dx?.035:.46,.06,dy?.035:.46],p.trim);
  }
 }
 if(theme==='sanctum'){for(const x of [0,3,7,11,14]){m.rod([x,-.4,-.65],[x,1.7,-.65],.17,[.57,.59,.54]);m.box([x,1.72,-.65],[.65,.13,.65],[.80,.65,.34]);m.sphere([x,1.95,-.65],[.08,.20,.08],[.93,.73,.31],8,5,.5);}}else if(theme==='abyss'){for(const x of [-.5,3,8,14.5]){m.rod([x,-.7,-.7],[x+.15,1.7,-.7],.15,[.07,.11,.18],0,.025);for(let i=0;i<3;i++)m.sphere([x+.14,1.1+i*.17,-.65],[.08,.20,.07],[.16,.28,.43],6,4,.6);}}else if(theme==='city'){
  // Broken aqueduct behind the board; copper caps and small ivy clusters.
  for(const x of [-.53,4,9.7,W+.53]){
   m.box([x,.7,-.62],[.61,1.65,.64],[.19,.23,.26]);
   for(const h of [.1,.65,1.45])m.box([x,h,-.62],[.72,.12,.75],[.29,.30,.28]);
   m.box([x,1.62,-.62],[.8,.18,.82],[.31,.29,.24]);
   for(let i=0;i<3;i++)m.sphere([x+.25,.1+i*.28,-.23],[.10,.17,.07],[.065,.14,.095],6,3);
  }
  for(const x of [0,3.5,7,10.5,14]){m.box([x,1.3,-3.1],[.5,3.8,.6],[.065,.095,.13]);m.box([x,2.9,-3.1],[3.4,.3,.7],[.09,.12,.16]);}
 }else if(theme==='forest'){
  // Trees stand outside the selectable grid, leaving tactical silhouettes unobstructed.
  for(const [x,z,h]of [[-.55,-.5,1.5],[3,-.8,1.9],[8,-.8,1.5],[13.8,-.7,1.8],[14.7,5,1.4]]){
   m.surface=2;m.rod([x,-.5,z],[x-.12,h,z],.13,[.13,.095,.064],0,.07);
   for(const side of [-1,1]){
    m.surface=2;m.rod([x-.06,h*.6,z],[x+side*.48,h*.9,z+.1],.055,[.14,.11,.075],0,.018);
    m.surface=0;m.sphere([x+side*.32,h,z],[.53,.45,.39],[.055,.13,.095],7,4);
   }
   m.surface=0;m.sphere([x-.13,h+.35,z],[.48,.55,.43],[.08,.17,.12],7,4);
   m.surface=2;for(let i=0;i<3;i++)m.rod([x,-.42,z],[x+Math.cos(i*2)*.55,-.83,z+Math.sin(i*2)*.5],.06,[.12,.09,.045],0,.025);
  }
  m.surface=1;for(const x of [1,5,10]){m.sphere([x,-.73,8.8],[.43,.18,.25],[.065,.13,.08],7,4);for(let i=0;i<3;i++)m.rod([x+i*.14,-.7,8.8],[x+.1+i*.1,-.3,8.75],.015,[.13,.23,.11]);}
 }else{
  // Black pillars, gold bands, a fractured rose window and hanging banners.
  for(const x of [-.53,4,9.7,W+.53]){
   m.box([x,.8,-.65],[.62,1.9,.62],[.12,.10,.17]);
   for(const h of [-.05,1.55,1.8])m.box([x,h,-.65],[.78,.10,.76],[.37,.28,.15]);
   m.box([x,1,-.32],[.045,.85,.025],[.56,.40,.18],.25);
  }
  for(const x of [2,7,12]){
   m.box([x,1.8,-2],[.1,2.7,.22],[.11,.08,.16]);m.box([x,3.2,-2],[3.8,.22,.3],[.16,.12,.21]);
   m.box([x+.5,1.65,-1.9],[.58,1.45,.025],[.15,.035,.085]);
   for(const side of [-1,1])m.rod([x+.5,2.1,-1.87],[x+.5+side*.17,1.75,-1.87],.013,[.49,.34,.14]);
  }
 }
 m.surface=0;
}
