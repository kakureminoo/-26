import {migrateAwakenings,awakeningLevel} from './awakening.ts';
import type {EquipmentLoadout,Materials} from './equipment.ts';
export type HoundKind='light'|'shadow';
export const houndCatalog=[
 {id:'dawn',rarity:4,name:'黎明の猟犬',kind:'light',source:'初期',trait:'均衡：追加補正なし',hp:0,attack:0,armor:0,move:0,color:'#e7d9b0'},
 {id:'dusk',rarity:4,name:'宵の猟犬',kind:'shadow',source:'初期',trait:'均衡：追加補正なし',hp:0,attack:0,armor:0,move:0,color:'#8495b8'},
 {id:'bulwark',rarity:4,name:'城衛のアウル',kind:'light',source:'灯台の要所解放',trait:'守護：HP+4、防御+1、移動−1',hp:4,attack:0,armor:1,move:-1,color:'#c9a666'},
 {id:'veil',rarity:4,name:'森守のノクス',kind:'shadow',source:'森の祭壇解放',trait:'斥候：移動+1、HP−2',hp:-2,attack:0,armor:0,move:1,color:'#7dafaa'},
 {id:'sol',rarity:4,name:'陽炎のレグルス',kind:'light',source:'召喚限定',trait:'白刃：明るさ3以上で攻撃+2、HP−2',hp:-2,attack:0,armor:0,move:0,color:'#f4be67',weight:40},
 {id:'herald',rarity:4,name:'誓灯のアルマ',kind:'light',source:'召喚限定',trait:'鼓舞：専用技で二匹の攻撃・防御を強化',hp:2,attack:0,armor:0,move:0,color:'#b9c4a1',weight:40},
 {id:'moon',rarity:4,name:'月牙のセレネ',kind:'shadow',source:'召喚限定',trait:'夜襲：明るさ1以下で攻撃+2、HP−2',hp:-2,attack:0,armor:0,move:0,color:'#b1a4e9',weight:40},
 {id:'ember',rarity:5,name:'燎原のイグニス',kind:'light',source:'召喚限定・希少',trait:'猛攻：攻撃+1、防御−1',hp:0,attack:1,armor:-1,move:0,color:'#da805f',weight:10},
 {id:'reaper',rarity:5,name:'喰影のヴァルグ',kind:'shadow',source:'召喚限定・希少',trait:'追猟：自身が倒すたび攻撃+1（クエスト中継続・連携撃破も対象）',hp:0,attack:0,armor:0,move:0,color:'#9e5967',weight:10},
 {id:'frost',rarity:5,name:'霜影のフェン',kind:'shadow',source:'召喚限定・希少',trait:'忍耐：HP+6、移動−1',hp:6,attack:0,armor:0,move:-1,color:'#83c5d1',weight:10},
] as const;
export const houndSummonPool=(rarity:4|5)=>houndCatalog.filter(h=>h.rarity===rarity&&'weight'in h).map(h=>h.id);
export type HoundID=typeof houndCatalog[number]['id'];
export const houndByID=(id:string)=>houndCatalog.find(h=>h.id===id);
export interface RosterSave {version:2;awakenings:Record<string,number>;legacyRareRemaining:number;pity5:number;owned:string[];party:{light:string;shadow:string};names:Record<string,string>;stones:number;bonds:number;draws:number;dry:number;claimed:string[];receipts:string[];metrics:{clears:number;farm:number;cpuWins:number;raids:number}}
const n=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:0;
const strings=(v:unknown):string[]=>Array.isArray(v)?[...new Set(v.filter((x):x is string=>typeof x==='string'))]:[];
export function migrateRoster(raw:unknown,cleared:readonly string[]=[]):RosterSave{
 const v=(raw&&typeof raw==='object'?raw:{}) as Partial<RosterSave>;
 const owned=[...new Set(['dawn','dusk',...strings(v.owned).filter(id=>houndByID(id)),...(cleared.includes('boss')?['bulwark']:[]),...(cleared.includes('forest-heart')?['veil']:[])])];
 const choose=(kind:HoundKind)=>owned.includes(v.party?.[kind]??'')&&houndByID(v.party![kind])?.kind===kind?v.party![kind]:kind==='light'?'dawn':'dusk';
 const names=Object.fromEntries(Object.entries(v.names??{}).filter(([id,name])=>houndByID(id)&&typeof name==='string').map(([id,name])=>[id,Array.from(name).slice(0,12).join('')]));
 return {version:2,awakenings:migrateAwakenings(v.awakenings,owned),legacyRareRemaining:v.version===2?n(v.legacyRareRemaining):raw&&typeof raw==='object'&&'dry'in raw?10-Math.min(9,n(v.dry)):0,pity5:Math.min(50,n(v.pity5)),owned,names,party:{light:choose('light'),shadow:choose('shadow')},stones:n(v.stones),bonds:n(v.bonds),draws:n(v.draws),dry:Math.min(9,n(v.dry)),claimed:strings(v.claimed),receipts:strings(v.receipts),metrics:{clears:n(v.metrics?.clears),farm:n(v.metrics?.farm),cpuWins:n(v.metrics?.cpuWins),raids:n(v.metrics?.raids)}};
}
export function houndBonus(id:string,brightness:number){const h=houndByID(id)??houndCatalog[0];return {hp:h.hp,attack:h.attack+(h.id==='sol'&&brightness>=3||h.id==='moon'&&brightness<=1?2:0),armor:h.armor,move:h.move};}
export function chooseHound(s:RosterSave,id:string){const h=houndByID(id);if(!h||!s.owned.includes(id))return false;s.party[h.kind]=id;return true;}
export type SummonResult={id:string;rarity:1|2|3|4|5;kind:'hound'|'equipment'|'material';duplicate:boolean;amount:number;awakening?:number;awakeningGained?:boolean};
export interface SummonInventory {materials:Materials;light:EquipmentLoadout;shadow:EquipmentLoadout}
/** Base rates: 5★ 2%, 4★ 8%, 3★ equipment 30%, 2★ crystal 30%, 1★ metal 30%.
 * 50 consecutive non-5★ results force the next draw. Legacy ten-draw promises survive once. */
export function summonHounds(s:RosterSave,count:number,random:readonly number[],inventory?:SummonInventory){
 if(![1,10].includes(count)||s.stones<count*10||random.length<count||random.slice(0,count).some(v=>!Number.isFinite(v)||v<0||v>=1)||!inventory)return undefined;
 const results:SummonResult[]=[];
 for(const r of random.slice(0,count)){
  const forced=s.pity5>=50||s.legacyRareRemaining===1;
  const rarity=forced||r<.02?5:r<.10?4:r<.40?3:r<.70?2:1;
  const ids=rarity===5?houndSummonPool(5):rarity===4?houndSummonPool(4):rarity===3?['fang','ward','vitality','stride','dusk','ember']:[];
  const fraction=forced?r:rarity===5?r/.02:rarity===4?(r-.02)/.08:rarity===3?(r-.10)/.30:0;
  const id=ids[Math.min(ids.length-1,Math.floor(fraction*ids.length))]??(rarity===2?'crystal':'metal');
  let duplicate=false,amount=1,awakening:number|undefined,awakeningGained=false;
  if(rarity>=4){duplicate=s.owned.includes(id);if(duplicate){s.bonds+=20;s.awakenings??={};const before=awakeningLevel(s.awakenings[id]);awakening=Math.min(6,before+1);awakeningGained=awakening>before;s.awakenings[id]=awakening;}else s.owned.push(id);}
  else if(rarity===3){duplicate=inventory.light.ownedEquipment.includes(id)&&inventory.shadow.ownedEquipment.includes(id);for(const kind of ['light','shadow'] as const)if(!inventory[kind].ownedEquipment.includes(id))inventory[kind].ownedEquipment.push(id);if(duplicate){inventory.materials.metal+=2;amount=2;}}
  else {amount=rarity===2?2:3;inventory.materials[id as 'metal'|'crystal']+=amount;}
  s.stones-=10;s.draws++;s.pity5=rarity===5?0:s.pity5+1;s.dry=rarity===5?0:Math.min(9,s.dry+1);
  s.legacyRareRemaining=rarity===5?0:Math.max(0,s.legacyRareRemaining-1);
  results.push({id,rarity,kind:rarity>=4?'hound':rarity===3?'equipment':'material',duplicate,amount,...(awakening===undefined?{}:{awakening,awakeningGained})});
 }return results;
}
export function exchangeHound(s:RosterSave,id:string){const h=houndByID(id);if(!h||!('weight'in h)||s.bonds<100||s.owned.includes(id))return false;s.bonds-=100;s.owned.push(id);return true;}
export const questStoneReward=(first:boolean,farm=false)=>farm?8:first?10:3;
export function rosterQuestReward(s:RosterSave,id:string,first:boolean,farm=false){s.metrics.clears++;if(farm)s.metrics.farm++;const stones=questStoneReward(first,farm);s.stones+=stones;const unlock=id==='boss'?'bulwark':id==='forest-heart'?'veil':undefined;if(unlock&&!s.owned.includes(unlock))s.owned.push(unlock);return stones;}
export const rosterMissions=[
 {id:'welcome',name:'新しい旅支度',text:'仲間の画面を開く',reward:10,metric:'welcome',need:1},
 {id:'clear1',name:'三つの戦いを越えて',text:'クエストを1回クリア',reward:10,metric:'clears',need:1},
 {id:'clear3',name:'絆の足跡',text:'クエストを3回クリア',reward:20,metric:'clears',need:3},
 {id:'farm5',name:'遠征の常連',text:'周回遠征を5回クリア',reward:30,metric:'farm',need:5},
 {id:'arena3',name:'闘技の心得',text:'CPU対戦で3勝',reward:30,metric:'cpuWins',need:3},
 {id:'raid1',name:'共闘の証',text:'レイドを1回クリア',reward:50,metric:'raids',need:1},
] as const;
export function missionProgress(s:RosterSave,id:string){const m=rosterMissions.find(m=>m.id===id);return m?Math.min(m.need,m.metric==='welcome'?1:s.metrics[m.metric]):0;}
export function claimRosterMission(s:RosterSave,id:string){const m=rosterMissions.find(m=>m.id===id);if(!m||s.claimed.includes(id)||missionProgress(s,id)<m.need)return false;s.claimed.push(id);s.stones+=m.reward;return true;}

export function claimableRosterMissions(s:RosterSave){return rosterMissions.filter(m=>!s.claimed.includes(m.id)&&missionProgress(s,m.id)>=m.need).length;}
