// Tests exercise player decisions and collision rules, not rendered decoration.
function combatRoom(mode='ring'){
  const g=Swarm.create(71);g.salvage=[];g.nextSpawn=1000;g.nextField=1000;g.nextFire=1000;g.player.inv=0;
  g.player.angle=0;g.drones=30;g.unlocked=3;g.mode=mode;return g;
}
function boltAt(g,e,kind='ally',hit=50,vx=60){
  g.shots.push({x:e.x-vx/60,y:e.y,vx,vy:0,life:.5,hit,pierce:0,kind,seen:[]});Swarm.step(g);
}
{
  const g=combatRoom(),p=g.player;
  for(let i=0;i<3;i++)g.hostile.push({x:p.x+53+i*32,y:p.y,vx:-160,vy:0,life:3,amount:11});
  advance(g,1,{fire:false});
  check(g.stats.captured===3&&g.stats.counterSalvos===0&&g.weapon.guard===3&&g.shots.length===0,'Captures store three cells without automatic counterfire');
  g.nextFire=0;Swarm.step(g,{aim:{x:p.x,y:p.y-200},fire:true});
  check(g.stats.counterSalvos===1&&g.weapon.guard===0&&g.shots.every(b=>b.vy<0),'A deliberate aimed shot spends capture energy along the selected bearing');
}
{
  const g=combatRoom(),p=g.player;g.upgrades.mirror=1;
  const owner=Swarm.spawn(g,'sentry',p.x+220,p.y);owner.dummy=true;
  g.hostile.push({x:p.x+42,y:p.y,vx:-160,vy:0,life:3,amount:11,owner});Swarm.step(g);
  check(g.shots.length===0&&g.weapon.guard===1,'Mirror stores a capture without firing toward its emitter');
  g.nextFire=0;Swarm.step(g,{aim:{x:p.x,y:p.y-200},fire:true});
  check(g.shots.some(b=>b.kind==='reflect'&&b.vy<0&&b.hit>16),'Mirror empowers the next manually aimed shot');
  const gravity=combatRoom();gravity.upgrades.gravity=1;
  gravity.hostile.push({x:gravity.player.x+42,y:gravity.player.y,vx:-160,vy:0,life:3,amount:11});Swarm.step(gravity);
  check(gravity.fields.length===1&&Swarm.slowFactor(gravity,{x:gravity.fields[0].x,y:gravity.fields[0].y})<1,'Gravity blocks leave a functional slowing well');
}
{
  const g=combatRoom('spear'),p=g.player;g.nextFire=0;
  const e=Swarm.spawn(g,'ram',p.x+180,p.y);e.hp=10000;e.dummy=true;
  advance(g,.85,{aim:e,fire:true});check(g.stats.railShots===0&&g.weapon.lock===1,'Holding a full rail never fires automatically');
  Swarm.step(g,{aim:e,fire:false});advance(g,.25,{aim:e,fire:false});
  check(g.stats.railShots===1&&e.hp<10000,'Releasing fires exactly one charged skill shot');
  advance(g,.4,{aim:{x:p.x-200,y:p.y},fire:false});
  check(g.stats.railShots===1&&g.weapon.lock>0&&p.angle>3,'Aiming elsewhere never creates another rail');
  const base=Swarm.chargeDuration(g);g.upgrades.siege=1;check(Swarm.chargeDuration(g)>base,'Siege pays for power with a longer charge');
}
{
  const g=combatRoom('blades'),p=g.player;
  const front=Swarm.spawn(g,'skimmer',p.x+70,p.y),between=Swarm.spawn(g,'skimmer',p.x+35,p.y+Math.sqrt(3)*35),outside=Swarm.spawn(g,'skimmer',p.x+105,p.y);
  for(const e of [front,between,outside])e.dummy=true;
  Swarm.step(g,{aim:{x:p.x+200,y:p.y},fire:true});
  check(front.hp<=0&&between.hp===between.max,'Only the visible cutting arc hits; the space between arms is not an invisible damage aura');
  advance(g,.55);check(between.hp<=0&&outside.hp===outside.max,'The sweep reaches the next target without damaging targets outside its reach');
  advance(g,1,{x:1});check(g.weapon.spin>.8,'Moving must spool up the blade drive');
}
{
  const g=combatRoom(),p=g.player,e=Swarm.spawn(g,'weaver',p.x+240,p.y);e.born=-1;e.ready=0;
  Swarm.step(g);const beam=g.hazards[0],endX=beam.endX,endY=beam.endY;
  p.y-=90;advance(g,.2);
  check(beam.endX===endX&&beam.endY===endY,'A Weaver lane must stop tracking once announced');
  boltAt(g,e,'spear',24);
  check(g.stats.interrupts===1&&!g.hazards.some(h=>h.owner===e&&h.end>g.t)&&e.staggerUntil>g.t,'A charged rail interrupts the wind-up and cancels its unreleased beam');
}
{
  const front=combatRoom(),p=front.player,prism=Swarm.spawn(front,'prism',p.x+200,p.y);prism.dummy=true;prism.angle=Math.PI;
  boltAt(front,prism,'ally',50);const blocked=prism.max-prism.hp;
  const rear=combatRoom(),rp=rear.player,back=Swarm.spawn(rear,'prism',rp.x+200,rp.y);back.dummy=true;back.angle=Math.PI;
  boltAt(rear,back,'ally',50,-60);
  check(blocked===15&&back.max-back.hp===50,'Prism facet must reduce frontal hits but leave the rear vulnerable');
  boltAt(front,prism,'spear',20);const before=prism.hp;boltAt(front,prism,'ally',30);
  check(front.stats.shieldBreaks===1&&Math.abs(before-prism.hp-30)<.001,'A rail hit must open the facet to other weapons');
}
{
  const g=combatRoom(),p=g.player,relay=Swarm.spawn(g,'bulwark',p.x+230,p.y),escort=Swarm.spawn(g,'sentry',p.x+275,p.y+50);
  relay.dummy=escort.dummy=true;
  boltAt(g,escort,'ally',50);check(Math.abs(escort.hp-37)<.001,'Shield Relay protects nearby escorts while the core stays outside its perimeter');
  boltAt(g,relay,'spear',35);boltAt(g,escort,'ally',50);
  check(relay.shieldOpen>g.t&&escort.hp<=0,'Breaking the relay exposes its escorts');
}
{
  for(const kind of ['wave','sweep'])for(const safe of [true,false]){
    const g=combatRoom(),p=g.player;g.t=1;
    if(kind==='wave'){
      const h={type:'wave',x:300,y:260,start:0,fire:0,end:3,speed:174,width:15,gap:0,gapHalf:.6,source:'wave'};
      const a=safe?0:Math.PI/2,r=Swarm.patternRadius(h,g.t);p.x=h.x+Math.cos(a)*r;p.y=h.y+Math.sin(a)*r;g.hazards=[h];
    }else{
      p.x=460;p.y=safe?280:70;g.hazards=[{type:'sweep',axis:'x',x:0,y:0,endX:920,endY:0,start:0,fire:0,end:2,width:28,gap:280,gapHalf:75,source:'sweep'}];
    }
    Swarm.step(g);check(safe?p.hp===100:p.hp<100,'Geometry '+kind+' must collide outside its gap and stay harmless inside it, even in Ring');
  }
}
{
  const g=combatRoom('ring'),p=g.player;g.drones=15;g.charge=100;g.aim={x:p.x+220,y:p.y};g.upgrades.cryo=1;
  check(Swarm.burst(g)&&g.shots.filter(b=>b.kind==='burst').length===1,'Default payload is one aimed explosive carrier');
  advance(g,.55);
  const f=g.fields.find(f=>f.type==='cryo');check(f&&Swarm.slowFactor(g,{x:f.x,y:f.y},true)<.6,'Cryo must leave a field that slows hostile bullets');
  const cluster=combatRoom();cluster.upgrades.cluster=1;cluster.drones=15;cluster.charge=100;Swarm.burst(cluster);
  check(cluster.shots.filter(b=>b.kind==='burst').length===3,'Cluster replaces the single carrier with three spreading charges');
}
{
  const g=combatRoom();g.upgrades.bastion=1;g.wave=1;g.waveStart=-100;Swarm.step(g);
  check(g.draft.includes('mirror')&&g.draft.includes('gravity'),'A specialization draft offers alternative cores side by side');
  Swarm.choose(g,'mirror');const saved=Swarm.checkpoint(g);
  g.phase='draft';g.draft=['gravity'];check(!Swarm.choose(g,'gravity'),'A fitted core hard-locks the alternative for that weapon');
  check(!Swarm.validCheckpoint({...saved,upgrades:{bastion:1,mirror:1,gravity:1}}),'A checkpoint cannot restore contradictory core slots');
}
{
  const g=combatRoom('spear'),p=g.player;g.upgrades.arc=1;g.nextFire=0;
  const target=Swarm.spawn(g,'ram',p.x+180,p.y);target.dummy=true;
  advance(g,.9,{aim:target,fire:true});Swarm.step(g,{aim:target,fire:false});
  check(g.shots.length===3&&g.shots.filter(b=>b.kind==='shard').length===2,'Arc fires two fixed-angle branches at manual release');
  check(g.shots.every(b=>b.vx>0),'Arc branches retain the manually selected forward bearing');
}
{
  const measure=(id,r)=>{const g=combatRoom('blades'),p=g.player;if(id)g.upgrades[id]=1;const e=Swarm.spawn(g,'skimmer',p.x+r,p.y);e.hp=e.max=500;e.dummy=true;Swarm.step(g,{aim:{x:p.x+200,y:p.y},fire:true});return {g,e,damage:500-e.hp};};
  const base=measure('',68),orbit=measure('longOrbit',68),far=measure('longOrbit',108),vortex=measure('vortex',68);
  check(orbit.damage<base.damage&&far.damage>0,'Long Orbit buys functional reach by reducing cut damage');
  check(vortex.damage>base.damage&&vortex.e.slowUntil>vortex.g.t&&vortex.e.x<vortex.g.player.x+68,'Vortex strengthens cuts, slows enemies, and pulls them inward at the cost of reach');
}
{
  const sample=open=>{const g=combatRoom(),p=g.player,e=Swarm.spawn(g,'sovereign',p.x+190,p.y);e.dummy=true;if(open){e.exposeAt=0;e.recoverUntil=2;}boltAt(g,e,'spear',50);return g.stats.spearDamage;};
  check(sample(true)>=sample(false)*1.99,'An exposed boss core rewards a charged rail with double damage');
  const g=combatRoom(),p=g.player,e=Swarm.spawn(g,'sovereign',p.x+190,p.y);p.inv=999;e.ready=0;e.born=-1;
  advance(g,7.5);const wall=g.hazards.find(h=>h.type==='sweep');
  check(wall&&e.ready>=wall.end,'Sovereign cannot layer a new attack over its moving corridor wall');
  check(Math.abs((wall.axis==='x'?p.y:p.x)-wall.gap)>wall.gapHalf,'A corridor wall must require a deliberate move rather than spawning its safe gap over a stationary player');
}
{
  const g=combatRoom(),p=g.player;g.charge=100;p.angle=Math.PI/2;
  const target=Swarm.spawn(g,'ram',p.x+160,p.y);target.dummy=true;Swarm.burst(g);
  check(g.shots[0].vy>0&&Math.abs(g.shots[0].vx)<.001,'Without pointer aim, Kamikaze uses the last manual facing and never selects an enemy');
}
{
  const g=combatRoom(),p=g.player;
  g.shots.push({x:p.x+180,y:p.y,vx:0,vy:0,hit:230,life:.001,pierce:0,kind:'burst',seen:[]});
  g.hostile.push({x:p.x+170,y:p.y,vx:0,vy:0,life:2,amount:11});
  g.hazards.push({type:'wave',x:p.x+180,y:p.y,start:0,fire:1,end:4,speed:174,width:15,gap:0,gapHalf:.6,source:'wave'});
  Swarm.step(g);check(!g.hostile.length&&g.hazards.length===1,'Payload clears hostile bullets without erasing a geometric attack');
}
{
  const g=combatRoom(),p=g.player,e=Swarm.spawn(g,'weaver',p.x+230,p.y);e.born=-1;e.ready=0;
  Swarm.step(g);const advise=Swarm.createAdvisor();advise(g);advance(g,.22);
  check(advise(g)?.reason==='interrupt','A Weaver must leave enough wind-up time for the guide to recommend a charged interrupt');
  g.hostile.push({x:p.x+50,y:p.y,vx:-200,vy:0,life:2});
  check(advise(g)?.mode==='ring','Imminent bullets retain priority over an optional interrupt');
  const empty=combatRoom('spear');empty.weapon.lock=1;check(!Swarm.createAdvisor()(empty),'An empty field does not produce a phantom hold-charge recommendation');
}
{
  for(const type of ['reaver','sovereign']){
    const g=combatRoom('spear'),p=g.player,boss=Swarm.spawn(g,type,p.x+230,p.y);
    boss.dummy=true;boss.attack='summon';boss.wind=g.t+.23;g.weapon.lock=.75;
    const hint=Swarm.createAdvisor()(g);
    check(hint?.mode==='ring'&&hint.reason==='volley','A boss summon warns about its radial volley before release, even during a nearly charged rail');
  }
  const g=combatRoom('spear'),p=g.player,boss=Swarm.spawn(g,'reaver',p.x+230,p.y);
  boss.dummy=true;boss.attack='spread';boss.wind=g.t+.8;g.weapon.lock=.8;
  const advise=Swarm.createAdvisor();advise(g);g.t+=.2;
  check(advise(g)?.reason==='finishCharge','An early volley warning still allows a rail that can finish with time to switch');
  boss.wind=g.t+.08;
  check(advise(g)?.reason==='volley','An imminent volley immediately replaces a stale hold-charge recommendation');
}
{
  const g=combatRoom('spear'),p=g.player,ram=Swarm.spawn(g,'ram',p.x+90,p.y);
  ram.dummy=true;ram.attack='charge';ram.wind=g.t+.3;ram.windAngle=Math.PI;g.weapon.lock=.95;
  check(Swarm.createAdvisor()(g)?.reason==='ramCharge','A ram on a collision course calls for an immediate sidestep rather than charging Spear');
  ram.y=p.y+90;
  const advise=Swarm.createAdvisor();advise(g);g.t+=.2;
  check(advise(g)?.reason!=='ramCharge','A committed ram passing beside the core does not produce a false collision warning');
  ram.y=p.y;ram.wind=g.t-.1;
  check(Swarm.createAdvisor()(g)?.reason==='ramCharge','The sidestep warning remains active during the committed charge');
}
{
  const cuts=moving=>{const g=combatRoom('blades'),p=g.player,cx=p.x,cy=p.y,e=Swarm.spawn(g,'sentry',p.x+70,p.y);e.hp=e.max=10000;e.dummy=true;
    for(let n=0;n<360;n++){p.x=cx;p.y=cy;e.x=cx+70;e.y=cy;Swarm.step(g,{x:moving?1:0,aim:{x:p.x+200,y:p.y},fire:true});}return 10000-e.hp;};
  check(cuts(true)>cuts(false)*1.4,'Spooling the rotor must increase actual cut rate, rather than losing damage to a fixed hit cooldown');
}
{
  const recovery=mode=>{const g=combatRoom(mode),p=g.player,e=Swarm.spawn(g,'reaver',p.x+90,p.y);g.nextFire=0;g.player.inv=99;g.weapon.spin=1;e.dummy=true;e.exposeAt=0;e.recoverUntil=1.5;advance(g,1.45,{aim:e});return e.max-e.hp;};
  check(recovery('blades')>recovery('spear')&&recovery('blades')>recovery('ring'),'Close blade passes must outperform the alternatives against the Reaver’s opened hinges');
}
check(Content.sectors.every(s=>s.bpm>=100&&s.bpm<=130),'All sectors define a shared visual, enemy, and music clock');
{
  const g=combatRoom('spear'),p=g.player;g.nextFire=0;
  const decoy=Swarm.spawn(g,'sentry',p.x+100,p.y+100);decoy.dummy=true;
  const caster=Swarm.spawn(g,'weaver',p.x+230,p.y);caster.dummy=true;caster.wind=2;caster.attack='weave';caster.hp=caster.max=1000;
  advance(g,.95,{aim:null,fire:true});check(g.shots.length===0&&g.weapon.lock===1&&p.angle===0,'Trigger without a supplied aim never selects a target');
  advance(g,.8,{aim:{x:p.x,y:p.y-220},fire:true});Swarm.step(g,{aim:{x:p.x,y:p.y-220},fire:false});
  check(g.shots[0].vy<0&&caster.hp===1000&&decoy.hp===decoy.max,'Manual rail can miss every visible enemy and never snaps toward a wind-up');
}
{
  const g=combatRoom('spear'),p=g.player,e=Swarm.spawn(g,'reaver',p.x+125,p.y);e.dummy=true;e.exposeAt=0;e.recoverUntil=2;
  g.weapon.lock=.9;const adviser=Swarm.createAdvisor();adviser(g);advance(g,.22);
  check(adviser(g)?.reason==='reaverOpen'&&adviser(g)?.mode==='blades','Reachable Reaver hinges override the generic core and hold-charge prompts');
  const dash=combatRoom(),r=Swarm.spawn(dash,'reaver',dash.player.x+170,dash.player.y);r.born=-1;r.ready=0;
  Swarm.step(dash);const expected=r.x+Math.cos(r.windAngle)*r.dashDistance;
  advance(dash,1.45);check(Swarm.exposed(dash,r)&&Math.abs(r.x-expected)<12&&r.recoverUntil-dash.t>1,'Reaver stops short of the locked point and leaves time to approach its hinge');
}
{
  const g=combatRoom(),p=g.player;g.nextFire=0;
  const e=Swarm.spawn(g,'sentry',p.x+120,p.y);e.dummy=true;
  advance(g,1,{aim:{x:p.x,y:p.y-200},fire:false});check(g.shots.length===0&&e.hp===e.max,'Pointer movement alone never fires Ring');
  advance(g,.4,{aim:{x:p.x,y:p.y-200},fire:true});check(g.shots.length>0&&g.shots.every(b=>b.vy<0)&&e.hp===e.max,'Ring follows a deliberate miss instead of aiming at an enemy');
}
{
  const g=combatRoom('blades'),p=g.player;g.nextFire=0;
  const e=Swarm.spawn(g,'skimmer',p.x+60,p.y);e.dummy=true;
  advance(g,.6,{aim:{x:p.x+200,y:p.y},fire:false});check(e.hp===e.max&&g.shots.length===0,'Blades cannot damage or shoot without the trigger');
  advance(g,.4,{aim:{x:p.x+200,y:p.y},fire:true});check(e.hp<e.max,'Holding the trigger engages deliberate blade damage');
}
{
  const g=combatRoom(),p=g.player;
  g.hazards.push({type:'wave',x:p.x-300,y:p.y,start:0,fire:1,end:3.55,speed:174,width:15,gap:Math.PI/2,gapHalf:.6,source:'wave'});
  const advise=Swarm.createAdvisor();advise(g);advance(g,.22);
  check(advise(g)?.reason==='wave','A reachable shock ring warns during wind-up, before its front is close');
  p.x=g.hazards[0].x;p.y=g.hazards[0].y+250;
  const safe=Swarm.createAdvisor();safe(g);advance(g,.22);
  check(safe(g)?.reason!=='wave','The shock ring does not tell a core already in the safe lane to evade');
}
{
  for(const mode of ['ring','spear','blades']){
    const g=combatRoom(mode),p=g.player;g.nextFire=0;
    const boss=Swarm.spawn(g,'sovereign',p.x+270,p.y);boss.dummy=true;
    for(let n=0;n<120;n++)Swarm.step(g,{});
    check(g.shots.length===0&&boss.hp===boss.max,'No-input '+mode+' cannot automatically aim or attack');
  }
}
{
  const g=combatRoom(),p=g.player;g.round=2;g.wave=4;g.bossSpawned=true;g.nextSpawn=0;p.inv=99;
  const boss=Swarm.spawn(g,'sovereign',p.x+240,p.y);boss.born=-1;boss.ready=0;
  for(let i=0;i<18*60;i++){Swarm.step(g);check(g.enemies.filter(e=>!e.boss&&e.hp>0).length<=4,'Sovereign summons and scheduled escorts share one four-enemy budget');}
}
report('Combat rules passed: manual capture release, no automatic aiming or firing, real blade arcs, eight core alternatives, enemy shields, interruptible tells, safe geometry gaps, and boss escort budgets.');

{
  const g=combatRoom('spear'),p=g.player;g.nextFire=0;
  advance(g,.8,{aim:null,fire:false});check(g.weapon.lock===1&&g.stats.railShots===0,'Rail assembles automatically without aim or held trigger and never self-fires');
  Swarm.setMode(g,'ring');advance(g,.5,{aim:null,fire:false});check(g.weapon.lock===1,'Changing formation stores a ready rail');Swarm.setMode(g,'spear');
  const aim={x:p.x,y:p.y-200};Swarm.step(g,{aim,fire:true});Swarm.step(g,{aim,fire:false});check(g.stats.railShots===1&&g.weapon.lock===0&&g.shots.every(b=>b.vy<0),'A quick manual release spends the assembled rail in the selected direction');
}

{
  const g=combatRoom(),p=g.player;g.drones=1;g.nextFire=0;const e=Swarm.spawn(g,'skimmer',p.x+120,p.y);e.dummy=true;
  advance(g,.3,{aim:e,fire:true});check(e.hp<=0&&g.kills===1,'One accurately aimed central Ring shot defeats a fresh Standard Skimmer');
  const fan=combatRoom();fan.drones=44;fan.nextFire=0;Swarm.step(fan,{aim:{x:fan.player.x+300,y:fan.player.y},fire:true});
  check(fan.shots.filter(b=>b.primary).length===1&&Math.abs(fan.shots.find(b=>b.primary).vy)<.001&&fan.shots.filter(b=>!b.primary).every(b=>b.hit===16),'Additional Ring emitters preserve one true center skill shot and weaker wings');
}
