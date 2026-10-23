export const tacticsStage={
 id:'tactics',goal:'hunt',name:'明暗の連携演習',type:'戦術演習',practice:true,
 desc:'影鎧兵は照らすと防御が崩れる。灯射兵は暗くするか、遮蔽物で射線を遮る。',
 reward:'報酬なし・育成や素材の消耗なし',
 blocks:[[2,2],[7,2],[7,6]],enemies:[{x:6,y:4,hp:5,kind:'shadeGuard'},{x:8,y:4,hp:5,kind:'sunArcher'}],
 lights:[{x:9,y:4,r:3},{x:11,y:1,r:3}],
 spawn:{light:{x:4,y:4},shadow:{x:5,y:5}},lamp:{x:3,y:3},charge:3,
};
