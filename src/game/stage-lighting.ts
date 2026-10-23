import type {Cell} from './pathfinding';
export type LightClimate='normal'|'radiant'|'umbral';
/** Environmental light is applied before lamps and temporary skills. Cover creates traversable shade in radiant stages. */
export function environmentalBrightness(climate:LightClimate|undefined,p:Cell,blocks:readonly Cell[]):number{
 if(climate!=='radiant')return 0;
 return blocks.some(b=>p.x>=b.x&&p.x<=b.x+3&&Math.abs(p.y-b.y)<=1)?1:3;
}
export function climateRadius(climate:LightClimate|undefined,radius:number){return climate==='umbral'?radius*.58:radius;}
