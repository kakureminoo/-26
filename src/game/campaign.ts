import {liberationState} from './liberation';
import type {EnemyIdentity} from './enemy-identity';
import {questStories} from './story';
import { campaignEnemyStats } from './enemy-balance';
/** Campaign data is shared by the quest menu, progression, and battle objectives. */
export type QuestGoal = 'hunt' | 'relic' | 'rescue' | 'boss';
export interface CampaignQuest {
 id: string; area: number; name: string; goal: QuestGoal; type: string; desc: string;
 after: string; purpose:string; unlock?: string; reward: string; material: 'metal' | 'crystal'; xp: number; firstReward: number;
 blocks: number[][]; enemies: (EnemyIdentity & {x:number;y:number;hp:number;kind?:import('./tactics').EnemyKind;boss?:boolean;damage?:number})[];
 lights: {x:number;y:number;r:number}[]; item?: {x:number;y:number}; pulse?: boolean; lampRadius?: number; climate?:import('./stage-lighting').LightClimate;
}
export const campaignAreas = [
 {id:0,name:'灯の消えた都',subtitle:'失われた灯芯を取り戻す',description:'住民を救い、ボスゴブリンが守る灯台を解放して、光の猟犬の力を取り戻す。',mark:'Ⅰ',theme:'city'},
 {id:1,name:'霧渡りの森',subtitle:'霧の向こうの灯を追う',description:'白と黒の魔物を退け、黒竜が守る祭壇を解放して、影の猟犬の力を取り戻す。',mark:'Ⅱ',theme:'forest'},
 {id:2,name:'白夜の聖域',subtitle:'光の海に影を残す',description:'強い環境光に覆われた聖域。遮蔽物の影と影の技を使い、集光炉を解放する。',mark:'Ⅲ',theme:'sanctum'},
 {id:3,name:'常闇の深淵',subtitle:'闇の底へ灯を運ぶ',description:'灯火の半径が短くなる深淵。光の猟犬が足場を照らし、影の猟犬が道を開く。',mark:'Ⅳ',theme:'abyss'},
 {id:4,name:'暁封じの城',subtitle:'夜を閉ざす主を討つ',description:'服従を強いられた城の中枢を解放し、光喰らい・影喰らいの支配を終わらせる。',mark:'Ⅴ',theme:'castle'},
] as const;
const typeNames={hunt:'討伐',relic:'奪取',rescue:'救助',boss:'ボス討伐'};
function quest(id:string,area:number,name:string,goal:QuestGoal,desc:string,blocks:number[][],enemies:CampaignQuest['enemies'],lights:CampaignQuest['lights'],extra:Partial<CampaignQuest>={}):CampaignQuest {
 const material=goal==='relic'||goal==='boss'?'crystal':'metal';
 return {id,area,name,goal,type:typeNames[goal],desc,material,xp:goal==='boss'?4:2,firstReward:goal==='boss'?5:3,reward:'経験値・'+(material==='metal'?'金属片':'影の結晶'),blocks,enemies:enemies.map((e,i)=>({...campaignEnemyStats(e,area===4?2:area),species:e.species??(area>=2?'mercenary':'goblin'),affinity:e.affinity??(area===4&&id==='castle-eclipse'?'yinYang':i%2===0?'shadow':'light'),...(e.boss?{kind:'eclipseLord' as const}:{} )})),lights,...extra,purpose:questStories[id].before,after:questStories[id].after};
}
export const campaignQuests: CampaignQuest[] = [
 quest('hunt',0,'薄明の遺跡','hunt','城門の魔物をすべて倒し、都への道を開く。',[[5,1],[5,2],[8,4],[8,5],[10,5]],[{x:10,y:3,hp:5,kind:'shadeGuard'},{x:12,y:6,hp:4}],[{x:2,y:1,r:4},{x:11,y:1,r:4}]),
 quest('relic',0,'月影の奪取','relic','夜霧の回廊から灯芯を回収し、運び手が帰還する。敵の全滅は不要。',[[4,2],[4,3],[7,1],[7,2],[9,4],[9,5]],[{x:11,y:3,hp:6,kind:'shadeGuard'},{x:10,y:6,hp:5}],[{x:1,y:1,r:3},{x:12,y:6,r:3}],{item:{x:11,y:4},lampRadius:3,unlock:'工房'}),
 quest('rescue',0,'灯台の救助','rescue','灯守を救助し、運び手が帰還する。広い光と灯射兵の射線に注意。',[[5,2],[5,3],[8,1],[8,5],[9,5]],[{x:9,y:3,hp:5,kind:'sunArcher'},{x:12,y:5,hp:5}],[{x:4,y:1,r:5},{x:11,y:3,r:5}],{item:{x:11,y:6},unlock:'調律の祭壇'}),
 quest('boss',0,'灯台のボスゴブリン','boss','灯台の支配核を解放し、光の猟犬の力を取り戻す。',[[4,1],[4,2],[6,5],[8,2],[9,5]],[{x:11,y:4,hp:14,boss:true}],[{x:2,y:1,r:4},{x:11,y:3,r:4}],{pulse:true}),
 quest('city-gate',0,'森へ続く門','relic','門の灯芯を取り戻し、霧渡りの森への道を照らす。',[[4,1],[4,2],[6,4],[6,5],[9,2],[9,3],[11,6]],[{x:8,y:3,hp:7,kind:'lightWarden'},{x:12,y:5,hp:6,kind:'displacer'}],[{x:3,y:1,r:4},{x:11,y:4,r:4}],{item:{x:12,y:2},unlock:'霧渡りの森'}),
 quest('forest-edge',1,'霧の入口','hunt','木立の間に潜む魔物をすべて倒す。縛影師の影縛りは、予告マスから移動するか遮蔽物で防ぐ。',[[4,2],[4,5],[6,1],[6,4],[8,3],[8,6],[10,2]],[{x:8,y:4,hp:7,kind:'binder'},{x:11,y:2,hp:7,kind:'shadeGuard'},{x:12,y:6,hp:6}],[{x:2,y:1,r:3},{x:11,y:5,r:3}],{lampRadius:3}),
 quest('forest-ember',1,'根に眠る灯芯','relic','森の奥の灯芯を拾い、運び手を帰還させる。幻灯師の囮と跳影獣のワープ先を読み、退路を作る。',[[4,1],[4,2],[4,5],[7,3],[7,4],[9,1],[9,6],[11,4]],[{x:9,y:3,hp:8,kind:'illusionist'},{x:12,y:6,hp:7,kind:'warper'}],[{x:1,y:1,r:3},{x:12,y:2,r:3}],{item:{x:12,y:3},lampRadius:3}),
 quest('forest-keeper',1,'迷い人の灯','rescue','霧の中の灯守を救助する。敵を倒すか、射線を遮って帰路を確保する。',[[5,1],[5,2],[5,5],[7,4],[9,2],[9,5],[11,1]],[{x:8,y:2,hp:8,kind:'warper'},{x:11,y:5,hp:8,kind:'shadeGuard'},{x:12,y:2,hp:6,kind:'displacer'}],[{x:4,y:1,r:4},{x:10,y:4,r:4}],{item:{x:12,y:6},lampRadius:3}),
 quest('forest-crossing',1,'明滅の渡り路','hunt','明滅する森の魔物をすべて倒す。予告を確認し、光の強まる手番で攻める。',[[4,2],[6,2],[6,3],[6,5],[8,1],[8,6],[10,4]],[{x:8,y:4,hp:9,kind:'shadowWeaver',species:'dragon',affinity:'light'},{x:11,y:3,hp:8,kind:'warper'},{x:12,y:6,hp:8,kind:'shadeGuard'}],[{x:3,y:1,r:4},{x:11,y:4,r:5}],{pulse:true}),
 quest('forest-heart',1,'祭壇の黒竜','boss','森の祭壇を解放し、影の猟犬の力を取り戻す。',[[4,1],[4,5],[6,2],[7,5],[9,1],[9,6],[10,3]],[{x:11,y:4,hp:20,boss:true,species:'dragon',affinity:'shadow'},{x:10,y:6,hp:8,kind:'warper'}],[{x:2,y:1,r:3},{x:11,y:2,r:5}],{pulse:true,unlock:'白夜の聖域'}),
 quest('sun-gate',2,'白夜の入口','hunt','床全体に明るさ3の光。箱の影と影の技を使って進む。',[[4, 2], [6, 4], [9, 2], [10, 5]],[{x:8,y:3,hp:9,kind:'lightWarden',affinity:'light'},{x:11,y:5,hp:8,kind:'sunArcher',species:'goblin'},{x:12,y:2,hp:8,kind:'warper'}],[{x:3,y:1,r:4},{x:10,y:3,r:5}],{climate:'radiant'}),
 quest('sun-relic',2,'白夜の灯芯','relic','床全体に明るさ3の光。箱の影と影の技を使って進む。',[[4, 3], [6, 2], [8, 5], [10, 3]],[{x:8,y:3,hp:9,kind:'lightWarden',affinity:'light'},{x:11,y:5,hp:8,kind:'sunArcher',species:'goblin'},{x:12,y:2,hp:8,kind:'warper'}],[{x:3,y:1,r:4},{x:10,y:3,r:5}],{climate:'radiant',item:{x:12,y:4}}),
 quest('sun-rescue',2,'白夜の救助','rescue','床全体に明るさ3の光。箱の影と影の技を使って進む。',[[5, 2], [7, 4], [9, 5]],[{x:8,y:3,hp:9,kind:'lightWarden',affinity:'light'},{x:11,y:5,hp:8,kind:'sunArcher',species:'goblin'},{x:12,y:2,hp:8,kind:'warper'}],[{x:3,y:1,r:4},{x:10,y:3,r:5}],{climate:'radiant',item:{x:12,y:4}}),
 quest('sun-crossing',2,'白夜の渡り橋','hunt','床全体に明るさ3の光。箱の影と影の技を使って進む。',[[4, 2], [6, 5], [8, 2], [10, 5]],[{x:8,y:3,hp:9,kind:'lightWarden',affinity:'light'},{x:11,y:5,hp:8,kind:'sunArcher',species:'goblin'},{x:12,y:2,hp:8,kind:'warper'}],[{x:3,y:1,r:4},{x:10,y:3,r:5}],{climate:'radiant'}),
 quest('sun-heart',2,'集光炉の白竜','boss','床全体に明るさ3の光。箱の影と影の技を使って進む。',[[4, 1], [6, 5], [8, 2], [10, 6]],[{x:10,y:4,hp:22,boss:true,species:'dragon',affinity:'light'},{x:11,y:6,hp:9,kind:'displacer'}],[{x:3,y:1,r:4},{x:10,y:3,r:5}],{climate:'radiant',unlock:'常闇の深淵'}),
 quest('abyss-gate',3,'常闇の入口','hunt','灯火の届く半径が58%。小さな光を運び、深い影を味方にする。',[[4, 2], [6, 4], [9, 2], [10, 5]],[{x:8,y:3,hp:9,kind:'shadowWeaver',affinity:'shadow'},{x:11,y:5,hp:8,kind:'binder',species:'goblin'},{x:12,y:2,hp:8,kind:'warper'}],[{x:2,y:1,r:3},{x:11,y:5,r:3}],{climate:'umbral'}),
 quest('abyss-relic',3,'常闇の灯芯','relic','灯火の届く半径が58%。小さな光を運び、深い影を味方にする。',[[4, 3], [6, 2], [8, 5], [10, 3]],[{x:8,y:3,hp:9,kind:'shadowWeaver',affinity:'shadow'},{x:11,y:5,hp:8,kind:'binder',species:'goblin'},{x:12,y:2,hp:8,kind:'warper'}],[{x:2,y:1,r:3},{x:11,y:5,r:3}],{climate:'umbral',item:{x:12,y:4}}),
 quest('abyss-rescue',3,'常闇の救助','rescue','灯火の届く半径が58%。小さな光を運び、深い影を味方にする。',[[5, 2], [7, 4], [9, 5]],[{x:8,y:3,hp:9,kind:'shadowWeaver',affinity:'shadow'},{x:11,y:5,hp:8,kind:'binder',species:'goblin'},{x:12,y:2,hp:8,kind:'warper'}],[{x:2,y:1,r:3},{x:11,y:5,r:3}],{climate:'umbral',item:{x:12,y:4}}),
 quest('abyss-crossing',3,'常闇の渡り橋','hunt','灯火の届く半径が58%。小さな光を運び、深い影を味方にする。',[[4, 2], [6, 5], [8, 2], [10, 5]],[{x:8,y:3,hp:9,kind:'shadowWeaver',affinity:'shadow'},{x:11,y:5,hp:8,kind:'binder',species:'goblin'},{x:12,y:2,hp:8,kind:'warper'}],[{x:2,y:1,r:3},{x:11,y:5,r:3}],{climate:'umbral'}),
 quest('abyss-heart',3,'水門の黒竜','boss','灯火の届く半径が58%。小さな光を運び、深い影を味方にする。',[[4, 1], [6, 5], [8, 2], [10, 6]],[{x:10,y:4,hp:22,boss:true,species:'dragon',affinity:'shadow'},{x:11,y:6,hp:9,kind:'displacer'}],[{x:2,y:1,r:3},{x:11,y:5,r:3}],{climate:'umbral',unlock:'暁封じの城'}),
 quest('castle-gate',4,'封城の守兵','hunt','城門の守兵をすべて倒す。縛影師の予告から退き、灯射兵の射線を断つ。',[[4,1],[4,2],[4,6],[6,4],[8,1],[8,5],[10,2],[10,5]],[{x:7,y:3,hp:10,kind:'binder'},{x:10,y:3,hp:9,kind:'sunArcher'},{x:12,y:6,hp:9,kind:'shadeGuard'}],[{x:3,y:1,r:5},{x:11,y:4,r:5}]),
 quest('castle-ember',4,'黒曜の灯庫','relic','城の灯庫から灯芯を回収する。灯の強い中央路と暗い外周を使い分ける。',[[4,2],[4,3],[6,1],[6,5],[8,2],[8,5],[10,3],[10,4]],[{x:8,y:3,hp:10,kind:'displacer',species:'dragon',affinity:'light'},{x:11,y:6,hp:10,kind:'illusionist'},{x:12,y:2,hp:8}],[{x:5,y:1,r:5},{x:11,y:3,r:5}],{item:{x:12,y:5}}),
 quest('castle-prison',4,'閉ざされた灯守','rescue','城に囚われた灯守を救出する。運び手を守りながら左端の帰還地点へ戻る。',[[4,1],[4,5],[6,2],[6,3],[8,4],[8,6],[10,1],[10,5]],[{x:9,y:2,hp:10,kind:'warper'},{x:11,y:4,hp:11,kind:'shadeGuard'},{x:12,y:6,hp:9,kind:'sunArcher'}],[{x:3,y:2,r:4},{x:11,y:2,r:5}],{item:{x:12,y:4}}),
 quest('castle-eclipse',4,'日蝕の回廊','hunt','最後の回廊の敵をすべて倒す。明滅と遮蔽物を使い、二匹の得意な明るさへ誘う。',[[4,2],[5,5],[6,1],[7,3],[8,5],[9,1],[10,4],[11,6]],[{x:8,y:2,hp:11,kind:'lightWarden'},{x:10,y:3,hp:10,kind:'warper'},{x:11,y:5,hp:11,kind:'shadeGuard'},{x:12,y:1,hp:9,kind:'shadowWeaver'}],[{x:3,y:1,r:5},{x:11,y:4,r:5}],{pulse:true}),
 quest('castle-heart',4,'光喰らいと影喰らい','boss','弱体化した光喰らいと影喰らいの両方を倒し、奪われた力を世界へ返す。',[[4,1],[4,6],[6,2],[6,5],[8,1],[8,6],[10,2],[10,5]],[{x:11,y:4,hp:20,boss:true,species:'devourer',affinity:'shadow'},{x:9,y:3,hp:20,boss:true,species:'devourer',affinity:'light'},{x:12,y:6,hp:10,kind:'warper',affinity:'yinYang'}],[{x:2,y:1,r:4},{x:11,y:1,r:5}],{pulse:true,unlock:'全エリアの踏破'}),
];
export function campaignStep(cleared:readonly string[]):number { let n=0;while(n<campaignQuests.length&&cleared.includes(campaignQuests[n].id))n++;return n; }
export function questUnlocked(id:string,cleared:readonly string[],legacy=false):boolean {
 if(id==='tactics')return true;
 const i=campaignQuests.findIndex(q=>q.id===id);
 if(id==='castle-heart'&&!cleared.includes(id)&&!liberationState(cleared).finalReady)return false;
 return i>=0&&(i===0||cleared.includes(id)||cleared.includes(campaignQuests[i-1].id)||(legacy&&i<4));
}
