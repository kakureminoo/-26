/** Shared framing for gallery snapshots and the interactive viewer. */
export function modelFraming(vertices:readonly number[],aspect:number){
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<vertices.length;i+=11)for(let j=0;j<3;j++){lo[j]=Math.min(lo[j],vertices[i+j]);hi[j]=Math.max(hi[j],vertices[i+j]);}
 const center=vertices.length?lo.map((v,i)=>(v+hi[i])/2):[0,0,0];let radius=.1;
 for(let i=0;i<vertices.length;i+=11)radius=Math.max(radius,Math.hypot(vertices[i]-center[0],vertices[i+1]-center[1],vertices[i+2]-center[2]));
 return {center,width:radius*2.35*Math.max(1,aspect)};
}
