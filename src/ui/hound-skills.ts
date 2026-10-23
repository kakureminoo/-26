import {houndSpecials} from '../game/battle-kit';
import {houndByID} from '../game/roster';
import {escapeText as esc} from './quest-card';
/** Read-only view of the same two special slots used by combat. */
export function renderHoundSkills(id:string){
 const kind=houndByID(id)?.kind??'light';
 const entries=[
  {slot:'基本攻撃',id:'attack',name:kind==='light'?'噛みつく':'影の一撃',cost:0,description:'隣接する敵1体を攻撃。隣接する木箱も攻撃して壊せます。',note:'敵の上下または左右に二匹が隣接すると「双牙の交差」に変化。二匹が生存・行動可能なとき、チャージなしで連携攻撃。'},
  ...houndSpecials(id).map((s,index)=>({slot:'専用技'+(index+1),...s,note:'bonus'in s?'威力：攻撃力'+(s.bonus>0?'＋'+s.bonus:s.bonus<0?'−'+Math.abs(s.bonus):'と同じ')+'。'+(s.heal?'ダメージを与えるとHP'+s.heal+'回復（最大HPまで）。':'遮蔽物・射線によって対象が制限されます。'):s.id==='rally'?'自身と相棒を強化。重ねがけは加算せず更新。6段階覚醒で攻撃+4・防御+2に強化。':s.id==='block'?'空いた床に設置するか、既存の木箱を選んで移動。耐久は引き継ぎ、移動先を確定したときに消費。':s.id==='lamp'?'光源の移動で床の明るさと影が変化します。': '向きは同じ行・列のマスで指定。効果範囲は自分のマスも含みます。'})),
  {slot:'必殺技',id:'combo',name:'双極の奔流',cost:3,description:'二匹を通る行または列へ放ち、直線上の敵をまとめて攻撃。遮蔽物で止まります。',note:'二匹が生存・行動可能で、同じ行か列に並び、間に遮蔽物がないと発動。各ラウンド1回。'},
 ];
 return '<details class="hound-skill-details" open><summary>技の詳細</summary><div class="hound-skill-list">'+entries.map(s=>`<article data-hound-skill="${s.id}"><div class="hound-skill-heading"><span>${s.slot}</span><small>${s.cost?'チャージ '+s.cost:'チャージ不要'}</small></div><h4>${esc(s.name)}</h4><p>${esc(s.description)}</p><p class="hound-skill-note">${esc(s.note)}</p></article>`).join('')+'</div></details>';
}
