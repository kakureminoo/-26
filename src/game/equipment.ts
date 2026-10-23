import type { DogKind, Brightness } from './affinity';

export interface Equipment {
  id: string; name: string; category: 'お守り' | '特製'; kind: DogKind | 'both';
  unlock: number; metal: number; crystal: number;
  description: string; effect: string; color: string;
  form: 'fang' | 'shield' | 'knot' | 'wing' | 'moon' | 'sun' | 'crown' | 'mantle';
}
export const equipmentCatalog: readonly Equipment[] = [
  { id:'fang', name:'牙鉄のお守り', category:'お守り', kind:'both', unlock:2, metal:2, crystal:0, description:'鉄を研いだ牙を、黒革の紐で結んだ護り。', effect:'攻撃 +1', color:'#c5b79a', form:'fang' },
  { id:'ward', name:'石守のお守り', category:'お守り', kind:'both', unlock:2, metal:1, crystal:2, description:'古い砦の石片を銀の枠に収めた護り。', effect:'防御 +1', color:'#93b6c1', form:'shield' },
  { id:'vitality', name:'命結びのお守り', category:'お守り', kind:'both', unlock:2, metal:0, crystal:2, description:'深緑の玉石を結び、相棒の無事を願う。', effect:'最大HP +2', color:'#80b99e', form:'knot' },
  { id:'stride', name:'風渡りのお守り', category:'お守り', kind:'both', unlock:2, metal:2, crystal:1, description:'風切り羽を重ねた軽い銀細工。', effect:'移動予算 +1（影の強い光への進入は禁止）', color:'#b8d0cf', form:'wing' },
  { id:'dusk', name:'月隠れのお守り', category:'お守り', kind:'both', unlock:3, metal:1, crystal:3, description:'細い月の縁が、暗闇でだけ淡く浮かぶ。', effect:'明るさ0〜1で回避 +10ポイント', color:'#87a7d2', form:'moon' },
  { id:'ember', name:'残光のお守り', category:'お守り', kind:'both', unlock:3, metal:3, crystal:1, description:'灯が消えた後も熱を帯びる小さな結晶。', effect:'明るさ3〜4で攻撃 +2', color:'#e3ad67', form:'sun' },
  { id:'lantern-collar', name:'灯火の首輪', category:'特製', kind:'light', unlock:3, metal:6, crystal:2, description:'光の猟犬に合わせて鍛えた、灯を宿す冠状の首輪。', effect:'攻撃 +1、明るさ3〜4で防御 +1', color:'#e6c281', form:'crown' },
  { id:'shadow-weave', name:'影織りの護符', category:'特製', kind:'shadow', unlock:3, metal:2, crystal:6, description:'影の猟犬の輪郭に沿って織られた、護符付きの外套。', effect:'攻撃 +1、明るさ0〜1で回避 +10ポイント', color:'#8eafc1', form:'mantle' },
];
export interface EquipmentLoadout { ownedEquipment: string[]; equipment: string | null; gear?: boolean }
export interface Materials { metal: number; crystal: number }
export const findEquipment = (id: unknown) => equipmentCatalog.find(item => item.id === id);
export const compatible = (item: Equipment, kind: DogKind) => item.kind === 'both' || item.kind === kind;

/** Legacy gear is preserved, without inventing story clears or granting new recipes. */
export function migrateEquipment(value: { gear?: unknown; ownedEquipment?: unknown; equipment?: unknown }, kind: DogKind): EquipmentLoadout {
  const owned = Array.isArray(value.ownedEquipment)
    ? [...new Set(value.ownedEquipment.filter((id): id is string => typeof id === 'string' && !!equipmentCatalog.find(e => e.id === id && compatible(e,kind))))]
    : value.gear === true ? [kind === 'light' ? 'lantern-collar' : 'shadow-weave'] : [];
  const selected = typeof value.equipment === 'string' && owned.includes(value.equipment) ? value.equipment
    : value.equipment === null ? null : owned[0] ?? null;
  return { ownedEquipment: owned, equipment: selected, gear: selected !== null };
}
export function equipmentBonus(id: unknown, level: Brightness) {
  const result = { attack:0, armor:0, hp:0, move:0, evade:0 };
  switch(id) {
    case 'fang': result.attack=1; break;
    case 'ward': result.armor=1; break;
    case 'vitality': result.hp=2; break;
    case 'stride': result.move=1; break;
    case 'dusk': if(level<=1)result.evade=.10; break;
    case 'ember': if(level>=3)result.attack=2; break;
    case 'lantern-collar': result.attack=1; if(level>=3)result.armor=1; break;
    case 'shadow-weave': result.attack=1; if(level<=1)result.evade=.10; break;
  }
  return result;
}
export function craftEquipment(loadout: EquipmentLoadout, materials: Materials, id: string, kind: DogKind, storyStep: number): boolean {
  const item=findEquipment(id);
  if(!item || !compatible(item,kind) || storyStep<item.unlock || loadout.ownedEquipment.includes(id)
    || !Number.isFinite(materials.metal) || !Number.isFinite(materials.crystal)
    || materials.metal<item.metal || materials.crystal<item.crystal)return false;
  materials.metal-=item.metal; materials.crystal-=item.crystal;
  loadout.ownedEquipment.push(id);
  return equipEquipment(loadout,id,kind);
}
export function equipEquipment(loadout: EquipmentLoadout, id: string | null, kind: DogKind): boolean {
  if(id!==null){const item=findEquipment(id);if(!item||!compatible(item,kind)||!loadout.ownedEquipment.includes(id))return false;}
  loadout.equipment=id;loadout.gear=id!==null;return true;
}
