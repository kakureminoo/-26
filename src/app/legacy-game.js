import {endlessWave,recordEndlessBest} from '../game/endless';
import {freshHoundCombat,killAttackBonus,recordHoundDefeat,castRally,rallyBonus} from '../game/hound-traits';
import {renderHoundSkills} from '../ui/hound-skills';
import {houndSpecials,coordinatedTarget,questStartingCharge,canShiftObstacle} from '../game/battle-kit';
import {awakeningBonus} from '../game/awakening';
import {setupGachaHub} from '../ui/gacha-hub';
import {syncActiveGrowth,grantHoundXP} from '../game/hound-growth';
import {isHoundAttackSkill,attackSkillCells,houndAttackSkills,attackSkillPower,attackSkillHealing} from '../game/hound-skills';
import {questStages,stageLabel} from '../game/quest-stages';
import {migrateRoster,houndByID,houndBonus,rosterQuestReward,claimableRosterMissions} from '../game/roster';
import {setupCompanionHub} from '../ui/companion-hub';
import { sigilIcon } from '../render/sigil-icon';
import {environmentalBrightness,climateRadius} from '../game/stage-lighting';
import {materialReward} from '../game/rewards';
import {questCard,departureBrief} from '../ui/quest-card';
import {tutorialHint} from '../game/tutorial';
import {activities,activityUnlocked,activityCondition,activityFailureCondition,activityOutcome,combatActivityAllowed,reinforcementWave,placeWave} from '../game/activities';
import {migrateExpansion,socketSigil,sigilBonus,grantExpansionReward,recordRelics,recordEncounter} from '../game/expansion';
import {renderActivities,renderCollection} from '../ui/expansion';
import {elevation,heightScale,terrainStep,terrainSight,highGroundBonus} from '../game/terrain';
import {forecastEnemyPlans,forecastSafe} from '../game/enemy-forecast';
import {evacuationOptions} from '../game/evacuation';
import {lineSkillCells} from '../game/line-skills';
import {wideAttackInfo,wideAttackProtected} from '../game/wide-attacks';
import {liberationState,strongholds} from '../game/liberation';
import {worldStory,storyIntro} from '../game/story';
import {renderStoryBook} from '../ui/story-book';
import { pincerAttacks } from '../game/pincer';
import { stageLayout, stageContains } from '../game/stage-layout';
import { buildStage, stagePalettes } from '../render/stage-world.js';
import { plannedBrightness, applyPlannedLight, shadowRetreatTarget } from '../game/light-effects';
import { rankProgress, grantRankXP } from '../game/rank';
import { createObstacle, strikeObstacle } from '../game/obstacles';
import { movementRange, movementPath } from '../game/movement';
import { normalizeName, ambushBonus, settlePosition, comboState, comboCells, comboDamage } from '../game/special-abilities';
import { campaignAreas, campaignQuests, campaignStep, questUnlocked } from '../game/campaign';
import { planEnemies, assessPlan, attackDamage, enemyArmor, enemyName } from '../game/tactics';
import { beginPlayerRound, advancePlayerTurn } from '../game/turn-order';
import { tacticsStage } from '../game/tactics-stage';
import { equipmentCatalog, findEquipment, compatible, migrateEquipment, equipmentBonus, craftEquipment, equipEquipment } from '../game/equipment';
import { buildKennel } from '../render/kennel-scene.js';
import { equipmentIcon } from '../render/equipment-icon';
import { clearCondition, adjacentCells, combatObjectiveComplete, extractionState } from '../game/quest';
import { HoundWorld } from '../render/three-world';
import { MeshBuilder } from '../render/mesh-builder.js';
import { Sfx } from '../audio/sfx.js';
import { affinity, luminanceNames, movementBudget, movementCost } from '../game/affinity';

export function startGame() {
const W=14,H=8,S=80,canvas=document.getElementById('battle'),homeCanvas=document.getElementById('homeScene'),fx=document.getElementById('battleFx'),fxCtx=fx.getContext('2d');
let world,homeWorld,companionWorld,inspectedKind='light',previewYaw=.55,previewCharm='fang';try{world=new HoundWorld(canvas);homeWorld=new HoundWorld(homeCanvas)}catch(error){let box=document.createElement('div');box.id='modelError';box.textContent='3D画面を起動できませんでした。新しいChromeまたはSafariで開き、グラフィックスの使用が有効か確認してください。';canvas.parentElement.prepend(box);document.getElementById('titleView').classList.add('hidden');document.getElementById('gameShell').classList.remove('hidden');document.getElementById('homeView').classList.add('hidden');document.getElementById('battleView').classList.remove('hidden');return;}
let lastScene=null,titleWorld=null;
const gameFont=getComputedStyle(document.body).fontFamily;
const $=id=>document.getElementById(id),at=(x,y)=>x+','+y,inB=(x,y)=>stageContains(game.layout,x,y),dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
let fixed=[{x:2,y:1},{x:11,y:1}];
const missions=[...campaignQuests,tacticsStage,...activities];
const fresh={cleared:[],user:1,uxp:0,materials:{metal:0,crystal:0},light:{level:1,xp:0,power:0,guard:0,gear:false},shadow:{level:1,xp:0,power:0,guard:0,gear:false},wins:0};
let profile;try{profile=JSON.parse(localStorage.getItem('lightShadowSave'))||structuredClone(fresh)}catch{profile=structuredClone(fresh)}
if(!profile.materials||!profile.light||!profile.shadow)profile=structuredClone(fresh);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const companionName=k=>{const id=profile.roster?.party[k];return profile.roster?.names[id]||((id==='dawn'||id==='dusk'||!id)?(profile[k].name||(k==='light'?'光の猟犬':'影の猟犬')):undefined)||houndByID(id)?.name||(k==='light'?'光の猟犬':'影の猟犬')};
const dogLabel=k=>escapeHTML(companionName(k));
const save=()=>{syncActiveGrowth(profile);try{localStorage.setItem('lightShadowSave',JSON.stringify(profile))}catch{}};
let game,mode='move',hover=null,view='title',showNumbers=false,showCosts=false,overlayView='forecast';
const story={premise:worldStory.premise,acts:campaignQuests.map(m=>({mission:m.id,title:m.name,text:m.desc,after:m.after,unlock:m.unlock}))};
function migrateProfile(){
 profile.roster=migrateRoster(profile.roster,Array.isArray(profile.cleared)?profile.cleared:[]);
 profile.expansion=migrateExpansion(profile.expansion);recordRelics(profile.expansion,Array.isArray(profile.cleared)?profile.cleared:[]);
 if(!Array.isArray(profile.cleared)){profile.legacyAccess=profile.wins>0||['light','shadow'].some(k=>profile[k].level>1||profile[k].power>0||profile[k].gear);profile.cleared=[]}
 profile.cleared=profile.cleared.filter(id=>missions.some(m=>m.id===id));
 for(let k of ['light','shadow']){if(!['fury','ward','none'].includes(profile[k].attunement))profile[k].attunement='none';Object.assign(profile[k],migrateEquipment(profile[k],k));profile[k].name=normalizeName(profile[k].name);}profile.equipmentVersion=2;syncActiveGrowth(profile);
}
function storyStep(p=profile){return campaignStep(p.cleared)}
function questOpen(id){const extra=activities.find(m=>m.id===id);if(extra)return activityUnlocked(extra,storyStep(),profile.cleared);return questUnlocked(id,profile.cleared,!!profile.legacyAccess)}
function nextStoryMission(){return campaignQuests[Math.min(campaignQuests.length-1,storyStep())].id}
const flatProject=world.project.bind(world);world.project=point=>flatProject([point[0],point[1]+(game?floorY(point[0],point[2]):0),point[2]]);
function floorY(x,z){return elevation(game.m.terrain,{x:Math.floor(x),y:Math.floor(z)})*heightScale}
function lift(m,start,x,y){const h=floorY(x+.5,y+.5);if(h)for(let i=start;i<m.v.length;i+=11)m.v[i+1]+=h}
function placed(m,x,y,draw){const start=m.v.length;draw();lift(m,start,x,y)}
let questCategory='story';
let basePanel='journey',selectedArea=0,portraitBoard=false;
function statsFor(kind,field=brightness(),position=game.dogs[kind]){let p=game.loadout?.[kind]??profile[kind],level=field[position.y]?.[position.x]??0,a=affinity[kind][level],gear=equipmentBonus(p.equipment,level),rune=sigilBonus(game.sigils??profile.expansion,kind,p.equipment,level),hound=houndBonus(game.hounds?.[kind]??(kind==='light'?'dawn':'dusk'),level),buff=rallyBonus(game.houndCombat??freshHoundCombat(),game.round),growth=killAttackBonus(game.hounds?.[kind],game.houndCombat??freshHoundCombat()),awakened=awakeningBonus(game.hounds?.[kind],game.awakenings?.[game.hounds?.[kind]],level);let base=2+p.power+rune.attack+hound.attack+awakened.attack+growth+buff.attack+Math.floor((p.level-1)/3)+gear.attack+(game.liberation?.[kind+'Attack']??0)+(p.attunement==='fury'?1:0);return {level,label:luminanceNames[level],attack:Math.max(1,base+a.attack+ambushBonus({...game.dogs[kind],...position})),attackDelta:a.attack,armor:Math.max(0,a.armor+gear.armor+rune.armor+hound.armor+awakened.armor+buff.armor+(game.liberation?.armor??0)+(p.attunement==='ward'?1:0)),move:hound.move+awakened.move+rune.move+movementBudget[kind]+equipmentBonus(p.equipment,0).move,evade:Math.min(.75,a.evade+gear.evade+rune.evade)}}

function questActive(){return game.started&&!game.done}
function openBase(panel='journey'){if(panel==='activities'){questCategory='endgame';panel='journey'}if(busy()||questActive())return;basePanel=panel;setView('base')}
function questPrompt(title,body,label,confirm,sound='ui'){
 $('questConfirm').dataset.sound=sound;
 $('questDialogTitle').textContent=title;$('questDialogBody').textContent=body;$('questConfirm').textContent=label;
 $('questCancel').onclick=()=>$('questDialog').close();
 $('questConfirm').onclick=()=>{$('questDialog').close();confirm()};$('questDialog').showModal();
}
function launchQuest(id,tutorial=false){if(busy()||questActive()||!questOpen(id))return;
 let mission=missions.find(m=>m.id===id);
 questPrompt(mission.name,(mission.practice?'演習は固定の能力・チャージ3で開始し、育成・装備・素材・進行を変更しません。'+mission.desc+' ':mission.purpose+' ')+'クリア条件：'+missionCondition(mission)+'。失敗条件：'+(mission.extra?activityFailureCondition(mission):'二匹とも戦闘不能')+'。開始後は、成功・失敗・撤退するまで拠点に戻れません。','クエスト開始',()=>{init(id);game.tutorial=id==='hunt'&&!game.m.practice&&(tutorial||!profile.cleared.includes('hunt'));game.started=true;if(!game.m.practice){recordEncounter(profile.expansion,game.enemies);save()}setView('battle');startQuestIntro()},'departure');
 $('questDialogBody').innerHTML=departureBrief(mission,missionCondition(mission),mission.extra?profile.expansion.clears.includes(id):profile.cleared.includes(id),(mission.purpose??mission.desc)+' · '+(mission.extra?activityFailureCondition(mission):'二匹とも戦闘不能'));
}
function missionCondition(m){if(game?.phases&&game.stage<2&&m===game.m)return '現在の敵をすべて倒す';return m.extra?activityCondition(m):clearCondition(m.id)}
function readStage(){if(game.m.climate==='radiant')return '白夜 · 環境光3／遮蔽物の影1';if(game.m.climate==='umbral')return '常闇 · 灯火の半径58%';if(game.m.extra)return (game.m.terrain?'高台・階段・低い壁 · ':game.m.fixed?'固定能力 · ':'')+game.m.type;if(game.m.practice)return '影鎧兵を照らす · 灯射兵の射線を断つ';if(game.m.pulse)return game.round%2?'明滅 · 灯が強まるターン':'明滅 · 灯が弱まるターン';if(game.m.lampRadius===3)return '夜霧 · 灯の届く範囲が狭い';if(game.m.lights.some(p=>p.r>=5))return '強光 · 強い光と射線に注意';return campaignAreas[game.m.area].name+' · 光と影の境界'}
function fitGameViewport(){
 if(typeof window==='undefined')return;
 let r=canvas.getBoundingClientRect();
 if(view==='battle'&&r.width>0&&r.height>0){let width=Math.min(1600,Math.max(720,Math.round(r.width*Math.min(window.devicePixelRatio||1,1.6)))),height=Math.round(width*r.height/r.width);if(canvas.width!==width||canvas.height!==height){canvas.width=fx.width=width;canvas.height=fx.height=height}portraitBoard=window.innerHeight>window.innerWidth;draw()}
 let h=homeCanvas.getBoundingClientRect();if(view==='home'&&h.width>0&&h.height>0){let width=Math.min(1600,Math.round(h.width*Math.min(window.devicePixelRatio||1,1.5))),height=Math.round(width*h.height/h.width);if(homeCanvas.width!==width||homeCanvas.height!==height){homeCanvas.width=width;homeCanvas.height=height}drawHome()}
}
function frameCamera(){$('mapViewport').dataset.camera=portraitBoard?'portrait':'landscape';let target=portraitBoard?[W/2,.15,H/2]:[W/2,.25,H/2+.35],eye=portraitBoard?[W/2+21,25,H/2+.7]:[W/2+3.5,18,H/2+21];world.camera(eye,target,1);let points=[];for(let x of [-.75,W+.75])for(let z of [-.8,H+.8])points.push([x,.05,z]);for(let x of [.5,W-.5])for(let z of [.5,H-.5])points.push([x,1.25,z]);for(let x of [-.53,4,9.7,W+.53])points.push([x,2.2,-.56]);for(let x of [W/2-1.2,W/2+1.2])points.push([x,-.8,H+1.6]);let needed=1;for(let point of points){let p=world.project(point);needed=Math.max(needed,Math.abs(p.x/canvas.width-.5)*2,Math.abs(p.y/canvas.height-.5)*2)}world.camera(eye,target,needed*1.035)}

migrateProfile();selectedArea=campaignQuests.find(m=>m.id===nextStoryMission()).area;
function init(id='hunt'){
 const source=missions.find(q=>q.id===id)||missions[0],phases=questStages(source),m=phases?{...source,goal:'hunt',item:undefined,enemies:phases[0]}:source;fixed=m.lights.map(p=>({...p}));
 const loadout=structuredClone((m.practice||m.fixed)?{light:{...fresh.light,attunement:'none',guard:1},shadow:{...fresh.shadow,attunement:'none',guard:1}}:{light:profile.light,shadow:profile.shadow});
 const hounds=(m.practice||m.fixed)?{light:'dawn',shadow:'dusk'}:{...profile.roster.party};
 const awakenings=m.practice||m.fixed?{}:{...profile.roster.awakenings};
 let lightHP=((m.practice||m.fixed)?0:sigilBonus(profile.expansion,'light',loadout.light.equipment,0).hp)+houndBonus(hounds.light,0).hp+awakeningBonus(hounds.light,awakenings[hounds.light],0).hp+8+loadout.light.guard*2+Math.floor((loadout.light.level-1)/2)+equipmentBonus(loadout.light.equipment,0).hp,shadowHP=((m.practice||m.fixed)?0:sigilBonus(profile.expansion,'shadow',loadout.shadow.equipment,0).hp)+houndBonus(hounds.shadow,0).hp+awakeningBonus(hounds.shadow,awakenings[hounds.shadow],0).hp+7+loadout.shadow.guard*2+Math.floor((loadout.shadow.level-1)/2)+equipmentBonus(loadout.shadow.equipment,0).hp;
 game={m:{...m,chargeCap:3},source,phases,stage:0,hounds,awakenings,houndCombat:freshHoundCombat(),endlessCleared:0,wave:0,beaconHP:m.beacon?.hp,liberation:liberationState(m.practice||m.fixed?[]:profile.cleared),sigils:m.practice||m.fixed?migrateExpansion():structuredClone(profile.expansion),layout:{...stageLayout(m.practice?{id:'tactics'}:m),terrain:m.terrain},loadout,started:false,round:1,phase:'light',step:'move',charge:questStartingCharge(),blocks:m.blocks.map(([x,y])=>createObstacle(x,y)),lamp:{...(m.lamp??{x:3,y:3})},effects:[],dogs:{light:{...(m.spawn?.light??{x:1,y:4}),hp:lightHP,max:lightHP},shadow:{...(m.spawn?.shadow??{x:2,y:6}),hp:shadowHP,max:shadowHP}},enemies:m.enemies.map((e,i)=>({...e,hp:e.hp+(e.species==='devourer'?liberationState(profile.cleared).bossHPBonus:0),max:e.hp+(e.species==='devourer'?liberationState(profile.cleared).bossHPBonus:0),damage:(e.damage??(e.boss?3:2))+(e.species==='devourer'?liberationState(profile.cleared).bossDamageBonus:0),id:i})),item:m.item?{...m.item,picked:false}:null,carrier:null,done:false,logs:[]};
 for(const d of Object.values(game.dogs)){d.stillRounds=0;d.anchor={x:d.x,y:d.y};d.movedThisRound=false}game.comboUsed=false;game.pincerUsed=false;
 overlayView='forecast';mode='move';hover=null;cancelPresentation();Sfx.stop();Object.assign(game,beginPlayerRound(game.dogs,false));game.roundFirst=game.phase;
 game.resolvedEnemyIds=[];game.enemyPlans=planBattle();
 note('探索開始。');render();
}

function battleWalkable(x,y){return inB(x,y)&&!game.m.terrain?.lowWalls.some(p=>p.x===x&&p.y===y)}
function planBattle(){return planEnemies(game.enemies,[...Object.values(game.dogs),...(game.m.beacon?[{...game.m.beacon,hp:game.beaconHP}]:[])],brightness(),game.blocks,W,H,game.round,battleWalkable,game.m.terrain)}
function assessBattle(plan,e,occupancy){return assessPlan(plan,e,brightness(),game.blocks,occupancy,game.m.terrain)}
function terrainEdge(from,to){return terrainStep(game.m.terrain,from,to)}
function checkActivity(){if(game.done||!game.m.extra)return;const result=activityOutcome(game.m,game.dogs,brightness(),game.round,game.beaconHP);if(result==='success')win(game.m.mode==='puzzle'?'光印と影印を調律した':'灯台核を守り切った');if(result==='failure')finishResult(false,game.beaconHP<=0?'灯台核が破壊された':Object.values(game.dogs).every(d=>d.hp<=0)?'二匹とも戦闘不能':'制限ラウンド超過')}
function addWave(enemies,replace=false){const incoming=placeWave(enemies,[...Object.values(game.dogs).filter(d=>d.hp>0),...(replace?[]:game.enemies.filter(e=>e.hp>0)),...(game.m.beacon?[game.m.beacon]:[])],(x,y)=>!inB(x,y)||blocked(x,y)||game.m.terrain?.lowWalls.some(p=>p.x===x&&p.y===y));let id=Math.max(-1,...game.enemies.map(e=>e.id))+1;const additions=incoming.map(e=>({...e,id:id++,max:e.hp}));game.enemies=replace?additions:[...game.enemies,...additions];recordEncounter(profile.expansion,additions);save()}
function resolveCombat(reason){if(game.m.mode==='endless'&&game.enemies.every(e=>e.hp<=0)){game.pendingEndless=true;return;}if(game.phases&&game.stage<2&&game.enemies.every(e=>e.hp<=0)){game.pendingStage=true;return}if(!combatActivityAllowed(game.m)||!combatObjectiveComplete(game.m.goal,game.enemies))return;if(game.m.waves?.[game.wave]){game.pendingWave=true;return}win(reason)}
function advanceQuestStage(){
 game.pendingStage=false;game.stage++;game.m={...game.source,goal:game.stage===2?game.source.goal:'hunt',item:game.stage===2?game.source.item:undefined};
 game.item=game.m.item?{...game.m.item,picked:false}:null;game.carrier=null;addWave(game.phases[game.stage],true);
 game.round++;game.effects=game.effects.filter(e=>e.expires>=game.round);game.resolvedEnemyIds=[];for(const d of Object.values(game.dogs)){if(d.hp>0)d.hp=Math.min(d.max,d.hp+Math.ceil(d.max*.2));d.guarding=false;}
 Object.assign(game,beginPlayerRound(game.dogs,false));game.roundFirst=game.phase;game.comboUsed=false;game.pincerUsed=false;game.step='move';mode='move';game.enemyPlans=planBattle();note('第'+(game.stage+1)+'/3段階 · '+stageLabel(game.stage));startQuestIntro();
}
function advanceEndless(){game.pendingEndless=false;game.endlessCleared=game.wave+1;recordEndlessBest(profile.expansion,game.endlessCleared);game.wave++;game.blocks=game.blocks.filter(b=>!b.created);game.blockSource=null;addWave(endlessWave(game.wave+1),true);game.round++;game.resolvedEnemyIds=[];for(const d of Object.values(game.dogs))d.guarding=false;Object.assign(game,beginPlayerRound(game.dogs,false));game.roundFirst=game.phase;game.comboUsed=false;game.pincerUsed=false;game.step='move';mode='move';game.effects=game.effects.filter(e=>e.expires>=game.round);retreat(brightness());game.enemyPlans=planBattle();note('フェーズ '+(game.wave+1)+' · 突破 '+game.endlessCleared);startQuestIntro();}
function hitEnemy(enemy,damage,contributors=[game.hounds[game.phase]]){const before=enemy.hp;enemy.hp=Math.max(0,before-damage);const gain=recordHoundDefeat(game.houndCombat,before,enemy.hp,contributors,game.awakenings?.reaper??0);if(gain)note('追猟：攻撃 +'+gain+'（累計 +'+game.houndCombat.kills.reaper+'）');}
function useRally(){if(game.done||busy()||game.step!=='skill'||game.charge<2||!houndSpecials(game.hounds[game.phase]).some(s=>s.id==='rally'))return;const kind=game.phase,d=active();playClip('guard',750,{actor:kind,to:{...d},skillName:'誓灯の咆哮'},()=>{game.charge-=2;castRally(game.houndCombat,game.round,game.awakenings?.herald??0);for(const ally of Object.values(game.dogs).filter(d=>d.hp>0))emit('guard',ally.x,ally.y,{color:'#cfe4a4',duration:900});note('誓灯の咆哮：二匹の攻撃・防御を強化。');},afterPlayerAction);}
function advanceWave(){game.pendingWave=false;addWave(game.m.waves[game.wave],true);game.wave++;game.round++;game.resolvedEnemyIds=[];for(const d of Object.values(game.dogs))d.guarding=false;Object.assign(game,beginPlayerRound(game.dogs,false));game.roundFirst=game.phase;game.comboUsed=false;game.pincerUsed=false;game.step='move';mode='move';game.enemyPlans=planBattle();note('第'+(game.wave+1)+'波。HPとチャージを引き継いで続行。')}
function note(s){game.logs.unshift('第'+game.round+'ターン · '+s);game.logs=game.logs.slice(0,24)}
function blocked(x,y){return game.blocks.some(b=>b.x===x&&b.y===y)}
function lineClear(a,b){let x=a.x,y=a.y,dx=Math.abs(b.x-x),dy=Math.abs(b.y-y),sx=x<b.x?1:-1,sy=y<b.y?1:-1,err=dx-dy;while(x!==b.x||y!==b.y){let e=2*err;if(e>-dy){err-=dy;x+=sx}if(e<dx){err+=dx;y+=sy}if(x===b.x&&y===b.y)break;if(blocked(x,y))return false}return true}
function brightness(){let field=Array.from({length:H},()=>Array(W).fill(0));let pulse=game.m.pulse&&game.round%2===0?.75:1;let sources=[...fixed.map(p=>({...p,r:p.r*pulse})),{...game.lamp,r:(game.m.lampRadius??4)*pulse}];for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 let v=environmentalBrightness(game.m.climate,{x,y},game.blocks);for(const s of sources){let d=Math.hypot(x-s.x,y-s.y)*4/climateRadius(game.m.climate,s.r);if(d>4||!lineClear(s,{x,y})||!terrainSight(game.m.terrain,s,{x,y},true))continue;v=Math.max(v,d<.8?4:d<1.8?3:d<2.8?2:d<3.8?1:0)}field[y][x]=v;
 }for(const e of game.effects)for(const c of e.cells)if(inB(c.x,c.y))field[c.y][c.x]=e.value;
 return field}
function active(){return game.dogs[game.phase]}
function occupied(x,y,ignore){return (game.m.beacon?.x===x&&game.m.beacon?.y===y)||Object.values(game.dogs).some(d=>d!==ignore&&d.hp>0&&d.x===x&&d.y===y)||game.enemies.some(e=>e.hp>0&&e.x===x&&e.y===y)}
function reach(d,field){return movementRange(game.phase,d,field,statsFor(game.phase,field,d).move,(x,y)=>!inB(x,y)||blocked(x,y)||game.m.terrain?.lowWalls.some(p=>p.x===x&&p.y===y)||occupied(x,y,d),terrainEdge)}
function actionDefs(){if(!active()||game.done)return [];if(game.step==='move')return [['move',game.phase==='light'?'移動先を選ぶ':'影を駆ける','移動力 '+statsFor(game.phase).move,'↗']];const flank=coordinatedTarget(game.dogs,game.enemies);return [['attack',flank?'双牙の交差':game.phase==='light'?'噛みつく':'影の一撃',flank?'挟撃対象へ二匹で攻撃':'隣接する敵に攻撃','牙'],...houndSpecials(game.hounds[game.phase]).map(s=>[s.id,s.id==='block'&&game.blockSource?'遮蔽物の移動先':s.name,s.description,s.icon]),['combo','双極の奔流','二匹が一直線／チャージ3','絆']];}
function shiftingBlocks(target){return [...game.blocks.filter(b=>b!==game.blockSource),{...target}];}
function basicDamage(target,field){if(coordinatedTarget(game.dogs,[target]))return pincerAttacks(statsFor('light',field).attack,statsFor('shadow',field).attack).reduce((sum,n)=>sum+attackDamage(n,target,field[target.y][target.x]),0);return attackDamage(statsFor(game.phase,field).attack+highGroundBonus(game.m.terrain,active(),target),target,field[target.y][target.x]);}

function valid(x,y,field){let d=active();if(!d||d.hp<=0||!inB(x,y)||game.m.ban?.includes(mode)||game.m.terrain?.lowWalls.some(p=>p.x===x&&p.y===y))return false;let range=reach(d,field),e=game.enemies.find(a=>a.hp>0&&a.x===x&&a.y===y);if(game.step==='move'&&mode!=='move'||game.step==='skill'&&mode==='move')return false;
 if(mode==='move')return range[y][x]<Infinity;
 if(isHoundAttackSkill(mode))return game.charge>=houndAttackSkills[mode].cost&&houndSpecials(game.hounds[kindOfActive()]).some(s=>s.id===mode)&&skillCells(mode,{x,y}).some(p=>game.enemies.some(e=>e.hp>0&&e.x===p.x&&e.y===p.y));
 if(mode==='attack')return (!!e||blocked(x,y))&&dist(d,{x,y})===1&&(game.phase==='light'||field[y][x]<4);
 if(mode==='lamp')return dist(d,{x,y})<=3&&!blocked(x,y)&&!occupied(x,y,d);
 if(mode==='block'&&game.blockSource)return game.charge>=2&&canShiftObstacle(d,game.blockSource,{x,y},{contains:p=>inB(p.x,p.y),free:p=>!blocked(p.x,p.y)&&!occupied(p.x,p.y,d)&&!game.m.terrain?.lowWalls.some(w=>w.x===p.x&&w.y===p.y)&&!(game.m.beacon?.x===p.x&&game.m.beacon?.y===p.y)&&!(game.item&&!game.item.picked&&game.item.x===p.x&&game.item.y===p.y)});
 if(mode==='block'&&blocked(x,y))return game.charge>=2&&dist(d,{x,y})<=3;
 if(mode==='block')return !(game.m.beacon?.x===x&&game.m.beacon?.y===y)&&game.charge>=2&&dist(d,{x,y})<=3&&dist(d,{x,y})>0&&!blocked(x,y)&&!occupied(x,y,d)&&!(game.item&&!game.item.picked&&game.item.x===x&&game.item.y===y);
 if(mode==='beam'||mode==='veil')return game.charge>=2&&dist(d,{x,y})>0&&dist(d,{x,y})<=4&&(x===d.x||y===d.y);return false}
function kindOfActive(){return game.phase==='shadow'?'shadow':'light'}
function skillCells(id,target){return attackSkillCells(id,active(),target,{contains:(x,y)=>inB(x,y)&&!(game.phase==='shadow'&&brightness()[y][x]===4),blocked:(x,y)=>blocked(x,y)||game.m.terrain?.lowWalls.some(p=>p.x===x&&p.y===y),sight:(a,b)=>terrainSight(game.m.terrain,a,b)});}
function cellsTo(d,x,y){return lineSkillCells(d,{x,y},W,H,inB)}
// Presentation is driven by the same frame clock as rendering. A clip owns input
// until its impact and recovery have finished; state changes happen exactly once.
let introUntil=0;
let clip=null,transients=[],facing={light:0,shadow:0},pendingResult=false;
let reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01=n=>Math.max(0,Math.min(1,n)),smooth=n=>n*n*(3-2*n);
const names={nightfall:'夜蝕',solarFlare:'白灼',pincer:'双牙の交差',displace:'転位',illuminate:'照明術',darken:'暗幕',combo:'双極の奔流',bind:'影縛り',warp:'跳影',summon:'幻影召喚',move:'移動',attack:'噛みつく',shadowAttack:'影の一撃',lamp:'灯火を移す',beam:'光の直線',veil:'影の帯',block:'遮蔽物を召喚',guard:'防御',enemyMove:'敵の移動',enemyRay:'灯射兵の射撃',enemyAttack:'敵の攻撃'};
function busy(){return performance.now()<introUntil||!!clip||(!game?.done&&game?.phase==='enemy')}
function progress(c=clip,now=performance.now()){return c?clamp01((now-c.start)/c.duration):0}
function emit(type,x,y,options={}){transients.push({type,x,y,start:performance.now(),duration:700,...options});if(transients.length>100)transients.splice(0,transients.length-100)}
function playClip(type,duration,options={},impact=()=>{},end=()=>{}){
 if(clip)return false;
 clip={type,duration:duration*(reducedMotion?.55:1),start:performance.now(),impactAt:.42,impacted:false,impact,end,...options};hover=null;Sfx.action(type,options.actor,options.from?.x??game.dogs[options.actor]?.x??7);
 render();return true;
}
function startQuestIntro(){
 const el=$('questIntro');$('questIntroName').textContent=game.m.name;$('questIntroType').textContent=game.m.type+(game.m.mode==='endless'?' · フェーズ '+(game.wave+1):game.phases?' · '+(game.stage+1)+'/3 '+stageLabel(game.stage):'');
 el.classList.remove('hidden','playing');void el.offsetWidth;el.style.setProperty('--intro-duration',reducedMotion?'700ms':'1800ms');el.classList.add('playing');introUntil=performance.now()+(reducedMotion?700:1800);render();
}
function tickAnimation(now){
 if(introUntil&&now>=introUntil){introUntil=0;$('questIntro').classList.add('hidden');render()}

 transients=transients.filter(e=>now-e.start<e.duration);
 let c=clip;if(!c)return;
 let q=progress(c,now);
 if(c.path){let pose=samplePath(c.path,q);facing[c.actor]=pose.yaw;let step=Math.floor(q*(c.path.length-1)*3);if(step!==(c.footstep??-1)&&q<1){c.footstep=step;Sfx.step(c.actor,pose.x);emit(c.actor==='shadow'?'smoke':'dust',pose.x,pose.y,{duration:450,color:c.actor==='shadow'?'#a97eff':'#f9dca2'})}}
 if(!c.impacted&&q>=c.impactAt){c.impacted=true;c.impact();render()}
 if(clip===c&&q>=1){clip=null;c.end();if(pendingResult&&!clip){pendingResult=false;view='result'}render()}
}
function cancelPresentation(){introUntil=0;$('questIntro').classList.add('hidden');clip=null;transients=[];pendingResult=false;facing={light:0,shadow:0};canvas.style.transform='';fx.style.transform=''}
function samplePath(path,q){let v=smooth(q)*(path.length-1),i=Math.min(path.length-2,Math.floor(v)),u=v-i,a=path[Math.max(0,i)],b=path[Math.max(1,i+1)];return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,yaw:Math.atan2(b.y-a.y,b.x-a.x),distance:v}}
function routeTo(x,y){const f=brightness();return movementPath(game.phase,active(),{x,y},f,reach(active(),f),terrainEdge)}
function poseFor(key,d,now=performance.now()){
 let p={x:d.x,z:d.y,y:0,yaw:facing[key]??(key.startsWith('enemy-')?Math.PI:0),gait:0,walk:0,pitch:0,flash:0,alpha:1};
 if(clip?.type==='pincer'&&['light','shadow'].includes(key)){const q=progress(clip,now),dx=clip.to.x-d.x,dz=clip.to.y-d.y,l=Math.hypot(dx,dz)||1,u=Math.sin(q*Math.PI)*.32;p.x+=dx/l*u;p.z+=dz/l*u;p.yaw=Math.atan2(dz,dx);p.jaw=Math.sin(q*Math.PI);}
 if(clip&&clip.actor===key&&clip.type!=='pincer'){let q=progress(clip,now),a=clip;
  if(a.path){let s=samplePath(a.path,q);p.x=s.x;p.z=s.y;p.yaw=s.yaw;p.gait=s.distance*Math.PI*3;p.walk=1;p.y=Math.abs(Math.sin(p.gait))*.025}
  else if(a.to){let dx=a.to.x-d.x,dz=a.to.y-d.y,l=Math.hypot(dx,dz)||1;p.yaw=Math.atan2(dz,dx);
   if(a.type==='attack'||a.type==='shadowAttack'||a.type==='enemyAttack'){
    let lunge=q<.24?-.09*smooth(q/.24):q<.44?-.09+.43*smooth((q-.24)/.20):.34*(1-smooth((q-.44)/.56));p.x+=dx/l*lunge;p.z+=dz/l*lunge;p.y=Math.sin(q*Math.PI)*.055;p.pitch=-Math.sin(q*Math.PI)*.13;p.jaw=Math.sin(q*Math.PI);
   }else{p.pitch=Math.sin(q*Math.PI)*.10;p.y=-Math.sin(q*Math.PI)*.025}
  }
 }
 for(let e of transients)if(e.target===key){let q=clamp01((now-e.start)/e.duration);
  if(e.type==='hit'){let recoil=Math.sin(q*Math.PI*2)*Math.exp(-q*4)*.13;p.x+=(e.dx??0)*recoil;p.z+=(e.dy??0)*recoil;p.flash=Math.max(p.flash,Math.max(0,1-q*3)*.8)}
  if(e.type==='defeat'){p.alpha=1-q;p.y=-q*.35;p.pitch=q*.8}
 }
 return p;
}
function damageFx(target,actor,damage,color='#ffd38a'){Sfx.play(damage>0?'hit':'guard',target.x);if(target.hp<=0)Sfx.play('defeat',target.x);
 let dx=target.x-actor.x,dy=target.y-actor.y,l=Math.hypot(dx,dy)||1;
 let key=Object.entries(game.dogs).find(([,d])=>d===target)?.[0]??'enemy-'+target.id;
 emit('hit',target.x,target.y,{target:key,dx:dx/l,dy:dy/l,damage,color,duration:720});
 if(target.hp<=0)emit('defeat',target.x,target.y,{target:key,duration:650,color});
}
function afterPlayerAction(){if(game.pendingEndless){advanceEndless();return;}if(game.pendingStage){advanceQuestStage();return}if(game.pendingWave){advanceWave();return}checkActivity();checkExtraction();if(!game.done)nextPhase()}
function skipMovement(){game.orderLocked=true;game.step='skill';mode='attack';note('移動を省略。');hover=null;render()}
function use(x,y){
 if(game.done||busy())return;
 let f=brightness(),d=active(),kind=game.phase,chosen=mode;
 if(!valid(x,y,f)){Sfx.play('invalid');note('その場所には行動できません。');render();return}
 game.orderLocked=true;
 if(chosen==='block'&&!game.blockSource&&blocked(x,y)){game.blockSource=game.blocks.find(b=>b.x===x&&b.y===y);hover=null;render();return;}
 if(chosen==='attack'){const target=game.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);if(target&&coordinatedTarget(game.dogs,[target])){usePincer(target);return;}}
 if(isHoundAttackSkill(chosen)){useAttackSkill(chosen,{x,y});return;}
 if(chosen==='move'){
  if(x===d.x&&y===d.y){skipMovement();Sfx.play('ui');return;}
  let path=routeTo(x,y);if(path.length<2)return;
  playClip('move',Math.min(1000,220+180*(path.length-1)),{actor:kind,path,impactAt:1},()=>{d.x=x;d.y=y;d.movedThisRound=true;d.stillRounds=0;interact();checkActivity();if(!game.done){game.step='skill';mode='attack';note((kind==='light'?'光':'影')+'の猟犬が移動した。')}emit('land',x,y,{color:kind==='light'?'#ffdb93':'#ae80ff',duration:400})});return;
 }
 let to={x,y};facing[kind]=Math.atan2(y-d.y,x-d.x);
 let type=chosen==='attack'&&kind==='shadow'?'shadowAttack':chosen;
 let cells=(chosen==='beam'||chosen==='veil')?cellsTo(d,x,y):[];
 let oldLamp={...game.lamp};
 emit('cast',d.x,d.y,{color:kind==='light'?'#ffe0a2':'#b488ff',duration:650});
 playClip(type,chosen==='attack'?670:chosen==='lamp'?920:1000,{actor:kind,from:{x:d.x,y:d.y},to,cells,oldLamp,impactAt:chosen==='attack'?.43:.60},()=>{
  if(chosen==='attack'){
   const wall=game.blocks.find(b=>b.x===x&&b.y===y);
   if(wall){const hit=strikeObstacle(wall,statsFor(kind,f).attack);wall.hp=hit.hp;Sfx.play(hit.destroyed?'block':'hit',x);emit('slash',x,y,{color:'#e5bf8d',duration:450});emit('cancel',x,y,{text:hit.destroyed?'破壊':'耐久 '+wall.hp+'/'+wall.max,color:'#f2cb9d',duration:850});if(hit.destroyed){game.blocks=game.blocks.filter(b=>b!==wall);emit('smoke',x,y,{color:'#d8bd94',duration:850});retreat(brightness());}note(hit.destroyed?'遮蔽物を破壊した。':'遮蔽物の耐久 '+wall.hp+'/'+wall.max);return;}
   let e=game.enemies.find(a=>a.hp>0&&a.x===x&&a.y===y),damage=basicDamage(e,f);
   hitEnemy(e,damage);damageFx(e,d,damage,kind==='light'?'#ffe0a2':'#c49aff');emit('slash',x,y,{from:{x:d.x,y:d.y},color:kind==='light'?'#fff0ba':'#d7b7ff',duration:340});note(enemyName(e)+'へ'+damage+'ダメージ。'+(enemyArmor(e,f[y][x])?'暗闇の鎧で2軽減。照らすと防御が崩れます。':''));if(!e.hp)note('敵を倒した。');
   resolveCombat(game.m.goal==='boss'?'ボスを倒した':'敵をすべて倒した');
  }
  if(chosen==='lamp'){Sfx.play('lamp',x);game.lamp={x,y};emit('lightBurst',x,y,{duration:900,color:'#ffe4a2'});note('携帯光源を移した。明るさが変化した。');retreat(brightness())}
  if(chosen==='block'){Sfx.play('block',x);if(game.blockSource){game.blockSource.x=x;game.blockSource.y=y;game.blockSource=null;}else game.blocks.push(createObstacle(x,y,true));game.charge-=2;emit('smoke',x,y,{duration:900,color:'#bb8bff',count:24});note('遮蔽物を操り、新たな影を作った。');retreat(brightness())}
  if(chosen==='beam'||chosen==='veil'){
   let light=chosen==='beam';Sfx.play(chosen,x);game.effects.push({cells,value:light?4:0,expires:game.round+1});game.charge-=2;
   cells.forEach((p,i)=>emit(light?'lightBurst':'smoke',p.x,p.y,{duration:850,color:light?'#ffeab6':'#ae7cff',delay:i*45}));note(light?'光の直線を放った。':'濃い影の帯を作った。');retreat(brightness());
  }
 },afterPlayerAction);
}
function useAttackSkill(id,target){
 const kind=game.phase,d=active(),skill=houndAttackSkills[id],cells=skillCells(id,target),field=brightness();
 if(game.charge<skill.cost||!cells.length)return;
 playClip(kind==='shadow'?'shadowAttack':'attack',850,{actor:kind,skillName:skill.name,from:{x:d.x,y:d.y},to:target,cells,impactAt:.5},()=>{
  game.charge-=skill.cost;let hits=0;const attack=statsFor(kind,field).attack;
  for(const p of cells){emit(id==='burst'?'lightBurst':'slash',p.x,p.y,{color:kind==='light'?'#ffd49b':'#bd9dff',duration:650});
   const enemy=game.enemies.find(e=>e.hp>0&&e.x===p.x&&e.y===p.y);if(!enemy)continue;
   const damage=attackDamage(attackSkillPower(id,attack,highGroundBonus(game.m.terrain,d,enemy)),enemy,field[p.y][p.x]);hitEnemy(enemy,damage);damageFx(enemy,d,damage);if(damage>0)hits++;
  }
  if(hits&&skill.heal){const healed=attackSkillHealing(id,hits,d.hp,d.max);d.hp+=healed;if(healed)emit('cancel',d.x,d.y,{text:'HP +'+healed,color:'#9df0bb'});}
  note(skill.name+'を放った。');resolveCombat(game.m.goal==='boss'?'ボスを倒した':'敵をすべて倒した');
 },afterPlayerAction);
}
function useCombo(){
 if(game.done||busy()||game.step!=='skill'||!comboState(game.dogs,game.blocks,game.charge,game.comboUsed).ready)return;
 const kind=game.phase,d=active(),cells=comboCells(game.dogs,game.blocks,W,H),damage=comboDamage(statsFor('light').attack,statsFor('shadow').attack);
 playClip('combo',1250,{actor:kind,from:{...d},cells,to:{...game.dogs[kind==='light'?'shadow':'light']},impactAt:.55},()=>{
  game.charge-=3;game.comboUsed=true;
  for(const p of cells)emit('lightBurst',p.x,p.y,{duration:1000,color:(p.x+p.y)%2?'#b798ff':'#ffe2a2'});
  for(const e of game.enemies.filter(e=>e.hp>0&&cells.some(p=>p.x===e.x&&p.y===e.y))){const hit=attackDamage(damage,e,brightness()[e.y][e.x]);hitEnemy(e,hit,Object.values(game.hounds));damageFx(e,d,hit,'#d3c1ff')}
  note('合体技「双極の奔流」！ 直線の敵へ基礎威力'+damage+'。');
  resolveCombat('二匹の連携で敵を倒した');
 },afterPlayerAction);
}
function usePincer(target){
 if(game.done||busy()||game.step!=='skill'||!coordinatedTarget(game.dogs,[target]))return;
 const kind=game.phase,attacks=pincerAttacks(statsFor('light').attack,statsFor('shadow').attack);
 playClip('pincer',1150,{actor:kind,to:{x:target.x,y:target.y},impactAt:.55},()=>{
  game.pincerUsed=true;
  const field=brightness(),hits=attacks.map(n=>attackDamage(n,target,field[target.y][target.x])),damage=basicDamage(target,field);
  hitEnemy(target,damage,Object.values(game.hounds));Sfx.play('beam',target.x);
  damageFx(target,active(),damage,'#ffe1af');
  for(const k of ['light','shadow'])emit(k==='light'?'lightBurst':'smoke',target.x,target.y,{duration:900,color:k==='light'?'#ffe3a5':'#b79aef'});
  note('挟撃技「双牙の交差」！ '+hits[0]+'＋'+hits[1]+'ダメージ。');
  resolveCombat('挟撃で敵を倒した');
 },afterPlayerAction);
}
function useGuard(){if(game.done||busy()||!active()||game.step!=='skill')return;let d=active(),kind=game.phase;playClip('guard',650,{actor:kind,to:{x:d.x+Math.cos(facing[kind]??0),y:d.y+Math.sin(facing[kind]??0)}},()=>{d.guarding=true;emit('guard',d.x,d.y,{duration:900,color:kind==='light'?'#9dd8ff':'#c8a7ff'});note((kind==='light'?'光':'影')+'の猟犬は防御した。')},afterPlayerAction)}
function damageDog(t,damageBase,actor,evadable=true){
 let f=brightness(),kind=t===game.dogs.light?'light':'shadow',s=statsFor(kind,f);
 if(evadable&&s.evade>0&&Math.random()<s.evade){Sfx.play('miss',t.x);emit('miss',t.x,t.y,{color:'#c4a2ff',duration:750});note('敵の攻撃を回避した。')}
 else{let damage=Math.max(0,damageBase-s.armor-(t.guarding?1:0));t.hp=Math.max(0,t.hp-damage);damageFx(t,actor,damage,'#ffa19d');if(t.guarding)emit('guard',t.x,t.y,{duration:550,color:'#a8e4ff'});note((kind==='light'?'光':'影')+'の猟犬が'+damage+'ダメージを受けた。')}
 if(game.carrier&&game.dogs[game.carrier].hp===0){let dropped=game.dogs[game.carrier];game.item.x=dropped.x;game.item.y=dropped.y;game.item.picked=false;game.carrier=null;note('運び手が倒れ、対象がその場に残った。')}
 if(game.dogs.light.hp===0&&game.dogs.shadow.hp===0)lose();
}
function enemyTurn(){if(game.done)return;let order=game.enemyPlans;
 function act(i){
  if(game.done)return;if(i>=order.length){finishEnemyRound();return}
  let plan=order[i],e=game.enemies.find(e=>e.id===plan.enemyId);if(!e||e.hp<=0){act(i+1);return}
  let doneAct=()=>{game.resolvedEnemyIds.push(e.id);act(i+1)},assessment=assessBattle(plan,e,(x,y)=>occupied(x,y,e)),key='enemy-'+e.id;
  if(assessment.status!=='ready'){if(['dark','blocked'].includes(assessment.status))emit('cancel',e.x,e.y,{duration:1000,color:'#9bd5dc',text:assessment.status==='dark'?'射撃中止':plan.type==='move'?'進路を遮断':'射線を遮断'});note(enemyName(e)+(assessment.status==='dark'?'は光を失い、射撃を中止。':assessment.status==='blocked'?'は遮蔽・占有で予告を実行できない。':'は待機した。'));doneAct();return}
  if(wideAttackInfo(plan.type)){
   playClip(plan.type,1250,{actor:key,from:{...plan.origin},to:{...plan.origin},cells:assessment.cells},()=>{
    const hit=assessBattle(plan,e),info=wideAttackInfo(plan.type);
    if(hit.status!=='ready')return;
    Sfx.play(plan.type==='nightfall'?'veil':'beam',e.x);
    const danger=new Set(hit.cells.map(p=>p.x+','+p.y));
    for(const dog of Object.values(game.dogs).filter(d=>d.hp>0)){
     if(danger.has(dog.x+','+dog.y))damageDog(dog,plan.damage,e,false);
     else emit('guard',dog.x,dog.y,{duration:900,color:'#9de1d0'});
    }
    note(info.name+'が広がった。封印陣・明暗の守りにいた猟犬は無傷。');
   },doneAct);return;
  }
  if(plan.type==='illuminate'||plan.type==='darken'){

   playClip(plan.type,950,{actor:key,from:{...plan.origin},to:plan.cells[0],cells:assessment.cells},()=>{
    const hit=assessBattle(plan,e),light=plan.type==='illuminate';if(hit.status!=='ready')return;
    e.nextLightRound=game.round+2;game.effects.push({cells:hit.cells,value:plannedBrightness(plan),expires:game.round+1});for(const p of hit.cells)emit(light?'lightBurst':'smoke',p.x,p.y,{color:light?'#ffe0a1':'#bca0ed',duration:900});retreat(brightness());note(enemyName(e)+(light?'が予告した場所を照らした。':'が予告した場所を闇に包んだ。'));
   },doneAct);return;
  }
  if(plan.type==='displace'){
   playClip('displace',900,{actor:key,from:{...plan.origin},to:plan.cells[0],cells:assessment.cells},()=>{
    const hit=assessBattle(plan,e,(x,y)=>occupied(x,y,e));if(hit.status!=='ready')return;
    e.nextDisplaceRound=game.round+2;
    const target=Object.values(game.dogs).find(d=>d.hp>0&&hit.cells.some(p=>p.x===d.x&&p.y===d.y));
    if(!target){note('転位師の技は空振りした。');return;}
    emit('smoke',target.x,target.y,{duration:850,color:'#92cddd'});Object.assign(target,plan.destination,{movedThisRound:true,stillRounds:0});
    emit('lightBurst',target.x,target.y,{duration:900,color:'#d1adff'});note('転位：猟犬が予告先へ移された。');
   },doneAct);return;
  }
  if(plan.type==='warp'||plan.type==='summon'){
   const q=plan.destination;playClip(plan.type,800,{actor:key,from:{x:e.x,y:e.y},to:q},()=>{
    const hit=assessBattle(plan,e,(x,y)=>occupied(x,y,e));if(hit.status!=='ready')return;
    emit('smoke',e.x,e.y,{duration:650,color:'#9b87ed'});emit('lightBurst',q.x,q.y,{duration:900,color:'#abccff'});
    if(plan.type==='warp'){e.x=q.x;e.y=q.y;note(enemyName(e)+'が予告先へ跳躍した。')}
    else {game.enemies.push({x:q.x,y:q.y,id:Math.max(...game.enemies.map(a=>a.id))+1,hp:1,max:1,kind:'decoy'});note('幻灯師が囮を生成した。HP1・攻撃なし。討伐対象にも含まれます。')}
   },doneAct);return;
  }
  if(plan.type==='bind'){
   playClip('bind',850,{actor:key,from:{...plan.origin},to:plan.cells[0],cells:assessment.cells},()=>{
    const hit=assessBattle(plan,e);if(hit.status!=='ready')return;
    for(const d of Object.values(game.dogs).filter(d=>d.hp>0&&hit.cells.some(p=>p.x===d.x&&p.y===d.y))){d.stunned=true;emit('guard',d.x,d.y,{duration:1200,color:'#ed91dc'});note('影縛り：次の1手番は行動不能。予告マスから退くか遮蔽物で防げます。')}
   },doneAct);return;
  }
  if(plan.type==='move'){
   let q=plan.destination;playClip('enemyMove',430,{actor:key,path:[{x:e.x,y:e.y},q],impactAt:1},()=>{if(!blocked(q.x,q.y)&&!occupied(q.x,q.y,e)){e.x=q.x;e.y=q.y}},doneAct);return;
  }
  let to=plan.cells.at(-1)??plan.origin;
  playClip(plan.type==='ray'?'enemyRay':'enemyAttack',plan.type==='ray'?850:700,{actor:key,from:{...plan.origin},to:{...to},cells:assessment.cells},()=>{
   let hit=assessBattle(plan,e);
   if(hit.status!=='ready')return;
   if(plan.type==='ray'&&hit.cells.length<plan.cells.length){let wall=plan.cells[hit.cells.length];emit('cancel',wall.x,wall.y,{duration:1000,color:'#9bd5dc',text:'射線を遮断'})}
   if(plan.type==='ray')hit.cells.forEach((p,j)=>emit('lightBurst',p.x,p.y,{duration:400,color:'#ff8061',delay:j*30}));
   if(game.m.beacon&&hit.cells.some(p=>p.x===game.m.beacon.x&&p.y===game.m.beacon.y)){game.beaconHP=Math.max(0,game.beaconHP-plan.damage);note('灯台核の耐久 '+game.beaconHP+'/'+game.m.beacon.hp);checkActivity();}
   const targets=Object.values(game.dogs).filter(d=>d.hp>0&&hit.cells.some(p=>p.x===d.x&&p.y===d.y));
   if(!targets.length)note(enemyName(e)+'の攻撃は予告したマスを通り、空振りした。');
   for(const t of targets){if(game.done)break;damageDog(t,plan.damage,e)}
  },doneAct);
 }act(0);
}
function finishEnemyRound(){
 for(let d of Object.values(game.dogs)){d.guarding=false;Object.assign(d,settlePosition(d))}game.comboUsed=false;game.pincerUsed=false;
 game.step='move';game.round++;game.charge=Math.min(game.m.chargeCap??3,game.charge+1);game.effects=game.effects.filter(e=>e.expires>=game.round);retreat(brightness());
 checkActivity();if(game.done)return;if(game.m.mode==='defense'){const wave=reinforcementWave(game.round);if(wave.length){addWave(wave);note('敵の増援が出現した。')}}
 Object.assign(game,beginPlayerRound(game.dogs,game.skipShadow));for(const [kind,d] of Object.entries(game.dogs)){if(d.stunned)note(companionName(kind)+'は影縛りでこの手番を休みます。');d.incapacitated=!!d.stunned;d.stunned=false}game.roundFirst=game.phase;
 game.resolvedEnemyIds=[];game.enemyPlans=planBattle();
 if(game.phase==='enemy'){enemyTurn();return}
 Sfx.play('turn');note('敵の行動が終了。新しい予告を確認し、先に動く相棒を選べます。');emit('turn',6.5,3.5,{text:'行動順を選択',duration:700});
}
function renderMotionUI(){let locked=busy();$('hazardNotice').classList.toggle('hazard-casting',!!clip);$('pass').disabled=locked||game.done;
 $('restart').disabled=locked||game.done;
 for(let b of document.querySelectorAll('#actions button, #attackTargets button, #evacuationTargets button'))b.disabled=b.disabled||locked;
 $('actionCue').classList.remove('hidden');$('actionCue').classList.toggle('cue-visible',!!clip);$('actionCue').setAttribute('aria-hidden',String(!clip));if(clip)$('actionCue').textContent=(clip.actor==='light'?'✦ 光の猟犬':clip.actor==='shadow'?'◈ 影の猟犬':'敵')+' · '+(clip.skillName??names[clip.type]??'行動中');
 $('extract').disabled=locked||game.done||!extraction().available;
 canvas.style.cursor=locked?'wait':'crosshair';
}

function retreat(field){let d=game.dogs.shadow;if(d.hp<=0||field[d.y][d.x]<4)return;const target=shadowRetreatTarget(d,game.dogs.light,field,(x,y)=>!battleWalkable(x,y)||blocked(x,y),(x,y)=>occupied(x,y,d));if(target){emit('smoke',d.x,d.y,{color:'#ae7cff',duration:700,count:22});d.x=target.x;d.y=target.y;d.movedThisRound=true;d.stillRounds=0;emit('smoke',d.x,d.y,{color:'#ae7cff',duration:700,count:22});note('影の猟犬は強い光から退避した。次の行動を失います。')}else note('影の猟犬は影がなく、光のそばで待機中。');game.skipShadow=true}
function extraction(){return extractionState(game.m.goal,!!game.item?.picked,game.carrier?game.dogs[game.carrier].hp:0,game.enemies)}
function checkExtraction(){if(!game.done&&extraction().automatic)win(game.m.goal==='rescue'?'安全を確保し、灯守と帰還した':'物資を確保し、その場から帰還した')}
function extractNow(){if(game.done||busy()||!extraction().available)return;emit('lightBurst',game.dogs[game.carrier].x,game.dogs[game.carrier].y,{color:'#a8f2db',duration:650});win('物資を確保し、その場から帰還した');render();fitGameViewport()}
function interact(){let m=game.m,d=active(),i=game.item;if(!i||!d||d.hp<=0)return;
 if(!i.picked&&d.x===i.x&&d.y===i.y){i.picked=true;game.carrier=game.phase;Sfx.play('pickup',d.x);if(m.goal==='rescue'){note('灯守を発見。帰還地点まで護衛します。')}else{note('灯芯を確保。この場から帰還できます。')}}
 checkExtraction();if(game.done)return;
 if(i.picked&&game.carrier===game.phase&&d.x<=1){win(m.goal==='rescue'?'救助成功':'灯芯を持ち帰った')}
}
function nextPhase(){if(game.done)return;game.blockSource=null;mode='move';game.step='move';hover=null;
 Object.assign(game,advancePlayerTurn(game.phase,game.acted,game.dogs,game.skipShadow));
 if(game.phase==='enemy')enemyTurn();
}
function reward(){if(game.m.practice)return {xp:0,amount:0,unlocked:[],before:structuredClone(profile),after:structuredClone(profile)};let before=structuredClone(profile);if(game.m.extra){const added=grantExpansionReward(profile.expansion,game.m.id,true);const stones=game.m.fixed?0:rosterQuestReward(profile.roster,game.m.id,added.first,game.m.mode==='farm');recordRelics(profile.expansion,profile.cleared);save();return {xp:0,amount:0,material:'crystal',unlocked:[],shards:added.shards,stones,before,after:structuredClone(profile)}}let oldStep=storyStep(),first=!profile.cleared.includes(game.m.id),xp=game.m.xp??2;
 grantHoundXP(profile,Object.values(game.hounds),xp);
 Object.assign(profile,grantRankXP(profile.user,profile.uxp,1));let material=game.m.material,amount=materialReward(game.m.firstReward,first);profile.materials[material]+=amount;profile.wins++;if(first)profile.cleared.push(game.m.id);let unlocked=profile.legacyAccess?[]:story.acts.slice(oldStep,storyStep()).map(a=>a.unlock).filter(Boolean);const added=grantExpansionReward(profile.expansion,game.m.id);const stones=rosterQuestReward(profile.roster,game.m.id,first);recordRelics(profile.expansion,profile.cleared);save();return {xp,material,amount,unlocked,shards:added.shards,stones,before,after:structuredClone(profile)}}
function finishResult(success,reason){if(game.done)return;game.done=true;game.result=success?'success':'failure';game.resultReason=reason;game.rewards=success?reward():{xp:0,amount:0,before:structuredClone(profile),after:structuredClone(profile)};note(success?reason+(game.m.practice?'！ 演習を終了しました。':'！ 経験値と素材を獲得した。'):reason+'。報酬はありません。');if(clip)pendingResult=true;else view='result';mode='move';hover=null;game.resultFocusPending=true}
function win(text){finishResult(true,text)}function lose(){finishResult(false,'二匹とも戦闘不能')}
function syncViews(){document.body.classList.toggle('reduce-motion',reducedMotion);document.body.classList.toggle('in-battle',view==='battle');document.querySelector('.location-label').textContent=view==='battle'?'探索中 · '+game.m.name:'宵待ちの砦';$('titleView').classList.toggle('hidden',view!=='title');$('gameShell').classList.toggle('hidden',view==='title');for(let name of ['home','battle','base','result'])$(name+'View').classList.toggle('hidden',view!==name);Sfx.music((view==='result'||view==='battle')&&game.done&&game.result==='success'?'victory':view==='battle'&&!game.done?'battle':'home')}
function setView(v){if(busy()||questActive()&&v!=='battle'||v==='battle'&&!game.started)return;view=v;render();fitGameViewport()}
function renderHome(){
 let step=storyStep(),complete=step===campaignQuests.length,m=campaignQuests[Math.min(step,campaignQuests.length-1)],area=campaignAreas[m.area];
 $('homeChapter').textContent='第'+String(m.area+1)+'章';$('homeCompletion').textContent=campaignQuests.filter(q=>profile.cleared.includes(q.id)).length+' / '+campaignQuests.length;$('homeStoryTitle').textContent=area.name;
 $('homeStoryCopy').textContent=step?story.acts[step-1].after:story.premise;
 $('homeAct').textContent=complete?'全エリア踏破':'次の目的地 · '+String(m.area+1)+'－'+String(step%5+1);
 $('homeStage').textContent=complete?'すべての灯が戻った':m.name;$('homeGoal').textContent=complete?'光と影が戻り、住民と城は支配から解放された。旅の記録から結末を読み返せる。':m.purpose;
 $('homeGo').textContent='クエストへ ›';
 const liberation=liberationState(profile.cleared);$('liberationProgress').innerHTML='<div class="liberation-heading"><span>要所の解放</span><span>'+liberation.released.length+' / 3</span></div><div class="liberation-nodes">'+strongholds.map(h=>'<span class="'+(profile.cleared.includes(h.id)?'released':'')+'" title="'+h.ability+'：'+h.effect+'">'+(profile.cleared.includes(h.id)?'✓':'◇')+' '+h.name+'</span>').join('')+'</div>';
 $('homeDogs').innerHTML=['light','shadow'].map(k=>{let p=profile[k];return '<button class="companion-plate" data-companion="'+k+'"><b>'+dogLabel(k)+' <span class="small">Lv.'+p.level+'</span></b><small>'+p.xp+' / '+p.level*3+' EXP'+(p.equipment?' · '+findEquipment(p.equipment).name:' · 装備なし')+'</small><span class="companion-open">相棒を見る ↗</span></button>'}).join('');
 for(let b of $('homeDogs').querySelectorAll('button'))b.onclick=()=>openCompanion(b.dataset.companion);
 $('journeyTrack').innerHTML=campaignAreas.map(a=>{let count=campaignQuests.filter(q=>q.area===a.id&&profile.cleared.includes(q.id)).length;return '<div class="journey-node '+(count===5?'complete':m.area===a.id?'current':'')+'"><i>'+a.mark+'</i><span>'+a.name+'<small>'+count+' / 5</small></span></div>'}).join('');
 const claimable=claimableRosterMissions(profile.roster);$('missionBadge').classList.toggle('hidden',!claimable);$('homeMissions').setAttribute('aria-label',claimable?'ミッション：受取可能 '+claimable+'件':'ミッション');
 drawHome();
}
function openCompanion(kind,id){
 inspectedKind=kind;previewYaw=kind==='light'?.4:1.8;$('rotateCompanion').value=String(previewYaw/(Math.PI*2)*100);
 previewCharm=id??profile[kind].equipment??'fang';
 $('companionSkills').innerHTML=renderHoundSkills(profile.roster.party[kind]);
 $('companionTitle').textContent=companionName(kind);$('companionName').value=profile.roster.names[profile.roster.party[kind]]??profile[kind].name??'';$('nameFeedback').textContent='12文字まで。空欄で元の呼び名に戻せます。';
 $('previewCharm').innerHTML=equipmentCatalog.filter(e=>compatible(e,kind)).map(e=>'<option value="'+e.id+'">'+e.name+(e.category==='特製'?' · 特製':'')+'</option>').join('');
 $('previewCharm').value=previewCharm;$('previewEquipment').checked=!!(id||profile[kind].equipment);
 updateCompanionEquipment();$('companionDialog').showModal();
 if(!companionWorld)companionWorld=new HoundWorld($('companionCanvas'));drawCompanion();
}
function updateCompanionEquipment(){
 const item=findEquipment(previewCharm),p=profile[inspectedKind],owned=p.ownedEquipment.includes(previewCharm),equipped=p.equipment===previewCharm;
 $('equipmentPreviewLabel').textContent=equipped?'装備を表示':'装備を試着（見た目のみ）';
 $('companionEquipment').innerHTML=equipmentIcon(previewCharm)+'<div><h3>'+item.name+'</h3><p>'+item.effect+'</p><p>'+(equipped?'装備中':owned?'所持済み':storyStep()<item.unlock?'未解放 · 第'+item.unlock+'節クリアで作成可能':'未作成 · 工房で作成できます')+'</p></div>';
 $('equipPreviewCharm').disabled=!owned||equipped;$('equipPreviewCharm').textContent=equipped?'装備中':!owned?'仲間で作成が必要':'この装備を着用';
}
function drawHound(renderer,mesh,x,z,kind,t,scale,dim,pose={}){
 pose={...pose,hound:renderer===world?game?.hounds?.[kind]:profile.roster.party[kind]};
 mesh.hound(x,z,kind,t,scale,dim,pose);
}
function drawCompanion(){
 if(!companionWorld)return;
 let canvas=$('companionCanvas'),r=canvas.getBoundingClientRect(),width=Math.min(1100,Math.round(r.width*1.5));
 if(canvas.width!==width||canvas.height!==Math.round(r.height*1.5)){canvas.width=width;canvas.height=Math.round(r.height*1.5)}
 companionWorld.camera([3,1.9,5],[0,.85,0],Math.max(2.7,2.5*canvas.width/canvas.height));
 if(!companionWorld.ready){let base=new MeshBuilder();base.box([0,-.13,0],[4,.23,3],[.065,.085,.105]);
 for(let i=0;i<30;i++){let a=i/30*Math.PI*2,b=(i+1)/30*Math.PI*2;base.rod([Math.cos(a)*1.2,.005,Math.sin(a)*.9],[Math.cos(b)*1.2,.005,Math.sin(b)*.9],.006,[.35,.28,.15],.4)}
 companionWorld.static(base.v,[[1,2,2],[-2,1,-1],[0,2,-3]],[]);companionWorld.ready=true;}
 let mesh=new MeshBuilder();drawHound(companionWorld,mesh,0,0,inspectedKind,performance.now()/1000,2,2,{yaw:previewYaw,sigil:profile.expansion.sockets[inspectedKind][previewCharm],equipment:$('previewEquipment').checked?previewCharm:null});companionWorld.draw(mesh.v);
}
function drawTitle(t){
 const c=$('titleScene'),r=c.getBoundingClientRect();if(!r.width||!r.height)return;
 const w=Math.min(1300,Math.round(r.width*1.25)),h=Math.max(1,Math.round(w*r.height/r.width));if(c.width!==w||c.height!==h){c.width=w;c.height=h}
 if(!titleWorld){titleWorld=new HoundWorld(c);titleWorld.sky=[.012,.019,.032];let m=new MeshBuilder();m.box([0,-.2,0],[100,.32,100],[.012,.020,.028]);for(let i=0;i<80;i++){let a=i/80*Math.PI*2,b=(i+1)/80*Math.PI*2;m.rod([Math.cos(a)*2.3,-.025,Math.sin(a)*1.55],[Math.cos(b)*2.3,-.025,Math.sin(b)*1.55],.012,[.42,.31,.16],.6)}titleWorld.static(m.v,[[-2,2,1],[2,1,-1],[0,3,-3]],[])}
 titleWorld.camera([3.2,2.5,7],[0,.85,0],Math.max(5.7,4.4*c.width/c.height));let dogs=new MeshBuilder();drawHound(titleWorld,dogs,-1.05,.6,'light',t,2.55,2,{yaw:.45});drawHound(titleWorld,dogs,1.05,-.1,'shadow',t+.8,2.55,1,{yaw:2.7});titleWorld.draw(dogs.v);
}
function drawCompanions(mesh,t){drawHound(homeWorld,mesh,-1.25,.6,'light',t,2.25,2,{yaw:.4,sigil:profile.expansion.sockets.light[profile.light.equipment],equipment:profile.light.equipment});drawHound(homeWorld,mesh,1.25,.35,'shadow',t+1,2.25,1,{yaw:2.55,sigil:profile.expansion.sockets.shadow[profile.shadow.equipment],equipment:profile.shadow.equipment})}
function drawHome(){
 let step=storyStep();homeWorld.sky=step>=5?[.075,.10,.145]:[.024,.035,.074];homeWorld.camera([3.2,3.3,7],[.1,.70,.2],6.9);
 let m=new MeshBuilder();buildKennel(m,Math.min(step,4));
 homeWorld.static(m.v,[[-2.55,.8,-.8],[2.55,.8,-.8],[.1,1.8,-2.5]],[]);
 let dogs=new MeshBuilder();drawCompanions(dogs,performance.now()/1000);homeWorld.draw(dogs.v);
}
function renderTurnOrder(){
 $('turnOrderLabel').textContent=game.done?'行動終了':game.orderLocked?(game.roundFirst==='shadow'?'影 → 光 → 敵':'光 → 影 → 敵'):'先に動く相棒';
 for(let kind of ['light','shadow']){let b=$(kind==='light'?'orderLight':'orderShadow');b.disabled=game.done||busy()||game.orderLocked||game.dogs[kind].hp<=0||game.acted.includes(kind);b.setAttribute('aria-pressed',String(game.phase===kind));b.classList.toggle('active',game.phase===kind);b.textContent=(kind==='light'?'光':'影')+(game.acted.includes(kind)?' ✓':'から');}
}
function renderEnemyPlans(){
 const override=lastScene.previewDog,blocks=lastScene.forecastBlocks;
 const dogs=Object.entries(game.dogs).map(([kind,d])=>({kind,...d,...(override?.kind===kind?{x:override.x,y:override.y}:{})}));
 const prediction=forecastEnemyPlans(game.enemyPlans,game.enemies,dogs,lastScene.f,blocks,battleWalkable,game.resolvedEnemyIds,game.m.terrain),assessments=prediction.entries;
 lastScene.assessments=assessments;
 const hazards=assessments.filter(a=>wideAttackInfo(a.plan.type)&&a.assessment.status==='ready');
 $('hazardNotice').classList.toggle('hidden',!hazards.length||game.done);$('hazardRule').textContent=hazards.map(a=>{const info=wideAttackInfo(a.plan.type);return info.name+'：'+info.protection+'で防ぐ';}).join(' ／ ');
 $('evacuationPanel').classList.toggle('hidden',!hazards.length||game.done);
 $('mapViewport').dataset.overlay=overlayView;
 for(const id of ['showForecast','showTerrain'])$(id).setAttribute('aria-pressed',String(overlayView===(id==='showForecast'?'forecast':'terrain')));
 lastScene.evacuation=null;
 if(hazards.length&&!game.done&&active()){
  const currentDogs=Object.entries(game.dogs).map(([kind,d])=>({kind,...d}));
  const options=evacuationOptions({terrain:game.m.terrain,kind:game.phase,dogs:currentDogs,enemies:game.enemies,plans:game.enemyPlans,field:lastScene.original,blocks:game.blocks,range:game.step==='move'&&mode==='move'?lastScene.range:[],walkable:battleWalkable,resolved:game.resolvedEnemyIds});
  const preview=!!(override||hover&&['lamp','block','beam','veil'].includes(mode)&&valid(hover.x,hover.y,lastScene.original)),safe=preview?forecastSafe(prediction,game.phase):options.currentSafe;
  lastScene.evacuation={...options,preview,safe};
  $('evacuationStatus').textContent=(preview?(override?'移動先':'技の後の現在地'):'現在地')+(safe?'は安全。このままでOK。':game.step==='move'&&mode==='move'&&options.targets.length?'は危険。番号のマスへ避難。':game.step==='skill'?'は危険。明暗の技で防ぐ／防御で軽減。':'は危険。届く避難先なし。明暗の技で対処。');
  $('evacuationStatus').dataset.safe=String(safe);
  $('evacuationTargets').replaceChildren();
  for(const [i,p] of options.targets.entries()){
   const b=document.createElement('button');b.textContent=(i+1)+' 避難 · 消費'+p.cost;b.dataset.escapeX=p.x;b.dataset.escapeY=p.y;b.disabled=busy();b.onclick=()=>{if(busy())return;overlayView='forecast';use(p.x,p.y)};$('evacuationTargets').append(b);
  }
 }


 const attacks=assessments.filter(a=>(['attack','ray','bind','displace'].includes(a.plan.type)||wideAttackInfo(a.plan.type))&&a.assessment.status==='ready').length,moves=assessments.filter(a=>['move','warp','summon'].includes(a.plan.type)&&a.assessment.status==='ready').length;
 const terrainActions=assessments.filter(a=>['illuminate','darken'].includes(a.plan.type)&&a.assessment.status==='ready').length;
 $('enemyPlanSummary').textContent=game.done?'敵の行動は終了':'敵の予告：攻撃 '+attacks+'／移動 '+moves+(terrainActions?'／明暗 '+terrainActions:'')+(lastScene.previewDog||['lamp','block','beam','veil'].includes(mode)&&hover&&!busy()&&valid(hover.x,hover.y,lastScene.original)?'（選択先の予測）':'');
 $('enemyPlans').innerHTML=assessments.map(({plan,enemy,assessment,number,field:planField,dogs:planDogs,forcedRetreat})=>{
  const canceled=assessment.status!=='ready',wide=wideAttackInfo(plan.type);
  let action=assessment.status==='dark'?'光を失ったため射撃中止':assessment.status==='blocked'?'遮蔽物・占有で実行不可':wide?wide.name+' · '+wide.protection+'で防ぐ':plan.type==='illuminate'?'予告マスを強い光へ'+(forcedRetreat?' · 影は退避':''):plan.type==='darken'?'予告マスを濃い影へ':plan.type==='displace'?'予告マスの相棒を矢印の先へ転位':plan.type==='bind'?'影縛り：予告マスの相棒が次の1手番行動不能':plan.type==='warp'?'予告先へワープ（この手番は攻撃なし）':plan.type==='summon'?'予告先に囮を生成（HP1・攻撃なし）':plan.type==='move'?'青枠のマスへ1歩移動':plan.type==='ray'?'予告した直線へ射撃 · 威力 '+plan.damage:plan.type==='attack'?'予告した隣のマスへ攻撃 · 威力 '+plan.damage:'待機';
  let hits=!['illuminate','darken'].includes(plan.type)&&assessment.cells.length?planDogs.filter(d=>d.hp>0&&assessment.cells.some(p=>p.x===d.x&&p.y===d.y)).map(d=>{let stats=statsFor(d.kind,planField,d);if(plan.type==='displace')return (d.kind==='light'?'光':'影')+'が予告先へ転位';if(plan.type==='bind')return (d.kind==='light'?'光':'影')+'が次の1手番行動不能';return (d.kind==='light'?'光':'影')+'に最大'+Math.max(0,plan.damage-stats.armor-(d.guarding?1:0))+'ダメージ'+(!wide&&stats.evade?'（回避 '+Math.round(stats.evade*100)+'%）':'')}).join('・'):'';
  if(!['illuminate','darken'].includes(plan.type)&&assessment.cells.length&&!hits)hits='現在の位置では命中する相棒なし';
  if(wide){const safe=planDogs.filter(d=>d.hp>0&&wideAttackProtected(plan,d,planField)).map(d=>(d.kind==='light'?'光':'影')+'は安全').join('・');hits=[hits,safe].filter(Boolean).join(' ／ ');}
  const trait=enemy.kind==='shadeGuard'?(enemyArmor(enemy,planField[enemy.y][enemy.x])?'暗闇の鎧：防御2':'照らされて鎧が解除'):enemy.kind==='sunArcher'?'明るさ3〜4で射撃／遮蔽物で止まる':'';
  return '<div class="enemy-plan '+(canceled?'plan-canceled':'')+'" data-enemy-id="'+enemy.id+'" data-x="'+enemy.x+'" data-y="'+enemy.y+'" data-plan="'+plan.type+'" data-status="'+assessment.status+'" data-safe-cells="'+(plan.refuges??[]).map(p=>p.x+','+p.y).join(';')+'" data-danger-cells="'+assessment.cells.map(p=>p.x+','+p.y).join(';')+'" data-target-cells="'+plan.cells.map(p=>p.x+','+p.y).join(';')+'" data-destination="'+(plan.destination?plan.destination.x+','+plan.destination.y:'')+'"><b>'+number+' '+enemyName(enemy)+' · HP '+enemy.hp+'/'+enemy.max+'</b><span>'+action+'</span><small>'+[trait,hits].filter(Boolean).join(' ／ ')+'</small></div>';
 }).join('')||'<p class="forecast-legend">行動する敵はいません。</p>';
}
function renderUI(){
 const rank=rankProgress(profile.user,profile.uxp);$('userRank').textContent='RANK '+rank.rank;$('rankXP').textContent=rank.xp+' / '+rank.required+' EXP';$('rankFill').style.width=rank.fraction*100+'%';$('rankMeter').setAttribute('aria-valuenow',String(rank.xp));$('rankMeter').setAttribute('aria-valuemax',String(rank.required));$('rankMeter').setAttribute('aria-valuetext','次のランクまで '+rank.remaining+' EXP');
 let d=active(),f=brightness(),phase=game.phase==='light'?'光の行動':game.phase==='shadow'?'影の行動':'敵の行動';
 $('packResources').innerHTML='<span>金属片 '+profile.materials.metal+'</span><span>影の結晶 '+profile.materials.crystal+'</span>';
 $('phaseTitle').textContent=game.done?(game.result==='success'?'探索完了':'探索終了'):phase;
 const tutorialVisible=!!game.tutorial&&!game.done;$('tutorialGuide').classList.toggle('hidden',!tutorialVisible);if(tutorialVisible){const hint=tutorialHint(game);$('tutorialNumber').textContent=hint.number+' / 4';$('tutorialGuideTitle').textContent=hint.title;$('tutorialGuideCopy').textContent=hint.text;}
 renderTurnOrder();
 $('turnSteps').innerHTML='<span class="'+(game.step==='move'?'current':'')+'">① 移動</span><span class="'+(game.step==='skill'?'current':'')+'">② 技</span>';
 $('missionName').textContent=game.m.name;$('round').textContent='第'+game.round+'ターン';$('charge').textContent='チャージ '+game.charge+'/'+(game.m.chargeCap??3);$('environment').textContent=readStage();
 let remaining=game.enemies.filter(e=>e.hp>0).length;
 let progress=game.m.goal==='boss'?'ボスの残りHP '+game.enemies.filter(e=>e.boss).reduce((n,e)=>n+e.hp,0):game.m.goal==='hunt'?'残り '+remaining+'体':game.item?.picked?(game.m.goal==='relic'?'物資確保 · 帰還可能':(game.carrier==='light'?'光':'影')+'の猟犬が運搬中'):(game.m.goal==='rescue'?'灯守を救助 → 運び手が帰還':'灯芯を確保 → その場から帰還');
 $('objective').textContent='クリア条件：'+missionCondition(game.m)+' ／ '+progress+(game.phases?' · '+(game.stage+1)+'/3 '+stageLabel(game.stage):'')+(game.m.mode==='endless'?' · フェーズ '+(game.wave+1)+' · 最高突破 '+profile.expansion.endlessBest:game.m.waves?' · 第'+(game.wave+1)+'/3波':'')+(game.m.beacon?' · 核 '+game.beaconHP+'/'+game.m.beacon.hp:'')+(game.m.maxRounds?' · 制限 '+game.m.maxRounds+'ラウンド':'');
 $('instruction').textContent='';$('instruction').classList.add('hidden');
 $('banner').classList.toggle('hidden',!game.done);$('banner').innerHTML=game.done?'<span>'+(game.result==='success'?'探索完了':'探索終了')+'</span><button id="resultAgain">リザルトを見る ›</button>':'';if(game.done)$('resultAgain').onclick=()=>setView('result');
 for(let k of ['light','shadow']){let dog=game.dogs[k];$(k+'Status').dataset.x=dog.x;$(k+'Status').dataset.y=dog.y;let p=game.loadout[k],s=statsFor(k,f),correction=s.attackDelta>0?'buff':s.attackDelta<0?'debuff':'';$(k+'Status').innerHTML='<div class="status-top"><b>'+dogLabel(k)+' <span>Lv.'+p.level+'</span></b><span>HP '+dog.hp+'/'+dog.max+'</span></div><div class="bar"><i style="width:'+100*dog.hp/dog.max+'%"></i></div><div class="stat-values"><span class="'+correction+'">攻 <strong>'+s.attack+'</strong></span><span>移 <strong>'+s.move+'</strong></span><span>防 <strong>'+s.armor+'</strong></span><span>避 <strong>'+Math.round(s.evade*100)+'%</strong></span><span>'+s.level+'/4</span></div>'}
 $('actions').innerHTML='';for(let [index,[id,name,desc,icon]] of actionDefs().entries()){let b=document.createElement('button');b.className=mode===id?'active':'';b.innerHTML='<span class="skill-slot">'+(game.step==='move'?'': ['基本攻撃','専用技1','専用技2','必殺技'][index])+'</span><span class="skill-icon">'+icon+'</span><b class="skill-title">'+name+'</b><small>'+(isHoundAttackSkill(id)?'◆ '+houndAttackSkills[id].cost:['beam','veil','block','rally'].includes(id)?'◆ 2':id==='combo'?'◆ 3':id==='move'?'移動力 '+statsFor(game.phase).move:'')+'</small>';b.dataset.skill=id;if(isHoundAttackSkill(id))b.title=houndAttackSkills[id].description; b.disabled=game.m.ban?.includes(id)||game.done||!d||d.hp<=0||id==='combo'&&!comboState(game.dogs,game.blocks,game.charge,game.comboUsed).ready||isHoundAttackSkill(id)&&game.charge<houndAttackSkills[id].cost||['beam','veil','block','rally'].includes(id)&&game.charge<2;b.onclick=()=>{if(busy())return;if(id==='guard'){useGuard();return}if(id==='combo'){useCombo();return}if(id==='rally'){useRally();return}mode=id;game.blockSource=null;hover=null;render()};$('actions').append(b)}
 const combo=comboState(game.dogs,game.blocks,game.charge,game.comboUsed),power=comboDamage(statsFor('light').attack,statsFor('shadow').attack);
 const pincer={ready:!!coordinatedTarget(game.dogs,game.enemies)};
 const bondNotes=[];const boost=rallyBonus(game.houndCombat,game.round);if(boost.attack)bondNotes.push('鼓舞：攻+'+boost.attack+'・防+'+boost.armor);if(game.houndCombat.kills.reaper)bondNotes.push('追猟：攻+'+game.houndCombat.kills.reaper);if(pincer.ready)bondNotes.push('双牙の交差：発動可能');if(combo.ready)bondNotes.push('双極の奔流：発動可能 · 威力'+power);else if(game.comboUsed)bondNotes.push('双極の奔流：使用済み');for(const k of ['light','shadow']){if(game.dogs[k].incapacitated)bondNotes.push((k==='light'?'光':'影')+' 行動不能');else if(ambushBonus(game.dogs[k]))bondNotes.push((k==='light'?'光':'影')+' 攻撃＋1');}$('bondStatus').textContent=bondNotes.join(' ／ ');$('bondStatus').classList.toggle('hidden',bondNotes.length===0);

 const guard=$('guardAction');guard.hidden=game.step!=='skill'||game.done;guard.disabled=busy()||!d||d.hp<=0;guard.onclick=useGuard;
 $('extract').classList.toggle('hidden',!extraction().available||game.done);$('extract').disabled=busy();
 $('pass').disabled=game.done;$('pass').textContent=game.step==='move'?'移動せず技を選ぶ':'技を使わず終了';$('log').innerHTML=game.logs.map(l=>'<div>'+escapeHTML(l)+'</div>').join('');$('lastLog').textContent=game.logs[0]??'';$('costs').disabled=game.done;
 renderAttackHelp(f);renderTerrain();if(view==='base')renderBase();updateSoundUI();
}

function renderAttackHelp(field){
 let show=view==='battle'&&!game.done&&!busy()&&game.step==='skill'&&(mode==='attack'||isHoundAttackSkill(mode))&&!!active();
 $('attackHelp').classList.add('hidden');$('attackTargets').classList.toggle('hidden',!show);$('attackTargets').replaceChildren();if(!show)return;
 let targets=game.enemies.filter(e=>e.hp>0&&valid(e.x,e.y,field));
 $('attackHelp').textContent='';
 for(let e of targets){let damage=attackDamage(isHoundAttackSkill(mode)?attackSkillPower(mode,statsFor(game.phase,field).attack,highGroundBonus(game.m.terrain,active(),e)):0,e,field[e.y][e.x]);if(mode==='attack')damage=basicDamage(e,field);const b=document.createElement('button');b.textContent=enemyName(e)+'を攻撃 · HP '+e.hp+' → '+Math.max(0,e.hp-damage)+(enemyArmor(e,field[e.y][e.x])?'（暗闇の鎧 -2）':'');b.dataset.enemyId=e.id;b.onclick=()=>use(e.x,e.y);$('attackTargets').append(b)}
 for(const wall of game.blocks.filter(b=>mode==='attack'&&valid(b.x,b.y,field))){const hit=strikeObstacle(wall,statsFor(game.phase,field).attack),b=document.createElement('button');b.dataset.blockX=wall.x;b.dataset.blockY=wall.y;b.textContent='遮蔽物 · 耐久 '+wall.hp+' → '+hit.hp;b.onclick=()=>use(wall.x,wall.y);$('attackTargets').append(b)}
}


function renderTerrain(){
 let k=game.phase==='shadow'?'shadow':'light',s=statsFor(k);$('terrainLabel').textContent=(k==='light'?'光':'影')+' · 明るさ '+s.level+'/4';$('terrainStats').textContent=s.label+' / 攻撃 '+s.attack+' · 移動 '+s.move+' · 防御 '+s.armor+' · 回避 '+Math.round(s.evade*100)+'%';$('lightMeter').innerHTML=Array.from({length:5},(_,i)=>'<i class="'+(i<=s.level?'on':'')+'"></i>').join('');
 if(hover&&inB(hover.x,hover.y)&&!busy()&&!game.done){const field=previewField(),preview=statsFor(k,field,mode==='move'?hover:game.dogs[k]),cost=lastScene?.range?.[hover.y]?.[hover.x];$('tilePreview').textContent=mode==='move'?'消費 '+(Number.isFinite(cost)?cost:'—')+'/'+s.move+' · '+preview.label:'攻撃 '+preview.attack+' · 防御 '+preview.armor}
 else $('tilePreview').textContent=game.m.terrain?'高台は階段から · 通常攻撃の高所補正 +1':'';
}
function renderBase(){
 renderActivities($('activitiesPanel'),profile.expansion,storyStep(),id=>launchQuest(id),profile.cleared);$('activitiesPanel').insertAdjacentHTML('beforeend','<div class="social-entries"><button data-companion-hub="duel">闘技場 · CPU / オンライン</button><button data-companion-hub="raid">レイド · 最大4人</button></div>');


 if(basePanel==='collection')renderCollection($('collectionPanel'),profile.expansion,profile.light,profile.shadow,profile.roster);

 for(let panel of ['journey','collection'])$(panel+'Panel').classList.toggle('hidden',basePanel!==panel);
 for(let b of $('baseTabs').querySelectorAll('button')){if(b.id==='baseBack'||!b.dataset.panel)continue;let panel=b.dataset.panel;b.classList.toggle('active',panel===basePanel);b.onclick=()=>openBase(panel)}

 $('campaignProgress').textContent=campaignQuests.filter(q=>profile.cleared.includes(q.id)).length+' / '+campaignQuests.length+' 達成';
 $('areaSelect').innerHTML=campaignAreas.map(a=>{let qs=campaignQuests.filter(q=>q.area===a.id),count=qs.filter(q=>profile.cleared.includes(q.id)).length,opened=qs.some(q=>questOpen(q.id));return '<button data-area="'+a.id+'" class="area-card '+a.theme+(selectedArea===a.id?' selected':'')+'" aria-pressed="'+(selectedArea===a.id)+'"><span class="area-mark">'+a.mark+'</span><small>'+(count===5?'踏破':opened?'探索可能':'未開放')+' · '+count+' / 5</small><strong>'+a.name+'</strong></button>'}).join('');
 for(let b of $('areaSelect').querySelectorAll('button'))b.onclick=()=>{selectedArea=Number(b.dataset.area);renderBase()};
 let area=campaignAreas[selectedArea],quests=campaignQuests.filter(q=>q.area===selectedArea);
 $('areaNumber').textContent='';$('areaName').textContent=area.name;$('areaDescription').textContent=area.subtitle;$('areaProgress').textContent=quests.filter(q=>profile.cleared.includes(q.id)).length+' / 5 達成';
 for(const [category,id] of [['story','mainQuestContent'],['endgame','activitiesPanel'],['tutorial','tutorialContent']])$(id).classList.toggle('hidden',questCategory!==category);
 for(const b of $('questCategories').querySelectorAll('button')){const selected=b.dataset.category===questCategory;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;b.onclick=()=>{questCategory=b.dataset.category;renderBase()};b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...$('questCategories').querySelectorAll('button')],i=tabs.indexOf(b),next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;questCategory=tabs[next].dataset.category;renderBase();tabs[next].focus()};}
 $('campaignProgress').classList.toggle('hidden',questCategory!=='story');
 $('missions').replaceChildren();for(const [i,m] of quests.entries()){const opened=questOpen(m.id),done=profile.cleared.includes(m.id),box=document.createElement('article');box.className='mission quest-card'+(!opened?' locked':'');box.dataset.questId=m.id;box.innerHTML=questCard(m,missionCondition(m),{opened,done,number:String(selectedArea+1)+'·'+String(i+1),locked:campaignQuests[campaignQuests.indexOf(m)-1]?.name+'をクリアすると開放'});box.querySelector('button').onclick=()=>launchQuest(m.id);$('missions').append(box)}
 const first=campaignQuests[0],tutorial=document.createElement('article');tutorial.className='mission quest-card tutorial-quest';tutorial.dataset.tutorialQuest=first.id;tutorial.innerHTML=questCard({...first,desc:'光の猟犬と影の猟犬を順番に操作し、遺跡の敵を倒す。短い操作ガイド付き。'},missionCondition(first),{opened:true,done:profile.cleared.includes(first.id),number:'01',tutorial:true});tutorial.querySelector('button').onclick=()=>launchQuest(first.id,true);$('tutorialMissions').replaceChildren(tutorial);


}
function renderResult(){
 if(!game.done)return;let success=game.result==='success',r=game.rewards,step=storyStep(),next=missions.find(m=>m.id===nextStoryMission()),unlocked=r.unlocked??[];
 if(!game.resultSoundPlayed){game.resultSoundPlayed=true;Sfx.play(success?'victory':'failure')}
 $('resultCard').classList.toggle('failure',!success);$('resultSeal').textContent=success?'✦':'◇';$('resultTitle').textContent=success?'クエスト達成！':game.resultReason==='撤退'?'クエスト撤退':'クエスト失敗';$('resultMission').textContent=game.m.name+' · '+game.resultReason;
 $('resultSummary').innerHTML='<span>第'+game.round+'ターン</span><span>討伐 '+game.enemies.filter(e=>e.hp===0).length+'/'+game.enemies.length+'</span><span>物語 '+campaignQuests.filter(q=>profile.cleared.includes(q.id)).length+'/'+campaignQuests.length+'</span>';
 $('resultRewards').classList.toggle('hidden',!success);$('resultRewardItems').innerHTML=success?'<div class="reward-item"><span class="reward-icon">◆</span><div><strong>'+(r.material==='metal'?'金属片':'影の結晶')+' ×'+r.amount+'</strong><small>所持数 '+r.before.materials[r.material]+' → '+r.after.materials[r.material]+'</small></div></div>':'';
 $('resultDogs').innerHTML=['light','shadow'].map(k=>{let a=r.before[k],b=r.after[k],up=b.level>a.level;return '<div class="result-dog '+k+'"><div class="between"><b>'+dogLabel(k)+'</b>'+(up?'<span class="level-up">レベルアップ</span>':'')+'</div><p>Lv.'+a.level+(up?' → '+b.level:'')+' <span class="small muted">'+(success?'EXP +'+r.xp:'減少なし')+'</span></p><div class="home-progress"><i style="width:'+100*b.xp/(b.level*3)+'%"></i></div><p class="small muted">次まで '+(b.level*3-b.xp)+' EXP</p></div>'}).join('');
 $('resultNextTitle').textContent=success?(unlocked.length?unlocked.join('・')+'が開放された':step===campaignQuests.length?'全エリア踏破 · すべての灯が戻った':'次の目的地：'+next.name):'作戦を見直して、再挑戦。';
 $('resultNextHint').textContent=success?(game.m.after??story.premise):'報酬・育成の減少はありません。再挑戦では二匹のHPが全回復します。';
 $('resultContinue').textContent=success?'クエストを選ぶ ›':'同じ探索に再挑戦 ›';$('resultRetry').classList.toggle('hidden',!success);
 $('resultContinue').onclick=()=>{if(success){selectedArea=next.area;openBase('journey')}else launchQuest(game.m.id)};
 if(success&&!game.m.practice)$('resultRewardItems').insertAdjacentHTML('beforeend','<div class="reward-item"><span class="reward-icon">◈</span><div><strong>灯の欠片 +'+r.shards+'</strong></div></div>');
 if(game.m.extra){$('resultNextTitle').textContent=success?'冒険の記録を図鑑に残した':'装備と進路を見直して再挑戦';$('resultNextHint').textContent=game.m.desc;$('resultContinue').textContent='冒険と試練へ ›';$('resultContinue').onclick=()=>openBase('activities');if(success)$('resultRewardItems').innerHTML='<div class="reward-item"><span class="reward-icon">◈</span><div><strong>灯の欠片 +'+r.shards+'</strong><small>本編の経験値・素材・進行は変更しません</small></div></div>';}$('resultDogs').classList.toggle('hidden',!!game.m.fixed);if(success)for(const id of (r.after.roster?.owned??[]).filter(id=>!r.before.roster?.owned.includes(id)))$('resultRewardItems').insertAdjacentHTML('beforeend','<div class="reward-item"><span class="reward-icon">♜</span><div><strong>'+escapeHTML(houndByID(id)?.name??id)+'が加入</strong></div></div>');if(success&&r.stones)$('resultRewardItems').insertAdjacentHTML('beforeend','<div class="reward-item"><span class="reward-icon">◆</span><div><strong>猟犬召喚石 +'+r.stones+'</strong></div></div>');
 if(game.m.mode==='endless'){$('resultCard').classList.remove('failure');$('resultTitle').textContent='連戦終了';$('resultMission').textContent=game.m.name;$('resultSummary').innerHTML='<span>突破 '+game.endlessCleared+' フェーズ</span><span>最高突破 '+profile.expansion.endlessBest+' フェーズ</span>';$('resultRewards').classList.add('hidden');$('resultDogs').parentElement.classList.add('hidden');$('resultNextTitle').textContent='次は、その先へ';$('resultNextHint').textContent='HPとチャージは挑戦開始時に戻ります。';$('resultContinue').textContent='もう一度挑む ›';$('resultContinue').onclick=()=>launchQuest('endless');}else $('resultDogs').parentElement.classList.remove('hidden');
 if(game.m.practice){$('resultTitle').textContent=success?'演習達成！':game.resultReason==='撤退'?'演習終了':'演習失敗';$('resultRewards').classList.add('hidden');$('resultNextTitle').textContent='同じ盤面で別の行動順を試せます';$('resultNextHint').textContent='演習は固定能力です。育成・装備・素材・物語の進行は変わりません。';$('resultContinue').textContent='もう一度演習する ›';$('resultContinue').onclick=()=>launchQuest('tactics');}
}
function updateSoundUI(){let s=Sfx.state();$('audioToggle').textContent=s.muted||s.volume===0?'音 OFF':'音 ON';$('audioVolume').value=Math.round(s.volume*100);$('volumeLabel').textContent=Math.round(s.volume*100)+'%';for(const key of ['musicVolume','effectsVolume']){$(key).value=Math.round(s[key]*100);$(key+'Label').textContent=Math.round(s[key]*100)+'%'}}
function closeSoft(dialog){
 if(!dialog.open||dialog.dataset.closing)return;
 if(reducedMotion){dialog.close();return}
 dialog.dataset.closing='true';dialog.inert=true;
 dialog.animate([{opacity:1},{opacity:0}],{duration:150,easing:'ease-out'}).finished.catch(()=>{}).finally(()=>{dialog.close();dialog.inert=false;delete dialog.dataset.closing});
}
let prologuePage=0;
function openPrologue(){prologuePage=0;renderPrologue();$('prologueDialog').showModal()}
function renderPrologue(){const page=storyIntro[prologuePage];$('prologueCount').textContent=String(prologuePage+1)+' / '+storyIntro.length;$('prologueHeading').textContent=page.title;$('prologueCopy').textContent=page.text;$('prologueArt').dataset.page=prologuePage;$('prologueNext').textContent=prologuePage===storyIntro.length-1?'旅をはじめる ›':'次へ ›';$('prologueBack').disabled=prologuePage===0}
function finishPrologue(){profile.introSeen=true;save();$('prologueDialog').close()}
function setupGameUI(){

 $('dismissTutorial').onclick=()=>{game.tutorial=false;render()};
 $('prologueNext').onclick=()=>{if(prologuePage===storyIntro.length-1)finishPrologue();else{prologuePage++;renderPrologue()}};$('prologueBack').onclick=()=>{if(prologuePage>0){prologuePage--;renderPrologue()}};$('prologueSkip').onclick=finishPrologue;$('prologueDialog').addEventListener('cancel',e=>{e.preventDefault();finishPrologue()});
 for(const id of ['companionDialog','preferencesDialog','storyDialog'])$(id).addEventListener('cancel',e=>{e.preventDefault();closeSoft($(id))});

 $('affinityRules').innerHTML=['light','shadow'].map(k=>'<h3>'+(k==='light'?'光':'影')+'の猟犬 · 移動力 '+movementBudget[k]+'</h3><table class="rules-table"><thead><tr><th>明るさ</th><th>進入コスト</th><th>攻撃補正</th><th>防御</th><th>回避</th></tr></thead><tbody>'+affinity[k].map((a,i)=>'<tr><td>'+i+'</td><td>'+(Number.isFinite(movementCost(k,i))?movementCost(k,i):'進入不可')+'</td><td>'+a.attack+'</td><td>'+a.armor+'</td><td>'+Math.round(a.evade*100)+'%</td></tr>').join('')+'</tbody></table>').join('');

 $('openStory').onclick=()=>{$('storyBook').innerHTML=renderStoryBook(profile.cleared);$('storyDialog').showModal();$('storyDialog').scrollTop=0};$('closeStory').onclick=()=>closeSoft($('storyDialog'));$('replayPrologue').onclick=()=>{closeSoft($('storyDialog'));openPrologue()};
 $('showForecast').onclick=()=>{overlayView='forecast';draw()};$('showTerrain').onclick=()=>{overlayView='terrain';hover=null;draw()};
 $('extract').onclick=extractNow;
 $('saveCompanionName').onclick=()=>{if(questActive())return;profile.roster.names[profile.roster.party[inspectedKind]]=normalizeName($('companionName').value);if(['dawn','dusk'].includes(profile.roster.party[inspectedKind]))profile[inspectedKind].name=profile.roster.names[profile.roster.party[inspectedKind]];save();$('companionName').value=profile.roster.names[profile.roster.party[inspectedKind]]??profile[inspectedKind].name;$('companionTitle').textContent=companionName(inspectedKind);$('nameFeedback').textContent='名前を保存しました。';render()};

 $('closeCompanion').onclick=()=>closeSoft($('companionDialog'));
 $('rotateCompanion').oninput=e=>{previewYaw=Number(e.target.value)/100*Math.PI*2;drawCompanion()};
 $('previewEquipment').onchange=()=>drawCompanion();
 $('previewCharm').onchange=e=>{previewCharm=e.target.value;$('previewEquipment').checked=true;updateCompanionEquipment();drawCompanion()};
 $('equipPreviewCharm').onclick=()=>{if(questActive())return;if(equipEquipment(profile[inspectedKind],previewCharm,inspectedKind)){save();Sfx.play('ui');$('previewEquipment').checked=true;updateCompanionEquipment();render();drawCompanion()}};
 $('numbers').onchange=e=>{showNumbers=e.target.checked;draw()};$('costs').onchange=e=>{showCosts=e.target.checked;draw()};$('reduceMotion').checked=reducedMotion;$('reduceMotion').onchange=e=>{reducedMotion=e.target.checked;document.body.classList.toggle('reduce-motion',reducedMotion)};
 $('titleStart').onclick=()=>{Sfx.unlock();setView('home');if(profile.cleared.length===0&&!profile.introSeen)openPrologue();if(titleWorld){titleWorld.dispose();titleWorld=null}};
 for(let kind of ['light','shadow'])$(kind==='light'?'orderLight':'orderShadow').onclick=()=>{if(game.done||busy()||game.orderLocked||game.acted.includes(kind)||game.dogs[kind].hp<=0)return;game.phase=kind;game.roundFirst=kind;mode='move';hover=null;render()};
 $('pass').onclick=()=>{if(game.done||busy())return;game.orderLocked=true;if(game.step==='move'){skipMovement();return;}else nextPhase();hover=null;render()};
 $('restart').onclick=()=>{if(busy()||!questActive())return;questPrompt('クエストから撤退しますか？',game.m.mode==='endless'?'この挑戦を終了します。突破記録は保存されています。':'この戦闘を終了します。報酬はありません。育成と所持素材は減りません。','撤退して終了',()=>{finishResult(false,'撤退');render();fitGameViewport()})};$('baseBack').onclick=()=>setView('home');
 $('homeCollection').onclick=()=>openBase('collection');
 $('homeGo').onclick=()=>{questCategory='story';selectedArea=campaignQuests.find(m=>m.id===nextStoryMission()).area;openBase('journey')};
 $('resultHome').onclick=()=>setView('home');$('resultRetry').onclick=()=>launchQuest(game.m.id);$('resultMap').onclick=()=>setView('battle');
 $('audioToggle').onclick=()=>{Sfx.unlock();Sfx.mute();updateSoundUI()};$('audioVolume').oninput=e=>{Sfx.unlock();Sfx.volume(e.target.value/100);updateSoundUI()};$('audioVolume').onchange=()=>Sfx.play('ui');for(const key of ['musicVolume','effectsVolume'])$(key).oninput=e=>{Sfx.unlock();Sfx[key](e.target.value/100);updateSoundUI()};
 $('preferences').onclick=()=>{updateSoundUI();$('preferencesDialog').showModal()};$('closePreferences').onclick=()=>closeSoft($('preferencesDialog'));
 $('fullScreen').onclick=()=>{if(typeof document.documentElement?.requestFullscreen==='function'){let p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();p?.catch(()=>{})}};
 if(document.addEventListener){document.addEventListener('pointerdown',()=>Sfx.unlock(),{passive:true});document.addEventListener('keydown',()=>Sfx.unlock());document.addEventListener('click',e=>{let b=e.target.closest?.('button');if(b&&!b.disabled&&b.id!=='audioToggle')Sfx.play(b.dataset.sound||'ui')})}
 if(typeof window!=='undefined'){let pending=false,resize=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;fitGameViewport()})};window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);if(typeof ResizeObserver!=='undefined'){let observer=new ResizeObserver(resize);observer.observe($('mapViewport'));observer.observe(canvas);observer.observe(homeCanvas)}resize()}
}

function previewField(){let f=brightness(),d=active();if(busy()||!hover||!d||game.done||!valid(hover.x,hover.y,f))return f;if(mode==='lamp'){let old=game.lamp;try{game.lamp={...hover};return brightness()}finally{game.lamp=old}}if(mode==='block'){if(blocked(hover.x,hover.y))return f;const old=game.blocks;try{game.blocks=shiftingBlocks(hover);return brightness()}finally{game.blocks=old}}if(mode==='beam'||mode==='veil'){let copy=f.map(row=>row.slice());for(let c of cellsTo(d,hover.x,hover.y))copy[c.y][c.x]=mode==='beam'?4:0;return copy}return f}
let backdropLayout=null,floorCacheKey='',floorCache=[];
function draw(){if(view!=='battle')return;$('mapViewport').dataset.stage=game.m.id;$('mapViewport').dataset.theme=game.layout.theme;$('mapViewport').dataset.height=String(!!game.m.terrain);let original=brightness(),f=previewField(),d=active(),range=game.done||!d||d.hp<=0?null:reach(d,original),m=new MeshBuilder(),tileColors=stagePalettes[game.layout.theme].tiles;
 frameCamera();
 world.sky=stagePalettes[game.layout.theme].sky;if(backdropLayout!==game.layout){const backdrop=new MeshBuilder();buildStage(backdrop,game.layout);world.backdrop(backdrop.v);backdropLayout=game.layout;floorCacheKey='';}
 const floorKey=JSON.stringify(f);if(floorCacheKey!==floorKey){m.surface=game.layout.theme==='forest'?3:1;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!inB(x,y))continue;let tileStart=m.v.length,v=f[y][x],noise=.88+((x*17+y*23)%11)/55,col=tileColors[v].map(c=>c*noise);m.box([x+.5,-.025,y+.5],[.974,.105,.974],col);m.ring(x+.5,y+.5,[.035,.045,.055],.032,.965);

 lift(m,tileStart,x,y);
 }
 floorCache=m.v;floorCacheKey=floorKey;}else m.v=floorCache.slice();m.surface=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(inB(x,y)){let tileStart=m.v.length;
  if(overlayView==='forecast'&&!game.enemyPlans.some(p=>wideAttackInfo(p.type)&&!game.resolvedEnemyIds.includes(p.enemyId)&&game.enemies.some(e=>e.id===p.enemyId&&e.hp>0))&&!busy()&&!game.done&&range&&mode==='move'&&range[y][x]<Infinity&&!occupied(x,y,d)&&!(x===d.x&&y===d.y)){m.ring(x+.5,y+.5,game.phase==='light'?[.46,.28,.065]:[.29,.08,.49],.043,.91)}
 lift(m,tileStart,x,y);}

 for(let b of game.blocks){if(b===game.blockSource&&hover&&valid(hover.x,hover.y,original))continue;placed(m,b.x,b.y,()=>m.crate(b.x+.5,b.y+.5));}
 for(let s of fixed)placed(m,s.x,s.y,()=>m.lantern(s.x+.5,s.y+.5));
 let lamp=mode==='lamp'&&hover&&valid(hover.x,hover.y,original)?hover:game.lamp;if(!(clip?.type==='lamp'&&!clip.impacted))placed(m,lamp.x,lamp.y,()=>m.lantern(lamp.x+.5,lamp.y+.5,true));
 if(game.item&&!game.item.picked){let i=game.item;if(game.m.goal==='rescue'){m.sphere([i.x+.5,.48,i.y+.5],[.14,.18,.13],[.42,.37,.57]);m.box([i.x+.5,.20,i.y+.5],[.24,.35,.22],[.19,.24,.34]);m.ring(i.x+.5,i.y+.5,[.30,.18,.48],.04,.7)}else{m.box([i.x+.5,.17,i.y+.5],[.38,.32,.28],[.19,.37,.34]);m.sphere([i.x+.5,.45,i.y+.5],[.09,.13,.09],[.34,.86,.78],6,4,1.2);m.ring(i.x+.5,i.y+.5,[.10,.50,.40],.04,.7)}}
 if(game.item?.picked&&game.m.goal==='rescue')for(let y=0;y<H;y++)for(let x=0;x<2;x++)if(inB(x,y))m.ring(x+.5,y+.5,[.52,.31,.08],.045,.78);
 if(d&&d.hp>0&&!game.done&&!busy())m.ring(d.x+.5,d.y+.5,game.phase==='light'?[.76,.53,.16]:[.53,.19,.88],.07,.84);
 if(overlayView==='forecast'&&!busy()&&isHoundAttackSkill(mode)&&game.step==='skill')for(const e of game.enemies.filter(e=>e.hp>0&&valid(e.x,e.y,original)))placed(m,e.x,e.y,()=>m.ring(e.x+.5,e.y+.5,[.9,.12,.08],.08,.93));
 if(overlayView==='forecast'&&!busy()&&hover&&inB(hover.x,hover.y)&&!game.done&&valid(hover.x,hover.y,original)){m.ring(hover.x+.5,hover.y+.5,[.77,.67,.36],.06,.99);if(mode==='beam'||mode==='veil')for(let c of cellsTo(d,hover.x,hover.y))m.ring(c.x+.5,c.y+.5,mode==='beam'?[.74,.40,.08]:[.38,.06,.68],.055,.87);if(isHoundAttackSkill(mode))for(const c of skillCells(mode,hover))placed(m,c.x,c.y,()=>m.ring(c.x+.5,c.y+.5,[1,.18,.12],.08,.90));if(mode==='block'&&!blocked(hover.x,hover.y))m.crate(hover.x+.5,hover.y+.5)}
 if(game.m.terrain){
  for(const w of game.m.terrain.lowWalls)placed(m,w.x,w.y,()=>{m.box([w.x+.5,.16,w.y+.5],[.88,.32,.88],[.32,.34,.38]);m.box([w.x+.5,.34,w.y+.5],[.94,.06,.94],[.53,.49,.39]);});
  for(const stair of game.m.terrain.stairs){for(let i=0;i<4;i++)m.box([stair.x+.125+i*.25,heightScale+.025+i*.025,stair.y+.5],[.24,.12,.92],[.45,.39,.26]);}
 }
 if(game.m.puzzle)for(const [kind,r] of Object.entries(game.m.puzzle))placed(m,r.x,r.y,()=>m.ring(r.x+.5,r.y+.5,kind==='light'?[.95,.70,.24]:[.57,.26,.95],.09,.83));
 if(game.m.beacon){const b=game.m.beacon;placed(m,b.x,b.y,()=>{m.box([b.x+.5,.16,b.y+.5],[.65,.30,.65],[.22,.35,.39]);m.sphere([b.x+.5,.62,b.y+.5],[.18,.32,.18],[.58,.87,.83],8,5,1.3);});}
 lastScene={f,original,range,lamp,forecastBlocks:mode==='block'&&hover&&!blocked(hover.x,hover.y)&&valid(hover.x,hover.y,original)?shiftingBlocks(hover):game.blocks,previewDog:mode==='move'&&hover&&!busy()&&valid(hover.x,hover.y,original)?{kind:game.phase,...hover}:null};renderEnemyPlans();let boxes=lastScene.forecastBlocks.map(b=>[b.x+.5,b.y+.5,.45,.82]);let sources=[...fixed,lamp].map(s=>[s.x+.5,.65,s.y+.5]);world.static(m.v,sources,boxes);drawDynamic(performance.now()/1000);renderTerrain();
}
function pathTo(x,y){return lastScene?.range?movementPath(game.phase,active(),{x,y},lastScene.original,lastScene.range,terrainEdge):[]}
function drawDynamic(t){if(!lastScene)return;let m=new MeshBuilder(),f=lastScene.original,now=performance.now();
 for(let [kind,d] of Object.entries(game.dogs)){let dying=transients.some(e=>e.target===kind&&e.type==='defeat');if(d.hp<=0&&!dying)continue;let p=poseFor(kind,d,now);drawHound(world,m,p.x+.5,p.z+.5,kind,t,1,f[d.y][d.x],{...p,y:p.y+floorY(p.x+.5,p.z+.5),sigil:game.loadout[kind].equipment?game.sigils?.sockets[kind][game.loadout[kind].equipment]:null,equipment:game.loadout[kind].equipment});if(d.guarding&&d.hp>0)placed(m,Math.floor(p.x+.5),Math.floor(p.z+.5),()=>drawGuardMesh(m,p,kind,t))}
 for(let e of game.enemies){let key='enemy-'+e.id,dying=transients.some(a=>a.target===key&&a.type==='defeat');if(e.hp>0||dying){let p=poseFor(key,e,now);m.goblin(p.x+.5,p.z+.5,e.boss,{...p,y:p.y+floorY(p.x+.5,p.z+.5),time:t,kind:e.kind,species:e.species,affinity:e.affinity,armored:enemyArmor(e,lastScene.f[e.y][e.x])>0,lit:lastScene.f[e.y][e.x]>=3})}}
 const skillStart=m.v.length;drawSkillMesh(m,now,t);if(game.m.terrain)for(let i=skillStart;i<m.v.length;i+=11)m.v[i+1]+=floorY(m.v[i],m.v[i+2]);let lamp=presentedLamp(now);world.lights=[...fixed.map(s=>[s.x+.5,.65+floorY(s.x+.5,s.y+.5),s.y+.5]),[lamp.x+.5,.65+lamp.height+floorY(lamp.x+.5,lamp.y+.5),lamp.y+.5]];world.draw(m.v);drawOverlay(t);drawActionEffects(now);
 let hit=transients.find(e=>e.type==='hit'&&e.damage>0&&now-e.start<160),strength=hit&&!reducedMotion?Math.sin((now-hit.start)*.14)*(1-(now-hit.start)/160)*2.2:0;
 let transform=strength?'translate('+strength+'px,'+(-strength*.45)+'px)':'';canvas.style.transform=transform;fx.style.transform=transform;
}
function presentedLamp(now=performance.now()){if(clip?.type==='lamp'&&!clip.impacted){let u=clamp01(progress(clip,now)/.60);return {x:clip.oldLamp.x+(clip.to.x-clip.oldLamp.x)*u,y:clip.oldLamp.y+(clip.to.y-clip.oldLamp.y)*u,height:Math.sin(u*Math.PI)*1.1}}return {...lastScene.lamp,height:0}}
function drawGuardMesh(m,p,kind,t){let color=kind==='light'?[.28,.58,.85]:[.42,.21,.69];for(let i=0;i<18;i++){let a=i/18*Math.PI*2,b=(i+1)/18*Math.PI*2;m.rod([p.x+.5+Math.cos(a)*.48,.20+Math.sin(t*2+i)*.015,p.z+.5+Math.sin(a)*.48],[p.x+.5+Math.cos(b)*.48,.20+Math.sin(t*2+i+1)*.015,p.z+.5+Math.sin(b)*.48],.012,color,1.8)}}
function drawSkillMesh(m,now,t){if(!clip)return;let a=clip,q=progress(a,now),light=a.actor==='light',col=light?[1,.64,.18]:[.42,.14,.85],d=game.dogs[a.actor];
 if(d&&!a.path&&a.type!=='attack'&&a.type!=='shadowAttack'){
  let r=.25+Math.sin(q*Math.PI)*.4;for(let i=0;i<12;i++){let angle=i/12*Math.PI*2+t*2;m.sphere([d.x+.5+Math.cos(angle)*r,.15+q*.4,d.y+.5+Math.sin(angle)*r],[.025,.035,.025],col,5,3,2)}
 }
 if(a.type==='pincer')for(const kind of ['light','shadow']){const dog=game.dogs[kind],color=kind==='light'?[1,.68,.21]:[.53,.26,.94];m.rod([dog.x+.5,.48,dog.y+.5],[a.to.x+.5,.25+Math.sin(q*Math.PI)*.4,a.to.y+.5],.015+Math.sin(q*Math.PI)*.022,color,2,.006);}
 if(a.type==='beam'||a.type==='veil'||a.type==='combo'){
  for(let [i,c] of a.cells.entries()){let k=clamp01((q-.22-i*.055)/.28);if(!k||q>.94)continue;let size=.3+Math.sin(k*Math.PI/2)*.58,height=(a.type==='beam'?1.05:.32)*Math.sin(k*Math.PI/2),x=c.x+.5,z=c.y+.5;
   m.ring(x,z,col,.07,size);
   if(a.type==='beam'){m.rod([x,.06,z],[x,height,z],.035,col,3,.008);for(let side of [-1,1])m.rod([x+side*.22,.08,z],[x+side*.14,height*.7,z],.012,[1,.83,.43],2,.004)}
   else{for(let j=0;j<4;j++){let theta=t*3+j*Math.PI/2+i;m.sphere([x+Math.cos(theta)*.25,.13+Math.sin(theta+q*4)*.07,z+Math.sin(theta)*.25],[.16,.11,.13],[.12,.035,.24],6,3,.6)}}
  }
 }
 if(a.type==='lamp'&&!a.impacted){let u=clamp01(q/.60),x=a.oldLamp.x+(a.to.x-a.oldLamp.x)*u,z=a.oldLamp.y+(a.to.y-a.oldLamp.y)*u,h=Math.sin(u*Math.PI)*1.1;let start=m.v.length;m.lantern(x+.5,z+.5,true);m.transform(start,x+.5,z+.5,{y:h})}
 if(a.type==='block'&&!a.impacted){let u=clamp01((q-.15)/.45),start=m.v.length;m.crate(a.to.x+.5,a.to.y+.5);m.transform(start,a.to.x+.5,a.to.y+.5,{y:-.82*(1-smooth(u)),alpha:clamp01(u*2)})}
}
function drawActionEffects(now){let c=fxCtx,project=(x,y,h=0)=>world.project([x+.5,h,y+.5]);
 const ring=(x,y,r,color,alpha=1,width=2)=>{c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,r,r*.48,0,0,Math.PI*2);c.stroke()};
 const glow=(x,y,r,color,alpha=1)=>{let g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)};
 c.save();
 for(let e of transients){let elapsed=now-e.start-(e.delay??0);if(elapsed<0)continue;let q=clamp01(elapsed/e.duration),fade=1-q;if(q>=1)continue;let p=project(e.x,e.y,['hit','miss','cancel'].includes(e.type)?.8:.05),col=e.color??'#ffdfa8';
  if(e.type==='turn'){c.globalAlpha=Math.sin(q*Math.PI);c.fillStyle='#07101cbb';c.fillRect(fx.width/2-170,45,340,48);c.fillStyle='#fce0a9';c.font='bold 20px '+gameFont;c.textAlign='center';c.fillText(e.text,fx.width/2,76);continue}
  if(['hit','miss','cancel'].includes(e.type)){
   c.globalAlpha=fade;c.textAlign='center';c.font='bold '+(e.type==='hit'?29:21)+'px '+gameFont;c.lineWidth=5;c.strokeStyle='#0a0e1a';c.fillStyle=col;let text=e.type==='cancel'?e.text:e.type==='miss'?'MISS':e.damage===0?'GUARD':'−'+e.damage;c.strokeText(text,p.x,p.y-28-q*40);c.fillText(text,p.x,p.y-28-q*40);
   if(e.type==='hit'&&e.damage>0)glow(p.x,p.y,30+q*25,col,Math.max(0,1-q*4)*.8);
  }
  if(['cast','land','lightBurst','guard','defeat'].includes(e.type)){ring(p.x,p.y,10+q*(e.type==='lightBurst'?78:42),col,fade*.8,2);if(e.type==='lightBurst'||e.type==='guard')glow(p.x,p.y-10,35+q*45,col,fade*.20)}
  if(e.type==='slash'){
   c.globalAlpha=fade;c.strokeStyle=col;c.lineWidth=6*fade+1;c.shadowColor=col;c.shadowBlur=16;for(let j=-1;j<=1;j++){c.beginPath();c.moveTo(p.x-24+j*11,p.y-26+q*15);c.quadraticCurveTo(p.x+j*11,p.y-15,p.x+24+j*11,p.y+12);c.stroke()}c.shadowBlur=0;
  }
  if(['dust','smoke','lightBurst','defeat','hit'].includes(e.type)){
   let count=reducedMotion?5:e.count??(e.type==='dust'?6:18);
   for(let i=0;i<count;i++){let seed=(i*97+e.x*43+e.y*29)%101/101,angle=i*2.399+e.x,speed=e.type==='dust'?18:25+seed*36,r=q*speed,xx=p.x+Math.cos(angle)*r,yy=p.y+Math.sin(angle)*r*.4-Math.sin(q*Math.PI)*(e.type==='smoke'?30:18),size=(e.type==='smoke'?6:2.7)*(1-q)*(.5+seed);c.globalAlpha=fade*(e.type==='smoke'?.30:.85);c.fillStyle=col;c.beginPath();c.arc(xx,yy,Math.max(.1,size),0,Math.PI*2);c.fill()}
  }
 }
 if(clip){let a=clip,q=progress(a,now),d=game.dogs[a.actor],light=a.actor==='light',col=light?'#ffdda0':'#b78aff';
  if(['combo','bind','warp','summon','illuminate','darken','nightfall','solarFlare'].includes(a.type)){
   const colors={nightfall:'#bd9be8',solarFlare:'#ffdba2',combo:'#e4caff',bind:'#f397dc',warp:'#9ccfff',summon:'#8ce3cf',illuminate:'#ffe0a1',darken:'#bd9ce9'},color=colors[a.type];
   for(const [i,cell] of (a.cells?.length?a.cells:[a.to]).entries()){if(wideAttackInfo(a.type)&&i%3)continue;const p=project(cell.x,cell.y,.1);ring(p.x,p.y,20+Math.sin(q*Math.PI)*45,color,Math.sin(q*Math.PI),3);if(!reducedMotion)glow(p.x,p.y,65,color,Math.sin(q*Math.PI)*.3)}
  }
  if(['beam','veil','block','lamp','combo','bind','warp','summon','illuminate','darken'].includes(a.type)){c.globalAlpha=Math.sin(q*Math.PI);c.fillStyle='#07101cdb';c.fillRect(fx.width/2-140,18,280,42);c.fillStyle=col;c.font='bold 20px '+gameFont;c.textAlign='center';c.fillText(({combo:'双極の奔流',bind:'影縛り',warp:'跳影',summon:'幻影召喚',illuminate:'照明術',darken:'暗幕',beam:'光の直線',veil:'影の帯',block:'遮蔽物を置く',lamp:'灯火を移す'})[a.type],fx.width/2,46)}

  if(a.type==='enemyRay'&&q>.18&&a.cells?.length){let from=project(a.from.x,a.from.y,.65),end=a.cells.at(-1),to=project(end.x,end.y,.25);c.globalAlpha=Math.sin(q*Math.PI)*.8;c.strokeStyle='#ff9669';c.shadowColor='#ff805c';c.shadowBlur=16;c.lineWidth=4;c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);c.stroke();c.shadowBlur=0;}
  if((a.type==='beam'||a.type==='veil')&&q>.18){let n=clamp01((q-.18)/.55),from=project(a.from.x,a.from.y,.3),to=project(a.cells.at(-1).x,a.cells.at(-1).y,.3);c.globalAlpha=Math.sin(q*Math.PI)*.75;c.strokeStyle=col;c.lineCap='round';c.lineWidth=a.type==='beam'?9:19;c.shadowColor=col;c.shadowBlur=22;c.beginPath();c.moveTo(from.x,from.y);c.lineTo(from.x+(to.x-from.x)*n,from.y+(to.y-from.y)*n);c.stroke();c.shadowBlur=0}
  if(d&&!a.path&&a.type!=='attack'&&a.type!=='shadowAttack'){let p=project(d.x,d.y,.05);ring(p.x,p.y,22+Math.sin(q*Math.PI)*18,col,Math.sin(q*Math.PI)*.7,2)}
 }
 c.restore();
}

function drawEnemyForecast(c){
 if(game.done||overlayView==='terrain')return;c.save();
 for(const {plan,enemy,assessment,number,field} of lastScene.assessments??[]){
  if(wideAttackInfo(plan.type)){
   const danger=new Set(assessment.cells.map(p=>p.x+','+p.y)),safeCells=lastScene.evacuation?.safeCells??[],targets=lastScene.evacuation?.targets??[];
   for(const cell of plan.cells){if(blocked(cell.x,cell.y))continue;
    const escape=safeCells.some(p=>p.x===cell.x&&p.y===cell.y),target=targets.findIndex(p=>p.x===cell.x&&p.y===cell.y),rune=plan.refuges?.some(p=>p.x===cell.x&&p.y===cell.y);
    const points=[[.12,.12],[.88,.12],[.88,.88],[.12,.88]].map(([x,y])=>world.project([cell.x+x,.12,cell.y+y]));
    // Floor colour continues to communicate light. Threats use symbols, never a coloured floor wash.
    if(danger.has(cell.x+','+cell.y)){
     const p=world.project([cell.x+.78,.13,cell.y+.22]),r=portraitBoard?6:5;
     c.fillStyle='#1b1015f2';c.strokeStyle='#ff8b9e';c.lineWidth=1.5;c.beginPath();c.moveTo(p.x,p.y-r);c.lineTo(p.x+r,p.y+r*.7);c.lineTo(p.x-r,p.y+r*.7);c.closePath();c.fill();c.stroke();c.fillStyle='#ffd6dd';c.font='bold '+(portraitBoard?9:8)+'px sans-serif';c.textAlign='center';c.fillText('!',p.x,p.y+r*.45);
    }
    if(escape){
     c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.setLineDash([]);c.strokeStyle='#071e26';c.lineWidth=6;c.stroke();c.strokeStyle='#82f3e4';c.lineWidth=target>=0?3.5:2;c.stroke();
     const p=world.project([cell.x+.5,.16,cell.y+.5]),r=target>=0?15:9;
     c.fillStyle='#08232af2';c.strokeStyle='#9bfff0';c.lineWidth=2;c.beginPath();c.moveTo(p.x-r,p.y-r*.55);c.lineTo(p.x+r,p.y-r*.55);c.lineTo(p.x+r*.8,p.y+r*.4);c.lineTo(p.x,p.y+r);c.lineTo(p.x-r*.8,p.y+r*.4);c.closePath();c.fill();c.stroke();
     c.fillStyle='#e1fff9';c.textAlign='center';c.font='bold '+(target>=0?17:10)+'px '+gameFont;c.fillText(target>=0?String(target+1):'✓',p.x,p.y+5);
    }else if(rune){
     const p=world.project([cell.x+.5,.13,cell.y+.5]);c.fillStyle='#07121ce8';c.fillRect(p.x-12,p.y-10,24,18);c.fillStyle='#8b9ba8';c.font='11px '+gameFont;c.textAlign='center';c.fillText('陣',p.x,p.y+3);
    }
   }
  }

  let ready=assessment.status==='ready',color=ready?(plan.type==='move'?'#85c7e1':'#f78983'):'#7c909b';
  if(['move','warp','summon','displace'].includes(plan.type)&&plan.destination){
   let from=world.project([(plan.type==='displace'?plan.cells[0]:plan.origin).x+.5,.12,(plan.type==='displace'?plan.cells[0]:plan.origin).y+.5]),to=world.project([plan.destination.x+.5,.12,plan.destination.y+.5]);
   c.strokeStyle=color;c.lineWidth=3;c.setLineDash(ready?[]:[5,5]);c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);c.stroke();
   let angle=Math.atan2(to.y-from.y,to.x-from.x);c.setLineDash([]);c.beginPath();c.moveTo(to.x-Math.cos(angle-.5)*9,to.y-Math.sin(angle-.5)*9);c.lineTo(to.x,to.y);c.lineTo(to.x-Math.cos(angle+.5)*9,to.y-Math.sin(angle+.5)*9);c.stroke();
  }
  if(plan.type==='displace'||plan.type==='ray'||plan.type==='attack'||plan.type==='bind'||plan.type==='illuminate'||plan.type==='darken')for(const cell of plan.cells){
   let active=assessment.cells.some(p=>p.x===cell.x&&p.y===cell.y),points=[[.09,.09],[.91,.09],[.91,.91],[.09,.91]].map(([x,y])=>world.project([cell.x+x,.105,cell.y+y]));
   c.strokeStyle=active?(plan.type==='illuminate'?'#ffd27c':plan.type==='darken'?'#be9cff':'#e38184'):'#7c909b';c.fillStyle='transparent';c.lineWidth=2;c.setLineDash(active?[]:[4,5]);c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();c.stroke();
   if(active){c.setLineDash([]);c.beginPath();c.moveTo(points[0].x,points[0].y);c.lineTo(points[2].x,points[2].y);c.moveTo(points[1].x,points[1].y);c.lineTo(points[3].x,points[3].y);c.globalAlpha=.6;c.stroke();c.globalAlpha=1;}
  }
  let label=world.project([enemy.x+.5,enemy.boss?1.95:1.38,enemy.y+.5]);c.setLineDash([]);c.fillStyle='#0b1823de';c.fillRect(label.x-12,label.y-11,24,19);c.fillStyle=color;c.textAlign='center';c.font='bold '+(portraitBoard?19:13)+'px '+gameFont;c.fillText(String(number),label.x,label.y+3);
 }
 c.restore();
}
function drawOverlay(t){let c=fxCtx;c.clearRect(0,0,fx.width,fx.height);let f=lastScene.f;
 for(let s of [...fixed,presentedLamp()]){let p=world.project([s.x+.5,.30+(s.height??0),s.y+.5]),r=22+Math.sin(t*3+s.x)*2,g=c.createRadialGradient(p.x,p.y,2,p.x,p.y,r);g.addColorStop(0,'#fff4bde0');g.addColorStop(.17,'#ffe29384');g.addColorStop(1,'#ffd88700');c.fillStyle=g;c.fillRect(p.x-r,p.y-r,r*2,r*2)}
 if(showNumbers||showCosts||overlayView==='terrain'){
  const terrain=overlayView==='terrain';c.font='bold '+(terrain?(portraitBoard?20:12):(portraitBoard?20:12))+'px '+gameFont;c.textAlign='center';
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   if(!inB(x,y)||blocked(x,y)||terrain&&occupied(x,y))continue;
   const p=world.project([x+(terrain?.5:.22),.12,y+(terrain?.5:.18)]),width=terrain?(portraitBoard?22:16):24;
   c.fillStyle=terrain?'#071020ad':'#071020bb';c.fillRect(p.x-width/2,p.y-(terrain&&portraitBoard?14:10),width,terrain?(portraitBoard?20:15):18);c.fillStyle='#fff1c9';
   c.fillText(terrain||showNumbers?String(f[y][x]):Number.isFinite(movementCost(game.phase==='shadow'?'shadow':'light',f[y][x]))?String(movementCost(game.phase==='shadow'?'shadow':'light',f[y][x])):'×',p.x,p.y+1);
  }
 }

 if(game.m.puzzle)for(const [kind,r] of Object.entries(game.m.puzzle)){const p=world.project([r.x+.5,.25,r.y+.5]);c.fillStyle=kind==='light'?'#ffe0a0':'#ccb0ff';c.font='bold 16px '+gameFont;c.textAlign='center';c.fillText(kind==='light'?'光印 ≥3':'影印 ≤1',p.x,p.y);}
 if(game.m.beacon){const b=game.m.beacon,p=world.project([b.x+.5,1.2,b.y+.5]);c.fillStyle='#abf1db';c.font='bold 15px '+gameFont;c.textAlign='center';c.fillText('灯台核 '+game.beaconHP+'/'+b.hp,p.x,p.y);}
 if(game.m.terrain)for(const r of game.m.terrain.stairs){const p=world.project([r.x+.5,.22,r.y+.5]);c.fillStyle='#ffe0a0';c.font='bold 13px '+gameFont;c.textAlign='center';c.fillText('階段',p.x,p.y);}
 drawEnemyForecast(c);
 if(mode==='attack'&&!busy())for(const b of game.blocks){const p=world.project([b.x+.5,1.0,b.y+.5]);c.font='bold 12px '+gameFont;c.textAlign='center';c.fillStyle='#f2d5a3';c.fillText(b.hp+'/'+b.max,p.x,p.y)}
 let attacker=active();if(overlayView==='forecast'&&attacker&&!game.done&&!busy()&&game.step==='skill'&&mode==='attack'){
 c.save();for(let cell of adjacentCells(attacker,W,H)){if(!inB(cell.x,cell.y))continue;
 let allowed=valid(cell.x,cell.y,lastScene.original),obstacle=blocked(cell.x,cell.y),forbidden=game.phase==='shadow'&&lastScene.original[cell.y][cell.x]===4;
 let points=[[.06,.06],[.94,.06],[.94,.94],[.06,.94]].map(([x,z])=>world.project([cell.x+x,.12,cell.y+z]));
 c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();
 c.fillStyle=allowed?'#ff463c80':obstacle||forbidden?'#8893a32a':'#ffb55b38';c.strokeStyle=allowed?'#ff7064':'#ffc576';c.lineWidth=allowed?4:2;c.setLineDash(allowed?[]:[6,4]);c.fill();c.stroke();
 let p=world.project([cell.x+.5,allowed?1.45:.18,cell.y+.5]);let label=allowed?(obstacle?'破壊':'攻撃'):forbidden?'強い光：不可':obstacle?'遮蔽物':'';
 if(!label)continue;c.font='bold '+(portraitBoard?22:16)+'px '+gameFont;c.textAlign='center';c.lineWidth=4;c.strokeStyle='#10141d';c.strokeText(label,p.x,p.y);c.fillStyle=allowed?'#fff0df':'#ffda99';c.fillText(label,p.x,p.y);
 }c.restore();
 }
 let a=active();if(overlayView==='forecast'&&hover&&a&&!game.done&&mode==='move'&&valid(hover.x,hover.y,lastScene.original)){let path=pathTo(hover.x,hover.y).map(p=>world.project([p.x+.5,.08,p.y+.5]));c.save();c.strokeStyle=game.phase==='light'?'#ffdc7b':'#ba7cff';c.lineWidth=4;c.setLineDash([10,9]);c.shadowColor=c.strokeStyle;c.shadowBlur=7;c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.restore()}
 for(let [kind,d] of Object.entries(game.dogs))if(d.hp>0){let p=world.project([poseFor(kind,d).x+.5,1.08,poseFor(kind,d).z+.5]),col=kind==='light'?'#ffe1a0':'#b393ff';c.fillStyle='#050b18cc';c.fillRect(p.x-24,p.y-10,48,6);c.fillStyle=col;c.fillRect(p.x-24,p.y-10,48*d.hp/d.max,6);if(game.carrier===kind){c.font='bold 14px '+gameFont;c.fillText('◆',p.x,p.y-20)}}
 for(let e of game.enemies)if(e.hp>0){let p=world.project([poseFor('enemy-'+e.id,e).x+.5,e.boss?1.72:1.13,poseFor('enemy-'+e.id,e).z+.5]);c.fillStyle='#080713cc';c.fillRect(p.x-24,p.y-9,48,5);c.fillStyle='#f47777';c.fillRect(p.x-24,p.y-9,48*e.hp/e.max,5)}
}

function render(){syncViews();renderUI();renderMotionUI();if(view==='home')renderHome();if(view==='result')renderResult();if(view==='battle')draw();if(view==='result'&&game.resultFocusPending){game.resultFocusPending=false;$('resultTitle').focus()}}
function pointer(e){let r=canvas.getBoundingClientRect();return world.pick((e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height,W,H,game.m.terrain?(x,y)=>inB(x,y)?floorY(x+.5,y+.5):NaN:undefined)}
canvas.addEventListener('pointermove',e=>{if(busy())return;let p=pointer(e);if(!hover||hover.x!==p.x||hover.y!==p.y){hover=p;draw()}});canvas.addEventListener('pointerleave',()=>{hover=null;draw()});canvas.addEventListener('click',e=>{let p=pointer(e);if(inB(p.x,p.y))use(p.x,p.y)});
setupGameUI();setupCompanionHub({getProfile:()=>profile,save,onChange:()=>render(),canOpen:()=>!questActive()&&!busy(),launchFarm:()=>launchQuest('farm')});setupGachaHub({getProfile:()=>profile,save,onChange:()=>render(),canOpen:()=>!questActive()&&!busy()});init(nextStoryMission());setView('title');let frameAt=0;function animate(t){if(document.hidden){requestAnimationFrame(animate);return}tickAnimation(t);if(t-frameAt>32){frameAt=t;if($('companionDialog').open)drawCompanion();else if(view==='title')drawTitle(reducedMotion?0:t/1000);else if(view==='battle')drawDynamic(t/1000);else if(view==='home'){let d=new MeshBuilder();drawCompanions(d,t/1000);homeWorld.draw(d.v)}}requestAnimationFrame(animate)}requestAnimationFrame(animate);

}
