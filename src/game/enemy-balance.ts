/** Campaign-only tuning. Practice and legacy saves have no dependency on these values. */
export function campaignEnemyStats<T extends {hp:number;boss?:boolean}>(enemy:T,area:number):T&{damage:number}{
 return {...enemy,hp:Math.ceil(enemy.hp*1.25)+area*2,damage:enemy.boss?4+area:3+Math.floor(area/2)};
}
