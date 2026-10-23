import {shardReward} from './rewards';
import {equipmentCatalog,compatible,type EquipmentLoadout} from './equipment';
import type {DogKind,Brightness} from './affinity';
import type {EnemyIdentity} from './enemy-identity';
import {identityName} from './enemy-identity';
export const sigils=[
 {id:'spark',name:'残火の刻印',rarity:'通常',weight:23,effect:'明るさ3〜4で攻撃 +1'},
 {id:'shade',name:'夜牙の刻印',rarity:'通常',weight:23,effect:'明るさ0〜1で攻撃 +1'},
 {id:'stone',name:'堅石の刻印',rarity:'通常',weight:20,effect:'防御 +1'},
 {id:'life',name:'息吹の刻印',rarity:'希少',weight:10,effect:'最大HP +2'},
 {id:'wind',name:'風歩の刻印',rarity:'希少',weight:10,effect:'移動力 +1'},
 {id:'eclipse',name:'双極の刻印',rarity:'希少',weight:10,effect:'明るさ0または4で攻撃 +2'},
 {id:'aurora',name:'明星の刻印',rarity:'伝説',weight:2,effect:'明るさ3〜4で攻撃 +1'},
 {id:'nightwing',name:'宵翼の刻印',rarity:'伝説',weight:2,effect:'移動力 +1、明るさ0〜1で回避 +15ポイント'},
] as const;
export type SigilID=typeof sigils[number]['id'];
export const drawCost=3,pityLimit=10;
export interface ExpansionSave {version:1;endlessBest:number;stardust:number;target:string;shards:number;draws:number;dry:number;sigils:Record<string,number>;sockets:Record<DogKind,Record<string,string>>;clears:string[];enemies:string[];relics:string[]}
const nonnegative=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:0;
const unique=(v:unknown):string[]=>Array.isArray(v)?[...new Set(v.filter((x):x is string=>typeof x==='string'))]:[];
export const enemyKey=(e:EnemyIdentity)=>e.species?`${e.species}:${e.affinity??'shadow'}:${e.boss?'boss':'normal'}`:undefined;
export function migrateExpansion(raw:unknown):ExpansionSave{
 const v=(raw&&typeof raw==='object'?raw:{}) as Partial<ExpansionSave>;
 const sockets={light:{},shadow:{}} as ExpansionSave['sockets'];
 for(const kind of ['light','shadow'] as const)for(const [gear,id] of Object.entries(v.sockets?.[kind]??{}))if(equipmentCatalog.some(e=>e.id===gear&&compatible(e,kind))&&sigils.some(s=>s.id===id))sockets[kind][gear]=id;
 const owned=Object.fromEntries(sigils.map(s=>[s.id,nonnegative(v.sigils?.[s.id])]));
 const used:Record<string,number>={};for(const kind of ['light','shadow'] as const)for(const [gear,id]of Object.entries(sockets[kind])){if((used[id]??0)>=owned[id])delete sockets[kind][gear];else used[id]=(used[id]??0)+1;}
 return {version:1,endlessBest:nonnegative(v.endlessBest),stardust:nonnegative(v.stardust),target:sigils.some(s=>s.id===v.target)?v.target!:'aurora',shards:nonnegative(v.shards),draws:nonnegative(v.draws),dry:Math.min(pityLimit-1,nonnegative(v.dry)),sigils:owned,sockets,clears:unique(v.clears),enemies:unique(v.enemies),relics:unique(v.relics)};
}
/** A single atomic roll: shortage/invalid entropy cannot consume currency. */
export function drawSigil(save:ExpansionSave,random:number){
 if(save.shards<drawCost||!Number.isFinite(random)||random<0||random>=1)return undefined;
 const guaranteed=save.dry>=pityLimit-1,pool=sigils.filter(s=>!guaranteed||s.rarity!=='通常'),total=pool.reduce((sum,s)=>sum+s.weight,0);
 let remaining=random*total;const item=pool.find(s=>{remaining-=s.weight;return remaining<0})??pool[pool.length-1];
 save.shards-=drawCost;save.draws++;save.dry=item.rarity!=='通常'?0:save.dry+1;save.sigils[item.id]=(save.sigils[item.id]??0)+1;const duplicate=save.sigils[item.id]>1,dust=duplicate?(item.rarity==='伝説'?8:item.rarity==='希少'?3:1):0;save.stardust+=dust;
 return {item,guaranteed,duplicate,dust};
}
export function socketSigil(save:ExpansionSave,kind:DogKind,loadout:EquipmentLoadout,id:string|null){
 const gear=equipmentCatalog.find(e=>e.id===loadout.equipment&&compatible(e,kind));if(!gear||!loadout.ownedEquipment.includes(gear.id))return false;
 if(id===null){delete save.sockets[kind][gear.id];return true;}
 if(!sigils.some(s=>s.id===id)||!(save.sigils[id]>0))return false;
 // One owned copy can occupy one equipment slot across the two companions.
 const used=(['light','shadow'] as const).reduce((n,k)=>n+Object.entries(save.sockets[k]).filter(([g,s])=>s===id&&!(k===kind&&g===gear.id)).length,0);
 if(used>=save.sigils[id])return false;save.sockets[kind][gear.id]=id;return true;
}
export function sigilBonus(save:ExpansionSave,kind:DogKind,gear:string|null|undefined,brightness:Brightness){
 const id=gear?save.sockets[kind][gear]:undefined,result={attack:0,armor:0,hp:0,move:0,evade:0,charge:0};
 if(id==='spark'&&brightness>=3||id==='shade'&&brightness<=1)result.attack=1;
 if(id==='stone')result.armor=1;if(id==='life')result.hp=2;if(id==='wind')result.move=1;
 if(id==='eclipse'&&(brightness===0||brightness===4))result.attack=2;if(id==='aurora'){result.charge=1;if(brightness>=3)result.attack=1;}if(id==='nightwing'){result.move=1;if(brightness<=1)result.evade=.15;}return result;
}
export const relicCatalog=[
 {id:'city-seal',name:'灯台の封印環',source:'boss',text:'都の支配核から戻った、光を巡らせる環。'},
 {id:'forest-seed',name:'夜樹の種',source:'forest-heart',text:'影が戻った森で芽吹く、小さな命。'},
 {id:'castle-key',name:'自由の鍵',source:'castle-eclipse',text:'服従の契約を断ち、城の中枢を開いた鍵。'},
 {id:'expedition-map',name:'双路の地図',source:'expedition',text:'二匹が連戦の先に見つけた新しい道。'},
 {id:'prism',name:'調和のプリズム',source:'puzzle',text:'光と影の両方を保った証。'},
 {id:'guardian-bell',name:'砦守りの鈴',source:'defense',text:'住民が防衛の成功を祝って贈った鈴。'},
 {id:'summit',name:'高台の風見',source:'heights',text:'階段を越え、明暗の道を見渡した記念。'},
] as const;
export function recordRelics(save:ExpansionSave,campaignClears:readonly string[]){for(const r of relicCatalog)if((campaignClears.includes(r.source)||save.clears.includes(r.source))&&!save.relics.includes(r.id))save.relics.push(r.id);}
export function recordEncounter(save:ExpansionSave,enemies:readonly EnemyIdentity[]){for(const e of enemies){const k=enemyKey(e);if(k&&!save.enemies.includes(k))save.enemies.push(k);}}
export function grantExpansionReward(save:ExpansionSave,id:string,extra=false){
 const first=extra&&!save.clears.includes(id),shards=shardReward(extra,first);
 save.shards+=shards;if(extra&&!save.clears.includes(id))save.clears.push(id);return {shards,first};
}
export function collectionEnemies(){
 const entries: (EnemyIdentity&{key:string;name:string})[]=[];
 for(const species of ['mercenary','goblin','dragon','devourer'] as const)for(const affinity of (species==='devourer'?['light','shadow']:['light','shadow','yinYang']) as ('light'|'shadow'|'yinYang')[]){
  const e={species,affinity,boss:species==='devourer'};entries.push({...e,key:enemyKey(e)!,name:identityName(e)!});
 }
 const boss={species:'goblin' as const,affinity:'shadow' as const,boss:true};entries.push({...boss,key:enemyKey(boss)!,name:identityName(boss)!});
 // Forest boss has its own entry in addition to ordinary dragons.
 const whiteDragon={species:'dragon' as const,affinity:'light' as const,boss:true};entries.push({...whiteDragon,key:enemyKey(whiteDragon)!,name:'集光炉の白竜'});
 const dragon={species:'dragon' as const,affinity:'shadow' as const,boss:true};entries.push({...dragon,key:enemyKey(dragon)!,name:'祭壇の黒竜'});return entries;
}

export function sigilExchangeCost(id:string){const s=sigils.find(s=>s.id===id);return s?.rarity==='伝説'?32:s?.rarity==='希少'?16:8;}
export function exchangeSigil(save:ExpansionSave,id:string){const item=sigils.find(s=>s.id===id),cost=sigilExchangeCost(id);if(!item||save.stardust<cost)return undefined;save.stardust-=cost;save.sigils[id]=(save.sigils[id]??0)+1;return {item,cost,duplicate:save.sigils[id]>1};}
export function drawManySigils(save:ExpansionSave,count:number,samples:readonly number[]){
 if(![1,10].includes(count)||save.shards<count*drawCost||samples.length<count||samples.slice(0,count).some(n=>!Number.isFinite(n)||n<0||n>=1))return undefined;
 return samples.slice(0,count).map(n=>drawSigil(save,n)!);
}
