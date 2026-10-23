/** Original engraved talismans, shared by summon results and collection. */
const symbols: Record<string, { color: string; art: string }> = {
 spark:{color:'#f3a358',art:'<path d="M64 25c7 19 25 28 25 46a25 25 0 0 1-50 0c0-12 8-23 14-30-1 13 4 17 8 18 8-11 8-20 3-34Z"/><path d="M65 57c1 13 12 15 10 27-2 12-21 12-22 0-1-10 8-17 12-27Z" fill="#ffe8bc"/>'},
 shade:{color:'#9aafe9',art:'<path d="m48 32 35 7-13 41-26 22 9-33Z"/><path d="m57 43 14 3-11 28-10 12" fill="none" stroke="#e8eaff" stroke-width="2"/>'},
 stone:{color:'#a8bcc3',art:'<path d="m64 31 28 11-5 35-23 24-23-24-5-35Z"/><path d="m64 41 17 7-4 25-13 14-13-14-4-25Z" fill="#24323a"/><path d="M64 47v32M52 59h24" fill="none" stroke-width="4"/>'},
 life:{color:'#83c8a2',art:'<path d="M36 84c9-34 34-49 57-53-2 39-22 67-48 60Z"/><path d="m38 98 39-51M53 77l-3-17m15 3 16-2" fill="none" stroke="#d2edc7" stroke-width="3"/>'},
 wind:{color:'#a0d5dc',art:'<path d="m35 100 23-58 38-14-13 21 9-1-20 21 9-2-27 24Z"/><path d="m40 103 33-54M47 85l16-3m-11-12 15-3" fill="none" stroke="#e3f8ef" stroke-width="2"/>'},
 eclipse:{color:'#c8b0ef',art:'<path d="M79 30a36 36 0 1 0 0 72 31 31 0 0 1 0-72Z"/><path d="m83 48 5 12 13 5-13 5-5 13-5-13-13-5 13-5Z" fill="#f4dfaa"/>'},
 aurora:{color:'#ffcf78',art:'<path d="m64 20 9 29 25-12-12 25 24 8-25 9 10 24-24-13-9 25-9-26-24 11 12-23-24-9 25-8-11-24 25 12Z"/><path d="m64 43 15 25-15 22-15-22Z" fill="#fff2c5"/><path d="m64 52 8 16-8 13-8-13Z" fill="#bc712b"/>'},
 nightwing:{color:'#b6a3fa',art:'<path d="M62 76 25 36l7 43 28 24 5-15 7 15 26-24 6-43-37 40Z"/><path d="M38 54 60 82m30-28L70 82M43 72l13 15m29-15L74 87" fill="none" stroke="#e3d8ff" stroke-width="2"/><path d="m65 27 6 16 16 6-16 6-6 16-6-16-16-6 16-6Z" fill="#e9e0ff"/>'},
};
let serial = 0;
export function sigilIcon(id: string): string {
 const item=symbols[id];if(!item)return '';
 const key='sigil-'+id+'-'+serial++, ticks=Array.from({length:12},(_,i)=>`<path d="M64 13v5m-2-1h4" transform="rotate(${i*30} 64 66)"/>`).join('');
 return `<svg class="sigil-art" viewBox="0 0 128 136" aria-hidden="true"><defs><linearGradient id="${key}-metal" x2=".9" y2="1"><stop stop-color="#f7e2b7"/><stop offset=".35" stop-color="#917b59"/><stop offset=".7" stop-color="#303b46"/><stop offset="1" stop-color="#c5ae80"/></linearGradient><radialGradient id="${key}-stone"><stop stop-color="#344052"/><stop offset="1" stop-color="#0b1620"/></radialGradient></defs><ellipse cx="64" cy="127" rx="33" ry="5" fill="#02070c" opacity=".6"/><path d="m64 6 48 27 8 54-36 36H44L8 87l8-54Z" fill="#060f18" stroke="url(#${key}-metal)" stroke-width="3"/><circle cx="64" cy="66" r="47" fill="url(#${key}-stone)" stroke="url(#${key}-metal)" stroke-width="5"/><circle cx="64" cy="66" r="41" fill="none" stroke="${item.color}" opacity=".25"/><g stroke="${item.color}" stroke-width="1" fill="none" opacity=".7">${ticks}</g><g fill="${item.color}" stroke="#0c1721" stroke-width="1.5" stroke-linejoin="round">${item.art}</g><path d="m64 9 4 6-4 6-4-6Zm0 102 4 6-4 6-4-6Z" fill="${item.color}"/><path d="m20 34 4 3m80-3 4 3M18 87l4-2m84 2 4-2" stroke="#cdb685" stroke-width="2"/></svg>`;
}
