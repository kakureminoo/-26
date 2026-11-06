import {expect,it} from 'vitest';
import {createInputSequence,grantInputResources} from '../src/game/input-sequence';
import {campaignQuests,endgameVisible,visibleStoryQuests,questUnlocked} from '../src/game/campaign';
const sequence='kakikuremino';
it('accepts the complete sequence repeatedly and adds each resource',()=>{
 const match=createInputSequence();const p={roster:{stones:3},expansion:{shards:7},materials:{metal:2,crystal:9}};
 for(let n=0;n<2;n++)for(const [i,key] of [...sequence].entries())if(match(key,n*100+i))grantInputResources(p);
 expect(p).toEqual({roster:{stones:2003},expansion:{shards:2007},materials:{metal:2002,crystal:2009}});
});
it('rejects other keys, modifiers, repeats and a ten second gap',()=>{
 for(const interrupt of ['wrong','timeout','repeat','modifier']){
 const match=createInputSequence();match('k',0);
 if(interrupt==='wrong')match('x',1);
 if(interrupt==='modifier')match('c',1,true);
 const results=[...sequence.slice(1)].map((key,i)=>match(key,(interrupt==='timeout'?10000:2)+i,interrupt==='repeat'&&i===0));
 expect(results.some(Boolean)).toBe(false);
 }
});
it('keeps at most one locked story stage across all progress states',()=>{
 for(let i=0;i<=campaignQuests.length;i++){
 const cleared=campaignQuests.slice(0,i).map(q=>q.id);
 const visible=visibleStoryQuests(cleared);
 expect(visible.filter(q=>!questUnlocked(q.id,cleared)).length).toBeLessThanOrEqual(1);
 expect(visible.filter(q=>cleared.includes(q.id))).toHaveLength(i);
 expect(endgameVisible(cleared)).toBe(i===campaignQuests.length);
 }
 expect(endgameVisible([])).toBe(false);
});

it('rejects the former sequence',()=>{const match=createInputSequence();expect([..."Abcdefghijklmnopqrstuvwxyz"].some((key,i)=>match(key,i))).toBe(false);});
