/** Original fitted metalwork and cloth. Item IDs and bonuses stay in game/equipment.ts. */
export function buildHoundEquipment(mesh,p,ell,rod,dark,time,id){
 if(!id)return;
 const gold=[.64,.43,.18],edge=[.88,.69,.36],silver=[.43,.56,.62],steel=[.14,.23,.28],leather=[.024,.035,.041];
 const line=(a,b,r,col=silver,glow=0)=>rod(a,b,r,col,r,glow);
 // Closed bevelled pendant: dark sidewall, bright bevel, recessed face and raised engraving.
 function plate(points,cx,cy,z,side,col,rim=silver){
  const center=points.reduce((v,q)=>[v[0]+q[0]/points.length,v[1]+q[1]/points.length],[0,0]);
  const v=(q,depth,shrink=1)=>p(cx+center[0]+(q[0]-center[0])*shrink,cy+center[1]+(q[1]-center[1])*shrink,z+side*depth);
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length];
   mesh.quad(v(a,-.006),v(b,-.006),v(b,.002),v(a,.002),steel);
   mesh.quad(v(a,.002),v(b,.002),v(b,.007,.77),v(a,.007,.77),rim);
   mesh.tri(p(cx+center[0],cy+center[1],z+side*.008),v(a,.007,.77),v(b,.007,.77),col,.12);
  }
 }
 function loop(cx,cy,z,side,rx=.010,ry=.013,col=silver){
  for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4;line([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,z],[cx+Math.cos(b)*rx,cy+Math.sin(b)*ry,z],.0027,col);}
 }
 function gem(cx,cy,z,side,color,size=.014){
  const shape=[[0,size],[size*.75,0],[0,-size],[-size*.75,0]];
  for(let i=0;i<4;i++){const a=shape[i],b=shape[(i+1)%4];mesh.tri(p(cx+a[0],cy+a[1],z),p(cx+b[0],cy+b[1],z),p(cx-size*.14,cy+size*.17,z+side*.010),color.map(c=>Math.min(1,c*(i%2?.8:1.15))),.6);}
 }
 if(id==='lantern-collar'){
  rod([.13,.53,0],[.17,.59,0],.116,leather,.110);
  for(const side of [-1,1]){
   for(let i=0;i<5;i++){
    const x=.035+i*.033,y=.615-i*.020,z=side*(.103+Math.sin(i*.6)*.017);
    plate([[-.017,.006],[0,.040],[.020,.005],[.014,-.018],[-.016,-.017]],x,y,z,side,gold,edge);
    ell(x,y-.005,z+side*.010,.004,.004,.003,edge);
    if(i%2===0)gem(x,y+.011,z+side*.011,side,[.95,.50,.10],.009);
   }
   // Articulated chain and a little lantern cage rather than a flat badge.
   loop(.20,.52,side*.128,side,.012,.014,gold);loop(.215,.497,side*.142,side,.008,.012,gold);
   const cx=.217,cy=.449,z=side*.158;
   plate([[-.026,.027],[.026,.027],[.020,-.027],[-.020,-.027]],cx,cy,z,side,[.18,.09,.027],gold);
   gem(cx,cy,z+side*.012,side,[1,.57,.12],.023);
   for(const dx of [-.022,.022])line([cx+dx,cy-.027,z+side*.020],[cx+dx,cy+.027,z+side*.020],.0032,edge);
   for(const dy of [-.03,.03])line([cx-.026,cy+dy,z+side*.02],[cx+.026,cy+dy,z+side*.02],.004,gold);
   plate([[-.030,0],[0,.020],[.030,0]],cx,cy+.03,z,side,gold,edge);
   ell(cx,cy-.037,z,.006,.009,.006,edge);
  }
  return;
 }
 if(id==='shadow-weave'){
  const cloth=[.018,.030,.046],lining=[.038,.065,.084],thread=[.23,.37,.43];
  for(const side of [-1,1])for(let i=0;i<9;i++){
   const x=.12-i*.050,next=x-.051,fold=Math.sin(time*1.7+i*.65)*.005;
   const hem=.422+fold+(i%2)*.008,z=side*(.16+Math.sin(i*.7)*.008);
   // Back ridge, shoulder fold, long side panel and visible lining at the hem.
   mesh.quad(p(x,.665,0),p(next,.66,0),p(next,.59,side*.12),p(x,.598,side*.12),i%2?lining:cloth);
   mesh.quad(p(x,.598,side*.12),p(next,.59,side*.12),p(next,hem,z),p(x,hem+.012,z),i%2?cloth:lining);
   mesh.quad(p(x,hem+.012,z),p(next,hem,z),p(next,hem-.010,z-side*.005),p(x,hem+.002,z-side*.005),[.09,.14,.18]);
   line([x,hem+.023,z+side*.003],[next,hem+.011,z+side*.003],.0028,thread);
   if(i%2===0)line([x,.59,side*.123],[x-.008,hem+.030,z+side*.003],.0017,thread);
   // Paired silver stitches remain subtle in the shadow dog's black silhouette.
   if(i%2)line([x-.015,hem+.035,z+side*.004],[x-.025,hem+.029,z+side*.004],.0018,silver);
  }
  for(const side of [-1,1]){
   line([.15,.57,side*.10],[.10,.48,side*.16],.004,silver);loop(.10,.474,side*.17,side);
   plate([[0,.032],[.026,.005],[0,-.038],[-.026,.005]],.10,.423,side*.173,side,[.025,.07,.10],silver);
   gem(.10,.425,side*.183,side,[.24,.60,.71],.018);
   for(let i=0;i<3;i++)line([.09+i*.01,.387,side*.174],[.085+i*.015,.36,side*.174],.0024,thread);
   for(let i=0;i<3;i++){const x=-.12-i*.065;line([x,.505,side*.17],[x-.018,.482,side*.17],.0025,thread);line([x-.018,.482,side*.17],[x-.036,.505,side*.17],.0025,thread);}
  }
  return;
 }
 const colors={fang:[.55,.52,.43],ward:[.18,.34,.40],vitality:[.10,.40,.25],stride:[.34,.50,.50],dusk:[.20,.30,.53],ember:[.70,.30,.07]};
 for(const side of [-1,1]){
  // Leather suspension, separate interlocking links and a reinforced eyelet.
  line([.14,.57,side*.10],[.12,.49,side*.154],.0045,leather);
  loop(.12,.485,side*.16,side,.008,.011);loop(.116,.466,side*.165,side,.007,.010);
  const cx=.11,cy=.416,z=side*.171,col=colors[id]??silver;
  const shape=(points,rim=silver)=>plate(points,cx,cy,z,side,col,rim);
  switch(id){
   case 'fang':
    shape([[-.019,.036],[.021,.031],[.014,-.010],[-.022,-.047],[-.005,-.007]],gold);
    line([.10,.439,side*.182],[.127,.434,side*.182],.003,gold);
    line([.114,.427,side*.182],[.103,.399,side*.182],.0023,edge);break;
   case 'ward':
    shape([[0,.037],[.031,.023],[.025,-.020],[0,-.044],[-.025,-.020],[-.031,.023]]);
    line([cx,cy+.022,side*.184],[cx,cy-.022,side*.184],.0028,silver);
    line([cx-.016,cy+.006,side*.184],[cx+.016,cy+.006,side*.184],.0028,silver);
    for(const dx of [-.021,.021])ell(cx+dx,cy+.020,side*.181,.0037,.0037,.003,silver);break;
   case 'vitality':
    shape([[0,.034],[.025,.016],[.025,-.020],[0,-.035],[-.025,-.020],[-.025,.016]],gold);
    gem(cx,cy,side*.184,side,[.16,.65,.38],.026);
    for(const dy of [-.026,.026])ell(cx,cy+dy,side*.19,.006,.005,.004,gold);
    for(const dx of [-.021,.021])ell(cx+dx,cy,side*.19,.004,.006,.004,gold);break;
   case 'stride':
    shape([[-.022,-.042],[-.005,.030],[.037,.045],[.021,.019],[.028,.019],[.006,-.006],[.014,-.005]]);
    line([cx-.012,cy-.024,side*.184],[cx+.018,cy+.029,side*.184],.0025,silver);
    for(let i=0;i<3;i++)line([cx+i*.005,cy-.005+i*.012,side*.185],[cx+.019+i*.004,cy+.001+i*.012,side*.185],.002,edge);break;
   case 'dusk':
    // Curved, thick moon with individually bevelled segments (no filled crescent fan).
    for(let i=0;i<10;i++){const a=(.25+i*.15)*Math.PI,b=a+.15*Math.PI;
     const pts=[[Math.cos(a)*.032,Math.sin(a)*.039],[Math.cos(b)*.032,Math.sin(b)*.039],[.011+Math.cos(b)*.022,.004+Math.sin(b)*.029],[.011+Math.cos(a)*.022,.004+Math.sin(a)*.029]];
     plate(pts,cx,cy,z,side,col,silver);
    }
    gem(cx+.022,cy+.004,side*.185,side,[.46,.70,.95],.011);break;
   case 'ember':
    shape([[0,.043],[.012,.022],[.037,.010],[.020,-.008],[0,-.040],[-.020,-.008],[-.037,.010],[-.012,.022]],gold);
    gem(cx,cy,side*.183,side,[1,.54,.10],.026);
    for(const dx of [-.027,.027])ell(cx+dx,cy+.008,side*.183,.004,.004,.003,edge);break;
  }
 }
}
