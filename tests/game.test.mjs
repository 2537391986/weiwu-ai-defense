import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WEAPONS,ACTIONS,UNIT_RADIUS,UNIT_SPACE} from '../dist/engine.js';
import {inferPolicy,AI_META} from '../dist/ai-model.js';

function accounting(g){const i=g.inventory();for(const t of Object.keys(i.acquired)){assert.ok(i.remaining[t]>=0,t+' remaining nonnegative');assert.equal(i.acquired[t],i.remaining[t]+i.fired[t]+i.lost[t],t+' ammunition conserved');}}
function active(seed=71){const g=new Game({seed,aiProvider:inferPolicy});g.start();g.enterNode(g.choices[0]);return g;}
function burn(g,s){g.fired[WEAPONS[s.weapon].ammo]+=s.mag+s.reserve;s.mag=0;s.reserve=0;}

test('initial equipment and every ammunition unit have a source',()=>{const g=new Game({seed:71});assert.equal(g.living().length,12);assert.equal(g.soldiers.filter(s=>s.weapon==='m4').length,8);assert.equal(g.soldiers.filter(s=>s.weapon==='m249').length,2);assert.equal(g.features().length,AI_META.featureNames.length);accounting(g);});

test('haulers fetch at the depot and physically reach the recipient',()=>{const g=active();const target=g.soldiers[0],runner=g.soldiers[1];burn(g,target);for(const s of g.soldiers){s.x=240;s.y=205;g.releaseOrder(s);s.guardPoint=null;}target.x=200;target.y=145;runner.x=200;runner.y=205;g.assignSupplies();assert.equal(target.supplyAssigned,runner.id);const before=g.stock.n556;assert.equal(runner.supply.cargo,0);g.updateSupply(runner,.05);assert.ok(g.stock.n556<before);assert.equal(target.mag+target.reserve,0);for(let i=0;i<800&&runner.task==='supply';i++){g.time+=.05;g.updateSupply(runner,.05);}assert.equal(runner.task,'guard');assert.ok(target.reserve>0);assert.ok(Math.hypot(runner.x-target.x,runner.y-target.y)<10.5,'handoff happens within adjacent body spacing');assert.ok(g.los(runner,target),'handoff cannot cross a wall');assert.equal(g.supplyRuns,1);accounting(g);});

test('when a recipient dies, carried ammunition returns only at the depot',()=>{const g=active();const s=g.soldiers[1],target=g.soldiers[0];const qty=50;g.stock.n556-=qty;s.x=200;s.y=150;s.task='supply';s.goal=null;s.supply={type:'n556',qty,cargo:qty,targetId:target.id,phase:'deliver'};target.supplyAssigned=s.id;target.hp=0;g.killSoldier(target);const stock=g.stock.n556;g.updateSupply(s,.05);assert.equal(g.stock.n556,stock);assert.equal(s.supply.phase,'return');for(let i=0;i<800&&s.task==='supply';i++)g.updateSupply(s,.05);assert.equal(g.stock.n556,stock+qty);accounting(g);});

test('a hauler casualty loses its cargo and cannot manufacture stock',()=>{const g=active();const s=g.soldiers[0];g.stock.n556-=37;s.supply={type:'n556',cargo:37,targetId:g.soldiers[1].id,phase:'deliver'};s.hp=0;g.killSoldier(s);g.killSoldier(s);assert.equal(g.dead,1);assert.equal(s.supply.cargo,0);accounting(g);});

test('new node heals survivors, preserves casualties and does not refill ammunition',()=>{const g=active();g.soldiers[0].hp=0;g.killSoldier(g.soldiers[0]);for(const s of g.living())s.hp=25;const inv=structuredClone(g.inventory()),stock={...g.stock};g.phase='route';g.enterNode(g.routeChoices()[1]);assert.equal(g.living().length,11);assert.equal(g.soldiers[0].hp,0);assert.ok(g.living().every(s=>s.hp===100));assert.deepEqual(g.stock,stock);assert.deepEqual(g.inventory(),inv);accounting(g);});

test('one reward is consumed once; carry upgrades add capacity but no ammunition',()=>{const g=active();g.phase='reward';g.choices=[{id:'bags',kind:'bags',name:'携行'}];const before=g.inventory();assert.equal(g.chooseReward('bags'),true);assert.equal(g.chooseReward('bags'),false);assert.equal(g.mod.carry,1.2);assert.deepEqual(g.inventory(),before);accounting(g);});

test('weapon changes return old ammunition and award only the stated supply',()=>{const g=active();g.phase='reward';g.choices=[{id:'weapon-m110',kind:'weapon',weapon:'m110',name:'M110'}];g.chooseReward('weapon-m110');assert.equal(g.living().filter(s=>s.weapon==='m110').length,2);assert.equal(g.acquired.n762,120);accounting(g);});

test('recruits respect the cap, and a new run has no permanent growth',()=>{const g=active();for(let i=0;i<40;i++)g.addSoldier('m4',true);assert.equal(g.living().length,35);const before=g.acquired.n556;g.addSoldier('m4',true);assert.equal(g.acquired.n556,before);const fresh=new Game({seed:71});assert.equal(fresh.living().length,12);assert.equal(fresh.mod.armor,0);assert.equal(fresh.rewardCount,0);accounting(g);});

test('model selection changes deployment and switching off stops model inference',()=>{let calls=0;const g=active();g.attachAI(()=>{calls++;return {action:'reinforce_west',confidence:.9};});g.decide();assert.equal(g.aiState.source,'neural');assert.equal(g.tactic,'reinforce_west');assert.ok(g.living().filter(s=>s.side===3).length>g.living().filter(s=>s.side===1).length);g.setAI(false);g.decide();assert.equal(calls,1);assert.equal(g.aiState.source,'rules');g.setAI(true);g.attachAI(()=>{throw new Error('unavailable');});assert.doesNotThrow(()=>g.decide());assert.equal(g.aiState.source,'rules');g.attachAI(()=>({action:'unknown',confidence:1}));g.decide();assert.ok(ACTIONS.includes(g.tactic));});

test('fixed gun emplacements retain their mount when the model changes stance',()=>{const g=active();const s=g.soldiers[0];s.weapon='m2';s.mount={x:s.x,y:s.y};const before={...s.mount};g.tactic='reinforce_south';g.deploy();assert.deepEqual(s.goal,before);});

test('walls block shooting, while an entrance supplies a firing lane',()=>{const g=active();assert.equal(g.los({x:165,y:150},{x:165,y:100}),false);assert.equal(g.los({x:200,y:145},{x:200,y:100}),true);});

test('save/restore preserves random state and combat outcomes',()=>{const g=active(123);for(let i=0;i<1200;i++)g.step(1/30);const h=Game.restore(g.serialize(),inferPolicy);for(let i=0;i<300;i++){g.step(1/30);h.step(1/30);}assert.equal(h.serialize(),g.serialize());accounting(g);});

test('a failed location immediately ends the run',()=>{const g=active();for(const s of g.soldiers){s.hp=0;g.killSoldier(s);}g.step(1/30);assert.equal(g.phase,'ended');assert.equal(g.result.win,false);assert.equal(g.enterNode(g.routeChoices()[0]),false);accounting(g);});

test('full clear and mixed hold routes finish with finite, conserved inventory',()=>{for(const seed of [11,22,33,44]){const g=active(seed);let steps=0;while(g.phase!=='ended'&&g.time<1200&&steps++<100000){if(g.phase==='combat'){g.step(1/30);if(steps%1800===0)accounting(g);}else if(g.phase==='reward'){const choice=g.choices.find(c=>c.kind==='ammo')||g.choices.find(c=>c.kind==='weapon')||g.choices[0];g.chooseReward(choice.id);accounting(g);}else if(g.phase==='route'){g.enterNode(g.choices[seed%2]);}else throw new Error(g.phase);}assert.equal(g.phase,'ended','seed '+seed+' should not stall');assert.equal(g.result.win,true);assert.equal(g.nodeIndex,3);assert.ok(g.time>=600&&g.time<=930,'10–15 min target (small simulation margin)');assert.ok(g.neuralDecisions>0);assert.ok(g.supplyRuns>0);accounting(g);}});

test('bullets spend ammunition at launch and damage only after travelling to a target',()=>{const g=active(),s=g.soldiers[0];s.x=200;s.y=145;g.rng.next=()=>.1;const z=g.spawnEnemy('walker',0);z.x=200;z.y=100;const mag=s.mag;g.fire(s,z);assert.equal(s.mag,mag-1);assert.equal(z.hp,z.max);assert.equal(g.projectiles.length,1);g.updateProjectiles(.02);assert.equal(z.hp,z.max);assert.ok(g.projectiles[0].y<141&&g.projectiles[0].y>100);g.updateProjectiles(.1);assert.ok(z.hp<z.max);assert.equal(g.projectiles.length,0);accounting(g);});

test('travelling bullets collide with walls and with the first enemy in their path',()=>{const g=active(),s=g.soldiers[0];g.rng.next=()=>.1;s.x=165;s.y=150;const rear=g.spawnEnemy('walker',0);rear.x=165;rear.y=100;g.fire(s,rear);g.updateProjectiles(.1);assert.equal(rear.hp,rear.max);assert.equal(g.projectiles.length,0);s.x=200;s.y=145;rear.x=200;rear.y=95;const front=g.spawnEnemy('walker',0);front.x=200;front.y=115;g.fire(s,rear);g.updateProjectiles(.1);assert.ok(front.hp<front.max);assert.equal(rear.hp,rear.max);accounting(g);});

test('one shotgun shell produces separate pellets without creating ammunition',()=>{const g=active(),s=g.soldiers.find(s=>s.weapon==='benelli');s.x=200;s.y=240;const z=g.spawnEnemy('walker',2);z.x=200;z.y=265;const before=g.fired.shell,mag=s.mag;g.fire(s,z);assert.equal(g.projectiles.length,7);assert.equal(s.mag,mag-1);assert.equal(g.fired.shell,before+1);g.updateProjectiles(.2);assert.equal(g.projectiles.length,0);accounting(g);});

test('reinforcement transfers at most two nearby soldiers and keeps quiet sides occupied',()=>{const g=active(),before=new Map(g.living().map(s=>[s.id,s.side])),positions=g.living().map(s=>[s.x,s.y]);g.attachAI(()=>({action:'reinforce_west',confidence:.95}));g.decide();assert.ok(g.living().filter(s=>before.get(s.id)!==s.side).length<=2);assert.ok(g.living().filter(s=>s.side===3).length>g.living().filter(s=>s.side===1).length);assert.ok([0,1,2,3].every(side=>g.living().some(s=>s.side===side)));assert.deepEqual(g.living().map(s=>[s.x,s.y]),positions);});

test('a threatened group withdraws under cover, then hands cover to the first arrival',()=>{
 const g=active();g.time=10;g.tactic='fallback';
 for(let i=0;i<2;i++){const z=g.spawnEnemy('walker',0);z.x=200+i*5;z.y=164;z.entered=z.inside=true;}
 const quiet=g.living().filter(s=>s.side===2),quietPositions=quiet.map(s=>[s.x,s.y]);
 g.coordinate();const north=g.living().filter(s=>s.side===0),first=north.find(s=>s.coop?.role==='move'),cover=north.find(s=>s.coop?.role==='cover');
 assert.ok(first&&cover);assert.equal(cover.coop.partnerId,first.id);const coverPosition={x:cover.x,y:cover.y};
 g.time+=1.3;g.coordinate();assert.equal(north.filter(s=>g.inTransit(s)).length,1,'the next element waits for arrival, rather than a fixed short timer');
 assert.deepEqual({x:cover.x,y:cover.y},coverPosition);
 let handedOver=false;const moved=new Set([first.id]);
 for(let i=0;i<600;i++){
  g.time+=1/30;for(const s of g.living())g.move(s,1/30,3);g.resolveBodies(1/30);if(i%12===0)g.coordinate();
  assert.ok(north.filter(s=>g.inTransit(s)).length<=1,'one ordinary move at a time within the group');
  for(const s of north)if(g.inTransit(s)&&s.order?.kind==='retreat')moved.add(s.id);
  if(first.coop?.role==='cover'&&first.coop.partnerId!==first.id)handedOver=true;
 }
 assert.equal(moved.size,north.length);assert.ok(handedOver,'the first arrival covers the following teammate');
 assert.ok(north.every(s=>!g.inTransit(s)));assert.deepEqual(quiet.map(s=>[s.x,s.y]),quietPositions);
 g.enemies=[];g.tactic='balanced';g.coordinate();assert.equal(g.lanes[0].depth,0);accounting(g);
});

test('a reloading soldier steps back while an armed teammate covers the entrance',()=>{const g=active(),group=g.living().filter(s=>s.side===0),reloading=group.find(s=>s.weapon==='m4');reloading.reload=2;g.coordinate();const covering=group.find(s=>s.covering);assert.ok(covering);assert.notEqual(covering.id,reloading.id);assert.ok(covering.mag>0);assert.ok(covering.holdPoint.y<reloading.holdPoint.y);});

test('soldiers separate and yield without crossing solid walls',()=>{const g=active(),a=g.soldiers[0],b=g.soldiers[1];a.x=b.x=200;a.y=b.y=180;a.goal=b.goal={x:200,y:180};a.path=b.path=[];for(const s of g.soldiers.slice(2)){s.x=240;s.y=250;}for(let i=0;i<120;i++){g.move(a,1/30,3);g.move(b,1/30,3);}assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>2.5);assert.ok(!g.blocked(a.x,a.y,1.7));a.x=160;a.y=145;a.goal={x:160,y:120};a.path=[];for(let i=0;i<300;i++)g.move(a,1/30,3);assert.ok(a.y>=138.7,'cannot walk across north wall');});

test('crowded enemies spread apart without being pushed through a wall',()=>{const g=active(),a=g.spawnEnemy('walker',0),b=g.spawnEnemy('walker',0);a.x=b.x=200;a.y=b.y=125;for(let i=0;i<90;i++)g.separateEnemies(1/30);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>3);assert.ok(!g.blocked(a.x,a.y,.6));assert.ok(!g.blocked(b.x,b.y,.6));});

test('a persistently blocked firing lane prompts a deliberate sidestep after arrival',()=>{const g=active(),s=g.soldiers[0],buddy=g.soldiers[1],origin={x:s.x,y:s.y};buddy.x=s.x;buddy.y=s.y-9;const z=g.spawnEnemy('walker',0);z.x=s.x;z.y=100;assert.equal(g.chooseTarget(s,[z],g.living(),new Map()),null);assert.equal(s.localOffset,null);g.time+=.8;g.chooseTarget(s,[z],g.living(),new Map());assert.ok(s.localOffset);g.coordinate();assert.deepEqual(s.goal,origin);g.time+=3;g.coordinate();assert.ok(Math.abs(s.goal.x-origin.x)>3);});

test('in-flight projectiles survive save/restore and produce identical impacts',()=>{const g=active(),s=g.soldiers[0];s.x=200;s.y=145;const z=g.spawnEnemy('walker',0);z.x=200;z.y=80;g.fire(s,z);const h=Game.restore(g.serialize(),inferPolicy);assert.ok(h.projectiles.length);for(let i=0;i<6;i++){g.updateProjectiles(1/30);h.updateProjectiles(1/30);}assert.equal(h.serialize(),g.serialize());accounting(g);});

test('legacy saves gain movement state while preserving all finite inventory',()=>{const g=active(),v=JSON.parse(g.serialize()),inventory=g.inventory();delete v.projectiles;delete v.lanes;delete v.coordinationAge;for(const s of v.soldiers){for(const key of ['vx','vy','facing','recoil','targetId','activity','maneuverUntil','assigned'])delete s[key];}const h=Game.restore(v,inferPolicy);assert.deepEqual(h.inventory(),inventory);for(let i=0;i<30;i++)h.step(1/30);assert.ok(h.living().every(s=>Number.isFinite(s.x)&&Number.isFinite(s.facing)));accounting(h);});

test('a carrier keeps their slot and does not reorder the remaining defenders',()=>{const g=active(),carrier=g.soldiers[4],before=new Map(g.living().map(s=>[s.id,{side:s.side,slot:s.formationSlot,goal:{...s.goal}}]));carrier.task='supply';g.coordinate();for(const s of g.living()){if(s===carrier||s.side!==before.get(s.id).side)continue;assert.equal(s.formationSlot,before.get(s.id).slot);assert.deepEqual(s.goal,before.get(s.id).goal);}carrier.task='guard';g.coordinate();assert.equal(carrier.formationSlot,before.get(carrier.id).slot);});

test('ordinary formation changes cannot cancel a cross-room movement before arrival',()=>{const g=active(),s=g.soldiers[0];s.x=145;s.y=205;g.releaseOrder(s);g.setGoal(s,{x:250,y:205});const goal={...s.goal},issued=s.ordersIssued,side=s.side;for(let i=0;i<360;i++){g.time+=1/30;g.tactic=i%60<30?'reinforce_east':'reinforce_west';g.coordinate(true);g.move(s,1/30,3);}assert.deepEqual(s.goal,goal);assert.equal(s.ordersIssued,issued);assert.equal(s.side,side);assert.ok(s.x>170&&s.x<220);});

test('emergency retreat can interrupt an order while the body turns continuously',()=>{const g=active(),s=g.soldiers[0];for(const a of g.soldiers)if(a!==s)a.hp=0;s.x=200;s.y=205;s.vx=3;s.vy=0;s.moveHeading=0;g.releaseOrder(s);g.setGoal(s,{x:245,y:205});g.setGoal(s,{x:155,y:205},{kind:'retreat',priority:93});assert.equal(s.goal.x,155);let previous=0;for(let i=0;i<120;i++){g.move(s,1/30,3);const delta=Math.atan2(Math.sin(s.moveHeading-previous),Math.cos(s.moveHeading-previous));assert.ok(Math.abs(delta)<=2.8/30+.001);assert.ok(!g.blocked(s.x,s.y,1.7));previous=s.moveHeading;}assert.ok(s.moveHeading>2||s.moveHeading<-2);});

test('supply assignments do not recruit a soldier already travelling on another order',()=>{const g=active(),target=g.soldiers[0],moving=g.soldiers[1];burn(g,target);moving.x=200;moving.y=205;g.releaseOrder(moving);g.setGoal(moving,{x:250,y:205});const destination={...moving.goal};g.assignSupplies();assert.notEqual(target.supplyAssigned,moving.id);assert.equal(moving.task,'guard');assert.deepEqual(moving.goal,destination);accounting(g);});

test('smoothed paths reach the destination around crates without grid backtracking',()=>{const g=active(),s=g.soldiers[0];for(const a of g.soldiers)if(a!==s)a.hp=0;s.x=145;s.y=155;s.vx=s.vy=0;s.moveHeading=null;g.releaseOrder(s);g.setGoal(s,{x:245,y:255});let from={x:s.x,y:s.y};for(const p of s.path){assert.ok(g.clearPath(from,p,1.8));from=p;}assert.ok(s.path.length<=5);for(let i=0;i<2400&&Math.hypot(s.x-245,s.y-255)>2.4;i++){const x=s.x,y=s.y;g.time+=1/30;g.move(s,1/30,3);assert.ok(Math.hypot(s.x-x,s.y-y)<=3/30+.001);assert.ok(!g.blocked(s.x,s.y,1.7));}assert.ok(Math.hypot(s.x-245,s.y-255)<=2.4);});

test('idle guards scan independently without wandering away from their positions',()=>{const g=active();g.remaining=1000;g.spawnClock=999;const positions=g.living().map(s=>({x:s.x,y:s.y,facing:s.facing}));let scan=0;for(let i=0;i<450;i++){g.step(1/30);scan=Math.max(scan,Math.abs(g.soldiers[0].facing-positions[0].facing));}assert.ok(scan>.12);for(let i=0;i<g.soldiers.length;i++)assert.ok(Math.hypot(g.soldiers[i].x-positions[i].x,g.soldiers[i].y-positions[i].y)<.3);accounting(g);});

test('brief alternating model preferences do not cause alternating tactical orders',()=>{const g=active();g.attachAI(()=>({action:'balanced',confidence:.9}));g.decide();for(let i=0;i<12;i++){g.time+=1.2;g.attachAI(()=>({action:i%2?'reinforce_east':'reinforce_west',confidence:.9}));g.decide();assert.equal(g.tactic,'balanced');}g.attachAI(()=>({action:'reinforce_west',confidence:.9}));for(let i=0;i<4;i++){g.time+=1.2;g.decide();}assert.equal(g.tactic,'reinforce_west');for(let i=0;i<6;i++){const z=g.spawnEnemy('walker',0);z.x=200;z.y=190;z.entered=z.inside=true;}g.attachAI(()=>({action:'fallback',confidence:.9}));g.decide();assert.equal(g.tactic,'fallback');});

function movement(g,seconds,stopWhenArrived=true){
 for(let i=0;i<seconds*30;i++){
  g.time+=1/30;
  for(const s of g.living())g.move(s,1/30,3);
  g.resolveBodies(1/30);
  for(const s of g.living())assert.ok(g.insideRoom(s)&&!g.blocked(s.x,s.y,UNIT_RADIUS+.2),'a complete body stays clear of walls and crates');
  if(stopWhenArrived&&g.living().every(s=>!g.inTransit(s)))return;
 }
}
function spaced(units,point=s=>s,gap=7.1){
 for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++)assert.ok(Math.hypot(point(units[i]).x-point(units[j]).x,point(units[i]).y-point(units[j]).y)>=gap-.01,`#${units[i].id} and #${units[j].id} have separate space`);
}

test('mixed squads reserve separate body-sized positions on every map at 14, 25 and 35 people',()=>{
 for(const count of [14,25,35])for(const template of ['warehouse','house','yard']){
  const g=new Game({seed:71});
  while(g.living().length<count)g.addSoldier(['m4','benelli','m249','m110','m203','mp5'][g.living().length%6]);
  g.deploy();g.start();g.enterNode({template,mode:'hold',danger:0,flavor:'ammo',name:template});
  for(const s of g.living()){assert.ok(s.goal);assert.ok(!g.blocked(s.goal.x,s.goal.y,UNIT_RADIUS+.2));}
  spaced(g.living(),s=>s.goal,UNIT_SPACE-.05);spaced(g.living());accounting(g);
 }
});

test('six soldiers crowded at the warehouse crate corner disperse and reach their own positions',()=>{
 for(const count of [14,25,35]){
  const g=new Game({seed:71});while(g.living().length<count)g.addSoldier('m4');g.deploy();
  for(const [i,s] of g.soldiers.slice(0,6).entries()){s.x=176+(i%2)*.4;s.y=183+Math.floor(i/2)*.4;s.vx=s.vy=0;s.path=g.findPath(s,s.goal)||[];}
  const destinations=g.living().map(s=>({...s.goal}));movement(g,120);
  assert.ok(g.living().every(s=>!g.inTransit(s)),'no soldier remains stuck at the corner');
  assert.deepEqual(g.living().map(s=>s.goal),destinations,'recovery preserves the assigned destinations');spaced(g.living());accounting(g);
 }
});

test('a full 35-person squad can cross the room without ending in a traffic deadlock',()=>{
 const g=new Game({seed:71});while(g.living().length<35)g.addSoldier('m4');g.deploy();
 const destinations=g.living().map(s=>({x:400-s.x,y:410-s.y}));
 for(const s of g.living()){g.releaseOrder(s);s.guardPoint=null;}
 for(let i=0;i<35;i++)assert.ok(g.setGoal(g.soldiers[i],destinations[i]));
 movement(g,180);assert.ok(g.living().every(s=>!g.inTransit(s)),'all 35 complete their movement');spaced(g.living());accounting(g);
});

test('opposing soldiers use a wider pocket to pass through a single-file gap',()=>{
 const g=new Game({seed:71}),[a,b]=g.soldiers;
 for(const s of g.soldiers){s.hp=s===a||s===b?100:0;g.releaseOrder(s);s.guardPoint=null;}
 g.map.crates=[{x:147,y:175,w:100,h:65}];a.x=b.x=140;a.y=155;b.y=260;
 assert.ok(g.setGoal(a,{x:140,y:260}));assert.ok(g.setGoal(b,{x:140,y:155}));
 movement(g,160);assert.ok(!g.inTransit(a)&&!g.inTransit(b));assert.ok(a.y>b.y+80);spaced([a,b]);
});

test('an unreachable destination does not fall back to walking straight through an obstacle',()=>{
 const g=new Game({seed:71}),s=g.soldiers[0];for(const a of g.soldiers)if(a!==s)a.hp=0;
 g.map.crates=[{x:190,y:135,w:20,h:140}];s.x=155;s.y=205;g.releaseOrder(s);s.guardPoint=null;
 const destination={x:245,y:205};assert.equal(g.findPath(s,destination),null);assert.equal(g.setGoal(s,destination),false);
 movement(g,10,false);assert.equal(s.x,155);assert.equal(s.y,205);
});

test('multiple haulers use distinct depot positions and complete nearby physical handoffs',()=>{
 const g=active();g.remaining=1000;g.spawnClock=999;g.tactic='resupply';
 for(const s of g.soldiers.slice(0,3))burn(g,s);
 g.assignSupplies();const carriers=g.living().filter(s=>s.task==='supply');assert.equal(carriers.length,3);
 for(const s of carriers)assert.ok(s.goal&&Math.hypot(s.goal.x-200,s.goal.y-205)<18);
 spaced(carriers,s=>s.goal,UNIT_SPACE-.05);
 for(let i=0;i<5400&&g.supplyRuns<3;i++)g.step(1/30);
 assert.ok(g.supplyRuns>=3,'all requests finish without a depot pileup');
 assert.ok(g.soldiers.slice(0,3).every(s=>s.mag+s.reserve>0));accounting(g);
});

test('a crowded old save gains safe routes while preserving the run and ammunition',()=>{
 const g=active(),v=JSON.parse(g.serialize()),before=g.inventory();delete v.trafficMigration;
 for(const s of v.soldiers){delete s.nav;delete s.guardPoint;}
 for(const s of v.soldiers.slice(0,6)){s.x=173;s.y=174;}
 const restored=Game.restore(v,inferPolicy);restored.remaining=1000;restored.spawnClock=999;
 assert.deepEqual(restored.inventory(),before);
 for(let i=0;i<2400;i++)restored.step(1/30);
 assert.equal(restored.dead,g.dead);assert.equal(restored.nodeIndex,g.nodeIndex);
 assert.ok(restored.living().every(s=>!restored.blocked(s.x,s.y,UNIT_RADIUS+.2)));spaced(restored.living());accounting(restored);
});

test('fireteams keep two or three members, including a hauler who temporarily leaves their position',()=>{
 for(const count of [12,14,25,35]){
  const g=new Game({seed:71});while(g.living().length<count)g.addSoldier('m4');g.deploy();
  const members=g.fireteams.flatMap(t=>t.members);assert.equal(new Set(members).size,count);assert.equal(members.length,count);
  assert.ok(g.fireteams.every(t=>t.members.length>=2&&t.members.length<=3));
  const roster=g.fireteams.map(t=>({id:t.id,side:t.side,members:[...t.members]})),positions=g.living().map(s=>[s.x,s.y]);
  const carrier=g.soldiers[0];carrier.task='supply';g.coordinate();carrier.task='guard';g.coordinate();
  assert.deepEqual(g.fireteams.map(t=>({id:t.id,side:t.side,members:[...t.members]})),roster);
  assert.deepEqual(g.living().map(s=>[s.x,s.y]),positions);accounting(g);
 }
});

test('a covering teammate stays at their position and actually fires while their buddy reloads',()=>{
 const g=active();g.remaining=1000;g.spawnClock=999;g.attachAI(()=>({action:'balanced',confidence:.95}));
 const reloader=g.soldiers[0];g.fired.n556+=reloader.mag;reloader.mag=0;reloader.reload=WEAPONS[reloader.weapon].reload;
 const z=g.spawnEnemy('walker',0);z.x=200;z.y=120;z.speed=0;z.hp=z.max=5000;
 g.coordinate();const cover=g.living().find(s=>s.coop?.role==='cover'&&s.coop.partnerId===reloader.id);assert.ok(cover);
 const position={x:cover.x,y:cover.y},start={x:reloader.x,y:reloader.y},shots=cover.shots,since=cover.coop.since;
 for(let i=0;i<60;i++)g.step(1/30);
 assert.ok(reloader.reload>0);assert.ok(Math.hypot(reloader.x-start.x,reloader.y-start.y)>2);
 assert.ok(cover.shots>shots,'cover is normal ammunition-consuming fire');
 assert.ok(Math.hypot(cover.x-position.x,cover.y-position.y)<.8,'covering buddy stays in place');
 assert.equal(cover.coop.since,since,'holding the same assignment does not restart its animation');accounting(g);
});

test('a rear defender replaces a fallen front soldier while their remaining buddy covers',()=>{
 const g=active(),front=g.soldiers[0],rear=g.soldiers[8],buddy=g.soldiers[4],quiet=g.living().filter(s=>s.side!==0),positions=quiet.map(s=>[s.x,s.y]);
 const oldRear={x:rear.x,y:rear.y},buddyPosition={x:buddy.x,y:buddy.y};front.hp=0;g.killSoldier(front);g.coordinate();
 assert.equal(rear.formationSlot,0);assert.equal(rear.order.kind,'relief');assert.equal(buddy.coop.role,'cover');assert.equal(buddy.coop.partnerId,rear.id);
 assert.deepEqual({x:buddy.x,y:buddy.y},buddyPosition);
 for(let i=0;i<300;i++){g.time+=1/30;for(const s of g.living())g.move(s,1/30,3);g.resolveBodies(1/30);if(i%12===0)g.coordinate();}
 assert.ok(rear.y<oldRear.y-4);assert.ok(!g.inTransit(rear));assert.deepEqual(quiet.map(s=>[s.x,s.y]),positions);accounting(g);
});

test('supply selection preserves the last armed cover for a busy group',()=>{
 const g=active(),cover=g.soldiers[0],reloader=g.soldiers[4],empty=g.soldiers[8],target=g.soldiers[1];
 reloader.reload=3;burn(g,empty);burn(g,target);cover.x=200;cover.y=205;g.releaseOrder(cover);g.setGoal(cover,{x:200,y:220});cover.x=cover.goal.x;cover.y=cover.goal.y;cover.path=[];
 assert.equal(g.canLeaveForSupply(cover),false);g.assignSupplies();assert.equal(cover.task,'guard');assert.equal(cover.supply,null);accounting(g);
});

test('losing the covering buddy releases the remaining group instead of leaving it waiting forever',()=>{
 const g=active();g.time=10;g.tactic='fallback';
 for(let i=0;i<2;i++){const z=g.spawnEnemy('walker',0);z.x=200+i*5;z.y=164;z.entered=z.inside=true;}
 g.coordinate();const cover=g.living().find(s=>s.side===0&&s.coop?.role==='cover');assert.ok(cover);cover.hp=0;g.killSoldier(cover);
 for(let i=0;i<900;i++){g.time+=1/30;for(const s of g.living())g.move(s,1/30,3);g.resolveBodies(1/30);if(i%12===0)g.coordinate();}
 const north=g.living().filter(s=>s.side===0);assert.ok(north.every(s=>!g.inTransit(s)));assert.ok(north.every(s=>s.coop?.partnerId!==cover.id));accounting(g);
});

test('an empty magazine reloads even when every teammate is also empty',()=>{
 const g=active();g.remaining=1000;g.spawnClock=999;
 const team=g.teamFor(g.soldiers[0]),members=team.members.map(id=>g.soldiers.find(s=>s.id===id));
 for(const s of members){g.fired[WEAPONS[s.weapon].ammo]+=s.mag;s.mag=0;}
 g.step(1/30);assert.ok(members.every(s=>s.reload>0),'do not wait for impossible cover before loading an empty weapon');accounting(g);
});

test('0.2.2 saves gain group assignments without changing positions, goals or finite inventory',()=>{
 const g=active(),v=JSON.parse(g.serialize()),before=g.inventory(),positions=g.living().map(s=>[s.x,s.y]),goals=g.living().map(s=>s.goal);
 delete v.fireteams;delete v.nextTeamId;delete v.teamRoster;for(const s of v.soldiers){delete s.teamId;delete s.coop;delete s.relief;}
 const h=Game.restore(v,inferPolicy);assert.deepEqual(h.inventory(),before);assert.deepEqual(h.living().map(s=>[s.x,s.y]),positions);assert.deepEqual(h.living().map(s=>s.goal),goals);
 assert.equal(h.fireteams.flatMap(t=>t.members).length,h.living().length);
 const restoredAgain=Game.restore(h.serialize(),inferPolicy);for(let i=0;i<180;i++){h.step(1/30);restoredAgain.step(1/30);}
 assert.equal(h.serialize(),restoredAgain.serialize());accounting(h);
});

test('covering fire prioritizes a visible intruder threatening the protected teammate',()=>{
 const g=active(),cover=g.soldiers[0],buddy=g.soldiers[4];
 for(const s of g.soldiers)if(s!==cover&&s!==buddy)s.hp=0;
 cover.x=200;cover.y=190;buddy.x=220;buddy.y=210;
 const nearer=g.spawnEnemy('walker',0),threat=g.spawnEnemy('walker',1);
 Object.assign(nearer,{x:185,y:191,entered:true,inside:true});Object.assign(threat,{x:225,y:210,entered:true,inside:true});
 cover.coop={role:'hold',partnerId:null,reason:'',since:0};assert.equal(g.chooseTarget(cover,[nearer,threat],g.living(),new Map()),nearer);
 g.setCoop(cover,'cover',buddy.id,'retreat');assert.equal(g.chooseTarget(cover,[nearer,threat],g.living(),new Map()),threat);
});

test('a critically threatened coverer can escape without waiting and is not still advertised as cover',()=>{
 const g=active();g.time=10;g.tactic='fallback';
 for(let i=0;i<2;i++){const z=g.spawnEnemy('walker',0);z.x=200+i*5;z.y=164;z.entered=z.inside=true;}
 g.coordinate();const cover=g.living().find(s=>s.side===0&&s.coop?.role==='cover');assert.ok(cover);
 cover.hp=20;g.time+=1.3;g.coordinate();assert.equal(cover.order.kind,'retreat');assert.ok(g.inTransit(cover));assert.notEqual(cover.coop.role,'cover');
 const team=g.teamFor(cover);assert.notEqual(team.coverId,cover.id);assert.ok(g.living().filter(s=>s.side===0&&s.coop?.role==='move').length>=2);accounting(g);
});

test('terrain changes actual entrance sightlines and approach distance',()=>{
 const results={};
 for(const template of ['warehouse','house','yard']){
  const g=new Game({seed:71});g.map=g.makeMap(template);g.setupGates();
  results[template]={north:g.los({x:210,y:150},{x:210,y:100}),east:g.los({x:250,y:215},{x:300,y:215}),approach:0};
  assert.ok(g.los({x:200,y:150},{x:200,y:100}),'the centre of the north entrance stays open');
  for(let i=0;i<20;i++){const z=g.spawnEnemy('walker',0);results[template].approach+=Math.abs(g.gates[0].y-z.y);}
 }
 assert.equal(results.house.east,false);assert.equal(results.warehouse.east,true);
 assert.equal(results.warehouse.north,false);assert.equal(results.yard.north,true);
 assert.ok(results.house.approach<results.warehouse.approach-400,'house streets lead to closer contact');
});

test('crowds use the open entrances on every terrain without getting stuck in the walls',()=>{
 for(const template of ['warehouse','house','yard']){
  const g=new Game({seed:71});g.start();g.enterNode({template,mode:'hold',danger:0,flavor:'final',name:template});
  g.holdDuration=999;g.remaining=1000;g.spawnClock=999;g.core.hp=g.core.max=1e6;
  for(const s of g.soldiers){s.cooldown=999;s.hp=s.maxHP=1e6;}
  for(const gate of g.gates)gate.hp=0;
  const crowd=Array.from({length:24},()=>g.spawnEnemy('walker',0));
  for(let i=0;i<2400&&!crowd.every(z=>z.entered&&z.y>138);i++)g.step(1/30);
  assert.ok(crowd.every(z=>z.entered&&z.y>138),template+' crowd crosses the opening');
  assert.ok(crowd.every(z=>!g.blocked(z.x,z.y,.6)));accounting(g);
 }
});

test('route forecasts are distinct, reproducible and keep the advertised cache after a loadout change',()=>{
 for(const seed of [11,22,33,44]){
  const g=new Game({seed}),h=new Game({seed});g.start();h.start();assert.deepEqual(g.choices,h.choices);
  assert.notEqual(g.choices[0].template,g.choices[1].template);assert.ok(g.choices.every(c=>c.fronts.length===2));
  const route=g.choices[0],cache=structuredClone(route.payout.ammo);g.applyLoadout(g.packageCard('precision'));g.enterNode(route);
  assert.deepEqual(g.node.payout.ammo,cache);assert.ok(g.map.terrain);accounting(g);
 }
});

test('an armory equips the promised group only on site completion and can be claimed once',()=>{
 const g=active();g.nodeIndex=1;g.node.payout={kind:'armory',card:g.packageCard('precision')};
 const acquired={...g.acquired};g.finishWave();assert.deepEqual(g.acquired,acquired);assert.equal(g.living().filter(s=>s.weapon==='m110').length,0);
 g.phase='combat';g.wave=2;g.finishWave();assert.equal(g.living().filter(s=>s.weapon==='m110').length,2);assert.equal(g.acquired.n762,120);
 const paid=g.serialize();g.finishWave();g.claimNodePayout();assert.equal(g.serialize(),paid);
 const h=Game.restore(paid,inferPolicy),before=h.inventory();h.claimNodePayout();assert.deepEqual(h.inventory(),before);accounting(h);
});

test('rescue converts only the carried ammunition of people who cannot join a full roster',()=>{
 const g=active();while(g.living().length<34)g.addSoldier('m4');g.node.payout={kind:'rescue',count:2};
 const acquired=g.acquired.n556;g.wave=2;g.finishWave();assert.equal(g.living().length,35);assert.equal(g.acquired.n556-acquired,180);
 const before=g.inventory();g.claimNodePayout();assert.deepEqual(g.inventory(),before);accounting(g);
});

test('loadout previews are pure, preserve specialists and match the actual conversions and supply',()=>{
 const g=active();g.applyLoadout(g.packageCard('precision'));g.applyLoadout(g.packageCard('fixed'));
 const fixed=g.living().find(s=>s.weapon==='m2');fixed.mount={x:fixed.x,y:fixed.y};const card=g.packageCard('close'),before=g.serialize(),preview=g.loadoutPreview(card),acquired={...g.acquired};
 assert.equal(g.serialize(),before);assert.equal(preview.changes.length,2);assert.ok(preview.changes.every(c=>c.from==='m4'));
 const applied=g.applyLoadout(card);assert.deepEqual(applied,preview);
 for(const change of preview.changes)assert.equal(g.soldiers.find(s=>s.id===change.id).weapon,change.to);
 assert.equal(fixed.weapon,'m2');assert.ok(fixed.mount);assert.equal(g.living().filter(s=>s.weapon==='m110').length,2);
 for(const [type,qty] of Object.entries(preview.ammo))assert.equal(g.acquired[type]-acquired[type],qty);accounting(g);
});

test('drafts retain three distinct usable choices, honour caps and include supply for empty weapons',()=>{
 for(let seed=1;seed<=24;seed++){
  const g=active(seed);g.nodeIndex=seed%4;
  if(seed%2===0){while(g.living().length<35)g.addSoldier('m4');g.mod.armor=.4;g.mod.reload=1.4;g.mod.carry=1.6;}
  if(seed%3===0){for(const s of g.living())burn(g,s);for(const type of Object.keys(g.stock)){g.lost[type]+=g.stock[type];g.stock[type]=0;}}
  const cards=g.rewardChoices();assert.equal(cards.length,3);assert.equal(new Set(cards.map(c=>c.id)).size,3);
  for(const c of cards){if(c.kind==='weapon'||c.kind==='loadout')assert.ok(g.loadoutPreview(c).changes.length);if(g.living().length===35)assert.notEqual(c.kind,'recruits');if(g.mod.armor===.4)assert.notEqual(c.kind,'armor');}
  if(g.shortAmmoTypes().length)assert.ok(cards.some(c=>c.kind==='ammo'));accounting(g);
 }
});

test('new supply cards add only the listed cartridges and never refill soldiers remotely',()=>{
 const g=active();g.applyLoadout(g.packageCard('precision'));const card={id:'ammo',kind:'ammo',name:'补给',ammo:g.ammoPackage()},before=g.inventory(),carried=g.living().map(s=>[s.mag,s.reserve]);
 g.phase='reward';g.wave=1;g.choices=[card];g.chooseReward(card.id);
 for(const type of Object.keys(before.acquired))assert.equal(g.acquired[type]-before.acquired[type],card.ammo[type]||0);
 assert.deepEqual(g.living().map(s=>[s.mag,s.reserve]),carried);assert.equal(g.acquired.n9,0);accounting(g);
});

test('precision weapons favour armour while riflemen continue handling nearby unarmoured enemies',()=>{
 const g=active();g.applyLoadout(g.packageCard('precision'));const precision=g.soldiers.find(s=>s.weapon==='m110'),rifle=g.soldiers.find(s=>s.weapon==='m4');
 for(const s of g.soldiers)if(s!==precision&&s!==rifle)s.hp=0;
 for(const s of [precision,rifle]){s.x=200;s.y=200;s.targetId=null;s.coop=null;}
 const walker=g.spawnEnemy('walker',0),heavy=g.spawnEnemy('heavy',0);Object.assign(walker,{x:185,y:200});Object.assign(heavy,{x:180,y:205});
 assert.equal(g.chooseTarget(precision,[walker,heavy],g.living(),new Map()),heavy);
 assert.equal(g.chooseTarget(rifle,[walker,heavy],g.living(),new Map()),walker);
});

test('grenadiers choose a safe cluster rather than spending a grenade on the nearer single target',()=>{
 const g=active();g.applyLoadout(g.packageCard('grenadier'));const s=g.soldiers.find(s=>s.weapon==='m203');for(const a of g.soldiers)if(a!==s)a.hp=0;s.x=200;s.y=200;s.coop=null;s.targetId=null;
 const single=g.spawnEnemy('walker',0);single.x=200;single.y=165;
 const cluster=Array.from({length:4},(_,i)=>{const z=g.spawnEnemy('walker',0);z.x=204+(i%2)*2;z.y=159+Math.floor(i/2)*2;return z;});
 assert.ok(cluster.includes(g.chooseTarget(s,[single,...cluster],g.living(),new Map())));
});

test('0.3 saves preserve the old battlefield and rewards until transferring to a new site',()=>{
 const g=active(),v=JSON.parse(g.serialize());delete v.map.terrain;for(const gate of v.gates){delete gate.width;gate.hp=gate.max=700;}
 v.map.walls=[{x:130,y:135,w:62,h:2},{x:208,y:135,w:62,h:2},{x:130,y:273,w:62,h:2},{x:208,y:273,w:62,h:2},{x:130,y:135,w:2,h:62},{x:130,y:213,w:2,h:62},{x:268,y:135,w:2,h:62},{x:268,y:213,w:2,h:62}];
 delete v.node.fronts;delete v.node.payout;delete v.node.payoutClaimed;v.node.flavor='ammo';
 const h=Game.restore(v,inferPolicy),map=structuredClone(h.map),inventory=h.inventory();h.remaining=1000;h.spawnClock=999;
 for(let i=0;i<60;i++)h.step(1/30);assert.deepEqual(h.map,map);assert.equal(h.map.terrain,undefined);assert.deepEqual(h.inventory().acquired,inventory.acquired);
 h.phase='combat';h.wave=2;const acquired={...h.acquired};h.finishWave();assert.equal(h.acquired.n556-acquired.n556,260);assert.equal(h.acquired.shell-acquired.shell,28);
 h.choices=[{id:'legacy-m110',kind:'weapon',weapon:'m110',name:'M110'}];h.chooseReward('legacy-m110');assert.equal(h.acquired.n762,120);
 h.enterNode(h.choices[0]);assert.ok(h.map.terrain);accounting(h);
});

test('14, 25 and 35 soldiers can cross each new terrain without losing reservations or passing through cover',()=>{
 for(const count of [14,25,35])for(const template of ['warehouse','house','yard']){
  const g=new Game({seed:71});while(g.living().length<count)g.addSoldier('m4');g.deploy();g.start();g.enterNode({template,mode:'hold',danger:0,flavor:'final',name:template});g.phase='home';g.deploy();g.phase='combat';
  const destinations=g.living().map(s=>({x:400-s.x,y:410-s.y}));for(const s of g.living()){g.releaseOrder(s);s.guardPoint=null;}
  for(let i=0;i<count;i++)assert.ok(g.setGoal(g.soldiers[i],destinations[i]));
  movement(g,210);assert.ok(g.living().every(s=>!g.inTransit(s)),template+' / '+count+' complete their crossing');spaced(g.living());accounting(g);
 }
});

test('new sites deploy a fixed-gun group toward forecast pressure while keeping its partners together',()=>{
 const g=active();g.applyLoadout(g.packageCard('fixed'));const gun=g.living().find(s=>s.weapon==='m2'),team=g.teamFor(gun),partners=[...team.members],oldSide=gun.side;
 const front=(oldSide+1)%4;g.tactic='reinforce_west';g.phase='route';g.enterNode({template:'warehouse',mode:'hold',danger:0,flavor:'final',name:'仓库',fronts:[front]});
 assert.equal(gun.side,front);assert.deepEqual(g.teamFor(gun).members,partners);
 for(const s of g.living()){assert.ok(s.goal);assert.ok(Math.hypot(s.x-s.goal.x,s.y-s.goal.y)<.01,'setup completes before combat');}
 const positions=g.living().map(s=>[s.x,s.y]);g.tactic='reinforce_south';g.coordinate(true);assert.deepEqual(g.living().map(s=>[s.x,s.y]),positions,'battle orders never teleport units');accounting(g);
});
