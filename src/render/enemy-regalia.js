/** Original dark-fantasy silhouettes; deliberately low-poly additions over cached bodies. */
export function buildEnemyRegalia(m,p,rod,pose,boss){
 const pale=pose.affinity==='light',dual=pose.affinity==='yinYang';
 const iron=pale?[.19,.21,.22]:[.085,.10,.12],rim=pale?[.49,.44,.32]:[.35,.39,.42],bone=[.56,.51,.40];
 const cloth=pale?[.13,.105,.075]:[.035,.032,.049],glow=pale?[.93,.60,.22]:dual?[.62,.47,.77]:[.32,.52,.65];
 const plate=(a,b,c,d,color=iron)=>{m.tri(p(...a),p(...b),p(...c),color);m.tri(p(...a),p(...c),p(...d),color);};
 if(pose.species==='mercenary'||!pose.species){
  // Angular sallet: central ridge, recessed eye slit, tapering beak and swept nape.
  for(const side of [-1,1]){
   plate([-.10,.92,0],[.03,1.015,0],[.145,.91,side*.065],[-.08,.88,side*.105]);
   plate([.145,.91,side*.065],[.205,.85,side*.068],[.19,.80,side*.082],[.125,.80,side*.10],rim);
   plate([.125,.80,side*.10],[.205,.80,side*.052],[.19,.705,0],[.07,.75,side*.085]);
   m.rod(p(.212,.824,side*.019),p(.214,.824,side*.070),.005,glow,.7,.003);
   plate([-.09,.90,side*.09],[-.15,.76,side*.13],[-.08,.72,side*.12],[.015,.78,side*.095]);
   // Ridged pauldrons, a high gorget and steel-tipped leather gauntlets.
   plate([-.10,.735,side*.13],[.015,.78,side*.20],[.14,.70,side*.26],[.02,.625,side*.28]);
   rod([-.10,.735,side*.13],[.015,.78,side*.20],.008,rim,.005);
   plate([.09,.715,side*.095],[.17,.72,0],[.20,.65,0],[.15,.61,side*.13],rim);
   for(let i=0;i<3;i++)plate([-.11,.65-i*.11,side*.13],[-.23,.59-i*.12,side*.20],[-.25,.40-i*.10,side*.20],[-.12,.49-i*.11,side*.12],cloth);
   if(boss)rod([-.015,.94,side*.06],[-.17,1.18,side*.19],.033,bone,.002);
  }
  // A split tabard with an eroded insignia, rather than luminous accessory clutter.
  plate([.155,.45,-.09],[.155,.45,.09],[.14,.16,.07],[.17,.12,-.06],cloth);
  rod([.174,.39,0],[.17,.23,0],.007,rim,.004);
  return;
 }
 if(pose.species==='goblin'){
  for(const side of [-1,1]){
   // Bone half-mask and a hooked cheek guard frame the eyes without hiding the face.
   plate([.22,.845,side*.025],[.24,.82,side*.075],[.25,.75,side*.07],[.24,.73,side*.025],bone);
   rod([.23,.755,side*.065],[.28,.84,side*.066],boss?.019:.012,bone,.001);
   plate([-.10,.70,side*.12],[.02,.745,side*.18],[.095,.66,side*.24],[-.07,.60,side*.23]);
   for(let i=0;i<(boss?4:2);i++)rod([-.075+i*.045,.71,side*.19],[-.13+i*.045,.88+(boss?.08:0),side*.24],.018,bone,.001);
  }
  // A scarred butcher's blade and wrapped grip, broad enough to read on the board.
  plate([.17,.63,-.285],[.31,.66,-.285],[.35,1.015,-.285],[.13,.94,-.285]);
  plate([.31,.66,-.286],[.35,1.015,-.286],[.37,.98,-.286],[.34,.67,-.286],rim);
  return;
 }
 if(pose.species==='dragon'){
  for(const side of [-1,1]){
   // Backward-curving brow horns and a serrated cheek silhouette.
   const horn=[[.31,.88,side*.085],[.18,1.12,side*.19],[-.02,1.18,side*.24],[-.14,1.12,side*.25]];
   for(let i=0;i<3;i++)rod(horn[i],horn[i+1],.035-i*.010,bone,.024-i*.010);
   for(let i=0;i<4;i++)rod([.32-i*.07,.70,side*.10],[.22-i*.08,.78,side*.25],.024,iron,.001);
   plate([.28,.81,side*.08],[.40,.86,side*.075],[.53,.80,side*.08],[.42,.775,side*.095],rim);
  }
  return;
 }
 if(pose.species==='devourer'){
  // Hollow executioner's face and a crown whose silhouette separates the two rulers.
  for(const side of [-1,1]){
   plate([.20,1.25,side*.015],[.245,1.19,side*.10],[.25,1.03,side*.08],[.21,.98,0],bone);
   m.rod(p(.254,1.15,side*.023),p(.26,1.15,side*.068),.006,glow,.7,.003);
   for(let i=0;i<4;i++){
    const z=side*(.12+i*.045),height=1.50+(pale?(.16-i*.04):i*.055);
    rod([-.02,1.25,z],[-.08-i*.05,height,z+side*.07],.027,rim,.002);
    plate([-.10,.99,z],[-.34,.78,z+side*.12],[-.38-i*.025,.18+i*.045,z+side*.11],[-.14,.42,z],cloth);
   }
  }
 }
}
/** Pigment-based surface tags preserve the original packed format and glowing eyes. */
export function finishEnemySurfaces(m,start,pose){
 for(let i=start;i<m.v.length;i+=11){if(m.v[i+9]>0)continue;const r=m.v[i+6],g=m.v[i+7],b=m.v[i+8];
  const bone=r>.54&&g>.47&&b<g*.94;
  const hide=pose.species==='dragon'&&(g>r*1.1||r>g*1.03)||pose.species==='goblin'&&g>r*1.1;
  const leather=r>g*1.35&&r>b*1.25&&r<.35;
  m.v[i+9]=bone?-1:hide?-3:leather?-2:-4;
 }
}
