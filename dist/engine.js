export const VERSION='0.8.0';
export const UNIT_RADIUS=3.3,UNIT_SPACE=9;
export const SIDES=['北侧','东侧','南侧','西侧'];
export const ACTIONS=['balanced','reinforce_north','reinforce_east','reinforce_south','reinforce_west','resupply','fallback','focus_heavy'];
export const ACTION_LABELS=['均衡防守','北侧增援','东侧增援','南侧增援','西侧增援','优先补给','收缩防线','集火重型'];
export const AMMO={n556:'5.56',n9:'9mm',shell:'12号',n762:'7.62',g40:'40mm',n50:'12.7'};
export const MAP_PROFILES={
 warehouse:{name:'废弃仓库',tag:'宽口仓库',widths:[14,26,14,26],gateHP:700,edge:18,pace:1,fronts:[1,3],description:'东西入口较宽，中央通道开阔，适合持续火力与分段掩护。'},
 house:{name:'封锁住宅',tag:'近距住宅',widths:[12,12,12,12],gateHP:750,edge:45,pace:1.12,fronts:[0,2],description:'入口较窄、街巷接敌更近，家具切断部分射界，近距小组更容易接火。'},
 yard:{name:'围墙院落',tag:'开阔院落',widths:[24,24,24,24],gateHP:650,edge:12,pace:1.02,fronts:[0,1,2,3],description:'四门宽、遮挡少，来敌从更远处接近；远射武器能更早参与，但门防较弱。'}
};
export const ENEMY_PROFILES={
 mixed:{name:'混合尸群',description:'以步行尸为主，其他类型较少。',pool:['walker','walker','walker','runner','heavy']},
 rush:{name:'快速尸群',description:'快速单位较多，抵达入口更快。',pool:['walker','walker','walker','runner','runner']},
 armored:{name:'重型尸群',description:'重型单位较多，需要持续射击或穿甲火力。',pool:['walker','walker','walker','heavy','heavy','runner']}
};
const TERRAIN_ROLES={warehouse:{m4:1,mp5:.7,benelli:1,m249:4,m110:2,m203:2.5,m2:12},house:{m4:2,mp5:4,benelli:4,m249:2,m110:.6,m203:.5,m2:12},yard:{m4:1,mp5:.5,benelli:.5,m249:3,m110:4,m203:2,m2:12}};
const LOADOUTS={
 close:{name:'近距防守组',tag:'近距',icon:'S',weapons:['mp5','benelli'],minStage:0,notes:'MP5 与 Benelli M4 各一名，负责近距离接火。'},
 support:{name:'M249 火力组',tag:'持续火力',icon:'M',weapon:'m249',count:2,minStage:0,notes:'两名机枪手补充持续火力，使用全队共用的 5.56 弹药。'},
 precision:{name:'M110 精确射击组',tag:'远射',icon:'D',weapon:'m110',count:2,minStage:1,notes:'两名精确射手能更早接敌，并优先处理可见的装甲目标。'},
 grenadier:{name:'M203 榴弹组',tag:'群体火力',icon:'G',weapon:'m203',count:2,minStage:1,notes:'两名榴弹手优先处理聚集目标，受最小射程和友军安全距离限制。'},
 fixed:{name:'M2HB 固定火力',tag:'固定阵位',icon:'H',weapon:'m2',count:1,minStage:2,notes:'一名固定机枪手；部署后不随补位移动，单独使用 12.7 弹药。'}
};
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
const SPEED={m4:820,mp5:400,benelli:380,m249:820,m110:790,m203:75,m2:850};
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function circleEntry(a,b,c,r){
 const dx=b.x-a.x,dy=b.y-a.y,ox=a.x-c.x,oy=a.y-c.y,A=dx*dx+dy*dy;
 if(ox*ox+oy*oy<=r*r)return 0;
 if(A<1e-10)return null;
 const B=2*(ox*dx+oy*dy),D=B*B-4*A*(ox*ox+oy*oy-r*r);
 if(D<0)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;
}
function rectEntry(a,b,r){
 let lo=0,hi=1;
 for(const k of ['x','y']){const d=b[k]-a[k],mn=r[k],mx=mn+r[k==='x'?'w':'h'];if(Math.abs(d)<1e-9){if(a[k]<mn||a[k]>mx)return null;}else{let l=(mn-a[k])/d,h=(mx-a[k])/d;if(l>h)[l,h]=[h,l];lo=Math.max(lo,l);hi=Math.min(hi,h);if(lo>hi)return null;}}
 return lo>=0&&lo<=1?lo:null;
}
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
  this.soldiers=[];this.enemies=[];this.projectiles=[];this.effects=[];this.logs=[];this.events=[];this.choices=[];
  this.kills=0;this.spawned=0;this.dead=0;this.rewardCount=0;this.routeHistory=[];
  this.mod={reload:1,carry:1,armor:0,doors:1};this.tactic='balanced';this.decisionAge=99;this.decisions=0;this.neuralDecisions=0;
  this.aiState={action:'balanced',confidence:0,source:aiEnabled?'loading':'rules',reason:'等待战术态势'};
  this.lastAiAction='';this.supplyRuns=0;this.selectedId=null;this.lastCheckpoint=null;this.coordinationAge=99;this.lanes=[];this.tacticChangedAt=-99;this.tacticCandidate=null;this.trafficMigration=false;
  this.ammoHandoffs=[];this.buddyTransfers=0;
  this.frontResponseAt=-99;
  this.fireteams=[];this.nextTeamId=1;this.teamRoster='';
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
  const s={id:this.id++,x:200,y:205,hp:100,maxHP:100,weapon,mag:0,reserve:0,cooldown:this.rng.next(),reload:0,burst:0,side:0,goal:null,path:[],task:'guard',supply:null,supplyAssigned:null,travel:0,kills:0,shots:0,armor:0,vx:0,vy:0,facing:0,recoil:0,targetId:null,activity:'guard',maneuverUntil:0,formationSlot:null,formationSide:null,order:null,moveHeading:null,turnVelocity:0,guardPoint:null,nav:{lastCheck:0,remaining:0,stalled:0,replans:0,waitUntil:0,waitFor:null,yield:null,nextRetry:0}};
  s.teamId=null;s.coop=null;s.relief=false;
  const spawn=this.freePoint(s,CENTER,'spawn');if(spawn){s.x=spawn.x;s.y=spawn.y;}
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
  const profile=MAP_PROFILES[template]||MAP_PROFILES.warehouse,x=130,y=135,w=140,h=140,t=2,walls=[];
  for(const side of [0,2]){const gap=profile.widths[side],wy=side===0?y:y+h-t;walls.push({x,y:wy,w:70-gap/2,h:t},{x:200+gap/2,y:wy,w:70-gap/2,h:t});}
  for(const side of [1,3]){const gap=profile.widths[side],wx=side===3?x:x+w-t;walls.push({x:wx,y,w:t,h:70-gap/2},{x:wx,y:205+gap/2,w:t,h:70-gap/2});}
  const crates=template==='house'?[{x:158,y:174,w:15,h:20},{x:228,y:228,w:16,h:18},{x:169,y:220,w:18,h:8}]:template==='yard'?[{x:155,y:235,w:16,h:6},{x:237,y:162,w:6,h:16}]:[{x:154,y:165,w:18,h:13},{x:226,y:237,w:20,h:12}];
  return {template,walls,crates,house:{x,y,w,h},depot:{x:200,y:205},terrain:{...profile,widths:[...profile.widths],fronts:[...profile.fronts]}};
 }
 setupGates(){
  const points=[{x:200,y:135},{x:270,y:205},{x:200,y:275},{x:130,y:205}],profile=this.map.terrain;
  this.gates=points.map((p,i)=>({...p,side:i,width:profile?.widths[i]||16,hp:(profile?.gateHP||700)*this.mod.doors,max:(profile?.gateHP||700)*this.mod.doors}));
  this.navVersion=(this.navVersion||0)+1;
 }
 start(){if(this.phase==='home'){this.phase='route';this.choices=this.routeChoices();}}
 ammoPackage(scale=1){
  const quantities={n556:600,n9:240,shell:56,n762:120,g40:12,n50:200},types=new Set(this.living().map(s=>WEAPONS[s.weapon].ammo)),ammo={};
  for(const type of types)ammo[type]=Math.max(1,Math.round(quantities[type]*scale));return ammo;
 }
 packageCard(key){
  const spec=LOADOUTS[key];return {id:'loadout-'+key,kind:spec.weapons?'loadout':'weapon',loadout:key,...spec};
 }
 routeChoices(){
  const stage=this.nodeIndex+1,templates=this.rng.shuffle(['warehouse','house','yard']);
  return [0,1].map(v=>{
   const template=templates[v],profile=MAP_PROFILES[template],flavor=stage===3?'final':v===0?'ammo':stage>=1&&(this.living().length>=33||this.rng.next()<.6)?'armory':'rescue';
   const enemyProfile=stage===0?(v===0?'mixed':'rush'):stage===3?'mixed':v===1?'armored':stage===2?'rush':'mixed';
   const fronts=template==='yard'?this.rng.shuffle([0,1,2,3]).slice(0,2):[...profile.fronts];
   let payout=null,reward='最终撤离';
   if(flavor==='ammo'){const focus=stage%2===1&&this.focusedAmmoCards()[0];payout={kind:'ammo',ammo:focus?Object.fromEntries(Object.entries(focus.ammo).map(([type,n])=>[type,Math.round(n*.5)])):this.ammoPackage(.5)};reward=focus?focus.name:'兼容弹药补给';}
   if(flavor==='rescue'){payout={kind:'rescue',count:2};reward='接应 2 名步枪兵';}
   if(flavor==='armory'){const keys=Object.keys(LOADOUTS).filter(k=>LOADOUTS[k].minStage<=stage&&this.loadoutPreview(this.packageCard(k)).changes.length);const key=this.rng.pick(keys.length?keys:['support']);payout={kind:'armory',card:this.packageCard(key)};reward=LOADOUTS[key].name;}
   return {id:'route-'+stage+'-'+v,template,mode:stage===0||stage===3?'clear':v===0?'clear':'hold',danger:v,flavor,name:profile.name,reward,payout,fronts,enemyProfile,terrain:profile.tag,description:stage===3?'完成最终清剿，消灭母体并撤离。':profile.description};
  });
 }
 enterNode(choice){
  if(this.phase!=='route')return false;
  this.nodeIndex++;this.node={...choice};this.routeHistory.push({...choice,stage:this.nodeIndex});
  this.wave=0;this.nodeTime=0;this.frontResponseAt=-99;this.ammoHandoffs=[];this.lastBuddyTransfer=null;this.enemies=[];this.projectiles=[];this.effects=[];this.lanes=[];
  this.map=this.makeMap(choice.template);this.setupGates();this.core={...CENTER,hp:1500,max:1500};
  for(const s of this.living()){s.hp=s.maxHP;s.supply=null;s.supplyAssigned=null;s.task='guard';s.path=[];s.reload=0;s.goal=null;s.order=null;s.guardPoint=null;s.nav={lastCheck:this.time,remaining:0,stalled:0,replans:0,waitUntil:0,waitFor:null,yield:null,nextRetry:0};s.mount=null;s.setup=3;s.vx=s.vy=0;s.moveHeading=null;s.targetId=null;s.localOffset=null;s.maneuverUntil=this.time;const safe=this.freePoint(s,s,'spawn');if(this.blocked(s.x,s.y,UNIT_RADIUS+.2)&&safe){s.x=safe.x;s.y=safe.y;}}
  for(const team of this.fireteams){team.moverId=null;team.coverId=null;team.lastMoverId=null;team.readyAt=0;team.phase='hold';team.reason='';}
  for(const s of this.living()){s.coop=null;s.relief=false;s.reinforcement=null;s.lastContactAt=this.time;}
  this.tactic='balanced';this.tacticCandidate=null;this.tacticChangedAt=-99;this.lastAiAction='';
  this.prepareSiteDeployment();this.deploy();this.beginWave();
  this.log('据点 '+(this.nodeIndex+1),choice.name+' · '+(choice.mode==='hold'?'限时坚守':'清剿')+'。幸存者恢复生命，弹药按原库存保留。');
  return true;
 }
 beginWave(){
  this.wave++;this.waveTime=0;this.phase='combat';this.projectiles=[];this.spawnClock=.3;this.remaining=80+this.nodeIndex*30+(this.wave-1)*20+(this.node.danger?16:0);
  this.spawnInterval=(50+this.nodeIndex*13+(this.wave-1)*12)*(this.map.terrain?.pace||1)/Math.ceil(this.remaining/12);
  this.holdDuration=70+this.nodeIndex*4;this.waveSpawned=0;this.bossSpawned=false;
  this.decisionAge=99;this.log('第 '+this.wave+' / 2 波',this.node.mode==='hold'?'守住核心至倒计时结束。':'清除本波全部敌人。');
 }
 enemyPool(choice=this.node,stage=this.nodeIndex){
  const profile=ENEMY_PROFILES[choice?.enemyProfile];
  const pool=profile?[...profile.pool]:stage>=1?['walker','walker','walker','runner','heavy']:['walker','walker','walker','runner'];
  return stage<1?pool.filter(kind=>kind!=='heavy'):pool;
 }
 routeAdvice(choice){
  const counts=this.loadoutSummary().counts,close=(counts.mp5||0)+(counts.benelli||0),long=(counts.m110||0)+(counts.m249||0)+(counts.m2||0),notes=[];
  if(choice.enemyProfile==='armored')notes.push((counts.m110||0)+(counts.m2||0)?'已有精确射手或重机枪，可优先处理重型。':'重型较多，可留意精确射击或固定火力奖励。');
  if(choice.template==='house')notes.push(close?'现有 '+close+' 名近距队员可优先接住窄口。':'近距队员较少，需依靠步枪与交替接火。');
  if(choice.template==='yard')notes.push(long?'现有 '+long+' 名远射或支援队员可利用开阔射界。':'远射与持续火力较少，注意宽入口压力。');
  if(choice.template==='warehouse')notes.push((counts.m249||0)+(counts.m2||0)?'已有机枪火力，可优先覆盖宽入口。':'机枪火力较少，可继续扩充持续火力。');
  const cache=choice.payout?.kind==='ammo'?choice.payout.ammo:null,missing=cache?this.shortAmmoTypes().filter(type=>!cache[type]):[];
  if(missing.length)notes.push('这处补给未含偏紧的 '+missing.map(t=>AMMO[t]).join(' / ')+'。');
  return notes.slice(0,2);
 }
 prepareSiteDeployment(){
  if(!this.node.fronts?.length)return;this.refreshTeams();
  const alive=this.living(),byId=new Map(alive.map(s=>[s.id,s])),roles=TERRAIN_ROLES[this.node.template]||TERRAIN_ROLES.warehouse;
  const score=team=>team.members.reduce((n,id)=>n+(roles[byId.get(id).weapon]||0),0),weight=side=>this.node.fronts.includes(side)?1:.2;
  // Swap complete groups during setup only; partners remain together and every entrance stays occupied.
  for(let pass=0;pass<this.fireteams.length;pass++){
   let best=null,gain=.01;
   for(let i=0;i<this.fireteams.length;i++)for(let j=i+1;j<this.fireteams.length;j++){
    const a=this.fireteams[i],b=this.fireteams[j];if(a.side===b.side)continue;
    const value=(score(a)-score(b))*(weight(b.side)-weight(a.side));
    if(value>gain){gain=value;best=[a,b];}
   }
   if(!best)break;const [a,b]=best,side=a.side;a.side=b.side;b.side=side;
   for(const t of best)for(const id of t.members){const s=byId.get(id);s.side=t.side;s.formationSlot=null;s.formationSide=null;}
  }
  for(let side=0;side<4;side++){
   const rank={benelli:0,mp5:0,m2:1,m4:2,m249:3,m110:4,m203:5},units=alive.filter(s=>s.side===side).sort((a,b)=>rank[a.weapon]-rank[b.weapon]||(a.formationSlot??99)-(b.formationSlot??99)||a.id-b.id);
   units.forEach((s,slot)=>{s.formationSlot=slot;s.formationSide=side;});
  }
  this.teamRoster='';
 }
 deploy(){
  const alive=this.living(),counts=[0,0,0,0];
  for(const s of alive)if(s.assigned)counts[s.side]++;
  for(const s of alive)if(!s.assigned){s.side=counts.indexOf(Math.min(...counts));counts[s.side]++;s.assigned=true;s.facing=[-Math.PI/2,0,Math.PI/2,Math.PI][s.side];}
  this.coordinate(true);
  if(this.phase==='home'||this.phase==='route')for(const s of alive)if(s.goal){s.x=s.goal.x;s.y=s.goal.y;s.path=[];s.order.arrivedAt=this.phase==='home'?this.time-4:this.time;}
 }
 formationPoint(side,depth,offset){
  const g=this.gates[side];
  return side===0?{x:g.x+offset,y:g.y+depth}:side===1?{x:g.x-depth,y:g.y+offset}:side===2?{x:g.x+offset,y:g.y-depth}:{x:g.x+depth,y:g.y+offset};
 }
 updateFronts(pressure,alive){
  for(let side=0;side<4;side++){
   const gate=this.gates[side],lane=this.lanes[side]||(this.lanes[side]={depth:0,previous:0,since:this.time,holdUntil:0});
   const intruders=this.enemies.filter(z=>z.hp>0&&z.side===side&&z.entered&&dist(z,CENTER)<68).length;
   const alarm=(gate.hp/gate.max<.38&&pressure[side]>=2)||pressure[side]>7;
   let requested=0;
   if((gate.hp===0&&(pressure[side]>2||intruders))||(this.tactic==='fallback'&&(pressure[side]>1||intruders))||intruders>=2)requested=intruders>=4?25:13;
   else if(gate.hp/gate.max<.22&&pressure[side]>5)requested=10;
   const quiet=pressure[side]<1&&!intruders;
   if(quiet){lane.quietSince??=this.time;}else lane.quietSince=null;
   let depth=lane.depth;
   if(requested>depth){lane.recovering=false;depth=requested;lane.holdUntil=this.time+6;lane.recoverAt=this.time+6;}
   else if(depth>requested&&quiet&&this.time-lane.quietSince>=4&&this.time>=lane.holdUntil&&this.time>=(lane.recoverAt||0)){
    lane.recovering=true;depth=Math.max(requested,depth-6);lane.recoverAt=this.time+4;
   }
   if(depth!==lane.depth){lane.previous=lane.depth;lane.depth=depth;lane.since=this.time;}
   const moving=alive.some(s=>s.side===side&&s.task!=='supply'&&this.inTransit(s)&&s.order?.kind==='retreat');
   if(!quiet&&requested>=depth)lane.recovering=false;
   const state=lane.recovering?'recover':depth>0?(moving||this.time-lane.since<1.2?'withdraw':'hold'):alarm?'alarm':'guard';
   if(state!==lane.state){const old=lane.state;lane.state=state;lane.stateSince=this.time;if(this.phase==='combat'&&old&&state!=='guard')this.log(SIDES[side]+({alarm:'告急',withdraw:'退守',hold:'稳住',recover:'恢复阵位'}[state]),{alarm:'邻近入口保留接火人员，按余力调派增援。',withdraw:'前排分批后撤，搭档留位接火。',hold:'守住内侧阵位，继续观察入口压力。',recover:'入口压力减轻，逐段恢复阵位。'}[state]);}
   lane.intruders=intruders;lane.pressure=pressure[side];
  }
 }
 frontSummary(){
  if(this.phase!=='combat')return '';
  const ranks={withdraw:5,hold:4,alarm:3,recover:2,guard:0};
  const front=this.lanes.map((lane,side)=>({lane,side})).filter(x=>x.lane&&ranks[x.lane.state]).sort((a,b)=>ranks[b.lane.state]-ranks[a.lane.state]||b.lane.pressure-a.lane.pressure)[0];
  if(!front)return '';
  const labels={alarm:'入口告急',withdraw:'分批退守',hold:'内侧坚守',recover:'逐段恢复'},incoming=this.living().find(s=>s.reinforcement?.to===front.side&&!s.reinforcement.returning&&this.inTransit(s));
  return SIDES[front.side]+' · '+labels[front.lane.state]+(incoming?'，#'+incoming.id+' 正在增援':'');
 }
 respondToFronts(alive,pressure){
  for(const s of alive)if(s.reinforcement?.returning&&s.order?.kind==='restore'&&!this.inTransit(s))s.reinforcement=null;
  if(this.phase!=='combat'||this.time<this.frontResponseAt)return;
  const counts=[0,0,0,0];for(const s of alive)counts[s.side]++;
  const ready=s=>s.task!=='supply'&&!WEAPONS[s.weapon].fixed&&s.mag>0&&s.reload<=0&&!this.handoffFor(s)&&!this.inTransit(s)&&this.time>=(s.maneuverUntil||0)&&this.canLeaveForSupply(s);
  // One nearby reinforcement travels at a time, with a rear element left to cover its own entrance.
  const fronts=[0,1,2,3].filter(side=>['alarm','withdraw','hold'].includes(this.lanes[side].state)&&pressure[side]>=2).sort((a,b)=>(this.lanes[b].intruders||0)-(this.lanes[a].intruders||0)||pressure[b]-pressure[a]);
  for(const side of fronts){
   if(counts[side]>=Math.ceil(alive.length/4)+2||alive.some(s=>s.reinforcement?.to===side&&!s.reinforcement.returning&&this.inTransit(s)))continue;
   const candidates=alive.filter(s=>!s.reinforcement&&ready(s)&&[1,3].includes((s.side-side+4)%4)&&counts[s.side]>=3&&pressure[s.side]<2&&this.lanes[s.side].state==='guard'&&alive.some(a=>a!==s&&a.side===s.side&&this.coverReady(a)));
   candidates.sort((a,b)=>dist(a,this.gates[side])-dist(b,this.gates[side])||(b.formationSlot??0)-(a.formationSlot??0)||a.id-b.id);
   const s=candidates[0];if(!s)continue;const from=s.side;s.reinforcement={from,to:side,returning:false,since:this.time};s.side=side;s.formationSlot=null;s.formationSide=null;s.localOffset=null;this.releaseOrder(s);s.maneuverUntil=this.time+7;this.frontResponseAt=this.time+6;
   this.log(SIDES[side]+'增援','#'+s.id+' 从'+SIDES[from]+'前往支援，原入口继续留人接火。');return;
  }
  // A reinforcement returns physically only after both entrances have been quiet for a while.
  const returning=alive.filter(s=>s.reinforcement&&!s.reinforcement.returning&&ready(s)&&this.lanes[s.side].state==='guard'&&this.lanes[s.reinforcement.from].state==='guard'&&this.lanes[s.side].quietSince!==null&&this.time-this.lanes[s.side].quietSince>=6&&counts[s.side]>1);
  returning.sort((a,b)=>a.reinforcement.since-b.reinforcement.since||a.id-b.id);
  const s=returning[0];if(s){s.side=s.reinforcement.from;s.reinforcement.returning=true;s.formationSlot=null;s.formationSide=null;s.localOffset=null;this.releaseOrder(s);s.maneuverUntil=this.time+7;this.frontResponseAt=this.time+6;this.log('增援归防','#'+s.id+' 返回'+SIDES[s.side]+'，沿途保持警戒。');}
 }
 coordinate(force=false){
  const alive=this.living(),guards=alive.filter(s=>s.task!=='supply'),pressure=this.sidePressure(),plans=[];
  this.updateFronts(pressure,alive);this.respondToFronts(alive,pressure);
  const responding=alive.some(s=>s.reinforcement)||this.lanes.some(l=>l.state!=='guard');
  const priority=this.tactic.startsWith('reinforce_')?ACTIONS.indexOf(this.tactic)-1:-1;
  const weights=pressure.map((p,i)=>1+Math.min(p/10,.8)+(i===priority?2:0));
  const desired=[0,0,0,0];
  for(let i=0;i<alive.length;i++){let side=0;for(let j=1;j<4;j++)if((desired[j]+.8)/weights[j]<(desired[side]+.8)/weights[side])side=j;desired[side]++;}
  const counts=[0,0,0,0];for(const s of alive)counts[s.side]++;
  // Transfer the nearest available soldiers, never reshuffle the entire roster.
  for(let n=0;n<(this.phase==='route'||responding?0:force?2:1);n++){
   let side=-1;for(let i=0;i<4;i++)if(desired[i]>counts[i]&&(i===priority||counts[i]===0||desired[i]-counts[i]>=2||pressure[i]>3)&&(side<0||desired[i]-counts[i]>desired[side]-counts[side]))side=i;
   if(side<0)break;
   const candidates=guards.filter(s=>counts[s.side]>desired[s.side]&&!WEAPONS[s.weapon].fixed&&s.reload<=0&&!this.handoffFor(s)&&!this.inTransit(s)&&this.time>=(s.maneuverUntil||0)&&this.canLeaveForSupply(s));
   candidates.sort((a,b)=>dist(a,this.gates[side])-dist(b,this.gates[side])||(a.id-b.id));
   const unit=candidates[0];if(!unit)break;counts[unit.side]--;counts[side]++;unit.side=side;unit.formationSlot=null;unit.formationSide=null;unit.localOffset=null;unit.order=null;unit.maneuverUntil=this.time+7;
  }
  for(let side=0;side<4;side++){
   const group=guards.filter(s=>s.side===side),members=alive.filter(s=>s.side===side),gate=this.gates[side],slots=new Set();
   // A carrier keeps their slot. Nobody slides sideways when a teammate leaves or returns.
   for(const s of members)if(s.formationSide===side&&Number.isInteger(s.formationSlot)&&!slots.has(s.formationSlot))slots.add(s.formationSlot);else{s.formationSlot=null;s.formationSide=side;}
   for(const s of members)if(s.formationSlot===null){let slot=0;while(slots.has(slot))slot++;s.formationSlot=slot;slots.add(slot);}
   // Fill a vacated front slot without pulling every remaining soldier forward.
   for(const vacancy of [0,1])if(!slots.has(vacancy)){
    const replacement=group.filter(s=>s.formationSlot>=2&&!WEAPONS[s.weapon].fixed&&s.reload<=0&&s.mag>0&&!this.inTransit(s)).sort((a,b)=>dist(a,gate)-dist(b,gate)||a.id-b.id)[0];
    if(replacement){slots.delete(replacement.formationSlot);replacement.formationSlot=vacancy;replacement.relief=true;slots.add(vacancy);}
   }
   const lane=this.lanes[side];
   for(const s of group){
    const w=WEAPONS[s.weapon],slot=s.formationSlot;
    if(w.fixed&&s.mount){plans.push({s,point:s.mount,kind:'mount',priority:100,force:true});continue;}
    // Alternate the first and second element so one can cover the other's withdrawal.
    const delay=(slot%2)*1.2,retreat=this.time-lane.since<delay?lane.previous:lane.depth;
    let depthBase=w.fixed?14:s.weapon==='benelli'?8:s.weapon==='m249'?17:s.weapon==='m110'||s.weapon==='m203'?21:11;
    const settled=!this.inTransit(s);
    depthBase+=Math.floor(slot/2)*9+retreat+(s.reload>0&&settled?8:0);
    let offset=(slot%2?1:-1)*(Math.floor(slot/2)%2?9:4.5);
    if(retreat>0)offset=Math.sign(offset)*Math.max(11,Math.abs(offset));
    if(s.localOffset&&(s.localOffset.until>this.time||pressure[side]>0))offset+=s.localOffset.amount;
    else s.localOffset=null;
    let point=s.localOffset?.point&&retreat===0?s.localOffset.point:this.formationPoint(side,depthBase,offset);
    if(this.blocked(point.x,point.y,UNIT_RADIUS+.2))point=this.formationPoint(side,depthBase+9,offset);
    const kind=lane.state==='recover'?'recover':retreat>0?'retreat':s.reinforcement?(s.reinforcement.returning?'restore':'reinforce'):s.reload>0&&settled?'reload':s.relief?'relief':s.localOffset?'reposition':'formation';
    plans.push({s,point,kind,priority:kind==='recover'?25:retreat>0?80+retreat:kind==='reinforce'?45:kind==='restore'?25:kind==='relief'?35:kind==='reload'?30:kind==='reposition'?20:10});
   }
  }
  this.refreshTeams(alive);this.applyTeamPlans(plans);
  for(const [side,lane] of this.lanes.entries())if(lane.recovering&&lane.depth===0&&this.time-lane.since>1.2&&plans.filter(p=>p.s.side===side&&p.kind!=='mount').every(p=>!this.inTransit(p.s)&&!this.needsPlan(p))){lane.recovering=false;lane.state='guard';lane.stateSince=this.time;}
  for(const s of guards){s.retreating=s.order?.kind==='retreat'&&this.inTransit(s);s.holdPoint={...(s.goal||s)};if(s.relief&&s.order?.kind==='relief'&&!this.inTransit(s))s.relief=false;}
 }
 refreshTeams(alive=this.living()){
  const signature=alive.map(s=>s.id+':'+s.side).join(',');if(signature===this.teamRoster)return;
  this.teamRoster=signature;
  const byId=new Map(alive.map(s=>[s.id,s])),assigned=new Set();
  for(const team of this.fireteams){team.members=team.members.filter(id=>byId.has(id)&&byId.get(id).side===team.side&&!assigned.has(id));for(const id of team.members)assigned.add(id);}
  this.fireteams=this.fireteams.filter(t=>t.members.length);
  for(let side=0;side<4;side++){
   const units=alive.filter(s=>s.side===side&&!assigned.has(s.id)).sort((a,b)=>(a.formationSlot??99)-(b.formationSlot??99)||a.id-b.id);
   for(const s of units){let team=this.fireteams.find(t=>t.side===side&&t.members.length<3);if(!team){team={id:this.nextTeamId++,side,members:[],moverId:null,coverId:null,lastMoverId:null,readyAt:0,phase:'hold',reason:'',since:this.time};this.fireteams.push(team);}team.members.push(s.id);assigned.add(s.id);}
   const teams=this.fireteams.filter(t=>t.side===side);
   for(const single of teams.filter(t=>t.members.length===1)){
    const partner=teams.find(t=>t!==single&&t.members.length===2);
    if(partner){partner.members.push(single.members.pop());continue;}
    const donor=teams.find(t=>t!==single&&t.members.length===3);
    if(donor){const id=donor.members.findLast(id=>!this.inTransit(byId.get(id))&&byId.get(id).task!=='supply')??donor.members.at(-1);donor.members=donor.members.filter(x=>x!==id);single.members.push(id);}
   }
  }
  this.fireteams=this.fireteams.filter(t=>t.members.length);
  for(const team of this.fireteams)for(const id of team.members)byId.get(id).teamId=team.id;
 }
 setCoop(s,role,partnerId=null,reason=''){
  if(s.coop?.role!==role||s.coop?.partnerId!==partnerId||s.coop?.reason!==reason)s.coop={role,partnerId,reason,since:this.time};
  s.covering=role==='cover';
 }
 coverReady(s){return !this.handoffFor(s)&&s.hp>0&&s.task!=='supply'&&s.mag>0&&s.reload<=0&&(!WEAPONS[s.weapon].fixed||!!s.mount)&&!this.inTransit(s)&&!s.nav?.yield&&this.los(s,this.gates[s.side]);}
 needsPlan({s,point,kind}){
  if(!s.goal)return true;
  if(this.blocked(s.goal.x,s.goal.y,UNIT_RADIUS+.2))return true;
  if(dist(s.goal,point)<1.5)return false;
  return !(s.order?.kind===kind&&s.order.request&&dist(s.order.request,point)<1.5);
 }
 applyTeamPlans(plans){
  const byId=new Map(this.living().map(s=>[s.id,s])),byUnit=new Map(plans.map(p=>[p.s.id,p])),coops=new Map([...byId.values()].map(s=>[s.id,{s,role:'hold',partnerId:null,reason:''}]));
  const assign=(s,role,partnerId=null,reason='')=>coops.set(s.id,{s,role,partnerId,reason});
  for(const team of this.fireteams){
   const members=team.members.map(id=>byId.get(id)).filter(Boolean),guards=members.filter(s=>s.task!=='supply');
   let mover=byId.get(team.moverId);
   if(mover&&(!members.includes(mover)||mover.hp<=0||mover.task==='supply'))mover=null;
   if(mover&&!this.inTransit(mover)){team.lastMoverId=mover.id;team.readyAt=this.time+.75;mover=null;}
   if(!mover)mover=guards.filter(s=>this.inTransit(s)).sort((a,b)=>(b.order?.priority||0)-(a.order?.priority||0)||a.id-b.id)[0]||null;
   const pending=guards.map(s=>byUnit.get(s.id)).filter(p=>p&&p.kind!=='mount'&&this.needsPlan(p));
   pending.sort((a,b)=>b.priority-a.priority||dist(a.s,this.gates[team.side])-dist(b.s,this.gates[team.side])||a.s.id-b.s.id);
   const deploying=this.phase==='home'||this.phase==='route';
   if(!mover&&(deploying||this.time>=(team.readyAt||0)))mover=pending.find(p=>p.s.goal)?.s||null;
   team.moverId=mover?.id??null;
   let protectedUnit=mover||members.find(s=>s.reload>0)||members.find(s=>s.task==='supply')||null;
   const nextPlan=mover?byUnit.get(mover.id):null;
   const reason=mover?(nextPlan?.kind==='retreat'?'retreat':this.inTransit(mover)?mover.order?.kind||'formation':nextPlan?.kind||'formation'):protectedUnit?.task==='supply'?'supply':protectedUnit?'reload':'';
   const cover=protectedUnit?guards.filter(s=>s!==protectedUnit&&this.coverReady(s)).sort((a,b)=>(a.id===team.coverId?-1:0)-(b.id===team.coverId?-1:0)||dist(a,protectedUnit)-dist(b,protectedUnit)||a.id-b.id)[0]||null:null;
   const previousPhase=team.phase,previousMover=team.activeId;
   team.coverId=cover?.id??null;team.reason=reason;team.activeId=protectedUnit?.id??null;
   team.phase=mover?'moving':this.time<(team.readyAt||0)?'handoff':protectedUnit?'support':'hold';
   if(previousPhase!==team.phase||previousMover!==team.activeId)team.since=this.time;
   for(const s of members){
    const plan=byUnit.get(s.id);
    if(s.task==='supply'){assign(s,'haul',cover?.id??null,'supply');continue;}
    if(!plan)continue;
    const unsafe=s.goal&&(this.blocked(s.goal.x,s.goal.y,UNIT_RADIUS+.2)||this.soldiers.some(a=>a!==s&&a.hp>0&&a.id<s.id&&a.goal&&dist(a.goal,s.goal)<UNIT_SPACE-.05));
    const danger=plan.kind==='retreat'&&(s.hp<28||this.enemies.some(z=>z.hp>0&&z.entered&&dist(z,s)<9));
    const allowed=deploying||!s.goal||unsafe||plan.kind==='mount'||danger||(!this.handoffFor(s)&&s===mover);
    if(allowed)this.setGoal(s,plan.point,plan);
    if(s===cover&&!this.inTransit(s)&&!deploying)assign(s,'cover',protectedUnit.id,reason);
    else if((s===mover||danger)&&this.inTransit(s))assign(s,'move',danger&&s!==mover?null:cover?.id??null,reason);
    else if(!allowed&&this.needsPlan(plan))assign(s,'wait',mover?.id??team.lastMoverId,plan.kind);
   }
   team.moverId=mover&&this.inTransit(mover)?mover.id:null;
   if(team.phase==='moving'&&!team.moverId)team.phase=protectedUnit?.reload>0||protectedUnit?.task==='supply'?'support':'hold';
   const finalCover=team.phase==='hold'||!protectedUnit?null:cover&&this.coverReady(cover)?cover:guards.filter(s=>s!==protectedUnit&&this.coverReady(s)).sort((a,b)=>dist(a,protectedUnit)-dist(b,protectedUnit)||a.id-b.id)[0]||null;
   team.coverId=finalCover?.id??null;
   for(const s of members){const c=coops.get(s.id);if(c.role==='cover'&&s!==finalCover)assign(s,'hold');if(c.role==='move'&&s===protectedUnit)assign(s,'move',team.coverId,c.reason);}
   if(finalCover&&!deploying)assign(finalCover,'cover',protectedUnit.id,reason);
  }
  for(const {s,role,partnerId,reason} of coops.values())this.setCoop(s,role,partnerId,reason);
 }
 teamFor(s){return this.fireteams.find(t=>t.id===s.teamId);}
 canLeaveForSupply(s){
  if(s.mag===0)return true;
  const team=this.teamFor(s);if(!team)return true;
  const others=team.members.map(id=>this.soldiers.find(a=>a.id===id)).filter(a=>a&&a!==s&&a.hp>0);
  return !others.some(a=>a.task!=='supply'&&(a.reload>0||this.inTransit(a)))||others.some(a=>this.coverReady(a));
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
  const proposed=d.action;
  if(this.tacticCandidate?.action!==proposed)this.tacticCandidate={action:proposed,since:this.time};
  const urgent=proposed==='fallback'&&(f[17]>.3||f[21]<.5);
  if(this.lastAiAction&&proposed!==this.tactic&&!urgent&&(this.time-this.tacticChangedAt<4||this.time-this.tacticCandidate.since<2.2))d={...d,action:this.tactic,confidence:this.aiState.confidence};
  if(d.action!==this.tactic||!this.lastAiAction)this.tacticChangedAt=this.time;
  this.tactic=d.action;this.decisions++;if(source==='neural')this.neuralDecisions++;
  const chosenSide=ACTIONS.indexOf(d.action)-1;
  const reason=d.action==='resupply'?'缺弹比例 '+Math.round(f[13]*100)+'%，调派士兵优先运送兼容弹药。':d.action==='fallback'?'核心附近出现威胁，保留补给通道并收缩阵位。':d.action==='focus_heavy'?'识别到护具或母体目标，调整集火优先级。':d.action==='balanced'?'保持四向警戒，按需安排搬运。':SIDES[chosenSide]+'需要增援，调整队员站位与射击侧重。';
  this.aiState={action:d.action,confidence:d.confidence,source,reason,features:f,proposedAction:proposed};
  if(this.lastAiAction!==d.action){this.log('防线调整',ACTION_LABELS[ACTIONS.indexOf(d.action)]+' · '+reason);this.lastAiAction=d.action;this.deploy();}
 }
 setAI(on){this.aiEnabled=!!on;this.decisionAge=99;this.lastAiAction='';}
 blocked(x,y,r=1.1){
  if(x<2||y<2||x>WORLD-2||y>WORLD-2)return true;
  for(const o of [...this.map.walls,...this.map.crates])if(x>o.x-r&&x<o.x+o.w+r&&y>o.y-r&&y<o.y+o.h+r)return true;
  return false;
 }
 inTransit(s){return !!s.goal&&dist(s,s.goal)>1.2;}
 releaseOrder(s){s.goal=null;s.path=[];s.order=null;if(s.nav){s.nav.waitUntil=0;s.nav.waitFor=null;s.nav.yield=null;}}
 clearPath(a,b,r=UNIT_RADIUS+.2,avoid=[]){
  if([...this.map.walls,...this.map.crates].some(o=>segmentHit(a,b,{x:o.x-r,y:o.y-r,w:o.w+r*2,h:o.h+r*2})))return false;
  return !avoid.some(o=>{if(!o.r)return segmentHit(a,b,{x:o.x-r,y:o.y-r,w:o.w+r*2,h:o.h+r*2});if(dist(a,o)<o.r+.05)return (b.x-a.x)*(a.x-o.x)+(b.y-a.y)*(a.y-o.y)<0;return circleEntry(a,b,o,o.r)!==null;});
 }
 insideRoom(p){const h=this.map.house;return p.x>=h.x+UNIT_RADIUS+.4&&p.x<=h.x+h.w-UNIT_RADIUS-.4&&p.y>=h.y+UNIT_RADIUS+.4&&p.y<=h.y+h.h-UNIT_RADIUS-.4;}
 destinationFree(s,p,kind='formation'){
  if(!this.insideRoom(p)||this.blocked(p.x,p.y,UNIT_RADIUS+.2))return false;
  if(!kind.startsWith('supply')&&kind!=='spawn'&&kind!=='yield'&&dist(p,CENTER)<14)return false;
  for(const a of this.soldiers){
   if(a===s||a.hp<=0)continue;
   const claims=[a.goal,a.guardPoint,a.nav?.yield?.point].filter(Boolean);
   if(claims.some(q=>dist(p,q)<UNIT_SPACE-.05))return false;
   const strategic=this.phase==='route'&&!kind.startsWith('supply')&&kind!=='spawn'&&kind!=='yield';
   if((kind==='spawn'||!strategic&&!this.inTransit(a))&&dist(p,a)<UNIT_SPACE-.05)return false;
  }
  return true;
 }
 freePoint(s,p,kind='formation',limit=35){
  if(this.destinationFree(s,p,kind))return {x:p.x,y:p.y};
  for(let radius=3;radius<=limit;radius+=3){
   const points=[];for(let i=0;i<24;i++){const a=i*Math.PI/12,q={x:p.x+Math.cos(a)*radius,y:p.y+Math.sin(a)*radius};if(this.destinationFree(s,q,kind))points.push(q);}
   points.sort((a,b)=>dist(s,a)-dist(s,b));if(points.length)return points[0];
  }
  return null;
 }
 walkablePoint(p){
  if(this.insideRoom(p)&&!this.blocked(p.x,p.y,UNIT_RADIUS+.2))return {x:p.x,y:p.y};
  for(let radius=3;radius<=30;radius+=3)for(let i=0;i<24;i++){const a=i*Math.PI/12,q={x:p.x+Math.cos(a)*radius,y:p.y+Math.sin(a)*radius};if(this.insideRoom(q)&&!this.blocked(q.x,q.y,UNIT_RADIUS+.2))return q;}
  return null;
 }
 setGoal(s,p,{kind=s.task==='supply'?'supply':'formation',priority=s.task==='supply'?40:10,force=false,follow=false}={}){
  if(!p)return false;
  const oldInvalid=s.goal&&(this.blocked(s.goal.x,s.goal.y,UNIT_RADIUS+.2)||this.soldiers.some(a=>a!==s&&a.hp>0&&a.id<s.id&&a.goal&&dist(a.goal,s.goal)<UNIT_SPACE-.05));
  // Hold a safe reservation instead of choosing a different nearby vacancy every update.
  if(!oldInvalid&&s.goal&&dist(s.goal,p)<1.5)return false;
  if(s.goal&&s.order&&!force&&!oldInvalid){
   const emergency=priority>=80&&priority>=s.order.priority;
   const following=follow&&s.order.kind===kind&&dist(s.goal,p)>8&&this.time-s.order.issuedAt>=1.8;
   if(!emergency&&!following){if(this.inTransit(s))return false;if(s.order.arrivedAt===null)s.order.arrivedAt=this.time;const immediate=['reload','cover','relief'].includes(kind)&&priority>s.order.priority,hold=s.order.kind==='cover'||s.order.kind==='reload'?1.2:2.8;if(!immediate&&this.time-s.order.arrivedAt<hold)return false;}
  }
  // The chosen vacancy remains reserved even when its desired formation point is occupied.
  if(!oldInvalid&&!force&&s.goal&&s.order?.kind===kind&&s.order.request&&dist(s.order.request,p)<1.5)return false;
  const point=kind==='mount'?{x:p.x,y:p.y}:this.freePoint(s,p,kind);
  if(!point)return false;
  const path=this.findPath(s,point);if(!path)return false;
  s.goal=point;s.path=path;s.ordersIssued=(s.ordersIssued||0)+1;
  if(!kind.startsWith('supply')&&kind!=='yield')s.guardPoint={...point};
  s.order={kind,priority,issuedAt:this.time,arrivedAt:dist(s,point)<=2.4?this.time:null,request:{x:p.x,y:p.y}};
  s.nav??={};s.nav.lastCheck=this.time;s.nav.remaining=this.pathRemaining(s);s.nav.stalled=0;s.nav.waitUntil=0;s.nav.waitFor=null;s.nav.yield=null;
  return true;
 }
 findPath(a,b,avoid=[]){
  if(!b||!this.insideRoom(b)||this.blocked(b.x,b.y,UNIT_RADIUS+.2))return null;
  if(this.clearPath(a,b,UNIT_RADIUS+.2,avoid))return [{x:b.x,y:b.y}];
  const nodes=[{x:a.x,y:a.y},{x:b.x,y:b.y}],margin=UNIT_RADIUS+.9,candidates=[];
  for(const o of this.map.crates)for(const x of [o.x-margin,o.x+o.w+margin])for(const y of [o.y-margin,o.y+o.h+margin])candidates.push({x,y});
  for(const o of avoid)for(let i=0;i<8;i++){const angle=i*Math.PI/4;candidates.push({x:o.x+Math.cos(angle)*(o.r+.9),y:o.y+Math.sin(angle)*(o.r+.9)});}
  for(const p of candidates)if(this.insideRoom(p)&&!this.blocked(p.x,p.y,UNIT_RADIUS+.2)&&!avoid.some(o=>dist(p,o)<o.r+.1))nodes.push(p);
  const cost=nodes.map(()=>Infinity),parent=nodes.map(()=>-1),done=new Set();cost[0]=0;
  for(let count=0;count<nodes.length;count++){
   let current=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(current<0||cost[i]<cost[current]))current=i;
   if(current<0||!Number.isFinite(cost[current]))break;if(current===1){const path=[];let k=1;while(k!==0){path.push(nodes[k]);k=parent[k];if(k<0)return null;}return path.reverse();}
   done.add(current);
   for(let i=1;i<nodes.length;i++){if(done.has(i)||i===current)continue;const next=cost[current]+dist(nodes[current],nodes[i]);if(next<cost[i]&&this.clearPath(nodes[current],nodes[i],UNIT_RADIUS+.2,avoid)){cost[i]=next;parent[i]=current;}}
  }
  return null;
 }
 pathRemaining(s){if(!s.goal)return 0;const path=s.path.length?s.path:[s.goal];let total=dist(s,path[0]);for(let i=1;i<path.length;i++)total+=dist(path[i-1],path[i]);return total;}
 passageRank(s){return (s.order?.priority||0)+(s.supply?.cargo?30:0);}
 yieldTo(s,other){
  if(WEAPONS[s.weapon].fixed||s.nav?.yield||this.time<(s.nav?.nextYield||0))return false;
  const dx=other.vx||other.goal?.x-other.x||1,dy=other.vy||other.goal?.y-other.y||0,length=Math.hypot(dx,dy)||1,direction={x:dx/length,y:dy/length};
  const choices=[];
  for(const side of [1,-1])for(const d of [8,12])choices.push({x:s.x-direction.y*d*side,y:s.y+direction.x*d*side});
  // In a single-file gap, back up to a place wide enough to let the other body pass.
  for(const d of [10,18,28,40,56,72]){const p={x:s.x+direction.x*d,y:s.y+direction.y*d},left={x:p.x-direction.y*8,y:p.y+direction.x*8},right={x:p.x+direction.y*8,y:p.y-direction.x*8};if((this.insideRoom(left)&&!this.blocked(left.x,left.y,UNIT_RADIUS+.2))||(this.insideRoom(right)&&!this.blocked(right.x,right.y,UNIT_RADIUS+.2)))choices.push(p);}
  for(const p of choices)if(this.destinationFree(s,p,'yield')&&this.clearPath(s,p)){s.nav.yield={point:p,for:other.id,direction,until:this.time+Math.max(8,dist(s,p)/2.5+4)};s.nav.nextYield=this.time+5;return true;}
  return false;
 }
 recoverTraffic(s){
  const nav=s.nav;if(!s.goal||!this.inTransit(s)||nav.yield||this.time-(nav.lastCheck||0)<.75)return;
  const remaining=this.pathRemaining(s),progress=(nav.remaining??remaining)-remaining;
  nav.stalled=progress>.3?0:(nav.stalled||0)+(this.time-(nav.lastCheck||this.time));nav.remaining=remaining;nav.lastCheck=this.time;
  if(nav.stalled<1.5||this.time<(nav.nextRetry||0))return;
  const next=s.path[0]||s.goal,dx=next.x-s.x,dy=next.y-s.y,length=dx*dx+dy*dy;
  const nearby=this.living().filter(a=>{if(a===s||dist(a,s)>24)return false;const t=length?((a.x-s.x)*dx+(a.y-s.y)*dy)/length:0;return t>0&&t<=1&&Math.hypot(a.x-s.x-t*dx,a.y-s.y-t*dy)<7.6;}).sort((a,b)=>dist(a,s)-dist(b,s)).slice(0,4);
  const avoid=nearby.map(a=>({x:a.x,y:a.y,r:7.6}));
  let path=this.findPath(s,s.goal,avoid);
  if(!path){const blocker=nearby.find(a=>!this.inTransit(a)&&dist(a,s.goal)>UNIT_SPACE);if(blocker)this.yieldTo(blocker,s);path=this.findPath(s,s.goal);}
  if(path){s.path=path;nav.replans=(nav.replans||0)+1;nav.remaining=this.pathRemaining(s);}else{s.path=[];nav.waitUntil=this.time+.7;}
  nav.stalled=0;nav.nextRetry=this.time+1.5;
 }
 nudge(s,dx,dy){
  for(const [x,y] of [[s.x+dx,s.y+dy],[s.x+dx,s.y],[s.x,s.y+dy]])if(!this.blocked(x,y,UNIT_RADIUS+.2)&&this.insideRoom({x,y})){s.x=x;s.y=y;return true;}return false;
 }
 resolveBodies(dt){
  const alive=this.living();
  for(let pass=0;pass<4;pass++)for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){
   const a=alive[i],b=alive[j];let dx=a.x-b.x,dy=a.y-b.y,gap=Math.hypot(dx,dy);if(gap>=7.2)continue;
   if(gap<.01){dx=Math.cos(a.id*2.399);dy=Math.sin(a.id*2.399);gap=1;}
   const shift=Math.min(dt*3.5,(7.2-gap)*.52),ax=dx/gap*shift,ay=dy/gap*shift;
   const movedA=!(WEAPONS[a.weapon].fixed&&a.mount)&&this.nudge(a,ax,ay),movedB=!(WEAPONS[b.weapon].fixed&&b.mount)&&this.nudge(b,-ax,-ay);
   if(!movedA&&movedB)this.nudge(b,-ax,-ay);if(!movedB&&movedA)this.nudge(a,ax,ay);
  }
 }
 move(s,dt,speed){
  if(WEAPONS[s.weapon].fixed&&s.mount){s.vx=s.vy=0;return;}
  s.nav??={lastCheck:this.time,remaining:0,stalled:0,replans:0,waitUntil:0,waitFor:null,yield:null,nextRetry:0};
  if(this.time>=(s.nav.waitUntil||0))s.nav.waitFor=null;
  this.recoverTraffic(s);
  if(!s.path.length&&this.inTransit(s)&&this.time>=(s.nav.nextRetry||0)){const path=this.findPath(s,s.goal);if(path)s.path=path;else{s.nav.waitUntil=this.time+.6;s.nav.nextRetry=this.time+1;}}
  if(s.nav.yield){const y=s.nav.yield,other=this.soldiers.find(a=>a.id===y.for),passed=other&&y.direction?(other.x-s.x)*y.direction.x+(other.y-s.y)*y.direction.y:0;if(!other||other.hp<=0||(passed>7&&dist(other,s)>12)||(!this.inTransit(other)&&dist(other,s)>16)||this.time>y.until){s.nav.yield=null;s.path=s.goal?(this.findPath(s,s.goal)||[]):[];}}
  let p=s.nav.yield?.point||s.path[0]||s.goal;
  while(!s.nav.yield&&p&&s.path.length>1&&dist(s,p)<2.6&&this.clearPath(s,s.path[1])){s.path.shift();p=s.path[0];}
  if(!s.nav.yield&&p&&s.path.length>1&&dist(s,p)<6){const next=s.path[1],blend=clamp((6-dist(s,p))/6)*.65,look={x:p.x+(next.x-p.x)*blend,y:p.y+(next.y-p.y)*blend};if(this.clearPath(s,look))p=look;}
  if(s.nav.yield)p=s.nav.yield.point;
  const goalDistance=s.nav.yield?dist(s,s.nav.yield.point):s.goal?dist(s,s.goal):0,dx=p?p.x-s.x:0,dy=p?p.y-s.y:0,d=Math.hypot(dx,dy),moving=goalDistance>.4&&(!!s.nav.yield||s.path.length>0)&&this.time>=(s.nav.waitUntil||0);
  let vx=0,vy=0;
  if(moving&&d>.01){const v=speed*Math.min(1,goalDistance/3);vx=dx/d*v;vy=dy/d*v;}
  const dirX=d>.01?dx/d:Math.cos(s.moveHeading||0),dirY=d>.01?dy/d:Math.sin(s.moveHeading||0);
  for(const other of this.soldiers){
   if(other===s||other.hp<=0)continue;
   let ox=s.x-other.x,oy=s.y-other.y,gap=Math.hypot(ox,oy);if(gap>=12)continue;
   if(gap<.01){ox=s.id>other.id?1:-1;oy=0;gap=1;}
   const otherSpeed=Math.hypot(other.vx||0,other.vy||0);
   if(!moving&&otherSpeed<.5&&gap>7.2)continue;
   const future=Math.hypot(ox+((s.vx||0)-(other.vx||0))*.5,oy+((s.vy||0)-(other.vy||0))*.5);
   if(moving&&future<7.7&&(-ox*dirX-oy*dirY)>0){
    const otherMoving=this.inTransit(other),rank=this.passageRank(s)-this.passageRank(other),loser=otherMoving&&(rank<0||(rank===0&&s.id>other.id));
    if(!s.nav.yield&&loser&&other.nav?.waitFor!==s.id){s.nav.waitFor=other.id;s.nav.waitUntil=this.time+.35;this.yieldTo(s,other);vx*=.12;vy*=.12;}
    const cross=dirX*(-oy)-dirY*(-ox),sign=Math.abs(cross)>.8?(cross>0?-1:1):1;
    const strength=clamp((11-gap)/4)*2.5;vx+=-dirY*sign*strength;vy+=dirX*sign*strength;
   }
   if(gap<7.2){const strength=(7.2-gap)*1.6;vx+=ox/gap*strength;vy+=oy/gap*strength;}
   else if(!moving&&future<7.5&&otherSpeed>.8){vx+=ox/gap*.7;vy+=oy/gap*.7;}
  }
  const wanted=Math.min(speed,Math.hypot(vx,vy)),current=Math.hypot(s.vx||0,s.vy||0);
  if(wanted>.04){
   const desired=Math.atan2(vy,vx);if(s.moveHeading===null||s.moveHeading===undefined)s.moveHeading=current>.2?Math.atan2(s.vy,s.vx):desired;
   const delta=angleDiff(desired,s.moveHeading),turn=Math.min(2.8,1.6+current*.4);s.moveHeading+=clamp(delta,-turn*dt,turn*dt);
   const turnBrake=clamp(1-Math.abs(delta)/Math.PI,.15,1),targetSpeed=wanted*turnBrake,nextSpeed=current+clamp(targetSpeed-current,-dt*7,dt*4.5);
   s.vx=Math.cos(s.moveHeading)*nextSpeed;s.vy=Math.sin(s.moveHeading)*nextSpeed;
  }else {const next=Math.max(0,current-dt*7);s.vx=current?(s.vx||0)*next/current:0;s.vy=current?(s.vy||0)*next/current:0;}
  const oldX=s.x,oldY=s.y,nx=s.x+s.vx*dt,ny=s.y+s.vy*dt;
  if(this.insideRoom({x:nx,y:ny})&&!this.blocked(nx,ny,UNIT_RADIUS+.2)){s.x=nx;s.y=ny;}
  else if(this.insideRoom({x:nx,y:s.y})&&!this.blocked(nx,s.y,UNIT_RADIUS+.2)){s.x=nx;s.vy=0;}
  else if(this.insideRoom({x:s.x,y:ny})&&!this.blocked(s.x,ny,UNIT_RADIUS+.2)){s.y=ny;s.vx=0;}
  else{s.vx=s.vy=0;}
  for(const other of this.soldiers){
   if(other===s||other.hp<=0)continue;let ox=s.x-other.x,oy=s.y-other.y,gap=Math.hypot(ox,oy);if(gap>=7.2)continue;
   if(gap<.001){ox=s.id>other.id?1:-1;oy=0;gap=1;}
   const correction=Math.min(dt*2.2,(7.2-gap)*.55),x=s.x+ox/gap*correction,y=s.y+oy/gap*correction;
   if(this.insideRoom({x,y})&&!this.blocked(x,y,UNIT_RADIUS+.2)){s.x=x;s.y=y;}
  }
  s.travel+=Math.hypot(s.x-oldX,s.y-oldY);
  if(s.order&&s.goal&&dist(s,s.goal)<=1.2&&s.order.arrivedAt===null){s.order.arrivedAt=this.time;s.maneuverUntil=Math.max(s.maneuverUntil||0,this.time+3);}
 }
 los(a,b){return !this.map.walls.some(r=>segmentHit(a,b,r))&&!this.map.crates.some(r=>segmentHit(a,b,r));}
 spawnEnemy(forceKind=null,forceSide=null){
  const side=forceSide??this.rng.int(4),g=this.gates[side];
  let kind=forceKind||this.rng.pick(this.enemyPool());
  const z={id:this.id++,side,kind,x:0,y:0,hp:kind==='mother'?2400:kind==='heavy'?200:kind==='runner'?70:90,max:0,armor:kind==='heavy'?.55:kind==='mother'?.32:0,speed:kind==='mother'?1.8:kind==='runner'?5:kind==='heavy'?2:2.7,attack:0,inside:false,entered:false};
  const spread=(this.rng.next()-.5)*110,edge=this.map.terrain?.edge??18;
  z.entryOffset=g.width?((z.id*.61803398875)%1-.5)*Math.max(0,g.width-7):0;
  if(side===0){z.x=200+spread;z.y=edge+this.rng.next()*10;}
  if(side===1){z.x=400-edge-this.rng.next()*10;z.y=205+spread;}
  if(side===2){z.x=200+spread;z.y=400-edge-this.rng.next()*10;}
  if(side===3){z.x=edge+this.rng.next()*10;z.y=205+spread;}
  z.max=z.hp;this.enemies.push(z);this.spawned++;this.waveSpawned++;return z;
 }
 // Ammunition stays with the donor until an adjacent, uninterrupted handoff completes.
 handoffFor(s){return this.ammoHandoffs.find(h=>h.fromId===s.id||h.toId===s.id);}
 shareReady(s){return s.hp>0&&s.task!=='supply'&&!s.supplyAssigned&&s.reload<=0&&!WEAPONS[s.weapon].fixed&&!this.inTransit(s)&&!s.nav?.yield&&this.time>=(s.buddyCooldownUntil||0);}
 handoffSafe(a,b){return dist(a,b)<=12&&this.los(a,b)&&!this.enemies.some(z=>z.hp>0&&(dist(z,a)<12||dist(z,b)<12));}
 assignBuddyAmmo(){
  const alive=this.living();
  const recipients=alive.filter(s=>this.shareReady(s)&&!this.handoffFor(s)&&s.mag+s.reserve<=WEAPONS[s.weapon].mag*.2).sort((a,b)=>a.mag+a.reserve-b.mag-b.reserve||a.id-b.id);
  for(const target of recipients){
   if(this.ammoHandoffs.length>=2)break;
   const w=WEAPONS[target.weapon];
   const donors=alive.filter(s=>s!==target&&this.shareReady(s)&&!this.handoffFor(s)&&s.weapon===target.weapon&&s.mag>0&&s.reserve>WEAPONS[s.weapon].mag&&this.handoffSafe(s,target));
   donors.sort((a,b)=>(a.teamId===target.teamId?0:20)+dist(a,target)-(b.teamId===target.teamId?0:20)-dist(b,target)||a.id-b.id);
   const donor=donors[0];if(!donor)continue;
   const qty=Math.min(w.mag,donor.reserve-w.mag,this.capacity(target)-target.mag-target.reserve);
   if(qty>0)this.ammoHandoffs.push({fromId:donor.id,toId:target.id,weapon:target.weapon,type:w.ammo,qty,elapsed:0,duration:1.2});
  }
 }
 updateBuddyAmmo(dt){
  const keep=[];
  for(const h of this.ammoHandoffs){
   const donor=this.soldiers.find(s=>s.id===h.fromId),target=this.soldiers.find(s=>s.id===h.toId),w=WEAPONS[h.weapon];
   if(!donor||!target||!this.shareReady(donor)||!this.shareReady(target)||donor.weapon!==h.weapon||target.weapon!==h.weapon||!this.handoffSafe(donor,target)){continue;}
   h.elapsed+=dt;if(h.elapsed<h.duration){keep.push(h);continue;}
   const qty=Math.max(0,Math.min(h.qty,donor.reserve-w.mag,this.capacity(target)-target.mag-target.reserve));
   if(qty){donor.reserve-=qty;target.reserve+=qty;this.buddyTransfers++;donor.buddyCooldownUntil=target.buddyCooldownUntil=this.time+8;this.lastBuddyTransfer={fromId:donor.id,toId:target.id,qty,type:h.type,time:this.time};this.effects.push({type:'supply',x:target.x,y:target.y,life:1.2,max:1.2,text:'匀弹 +'+qty});}
  }
  this.ammoHandoffs=keep;
 }
 shouldReload(s,alive,best){
  const w=WEAPONS[s.weapon];if(s.reserve<=0)return false;if(s.mag===0)return true;
  const mates=alive.filter(a=>a!==s&&a.teamId===s.teamId),buddy=mates.some(a=>this.coverReady(a)&&!this.handoffFor(a)&&a.mag>WEAPONS[a.weapon].mag*.4);
  if(!buddy||mates.some(a=>a.reload>0||(a.mag===0&&a.reserve>0))||s.burst!==0||this.handoffFor(s))return false;
  if(w.mag>7&&s.mag<w.mag*.18)return true;
  // Top up during a lull, while a partner keeps watching; never discard a partial magazine.
  return !best&&!this.inTransit(s)&&this.time-(s.lastContactAt??this.time)>2.2&&s.mag<w.mag*.6&&s.reserve>=w.mag-s.mag;
 }
 assignSupplies(){
  const alive=this.living(),max=Math.max(1,Math.ceil(alive.length*(this.tactic==='resupply'?.21:.08))),busy=alive.filter(s=>s.task==='supply').length;
  if(busy>=max)return;
  const requests=alive.filter(s=>!s.supplyAssigned&&!this.handoffFor(s)&&s.task!=='supply'&&s.mag+s.reserve<WEAPONS[s.weapon].mag*.85&&(this.stock[WEAPONS[s.weapon].ammo]||0)>0).sort((a,b)=>(a.mag+a.reserve)-(b.mag+b.reserve));
  for(const target of requests.slice(0,max-busy)){
   const type=WEAPONS[target.weapon].ammo;
   const reserved=alive.filter(s=>s.supply?.type===type&&s.supply.phase==='pickup').reduce((a,s)=>a+s.supply.qty,0);
   const qty=Math.min(this.capacity(target)-target.mag-target.reserve,this.stock[type]-reserved);
   if(qty<=0)continue;
   const candidates=alive.filter(s=>s.task!=='supply'&&!WEAPONS[s.weapon].fixed&&s.supplyAssigned===null&&!this.handoffFor(s)&&!this.inTransit(s)&&this.time>=(s.maneuverUntil||0)&&this.canLeaveForSupply(s));
   candidates.sort((a,b)=>(a.id===target.id?18:0)+dist(a,CENTER)-(b.id===target.id?18:0)-dist(b,CENTER));
   const carrier=candidates[0]||(!WEAPONS[target.weapon].fixed&&!this.handoffFor(target)&&!this.inTransit(target)&&this.canLeaveForSupply(target)?target:null);
   if(!carrier)continue;
   carrier.task='supply';carrier.supply={targetId:target.id,type,qty,cargo:0,phase:'pickup'};target.supplyAssigned=carrier.id;
   this.setGoal(carrier,CENTER,{kind:'supply-pickup',priority:40,force:true});
  }
 }
 updateSupply(s,dt){
  const req=s.supply;if(!req){s.task='guard';return;}
  const target=this.soldiers.find(x=>x.id===req.targetId);
  if(!target||target.hp<=0||WEAPONS[target.weapon].ammo!==req.type){
   if(req.cargo>0){if(req.phase!=='return'){req.phase='return';this.releaseOrder(s);}this.setGoal(s,CENTER,{kind:'supply-return',priority:45});this.move(s,dt,3.4);if(!s.goal||dist(s,s.goal)>2.4||dist(s,CENTER)>18)return;this.stock[req.type]+=req.cargo;req.cargo=0;}
   if(target)target.supplyAssigned=null;s.supply=null;s.task='guard';this.releaseOrder(s);this.deploy();return;
  }
  if(req.phase==='pickup'){
   this.setGoal(s,CENTER,{kind:'supply-pickup',priority:40});this.move(s,dt,3.8);
   if(s.goal&&dist(s,s.goal)<=2.4&&dist(s,CENTER)<18){const qty=Math.min(req.qty,this.stock[req.type]);this.stock[req.type]-=qty;req.cargo=qty;req.phase='deliver';this.releaseOrder(s);}
  }else{
   this.setGoal(s,target,{kind:'supply-deliver',priority:40,follow:true});this.move(s,dt,3.4);
   if((dist(s,target)<10.5&&this.los(s,target))||s.id===target.id){
    const accepted=Math.min(req.cargo,this.capacity(target)-target.mag-target.reserve);
    target.reserve+=accepted;this.stock[req.type]+=req.cargo-accepted;req.cargo=0;target.supplyAssigned=null;s.supply=null;s.task='guard';this.releaseOrder(s);this.supplyRuns++;
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
  z.hp-=amount*(1-z.armor*(1-(weapon.pierce||0)));z.hit=.14;
  if(z.hp<=0){this.kills++;z.hp=0;this.effects.push({type:'death',x:z.x,y:z.y,life:.35,max:.35,color:z.kind==='mother'?'#e77f9f':'#a486da'});}
 }
 fire(s,z){
  const w=WEAPONS[s.weapon];s.mag--;s.shots++;this.fired[w.ammo]++;s.burst++;
  let chance=clamp(w.accuracy-dist(s,z)/(w.range*2.4),.2,.96);
  if(s.task==='supply')chance*=.65;else if(Math.hypot(s.vx||0,s.vy||0)>1.5)chance*=.85;
  const hit=this.rng.next()<chance;
  const flight=dist(s,z)/SPEED[s.weapon],end={x:z.x+(z.vx||0)*flight+(hit?0:(this.rng.next()<.5?-1:1)*(5+this.rng.next()*7)),y:z.y+(z.vy||0)*flight+(hit?0:(this.rng.next()-.5)*14)};
  const angle=Math.atan2(end.y-s.y,end.x-s.x),distance=dist(s,end),pellets=s.weapon==='benelli'?7:1;
  s.recoil=1;s.targetId=z.id;s.activity='fire';
  this.effects.push({type:'muzzle',x:s.x+Math.cos(angle)*5.2,y:s.y+Math.sin(angle)*5.2,angle,life:.055,max:.055});
  for(let i=0;i<pellets;i++){
   const a=angle+(pellets>1?(i-3)*.019+(this.rng.next()-.5)*.012:0),speed=SPEED[s.weapon],x=s.x+Math.cos(a)*4.3,y=s.y+Math.sin(a)*4.3;
   this.projectiles.push({x,y,px:x,py:y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,speed,travel:0,length:distance,remaining:Math.min(w.range,distance+(w.blast?0:10))-4.3,weapon:s.weapon,sourceId:s.id,targetId:z.id,damage:w.damage/pellets,expected:w.damage/pellets*(hit?.9:.15),grenade:!!w.blast});
  }
  s.cooldown=60/w.rpm;
  if(s.burst>=w.burst){s.burst=0;s.cooldown+=w.pause;}
  return w.damage*(hit?.9:.15)*(1-z.armor*(1-(w.pierce||0)));
 }
 impact(p,enemy){
  const w=WEAPONS[p.weapon],shooter=this.soldiers.find(s=>s.id===p.sourceId);
  const hit=z=>{const before=z.hp;this.damageEnemy(z,p.damage,w);if(before>0&&z.hp<=0&&shooter)shooter.kills++;};
  if(p.grenade){for(const z of this.enemies)if(z.hp>0&&dist(z,p)<w.blast){const damage=p.damage;p.damage=damage*(1-dist(z,p)/(w.blast*1.4));hit(z);p.damage=damage;}this.effects.push({type:'blast',x:p.x,y:p.y,r:w.blast,life:.42,max:.42});}
  else {if(enemy)hit(enemy);this.effects.push({type:'impact',x:p.x,y:p.y,life:.13,max:.13,color:enemy?'#d2a2ef':'#a5bdd4'});}
 }
 updateProjectiles(dt){
  const keep=[];
  for(const p of this.projectiles){
   p.px=p.x;p.py=p.y;
   const step=Math.max(0,Math.min(p.remaining,p.speed*dt)),end={x:p.x+p.vx/p.speed*step,y:p.y+p.vy/p.speed*step};
   let first=1,collision=false,enemy=null;
   for(const wall of [...this.map.walls,...this.map.crates]){const t=rectEntry(p,end,wall);if(t!==null&&t<=first){first=t;collision=true;enemy=null;}}
   if(!p.grenade)for(const z of this.enemies){if(z.hp<=0)continue;const r=z.kind==='mother'?7:z.kind==='heavy'?3.6:2.8,t=circleEntry(p,end,z,r);if(t!==null&&t<first){first=t;collision=true;enemy=z;}}
   p.x+=(end.x-p.x)*first;p.y+=(end.y-p.y)*first;p.travel+=step*first;p.remaining-=step*first;
   if(collision||p.remaining<.01){this.impact(p,enemy);if(!p.grenade)this.effects.push({...p,type:'tracer',life:2/30,max:2/30});}else keep.push(p);
  }
  this.projectiles=keep;
 }
 friendlyBlocker(s,z,alive){
  const dx=z.x-s.x,dy=z.y-s.y,length=dx*dx+dy*dy;
  if(length<1)return null;
  return alive.find(a=>{if(a===s||a.hp<=0)return false;const t=((a.x-s.x)*dx+(a.y-s.y)*dy)/length;return t>.035&&t<.94&&Math.hypot(a.x-s.x-t*dx,a.y-s.y-t*dy)<2.7;})||null;
 }
 chooseTarget(s,targets,alive,committed){
  const w=WEAPONS[s.weapon],protectedUnit=s.coop?.role==='cover'?alive.find(a=>a.id===s.coop.partnerId&&a.hp>0):null;let best=null,score=Infinity,blocked=null;
  for(const z of targets){
   if(z.hp<=0)continue;
   const d=dist(s,z);if(d>Math.min(w.range,ENGAGEMENT[s.weapon])||(w.minRange&&d<w.minRange)||!this.los(s,z))continue;
   if(w.blast&&alive.some(a=>dist(a,z)<w.blast+2))continue;
   if((committed.get(z.id)||0)>=z.hp*1.05&&!w.blast)continue;
   if(this.friendlyBlocker(s,z,alive)){if(!blocked||dist(s,z)<dist(s,blocked))blocked=z;continue;}
   const protect=protectedUnit&&z.entered?Math.max(0,24-dist(z,protectedUnit))*2:0;
   const armorFit=(s.weapon==='m110'||s.weapon==='m2')?-z.armor*35:w.pierce<.2?z.armor*20:0;
   const cluster=w.blast?Math.min(4,targets.filter(a=>a!==z&&a.hp>0&&dist(a,z)<w.blast).length)*6:0;
   let v=d+(z.id===s.targetId?-9:0)+(z.inside?-55:0)+(this.tactic==='focus_heavy'&&(z.kind==='heavy'||z.kind==='mother')?-120:0)-protect+armorFit-cluster;
   if(z.inside&&(s.weapon==='benelli'||s.weapon==='mp5'))v-=Math.max(0,30-d)*1.2;
   if(z.side!==s.side&&!z.inside)v+=45;
   if(v<score){best=z;score=v;}
  }
  if(!best&&blocked){
   s.blockedSince??=this.time;
   if(this.time-s.blockedSince>.65&&s.task!=='supply'&&!WEAPONS[s.weapon].fixed&&!s.localOffset&&!this.inTransit(s)){
    const candidates=[];
    for(const radius of [8.5,12,16,20])for(let i=0;i<24;i++){
     const angle=i*Math.PI/12,p={x:s.x+Math.cos(angle)*radius,y:s.y+Math.sin(angle)*radius};
     if(this.destinationFree(s,p)&&this.clearPath(s,p)&&this.los(p,blocked)&&!this.friendlyBlocker(p,blocked,alive))candidates.push(p);
    }
    candidates.sort((a,b)=>dist(s,a)-dist(s,b)||dist(a,CENTER)-dist(b,CENTER));
    if(candidates.length){s.localOffset={amount:0,point:candidates[0],until:this.time+8};this.coordinationAge=99;}
   }
  }else s.blockedSince=null;
  return best;
 }
 separateEnemies(dt){
  const buckets=new Map(),cell=10;
  for(const z of this.enemies){if(z.hp<=0)continue;const key=Math.floor(z.x/cell)+','+Math.floor(z.y/cell);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(z);}
  for(const z of this.enemies){
   if(z.hp<=0)continue;let pushX=0,pushY=0;const bx=Math.floor(z.x/cell),by=Math.floor(z.y/cell);
   for(let x=bx-1;x<=bx+1;x++)for(let y=by-1;y<=by+1;y++)for(const other of buckets.get(x+','+y)||[]){
    if(other===z)continue;let dx=z.x-other.x,dy=z.y-other.y,d=Math.hypot(dx,dy),spacing=(z.kind==='mother'||other.kind==='mother')?8:4.7;
    if(d>=spacing)continue;if(d<.01){const a=(z.id*2.399963+other.id)*Math.sign(z.id-other.id);dx=Math.cos(a);dy=Math.sin(a);d=1;}
    const strength=(spacing-d)*1.5;pushX+=dx/d*strength;pushY+=dy/d*strength;
   }
   const length=Math.hypot(pushX,pushY),scale=length>3?3/length:1,nx=z.x+pushX*scale*dt,ny=z.y+pushY*scale*dt;
   if(!this.blocked(nx,ny,.7)){z.x=nx;z.y=ny;}
  }
 }
 step(dt){
  if(this.phase!=='combat')return;
  if(this.trafficMigration){for(const s of this.living()){if(!this.insideRoom(s)||this.blocked(s.x,s.y,UNIT_RADIUS+.2)){const p=this.freePoint(s,s,'spawn');if(p){s.x=p.x;s.y=p.y;}}if(s.goal)s.path=this.findPath(s,s.goal)||[];}this.trafficMigration=false;this.coordinationAge=99;}
  this.time+=dt;this.waveTime+=dt;this.nodeTime+=dt;this.decisionAge+=dt;
  if(this.decisionAge>=1.2){this.decide();this.decisionAge=0;}
  this.spawnClock-=dt;
  if(this.remaining>0&&this.spawnClock<=0){const count=Math.min(12,this.remaining,240-this.enemies.filter(z=>z.hp>0).length),side=this.node.fronts?.length&&this.rng.next()<.65?this.rng.pick(this.node.fronts):this.rng.int(4);for(let i=0;i<count;i++){this.spawnEnemy(null,this.rng.next()<.8?side:this.rng.int(4));this.remaining--;}this.spawnClock=this.spawnInterval*(.94+this.rng.next()*.12);}
  if(this.nodeIndex===3&&this.wave===2&&!this.bossSpawned&&this.waveTime>18){this.spawnEnemy('mother',this.rng.int(4));this.bossSpawned=true;this.log('母体出现','集中重火力，注意侧门和弹药储备。');}
  this.updateBuddyAmmo(dt);
  if(!this.supplyClock||this.time>=this.supplyClock){this.assignBuddyAmmo();this.assignSupplies();this.supplyClock=this.time+.6;}
  const alive=this.living(),targets=this.enemies.filter(z=>z.hp>0);
  this.coordinationAge+=dt;if(this.coordinationAge>=.4){this.coordinate();this.coordinationAge=0;}
  this.updateProjectiles(dt);
  const committed=new Map();for(const p of this.projectiles){const w=WEAPONS[p.weapon],z=targets.find(z=>z.id===p.targetId);committed.set(p.targetId,(committed.get(p.targetId)||0)+p.expected*(1-(z?.armor||0)*(1-(w.pierce||0))));}
  for(const s of alive){
   s.cooldown=Math.max(0,s.cooldown-dt);s.recoil=Math.max(0,(s.recoil||0)-dt*8);s.hit=Math.max(0,(s.hit||0)-dt);s.scanClock=(s.scanClock||0)-dt;
   if(s.task==='supply')this.updateSupply(s,dt);else this.move(s,dt,WEAPONS[s.weapon].fixed?1.5:3.0);
   const w=WEAPONS[s.weapon];
   let best=targets.find(z=>z.id===s.targetId&&z.hp>0);
   if(s.scanClock<=0||!best){best=this.chooseTarget(s,targets,alive,committed);s.targetId=best?.id??null;s.scanClock=.17+(s.id%5)*.035;}
   if(best||targets.some(z=>z.hp>0&&dist(z,s)<30&&this.los(s,z)))s.lastContactAt=this.time;
   const walking=Math.hypot(s.vx||0,s.vy||0)>.5,aim=best||(walking?{x:s.x+s.vx*5,y:s.y+s.vy*5}:this.gates[s.side]);
   const scan=!best&&!walking&&s.reload<=0?Math.sin(this.time*(.52+(s.id%4)*.055)+s.id*2.399)*.23:0;
   const angle=Math.atan2(aim.y-s.y,aim.x-s.x)+scan,delta=angleDiff(angle,s.facing),desiredTurn=clamp(delta*7,best?-5.5:-3.4,best?5.5:3.4);
   s.turnVelocity=(s.turnVelocity||0)+(desiredTurn-(s.turnVelocity||0))*Math.min(1,dt*9);
   s.facing+=clamp(s.turnVelocity*dt,-Math.abs(delta),Math.abs(delta));
   s.activity=s.nav?.yield?'yield':this.time<(s.nav?.waitUntil||0)?'wait':s.task==='supply'?'haul':s.reload>0?'reload':Math.hypot(s.vx||0,s.vy||0)>.7?(s.retreating?'retreat':s.order?.kind==='relief'?'relief':'move'):s.covering?'cover':s.coop?.role==='wait'?'team-wait':best?'aim':'guard';
   if(w.fixed&&!s.mount){if(s.goal&&dist(s,s.goal)>1.3)continue;s.setup=(s.setup??3)-dt;if(s.setup>0)continue;s.mount={x:s.x,y:s.y};}
   if(s.reload>0){s.reload-=dt;if(s.reload<=0){const n=Math.min(w.mag-s.mag,s.reserve);s.mag+=n;s.reserve-=n;}continue;}
   if(this.handoffFor(s)?.fromId===s.id){s.activity='share';continue;}
   if(this.shouldReload(s,alive,best)){s.reload=w.reload/this.mod.reload;s.activity='reload';this.coordinationAge=99;continue;}
   if(s.cooldown>0)continue;
   if(best&&(committed.get(best.id)||0)>=best.hp*1.05)best=this.chooseTarget(s,targets,alive,committed);
   if(best&&s.mag>0&&Math.abs(angleDiff(Math.atan2(best.y-s.y,best.x-s.x),s.facing))<.3&&this.los(s,best)&&!this.friendlyBlocker(s,best,alive)){
    const damage=this.fire(s,best);committed.set(best.id,(committed.get(best.id)||0)+damage);
   }
   else if(best&&dist(s,best)<3){this.damageEnemy(best,18,{pierce:0});s.cooldown=1;}
  }
  this.resolveBodies(dt);
  for(const z of targets){
   if(z.hp<=0)continue;z.attack=Math.max(0,z.attack-dt);z.hit=Math.max(0,(z.hit||0)-dt);z.vx=z.vy=0;
   const gate=this.gates[z.side],entry={x:gate.x+(z.side===0||z.side===2?z.entryOffset||0:0),y:gate.y+(z.side===1||z.side===3?z.entryOffset||0:0)},inner={...entry};
   if(z.side===0)inner.y+=8;if(z.side===1)inner.x-=8;if(z.side===2)inner.y-=8;if(z.side===3)inner.x+=8;
   const entryDepth=z.side===0?z.y-gate.y:z.side===1?gate.x-z.x:z.side===2?gate.y-z.y:z.x-gate.x;
   let goal=entry;
   if(!z.entered){
    const outside={...entry};if(z.side===0)outside.y-=4;if(z.side===1)outside.x+=4;if(z.side===2)outside.y+=4;if(z.side===3)outside.x-=4;
    goal=outside;
    if(dist(z,entry)<7){
     if(gate.hp>0){if(z.attack<=0){gate.hp=Math.max(0,gate.hp-(z.kind==='mother'?65:z.kind==='heavy'?28:12));z.attack=.9;if(gate.hp===0){this.log(SIDES[z.side]+'破口','自动防守重新评估，尸群可以通过入口。');this.decisionAge=99;}}continue;}
     z.entered=true;goal=inner;
    }
   }else if(entryDepth<7){
    // Finish crossing the doorway before turning toward a nearby defender.
    goal=inner;
   }else{
    z.inside=true;
    let closest=null,d=Infinity;
    for(const s of alive)if(s.hp>0&&dist(s,z)<d&&this.los(z,s)){closest=s;d=dist(s,z);}
    goal=this.node.mode==='hold'&&dist(z,CENTER)<d?CENTER:closest||CENTER;
    if(dist(z,goal)<3.2){
     if(z.attack<=0){const damage=z.kind==='mother'?35:z.kind==='heavy'?22:11;
      if(goal===CENTER)this.core.hp=Math.max(0,this.core.hp-damage);
      else {goal.hp=Math.max(0,goal.hp-damage*(1-this.mod.armor));goal.hit=.18;if(goal.hp===0)this.killSoldier(goal);}
      z.attack=.85;
     }continue;
    }
   }
   const oldX=z.x,oldY=z.y,d=dist(z,goal),step=Math.min(d,z.speed*dt);
   if(d>0){const nx=z.x+(goal.x-z.x)/d*step,ny=z.y+(goal.y-z.y)/d*step;
    if(!z.entered||!this.blocked(nx,ny,.6)){z.x=nx;z.y=ny;}
    else if(!this.blocked(nx,z.y,.6))z.x=nx;else if(!this.blocked(z.x,ny,.6))z.y=ny;
   }
   z.vx=(z.x-oldX)/dt;z.vy=(z.y-oldY)/dt;z.travel=(z.travel||0)+Math.hypot(z.x-oldX,z.y-oldY);z.facing=Math.atan2(goal.y-z.y,goal.x-z.x);
  }
  this.separateEnemies(dt);
  for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0).slice(-180);
  if(this.time-(this.cleanTime||0)>3){this.enemies=this.enemies.filter(z=>z.hp>0);this.cleanTime=this.time;}
  if(this.living().length===0||(this.node.mode==='hold'&&this.core.hp<=0)){this.end(false,this.living().length===0?'全队阵亡':'据点核心被毁');return;}
  let complete=false;
  if(this.node.mode==='hold')complete=this.waveTime>=this.holdDuration;
  else complete=this.remaining===0&&!this.enemies.some(z=>z.hp>0)&&(this.nodeIndex!==3||this.wave!==2||this.bossSpawned);
  if(complete)this.finishWave();
 }
 loadoutPreview(card){
  const weapons=card.weapons||Array.from({length:card.count??(WEAPONS[card.weapon]?.fixed?1:2)},()=>card.weapon),changes=[],used=new Set(),ammo={};
  for(const key of weapons){
   const w=WEAPONS[key];if(!w)continue;
   ammo[w.ammo]=(ammo[w.ammo]||0)+w.carry;
   const units=this.living().filter(s=>!used.has(s.id)&&s.weapon!==key&&(!WEAPONS[s.weapon].fixed||card.allowFixed));
   const firstTeam=changes.length?this.soldiers.find(s=>s.id===changes[0].id)?.teamId:null;
   const rank=s=>({m4:0,mp5:1,benelli:2,m249:4,m110:5,m203:6,m2:100}[s.weapon]??10)*10+(s.task==='supply'?80:0)-(this.node?.fronts?.includes(s.side)?1:0)-(firstTeam&&s.teamId===firstTeam?2:0);
   units.sort((a,b)=>rank(a)-rank(b)||a.id-b.id);const unit=units[0];if(unit){changes.push({id:unit.id,from:unit.weapon,to:key});used.add(unit.id);}
  }
  return {changes,ammo:card.ammo?{...card.ammo}:ammo};
 }
 applyLoadout(card){
  const preview=this.loadoutPreview(card);
  for(const [type,qty] of Object.entries(preview.ammo))this.gainAmmo(type,qty);
  for(const change of preview.changes){
   const s=this.soldiers.find(s=>s.id===change.id),old=WEAPONS[s.weapon];this.stock[old.ammo]+=s.mag+s.reserve;s.mag=s.reserve=0;s.weapon=change.to;s.reload=0;s.mount=null;s.setup=3;this.takeAmmo(s,this.capacity(s));
  }
  return preview;
 }
 focusedAmmoCards(){
  const quantities=this.ammoPackage(),types=Object.keys(quantities),inventory=this.inventory().remaining,alive=this.living();if(types.length<2)return [];
  types.sort((a,b)=>inventory[a]/alive.filter(s=>WEAPONS[s.weapon].ammo===a).reduce((n,s)=>n+WEAPONS[s.weapon].mag,0)-inventory[b]/alive.filter(s=>WEAPONS[s.weapon].ammo===b).reduce((n,s)=>n+WEAPONS[s.weapon].mag,0));
  return types.map(type=>({id:'ammo-'+type,kind:'ammo',name:AMMO[type]+' 集中补给',tag:'集中补给',icon:'▥',ammo:{[type]:Math.round(quantities[type]*1.5)},description:'本箱集中补充 '+AMMO[type]+'，供 '+alive.filter(s=>WEAPONS[s.weapon].ammo===type).length+' 名队员使用；由队员搬运。'}));
 }
 rewardAdvice(card){
  if(card.kind!=='weapon'&&card.kind!=='loadout')return '';
  const preview=this.loadoutPreview(card),before=new Set(this.living().map(s=>WEAPONS[s.weapon].ammo)),newTypes=[...new Set(preview.changes.map(c=>WEAPONS[c.to].ammo))].filter(t=>!before.has(t));
  if(newTypes.length)return '新增 '+newTypes.map(t=>AMMO[t]).join(' / ')+' 补给需求，后续需留意同口径弹药。';
  const keys=new Set(preview.changes.map(c=>WEAPONS[c.to].ammo));
  return [...keys].map(type=>{let n=this.living().filter(s=>WEAPONS[s.weapon].ammo===type).length;for(const c of preview.changes){if(WEAPONS[c.from].ammo===type)n--;if(WEAPONS[c.to].ammo===type)n++;}return AMMO[type]+' 将由 '+n+' 人共用，当前共享库存 '+(this.stock[type]||0)+' 发';}).join('；')+'。';
 }
 shortAmmoTypes(){
  const inventory=this.inventory().remaining,units=this.living();
  return [...new Set(units.map(s=>WEAPONS[s.weapon].ammo))].filter(type=>inventory[type]<=units.filter(s=>WEAPONS[s.weapon].ammo===type).reduce((n,s)=>n+WEAPONS[s.weapon].mag*1.5,0));
 }
 loadoutSummary(){
  const counts={};for(const s of this.living())counts[s.weapon]=(counts[s.weapon]||0)+1;
  const styles=[];if((counts.m249||0)+(counts.m2||0)>=4)styles.push('火力支援');if((counts.m110||0)>=2)styles.push('精确射击');if((counts.mp5||0)+(counts.benelli||0)>=4)styles.push('近距防守');if((counts.m203||0)>=2)styles.push('榴弹支援');
  return {counts,styles:styles.length?styles:['混合步兵'],shortAmmo:this.shortAmmoTypes()};
 }
 claimNodePayout(){
  if(this.node.payoutClaimed)return;this.node.payoutClaimed=true;
  const payout=this.node.payout||(this.node.flavor==='ammo'?{kind:'ammo',ammo:{n556:260,shell:28}}:this.node.flavor==='rescue'?{kind:'rescue',count:2}:null);
  if(!payout)return;
  if(payout.kind==='ammo'){for(const [type,qty] of Object.entries(payout.ammo))this.gainAmmo(type,qty);this.log('取得据点物资',Object.entries(payout.ammo).map(([type,qty])=>AMMO[type]+' '+qty+'发').join('、')+'；存入共享库存。');}
  if(payout.kind==='rescue'){let added=0;for(let i=0;i<payout.count;i++)if(this.addSoldier('m4',true))added++;const spare=payout.count-added;if(spare)this.gainAmmo('n556',spare*90);this.log('救援完成','接应 '+added+' 名队员'+(spare?'；编制已满，另收下 '+spare*90+' 发5.56弹药':'，每人携带90发5.56弹药')+'。');}
  if(payout.kind==='armory'){const result=this.applyLoadout(payout.card);this.log('接收军械',payout.card.name+' · '+result.changes.length+'名队员换装，配套弹药已入账。');}
 }
 finishWave(){
  if(this.phase!=='combat')return;
  if(this.wave>=2){this.claimNodePayout();if(this.nodeIndex>=3){this.end(true,'最终据点已清除');return;}}
  this.phase='reward';this.choices=this.rewardChoices();
  this.log('波次完成',this.wave>=2?'据点目标完成。选择一项奖励后前往路线。':'战斗暂停。选择一项奖励，准备下一波。');
 }
 rewardChoices(){
  const alive=this.living(),stage=this.nodeIndex;
  let weapons=Object.keys(LOADOUTS).filter(key=>LOADOUTS[key].minStage<=stage).map(key=>this.packageCard(key)).filter(card=>this.loadoutPreview(card).changes.length);
  // A completely fixed roster may explicitly choose to dismantle a mount for a mobile loadout.
  if(!weapons.length&&alive.length&&alive.every(s=>WEAPONS[s.weapon].fixed))weapons=Object.keys(LOADOUTS).filter(key=>LOADOUTS[key].minStage<=stage).map(key=>({...this.packageCard(key),allowFixed:true})).filter(card=>this.loadoutPreview(card).changes.length);
  const focused=this.focusedAmmoCards();
  const supplies=[
   {id:'ammo',kind:'ammo',name:'混编弹药补给箱',tag:'补给',icon:'▥',ammo:this.ammoPackage(),description:'补充当前各类弹种，由队员实际搬运。'},
   ...focused,
   {id:'recruits',kind:'recruits',name:'接应步枪小组',tag:'补员',icon:'＋',description:'最多3名M4A1步枪兵，每人携带90发5.56。人数上限35。'},
   {id:'bags',kind:'bags',name:'扩充弹药携行',tag:'后勤',icon:'▧',description:'个人携弹上限提高20%，最多60%。不生成弹药。'}
  ].filter(card=>card.kind!=='recruits'||alive.length<35).filter(card=>card.kind!=='bags'||this.mod.carry<1.6);
  const upgrades=[
   {id:'armor',kind:'armor',name:'防护装备',tag:'防护',icon:'◇',description:'改善全队近身防护。伤害减免属于游戏近似，最多40%。'},
   {id:'repair',kind:'repair',name:'修缮与加固',tag:'工事',icon:'▤',description:'维修门与核心，并将后续据点门耐久提高15%。'},
   {id:'drill',kind:'drill',name:'装填训练',tag:'训练',icon:'↻',description:'改善装填动作效率，换弹处理速度提高12%，上限40%。'}
  ].filter(card=>card.kind!=='armor'||this.mod.armor<.4).filter(card=>card.kind!=='drill'||this.mod.reload<1.4);
  const counts=this.loadoutSummary().counts,weighted=[];
  for(const card of weapons){const keys=card.weapons||[card.weapon],familiar=keys.reduce((n,key)=>n+(counts[key]||0),0);for(let i=0;i<1+Math.min(2,Math.floor(familiar/2));i++)weighted.push(card);}
  const short=this.shortAmmoTypes(),urgent=short.length===1?focused.find(c=>c.ammo[short[0]]):null;
  const first=this.rng.pick(weighted.length?weighted:upgrades),second=short.length?(urgent||supplies[0]):this.rng.pick(supplies);
  const rest=[...weapons,...supplies,...upgrades].filter(card=>card.id!==first.id&&card.id!==second.id),third=this.rng.pick(rest);
  return this.rng.shuffle([first,second,third]);
 }
 chooseReward(id){
  if(this.phase!=='reward')return false;
  const card=this.choices.find(x=>x.id===id);if(!card)return false;
  if(card.kind==='ammo'){
   if(card.ammo){for(const [type,qty] of Object.entries(card.ammo))this.gainAmmo(type,qty);}
   else {const types=new Set(this.living().map(s=>WEAPONS[s.weapon].ammo));for(const t of types)this.gainAmmo(t,t==='shell'?56:t==='g40'?12:t==='n50'?200:600);}
  }
  if(card.kind==='recruits')for(let i=0;i<3;i++)this.addSoldier('m4',true);
  if(card.kind==='armor')this.mod.armor=Math.min(.4,this.mod.armor+.09);
  if(card.kind==='drill')this.mod.reload=Math.min(1.4,this.mod.reload*1.12);
  if(card.kind==='bags')this.mod.carry=Math.min(1.6,this.mod.carry*1.2);
  if(card.kind==='repair'){this.mod.doors*=1.15;for(const g of this.gates){g.max*=1.15;g.hp=g.max;}this.core.hp=this.core.max;}
  if(card.kind==='weapon'||card.kind==='loadout')this.applyLoadout(card);
  this.rewardCount++;this.log('选择奖励',card.name);
  this.choices=[];
  if(this.wave>=2){
   // All survivors finish carrying tasks before strategic transfer. Unused cargo returns to shared stock.
   for(const s of this.living()){if(s.supply?.cargo)this.stock[s.supply.type]+=s.supply.cargo;s.supply=null;s.supplyAssigned=null;s.task='guard';this.releaseOrder(s);}
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
 static restore(raw,aiProvider=null){
  const v=typeof raw==='string'?JSON.parse(raw):raw,g=Object.create(Game.prototype);Object.assign(g,v);g.rng=new RNG(1);g.rng.state=v.rng.state;g.aiProvider=aiProvider;g.events=[];
  g.frontResponseAt??=-99;
  g.ammoHandoffs??=[];g.buddyTransfers??=0;
  g.projectiles??=[];g.lanes??=[];g.coordinationAge??=99;g.tacticChangedAt??=-99;g.tacticCandidate??=null;g.trafficMigration=!!g.trafficMigration||g.soldiers.some(s=>!s.nav);
  const oldTeams=!g.fireteams;g.fireteams??=[];g.nextTeamId??=1;g.teamRoster??='';
  for(const s of g.soldiers){s.vx??=0;s.vy??=0;s.facing??=[-Math.PI/2,0,Math.PI/2,Math.PI][s.side];s.recoil??=0;s.targetId??=null;s.activity??='guard';s.maneuverUntil??=0;s.assigned??=true;s.formationSlot??=null;s.formationSide??=null;s.order??=null;s.moveHeading??=null;s.turnVelocity??=0;s.guardPoint??=null;s.nav??={lastCheck:g.time,remaining:0,stalled:0,replans:0,waitUntil:0,waitFor:null,yield:null,nextRetry:0};s.teamId??=null;s.coop??=null;s.relief??=false;}
  if(oldTeams)g.refreshTeams();
  return g;
 }
}
