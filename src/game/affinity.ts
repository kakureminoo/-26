export type DogKind = "light" | "shadow";
export type Brightness = 0 | 1 | 2 | 3 | 4;
export const luminanceNames=['濃い影','暗がり','薄明','明るい','強い光'];
export const affinity={
 light:[{attack:-1,armor:0,evade:0},{attack:0,armor:0,evade:0},{attack:0,armor:0,evade:0},{attack:1,armor:0,evade:0},{attack:2,armor:1,evade:0}],
 shadow:[{attack:2,armor:0,evade:.55},{attack:1,armor:0,evade:.30},{attack:0,armor:0,evade:.10},{attack:-1,armor:0,evade:0},{attack:-2,armor:0,evade:0}]
};

export const movementBudget:Record<DogKind,number>={light:6,shadow:8};
export function movementCost(kind:DogKind,level:Brightness):number {
 return (kind==='light'?[3,2,2,1,1]:[1,2,3,3,Infinity])[level];
}
export function shadowCost(level: Brightness): number { return movementCost("shadow",level); }
