import type { Cell } from './pathfinding';
export type StageTheme = 'city' | 'forest' | 'sanctum' | 'abyss' | 'castle';
export interface StageLayout { theme:StageTheme; name:string; width:number; height:number; voids:readonly Cell[] }
// Rectangles are missing floor, not destructible walls. Coordinates remain on the shared 14×8 grid.
type Cut = readonly [number,number,number,number];
const layouts:Record<string,{name:string;cuts:Cut[]}>={
 hunt:{name:'崩れた石広場',cuts:[[0,0,2,0],[11,7,13,7],[0,7,0,7]]},
 relic:{name:'水路を跨ぐ回廊',cuts:[[5,0,8,0],[5,7,8,7],[0,0,0,2],[13,0,13,1],[6,4,6,5]]},
 rescue:{name:'灯台への張り出し',cuts:[[0,0,2,0],[6,0,7,1],[0,7,1,7],[12,0,13,2],[6,6,7,7]]},
 boss:{name:'欠けた円形祭壇',cuts:[[0,0,2,0],[0,1,0,2],[12,0,13,1],[0,7,1,7],[12,6,13,7]]},
 'city-gate':{name:'門前の二つの水路',cuts:[[0,0,1,1],[5,0,7,1],[5,6,7,7],[13,6,13,7],[10,7,12,7]]},
 'forest-edge':{name:'木立を抜ける林道',cuts:[[0,0,1,2],[5,0,8,0],[5,6,6,7],[13,0,13,3],[10,7,13,7]]},
 'forest-ember':{name:'根を巡る木道',cuts:[[0,0,0,3],[5,0,8,1],[5,6,7,7],[13,0,13,4],[8,4,8,4]]},
 'forest-keeper':{name:'三つの林間広場',cuts:[[0,0,2,0],[6,0,8,1],[6,6,8,7],[13,0,13,3],[0,7,1,7]]},
 'forest-crossing':{name:'湿地の渡り橋',cuts:[[0,0,1,1],[5,0,7,1],[5,6,7,7],[9,0,10,1],[13,0,13,4],[0,7,1,7]]},
 'forest-heart':{name:'古木の根元',cuts:[[0,0,3,0],[0,1,1,2],[5,6,6,7],[12,0,13,1],[12,7,13,7],[0,7,0,7]]},
 'castle-gate':{name:'左右の門楼',cuts:[[0,0,2,0],[5,0,7,1],[5,6,7,7],[12,0,13,1],[13,3,13,4]]},
 'castle-ember':{name:'灯庫の十字回廊',cuts:[[0,0,2,1],[7,0,9,1],[7,6,9,7],[13,0,13,3],[0,7,1,7]]},
 'castle-prison':{name:'監獄の折れ回廊',cuts:[[0,0,2,0],[5,0,7,1],[7,5,7,7],[13,0,13,2],[0,7,1,7],[11,7,13,7]]},
 'castle-eclipse':{name:'日蝕の二重回廊',cuts:[[0,0,1,1],[7,0,8,1],[6,6,7,7],[13,0,13,2],[0,7,1,7],[9,7,10,7]]},
 'castle-heart':{name:'玉座の祭壇',cuts:[[0,0,1,1],[0,7,1,7],[5,0,7,0],[5,7,7,7],[13,0,13,2],[13,7,13,7]]},
 'sun-gate':{name:'白い回廊',cuts:[[0,0,2,0],[6,0,8,1],[6,6,8,7],[13,0,13,2],[13,7,13,7]]},
 'sun-relic':{name:'日輪の水路',cuts:[[0,0,1,1],[5,0,7,1],[5,6,7,7],[13,6,13,7],[0,7,0,7]]},
 'sun-rescue':{name:'巡礼の庭',cuts:[[0,0,2,0],[6,0,8,1],[0,7,1,7],[13,0,13,2],[13,7,13,7]]},
 'sun-crossing':{name:'白夜の橋',cuts:[[0,0,1,1],[5,0,7,1],[5,6,7,7],[13,6,13,7],[13,0,13,0]]},
 'sun-heart':{name:'集光炉',cuts:[[0,0,2,0],[0,7,1,7],[12,0,13,1],[13,7,13,7],[13,3,13,3]]},
 'abyss-gate':{name:'闇の裂け目',cuts:[[0,0,1,1],[6,0,8,1],[6,6,8,7],[13,6,13,7],[0,7,0,7]]},
 'abyss-relic':{name:'灯の迷路',cuts:[[0,0,1,1],[5,0,7,1],[5,6,7,7],[13,0,13,2],[13,7,13,7]]},
 'abyss-rescue':{name:'暗い水路',cuts:[[0,0,2,0],[6,0,8,1],[0,7,1,7],[13,0,13,2],[13,6,13,6]]},
 'abyss-crossing':{name:'深淵の渡し',cuts:[[0,0,1,1],[5,0,7,1],[5,6,7,7],[13,6,13,7],[13,1,13,1]]},
 'abyss-heart':{name:'影の水門',cuts:[[0,0,2,0],[0,7,1,7],[12,0,13,1],[13,7,13,7],[13,4,13,4]]},
};
export function stageLayout(stage:{id:string;area?:number}):StageLayout {
 const entry=layouts[stage.id],voids:Cell[]=[];
 for(const [left,top,right,bottom] of entry?.cuts??[])for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)voids.push({x,y});
 return {theme:['trial','rematch','heights'].includes(stage.id)?'castle':stage.area===1?'forest':stage.area===2?'sanctum':stage.area===3?'abyss':stage.area===4?'castle':'city',name:entry?.name??'戦術演習場',width:14,height:8,voids};
}
export function stageContains(layout:StageLayout,x:number,y:number):boolean {
 return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<layout.width&&y<layout.height&&!layout.voids.some(p=>p.x===x&&p.y===y);
}
