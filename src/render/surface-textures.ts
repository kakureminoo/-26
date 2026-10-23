import * as THREE from 'three';
/** One generated atlas, shared by every world. No downloads or per-frame synthesis. */
export const SURFACE_SIZE=256;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const hash=(x:number,y:number)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
const noise=(x:number,y:number)=>{const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,s=u*u*(3-2*u),t=v*v*(3-2*v);return (hash(a,b)*(1-s)+hash(a+1,b)*s)*(1-t)+(hash(a,b+1)*(1-s)+hash(a+1,b+1)*s)*t;};
export function surfaceAtlasData(size=SURFACE_SIZE){
 const data=new Uint8Array(size*size*4*4);
 for(let material=0;material<4;material++)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,fine=hash(x,y),broad=noise(u*8,v*8),detail=noise(u*38,v*38);
  let shade=.62,height=.5;
  if(material===0){ // weathered limestone: mineral clouding, pits and fractured veins
   const strata=noise(u*5+noise(u*9,v*9)*.8,v*16),vein=Math.pow(1-Math.abs(noise(u*10,v*10)-.5)*2,28);
   const pits=fine>.976?.18:0;shade=.48+broad*.29+detail*.14-vein*.13-pits;height=.35+strata*.25+detail*.15-vein*.16-pits;
  }else if(material===1){ // long fibres and recessed joints between rough-sawn boards
   const warp=noise(u*4,v*5)*.12,grain=noise(u*3,(v+warp)*110),rings=Math.sin((v+warp)*220+noise(u*5,v*6)*5);
   const joint=Math.min((v*5)%1,1-(v*5)%1)<.025?.26:0;
   shade=.42+grain*.25+broad*.16+rings*.035-joint;height=.35+grain*.25-joint+fine*.04;
  }else if(material===2){ // compacted soil: coarse grit and scattered small stones
   const grit=Math.pow(fine,14),pebble=Math.pow(detail,4);shade=.37+broad*.27+detail*.16+grit*.14;height=.25+broad*.22+pebble*.3+grit*.12;
  }else{ // oxidised iron, dark scratches and uneven patina
   const scratch=noise(u*110,v*4)>.74?.13:0;shade=.45+broad*.21+detail*.1-scratch;height=.4+detail*.14-scratch*.2;
  }
  const i=((material*size+y)*size+x)*4;
  data[i]=Math.round(clamp(shade*(material===2?1.03:1))*255);data[i+1]=Math.round(clamp(shade)*255);data[i+2]=Math.round(clamp(shade*(material===1?.89:material===2?.87:1.02))*255);data[i+3]=Math.round(clamp(height)*255);
 }return data;
}
let shared:THREE.DataTexture|undefined;
export function sharedSurfaceAtlas(){
 if(!shared){shared=new THREE.DataTexture(surfaceAtlasData(),SURFACE_SIZE,SURFACE_SIZE*4,THREE.RGBAFormat);shared.minFilter=THREE.LinearMipmapLinearFilter;shared.magFilter=THREE.LinearFilter;shared.generateMipmaps=true;shared.needsUpdate=true;}
 return shared;
}
/** Negative glow values tag a surface; positive glow remains reserved for readable effects. */
export function applySurfaceShader(shader:{uniforms:Record<string,unknown>;vertexShader:string;fragmentShader:string},atlas:THREE.Texture){
 shader.uniforms.uSurfaceAtlas={value:atlas};
 shader.vertexShader='varying vec3 vSurfaceNormal;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSurfaceNormal = normalize(mat3(modelMatrix) * normal);');
 shader.fragmentShader=`uniform sampler2D uSurfaceAtlas; varying vec3 vSurfaceNormal;\n`+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float surfaceID=clamp(-vGlow,1.0,4.0);float surfaceMask=step(.5,-vGlow);
 vec3 axis=abs(vSurfaceNormal);vec2 surfaceUV=axis.y>max(axis.x,axis.z)?vWorldPoint.xz:axis.x>axis.z?vWorldPoint.zy:vWorldPoint.xy;
 surfaceUV*=surfaceID>2.5?1.5:1.0;
 vec2 atlasUV=vec2((fract(surfaceUV.x)*254.0+1.0)/256.0,((surfaceID-1.0)*256.0+fract(surfaceUV.y)*254.0+1.0)/1024.0);
 vec4 surfaceSample=texture2D(uSurfaceAtlas,atlasUV);
 diffuseColor.rgb*=mix(vec3(1.0),surfaceSample.rgb*1.48,surfaceMask);
 `);
 shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 roughnessFactor=mix(roughnessFactor,clamp((surfaceID>3.5?.62:.88)+(surfaceSample.a-.5)*.18,.45,.98),surfaceMask);

 `);
 shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,surfaceID>3.5?.62:.015,surfaceMask);');
 shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 vec3 sigmaX=normalize(dFdx(-vViewPosition)),sigmaY=normalize(dFdy(-vViewPosition));
 vec3 surfaceR1=cross(sigmaY,normal),surfaceR2=cross(normal,sigmaX);
 float surfaceDet=dot(sigmaX,surfaceR1)*faceDirection;
 vec2 heightGradient=vec2(dFdx(surfaceSample.a),dFdy(surfaceSample.a))*.38*surfaceMask;
 normal=normalize(abs(surfaceDet)*normal-sign(surfaceDet)*(heightGradient.x*surfaceR1+heightGradient.y*surfaceR2));
 `);
}
