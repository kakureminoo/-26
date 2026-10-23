export function rankProgress(user:unknown,uxp:unknown){
 const rank=Number.isFinite(user)?Math.max(1,Math.floor(user as number)):1;
 const required=rank*3,xp=Number.isFinite(uxp)?Math.max(0,Math.floor(uxp as number)):0;
 return {rank,xp,required,remaining:Math.max(0,required-xp),fraction:Math.min(1,xp/required)};
}
export function grantRankXP(user:unknown,uxp:unknown,earned:number){
 let {rank,xp}=rankProgress(user,uxp);xp+=(Number.isFinite(earned)?Math.max(0,Math.floor(earned)):0);
 while(xp>=rank*3){xp-=rank*3;rank++;}
 return {user:rank,uxp:xp};
}
