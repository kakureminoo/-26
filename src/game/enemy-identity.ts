export type EnemySpecies='mercenary'|'goblin'|'dragon'|'devourer';
export type EnemyAffinity='light'|'shadow'|'yinYang';
export interface EnemyIdentity {species?:EnemySpecies;affinity?:EnemyAffinity;boss?:boolean}
export function identityName(e:EnemyIdentity):string|undefined{
 if(!e.species)return undefined;
 if(e.species==='devourer')return e.affinity==='light'?'光喰らい':'影喰らい';
 const color=e.affinity==='yinYang'?'陰陽':e.affinity==='light'?'白':'黒';
 return color+(e.species==='dragon'?'竜':e.species==='goblin'?(e.boss?'ボスゴブリン':'ゴブリン'):'の傭兵');
}
