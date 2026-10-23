import type {Cell} from './pathfinding';
export type WideAttackType='nightfall'|'solarFlare';
export interface WideAttackShape {type:string;cells:readonly Cell[];refuges?:readonly Cell[]}
export function wideAttackInfo(type:string){
 if(type==='nightfall')return {name:'夜蝕',protection:'封印陣 または 明るさ3〜4',color:'#b99bfa'};
 if(type==='solarFlare')return {name:'白灼',protection:'封印陣 または 明るさ0〜1',color:'#ffcc85'};
 return undefined;
}
export function wideAttackProtected(plan:WideAttackShape,cell:Cell,field:readonly (readonly number[])[]):boolean{
 if(!wideAttackInfo(plan.type))return false;
 if(plan.refuges?.some(p=>p.x===cell.x&&p.y===cell.y))return true;
 const v=field[cell.y]?.[cell.x];
 return v!==undefined&&(plan.type==='nightfall'?v>=3:v<=1);
}
/** Each rune is fixed when the forecast is created. All candidates are checked against the actual floor. */
export function wideAttackArea(width:number,height:number,walkable:(x:number,y:number)=>boolean,blocks:readonly Cell[]){
 const cells:Cell[]=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(walkable(x,y))cells.push({x,y});
 const refuges=[{x:2,y:4},{x:3,y:6},{x:8,y:3},{x:11,y:5}].filter(p=>p.x<width&&p.y<height&&walkable(p.x,p.y)&&!blocks.some(b=>b.x===p.x&&b.y===p.y));
 return {cells,refuges};
}
