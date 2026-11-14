const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=__dirname;
const html=fs.readFileSync(root+'/index.html','utf8'),code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const overlap=code.slice(code.indexOf('function overlaps('),code.indexOf('// Keep the selected'));
const place=code.slice(code.indexOf('function placeMapLabel('),code.indexOf('function drawEnclosures('));
const scope={};vm.createContext(scope);vm.runInContext(fs.readFileSync(root+'/atlas-data.js','utf8')+'\n'+overlap+place+'\nthis.scenes=register.scenes;this.place=placeMapLabel;this.overlap=overlaps;',scope);
let cases=0,fallbacks=0;
for(const [width,height] of [[320,220],[390,360],[768,440],[938,500],[980,720]])for(const scene of scope.scenes){
 const top=40,bottom=height-64,home=scene.home,points=scene.nodes.map(n=>n.position);
 for(const frame of scene.enclosures||[])for(let i=0;i<8;i++)points.push(frame.center.map((v,k)=>v+(i&(1<<k)?1:-1)*frame.extent[k]));
 const rotate=([x,y,z])=>{let xx=x*Math.cos(home.yaw)-z*Math.sin(home.yaw),zz=x*Math.sin(home.yaw)+z*Math.cos(home.yaw),yy=y*Math.cos(home.pitch)-zz*Math.sin(home.pitch),depth=y*Math.sin(home.pitch)+zz*Math.cos(home.pitch),f=68/(68+depth);return {xx,yy,f};};
 let mx=1,my=1;for(const p of points){const r=rotate(p);mx=Math.max(mx,Math.abs(r.xx*r.f));my=Math.max(my,Math.abs(r.yy*r.f));}
 const side=Math.min(100,width*.15),vert=Math.min(28,(bottom-top)*.15),unit=Math.max(.5,Math.min((width-2*side)/(2*mx),(bottom-top-2*vert)/(2*my)));
 const nodes=scene.nodes.map(n=>{const p=rotate(n.position);return {...n,x:width/2+p.xx*unit*p.f,y:(top+bottom)/2-p.yy*unit*p.f,r:(n.kind==='sun'?10:5.5)*p.f};});
 for(const selected of nodes){
  const critical=nodes.filter(n=>n.id===selected.id||n.kind==='sun').sort((a,b)=>(b.id===selected.id)-(a.id===selected.id));
  const occupied=[],avoid=nodes.map(n=>({x:n.x-n.r-5,y:n.y-n.r-5,w:2*n.r+10,h:2*n.r+10})),bounds={x:8,y:top-12,w:width-16,h:bottom+12-(top-12)};
  for(const n of critical){
   const textWidth=(n.name.replace(' · Grian Sun','').length+(n.order?4:0))*8;
   const b=scope.place(n,textWidth,true,occupied,avoid,bounds);
   assert(b,`${scene.id} ${width}: missing ${n.id}`);assert(b.x>=bounds.x&&b.y>=bounds.y&&b.x+b.w<=bounds.x+bounds.w&&b.y+b.h<=bounds.y+bounds.h,`out of bounds ${n.id}`);
   assert(!occupied.some(o=>scope.overlap(o,b)),`${scene.id} ${width} selected ${selected.id}: overlapping ${n.id}`);
   occupied.push(b);fallbacks+=+!!b.leader;
  }cases++;
 }
}
assert.equal((html.match(/class="external-icon"/g)||[]).length,2);assert(!html.includes('Full window ↗'));
assert(code.includes("'#9ab2c3cc'"));assert(code.includes("e.kind==='reported_last_leg'?[2,6]"));assert(code.includes("e.kind==='time_reversal'?[7,4]"));
console.log({cases,fallbacks,status:'Selected-place and sun labels stay visible and non-overlapping at five sizes; link icons and route styles verified.'});
