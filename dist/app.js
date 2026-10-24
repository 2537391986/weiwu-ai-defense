import {Game,WEAPONS,AMMO,SOURCES,ACTIONS,ACTION_LABELS,SIDES,WORLD,VERSION,MAP_PROFILES} from './engine.js?v=0.5.0';

const $=id=>document.getElementById(id);
const fmt=n=>Math.round(n).toLocaleString('en-US');
const clock=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COOP_REASON={retreat:'后撤',relief:'接替前排',reload:'换弹归位',supply:'搬弹',reposition:'调整射界',formation:'补位'};
function activeGroups(){if(game.phase!=='combat')return [];return game.fireteams.filter(t=>t.activeId&&t.coverId&&t.phase!=='hold').sort((a,b)=>({retreat:5,relief:4,reload:3,supply:2}[b.reason]||1)-({retreat:5,relief:4,reload:3,supply:2}[a.reason]||1)||b.since-a.since||a.id-b.id);}
function groupNote(){
 const h=game.ammoHandoffs[0],recent=game.lastBuddyTransfer;
 if(h)return `#${h.fromId} 正在递出备用弹，#${h.toId} 留在原位接应。`;
 if(recent&&game.time-recent.time<5)return `#${recent.fromId} → #${recent.toId}：匀出 ${recent.qty} 发 ${AMMO[recent.type]}，接弹后自行装填。`;
 const team=activeGroups()[0];
 if(team){const unit=game.soldiers.find(s=>s.id===team.activeId),action=team.reason==='supply'?(unit?.supply?.phase==='pickup'?'前往弹药库':'运送弹药'):team.reason==='reload'?(unit?.reload>0?'换弹，由搭档接火':'返回阵位'):COOP_REASON[team.reason]||'移动补位';return `第 ${team.id} 组：#${team.coverId} 留位掩护，#${team.activeId} ${action}。`;}
 const handoff=game.fireteams.find(t=>t.phase==='handoff');
 if(handoff)return `第 ${handoff.id} 组：队员已到位，准备接替掩护。`;
 return `${game.fireteams.length} 个小组各守阵位。点击队员，查看搭档和当前分工。`;
}
function coopDetail(s){
 const h=game.handoffFor(s);if(h)return h.fromId===s.id?`向 #${h.toId} 递出 ${h.qty} 发备用弹，自己保留一匣备用。`:`接收 #${h.fromId} 的 ${h.qty} 发备用弹，完成后仍需装填。`;
 const team=game.teamFor(s);if(!team)return '';
 const mates=team.members.filter(id=>id!==s.id).map(id=>'#'+id).join('、'),partner=game.soldiers.find(a=>a.id===s.coop?.partnerId&&a.hp>0);
 if(game.phase!=='combat')return `第 ${team.id} 组${mates?' · 搭档 '+mates:''}。等待下一步行动。`;
 const action=s.coop?.role==='cover'&&partner?`正在掩护 #${partner.id}${COOP_REASON[s.coop.reason]||'移动'}`:s.coop?.role==='move'&&partner?`由 #${partner.id} 掩护${COOP_REASON[s.coop.reason]||'移动'}`:s.coop?.role==='wait'&&partner?`留位警戒，等 #${partner.id} 到位`:'保持本组阵位';
 return `第 ${team.id} 组${mates?' · 搭档 '+mates:''}。${action}。`;
}
function ammoText(ammo){return Object.entries(ammo||{}).map(([type,qty])=>`${AMMO[type]} ${fmt(qty)}发`).join(' · ');}
function choiceContext(){
 const summary=game.loadoutSummary(),counts=Object.entries(summary.counts).map(([key,n])=>WEAPONS[key].name+' ×'+n).join(' · ');
 return `<div class="choice-context"><b>${escape(summary.styles.join(' · '))}</b><span>${escape(counts)}</span>${summary.shortAmmo.length?'<small>补给偏紧：'+summary.shortAmmo.map(t=>escape(AMMO[t])).join(' · ')+'</small>':''}</div>`;
}
function payoutText(choice){
 const payout=choice.payout;
 if(payout?.kind==='ammo')return '完成据点：'+ammoText(payout.ammo);
 if(payout?.kind==='rescue')return `完成据点：最多${payout.count}名M4A1队员，各携90发5.56；编制满时收下弹药。`;
 if(payout?.kind==='armory'){const preview=game.loadoutPreview(payout.card);return '完成据点：'+payout.card.name+'，配套 '+ammoText(preview.ammo);}
 return choice.flavor==='final'?'最终据点：消灭母体并撤离。':choice.flavor==='rescue'?'完成据点：接应2名步枪兵。':'完成据点：取得有限弹药。';
}
function rewardDetails(card){
 if(card.kind==='weapon'||card.kind==='loadout'){
  const preview=game.loadoutPreview(card),counts={...game.loadoutSummary().counts},keys=new Set();
  for(const change of preview.changes){counts[change.from]=(counts[change.from]||0)-1;counts[change.to]=(counts[change.to]||0)+1;keys.add(change.to);}
  const before=game.loadoutSummary().counts,impact=[...keys].map(key=>`${WEAPONS[key].role} ${before[key]||0}→${counts[key]}`).join(' · ');
  const warning=preview.changes.some(change=>WEAPONS[change.from].fixed)?'将拆换固定火力。':'';
  return `<p>${escape(card.notes||'按当前编制自动换装，优先选择步枪兵。')}</p><p class="reward-impact">${escape(warning+preview.changes.length+'人换装 · '+impact)}</p><p class="reward-ammo">附带 ${escape(ammoText(preview.ammo))}</p>`;
 }
 if(card.kind==='ammo'&&card.ammo)return `<p>${escape(card.description)}</p><p class="reward-ammo">${escape(ammoText(card.ammo))}</p>`;
 if(card.kind==='recruits'){const n=Math.min(3,35-game.living().length);return `<p>${n}名M4A1步枪兵加入，携带${n*90}发5.56弹药。</p><p class="reward-impact">编制 ${game.living().length}→${game.living().length+n} / 35</p>`;}
 return `<p>${escape(card.description)}</p>`;
}
const SAVE='weiwu-run-v1',RECORDS='weiwu-records-v1',SETTINGS='weiwu-settings-v1';
let provider=null,meta=null,modelError=false,game,paused=false,speed=1,view={zoom:1.5,x:200,y:205},lastPhase='',lastPanel='',lastHud=0,lastSave=0,accumulator=0,lastFrame=0,recorded=false,poseTime=0;
let runId=Date.now().toString(36),saved=null,settings={ai:true},storageOkay=true;
try{settings={...settings,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')};saved=JSON.parse(localStorage.getItem(SAVE)||'null');if(![VERSION,'0.4.0','0.3.0','0.2.2','0.2.1','0.2.0','0.1.1'].includes(saved?.version)||saved?.state?.phase==='ended')saved=null;}catch{storageOkay=false;}
function toast(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,2600);}
function save(){if(game.phase==='home'||game.phase==='ended')return;try{localStorage.setItem(SAVE,JSON.stringify({version:VERSION,runId,state:JSON.parse(game.serialize())}));}catch{if(storageOkay){storageOkay=false;toast('浏览器未允许保存，本次行动仍可继续。');}}}
function settingsSave(){try{localStorage.setItem(SETTINGS,JSON.stringify(settings));}catch{}}
function records(){try{return JSON.parse(localStorage.getItem(RECORDS)||'[]');}catch{return [];}}
function record(){if(recorded)return;recorded=true;try{const r=records();if(!r.some(x=>x.id===runId))r.unshift({...game.result,id:runId,date:new Date().toISOString()});localStorage.setItem(RECORDS,JSON.stringify(r.slice(0,30)));localStorage.removeItem(SAVE);}catch{}saved=null;}
function newGame(seed){game=new Game({seed:seed??crypto.getRandomValues(new Uint32Array(1))[0],aiEnabled:settings.ai,aiProvider:provider});runId=Date.now().toString(36);paused=false;recorded=false;view={zoom:1.5,x:200,y:205};lastPhase='';lastPanel='';accumulator=0;render(true);}
newGame();
if(saved)$('resume').hidden=false;
import('./ai-model.js').then(m=>{provider=m.inferPolicy;meta=m.AI_META;game.attachAI(provider);game.decisionAge=99;render(true);}).catch(()=>{modelError=true;render(true);});

$('start').onclick=()=>{game.start();saved=null;$('resume').hidden=true;save();render(true);};
$('resume').onclick=()=>{try{game=Game.restore(saved.state,provider);runId=saved.runId;settings.ai=game.aiEnabled;paused=game.phase==='combat';game.decisionAge=99;recorded=false;lastPhase='';lastPanel='';render(true);toast(game.phase==='combat'?'存档已恢复，点击继续战斗。':'上次行动已恢复。');}catch{toast('存档无法恢复，请开始新行动。');}};
$('pause').onclick=()=>{if(game.phase!=='combat')return;paused=!paused;save();render(true);};
$('resume-battle').onclick=()=>{paused=false;render(true);};
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('selected',x===b));});
$('ai-toggle').onclick=()=>{settings.ai=!game.aiEnabled;game.setAI(settings.ai);settingsSave();if(game.phase==='combat')game.decide();save();render(true);toast(settings.ai?'AI 战术模型已启用':'已切换为常规规则策略');};
$('zoom-in').onclick=()=>zoom(1);$('zoom-out').onclick=()=>zoom(-1);
function zoom(dir){view.zoom=Math.max(1,Math.min(2.5,view.zoom+dir*.5));if(view.zoom===1)view.x=view.y=200;$('zoom-label').textContent=view.zoom+'×';}
$('decision-panel').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.route){const c=game.choices.find(x=>x.id===b.dataset.route);if(c){game.enterNode(c);paused=false;save();render(true);scrollTo({top:0,behavior:'smooth'});}}if(b.dataset.reward){game.chooseReward(b.dataset.reward);if(game.phase==='combat')paused=false;save();render(true);if(game.phase==='combat')scrollTo({top:0,behavior:'smooth'});}if(b.dataset.new!==undefined){newGame();game.start();save();render(true);}if(b.dataset.retry!==undefined){const seed=game.seed;newGame(seed);game.start();save();render(true);}};

function modal(title,body){$('modal-title').textContent=title;$('modal-body').innerHTML=body;if(!$('modal').open){modal.wasPaused=paused;paused=true;$('modal').showModal();}render(true);}
$('modal-close').onclick=()=>$('modal').close();
$('modal').addEventListener('close',()=>{paused=!!modal.wasPaused;render(true);});
$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('modal').close();}});
function modelInfo(){const state=game.aiState;let probs=[];if(provider){try{probs=provider(game.features()).probabilities;}catch{}}
 modal('AI 战术指挥',`<h3>${meta?'内置轻量策略网络':'常规规则策略'}</h3><p>模型读取四侧压力、门耐久、携弹、库存、伤亡等 24 项状态，每 1.2 秒选择一次战术。队员分组、掩护交接和寻路由本地控制器执行。小队保留个人阵位，移动指令在到位前保持；紧急退守可以打断。队员在各入口组成两三人小组，一人移动时队友留位掩护，到位后再接替。前排出现空位时，后排择机补上；队伍缺弹时会保留能掩护忙碌队友的人。阵位为队员预留身体间距，移动优先绕开队友；窄处减速让行，堵住后重新规划路线。搬弹队员在库边取弹并靠近队友交接，站岗时保持观察、呼吸和重心变化。弹丸飞行、碰撞和弹药扣除由游戏规则执行。</p><div class="info-grid"><div><small>可学习参数</small><strong>${meta?fmt(meta.parameters):'—'}</strong></div><div><small>网络结构</small><strong style="font-size:14px">24 → 48 → 32 → 8</strong></div><div><small>训练方式</small><strong style="font-size:12px">合成数据 · 监督模仿</strong></div><div><small>运行位置</small><strong style="font-size:12px">当前浏览器 · 无需 API</strong></div></div><p>当前执行：<b>${escape(ACTION_LABELS[ACTIONS.indexOf(state.action)]||'等待态势')}</b>。${escape(state.reason)}</p>${probs.length?'<h3>当前态势的模型输出</h3>'+ACTIONS.map((a,i)=>`<div class="model-output"><span>${ACTION_LABELS[i]}</span><div class="meter"><i style="width:${Math.round(probs[i]*100)}%"></i></div><b>${Math.round(probs[i]*100)}%</b></div>`).join(''):''}<p class="prob-note">百分比是模型对策略的偏好，不是获胜概率。训练标签来自人工编写的战术效用规则；尚未证明模型能提高实战胜率。低置信度或异常输出会回退到常规策略。</p><h3>可以随时对照</h3><p>关闭战术网后，队员仍会自动作战和按需搬弹，由固定规则分配战术。模型不控制路线或奖励选择。</p>${modelError?'<p>本次模型加载失败，游戏正在使用常规规则策略。</p>':''}`);
}
$('model-info').onclick=modelInfo;$('ai-details').onclick=modelInfo;
$('ammo').onclick=()=>{const inv=game.inventory();modal('全队弹药账本',`<p>共享库存与个人携弹分别计算。搬运必须实际往返；换弹只使用个人备用弹药。转移据点不会免费补弹。</p>${Object.keys(AMMO).map(t=>{const units=game.living().filter(s=>WEAPONS[s.weapon].ammo===t);const carry=units.reduce((n,s)=>n+s.mag+s.reserve,0),cargo=game.living().reduce((n,s)=>n+(s.supply?.type===t?s.supply.cargo:0),0);return `<div class="ammo-row"><div>${AMMO[t]}<small>携行 ${fmt(carry)} · 运输 ${cargo} · 已射 ${fmt(inv.fired[t])} · 遗失 ${fmt(inv.lost[t])}</small></div><strong>${fmt(game.stock[t])}<small>共享库存</small></strong></div>`;}).join('')}<p class="subtle">获取总量 = 当前库存 + 个人携弹 + 运输中 + 已射击 + 阵亡遗失。新兵携带的弹药也计入获取总量。</p>`);};
$('team').onclick=()=>modal('队伍编制',`<p>${game.living().length} 名存活 · ${game.dead} 名阵亡 · 上限 35 人。点战场上的队员可以查看个人状态。</p>${Object.entries(WEAPONS).map(([k,w])=>{const units=game.living().filter(s=>s.weapon===k);return units.length?`<div class="team-row"><div><b style="color:${w.color}">${w.icon} · ${w.role}</b><small>${w.name} · ${w.mag}${w.belt?' 发弹链装载':' 发容量'}</small></div><strong>${units.length} 人</strong></div>`:'';}).join('')}<h3>小组与搭档</h3>${game.fireteams.map(t=>`<div class="team-row"><div><b>第 ${t.id} 组 · ${SIDES[t.side]}</b><small>${t.members.map(id=>'#'+id).join(' · ')}</small></div><span>${({moving:'交替移动',handoff:'接替掩护',support:'留位掩护',hold:'保持阵位'})[t.phase]||'保持阵位'}</span></div>`).join('')}<h3>自动分工</h3><p>没有专职补给兵。缺弹时临时挑选队员离开阵位，去中央库取弹，再送给相应队员。固定机枪操作手优先留在阵位。</p><p class="subtle">幸存者进入下一据点恢复生命；阵亡人员本局不会复活。新一局恢复初始编制。</p>`);
$('history').onclick=()=>{const rs=records();modal('战绩档案',`<p>仅保留最近 30 次行动的战绩。没有永久数值、解锁或货币。</p>${rs.length?rs.map(r=>`<div class="record-row"><div><b style="color:${r.win?'var(--lime)':'var(--danger)'}">${r.win?'行动完成':'行动失败'}</b><small>${new Date(r.date).toLocaleDateString('zh-CN')} · 种子 ${r.seed}</small></div><div>${clock(r.time)} · 清除 ${r.kills}<small>存活 ${r.survivors} / 阵亡 ${r.dead}</small></div></div>`).join(''):'<p class="subtle">还没有完成的行动。</p>'}`);};
$('help').onclick=()=>modal('行动手册与军械',`<h3>你负责选择，队伍负责作战</h3><p>选择路线 → 自动部署 → 观看战斗 → 波间随机三选一。4 个据点，每处 2 波；清剿需要消灭全部目标，坚守需要守住核心至计时结束。宽口仓库、近距住宅和开阔院落的入口、遮挡、接敌距离与门防不同。路线会预告主要压力方向及完成据点的回报。最终据点需要清剿母体并撤离。</p><p>任一据点失败，全局结束。阵亡保留，幸存者到下一个据点恢复生命。弹药有限且跨据点保留，奖励和路线是补给来源。</p><h3>编制与军械</h3><p>波间三选一包含军械、补给、补员或防护训练。军械卡显示实际换装人数和配套弹药，系统优先从步枪兵换装；有可用步枪兵时保留专长和固定火力。重复选择相应军械，可逐渐形成火力支援、精确射击或近距防守编制。军械使用手册中的弹种、弹匣容量和射程；弹药仍需实际搬运。</p><h3>观察战场</h3><p>R 步枪 / S 冲锋枪 / B 霰弹 / M 机枪 / D 精确射手 / G 榴弹 / H 固定机枪。橙色环表示搬弹；近旁同型武器队员可递出备用弹，递弹需短暂停火且不消耗仓库库存。队员会趁空档错峰换弹。青色弧线表示接火掩护，短标记提示“掩护”“后撤”或“补位”；移动者的新阵位有细小角标。弹迹是一颗颗短线，沿飞行路径判定命中。点击队员查看弹匣、备用弹和任务；放大后可拖动战场。</p><h3>现实军械，游戏近似</h3><p>弹种、容量与有公开资料的射程参考以下原始资料。整张战场按约 400 米表现；武器按射程与视线判定。自动火控为节约有限库存，通常等目标进入较近的交战距离再开火；交战距离是战术设定，不是武器的最大射程。伤害、命中、装填用时、防护减免、实战射击节奏、榴弹爆炸半径属于游戏近似，不代表现实装备性能。</p>${Object.values(WEAPONS).map(w=>`<div class="weapon-row"><b>${w.name}</b><span>${w.role}</span><p>${AMMO[w.ammo]} · ${w.mag} 发${w.belt?'弹链装载':'容量'} · ${w.range}m${w.rangeApprox?'（游戏设定）':''}</p><p>个人携弹初始上限 ${w.carry} 发 · 换装消耗奖励中的真实弹药</p></div>`).join('')}<p class="subtle">M249 使用 100 发携行弹链，M2 使用 100 发装载；弹链容量是本作配置。M203 可用单兵榴弹发射器按固定火力简化表现。首版没有载具。</p><div class="source-links">${SOURCES.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${escape(s.name)} ↗</a>`).join('')}</div><h3>存档</h3><p>当前行动自动存于此浏览器，重新打开可继续；切换设备不会同步。开始新行动会替换当前行动存档。战斗过程中切到后台会自动暂停。</p>`);

function render(force=false){
 document.querySelector('footer span').textContent='围屋行动 / '+VERSION;
 $('home-overlay').hidden=game.phase!=='home';$('pause-overlay').hidden=!(paused&&game.phase==='combat'&&!$('modal').open);$('pause').disabled=game.phase!=='combat';$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'继续战斗':'暂停战斗');
 $('ai-toggle').setAttribute('aria-checked',String(game.aiEnabled));$('model-badge-text').textContent=meta?(game.aiEnabled?'自动指挥':'规则指挥'):modelError?'规则模式':'AI 载入中';
 const state=game.aiState;
 $('ai-heading').textContent=game.aiEnabled&&meta?'小队指挥':'常规策略';
 $('ai-action').textContent=game.phase==='home'?'队伍待命':ACTION_LABELS[ACTIONS.indexOf(state.action)]||'评估态势';
 $('ai-reason').textContent=game.phase==='home'?'自动配合 · 换弹接火 · 按需搬弹':(state.source==='neural'?'模型决策 · ':'规则决策 · ')+state.reason;
 $('mission-name').textContent=game.node?`${String(game.nodeIndex+1).padStart(2,'0')} / ${game.node.name}`:'外围集结点';
 $('mission-stage').textContent=game.node?(game.node.mode==='hold'?'目标：限时坚守':'目标：清剿全部目标'):'4 个据点 · 一次行动';
 $('route-track').innerHTML=[0,1,2,3].map(i=>`<span class="route-step ${i<game.nodeIndex?'passed':i===game.nodeIndex?'active':''}" title="据点 ${i+1}"></span>`).join('');
 $('alive').innerHTML=game.living().length+'<small>/ 35</small>';$('kills').textContent=String(game.kills).padStart(3,'0');
 $('ammo-count').innerHTML=fmt(Object.values(game.stock).reduce((a,b)=>a+b,0))+'<small>发</small>';$('timer').textContent=clock(game.time);
 $('core-meter').style.width=(game.core.hp/game.core.max*100)+'%';$('core-meter').style.background=game.core.hp/game.core.max<.3?'var(--danger)':'#a9c282';$('core-value').textContent=Math.ceil(game.core.hp/game.core.max*100)+'%';
 $('objective-label').textContent=game.node?.mode==='hold'?'核心防御':'据点核心';
 const status={home:'待命',route:'选择路线',reward:'补给整备',combat:paused?'暂停':'自动交战',ended:game.result?.win?'行动完成':'行动结束'};
 $('battle-status').textContent=status[game.phase];$('live-dot').classList.toggle('active',game.phase==='combat'&&!paused);
 $('wave-label').textContent=game.wave?`第 ${game.wave} / 2 波 · ${game.node?.mode==='hold'?'限时坚守':'清剿'}${game.map.terrain?' · '+game.map.terrain.tag:''}`:'小球模拟 / 俯视战场';
 const panelKey=game.phase+'-'+game.nodeIndex+'-'+game.wave+'-'+game.choices.map(c=>c.id).join();
 if(force||panelKey!==lastPanel){renderPanel();lastPanel=panelKey;}
 if(game.phase==='combat'){const remaining=game.enemies.filter(z=>z.hp>0).length+game.remaining;$('combat-goal')?.replaceChildren(document.createTextNode(game.node.mode==='hold'?clock(Math.max(0,game.holdDuration-game.waveTime)):String(remaining)));const carriers=game.living().filter(s=>s.task==='supply').length;if($('carrier-count'))$('carrier-count').textContent=carriers;if($('combat-event')){const log=game.logs[0];$('combat-event').innerHTML=`<time>${clock(log?.time||0)}</time><b>${escape(log?.title||'队伍就位')}</b><br>${escape(log?.text||'')}`;}}
 if(game.phase==='ended')record();
 if(game.phase!==lastPhase){$('unit-detail').hidden=true;game.selectedId=null;lastPhase=game.phase;save();if(['route','reward','ended'].includes(game.phase))$('decision-panel').scrollIntoView({block:'nearest',behavior:'smooth'});}
 $('field-note').textContent=game.phase==='home'?'小组自动掩护、接替与补位；路线和升级仍由你选择。':game.phase==='combat'?groupNote():game.phase==='reward'?'战斗暂停，选择一项奖励后继续行动。小组搭档与弹药状态保留。':game.phase==='route'?'选择下一个据点，幸存小组将自动部署。':'行动结束，新的队伍将从初始编制重新出发。';
 updateUnit();
}
const routeSvg='<svg class="route-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10 12 4l8 6v11H4Z"/><path d="M9 21v-7h6v7M8 9h1m6 0h1"/></svg>';
function renderPanel(){
 const p=$('decision-panel');
 if(game.phase==='home'){p.innerHTML='<div class="waiting"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 28 8v9c0 7-12 12-12 12S4 24 4 17V8Z"/><path d="m10 16 4 4 8-9"/></svg><div><b>有限弹药，真实分工</b>观察队员搬弹、换装与四向防守。波间做决定，把队伍带到最后。</div></div>';return;}
 if(game.phase==='route'){p.innerHTML=`<div class="panel-title"><h2>选择下一据点</h2><span>路线 ${game.nodeIndex+2} / 4 · 二选一</span></div>${choiceContext()}<div class="route-choices">${game.choices.map((c,i)=>{const profile=MAP_PROFILES[c.template];return `<button class="route-card" data-route="${c.id}"><span class="route-number">ROUTE / 0${i+1}</span>${routeSvg}<h3>${escape(c.name)}</h3><div class="tags"><span class="tag">${c.mode==='hold'?'限时坚守':'清剿'}</span><span class="tag">${escape(c.terrain||profile?.tag||'四向据点')}</span>${c.danger?'<span class="tag risk">尸群较密</span>':''}</div><p>${escape(c.description||profile?.description||'完成据点目标，取得补给。')}</p><span class="route-front">主要压力：${c.fronts?.length?c.fronts.map(side=>SIDES[side]).join(' / '):'四向来敌'}</span><p class="route-payout">${escape(payoutText(c))}</p><span class="route-reward">${escape(c.reward)}<b>↗</b></span></button>`;}).join('')}</div>`;return;}
 if(game.phase==='reward'){p.innerHTML=`<div class="panel-title"><h2>战地整备 · 选择奖励</h2><span>三选一 · ${game.wave===2?'前往下一据点':'进入下一波'}</span></div>${choiceContext()}<div class="reward-choices">${game.choices.map(c=>`<button class="reward-card" data-reward="${c.id}"><span class="reward-icon">${c.icon}</span><div class="reward-copy"><div><h3>${escape(c.name)}</h3><span class="tag">${c.tag}</span></div>${rewardDetails(c)}</div><span class="card-arrow">↗</span></button>`).join('')}</div>`;return;}
 if(game.phase==='combat'){p.innerHTML=`<div class="panel-title"><h2>自动交战中</h2><span>波间选择升级</span></div><div class="combat-strip"><span class="combat-chip">${game.node.mode==='hold'?'守住剩余':'待清除'}<b id="combat-goal">—</b></span><span class="combat-chip">搬弹队员<b id="carrier-count">0</b></span><span class="combat-chip">完成运输<b>${game.supplyRuns}</b></span></div><div class="event-line" id="combat-event"></div>`;return;}
 if(game.phase==='ended'){const r=game.result;p.innerHTML=`<div class="end-panel"><span class="eyebrow">${r.win?'OPERATION COMPLETE':'OPERATION ENDED'}</span><h2>${r.win?'最后一道门，守住了。':'行动止步于此。'}</h2><p>${r.reason}。${r.win?'幸存队员已安全撤离。':'新的行动会恢复初始队伍与装备。'}</p><div class="end-stats"><div><small>行动用时</small><strong>${clock(r.time)}</strong></div><div><small>清除目标</small><strong>${r.kills}</strong></div><div><small>存活 / 阵亡</small><strong>${r.survivors} / ${r.dead}</strong></div></div><div class="end-actions"><button class="primary" data-new>新行动 <span>↗</span></button><button class="secondary" data-retry>相同种子再试</button></div><p class="subtle">已保存战绩 · 种子 ${r.seed} · 搬弹 ${r.supplyRuns} 次 · 模型决策 ${r.neuralDecisions} 次</p></div>`;}
}

const canvas=$('battle'),ctx=canvas.getContext('2d');let cw=800,ch=800,pointer=null;
function resize(){const b=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);cw=Math.round(b.width*ratio);ch=Math.round(b.height*ratio);if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}}
new ResizeObserver(resize).observe(canvas);
function circle(x,y,r,color,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(color){ctx.fillStyle=color;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function rect(x,y,w,h,fill,stroke){if(fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);}if(stroke){ctx.strokeStyle=stroke;ctx.strokeRect(x,y,w,h);}}
function line(x,y,tx,ty,color,width=1){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function label(text,x,y,color='#91a17e',size=5,align='center'){ctx.font=`${size}px system-ui`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(text,x,y);}
function draw(){
 resize();ctx.setTransform(cw/WORLD*view.zoom,0,0,ch/WORLD*view.zoom,cw/2-view.x*cw/WORLD*view.zoom,ch/2-view.y*ch/WORLD*view.zoom);ctx.clearRect(-500,-500,1400,1400);rect(0,0,400,400,'#121b2c');
 ctx.lineWidth=.5;for(let i=0;i<=400;i+=20){line(i,0,i,400,'#172336',.4);line(0,i,400,i,'#172336',.4);}ctx.lineWidth=1;
 // Deterministic scenery, independent of simulation randomness.
 for(let i=0;i<65;i++){const x=(i*79.31+21)%400,y=(i*123.77+42)%400;if(x>110&&x<290&&y>110&&y<300)continue;const n=i%5;if(n<3){circle(x,y,1.4+n,'#1a293b');circle(x+1.6,y-.7,1.5,'#213247');}else{rect(x,y,3+n,1.6,'#263548');}}
 const map=game.map,h=map.house;
 // The four approach tracks give the crowd a visible direction.
 [[200,0,200,134],[270,205,400,205],[200,276,200,400],[0,205,129,205]].forEach((a,i)=>line(...a,'#1c293c',(game.gates[i].width||16)*.8));
 rect(h.x+3,h.y+4,h.w,h.h,'#141e1466');rect(h.x,h.y,h.w,h.h,'#1c2a3e');
 for(let i=h.x+10;i<h.x+h.w;i+=10)line(i,h.y+3,i,h.y+h.h-3,'#233247',.5);
 for(let i=h.y+10;i<h.y+h.h;i+=10)line(h.x+3,i,h.x+h.w-3,i,'#233247',.5);
 rect(h.x+6,h.y+6,h.w-12,h.h-12,null,'#48617c33');
 for(const c of map.crates){rect(c.x+1.5,c.y+2,c.w,c.h,'#1b241b66');rect(c.x,c.y,c.w,c.h,'#344457','#52647a');line(c.x,c.y,c.x+c.w,c.y+c.h,'#52647a',.6);line(c.x+c.w,c.y,c.x,c.y+c.h,'#52647a',.6);}
 for(const w of map.walls){rect(w.x+1,w.y+1,w.w,w.h,'#1b2218');rect(w.x,w.y,w.w,w.h,'#778ba4');}
 for(const g of game.gates){const p=g.hp/g.max,vertical=g.side===1||g.side===3,span=(g.width||16)-2,half=span/2;ctx.lineWidth=1;
  if(p>0){rect(g.x-(vertical?1:half),g.y-(vertical?half:1),vertical?2:span,vertical?span:2,p<.3?'#cc9070':'#a7ac7b');for(let j=-half+2;j<half;j+=3)if(vertical)line(g.x-1,g.y+j,g.x+1,g.y+j,'#576340',.4);else line(g.x+j,g.y-1,g.x+j,g.y+1,'#576340',.4);}
  else{for(let j=0;j<3;j++)rect(g.x-5+j*4,g.y+2-j,3,1,'#9b8562');}
  const bx=vertical?g.x+(g.side===1?8:-18):g.x-8,by=vertical?g.y-11:g.y+(g.side===0?-9:7);
  rect(bx,by,16,1.6,'#263020');rect(bx,by,16*p,1.6,p<.3?'#d49776':'#adc18a');
 }
 // Depot and command core.
 const d=map.depot;rect(d.x-6,d.y-5,12,10,'#3a4630','#8b9c62');line(d.x-3,d.y,d.x+3,d.y,'#b6c991',1);line(d.x,d.y-3,d.x,d.y+3,'#b6c991',1);label('弹药库',d.x,d.y+12,'#b0bf95',4);
 if(game.core.hp<game.core.max){circle(d.x,d.y,10,null,'#d49b77');}
 // Current model emphasis is a subtle direction marker.
 if(game.tactic.startsWith('reinforce_')){const side=ACTIONS.indexOf(game.tactic)-1,g=game.gates[side];circle(g.x,g.y,12,null,'#d2e9a680');}
 if(game.tactic==='fallback'){ctx.setLineDash([2,3]);circle(200,205,43,null,'#e9bc7b88');ctx.setLineDash([]);}
 for(const s of game.soldiers){if(s.hp>0)continue;line(s.x-1.5,s.y-1.5,s.x+1.5,s.y+1.5,'#7b817266',1);line(s.x+1.5,s.y-1.5,s.x-1.5,s.y+1.5,'#7b817266',1);}
 const enemies=game.enemies.filter(z=>z.hp>0);
 for(const z of enemies){const mother=z.kind==='mother',r=mother?7.6:z.kind==='heavy'?4.1:z.kind==='runner'?2.8:3.2;circle(z.x+.6,z.y+1,r,'#11180d77');circle(z.x,z.y,r+(Math.sin((z.travel||0)*2.1+poseTime*1.8+z.id)*.16),z.hit>0?'#f1d5f5':mother?'#b46b92':z.kind==='heavy'?'#8b76ac':'#a190c2',mother?'#efafd1':z.kind==='heavy'?'#c0addb':'#c6b4de');if(z.kind==='heavy'){ctx.lineWidth=.7;circle(z.x,z.y,r-1,null,'#42364b');}if(mother){circle(z.x,z.y,3,'#d7afc8');label('母体',z.x,z.y-12,'#ecc3d7',5);rect(z.x-14,z.y-10,28,2,'#38262f');rect(z.x-14,z.y-10,28*z.hp/z.max,2,'#e197b9');}}
 const units=game.living();
 for(const h of game.ammoHandoffs){const a=units.find(s=>s.id===h.fromId),b=units.find(s=>s.id===h.toId);if(!a||!b)continue;const t=Math.min(1,h.elapsed/h.duration);ctx.setLineDash([1,2]);line(a.x,a.y,b.x,b.y,'#e4bd7266',.55);ctx.setLineDash([]);rect(a.x+(b.x-a.x)*t-1,a.y+(b.y-a.y)*t-1,2,2,'#edc778');}
 const markedTeams=activeGroups().slice(0,2),marked=new Set(markedTeams.flatMap(t=>[t.coverId,t.moverId].filter(Boolean))),tagPositions=[];
 for(const team of markedTeams){const mover=units.find(s=>s.id===team.moverId);if(!mover?.goal||Math.hypot(mover.x-mover.goal.x,mover.y-mover.goal.y)<5)continue;const p=mover.goal;for(const sign of [-1,1]){line(p.x+sign*3,p.y-3,p.x+sign*3,p.y-1,'#66bfb388',.55);line(p.x+sign*3,p.y-3,p.x+sign,p.y-3,'#66bfb388',.55);}}
 for(const s of units){
  const w=WEAPONS[s.weapon];ctx.lineWidth=.5;
  if(s.task==='supply'){const target=s.supply?.phase==='pickup'?d:game.soldiers.find(t=>t.id===s.supply?.targetId)||d;ctx.setLineDash([2,3]);line(s.x,s.y,target.x,target.y,'#e6bc7038',.45);ctx.setLineDash([]);circle(s.x,s.y,5,null,'#ddbb76');}
  const angle=s.facing||0,moving=Math.min(1,Math.hypot(s.vx||0,s.vy||0)/2),step=Math.sin(s.travel*2.4)*moving,idle=1-moving,phase=s.id*2.399963;
  const breath=Math.sin(poseTime*(1.65+(s.id%5)*.09)+phase),cycle=(poseTime+s.id*1.73)%(5.2+(s.id%4)*.7);
  const shift=cycle<1.6?Math.sin(cycle/1.6*Math.PI)**2*.48*(s.id%2?1:-1):0,sway=(shift+Math.sin(poseTime*.87+phase)*.16)*idle;
  const sideX=-Math.sin(angle),sideY=Math.cos(angle),bodyX=s.x+sideX*sway-Math.cos(angle)*(s.recoil||0)*.65,bodyY=s.y+sideY*sway+breath*.18*idle-Math.sin(angle)*(s.recoil||0)*.65;
  circle(s.x+.6,s.y+1,3.7,'#080f1b88');
  // Idle pose is visual only: breathing and weight shifts never alter the world position or orders.
  const toe=step+shift*.3;
  circle(s.x+sideX*2.5+Math.cos(angle)*toe,s.y+sideY*2.5+Math.sin(angle)*toe,1,'#8da8b7');
  circle(s.x-sideX*2.5-Math.cos(angle)*toe,s.y-sideY*2.5-Math.sin(angle)*toe,1,'#8da8b7');
  const gunAngle=angle+breath*.018*idle+(s.reload>0?Math.sin(poseTime*4+phase)*.055:0),barrel=(w.fixed?6.5:5.6)-(s.recoil||0)*.45;
  line(bodyX,bodyY,bodyX+Math.cos(gunAngle)*barrel,bodyY+Math.sin(gunAngle)*barrel,'#e3eaf1',w.fixed?1.7:1.05);
  ctx.lineWidth=.55;ctx.beginPath();ctx.ellipse(bodyX,bodyY,3.3*(1+breath*.025*idle),3.3*(1-breath*.045*idle),angle,0,Math.PI*2);ctx.fillStyle=s.hit>0?'#f2d9d0':w.color;ctx.fill();ctx.strokeStyle='#e4edf3';ctx.stroke();
  label(w.icon,bodyX,bodyY+1.5,'#142333',3.8);
  if(s.covering&&game.phase==='combat'){ctx.beginPath();ctx.arc(s.x,s.y,4.5,angle-1,angle+1);ctx.lineWidth=.8;ctx.strokeStyle='#64dbc9';ctx.stroke();const gesture=Math.sin(Math.min(1,Math.max(0,game.time-(s.coop?.since||0))/.8)*Math.PI)*.8;circle(bodyX+sideX*(3.2+gesture),bodyY+sideY*(3.2+gesture),.65,'#64dbc9');}
  if(s.hp<s.maxHP){rect(s.x-4,s.y-6,8,1,'#29321f');rect(s.x-4,s.y-6,8*s.hp/s.maxHP,1,s.hp<35?'#df9b83':'#bfcd9a');}
  if(s.mag+s.reserve===0){label('!',s.x+4,s.y-3,'#f0c07e',5);}
  if(s.reload>0){ctx.strokeStyle='#d0d6b9';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(s.x,s.y,4.5,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-s.reload/(w.reload/game.mod.reload)));ctx.stroke();}
  if(s.supply?.cargo){rect(s.x+3,s.y+2,3,2,'#e5bc73');}
  if(marked.has(s.id)||game.handoffFor(s)||game.selectedId===s.id){
   const text=game.handoffFor(s)?(game.handoffFor(s).fromId===s.id?'递弹':'接弹'):s.coop?.role==='cover'?'掩护':s.coop?.role==='move'?(s.coop.reason==='retreat'?'后撤':s.coop.reason==='reload'?(s.reload>0?'换弹':'归位'):'补位'):'';
   if(text){const position=[{x:s.x,y:s.y-12},{x:s.x,y:s.y+12},{x:s.x-14,y:s.y},{x:s.x+14,y:s.y}].find(p=>units.every(a=>a===s||Math.hypot(a.x-p.x,a.y-p.y)>10)&&tagPositions.every(a=>Math.hypot(a.x-p.x,a.y-p.y)>17));if(position){tagPositions.push(position);rect(position.x-7,position.y-4.8,14,7,'#102332dd');label(text,position.x,position.y+.4,'#9de1d3',4.8);}}
  }
  if(game.selectedId===s.id){ctx.lineWidth=.7;circle(s.x,s.y,7,null,'#e2edb8');}
 }
 // Only short, moving streaks are drawn: their length never depends on target distance.
 for(const p of [...game.projectiles,...game.effects.filter(e=>e.type==='tracer')]){
  const alpha=Math.max(0,Math.min(1,accumulator*30)),x=p.px+(p.x-p.px)*alpha,y=p.py+(p.y-p.py)*alpha;
  if(p.grenade){const lift=Math.sin(Math.min(1,p.travel/Math.max(1,p.length))*Math.PI)*9;circle(x,y,.9,'#0008');circle(x,y-lift,1.3,'#efc978','#fff1c1');}
  else{const tail=Math.min(p.weapon==='benelli'?2:4,p.travel),dx=p.vx/p.speed,dy=p.vy/p.speed;ctx.lineCap='round';line(x-dx*tail,y-dy*tail,x,y,p.weapon==='m2'?'#ffe9a3':'#f5edd3',p.weapon==='benelli'?.42:.62);ctx.lineCap='butt';}
 }
 for(const e of game.effects){
  const p=e.life/e.max;ctx.globalAlpha=p;
  if(e.type==='muzzle'){const dx=Math.cos(e.angle),dy=Math.sin(e.angle);line(e.x,e.y,e.x+dx*2.1,e.y+dy*2.1,'#fff1b8',1.1);}
  if(e.type==='impact'){for(let i=0;i<3;i++){const a=i*2.094+e.x;line(e.x,e.y,e.x+Math.cos(a)*(1-p)*3,e.y+Math.sin(a)*(1-p)*3,e.color,.55);}}
  if(e.type==='blast')circle(e.x,e.y,e.r*(1.5-p*.5),'#d2aa7055','#edc485');
  if(e.type==='death')circle(e.x,e.y,3*(1-p),e.color);
  if(e.type==='supply')label(e.text,e.x,e.y-8-(1-p)*5,'#e2c486',5);
  ctx.globalAlpha=1;
 }
 // Compass and scale retain their world positions when zoomed.
 label('N',200,31,'#96a27f',6);line(200,35,200,41,'#82916c',.7);label('E',369,208,'#7b8a68',5);label('S',200,368,'#7b8a68',5);label('W',31,208,'#7b8a68',5);
 line(17,354,57,354,'#82916c',.6);line(17,351,17,357,'#82916c',.6);line(57,351,57,357,'#82916c',.6);label('40 m',37,365,'#82916c',4);
 if(game.phase==='home'){ctx.setLineDash([2,4]);for(const g of game.gates){const x=g.side===1?335:g.side===3?65:200,y=g.side===0?65:g.side===2?340:205;line(x,y,g.x,g.y,'#b0a2ca44',.7);for(let j=0;j<4;j++)circle(x+(j%2)*6-3,y+Math.floor(j/2)*6-3,2.4,'#a695be66');}ctx.setLineDash([]);}
 ctx.setTransform(1,0,0,1,0,0);
}
function worldPoint(e){const r=canvas.getBoundingClientRect();return {x:view.x+(e.clientX-r.left-r.width/2)*WORLD/r.width/view.zoom,y:view.y+(e.clientY-r.top-r.height/2)*WORLD/r.height/view.zoom};}
canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y,moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!pointer||view.zoom===1)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(dx,dy)>5)pointer.moved=true;const unit=WORLD/canvas.getBoundingClientRect().width/view.zoom;const margin=200/view.zoom;view.x=Math.max(margin,Math.min(400-margin,pointer.vx-dx*unit));view.y=Math.max(margin,Math.min(400-margin,pointer.vy-dy*unit));});
canvas.addEventListener('pointerup',e=>{if(pointer&&!pointer.moved&&game.phase!=='home'){const p=worldPoint(e);const closest=game.living().map(s=>({s,d:Math.hypot(s.x-p.x,s.y-p.y)})).sort((a,b)=>a.d-b.d)[0];game.selectedId=closest?.d<12/view.zoom?closest.s.id:null;updateUnit();}pointer=null;});
canvas.addEventListener('pointercancel',()=>pointer=null);
function updateUnit(){const s=game.living().find(s=>s.id===game.selectedId);if(!s){$('unit-detail').hidden=true;return;}const w=WEAPONS[s.weapon];$('unit-detail').hidden=false;$('unit-detail').innerHTML=`<div class="unit-top"><strong>#${s.id} ${w.role} · ${w.name}</strong><button aria-label="关闭队员详情">×</button></div><p>生命 ${Math.ceil(s.hp)} / ${s.maxHP} · 弹匣 ${s.mag} / ${w.mag} · 备用 ${s.reserve}<br>${s.reload>0?'装填中 · '+s.reload.toFixed(1)+'s':s.task==='supply'?(s.supply?.phase==='pickup'?'前往弹药库':'运送 '+(s.supply?.cargo||0)+' 发弹药'):({share:'向搭档递出备用弹','team-wait':'留位警戒，等待接替',relief:'接替前排阵位',wait:'等待通行',yield:'让路后归位',retreat:'交替退守',cover:'掩护队友',move:'移动补位',aim:'瞄准目标',fire:'射击',guard:SIDES[s.side]+'警戒'}[s.activity]||SIDES[s.side]+'警戒')} · 清除 ${s.kills} · 射击 ${s.shots} 发<br>${escape(coopDetail(s))}</p>`;$('unit-detail').querySelector('button').onclick=()=>{game.selectedId=null;$('unit-detail').hidden=true;};}
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(game.phase==='combat')paused=true;save();render(true);}});
addEventListener('pagehide',save);
function frame(now){const dt=Math.min((now-lastFrame)/1000||0,.15);lastFrame=now;if(!paused&&!document.hidden)poseTime+=dt*(game.phase==='combat'?speed:1);if(game.phase==='combat'&&!paused&&!document.hidden){accumulator+=dt*speed;let steps=0;while(accumulator>=1/30&&steps++<20&&game.phase==='combat'){game.step(1/30);accumulator-=1/30;}}else accumulator=0;if(now-lastHud>230){render();lastHud=now;}if(now-lastSave>3500){save();lastSave=now;}draw();requestAnimationFrame(frame);}
render(true);requestAnimationFrame(frame);
