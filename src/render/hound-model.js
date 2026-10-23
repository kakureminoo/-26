import {houndDesigns} from './hound-design';
import { buildHoundEquipment } from './hound-equipment.js';
/** Original procedural model: anatomical volumes, jointed gait and fitted equipment. */
export function buildHound(mesh, x, z, kind, time=0, scale=1, dim=0, pose={}) {
  const start=mesh.v.length, dark=kind==='shadow', design=houndDesigns[pose.hound]??houndDesigns[dark?'dusk':'dawn'];
  const fur=design.coat, cream=dark?[.075,.095,.145]:[.85,.86,.79];
  const back=dark?[.015,.023,.041]:[.23,.29,.34], skin=dark?[.043,.034,.047]:[.34,.21,.18];
  const nose=dark?[.005,.008,.012]:[.025,.027,.03], gold=[.7,.4,.1], steel=[.15,.21,.29];
  const walk=pose.walk??0, gait=pose.gait??0, breath=Math.sin(time*2.1)*.005;
  const p=(a,b,c)=>[x+a*scale*design.body,(b*design.height+breath)*scale,z+c*scale*design.width];
  const ell=(a,b,c,rx,ry,rz,col=fur,glow=0)=>mesh.sphere(p(a,b,c),[rx*scale,ry*scale,rz*scale],col,18,11,glow);
  const rod=(a,b,r,col=fur,r2=r,glow=0)=>mesh.rod(p(...a),p(...b),r*scale,col,glow,r2*scale);
  if(pose.onlyEquipment){
    buildHoundEquipment(mesh,p,ell,rod,dark,time,pose.equipment);
    if(pose.sigil)for(const side of [-1,1]){const color=pose.sigil==='aurora'?[1,.69,.23]:[.56,.43,1];ell(.13,.55,side*.17,.012,.019,.006,color,1.3);}
    mesh.transform(start,x,z,pose);return;
  }
  // Continuous ribcage: tucked abdomen, full forechest and sloping withers.
  const sections=[[-.37,.40,.035,.065],[-.30,.43,.105,.125],[-.20,.46,.112,.12],[-.08,.47,.108,.14],[.04,.49,.135,.18],[.13,.49,.14,.19],[.20,.47,.085,.145]];
  const smoothSections=[];
  for(let i=0;i<sections.length-1;i++)for(let step=0;step<4;step++){
    const t=step/4,a=sections[Math.max(0,i-1)],b=sections[i],c=sections[i+1],d=sections[Math.min(sections.length-1,i+2)];
    smoothSections.push(b.map((v,j)=>.5*((2*v)+(-a[j]+c[j])*t+(2*a[j]-5*v+4*c[j]-d[j])*t*t+(-a[j]+3*v-3*c[j]+d[j])*t*t*t)));
  }
  smoothSections.push(sections.at(-1));const torsoStart=mesh.v.length;
  for(let i=0;i<smoothSections.length-1;i++)for(let j=0;j<20;j++){
    const point=(s,j)=>{let a=j/20*Math.PI*2;return p(s[0],s[1]+Math.cos(a)*s[3],Math.sin(a)*s[2])};
    mesh.quad(point(smoothSections[i],j),point(smoothSections[i],j+1),point(smoothSections[i+1],j+1),point(smoothSections[i+1],j),fur);
  }
  for(let k=torsoStart;k<mesh.v.length;k+=11){
    const localX=(mesh.v[k]-x)/scale, localY=mesh.v[k+1]/scale-breath, localZ=(mesh.v[k+2]-z)/scale;
    let i=smoothSections.findIndex(s=>s[0]>=localX-.00001);if(i<0)i=smoothSections.length-1;
    const s=smoothSections[i],before=smoothSections[Math.max(0,i-1)],after=smoothSections[Math.min(smoothSections.length-1,i+1)],dx=after[0]-before[0]||1;
    const dy=localY-s[1],cy=(after[1]-before[1])/dx,ry=(after[3]-before[3])/dx,rz=(after[2]-before[2])/dx;
    const n=[-dy*cy/(s[3]*s[3])-dy*dy*ry/Math.pow(s[3],3)-localZ*localZ*rz/Math.pow(s[2],3),dy/(s[3]*s[3]),localZ/(s[2]*s[2])],length=Math.hypot(...n)||1;
    const blend=Math.max(0,Math.min(1,dy/s[3]*1.4)),coat=dy>0?back:cream;
    for(let j=0;j<3;j++){mesh.v[k+3+j]=n[j]/length;mesh.v[k+6+j]=fur[j]*(1-blend)+coat[j]*blend;}
  }
  ell(-.26,.43,0,.125,.153,.123);ell(.10,.51,0,.135,.19,.135,cream);
  // A low, forward-carried wolf head: wedge skull and long, tapered muzzle.
  rod([.09,.48,0],[.19,.62,0],.103,fur,.083);
  const head=[ [.12,.65,.073,.08], [.20,.69,.078,.095], [.28,.675,.073,.077], [.33,.642,.055,.044], [.405,.624,.041,.033], [.455,.618,.033,.025] ];
  for(let i=0;i<head.length-1;i++)for(let j=0;j<12;j++){
    const point=(v,k)=>{let a=k/12*Math.PI*2;return p(v[0],v[1]+Math.cos(a)*v[3],Math.sin(a)*v[2])};
    let col=j<3||j>9?back:j>4&&j<8?cream:fur;
    mesh.quad(point(head[i],j),point(head[i],j+1),point(head[i+1],j+1),point(head[i+1],j),col);
  }
  ell(.458,.621,0,.021,.021,.035,nose);
  ell(.369,.593-(pose.jaw??0)*.025,0,.080,.012,.037,fur);
  if((pose.jaw??0)>.1){ell(.37,.603,0,.065,.010,.032,nose);for(const side of [-1,1])for(let i=0;i<3;i++)rod([.32+i*.03,.608,side*.031],[.32+i*.03,.593,side*.030],.004,cream,.001);}
  for(const side of [-1,1]){
    rod([.315,.596,side*.043],[.44,.603,side*.031],.0025,nose);
    // Recessed almond sockets with a narrow luminous iris; no protruding eyeballs.
    const v=(a,b,c)=>p(a,b,side*c), eyeColor=dark?[.24,.66,.83]:[.98,.57,.12];
    mesh.quad(v(.239,.703,.075),v(.315,.678,.065),v(.298,.664,.072),v(.249,.677,.083),nose);
    mesh.tri(v(.251,.690,.084),v(.308,.677,.075),v(.279,.675,.083),eyeColor,1.1);
    // Heavy upper brow slopes into the muzzle, keeping the gaze sharp from every angle.
    mesh.tri(v(.222,.723,.074),v(.321,.691,.067),v(.251,.695,.091),back);
    mesh.tri(v(.222,.723,.074),v(.251,.695,.091),v(.200,.695,.088),fur);
    for(let i=0;i<3;i++){
      mesh.tri(v(.17-i*.015,.666-i*.019,.078),v(.11-i*.028,.619-i*.021,.12),v(.19-i*.012,.631-i*.016,.093),i%2?back:fur);
    }
    // Compact ears lean backward instead of the previous tall, toy-like silhouette.
    const twitch=Math.sin(time*.8+side)*.004;
    const a=v(.145,.735,.065),b=v(.227,.738,.077),tip=v(.133+twitch,.735+.12*design.ear,.096),rear=v(.162,.744,.034);
    mesh.tri(a,b,tip,back);mesh.tri(b,rear,tip,fur);mesh.tri(rear,a,tip,cream);
    mesh.tri(v(.163,.754,.071),v(.207,.752,.077),v(.144+twitch,.735+.091*design.ear,.089),dark?[.025,.034,.042]:[.12,.16,.21]);
    // Four limbs with separate shoulder/thigh, elbow, wrist/hock and padded feet.
    for(const hind of [false,true]){
      const root=hind?-.26:.105, sideZ=side*(hind?.095:.105);
      const phase=gait+(side>0?Math.PI:0)+(hind?Math.PI:0),wave=Math.sin(phase)*walk;
      const footX=root+wave*.10+(hind?-.015:.035), lift=Math.max(0,Math.cos(phase))*.075*walk;
      const kneeX=root+(hind?.07:-.024)+wave*.035, kneeY=hind?.27:.29;
      ell(root,.42,sideZ,hind?.068:.043,hind?.135:.117,.045,fur);
      rod([root,.42,sideZ],[kneeX,kneeY,sideZ],hind?.048:.034,fur,hind?.039:.029);
      const hock=[footX-(hind?.035:0),.115+lift*.5,sideZ];
      rod([kneeX,kneeY,sideZ],hock,.028,fur,.021);
      rod(hock,[footX,.052+lift,sideZ],.018,cream,.021);
      ell(footX+.025,.037+lift,sideZ,.053,.031,.037,cream);
      for(let toe=-1;toe<=1;toe++){
        ell(footX+.058,.028+lift,sideZ+toe*.019,.020,.018,.011,fur);
        rod([footX+.07,.022+lift,sideZ+toe*.019],[footX+.084,.018+lift,sideZ+toe*.019],.0035,nose,.001);
      }
    }
  }
  // Swept mane, cheek planes and fine inlaid markings make the pair readable at close range.
  const magic=dark?[.42,.56,.89]:[.89,.69,.30],under=dark?[.035,.055,.095]:[.62,.66,.63];
  for(const side of [-1,1]){
    for(let i=0;i<Math.round(6*design.ruff);i++){
      const a=.17-i*.035,h=.64-i*.014,w=side*(.095+i*.006);
      mesh.tri(p(a,h,w),p(a-.095,h+.035,w+side*.045),p(a-.02,h-.105,w+side*.016),i%2?under:back);
      mesh.tri(p(a,h,w),p(a-.04,h-.085,w+side*.016),p(a+.025,h-.055,w-side*.028),fur);
    }
    for(let i=0;i<3;i++){const a=.025-i*.07;rod([a,.53,side*.132],[a-.022,.49,side*.139],.0038,magic,.0025,.35);rod([a-.022,.49,side*.139],[a-.065,.51,side*.127],.003,magic,.0015,.3);}
    // Tear marking and nostril give the muzzle more definition without obscuring the eyes.
    rod([.29,.677,side*.081],[.257,.64,side*.088],.004,back,.002);
  }
  if(design.ornament==='reaper')for(const side of [-1,1]){rod([.18,.71,side*.08],[.09,.88,side*.15],.024,[.44,.36,.32],.013);rod([.09,.88,side*.15],[-.01,.91,side*.18],.013,[.59,.49,.42],.001);rod([.37,.61,side*.04],[.39,.55,side*.045],.007,[.68,.61,.49],.001);}
  if(design.ornament==='herald'){for(const side of [-1,1]){rod([.10,.64,side*.105],[-.06,.60,side*.13],.016,[.49,.41,.23],.010);ell(.075,.62,side*.13,.025,.037,.014,[.61,.72,.42],.6);}mesh.quad(p(-.04,.61,-.10),p(-.04,.61,.10),p(-.23,.43,.12),p(-.23,.43,-.12),[.09,.17,.14]);}
  if(pose.sigil){const bright=['aurora','nightwing'].includes(pose.sigil),color=pose.sigil==='aurora'?[1,.69,.23]:pose.sigil==='nightwing'?[.56,.43,1]:magic;for(const side of [-1,1]){const s=side*.165;rod([.075,.59,s],[.045,.555,s],.005,color,.005,bright?1.5:.5);rod([.045,.555,s],[.075,.52,s],.005,color,.005,bright?1.5:.5);rod([.075,.52,s],[.105,.555,s],.005,color,.005,bright?1.5:.5);rod([.105,.555,s],[.075,.59,s],.005,color,.005,bright?1.5:.5);}}
  // Tapering wolf tail and swept fur follow the direction of the body.
  const wag=Math.sin(time*1.35)*.035;
  const tail=[[-.32,.45,0],[-.40,.43,.01+wag*.2],[-.47,.38,.02+wag*.5],[-.49,.31,.03+wag],[-.47,.25,.04+wag]];
  tail.slice(1).forEach((v,i)=>rod(tail[i],v,.046-i*.008,i>1?back:fur,.037-i*.008));
  for(const side of [-1,1])for(let i=0;i<4;i++){
    mesh.tri(p(.10-i*.035,.59-i*.012,side*.084),p(-.045-i*.038,.49-i*.015,side*.137),p(.045-i*.029,.49-i*.013,side*.12),i%2?fur:back);
  }
  rod([.147,.538,0],[.173,.572,0],.097,dark?[.015,.023,.032]:[.025,.04,.055],.092);
  buildHoundEquipment(mesh,p,ell,rod,dark,time,pose.equipment??(pose.gear?(dark?'shadow-weave':'lantern-collar'):null));
  if(dark&&dim<=1)for(let i=0;i<3;i++){
    const sway=Math.sin(time*1.2+i)*.035;
    rod([-.19-i*.055,.3+i*.05,.04+sway],[-.34-i*.03,.35+i*.09,.06+sway],.011,[.025,.07,.09],.001,.15);
  }
  // Character-specific silhouettes: forged plates, branching horns and elemental crests.
  const accent=design.ornament==='embers'?[1,.18,.035]:design.ornament==='ice'?[.33,.72,.89]:design.ornament==='antler'?[.20,.44,.29]:dark?[.52,.43,.78]:[.78,.53,.19];
  for(const side of [-1,1]){
    if(['armor','crown'].includes(design.ornament)){
      ell(.08,.56,side*.135,.13,.10,.045,[.14,.16,.19]);
      for(let i=0;i<4;i++)rod([.16-i*.06,.63,side*.15],[.12-i*.06,.50,side*.17],.012,accent,.008);
    }
    if(['antler','crescent'].includes(design.ornament)){
      const horn=[[.17,.76,side*.07],[.10,.88,side*.12],[.02,.94,side*.14],[.04,1.01,side*.11]];
      for(let i=0;i<3;i++)rod(horn[i],horn[i+1],.018-i*.004,accent,.014-i*.004,.15);
      if(design.ornament==='antler')rod(horn[1],[.18,.95,side*.16],.010,accent,.002);
    }
    if(['ice','embers','crown'].includes(design.ornament))for(let i=0;i<5;i++){
      const a=.12-i*.08,h=.65-i*.014;
      rod([a,h,side*.08],[a-.045,h+.09+(i%2)*.035,side*.13],.026,accent,.001,.45);
    }
    if(design.ornament==='mist')for(let i=0;i<3;i++)rod([-.22-i*.05,.37,side*.07],[-.40-i*.05,.45+i*.035,side*.12],.017,[.08,.14,.24],.002,.15);
  }
  if(design.ornament==='sun')ell(.15,.57,.14,.03,.04,.012,accent,.35);
  mesh.transform(start,x,z,pose);
}
