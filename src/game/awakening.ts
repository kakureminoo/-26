/** Duplicate-only growth. Old saves have no reliable per-character draw history. */
export const awakeningFinal = {
 reaper:{name:'終わらぬ追猟',text:'撃破ごとの攻撃上昇が+2に増加・常時攻撃+3',hp:0,attack:3,armor:0,move:0},
 herald:{name:'不滅の誓灯',text:'鼓舞が攻撃+4・防御+2に強化・最大HP+8',hp:8,attack:0,armor:0,move:0},
 sol:{name:'白夜の王牙',text:'明るさ3以上で攻撃+4・移動+1',hp:0,attack:4,armor:0,move:1},
 moon:{name:'常闇の月牙',text:'明るさ1以下で攻撃+4・移動+1',hp:0,attack:4,armor:0,move:1},
 ember:{name:'燎原の覇者',text:'常時攻撃+4',hp:0,attack:4,armor:0,move:0},
 frost:{name:'不滅の霜影',text:'最大HP+12・防御+2',hp:12,attack:0,armor:2,move:0},
} as const;
export const awakeningSteps=['攻撃+1','最大HP+4','攻撃+1','防御+1','最大HP+4'] as const;
export const canAwaken=(id:string):id is keyof typeof awakeningFinal=>Object.hasOwn(awakeningFinal,id);
export function awakeningLevel(value:unknown){return typeof value==='number'&&Number.isSafeInteger(value)?Math.max(0,Math.min(6,value)):0;}
export function migrateAwakenings(raw:unknown,owned:readonly string[]){
 const source=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};
 return Object.fromEntries(owned.filter(canAwaken).map(id=>[id,awakeningLevel(source[id])]));
}
export function awakeningBonus(id:string,value:unknown,brightness:number){
 const rank=canAwaken(id)?awakeningLevel(value):0;
 const b={hp:(rank>=2?4:0)+(rank>=5?4:0),attack:(rank>=1?1:0)+(rank>=3?1:0),armor:rank>=4?1:0,move:0};
 if(rank===6&&canAwaken(id)){
  const final=awakeningFinal[id],active=id==='sol'?brightness>=3:id==='moon'?brightness<=1:true;
  b.hp+=final.hp;b.armor+=final.armor;if(active){b.attack+=final.attack;b.move+=final.move;}
 }return b;
}
export function awakeningEffect(id:string,stage:number){return stage===6&&canAwaken(id)?awakeningFinal[id].name+'：'+awakeningFinal[id].text:awakeningSteps[stage-1]??'';}
