import type { Cell } from './pathfinding';
export const obstacleMaxHP=3;
export interface Obstacle extends Cell {hp:number;max:number;created?:boolean}
export function createObstacle(x:number,y:number,created=false):Obstacle{return {x,y,hp:obstacleMaxHP,max:obstacleMaxHP,created};}
export function strikeObstacle(obstacle:Obstacle,attack:number){
 const damage=Math.min(obstacle.hp,Math.max(0,Math.floor(attack))),hp=obstacle.hp-damage;
 return {damage,hp,destroyed:hp===0};
}
