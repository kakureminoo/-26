import { campaignQuests, type QuestGoal } from './campaign';
export function clearCondition(id: string): string {
  const mission = campaignQuests.find(q => q.id === id);
  if (mission?.goal === 'relic') return '灯芯を確保し、その場から帰還する';
  if (mission?.goal === 'rescue') return '灯守を救助した猟犬が、金色の帰還地点へ戻る';
  if (mission?.goal === 'boss') return mission.id==='castle-heart'?'光喰らい・影喰らいの両方を倒す':'ボス「'+mission.name+'」を倒す';
  return 'すべての敵を倒す';
}
export function adjacentCells(origin: { x: number; y: number }, width: number, height: number) {
  return [[0, -1], [1, 0], [0, 1], [-1, 0]]
    .map(([dx, dy]) => ({ x: origin.x + dx, y: origin.y + dy }))
    .filter(p => p.x >= 0 && p.x < width && p.y >= 0 && p.y < height);
}

/** Recovery and rescue must be resolved by the carrier returning, never by kills. */
export function combatObjectiveComplete(goal: QuestGoal, enemies: readonly {hp: number; boss?: boolean}[]): boolean {
  if (goal === 'boss') return enemies.some(e => e.boss) && enemies.filter(e => e.boss).every(e => e.hp <= 0);
  return goal === 'hunt' && enemies.length > 0 && enemies.every(e => e.hp <= 0);
}

/** Supplies permit extraction in place; rescue keeps escorting unless the field is safe. */
export function extractionState(goal:QuestGoal,picked:boolean,carrierHP:number,enemies:readonly {hp:number}[]){
 const carrying=picked&&carrierHP>0&&(goal==='relic'||goal==='rescue');
 const safe=enemies.every(e=>e.hp<=0);
 return {available:carrying&&(goal==='relic'||safe),automatic:carrying&&safe};
}
