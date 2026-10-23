import { compatible, equipmentCatalog, findEquipment, type EquipmentLoadout, type Materials } from '../game/equipment';
import type { DogKind } from '../game/affinity';
import { equipmentIcon } from '../render/equipment-icon';
interface ForgeOptions {
 kind: DogKind; loadout: EquipmentLoadout; materials: Materials; step: number; filter: string; notice: string;
 onKind(kind: DogKind): void; onFilter(filter: string): void;
 onCraft(id: string): void; onEquip(id: string | null): void; onPreview(id: string): void;
}
export function renderForge(root: HTMLElement, o: ForgeOptions) {
 const current=findEquipment(o.loadout.equipment);
 root.innerHTML=`<div class="forge-intro"><div><span class="eyebrow">装備を仕立てる</span><h2>宵待ちの工房</h2><p>お守りは一匹につきひとつ。明暗と役割に合わせて選ぶ。</p></div><div class="forge-wallet">金属片 <b>${o.materials.metal}</b> ／ 影の結晶 <b>${o.materials.crystal}</b></div></div>
 <div class="forge-toolbar"><div class="forge-dogs" role="group" aria-label="装備する相棒"><button data-dog="light" class="${o.kind==='light'?'active':''}" aria-pressed="${o.kind==='light'}">光の猟犬</button><button data-dog="shadow" class="${o.kind==='shadow'?'active':''}" aria-pressed="${o.kind==='shadow'}">影の猟犬</button></div><div class="forge-filters" role="group" aria-label="装備の種類">${[['all','すべて'],['owned','所持品'],['special','特製']].map(([id,label])=>`<button data-filter="${id}" aria-pressed="${o.filter===id}" class="${o.filter===id?'active':''}">${label}</button>`).join('')}</div></div>
 <div class="loadout-summary"><div><small>現在の装備</small><b>${current?.name??'装備なし'}</b><span>${current?.effect??'作成した装備を選んで着用できます。'}</span></div><button id="unequipCharm" ${current?'':'disabled'}>外す</button></div><p class="forge-notice" role="status" aria-live="polite">${o.notice||'一般のお守りは第2節、上位のお守りと専用の特製品は第3節クリアで解放。'}</p><div class="equipment-grid"></div>`;
 root.querySelectorAll<HTMLButtonElement>('[data-dog]').forEach(b=>b.onclick=()=>o.onKind(b.dataset.dog as DogKind));
 root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b=>b.onclick=()=>o.onFilter(b.dataset.filter!));
 root.querySelector<HTMLButtonElement>('#unequipCharm')!.onclick=()=>o.onEquip(null);
 const grid=root.querySelector('.equipment-grid')!;
 for(const item of equipmentCatalog.filter(e=>compatible(e,o.kind))){
   const owned=o.loadout.ownedEquipment.includes(item.id), selected=o.loadout.equipment===item.id, locked=o.step<item.unlock&&!owned;
   if(o.filter==='owned'&&!owned || o.filter==='special'&&item.category!=='特製')continue;
   const affordable=o.materials.metal>=item.metal&&o.materials.crystal>=item.crystal;
   const card=document.createElement('article');card.className='equipment-card'+(item.category==='特製'?' signature':'')+(selected?' equipped':'')+(locked?' recipe-locked':'');card.dataset.item=item.id;
   card.innerHTML=`<div class="equipment-heading"><span class="equipment-rarity">${item.category==='特製'?'専用・特製':item.unlock>2?'上位のお守り':'お守り'}</span><span class="equipment-state">${selected?'装備中':owned?'所持済み':locked?'未解放':affordable?'作成可能':'素材不足'}</span></div>${equipmentIcon(item.id)}<h3>${item.name}</h3><p class="equipment-lore">${item.description}</p><p class="equipment-effect">${item.effect}</p><div class="equipment-compare">${current?`装備中：${current.name} ／ ${current.effect}`:'現在は装備なし'}</div><div class="equipment-cost">${owned?'作成済み · 付け替え無料':locked?`第${item.unlock}節クリアで解放`:`金属片 ${item.metal} ／ 影の結晶 ${item.crystal}`}</div><div class="equipment-buttons"><button data-preview="${item.id}" class="ghost">試着</button><button data-craft-id="${item.id}" class="${owned?'':'primary'}" ${selected||locked||!owned&&!affordable?'disabled':''}>${selected?'装備中':owned?'装備する':locked?'未解放':!affordable?'素材不足':'作成して装備'}</button></div>`;
   card.querySelector<HTMLButtonElement>('[data-preview]')!.onclick=()=>o.onPreview(item.id);
   card.querySelector<HTMLButtonElement>('[data-craft-id]')!.onclick=()=>owned?o.onEquip(item.id):o.onCraft(item.id);
   grid.append(card);
 }
 if(!grid.children.length)grid.innerHTML='<p class="equipment-empty">まだ所持品がありません。「すべて」からお守りを作成できます。</p>';
}
