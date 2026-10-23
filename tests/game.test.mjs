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

test('a threatened lane falls back in two elements while quiet lanes hold',()=>{const g=active();g.time=10;g.attachAI(()=>({action:'fallback',confidence:.95}));for(let i=0;i<2;i++){const z=g.spawnEnemy('walker',0);z.x=200+i*5;z.y=164;z.entered=z.inside=true;}g.decide();const north=g.living().filter(s=>s.side===0),quiet=g.living().filter(s=>s.side===2);assert.ok(north.some(s=>s.retreating));assert.ok(north.some(s=>!s.retreating));assert.ok(quiet.every(s=>!s.retreating));g.time+=1.3;g.coordinate();assert.ok(north.every(s=>s.retreating));const depth=g.lanes[0].depth;g.enemies=[];g.tactic='balanced';g.coordinate();assert.equal(g.lanes[0].depth,depth,'avoid oscillating back immediately');g.time+=7;g.coordinate();assert.equal(g.lanes[0].depth,0);});

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
