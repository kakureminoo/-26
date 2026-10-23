/** Unlocks derive from clears: no duplicate save counters or rewards on replay. */
export const strongholds=[
 {id:'boss',name:'都の灯台',ability:'灯の牙',effect:'光の猟犬の攻撃 +1'},
 {id:'forest-heart',name:'森の祭壇',ability:'影の牙',effect:'影の猟犬の攻撃 +1'},
 {id:'castle-eclipse',name:'城の中枢',ability:'解放の守り',effect:'二匹の防御 +1'},
] as const;
export function liberationState(cleared:readonly string[]){
 const released=strongholds.filter(s=>cleared.includes(s.id));
 return {released,remaining:strongholds.filter(s=>!cleared.includes(s.id)),finalReady:released.length===strongholds.length,
  lightAttack:cleared.includes('boss')?1:0,shadowAttack:cleared.includes('forest-heart')?1:0,armor:cleared.includes('castle-eclipse')?1:0,
  bossHPBonus:(strongholds.length-released.length)*12,bossDamageBonus:strongholds.length-released.length};
}
