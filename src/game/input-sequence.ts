export function createInputSequence(){
 const sequence='kakikuremino';
 let index=0,last=-Infinity;
 return (key:string,time:number,invalid=false)=>{
  if(key==='Shift'&&!invalid&&index===0)return false;
  if(invalid||time-last>=10000)index=0;
  if(invalid){last=time;return false;}
  index=key===sequence[index]?index+1:key===sequence[0]?1:0;
  last=time;
  if(index!==sequence.length)return false;
  index=0;return true;
 };
}
export function grantInputResources(profile:{roster:{stones:number};expansion:{shards:number};materials:{metal:number;crystal:number}}){
 profile.roster.stones+=1000;profile.expansion.shards+=1000;
 profile.materials.metal+=1000;profile.materials.crystal+=1000;
}
