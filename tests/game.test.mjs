import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WEAPONS,ACTIONS} from '../dist/engine.js';
import {inferPolicy,AI_META} from '../dist/ai-model.js';

function accounting(g){const i=g.inventory();for(const t of Object.keys(i.acquired)){assert.ok(i.remaining[t]>=0,t+' remaining nonnegative');assert.equal(i.acquired[t],i.remaining[t]+i.fired[t]+i.lost[t],t+' ammunition conserved');}}
function active(seed=71){const g=new Game({seed,aiProvider:inferPolicy});g.start();g.enterNode(g.choices[0]);return g;}
function burn(g,s){g.fired[WEAPONS[s.weapon].ammo]+=s.mag+s.reserve;s.mag=0;s.reserve=0;}

test('initial equipment and every ammunition unit have a source',()=>{const g=new Game({seed:71});assert.equal(g.living().length,12);assert.equal(g.soldiers.filter(s=>s.weapon==='m4').length,8);assert.equal(g.soldiers.filter(s=>s.weapon==='m249').length,2);assert.equal(g.features().length,AI_META.featureNames.length);accounting(g);});

test('haulers fetch at the depot and physically reach the recipient',()=>{const g=active();const target=g.soldiers[0],runner=g.soldiers[1];burn(g,target);for(const s of g.soldiers){s.x=240;s.y=205;s.goal=null;s.path=[];}target.x=200;target.y=145;runner.x=200;runner.y=205;g.assignSupplies();assert.equal(target.supplyAssigned,runner.id);const before=g.stock.n556;assert.equal(runner.supply.cargo,0);g.updateSupply(runner,.05);assert.ok(g.stock.n556<before);assert.equal(target.mag+target.reserve,0);for(let i=0;i<800&&runner.task==='supply';i++)g.updateSupply(runner,.05);assert.equal(runner.task,'guard');assert.ok(target.reserve>0);assert.ok(Math.hypot(runner.x-target.x,runner.y-target.y)<4);assert.equal(g.supplyRuns,1);accounting(g);});

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
