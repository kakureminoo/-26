/** Shared amounts for quest previews and actual grants; gameplay values are unchanged. */
export const shardReward=(extra:boolean,first:boolean)=>extra&&first?6:2;
export const materialReward=(firstAmount:number,first:boolean)=>first?firstAmount:1;
