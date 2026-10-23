import { findEquipment, type Equipment } from '../game/equipment';
const symbols: Record<Equipment['form'], string> = {
  fang:'<path d="M108 39 145 47 127 92 100 112 111 79Z"/><path d="m115 50 16 4-13 29" fill="none"/>',
  shield:'<path d="m120 38 33 13-5 43-28 25-28-25-5-43Z"/><path d="M120 51v48m-19-29h38" fill="none"/>',
  knot:'<path d="M120 39c-36-9-41 31-13 38-32 16-18 52 13 31 31 21 45-15 13-31 28-7 23-47-13-38Z"/><path d="m120 61 14 18-14 20-14-20Z"/>',
  wing:'<path d="m93 114 21-70 44-12-18 22 10-1-22 23 7-1-28 25Z"/><path d="m103 99 28-46" fill="none"/>',
  moon:'<path d="M140 35a42 42 0 1 0 1 80 36 36 0 0 1-1-80Z"/><path d="m144 59 5 13 13 5-13 5-5 13-5-13-13-5 13-5Z"/>',
  sun:'<path d="m120 29 10 23 25-2-10 23 17 18-25 6-17 23-17-23-25-6 17-18-10-23 25 2Z"/><path d="m120 55 16 23-16 24-16-24Z"/>',
  crown:'<path d="m70 69 12-31 25 20 13-32 13 32 25-20 12 31-12 31H82Z"/><path d="m120 68 14 17-14 21-14-21Z"/>',
  mantle:'<path d="M92 40q28-19 56 0l23 72-28-13-23 23-23-23-28 13Z"/><path d="m120 52 18 27-18 28-18-28Z"/>',
};
export function equipmentIcon(id: string): string {
 const item=findEquipment(id);if(!item)return '';
 const key='eq-'+id,metal=`url(#${key}-metal)`,face=`url(#${key}-face)`;
 let art=symbols[item.form];
 if(item.form==='crown')art='<path d="M60 63q60-28 120 0l-9 38q-51-24-102 0Z" fill="#243039"/><path d="m66 66 12-22 19 14 23-29 23 29 19-14 12 22-8 19q-46-18-92 0Z"/><path d="M77 77q43-18 86 0M80 87q40-15 80 0" fill="none"/><path d="M109 85v13h22V85m-28 15 17-13 17 13-3 28h-28Z"/><path d="m120 102 8 9-8 12-8-12Z" fill="#f9b852"/><path d="M109 103v22m22-22v22M104 101h32m-30 25h28" fill="none"/><circle cx="88" cy="67" r="4"/><circle cx="152" cy="67" r="4"/>';
 if(item.form==='mantle')art='<path d="M92 32q28-16 56 0l30 83-31-10-27 24-27-24-31 10Z" fill="#142733"/><path d="M96 36 80 104l18-8 22 24 22-24 18 8-16-68" fill="none" stroke="#617f8b"/><path d="m103 37-9 56m17-54-5 64m23-64 5 64m3-66 9 56" stroke="#2e4b5b" fill="none"/><path d="m101 39 19 8 19-8M120 47v15" fill="none"/><path d="m120 60 15 20-15 25-15-25Z"/><path d="m120 69 8 11-8 15-8-15Z" fill="#77b4c6"/><path d="m114 105-3 10m9-8v11m6-13 3 10" fill="none"/>';
 const fitting=item.form==='crown'||item.form==='mantle';
 return `<svg class="equipment-art" viewBox="0 0 240 150" role="img" aria-label="${item.name}"><defs><linearGradient id="${key}-metal" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#f3dfac"/><stop offset=".35" stop-color="${item.color}"/><stop offset=".65" stop-color="#53666c"/><stop offset="1" stop-color="${item.color}"/></linearGradient><linearGradient id="${key}-face" x2=".7" y2="1"><stop stop-color="#314956"/><stop offset="1" stop-color="#0d1b24"/></linearGradient></defs><ellipse cx="120" cy="132" rx="49" ry="7" fill="#02090c" opacity=".6"/><circle cx="120" cy="76" r="57" fill="${item.color}" opacity=".06"/><circle cx="120" cy="76" r="54" fill="none" stroke="${item.color}" opacity=".18"/>${fitting?'':'<path d="M104 10q16 22 32 0M116 23v12" stroke="#344148" stroke-width="5" fill="none"/><ellipse cx="119" cy="33" rx="6" ry="9" fill="none" stroke="#b7bdaf" stroke-width="3"/>'}<g transform="translate(2 4)" fill="#050e13" stroke="#050e13" stroke-width="5" opacity=".85">${art}</g><g fill="${face}" stroke="${metal}" stroke-width="4" stroke-linejoin="round">${art}</g>${fitting?'':`<g fill="${item.color}" stroke="#263841" stroke-width="1"><circle cx="108" cy="52" r="2.2"/><circle cx="132" cy="52" r="2.2"/></g><path d="m116 77 4-7 5 7-5 9Z" fill="${metal}"/>`}</svg>`;
}
