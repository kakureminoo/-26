import {endlessWave} from './endless';
import type {CampaignQuest} from './campaign';
import {terraceTerrain,type Terrain} from './terrain';
import type {Cell} from './pathfinding';
export type ActivityMode='expedition'|'puzzle'|'defense'|'request'|'trial'|'rematch'|'heights'|'farm'|'endless';
export interface Activity extends CampaignQuest {
 extra:true;mode:ActivityMode;unlockStep:number;fixed?:boolean;charge?:number;chargeCap?:number;maxRounds?:number;
 spawn?:{light:Cell;shadow:Cell};lamp?:Cell;terrain?:Terrain;waves?:CampaignQuest['enemies'][];
 puzzle?:{light:Cell;shadow:Cell};beacon?:Cell&{hp:number};surviveRounds?:number;ban?:string[];
}
const enemy=(x:number,y:number,kind:NonNullable<CampaignQuest['enemies'][number]['kind']>,affinity:'light'|'shadow'|'yinYang'='shadow',species:'goblin'|'mercenary'|'dragon'='goblin',hp=8)=>({x,y,kind,affinity,species,hp,damage:3});
function activity(id:ActivityMode,name:string,description:string,extra:Partial<Activity>):Activity{
 return {id,area:0,name,goal:'hunt',type:'追加探索',desc:description,purpose:description,after:'二匹で新しい課題を乗り越えた。',reward:'灯の欠片：初回6／再挑戦2',material:'crystal',xp:0,firstReward:0,blocks:[],enemies:[],lights:[{x:3,y:1,r:4}],extra:true,mode:id,unlockStep:1,...extra};
}
export const activities:Activity[]=[
 activity('endless','無限連戦・終わらぬ夜','敵を全滅させるたび次のフェーズへ。HP・チャージは持ち越し、敵の能力と数が増える。敗北・撤退までの最高突破フェーズを記録。出現数は最大10体、能力は上昇し続ける。',{area:4,unlockStep:25,type:'エンドコンテンツ · 記録挑戦',enemies:endlessWave(1),lights:[{x:2,y:1,r:4},{x:11,y:1,r:3}],reward:'最高突破フェーズの記録（素材報酬なし）'}),
 activity('expedition','連戦探索・双路の踏査','3戦を続けて突破する。HPとチャージを引き継ぎ、戦闘間の回復はない。途中で撤退すると報酬なし。',{
  unlockStep:1,enemies:[enemy(7,4,'sentinel','light'),enemy(9,6,'shadeGuard')],
  waves:[[enemy(8,3,'lightWarden','light'),enemy(11,5,'binder','shadow')],[enemy(9,3,'warper','yinYang'),enemy(11,5,'shadowWeaver','yinYang','dragon',14)]],
 }),
 activity('puzzle','明暗パズル・調和の二つ印','8ラウンド以内に、光の猟犬を光印で明るさ3以上、影の猟犬を影印で明るさ1以下にする。同時に満たすと達成。',{
  area:1,unlockStep:2,maxRounds:8,charge:3,lights:[],lamp:{x:2,y:2},puzzle:{light:{x:5,y:4},shadow:{x:7,y:4}},blocks:[[6,3],[6,5]],
 }),
 activity('defense','防衛戦・灯を絶やすな','灯台核を5ラウンド守る。第3ラウンドに増援。敵の予告が核に重なると耐久が減る。二匹が倒れるか核が壊れると失敗。',{
  unlockStep:3,beacon:{x:3,y:4,hp:9},surviveRounds:5,enemies:[enemy(7,4,'sentinel','light'),enemy(9,2,'sunArcher','light')],lights:[{x:3,y:4,r:4},{x:9,y:2,r:3}],
 }),
 activity('request','制限依頼・壁なき救援路','6ラウンド以内に灯芯を確保して帰還する。遮蔽物の設置は禁止。戦闘力より進路と予告の判断が重要。',{
  area:1,unlockStep:3,goal:'relic',maxRounds:6,ban:['block'],item:{x:8,y:4},enemies:[enemy(9,2,'binder'),enemy(11,5,'displacer','light')],blocks:[[5,2],[5,5]],
 }),
 activity('trial','戦術試練・陰陽の包囲','固定能力・装備と刻印なし。8ラウンド以内に陰陽の敵3体を倒す。育成の強さに頼らず、連携と予告への対処を試す。',{
  area:2,type:'高難易度 · 固定能力',unlockStep:4,fixed:true,charge:3,maxRounds:8,lights:[{x:6,y:4,r:3},{x:10,y:1,r:3}],spawn:{light:{x:4,y:4},shadow:{x:5,y:5}},
  enemies:[{...enemy(7,4,'shadeGuard','yinYang','mercenary',7),damage:4},{...enemy(9,4,'sunArcher','yinYang','mercenary',6),damage:4},enemy(10,6,'displacer','yinYang','mercenary',6)],
 }),
 activity('rematch','再戦・喰らいし双極','三要所解放後の二体と再戦。HP36・威力7。二体の予告を読み、封印陣と二匹の得意な床を使う。',{
  area:2,type:'高難易度 · ボス再戦',unlockStep:15,goal:'boss',charge:3,chargeCap:3,lights:[{x:2,y:1,r:4},{x:11,y:1,r:4}],
  enemies:[{x:10,y:3,hp:36,boss:true,kind:'eclipseLord',species:'devourer',affinity:'light',damage:7},{x:11,y:5,hp:36,boss:true,kind:'eclipseLord',species:'devourer',affinity:'shadow',damage:7}],
 }),
 activity('heights','高低差探索・見晴らしの砦','階段から高台へ登る。登りは移動コスト+1、高台から低地への通常攻撃は威力+1。低い壁は同じ高さの光と射線を遮り、高所からは越えられる。',{
  area:2,unlockStep:5,terrain:terraceTerrain(),lights:[{x:8,y:2,r:5},{x:2,y:1,r:4}],blocks:[[4,2],[11,6]],
  enemies:[enemy(8,4,'sunArcher','light','mercenary',10),enemy(11,4,'shadeGuard','shadow','dragon',12),enemy(9,6,'binder','yinYang','dragon',9)],
 }),
 activity('farm','周回遠征・欠片の鉱脈','3波を突破して猟犬召喚石8個を獲得。クリア後も回数制限なく挑戦できます。',{area:2,unlockStep:25,enemies:[enemy(8,3,'sentinel','light','goblin',7)],waves:[[enemy(9,4,'shadeGuard','shadow','mercenary',9)],[enemy(10,3,'sunArcher','light','dragon',12),enemy(11,5,'sentinel','shadow','goblin',8)]]}),
];
export function activityCondition(m:Activity){
 if(m.mode==='endless')return '敵を全滅させ、突破フェーズの自己記録を伸ばす';
 if(m.mode==='puzzle')return '二匹が各印に立ち、光印は明るさ3以上・影印は1以下';
 if(m.mode==='defense')return `${m.surviveRounds}ラウンドの敵行動終了まで灯台核と一匹以上を守る`;
 if(m.mode==='farm')return '全3波を撃破（途中報酬なし）';
 if(m.mode==='expedition')return 'HPを引き継いで全3波を撃破';
 if(m.goal==='relic')return '期限内に灯芯を確保し、その場から帰還';
 if(m.goal==='boss')return '光喰らい・影喰らいの両方を倒す';return 'すべての敵を倒す';
}
/** Objective checks are independent from presentation and save writes. */
export function activityOutcome(m:Activity,dogs:{light:Cell&{hp:number};shadow:Cell&{hp:number}},field:readonly number[][],round:number,beaconHP?:number):'success'|'failure'|undefined{
 if(m.beacon&&!(beaconHP!>0))return 'failure';
 if(dogs.light.hp<=0&&dogs.shadow.hp<=0)return 'failure';
 if(m.puzzle){const {light,shadow}=m.puzzle;if(dogs.light.hp>0&&dogs.shadow.hp>0&&dogs.light.x===light.x&&dogs.light.y===light.y&&dogs.shadow.x===shadow.x&&dogs.shadow.y===shadow.y&&field[light.y][light.x]>=3&&field[shadow.y][shadow.x]<=1)return 'success';}
 if(m.surviveRounds&&round>m.surviveRounds)return 'success';
 if(m.maxRounds&&round>m.maxRounds)return 'failure';return undefined;
}
export function combatActivityAllowed(m:{mode?:ActivityMode}){return m.mode!=='puzzle'&&m.mode!=='defense';}
export function reinforcementWave(round:number){return round===3?[enemy(11,4,'sentinel','shadow','mercenary',10),enemy(12,6,'warper','light','goblin',8)]:[];}
export function placeWave<T extends Cell>(incoming:readonly T[],occupied:readonly Cell[],blocked:(x:number,y:number)=>boolean):T[]{
 const used=new Set(occupied.map(p=>p.x+','+p.y)),result:T[]=[];
 for(const enemy of incoming){const options:Cell[]=[];for(let y=0;y<8;y++)for(let x=0;x<14;x++)if(!blocked(x,y)&&!used.has(x+','+y))options.push({x,y});
 options.sort((a,b)=>(Math.abs(a.x-enemy.x)+Math.abs(a.y-enemy.y))-(Math.abs(b.x-enemy.x)+Math.abs(b.y-enemy.y))||a.y-b.y||a.x-b.x);
 if(options[0]){used.add(options[0].x+','+options[0].y);result.push({...enemy,...options[0]});}
 }return result;
}

export function activityFailureCondition(m:Activity){return ['二匹とも戦闘不能',...(m.maxRounds?['制限ラウンド超過']:[]),...(m.beacon?['灯台核の破壊']:[])].join('／');}
export function activityUnlocked(m:Activity,step:number,cleared:readonly string[]){return (m.mode==='rematch'||m.mode==='farm'||m.mode==='endless')?cleared.includes('castle-heart'):step>=m.unlockStep;}
