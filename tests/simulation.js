const assert=(v,message)=>{if(!v)throw new Error(message);};
const log=typeof print==='function'?print:console.log;
const {W,H,create,spawn,step,setMode,burst,createAdvisor,worldSize,resize,choose}=Swarm;
const quiet=()=>{
  const g=create(12);g.nextSpawn=1000;g.salvage=[];return g;
};
function ticks(g,s,input={}){
  for(let i=0;i<s*60;i++)step(g,{aim:g.aim||{x:g.player.x+300,y:g.player.y},fire:g.mode!=='spear'||g.weapon.lock<.999,...input});
}
function atPlayer(g,n){
  for(let i=0;i<n;i++)g.salvage.push({x:g.player.x,y:g.player.y,vx:0,vy:0});
}
function close(a,b){return Math.abs(a-b)<.00001;}
{
  const portrait=worldSize(390,844),wide=worldSize(1920,1080),g=quiet(),p=g.player;
  assert(close(portrait.w/portrait.h,390/844)&&close(wide.w/wide.h,16/9),'Arena uses the entire viewport at either aspect ratio without stretching');
  p.x=W*.23;p.y=H*.87;
  const e=spawn(g,'ram',W*.79,H*.12);
  g.aim={x:100,y:100};
  g.hazards.push({x:W*.25,y:H*.5,endX:W*.75,endY:H*.5});
  resize(g,portrait);
  assert(close(p.x/portrait.w,.23)&&close(p.y/portrait.h,.87)&&close(e.x/portrait.w,.79),'Resizing preserves relative positions');
  assert(close(g.hazards[0].endX/portrait.w,.75)&&g.aim===null,'Resize remaps beam endpoints and clears stale aim');
}
{
  const g=quiet();g.round=1;g.wave=2;
  assert(!setMode(g,'spear'),'Spear starts locked');
  atPlayer(g,54);step(g);
  assert(g.drones===24&&g.unlocked===3&&g.relay&&g.repair,'Salvage unlocks both formations and support roles');
  assert(g.events.filter(e=>e.id==='formation_unlocked').length===2,'Each unlock is recorded once');
  assert(setMode(g,'spear')&&setMode(g,'blades'),'Unlocked formations can be selected');
  const p=g.player,skimmer=spawn(g,'skimmer',p.x+71,p.y);
  ticks(g,.26);
  assert(skimmer.hp<=0&&g.stats.bladeKills===1,'Blades cut down a nearby skimmer before contact');
}
{
  const g=quiet();g.drones=12;g.nextFire=1000;const p=g.player;
  g.hostile.push({x:p.x+48,y:p.y,vx:-200,vy:0,life:2});
  ticks(g,.25);
  assert(p.hp===100&&g.hostile.length===0&&g.stats.blocks===1,'Ring intercepts approaching fire');
}
{
  const g=quiet(),p=g.player;g.drones=15;g.unlocked=2;setMode(g,'spear');
  p.angle=0;
  const ram=spawn(g,'ram',p.x+225,p.y),skimmer=spawn(g,'skimmer',p.x+295,p.y);
  ticks(g,1.15,{aim:{x:p.x+300,y:p.y}});
  assert(ram.hp<47&&skimmer.hp<=0&&g.stats.pierceHits>0,'Spear harms armor and pierces a target behind it');
  atPlayer(g,15);step(g);
  const before=g.drones;
  assert(burst(g)&&g.drones===before-4&&g.charge===0&&!burst(g),'Burst consumes charge and four drones');
  ticks(g,.70,{aim:{x:p.x+300,y:p.y}});
  assert(g.fx.some(f=>f.color==='burst'),'Kamikaze drones detonate');
}
{
  const g=quiet(),p=g.player,advise=createAdvisor();
  const ram=spawn(g,'ram',p.x+220,p.y);g.drones=10;
  assert(!advise(g),'Locked Spear is not recommended');
  g.unlocked=2;
  assert(!advise(g),'A new non-urgent recommendation waits briefly');
  g.t+=.2;
  assert(advise(g)?.target===ram&&advise(g)?.reason==='armor','Armored ram is marked for Spear');
  g.hostile.push({x:p.x+52,y:p.y,vx:200,vy:0,life:2},{x:p.x+52,y:p.y+70,vx:-200,vy:0,life:2});
  assert(advise(g)?.mode==='spear','Passing or outgoing shots do not override an armor recommendation');
  const incoming={x:p.x+84,y:p.y,vx:-200,vy:0,life:2};
  g.hostile.push(incoming);
  assert(advise(g)?.shot===incoming&&advise(g)?.mode==='ring','Imminent projectile overrides armor');
  g.hostile.pop();
  assert(advise(g)?.mode==='ring'&&!advise(g)?.shot,'Expired projectile marker disappears before the cue settles');
  g.t+=.2;
  assert(advise(g)?.mode==='spear','Spear returns when fire passes');
  const sentry=spawn(g,'sentry',p.x,p.y+220);sentry.wind=g.t+.43;
  advise(g);g.t+=.2;
  assert(advise(g)?.target===sentry&&advise(g)?.reason==='volley','Wind-up warns before the shot is fired');
  g.drones=2;
  assert(advise(g)?.mode!=='ring','Ring is not recommended if it cannot block');
}
{
  const g=quiet(),p=g.player,advise=createAdvisor();
  g.unlocked=3;g.drones=16;g.nextFire=1000;p.inv=0;
  const e=spawn(g,'sovereign',p.x-220,p.y);e.ready=0;
  ticks(g,.39);
  assert(g.hazards.length===1&&advise(g)?.reason==='beam'&&!advise(g)?.mode,'Beam produces an evade warning instead of Ring');
  const p0=p.hp;ticks(g,1.5);
  assert(p.hp<p0&&g.lastHit==='beam'&&g.stats.blocks===0,'Ring does not absorb beam damage');
}
{
  const g=quiet();g.nextFire=1000;
  const e=spawn(g,'splitter',g.player.x+62,g.player.y);
  e.hp=16;g.unlocked=3;setMode(g,'blades');
  ticks(g,.05);
  assert(g.enemies.filter(e=>e.type==='skimmer').length===0,'A close blade cut severs the Splitter before it releases offspring');
}
{
  const g=quiet(),p=g.player;
  g.unlocked=3;g.drones=20;g.nextFire=1000;p.inv=0;
  setMode(g,'blades');
  for(let i=0;i<6;i++){const e=spawn(g,'skimmer',p.x+i*2+32,p.y);e.hp=2;}
  step(g,{aim:{x:p.x+200,y:p.y},fire:true});
  assert(g.stats.bestChain===6&&Swarm.multiplier(g)===2&&g.score===7*85,'Six fast kills trigger the score chain');
  g.hazards.push({type:'surge',x:p.x,y:p.y,radius:60,start:g.t,fire:g.t+.12,end:g.t+.55,source:'surge'});
  assert(createAdvisor()(g)?.reason==='surge','Marked surge calls for evasion');
  ticks(g,.2);
  assert(g.lastHit==='surge'&&Swarm.multiplier(g)===1,'A hazard hit breaks the kill chain');
}
{
  const g=create(5,{kind:'training'});
  let misses=0;
  for(let i=0;i<2400&&g.phase==='playing';i++){
    const d=g.training.index,target=g.enemies[0],p=g.player;
    const miss=d===3&&misses<3&&g.charge===100&&target;
    if(miss)misses++;
    const fire=d===3&&target&&(miss||misses>=3&&g.stats.bursts===3&&g.charge===100&&!g.shots.length);
    step(g,{fire:d!==1||g.weapon.lock<.999,mode:['ring','spear','blades','ring'][d],aim:miss?{x:p.x,y:p.y-200}:target,burst:!!fire});
  }
  assert(g.phase==='trained'&&g.events.filter(e=>e.id==='training_completed').length===4,'All four playable drills finish');
  assert(misses===3&&g.stats.bursts===4,'Kamikaze drill recovers from repeated misses');
}
{
  const g=quiet();g.player.hp=8;g.player.inv=0;
  g.hostile.push({x:g.player.x+5,y:g.player.y,vx:-200,vy:0,life:2});
  step(g);
  assert(g.phase==='lost'&&g.events.at(-1).result==='lost','Fatal hit ends the run');
  const stamp=g.t;ticks(g,1);assert(stamp===g.t,'Debrief stops simulation');
}
{
  const g=create(0x49f47389,{protocol:'scout'}),p=g.player;
  g.phase='draft';g.salvage=[];g.draft=['plating','lance','thrusters'];g.round=0;g.stats.sectors=1;
  p.hp=49;g.stats.spearDamage=35.75;g.drones=41;g.peak=42;g.t=73;g.unlocked=3;g.score=5100;g.charge=64;
  assert(choose(g,'plating'),'Selected module prepares next sector');Swarm.depart(g);
  const data=Swarm.checkpoint(g);
  const restored=Swarm.restore(JSON.parse(JSON.stringify(data)),{w:W,h:H});
  assert(restored.stats.spearDamage===35.75,'Checkpoint preserves fractional combat damage accounting');
  assert(restored&&restored.round===1&&restored.score===5100&&restored.protocol==='scout','Checkpoint preserves run identity and progress');
  assert(restored.player.max===122&&restored.player.hp===p.hp&&restored.drones===g.drones,'Continue does not apply sector rewards twice');
  assert(restored.upgrades.plating===1&&restored.charge===64&&restored.t===73,'Continue restores module, charge, and clock');
  ticks(g,7,{x:.2,y:-.2});ticks(restored,7,{x:.2,y:-.2});
  assert(JSON.stringify(g.enemies)===JSON.stringify(restored.enemies)&&g.player.hp===restored.player.hp,'Checkpoint resumes the same encounter with the same RNG stream');
  assert(!Swarm.checkpoint(g)&&!Swarm.restore({...data,round:7},{w:W,h:H}),'Mid-sector state and invalid campaign checkpoints are rejected');
}
for(const [seed,options] of [[4,{}],[42,{}],[315,{bounds:worldSize(390,844)}]]){
  const {g,results}=autopilot(seed,options);
  assert(g.phase==='won'&&g.stats.sectors===5&&results.length===20,'Campaign can clear all sectors for seed '+seed);
  assert(g.t>=880&&g.t<1800,'Campaign builds across at least fourteen active minutes');
  assert(g.events.filter(e=>e.id==='wave_started').length===20,'Campaign starts twenty waves');
  assert(g.events.filter(e=>e.id==='upgrade_chosen').length===19,'Nineteen upgrade choices persist across the campaign');
  assert(g.events.some(e=>e.id==='boss_attack'&&e.attack==='dash')&&g.events.some(e=>e.id==='boss_attack'&&e.attack==='beam'),'Signature boss attacks occur in a full run');
  assert(['pulsar','weaver','bulwark'].every(type=>g.events.some(e=>e.id==='enemy_discovered'&&e.type===type)),'Full campaign introduces all three new enemy roles');
  assert(g.events.some(e=>e.id==='pattern_spawned'&&e.pattern==='wave')&&g.events.some(e=>e.id==='pattern_spawned'&&e.pattern==='sweep'),'Campaign exercises broken rings and corridor walls');
  assert(g.stats.blocks>0&&g.stats.pierceHits>0&&g.stats.bladeKills>0,'All three formations work in a campaign run');
  log('Campaign '+seed+': '+Math.round(g.t)+'s, rank '+Swarm.rank(g)+', '+g.peak+' peak drones, '+g.player.hp+' hull');
}
{
  const {g}=autopilot(42,{kind:'endless'},1000);
  assert(g.stats.sectors>=4&&g.phase!=='won'&&Swarm.rank(g)===null,'Endless continues beyond the campaign finale');
  assert(g.events.filter(e=>e.id==='sector_started'&&e.round>3).length>0,'Endless starts a new sector after the last boss');
  log('Endless: '+g.stats.sectors+' sectors cleared at '+Math.round(g.t)+'s');
}
{
  const {g}=autopilot(42,{kind:'rush'},900);
  assert(g.phase==='won'&&g.stats.sectors===5&&g.events.filter(e=>e.id==='boss_entered').length===5,'Boss Rush clears five immediate encounters');
  assert(!g.events.some(e=>e.id==='wave_started')&&Swarm.earnedBadges(g).includes('rushClear'),'Boss Rush skips waves and earns its own badge');
}
{
  const g=create(42);for(let i=0;i<800*60&&['playing','draft'].includes(g.phase);i++){if(g.phase==='draft')choose(g,chooseModule(g));else step(g);}
  assert(g.phase==='lost','Staying still in Ring cannot clear the campaign');
}
log('Simulation checks passed.');
