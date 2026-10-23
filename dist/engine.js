export const VERSION='0.1.1';
export const SIDES=['北侧','东侧','南侧','西侧'];
export const ACTIONS=['balanced','reinforce_north','reinforce_east','reinforce_south','reinforce_west','resupply','fallback','focus_heavy'];
export const ACTION_LABELS=['均衡防守','北侧增援','东侧增援','南侧增援','西侧增援','优先补给','收缩防线','集火重型'];
export const AMMO={n556:'5.56',n9:'9mm',shell:'12号',n762:'7.62',g40:'40mm',n50:'12.7'};
const ENGAGEMENT={m4:95,mp5:70,benelli:40,m249:125,m110:220,m203:100,m2:180};
export const SOURCES=[
 {name:'M4A1 · 澳大利亚海军',url:'https://www.navy.gov.au/capabilities/weapons/m4a1-carbine'},
 {name:'MP5 · Heckler & Koch',url:'https://www.heckler-koch.com/en/Products/Military%20and%20Law%20Enforcement/Submachine%20guns/MP5'},
 {name:'Benelli M4 · Benelli Defense',url:'https://www.benellidefense.com/product/m4-a1-185/'},
 {name:'M249 · U.S. Ordnance',url:'https://www.usord.com/weapons/m249'},
 {name:'M110 · 美国陆军',url:'https://cpeground.army.mil/Equipment/Equipment-Portfolio/PM-SL-Portfolio/M110-Semi-Automatic-Sniper-System/'},
 {name:'M203 · 美国陆军',url:'https://www.peosoldier.army.mil/Equipment/Equipment-Portfolio/Project-Manager-Soldier-Lethality-Portfolio/M203-M203A1-M203A2-Grenade-Launcher/'},
 {name:'M2HB · U.S. Ordnance',url:'https://www.usord.com/weapons/m2hb'}
];
// Magazine, cartridge and published range use the linked references.
// Damage, handling reload, practical cadence and accuracy are game approximations.
export const WEAPONS={
 m4:{name:'M4A1',role:'步枪兵',icon:'R',ammo:'n556',mag:30,carry:90,range:500,reload:2.7,rpm:800,burst:3,pause:.65,damage:60,accuracy:.78,pierce:.12,color:'#9bc9a5'},
 mp5:{name:'MP5',role:'冲锋枪手',icon:'S',ammo:'n9',mag:30,carry:120,range:100,reload:2.4,rpm:800,burst:5,pause:.4,damage:37,accuracy:.79,pierce:0,color:'#84d3bd',rangeApprox:true},
 benelli:{name:'Benelli M4',role:'霰弹兵',icon:'B',ammo:'shell',mag:7,carry:21,range:45,reload:4.6,rpm:90,burst:1,pause:0,damage:132,accuracy:.82,pierce:.05,color:'#e9b873',rangeApprox:true},
 m249:{name:'M249',role:'机枪手',icon:'M',ammo:'n556',mag:100,carry:200,range:800,reload:6.4,rpm:800,burst:8,pause:.45,damage:59,accuracy:.65,pierce:.18,color:'#83b4df',belt:true},
 m110:{name:'M110',role:'精确射手',icon:'D',ammo:'n762',mag:20,carry:60,range:800,reload:3.1,rpm:65,burst:1,pause:0,damage:132,accuracy:.9,pierce:.6,color:'#c7b9ea'},
 m203:{name:'M203',role:'榴弹手',icon:'G',ammo:'g40',mag:1,carry:6,range:350,minRange:20,reload:4.8,rpm:60,burst:1,pause:0,damage:180,accuracy:.76,pierce:.45,blast:7,color:'#e4a184'},
 m2:{name:'M2HB',role:'固定机枪',icon:'H',ammo:'n50',mag:100,carry:200,range:2000,reload:7.5,rpm:500,burst:5,pause:.5,damage:152,accuracy:.8,pierce:.88,color:'#c4d997',belt:true,fixed:true}
};
export class RNG{
 constructor(seed){this.state=(Number(seed)>>>0)||741923;}
 next(){let t=this.state+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
 int(n){return Math.floor(this.next()*n);}
 pick(a){return a[this.int(a.length)];}
 shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=this.int(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
}
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const zeros=()=>({n556:0,n9:0,shell:0,n762:0,g40:0,n50:0});
export const WORLD=400;
const CENTER={x:200,y:205};
function segmentHit(a,b,r){
 let lo=0,hi=1;
 for(const k of ['x','y']){
  const d=b[k]-a[k],mn=r[k],mx=mn+r[k==='x'?'w':'h'];
  if(Math.abs(d)<1e-8){if(a[k]<mn||a[k]>mx)return false;}
  else{let l=(mn-a[k])/d,h=(mx-a[k])/d;if(l>h)[l,h]=[h,l];lo=Math.max(lo,l);hi=Math.min(hi,h);if(lo>hi)return false;}
 }
 return hi>0.002&&lo<.998;
}
export function rulesDecision(f){
 if(f[17]>.65&&f[21]<.65)return {action:'fallback',confidence:1};
 if(f[13]>.48&&f[12]>.015)return {action:'resupply',confidence:1};
 return {action:'balanced',confidence:1};
}
export class Game{
 constructor({seed=Date.now(),aiEnabled=true,aiProvider=null}={}){
  this.rng=new RNG(seed);this.seed=this.rng.state;this.aiProvider=aiProvider;this.aiEnabled=aiEnabled;
  this.phase='home';this.time=0;this.nodeIndex=-1;this.wave=0;this.waveTime=0;this.nodeTime=0;this.id=1;
  this.stock={n556:2400,n9:0,shell:120,n762:0,g40:0,n50:0};
  this.acquired={...this.stock};this.fired=zeros();this.lost=zeros();
  this.soldiers=[];this.enemies=[];this.effects=[];this.logs=[];this.events=[];this.choices=[];
  this.kills=0;this.spawned=0;this.dead=0;this.rewardCount=0;this.routeHistory=[];
  this.mod={reload:1,carry:1,armor:0,doors:1};this.tactic='balanced';this.decisionAge=99;this.decisions=0;this.neuralDecisions=0;
  this.aiState={action:'balanced',confidence:0,source:aiEnabled?'loading':'rules',reason:'等待战术态势'};
  this.lastAiAction='';this.supplyRuns=0;this.selectedId=null;this.lastCheckpoint=null;
  this.map=this.makeMap('warehouse');this.core={...CENTER,hp:1500,max:1500};this.setupGates();
  for(let i=0;i<12;i++)this.addSoldier(i<8?'m4':i<10?'benelli':'m249',false);
  this.deploy();this.log('全队集结','12名队员已就位。选择路线后自动部署。');
 }
 attachAI(provider){this.aiProvider=provider;}
 log(title,text){const e={time:this.time,title,text};this.logs.unshift(e);this.logs=this.logs.slice(0,36);this.events.push(e);}
 drainEvents(){const a=this.events;this.events=[];return a;}
 living(){return this.soldiers.filter(s=>s.hp>0);}
 addSoldier(weapon='m4',giveAmmo=true){
  if(this.living().length>=35)return null;
  const w=WEAPONS[weapon];
  if(giveAmmo)this.gainAmmo(w.ammo,weapon==='m4'?90:w.carry);
  const s={id:this.id++,x:200,y:205,hp:100,maxHP:100,weapon,mag:0,reserve:0,cooldown:this.rng.next(),reload:0,burst:0,side:0,goal:null,path:[],task:'guard',supply:null,supplyAssigned:null,travel:0,kills:0,shots:0,armor:0};
  this.soldiers.push(s);
  this.takeAmmo(s,w.carry);
  return s;
 }
 takeAmmo(s,amount){
  const w=WEAPONS[s.weapon],n=Math.min(amount,this.stock[w.ammo]||0,this.capacity(s)-s.mag-s.reserve);
  this.stock[w.ammo]-=n;s.reserve+=n;
  const load=Math.min(w.mag-s.mag,s.reserve);s.mag+=load;s.reserve-=load;
  return n;
 }
 capacity(s){return Math.round(WEAPONS[s.weapon].carry*this.mod.carry);}
 gainAmmo(type,n){this.stock[type]=(this.stock[type]||0)+n;this.acquired[type]=(this.acquired[type]||0)+n;}
 makeMap(template){
  const x=130,y=135,w=140,h=140,g=16,t=2;
  const walls=[
   {x,y,w:62,h:t},{x:208,y,w:62,h:t},{x,y:y+h-t,w:62,h:t},{x:208,y:y+h-t,w:62,h:t},
   {x,y,w:t,h:62},{x,y:213,w:t,h:62},{x:x+w-t,y,w:t,h:62},{x:x+w-t,y:213,w:t,h:62}
  ];
  const crates=template==='house'?[{x:158,y:174,w:15,h:20},{x:228,y:228,w:16,h:18}]:template==='yard'?[{x:166,y:230,w:19,h:8},{x:227,y:169,w:8,h:19}]:[{x:154,y:165,w:18,h:13},{x:226,y:237,w:20,h:12}];
  return {template,walls,crates,house:{x,y,w,h},depot:{x:200,y:205}};
 }
 setupGates(){
  const points=[{x:200,y:135},{x:270,y:205},{x:200,y:275},{x:130,y:205}];
  this.gates=points.map((p,i)=>({...p,side:i,hp:700*this.mod.doors,max:700*this.mod.doors}));
  this.navVersion=(this.navVersion||0)+1;
 }
 start(){if(this.phase==='home'){this.phase='route';this.choices=this.routeChoices();}}
 routeChoices(){
  const stage=this.nodeIndex+1;
  const templates=this.rng.shuffle(['warehouse','house','yard']);
  return [0,1].map((v)=>({id:'route-'+stage+'-'+v,template:templates[v],mode:stage===0||stage===3?'clear':v===0?'clear':'hold',danger:v===0?0:1,flavor:v===0?'ammo':'rescue',name:templates[v]==='warehouse'?'废弃仓库':templates[v]==='house'?'封锁住宅':'围墙院落',reward:v===0?'弹药补给':'救援队员',description:stage===3?'发现母体活动，完成最终清剿。':v===0?'清理入侵尸群，取得有限弹药。':stage===0?'清剿尸群，接应幸存人员。':'守住据点核心，接应幸存人员。'}));
 }
 enterNode(choice){
  if(this.phase!=='route')return false;
  this.nodeIndex++;this.node={...choice};this.routeHistory.push({...choice,stage:this.nodeIndex});
  this.wave=0;this.nodeTime=0;this.enemies=[];this.effects=[];
  this.map=this.makeMap(choice.template);this.setupGates();this.core={...CENTER,hp:1500,max:1500};
  for(const s of this.living()){s.hp=s.maxHP;s.supply=null;s.supplyAssigned=null;s.task='guard';s.path=[];s.reload=0;s.goal=null;s.mount=null;s.setup=3;}
  this.deploy();this.beginWave();
  this.log('据点 '+(this.nodeIndex+1),choice.name+' · '+(choice.mode==='hold'?'限时坚守':'清剿')+'。幸存者恢复生命，弹药按原库存保留。');
  return true;
 }
 beginWave(){
  this.wave++;this.waveTime=0;this.phase='combat';this.spawnClock=.3;this.remaining=80+this.nodeIndex*30+(this.wave-1)*20+(this.node.danger?16:0);
  this.spawnInterval=(50+this.nodeIndex*13+(this.wave-1)*12)/Math.ceil(this.remaining/12);
  this.holdDuration=70+this.nodeIndex*4;this.waveSpawned=0;this.bossSpawned=false;
  this.decisionAge=99;this.log('第 '+this.wave+' / 2 波',this.node.mode==='hold'?'守住核心至倒计时结束。':'清除本波全部敌人。');
 }
 deploy(){
  const alive=this.living(),pressure=this.sidePressure();
  let priority=-1;if(this.tactic.startsWith('reinforce_'))priority=ACTIONS.indexOf(this.tactic)-1;
  const order=[0,1,2,3];
  if(priority>=0){order.splice(order.indexOf(priority),1);order.unshift(priority,priority);}
  let i=0;
  for(const s of alive){
   if(s.task==='supply')continue;
   if(WEAPONS[s.weapon].fixed&&s.mount){s.goal={...s.mount};s.path=[];continue;}
   const side=order[i%order.length];s.side=side;
   const slot=Math.floor(i/order.length),offset=(slot%5-2)*4.1;
   const g=this.gates[side];let p;
   const depth=this.tactic==='fallback'?39:WEAPONS[s.weapon].fixed?12:9+(slot%2)*5;
   if(side===0)p={x:g.x+offset,y:g.y+depth};
   if(side===1)p={x:g.x-depth,y:g.y+offset};
   if(side===2)p={x:g.x+offset,y:g.y-depth};
   if(side===3)p={x:g.x+depth,y:g.y+offset};
   if(this.phase==='home'){s.x=p.x;s.y=p.y;}
   this.setGoal(s,p);i++;
  }
 }
 sidePressure(){
  const result=[0,0,0,0];
  for(const z of this.enemies||[])if(z.hp>0){const d=dist(z,this.gates?.[z.side]||CENTER);result[z.side]+=Math.max(0,1-d/110)*(z.kind==='heavy'?1.8:z.kind==='mother'?5:1);}
  return result;
 }
 features(){
  const alive=this.living(),pressure=this.sidePressure(),f=[];
  for(let i=0;i<4;i++)f.push(clamp(pressure[i]/24));
  for(const g of this.gates)f.push(clamp(g.hp/g.max));
  for(let i=0;i<4;i++){const units=alive.filter(s=>s.side===i);f.push(units.length?units.reduce((a,s)=>a+(s.mag+s.reserve)/this.capacity(s),0)/units.length:0);}
  const stock=Object.values(this.stock).reduce((a,b)=>a+b,0);
  f.push(clamp(stock/2400),alive.filter(s=>s.mag+s.reserve===0).length/Math.max(1,alive.length),alive.length/35,alive.reduce((a,s)=>a+s.hp/s.maxHP,0)/Math.max(1,alive.length));
  const enemies=this.enemies.filter(z=>z.hp>0);
  f.push(enemies.filter(z=>z.armor>0).length/Math.max(1,enemies.length),clamp(enemies.filter(z=>dist(z,CENTER)<45).length/12),clamp(this.node?.mode==='hold'?this.waveTime/this.holdDuration:this.waveSpawned/(this.waveSpawned+this.remaining||1)),alive.filter(s=>s.task==='supply').length/Math.max(1,alive.length),this.dead/Math.max(1,this.dead+alive.length),this.core.hp/this.core.max,enemies.some(z=>z.kind==='mother')?1:0,clamp(alive.reduce((a,s)=>a+dist(s,CENTER),0)/Math.max(1,alive.length)/100));
  return f.map(x=>Number.isFinite(x)?clamp(x):0);
 }
 decide(){
  const f=this.features();let d,source='rules';
  if(this.aiEnabled&&this.aiProvider){
   try{d=this.aiProvider(f);if(ACTIONS.includes(d.action)&&Number.isFinite(d.confidence)&&d.confidence>=.3){source='neural';}else d=null;}catch{d=null;}
  }
  if(!d)d=rulesDecision(f);
  if(d.action==='resupply'&&Object.values(this.stock).every(x=>x<=0)){d=rulesDecision(f);source='rules';}
  this.tactic=d.action;this.decisions++;if(source==='neural')this.neuralDecisions++;
  const chosenSide=ACTIONS.indexOf(d.action)-1;
  const reason=d.action==='resupply'?'缺弹比例 '+Math.round(f[13]*100)+'%，调派士兵优先运送兼容弹药。':d.action==='fallback'?'核心附近出现威胁，保留补给通道并收缩阵位。':d.action==='focus_heavy'?'识别到护具或母体目标，调整集火优先级。':d.action==='balanced'?'保持四向警戒，按需安排搬运。':SIDES[chosenSide]+'需要增援，调整队员站位与射击侧重。';
  this.aiState={action:d.action,confidence:d.confidence,source,reason,features:f};
  if(this.lastAiAction!==d.action){this.log(source==='neural'?'AI 战术更新':'常规策略',ACTION_LABELS[ACTIONS.indexOf(d.action)]+' · '+reason);this.lastAiAction=d.action;this.deploy();}
 }
 setAI(on){this.aiEnabled=!!on;this.decisionAge=99;this.lastAiAction='';}
 blocked(x,y,r=1.1){
  if(x<2||y<2||x>WORLD-2||y>WORLD-2)return true;
  for(const o of [...this.map.walls,...this.map.crates])if(x>o.x-r&&x<o.x+o.w+r&&y>o.y-r&&y<o.y+o.h+r)return true;
  return false;
 }
 setGoal(s,p){
  if(s.goal&&dist(s.goal,p)<2.5)return;
  s.goal={...p};s.path=this.findPath(s,p);
 }
 findPath(a,b){
  if(!this.map.crates.some(r=>segmentHit(a,b,{x:r.x-2,y:r.y-2,w:r.w+4,h:r.h+4})))return [{...b}];
  const step=5,start=[Math.round(a.x/step),Math.round(a.y/step)],end=[Math.round(b.x/step),Math.round(b.y/step)];
  const key=(x,y)=>x+','+y,open=[{x:start[0],y:start[1],g:0,f:0}],seen=new Map(),done=new Set();seen.set(key(...start),{parent:null});
  let last=null,iterations=0;
  while(open.length&&iterations++<1800){
   open.sort((a,b)=>a.f-b.f);const n=open.shift(),k=key(n.x,n.y);if(done.has(k))continue;done.add(k);
   if(n.x===end[0]&&n.y===end[1]){last=n;break;}
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const x=n.x+dx,y=n.y+dy,nk=key(x,y);
    if(x<27||x>53||y<28||y>54||this.blocked(x*step,y*step,1.8)||done.has(nk))continue;
    const g=n.g+1,old=seen.get(nk);if(!old||g<old.g){seen.set(nk,{g,parent:k});open.push({x,y,g,f:g+Math.abs(x-end[0])+Math.abs(y-end[1])});}
   }
  }
  if(!last)return [{...b}];
  const path=[{...b}];let k=key(last.x,last.y);
  while(k){const [x,y]=k.split(',').map(Number);path.push({x:x*step,y:y*step});k=seen.get(k)?.parent;}
  return path.reverse().slice(1);
 }
 move(s,dt,speed){
  const p=s.path[0]||s.goal;if(!p)return;
  const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy);if(d<1.2){if(s.path.length)s.path.shift();return;}
  const step=Math.min(d,speed*dt),nx=s.x+dx/d*step,ny=s.y+dy/d*step;
  if(!this.blocked(nx,ny)){s.x=nx;s.y=ny;s.travel+=step;}
  else if(!this.blocked(nx,s.y)){s.travel+=Math.abs(nx-s.x);s.x=nx;}
  else if(!this.blocked(s.x,ny)){s.travel+=Math.abs(ny-s.y);s.y=ny;}
 }
 los(a,b){return !this.map.walls.some(r=>segmentHit(a,b,r))&&!this.map.crates.some(r=>segmentHit(a,b,r));}
 spawnEnemy(forceKind=null,forceSide=null){
  const side=forceSide??this.rng.int(4),g=this.gates[side];
  let kind=forceKind||this.rng.pick(this.nodeIndex>=1?['walker','walker','walker','runner','heavy']:['walker','walker','walker','runner']);
  const z={id:this.id++,side,kind,x:0,y:0,hp:kind==='mother'?2400:kind==='heavy'?200:kind==='runner'?70:90,max:0,armor:kind==='heavy'?.55:kind==='mother'?.32:0,speed:kind==='mother'?1.8:kind==='runner'?5:kind==='heavy'?2:2.7,attack:0,inside:false,entered:false};
  const spread=(this.rng.next()-.5)*110;
  if(side===0){z.x=200+spread;z.y=18+this.rng.next()*10;}
  if(side===1){z.x=375+this.rng.next()*8;z.y=205+spread;}
  if(side===2){z.x=200+spread;z.y=383-this.rng.next()*10;}
  if(side===3){z.x=17+this.rng.next()*8;z.y=205+spread;}
  z.max=z.hp;this.enemies.push(z);this.spawned++;this.waveSpawned++;return z;
 }
 assignSupplies(){
  const alive=this.living(),max=Math.max(1,Math.ceil(alive.length*(this.tactic==='resupply'?.21:.08))),busy=alive.filter(s=>s.task==='supply').length;
  if(busy>=max)return;
  const requests=alive.filter(s=>!s.supplyAssigned&&s.task!=='supply'&&s.mag+s.reserve<WEAPONS[s.weapon].mag*.85&&(this.stock[WEAPONS[s.weapon].ammo]||0)>0).sort((a,b)=>(a.mag+a.reserve)-(b.mag+b.reserve));
  for(const target of requests.slice(0,max-busy)){
   const type=WEAPONS[target.weapon].ammo;
   const reserved=alive.filter(s=>s.supply?.type===type&&s.supply.phase==='pickup').reduce((a,s)=>a+s.supply.qty,0);
   const qty=Math.min(this.capacity(target)-target.mag-target.reserve,this.stock[type]-reserved);
   if(qty<=0)continue;
   const candidates=alive.filter(s=>s.task!=='supply'&&!WEAPONS[s.weapon].fixed&&s.supplyAssigned===null);
   candidates.sort((a,b)=>(a.id===target.id?18:0)+dist(a,CENTER)-(b.id===target.id?18:0)-dist(b,CENTER));
   const carrier=candidates[0]||(!WEAPONS[target.weapon].fixed?target:null);
   if(!carrier)continue;
   carrier.task='supply';carrier.supply={targetId:target.id,type,qty,cargo:0,phase:'pickup'};target.supplyAssigned=carrier.id;
   this.setGoal(carrier,CENTER);
  }
 }
 updateSupply(s,dt){
  const req=s.supply;if(!req){s.task='guard';return;}
  const target=this.soldiers.find(x=>x.id===req.targetId);
  if(!target||target.hp<=0||WEAPONS[target.weapon].ammo!==req.type){
   if(req.cargo>0){req.phase='return';this.setGoal(s,CENTER);this.move(s,dt,3.4);if(dist(s,CENTER)>=4)return;this.stock[req.type]+=req.cargo;req.cargo=0;}
   if(target)target.supplyAssigned=null;s.supply=null;s.task='guard';s.goal=null;this.deploy();return;
  }
  if(req.phase==='pickup'){
   this.setGoal(s,CENTER);this.move(s,dt,3.8);
   if(dist(s,CENTER)<4){const qty=Math.min(req.qty,this.stock[req.type]);this.stock[req.type]-=qty;req.cargo=qty;req.phase='deliver';s.goal=null;}
  }else{
   this.setGoal(s,target);this.move(s,dt,3.4);
   if(dist(s,target)<4||s.id===target.id){
    const accepted=Math.min(req.cargo,this.capacity(target)-target.mag-target.reserve);
    target.reserve+=accepted;this.stock[req.type]+=req.cargo-accepted;req.cargo=0;target.supplyAssigned=null;s.supply=null;s.task='guard';s.goal=null;this.supplyRuns++;
    this.effects.push({type:'supply',x:target.x,y:target.y,life:1,max:1,text:'+'+accepted});
    this.deploy();
   }
  }
 }
 killSoldier(s){
  if(s.hp>0)return;
  const w=WEAPONS[s.weapon];this.lost[w.ammo]+=s.mag+s.reserve;s.mag=0;s.reserve=0;
  if(s.supply?.cargo){this.lost[s.supply.type]+=s.supply.cargo;this.effects.push({type:'lost',x:s.x,y:s.y,life:3,max:3,text:'弹药遗失'});s.supply.cargo=0;}
  if(s.supply){const target=this.soldiers.find(x=>x.id===s.supply.targetId);if(target)target.supplyAssigned=null;}
  if(!s.countedDead){s.countedDead=true;this.dead++;this.log('队员阵亡','#'+s.id+' '+w.role+'。本局减员保留。');}
 }
 damageEnemy(z,amount,weapon){
  if(z.hp<=0)return;
  z.hp-=amount*(1-z.armor*(1-(weapon.pierce||0)));
  if(z.hp<=0){this.kills++;z.hp=0;this.effects.push({type:'death',x:z.x,y:z.y,life:.35,max:.35,color:z.kind==='mother'?'#e77f9f':'#a486da'});}
 }
 fire(s,z){
  const w=WEAPONS[s.weapon];s.mag--;s.shots++;this.fired[w.ammo]++;s.burst++;
  let chance=clamp(w.accuracy-dist(s,z)/(w.range*2.4),.2,.96);
  if(s.task==='supply')chance*=.65;
  const hit=this.rng.next()<chance;
  const end={x:z.x+(hit?0:(this.rng.next()-.5)*12),y:z.y+(hit?0:(this.rng.next()-.5)*12)};
  this.effects.push({type:'shot',x:s.x,y:s.y,tx:end.x,ty:end.y,life:.12,max:.12,color:w.color});
  if(hit){
   if(w.blast){for(const e of this.enemies)if(e.hp>0&&dist(e,z)<w.blast)this.damageEnemy(e,w.damage*(1-dist(e,z)/(w.blast*1.4)),w);this.effects.push({type:'blast',x:z.x,y:z.y,r:w.blast,life:.5,max:.5});}
   else {const before=z.hp;this.damageEnemy(z,w.damage,w);if(before>0&&z.hp<=0)s.kills++;}
  }
  s.cooldown=60/w.rpm;
  if(s.burst>=w.burst){s.burst=0;s.cooldown+=w.pause;}
 }
 step(dt){
  if(this.phase!=='combat')return;
  this.time+=dt;this.waveTime+=dt;this.nodeTime+=dt;this.decisionAge+=dt;
  if(this.decisionAge>=4){this.decide();this.decisionAge=0;}
  this.spawnClock-=dt;
  if(this.remaining>0&&this.spawnClock<=0){const count=Math.min(12,this.remaining,240-this.enemies.filter(z=>z.hp>0).length),side=this.rng.int(4);for(let i=0;i<count;i++){this.spawnEnemy(null,this.rng.next()<.8?side:this.rng.int(4));this.remaining--;}this.spawnClock=this.spawnInterval*(.94+this.rng.next()*.12);}
  if(this.nodeIndex===3&&this.wave===2&&!this.bossSpawned&&this.waveTime>18){this.spawnEnemy('mother',this.rng.int(4));this.bossSpawned=true;this.log('母体出现','集中重火力，注意侧门和弹药储备。');}
  if(!this.supplyClock||this.time>=this.supplyClock){this.assignSupplies();this.supplyClock=this.time+.6;}
  const alive=this.living(),targets=this.enemies.filter(z=>z.hp>0);
  for(const s of alive){
   s.cooldown=Math.max(0,s.cooldown-dt);
   if(s.task==='supply')this.updateSupply(s,dt);else this.move(s,dt,WEAPONS[s.weapon].fixed?1.5:3.0);
   const w=WEAPONS[s.weapon];
   if(w.fixed&&!s.mount){if(s.goal&&dist(s,s.goal)>1.3)continue;s.setup=(s.setup??3)-dt;if(s.setup>0)continue;s.mount={x:s.x,y:s.y};}
   if(s.reload>0){s.reload-=dt;if(s.reload<=0){const n=Math.min(w.mag-s.mag,s.reserve);s.mag+=n;s.reserve-=n;}continue;}
   if(s.mag===0&&s.reserve>0){s.reload=w.reload/this.mod.reload;continue;}
   if(s.cooldown>0)continue;
   let best=null,score=Infinity;
   for(const z of targets){
    if(z.hp<=0)continue;
    // Fire discipline conserves stock at long range. This is a tactical choice, not a claim about weapon maximum range.
    const d=dist(s,z);if(d>Math.min(w.range,ENGAGEMENT[s.weapon])||(w.minRange&&d<w.minRange)||!this.los(s,z))continue;
    if(w.blast&&alive.some(a=>dist(a,z)<w.blast+2))continue;
    let v=d+(z.inside?-55:0)+(this.tactic==='focus_heavy'&&(z.kind==='heavy'||z.kind==='mother')?-120:0);
    if(z.side!==s.side&&!z.inside)v+=45;
    if(v<score){best=z;score=v;}
   }
   if(best&&s.mag>0)this.fire(s,best);
   else if(best&&dist(s,best)<3){this.damageEnemy(best,18,{pierce:0});s.cooldown=1;}
  }
  for(const z of targets){
   if(z.hp<=0)continue;z.attack=Math.max(0,z.attack-dt);
   const gate=this.gates[z.side];
   let goal=gate;
   if(!z.entered){
    const outside={...gate};if(z.side===0)outside.y-=4;if(z.side===1)outside.x+=4;if(z.side===2)outside.y+=4;if(z.side===3)outside.x-=4;
    goal=outside;
    if(dist(z,gate)<7){
     if(gate.hp>0){if(z.attack<=0){gate.hp=Math.max(0,gate.hp-(z.kind==='mother'?65:z.kind==='heavy'?28:12));z.attack=.9;if(gate.hp===0){this.log(SIDES[z.side]+'破口','自动防守重新评估，尸群可以通过入口。');this.decisionAge=99;}}continue;}
     z.entered=true;goal=CENTER;
    }
   }else{
    z.inside=true;
    let closest=null,d=Infinity;
    for(const s of alive)if(s.hp>0&&dist(s,z)<d&&this.los(z,s)){closest=s;d=dist(s,z);}
    goal=this.node.mode==='hold'&&dist(z,CENTER)<d?CENTER:closest||CENTER;
    if(dist(z,goal)<3.2){
     if(z.attack<=0){const damage=z.kind==='mother'?35:z.kind==='heavy'?22:11;
      if(goal===CENTER)this.core.hp=Math.max(0,this.core.hp-damage);
      else {goal.hp=Math.max(0,goal.hp-damage*(1-this.mod.armor));if(goal.hp===0)this.killSoldier(goal);}
      z.attack=.85;
     }continue;
    }
   }
   const d=dist(z,goal),step=Math.min(d,z.speed*dt);
   if(d>0){const nx=z.x+(goal.x-z.x)/d*step,ny=z.y+(goal.y-z.y)/d*step;
    if(!z.entered||!this.blocked(nx,ny,.6)){z.x=nx;z.y=ny;}
    else if(!this.blocked(nx,z.y,.6))z.x=nx;else if(!this.blocked(z.x,ny,.6))z.y=ny;
   }
  }
  for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0).slice(-180);
  if(this.time-(this.cleanTime||0)>3){this.enemies=this.enemies.filter(z=>z.hp>0);this.cleanTime=this.time;}
  if(this.living().length===0||(this.node.mode==='hold'&&this.core.hp<=0)){this.end(false,this.living().length===0?'全队阵亡':'据点核心被毁');return;}
  let complete=false;
  if(this.node.mode==='hold')complete=this.waveTime>=this.holdDuration;
  else complete=this.remaining===0&&!this.enemies.some(z=>z.hp>0)&&(this.nodeIndex!==3||this.wave!==2||this.bossSpawned);
  if(complete)this.finishWave();
 }
 finishWave(){
  if(this.wave>=2){
   if(this.node.flavor==='ammo'){this.gainAmmo('n556',260);this.gainAmmo('shell',28);this.log('取得据点物资','获得260发5.56与28发霰弹，未自动补满全队储备。');}
   else {let added=0;for(let i=0;i<2;i++)if(this.addSoldier('m4',true))added++;this.log('救援完成','接应 '+added+' 名队员加入，携带明确的初始弹药。');}
   if(this.nodeIndex>=3){this.end(true,'最终据点已清除');return;}
  }
  this.phase='reward';this.choices=this.rewardChoices();
  this.log('波次完成',this.wave>=2?'据点目标完成。选择一项奖励后前往路线。':'战斗暂停。选择一项奖励，准备下一波。');
 }
 rewardChoices(){
  const alive=this.living(),stage=this.nodeIndex;
  const pool=[
   {id:'ammo',kind:'ammo',name:'弹药补给箱',tag:'补给',icon:'▥',description:'补充当前编制使用的弹药。保持有限库存，跨据点携带。'},
   {id:'recruits',kind:'recruits',name:'接应步枪小组',tag:'补员',icon:'＋',description:'3名M4A1步枪兵，携带270发5.56。人数上限35。'},
   {id:'armor',kind:'armor',name:'防护装备',tag:'防护',icon:'◇',description:'改善全队近身防护。伤害减免属于游戏近似，最多40%。'},
   {id:'repair',kind:'repair',name:'修缮与加固',tag:'工事',icon:'▤',description:'维修门与核心，并将后续据点门耐久提高15%。'},
   {id:'drill',kind:'drill',name:'装填训练',tag:'训练',icon:'↻',description:'改善装填动作效率，换弹处理速度提高12%，上限40%。'},
   {id:'bags',kind:'bags',name:'扩充弹药携行',tag:'后勤',icon:'▧',description:'个人携弹上限提高20%，最多60%。不生成弹药。'}
  ];
  const options=stage>=1?['mp5','benelli','m249','m110','m203']:['mp5','benelli','m249'];
  if(stage>=2)options.push('m2');
  for(const key of options){const w=WEAPONS[key];pool.push({id:'weapon-'+key,kind:'weapon',weapon:key,name:w.name+' 换装',tag:w.role,icon:w.icon,description:(w.fixed?'1名队员操作固定机枪':'2名合适队员换装')+'；附带 '+(w.fixed?200:w.carry*2)+' 发兼容弹药。'});}
  const valid=pool.filter(x=>x.kind!=='recruits'||alive.length<35).filter(x=>x.kind!=='armor'||this.mod.armor<.4).filter(x=>x.kind!=='drill'||this.mod.reload<1.4).filter(x=>x.kind!=='bags'||this.mod.carry<1.6);
  const draws=this.rng.shuffle(valid).slice(0,3);
  if(Object.values(this.stock).reduce((a,b)=>a+b,0)<400&&!draws.some(x=>x.kind==='ammo'))draws[this.rng.int(3)]=pool[0];
  return draws;
 }
 chooseReward(id){
  if(this.phase!=='reward')return false;
  const card=this.choices.find(x=>x.id===id);if(!card)return false;
  if(card.kind==='ammo'){
   const types=new Set(this.living().map(s=>WEAPONS[s.weapon].ammo));
   for(const t of types)this.gainAmmo(t,t==='shell'?56:t==='g40'?12:t==='n50'?200:600);
  }
  if(card.kind==='recruits')for(let i=0;i<3;i++)this.addSoldier('m4',true);
  if(card.kind==='armor')this.mod.armor=Math.min(.4,this.mod.armor+.09);
  if(card.kind==='drill')this.mod.reload=Math.min(1.4,this.mod.reload*1.12);
  if(card.kind==='bags')this.mod.carry=Math.min(1.6,this.mod.carry*1.2);
  if(card.kind==='repair'){this.mod.doors*=1.15;for(const g of this.gates){g.max*=1.15;g.hp=g.max;}this.core.hp=this.core.max;}
  if(card.kind==='weapon'){
   const w=WEAPONS[card.weapon],n=w.fixed?1:2;
   this.gainAmmo(w.ammo,w.fixed?200:w.carry*2);
   const units=this.living().filter(s=>s.task!=='supply').sort((a,b)=>(a.weapon===card.weapon?10:0)-(b.weapon===card.weapon?10:0));
   for(const s of units.slice(0,n)){const old=WEAPONS[s.weapon];this.stock[old.ammo]+=s.mag+s.reserve;s.mag=0;s.reserve=0;s.weapon=card.weapon;s.reload=0;s.mount=null;s.setup=3;this.takeAmmo(s,this.capacity(s));}
  }
  this.rewardCount++;this.log('选择奖励',card.name);
  this.choices=[];
  if(this.wave>=2){
   // All survivors finish carrying tasks before strategic transfer. Unused cargo returns to shared stock.
   for(const s of this.living()){if(s.supply?.cargo)this.stock[s.supply.type]+=s.supply.cargo;s.supply=null;s.supplyAssigned=null;s.task='guard';}
   this.phase='route';this.enemies=[];this.choices=this.routeChoices();
  }else {this.beginWave();this.deploy();}
  return true;
 }
 end(win,reason){this.phase='ended';this.result={win,reason,time:this.time,kills:this.kills,survivors:this.living().length,dead:this.dead,seed:this.seed,nodes:this.nodeIndex+1,supplyRuns:this.supplyRuns,neuralDecisions:this.neuralDecisions,aiEnabled:this.aiEnabled};this.log(win?'行动完成':'行动结束',reason);}
 inventory(){
  const remaining={...this.stock};
  for(const s of this.soldiers){const t=WEAPONS[s.weapon].ammo;remaining[t]+=s.mag+s.reserve;if(s.supply?.cargo)remaining[s.supply.type]+=s.supply.cargo;}
  return {remaining,acquired:{...this.acquired},fired:{...this.fired},lost:{...this.lost}};
 }
 serialize(){const obj={...this};delete obj.aiProvider;obj.rng={state:this.rng.state};obj.events=[];return JSON.stringify(obj);}
 static restore(raw,aiProvider=null){const v=typeof raw==='string'?JSON.parse(raw):raw;const g=Object.create(Game.prototype);Object.assign(g,v);g.rng=new RNG(1);g.rng.state=v.rng.state;g.aiProvider=aiProvider;g.events=[];return g;}
}
