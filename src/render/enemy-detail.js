import {buildEnemyRegalia} from './enemy-regalia.js';
/** Original sculpted armor and anatomy. Reused by combat and the collection viewer. */
export function buildEnemyDetail(m,p,rod,pose,boss){
 buildEnemyRegalia(m,p,rod,pose,boss);
 const light=pose.affinity==='light',dual=pose.affinity==='yinYang';
 const metal=light?[.20,.23,.24]:[.085,.10,.12],edge=light?[.47,.43,.32]:[.35,.39,.42];
 const leather=[.085,.052,.036],bone=[.57,.52,.40],magic=light?[.95,.64,.21]:dual?[.58,.36,.78]:[.27,.49,.66];
 // p includes the boss scale. Derive it once for ellipsoids.
 const scale=Math.abs(p(0,1,0)[1]-p(0,0,0)[1]);
 const ell=(x,y,z,a,b,c,color=metal,glow=0)=>m.sphere(p(x,y,z),[a*scale,b*scale,c*scale],color,12,8,glow);
 const blade=(a,b,width,color=edge)=>{const [x,y,z]=a,[u,v,w]=b;m.quad(p(x,y,z-width),p(x,y,z+width),p(u,v,w+width*.15),p(u,v,w-width*.15),color);rod(a,b,.007,metal,.002);};
 if(pose.species==='devourer'){
  // A hollow, toothed mask beneath a broken crown; the two rulers have different crests.
  for(const side of [-1,1]){
   m.quad(p(.11,1.27,side*.02),p(.19,1.18,side*.12),p(.22,1.05,side*.085),p(.14,1.02,side*.025),metal);
   blade([.20,1.11,side*.07],[.25,.98,side*.035],.025,bone);
   for(let i=0;i<4;i++)rod([.20,1.16-i*.033,side*.07],[.24,1.145-i*.033,side*.035],.007,bone,.001);
   rod([.03,1.24,side*.10],[-.08,1.44,side*.19],.035,edge,.020);
   rod([-.08,1.44,side*.19],[light?.07:-.17,light?1.58:1.63,side*(light?.22:.27)],.020,edge,.002);
   for(let i=0;i<4;i++){
    const x=-.13-i*.055,y=1.00+i*.08,z=side*(.21+i*.06);
    blade([-.04,.96,side*.14],[x,y+.16,z],.045,metal);
    rod([x,y+.16,z],[x-.09,y-.16,z+side*.04],.010,edge,.002);
   }
   // Engraved ribs and floating fragments frame the luminous core.
   for(let i=0;i<5;i++){const y=.61+i*.073;rod([.18,y,side*.035],[.13,y+.025,side*.17],.012,edge,.007);}
   if(light){for(let i=0;i<5;i++){const a=(i/5-.2)*Math.PI;blade([-.07,.91,side*.18],[-.12+Math.cos(a)*.25,1.10+Math.sin(a)*.29,side*.38],.035,edge);}}
   else for(let i=0;i<3;i++){
    const z=side*(.13+i*.055);m.tri(p(-.08,.74,z),p(-.26-i*.04,.05+i*.06,z+side*.08),p(-.16,.45,z+side*.06),[.025,.035,.052]);
   }
  }
  ell(.205,.84,0,.018,.14,.08,magic,.7);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;ell(Math.cos(a)*.35,1.40+Math.sin(a)*.15,-.10,.015,.027,.013,magic,.6);}
  return;
 }
 if(pose.species==='dragon'){
  // Interlocking scale rows follow the ribcage instead of flat metal boxes.
  for(const side of [-1,1]){
   for(let row=0;row<3;row++)for(let i=0;i<5;i++){
    const x=-.25+i*.105+(row%2)*.025,y=.40+row*.065,z=side*(.19-row*.025);
    m.quad(p(x-.045,y,z),p(x,y+.045,z+side*.01),p(x+.047,y,z),p(x,y-.035,z),i%2?metal:edge);
   }
   // Curved wing membrane stretched between articulated spars.
   const flap=Math.sin((pose.time??0)*1.9)*.04,root=[-.08,.59,side*.12],elbow=[-.28,.91+flap,side*.46];
   rod(root,elbow,.024,metal,.016);
   for(let j=0;j<4;j++){
    const tip=[-.68+j*.22,1.07-j*.105+flap*.5,side*(.83-j*.075)],next=[-.68+(j+1)*.22,1.07-(j+1)*.105+flap*.5,side*(.83-(j+1)*.075)];
    rod(elbow,tip,.012,edge,.003);
    if(j<3){const sag=[(tip[0]+next[0])*.5,.62-j*.055+flap*.3,side*(.67-j*.065)];m.tri(p(...elbow),p(...tip),p(...sag),[.11,.12,.15]);m.tri(p(...elbow),p(...sag),p(...next),metal);}
   }
   // Brow, cheek horns and teeth preserve a readable predatory face.
   rod([.32,.80,side*.07],[.20,1.01,side*.16],.031,edge,.015);rod([.20,1.01,side*.16],[.08,1.05,side*.18],.015,bone,.001);
   blade([.37,.81,side*.08],[.57,.80,side*.11],.022,edge);
   ell(.48,.795,side*.092,.026,.013,.008,magic,.9);
   for(let i=0;i<5;i++)rod([.40+i*.044,.72,side*.074],[.41+i*.044,.677,side*.067],.008,bone,.001);
  }
  for(let i=0;i<6;i++){const x=-.38+i*.13;blade([x,.59,0],[x-.055,.75+(i%2)*.04,0],.025,edge);}
  if(boss)for(const side of [-1,1])rod([.30,.88,side*.065],[.29,1.18,side*.13],.030,edge,.001);
  return;
 }
 if(pose.species==='goblin'){
  const skin=light?[.29,.31,.24]:[.105,.14,.125];
  ell(.065,.54,0,.085,.14,.11,skin);
  // Furrowed brows, recessed eyes, hooked nose and a wide jaw.
  ell(.16,.85,0,.085,.065,.09,skin);ell(.225,.79,0,.033,.065,.035,skin);
  for(const side of [-1,1]){
   blade([.12,.875,side*.045],[.23,.85,side*.075],.018,skin);
   ell(.198,.838,side*.065,.021,.012,.010,magic,.5);
   ell(.17,.743,side*.035,.06,.035,.04,skin);
   rod([.21,.73,side*.057],[.25,boss?.84:.80,side*.053],boss?.015:.010,bone,.001);
   ell(.02,.55,side*.20,.047,.095,.045,skin);ell(.055,.43,side*.23,.035,.07,.037,skin);ell(0,.30,side*.105,.058,.095,.05,leather);ell(.055,.045,side*.11,.085,.034,.06,leather);
   // Leather straps and riveted scavenged plates, asymmetrically assembled.
   rod([.09,.67,side*.14],[.14,.40,-side*.10],.014,leather,.012);
   if(side<0){ell(-.015,.68,-.18,.14,.065,.095,metal);for(let i=0;i<3;i++)rod([-.06+i*.05,.72,-.18],[-.10+i*.045,.82,-.23],.018,bone,.001);}
   else ell(.02,.62,.18,.08,.09,.06,leather);
   for(let i=0;i<3;i++)ell(.13,.52-i*.05,side*.105,.012,.012,.012,edge);
   rod([.07,.39,side*.22],[.15,.37,side*.24],.027,skin,.020);
  }
  // A broad chipped cleaver, rather than a tiny generic spear.
  rod([.11,.37,-.25],[.17,.63,-.25],.018,leather,.014);
  m.quad(p(.17,.58,-.27),p(.32,.65,-.27),p(.38,.98,-.27),p(.14,.89,-.27),metal);
  for(let i=0;i<4;i++)blade([.32+i*.012,.65+i*.07,-.27],[.36+i*.012,.68+i*.07,-.27],.009,edge);
  if(boss){for(let i=0;i<3;i++)ell(-.14,.57+i*.10,.19,.038,.045,.032,bone);}
  return;
 }
 // Mercenaries: fitted gothic plate, slotted visor, chain skirt and a heraldic shield.
 for(const side of [-1,1]){
  ell(.005,.66,side*.18,.12,.075,.095,metal);
  for(let i=0;i<3;i++)blade([-.07,.70-i*.032,side*.16],[.12,.63-i*.025,side*.24],.025,i===0?edge:metal);
  m.quad(p(.12,.67,side*.025),p(.16,.60,side*.13),p(.15,.45,side*.12),p(.18,.40,0),metal);
  rod([.15,.60,side*.13],[.18,.40,0],.007,edge,.004);
  for(let i=0;i<4;i++){const y=.39-i*.035;rod([.10,y,side*.09],[.08,y-.025,side*.13],.008,edge,.007);}
  m.quad(p(-.07,.94,side*.065),p(.10,.92,side*.09),p(.12,.78,side*.10),p(-.06,.75,side*.08),metal);
  m.quad(p(.13,.67,side*.12),p(.20,.60,0),p(.20,.44,0),p(.14,.43,side*.11),metal);
  ell(-.025,.25,side*.11,.048,.047,.049,metal);ell(.055,.047,side*.11,.09,.038,.061,metal);
  m.quad(p(.035,.24,side*.11-.038),p(.04,.24,side*.11+.038),p(.05,.08,side*.11+.032),p(.05,.08,side*.11-.032),metal);
  blade([.04,.23,side*.11],[.06,.08,side*.11],.010,edge);
  for(let i=0;i<3;i++)rod([.135,.83-i*.018,side*.01],[.14,.83-i*.018,side*.07],.004,[.012,.018,.025],.004);
 }
 blade([-.09,.88,0],[.02,1.07,0],.025,edge);
 if(!['sunArcher','lightWarden','shadowWeaver','binder','illusionist','displacer'].includes(pose.kind)){
  const shield=[.23,.54,.25];
  m.quad(p(.21,.76,.15),p(.24,.76,.36),p(.29,.39,.33),p(.24,.33,.24),metal);
  rod([.21,.76,.15],[.24,.76,.36],.010,edge,.010);rod([.24,.76,.36],[.29,.39,.33],.010,edge,.006);
  blade([shield[0]+.02,.69,shield[2]],[shield[0]+.04,.42,shield[2]],.025,edge);
 }
 // The blade's ridge and dark fuller give it volume at close range.
 blade([.13,.63,-.24],[.22,1.10,-.24],.035,edge);rod([.13,.63,-.24],[.22,1.08,-.24],.006,metal,.002);
 if(dual)for(let i=0;i<4;i++)ell(.18,.57+i*.05,i%2?.035:-.035,.012,.024,.014,i%2?bone:magic,.2);
}
