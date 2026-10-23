import {questStoneReward} from '../game/roster';
import {shardReward,materialReward} from '../game/rewards';
export interface QuestCardData {id:string;name:string;type:string;desc:string;goal:string;xp?:number;material?:string;firstReward?:number;extra?:boolean;fixed?:boolean}
export const escapeText=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function questRewards(m:QuestCardData,done:boolean){
 const items=m.extra?[`灯の欠片 +${shardReward(true,!done)}`,...(m.fixed?[]:[`猟犬召喚石 +${questStoneReward(!done,m.id==='farm')}`])]:[`経験値 +${m.xp??2}`,`${m.material==='metal'?'金属片':'影の結晶'} ×${materialReward(m.firstReward??3,!done)}`,`灯の欠片 +${shardReward(false,!done)}`,`猟犬召喚石 +${questStoneReward(!done)}`];
 return `<div class="quest-loot"><span class="loot-label">報酬</span><div>${items.map(t=>`<span class="loot-chip">${escapeText(t)}</span>`).join('')}</div></div>`;
}
export function questCard(m:QuestCardData,condition:string,options:{opened:boolean;done:boolean;number:string;locked?:string;tutorial?:boolean}){
 const {opened,done,number,locked,tutorial}=options;
 return `<div class="quest-card-top"><span class="quest-number">${escapeText(number)}</span><span class="quest-kind">${tutorial?'基本操作':escapeText(m.type)}</span><span class="quest-state ${done?'complete':''}">${done?'✓ 達成済み':opened?'':'未開放'}</span></div><h3>${escapeText(m.name)}</h3><p class="quest-description">${escapeText(m.desc)}</p><div class="quest-target"><span class="target-symbol" aria-hidden="true">◇</span><div><small>クリア条件</small><strong>${m.extra?'':'3段階を突破 → '}${escapeText(condition)}</strong></div></div><div class="quest-card-bottom">${questRewards(m,done)}<button class="primary quest-depart" ${opened?'':'disabled'} aria-label="${escapeText(m.name)}${opened?'に出発':'は未開放'}">${opened?'出発 <span aria-hidden="true">↗</span>':'未開放'}</button></div>${!opened&&locked?`<p class="quest-lock">${escapeText(locked)}</p>`:''}`;
}
export function departureBrief(m:QuestCardData,condition:string,done:boolean,failure:string){return `<p class="departure-description">${escapeText(m.desc)}</p><div class="quest-target"><span class="target-symbol" aria-hidden="true">◇</span><div><small>クリア条件</small><strong>${m.extra?'':'3段階を突破 → '}${escapeText(condition)}</strong></div></div>${questRewards(m,done)}<details class="departure-details"><summary>作戦の背景・失敗条件</summary><p>${escapeText(failure)}</p></details>`;}
