import {finishEnemySurfaces} from './enemy-regalia.js';
import {buildEnemyDetail} from './enemy-detail.js';
/** Armored, masked sentinels and the larger horned shadow-eater. Original geometry. */
export function buildEnemy(m,x,z,boss=false,pose={}){
 const begin=m.v.length,q=boss?1.2:1,t=pose.time??0,armor=pose.affinity==='light'?[.23,.25,.25]:pose.affinity==='yinYang'?[.13,.12,.18]:boss?[.035,.043,.058]:[.075,.09,.11],trim=pose.affinity==='light'?[.49,.43,.30]:pose.affinity==='yinYang'?[.51,.49,.43]:boss?[.31,.23,.13]:[.32,.36,.39];
 const p=(a,b,c)=>[x+(a+(pose.species==='goblin'?Math.max(0,b-.45)*.20:0))*q,b*q,z+c*q],rod=(a,b,r,col=armor,r2=r)=>m.rod(p(...a),p(...b),r*q,col,0,r2*q);
 const glow=pose.affinity==='light'?[1,.69,.24]:pose.affinity==='yinYang'?[.78,.61,1]:[.42,.53,.9];
 // Devourers are crowned astral creatures rather than enlarged foot soldiers.
 if(pose.species==='devourer'){
  const bob=Math.sin(t*1.7)*.025;
  m.sphere(p(0,.75+bob,0),[.19*q,.34*q,.19*q],armor,18,12);
  m.sphere(p(.08,.84+bob,0),[.13*q,.22*q,.14*q],trim,14,9);
  m.sphere(p(.19,.88+bob,0),[.035*q,.095*q,.075*q],glow,14,8,.85);
  for(const side of [-1,1]){
   for(let i=0;i<5;i++){let h=.58+i*.09;rod([.09,h,side*.13],[-.17,h+.09,side*(.24+i*.01)],.018,armor,.008);}
   rod([-.015,.98,side*.13],[-.17,1.27,side*.28],.05,trim,.025);rod([-.17,1.27,side*.28],[-.06,1.5,side*.21],.025,trim,.001);
   rod([0,.95,side*.19],[.12,.60,side*.35],.075,armor,.042);rod([.12,.60,side*.35],[.27,.39,side*.27],.042,trim,.015);
   for(let i=0;i<3;i++)rod([.27,.39,side*(.25+i*.035)],[.36,.26,side*(.23+i*.035)],.015,trim,.001);
   for(let i=0;i<4;i++){const a=-.23-i*.07,h=.92+i*.13,w=side*(.24+i*.09);m.tri(p(-.04,.97,side*.14),p(a,h,w),p(a-.05,h-.30,w),armor);rod([-.04,.97,side*.14],[a,h,w],.012,trim,.003);}
  }
  m.sphere(p(.02,1.12+bob,0),[.12*q,.16*q,.105*q],armor,16,10);
  m.tri(p(.15,1.20,-.11),p(.20,1.04,0),p(.15,1.20,.11),trim);
  for(const side of [-1,1])m.sphere(p(.145,1.15,side*.047),[.014*q,.018*q,.032*q],glow,8,5,2);
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2+t*.18,b=(i+1)/9*Math.PI*2+t*.18;rod([Math.cos(a)*.35,1.40+Math.sin(a)*.15,-.10],[Math.cos(b)*.35,1.40+Math.sin(b)*.15,-.10],.008,glow,.008);}
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2+t*.13;rod([Math.cos(a)*.13,.54,Math.sin(a)*.13],[Math.cos(a+.3)*.25,.08,Math.sin(a+.3)*.25],.055,armor,.002);}
  m.ring(x,z,glow,.04,.84);buildEnemyDetail(m,p,rod,pose,boss);finishEnemySurfaces(m,begin,pose);m.transform(begin,x,z,pose);return;
 }
 // Dragons have a horizontal body, four legs, wings and a long tail.
 if(pose.species==='dragon'){
  const hide=pose.affinity==='light'?[.24,.23,.18]:pose.affinity==='yinYang'?[.19,.17,.23]:[.035,.065,.07];
  const ell=(a,b,c,rx,ry,rz,col=hide)=>m.sphere(p(a,b,c),[rx*q,ry*q,rz*q],col,16,10);
  ell(-.10,.44,0,.32,.19,.18);ell(.11,.47,0,.17,.21,.17);
  // Curved neck and layered muzzle, with a visible lower jaw.
  for(const v of [[.16,.53,.115,.13],[.23,.64,.085,.12],[.32,.73,.08,.095]])ell(v[0],v[1],0,v[2],v[3],.09);
  ell(.43,.765,0,.145,.082,.09);ell(.56,.735,0,.08,.042,.066);ell(.49,.696,0,.12,.022,.056);
  for(const side of [-1,1]){
   ell(.48,.78,side*.079,.03,.018,.012,[.014,.023,.022]);ell(.492,.781,side*.088,.014,.011,.006,glow);
   ell(.61,.747,side*.039,.009,.009,.011,[.01,.015,.016]);
   // Flexed thighs, hocks and padded talons replace straight posts and box feet.
   for(const hind of [false,true]){
    const x=hind?-.26:.16,z=side*.15,knee=[x+(hind?-.055:.015),.24,side*.20],hock=[x+(hind?.035:.025),.095,side*.22];
    ell(x,.40,z,hind?.09:.055,.13,.065);rod([x,.42,z],knee,hind?.065:.043,hide,hind?.048:.031);ell(...knee,.050,.057,.050);
    rod(knee,hock,.032,hide,.024);rod(hock,[x+.08,.045,side*.24],.024,hide,.030);ell(x+.08,.045,side*.24,.083,.036,.053);
    for(let toe=0;toe<3;toe++)rod([x+.11,.035,side*.24+(toe-1)*.029],[x+.18,.015,side*.24+(toe-1)*.034],.008,[.48,.46,.36],.001);
   }
  }
  const tail=[[-.35,.43,0],[-.48,.35,.01],[-.60,.34,.035],[-.71,.41,.06],[-.77,.49,.07]];
  for(let i=0;i<4;i++)rod(tail[i],tail[i+1],.066-i*.014,hide,.049-i*.014);
  for(let i=0;i<5;i++)ell(.15-i*.068,.32+i*.007,0,.047,.025,.12,pose.affinity==='light'?[.45,.41,.30]:[.16,.20,.19]);
  buildEnemyDetail(m,p,rod,pose,boss);m.ring(x,z,trim,.04,boss?.86:.72);finishEnemySurfaces(m,begin,pose);m.transform(begin,x,z,pose);return;
 }

 const wave=Math.sin(pose.gait??0)*(pose.walk??0)*.07;
 for(const side of [-1,1]){
   rod([0,.42,side*.10],[-.035+side*wave,.23,side*.105],.056,armor,.043);
   rod([-.035+side*wave,.23,side*.105],[side*wave,.045,side*.11],.035,trim,.025);
   m.box(p(.045+side*wave,.035,side*.11),[.14*q,.07*q,.09*q],armor);
   rod([.01,.68,side*.18],[.07,.41,side*.24],.043,armor,.028);
   m.sphere(p(.015,.65,side*.16),[.11*q,.07*q,.10*q],trim,8,5);
   // Tattered mantle: dark, pointed folds.
   const sway=Math.sin(t*1.5+side)*.018;
   m.tri(p(-.08,.70,side*.12),p(-.18,.21,side*(.22+sway)),p(-.03,.34,side*.16),boss?[.015,.02,.032]:[.035,.055,.07]);
 }
 m.sphere(p(0,.50,0),[pose.species==='goblin'?.105*q:.13*q,.22*q,pose.species==='goblin'?.115*q:.16*q],armor,10,7);
 for(const h of [.4,.49,.58])m.box(p(.112,h,0),[.035*q,.025*q,.27*q],trim);
 if(pose.kind==='shadeGuard'){
   const shield=pose.armored?[.11,.24,.32]:[.11,.14,.16];
   m.quad(p(.19,.68,-.15),p(.19,.68,.15),p(.23,.36,.11),p(.23,.36,-.11),shield);
   for(const side of [-1,1])rod([.19,.68,side*.15],[.23,.36,side*.11],.009,trim);
   m.tri(p(.20,.67,-.14),p(.20,.67,.14),p(.25,.48,0),trim);
   m.sphere(p(.255,.51,0),[.008*q,.031*q,.022*q],pose.armored?[.18,.50,.68]:[.14,.17,.18],8,5,pose.armored?.7:0);
 }
 if(pose.kind==='displacer'){
  rod([.16,.06,-.24],[.16,1.10,-.24],.016,[.21,.34,.40]);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,b=(i+1)/12*Math.PI*2;rod([.16+Math.cos(a)*.12,1.02+Math.sin(a)*.16,-.24],[.16+Math.cos(b)*.12,1.02+Math.sin(b)*.16,-.24],.009,[.30,.58,.68]);}
  m.sphere(p(.16,1.02,-.24),[.034*q,.045*q,.034*q],[.35,.80,.88],8,5,1.3);
 }
 if(pose.kind==='sunArcher'){

   for(let i=0;i<10;i++){let a=(i/10-.5)*Math.PI,b=((i+1)/10-.5)*Math.PI;rod([.12+Math.cos(a)*.16,.60+Math.sin(a)*.34,-.24],[.12+Math.cos(b)*.16,.60+Math.sin(b)*.34,-.24],.012,trim);}
   rod([.12,.26,-.24],[.12,.94,-.24],.003,[.60,.50,.31]);
   m.sphere(p(.26,.60,-.24),[.017*q,.026*q,.017*q],pose.lit?[.98,.56,.16]:[.15,.19,.22],8,5,pose.lit?1.4:0);
 }
 m.sphere(p(.012,.82,0),[.11*q,.14*q,.10*q],armor,8,5);
 if(pose.species==='goblin')for(const side of [-1,1]){m.tri(p(.05,.87,side*.06),p(-.03,.94,side*.28),p(-.06,.76,side*.07),trim);m.sphere(p(.12,.79,0),[.08*q,.07*q,.08*q],armor,8,5);}
 if(pose.species==='devourer')for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.2; m.sphere(p(Math.cos(a)*.32,1.1+Math.sin(a)*.28,0),[.035*q,.035*q,.035*q],trim,6,4,1.4);}
 if(pose.affinity==='yinYang'){m.sphere(p(.135,.60,-.06),[.02*q,.055*q,.05*q],[.93,.88,.72],8,5,1);m.sphere(p(.14,.60,.06),[.02*q,.055*q,.05*q],[.12,.07,.2],8,5,1);}
 // Swept mask, horizontal glowing slit, blade-like lower face.
 m.tri(p(.13,.88,-.09),p(.13,.88,.09),p(.17,.74,0),trim);
 m.quad(p(.142,.832,-.065),p(.142,.832,.065),p(.15,.817,.045),p(.15,.817,-.045),boss?[.91,.29,.08]:[.64,.49,.19],1.3);
 rod([.08,.41,-.24],[.10,.91,-.24],.015,trim);
 if(pose.kind!=='sunArcher')m.tri(p(.10,.9,-.24),p(.23,1.04,-.24),p(.16,.69,-.24),[.31,.36,.38]);
 const specialColors={lightWarden:[1,.72,.25],shadowWeaver:[.55,.25,.85],binder:[.65,.20,.57],warper:[.20,.60,.85],illusionist:[.25,.80,.65],decoy:[.28,.64,.59]};
 const sigil=specialColors[pose.kind];
 if(sigil){
   m.sphere(p(.12,.62,-.25),[.07,.09,.07],sigil,8,5,1.6);
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2+t*.6,b=(i+1)/12*Math.PI*2+t*.6;rod([Math.cos(a)*.28,1.12,Math.sin(a)*.28],[Math.cos(b)*.28,1.12,Math.sin(b)*.28],.009,sigil);}
   if(pose.kind==='binder')for(let i=0;i<5;i++)m.sphere(p(.17,.3+i*.13,-.25),[.025,.04,.025],sigil,5,3,1);
   if(pose.kind==='warper')for(const side of [-1,1])rod([-.02,.87,side*.09],[-.17,1.17,side*.24],.027,sigil,.001);
   if(pose.kind==='illusionist')m.sphere(p(0,1.28,0),[.08,.08,.08],sigil,8,5,2);
 }
 if(boss){
   for(const side of [-1,1]){
     rod([-.02,.89,side*.08],[-.15,1.09,side*.18],.043,trim,.026);
     rod([-.15,1.09,side*.18],[-.10,1.26,side*.20],.026,trim,.001);
     for(let i=0;i<3;i++)m.tri(p(-.06,.71,side*(.14+i*.04)),p(-.19-i*.035,.91+i*.04,side*(.19+i*.07)),p(.04,.65,side*(.20+i*.04)),armor);
   }
   m.sphere(p(.14,.56,0),[.017*q,.035*q,.03*q],[.75,.25,.07],8,5,1.2);
 }
 if(pose.species==='goblin'){
  const skin=pose.affinity==='light'?[.33,.36,.28]:[.12,.16,.145];
  m.sphere(p(.10,.80,0),[.115*q,.12*q,.105*q],skin,16,10);m.sphere(p(.185,.78,0),[.07*q,.055*q,.075*q],skin,12,8);
  for(const side of [-1,1]){m.tri(p(.03,.89,side*.07),p(-.08,.96,side*.31),p(-.06,.76,side*.10),skin);m.sphere(p(.19,.84,side*.057),[.018*q,.018*q,.015*q],glow,8,5,1.5);rod([.22,.74,side*.05],[.245,.80,side*.048],.012,[.87,.83,.63],.001);}
  m.box(p(.10,.38,0),[.04*q,.06*q,.26*q],[.28,.16,.08]);
 }else{
  for(const side of [-1,1])for(let i=0;i<3;i++){const h=.70-i*.045,w=side*(.19+i*.014);m.sphere(p(.02,h,w),[.13*q,.045*q,.095*q],i%2?trim:armor,12,6);}
  // Faceted breastplate and a narrow crest distinguish the mercenaries from goblins.
  for(const side of [-1,1])m.tri(p(.147,.66,0),p(.15,.48,side*.14),p(.17,.37,0),trim);
  rod([.03,.91,0],[-.10,1.13,0],.025,trim,.001);m.box(p(.125,.82,0),[.035*q,.012*q,.15*q],[.012,.02,.03]);
 }
 for(const side of [-1,1]){for(let i=0;i<3;i++)m.sphere(p(.10,.55-i*.07,side*.11),[.017*q,.017*q,.017*q],trim,6,4);rod([.15,.45,side*.23],[.29,.79,side*.23],.018,trim,.008);}
 m.ring(x,z,boss?[.68,.18,.08]:[.42,.15,.10],.04,boss?.86:.72);
 buildEnemyDetail(m,p,rod,pose,boss);
 finishEnemySurfaces(m,begin,pose);m.transform(begin,x,z,pose.kind==='decoy'?{...pose,alpha:(pose.alpha??1)*.42}:pose);
}
