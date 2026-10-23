import { buildEnemy } from './enemy-model.js';
import { buildHound } from './hound-model.js';
const idleModels=new Map();
const cachedModel=(key,build)=>{if(!idleModels.has(key)){if(idleModels.size>=96)idleModels.delete(idleModels.keys().next().value);const m=new MeshBuilder();build(m);idleModels.set(key,m.v)}return idleModels.get(key)};
class MeshBuilder{
 constructor(){this.v=[];this.surface=0}
 tri(a,b,c,color,emit=0,alpha=1){let u=b.map((v,i)=>v-a[i]),z=c.map((v,i)=>v-a[i]),n=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]],l=Math.hypot(...n)||1;n=n.map(v=>v/l);for(let p of [a,b,c])this.v.push(...p,...n,...color,emit>0?emit:this.surface?-this.surface:emit,alpha)}
 quad(a,b,c,d,col,e=0,al=1){this.tri(a,b,c,col,e,al);this.tri(a,c,d,col,e,al)}
 box(c,s,col,e=0){let [x,y,z]=c,[a,b,d]=s.map(v=>v/2),p=[[x-a,y-b,z-d],[x+a,y-b,z-d],[x+a,y+b,z-d],[x-a,y+b,z-d],[x-a,y-b,z+d],[x+a,y-b,z+d],[x+a,y+b,z+d],[x-a,y+b,z+d]];for(let q of [[3,7,6,2],[0,1,5,4],[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5]])this.quad(...q.map(i=>p[i]),col,e)}
 sphere(c,s,col,segments=12,rings=8,e=0){let start=this.v.length;let p=(i,j)=>{let a=i/segments*Math.PI*2,t=j/rings*Math.PI;return [c[0]+Math.cos(a)*Math.sin(t)*s[0],c[1]+Math.cos(t)*s[1],c[2]+Math.sin(a)*Math.sin(t)*s[2]]};for(let j=0;j<rings;j++)for(let i=0;i<segments;i++)this.quad(p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1),col,e);for(let k=start;k<this.v.length;k+=11){let n=[0,1,2].map(i=>(this.v[k+i]-c[i])/(s[i]*s[i]));let length=Math.hypot(...n)||1;for(let i=0;i<3;i++)this.v[k+3+i]=n[i]/length}}
 rod(a,b,r,col,e=0,r2=r){let v=b.map((q,i)=>q-a[i]),l=Math.hypot(...v);v=v.map(q=>q/l);let axis=Math.abs(v[1])<.8?[0,1,0]:[1,0,0],cross=(x,y)=>[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]],u=cross(v,axis),ul=Math.hypot(...u);u=u.map(q=>q/ul);let z=cross(v,u),p=(base,i,rr)=>base.map((q,k)=>q+rr*(u[k]*Math.cos(i/8*Math.PI*2)+z[k]*Math.sin(i/8*Math.PI*2)));for(let i=0;i<8;i++){this.quad(p(a,i,r),p(a,i+1,r),p(b,i+1,r2),p(b,i,r2),col,e);this.tri(b,p(b,i,r2),p(b,i+1,r2),col,e)}}
 ear(p,col){let [x,y,z]=p;this.tri([x-.09,y,z-.06],[x+.09,y,z-.06],[x+.025,y+.23,z],col);this.tri([x+.09,y,z-.06],[x+.04,y,z+.06],[x+.025,y+.23,z],col);this.tri([x+.04,y,z+.06],[x-.09,y,z-.06],[x+.025,y+.23,z],col)}
 ring(x,z,color,y=.037,size=.94){let h=size/2,t=.016;this.box([x,y,z-h],[size,.012,t],color,2);this.box([x,y,z+h],[size,.012,t],color,2);this.box([x-h,y,z],[t,.012,size],color,2);this.box([x+h,y,z],[t,.012,size],color,2)}

 transform(start,x,z,pose={}){let a=pose.yaw??0,c=Math.cos(a),s=Math.sin(a),b=pose.pitch??0,cb=Math.cos(b),sb=Math.sin(b),flash=pose.flash??0;for(let i=start;i<this.v.length;i+=11){let dx=this.v[i]-x,dy=this.v[i+1]-.35,dz=this.v[i+2]-z,px=dx*cb-dy*sb,py=dx*sb+dy*cb;this.v[i]=x+px*c-dz*s;this.v[i+1]=.35+py+(pose.y??0);this.v[i+2]=z+px*s+dz*c;let nx=this.v[i+3]*cb-this.v[i+4]*sb,ny=this.v[i+3]*sb+this.v[i+4]*cb,nz=this.v[i+5];this.v[i+3]=nx*c-nz*s;this.v[i+4]=ny;this.v[i+5]=nx*s+nz*c;for(let j=6;j<=8;j++)this.v[i+j]=this.v[i+j]*(1-flash)+flash;this.v[i+10]*=pose.alpha??1}}
 hound(x,z,kind,time=0,scale=1,dim=0,pose={}){
  if(pose.walk||pose.jaw||pose.onlyEquipment){buildHound(this,x,z,kind,time,scale,dim,pose);return}
  const key=JSON.stringify(['hound',kind,scale,dim,pose.hound,pose.equipment,pose.gear,pose.sigil]);
  const vertices=cachedModel(key,m=>buildHound(m,0,0,kind,0,scale,dim,{hound:pose.hound,equipment:pose.equipment,gear:pose.gear,sigil:pose.sigil}));
  this.instance(vertices,x,z,{...pose,y:(pose.y??0)+Math.sin(time*2.1)*.005*scale});
 }
 instance(vertices,x,z,pose){const start=this.v.length;for(let i=0;i<vertices.length;i+=11){this.v.push(vertices[i]+x,vertices[i+1],vertices[i+2]+z,vertices[i+3],vertices[i+4],vertices[i+5],vertices[i+6],vertices[i+7],vertices[i+8],vertices[i+9],vertices[i+10])}this.transform(start,x,z,pose)}
 lantern(x,z,portable=false){let c=[.12,.10,.10];this.box([x,.05,z],[.27,.10,.27],c);this.box([x,.44,z],[.26,.06,.26],[.34,.23,.08]);this.box([x,.16,z],[.25,.04,.25],[.34,.23,.08]);for(let a of [-1,1])for(let b of [-1,1])this.rod([x+a*.10,.17,z+b*.10],[x+a*.10,.43,z+b*.10],.012,[.18,.13,.065]);this.sphere([x,.30,z],[.075,.12,.075],[1,.60,.12],8,5,4);this.rod([x,.47,z],[x,.56,z],.05,[.25,.16,.05],0,.012);if(portable)this.ring(x,z,[.95,.57,.15],.043,.46)}
 crate(x,z){const surface=this.surface;this.surface=2;this.box([x,.40,z],[.82,.80,.82],[.21,.13,.075]);this.box([x,.82,z],[.86,.06,.86],[.32,.21,.12]);for(let y of [.15,.67])this.box([x,y,z+.423],[.82,.06,.035],[.44,.29,.14]);for(let side of [-1,1])this.box([x+side*.36,.40,z+.44],[.065,.80,.055],[.42,.25,.13]);this.rod([x-.34,.12,z+.45],[x+.34,.70,z+.45],.027,[.49,.32,.16]);this.rod([x+.34,.12,z+.46],[x-.34,.70,z+.46],.027,[.49,.32,.16]);this.surface=4;for(let a of [-1,1])for(let y of [.13,.71])this.sphere([x+a*.36,y,z+.48],[.023,.023,.014],[.06,.065,.09],6,3);this.surface=2;for(let y of [.15,.66])this.box([x+.43,y,z],[.055,.065,.80],[.35,.21,.12]);this.surface=surface;}
 goblin(x,z,boss=false,pose={}){
  if(pose.walk||['dragon','devourer'].includes(pose.species)){buildEnemy(this,x,z,boss,pose);return}
  const key=JSON.stringify(['enemy',boss,pose.kind,pose.species,pose.affinity,pose.armored,pose.lit]);
  const vertices=cachedModel(key,m=>buildEnemy(m,0,0,boss,{kind:pose.kind,species:pose.species,affinity:pose.affinity,armored:pose.armored,lit:pose.lit}));
  this.instance(vertices,x,z,pose);
 }
}


export { MeshBuilder };
