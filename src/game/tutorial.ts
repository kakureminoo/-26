/** Contextual help only; never forces moves or changes battle rules/rewards. */
export function tutorialHint(state:{round:number;phase:string;step:string;acted:readonly string[]}){
 if(state.round>1)return {number:4,title:'敵の予告を読む',text:'赤い印は次の攻撃先。移動や光・影の技で備えよう。'};
 if(state.phase==='enemy')return {number:4,title:'敵の予告を読む',text:'敵は予告したマスへ行動する。次の手番で安全な道を選ぼう。'};
 if(state.phase==='shadow')return {number:3,title:'影の猟犬を動かす',text:'暗い床ほど少ない移動コストで進める。強い光には入れない。'};
 if(state.step==='skill')return {number:2,title:'技を一つ選ぶ',text:'隣の敵を攻撃するか、灯火を動かして道を照らそう。'};
 return {number:1,title:'行き先を選ぶ',text:'枠のあるマスへ移動できる。自分のマスを選ぶと移動を省略。'};
}
