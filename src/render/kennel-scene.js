/** Hand-built stone courtyard. All assets are original geometry. */
export function buildKennel(m, chapter){
  m.box([0,-.24,0],[14,.44,10],[.055,.07,.083]);
  for(let x=-6;x<=6;x++)for(let z=-4;z<=4;z++){
    const n=((x*7+z*11+99)%9)/100;
    m.box([x,.005,z],[.975,.075,.975],[.10+n*.4,.125+n*.4,.15+n*.5]);
    if((x+z)%4===0)m.rod([x-.35,.046,z-.2],[x+.1,.046,z+.18],.004,[.035,.045,.052]);
  }
  // Brass-inlaid compass rose beneath the companions.
  for(let i=0;i<64;i++){
    const a=i/64*Math.PI*2,b=(i+1)/64*Math.PI*2;
    for(const r of [2.2,2.35])m.rod([Math.cos(a)*r,.052,Math.sin(a)*r*.65+.3],[Math.cos(b)*r,.052,Math.sin(b)*r*.65+.3],.009,[.38,.29,.14]);
  }
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,p=r=>[Math.cos(a)*r,.055,Math.sin(a)*r*.65+.3];
    m.tri(p(.4),[Math.cos(a+.07)*1.8,.055,Math.sin(a+.07)*1.8*.65+.3],p(2.0),[.21,.18,.12]);
    m.tri(p(.4),p(2.0),[Math.cos(a-.07)*1.8,.055,Math.sin(a-.07)*1.8*.65+.3],[.42,.32,.16]);
  }
  // Individual blocks and an open arch give the courtyard a sense of depth.
  for(let row=0;row<7;row++)for(let col=-6;col<=6;col++){
    const x=col*.74+(row%2)*.37,y=row*.4+.2;
    if(Math.abs(x)<1.1&&y<1.9)continue;
    m.box([x,y,-3.0],[.71,.375,.48],[.095+row*.005,.12+row*.005,.145+row*.005]);
  }
  for(const side of [-1,1]){
    for(let h=0;h<5;h++)m.box([side*1.16,h*.36+.18,-2.69],[.32,.34,.38],[.24,.25,.24]);
    for(let i=0;i<6;i++){
      const a=i/12*Math.PI+(side<0?Math.PI/2:0),b=(i+1)/12*Math.PI+(side<0?Math.PI/2:0);
      m.quad([Math.cos(a)*1.35,1.7+Math.sin(a)*1.1,-2.45],[Math.cos(b)*1.35,1.7+Math.sin(b)*1.1,-2.45],[Math.cos(b)*1.03,1.7+Math.sin(b)*.86,-2.45],[Math.cos(a)*1.03,1.7+Math.sin(a)*.86,-2.45],[.24,.25,.24]);
    }
    const x=side*3.45;
    m.box([x,1.45,-2.3],[.62,2.9,.65],[.12,.145,.16]);
    for(const y of [.1,.36,1.5,2.7,2.9])m.box([x,y,-2.3],[.8,.12,.8],[.24,.25,.24]);
    // Hanging house banners: gold for light and blue-black for shadow.
    m.rod([side*2.25,2.35,-2.55],[side*1.45,2.35,-2.55],.018,[.43,.32,.15]);
    const bx=side*1.85,col=side<0?[.22,.15,.07]:[.035,.105,.135];
    m.quad([bx-.28,2.32,-2.51],[bx+.28,2.32,-2.51],[bx+.28,1.25,-2.49],[bx-.28,1.25,-2.49],col);
    m.tri([bx-.28,1.25,-2.49],[bx+.28,1.25,-2.49],[bx,1.06,-2.49],col);
    m.rod([bx,1.5,-2.46],[bx,2.12,-2.46],.012,[.55,.45,.23]);
    m.rod([bx-.16,1.80,-2.46],[bx+.16,1.80,-2.46],.012,[.55,.45,.23]);
    // Low stone braziers and plants frame the stage without covering the dogs.
    m.box([side*2.55,.12,-.8],[.7,.2,.7],[.15,.17,.18]);m.lantern(side*2.55,-.8);
    for(let i=0;i<9;i++){
      const a=i*2.4,px=x+Math.cos(a)*.30,py=.4+i*.19;
      m.rod([x,py-.2,-1.96],[px,py,-1.93],.008,[.075,.12,.065]);
      m.sphere([px,py,-1.93],[.065,.12,.025],[.075,.15,.10],7,4);
    }
    for(let i=0;i<5;i++)m.box([side*(3+i*.26),.38,1.2],[.22,.11,.7],[.17,.12,.07]);
    for(const a of [3.05,4])m.box([side*a,.17,1.2],[.13,.38,.64],[.11,.13,.14]);
  }
  if(chapter>=3)m.lantern(.1,-2);
}
