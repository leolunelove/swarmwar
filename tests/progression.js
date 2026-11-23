// Fabrication pacing, choice diversity, evolutions and wave checkpoint regressions.
{
  const g=quiet();
  atPlayer(g,1);step(g);assert(g.drones===1&&g.parts===1,'A single part no longer creates a whole drone');
  atPlayer(g,1);step(g);assert(g.drones===2&&g.parts===0,'Two early parts fabricate a drone');
  atPlayer(g,100);step(g);assert(g.drones===12&&Swarm.capacity(g)===12,'The first wave cannot jump straight to a huge swarm');
  g.t=34;step(g);assert(g.phase==='draft'&&g.draftReason==='wave','First wave offers a build choice');
  const original=g.draft.slice();assert(Swarm.reroll(g),'One sector reroute is available');
  assert(!g.draft.some(id=>original.includes(id))&&!Swarm.reroll(g),'Reroute offers three fresh choices and cannot be spammed');
  choose(g,g.draft[0]);assert(g.round===0&&g.wave===1&&Swarm.capacity(g)>=21,'Wave choices advance the wave and expand fabrication');
  const save=Swarm.checkpoint(g),copy=Swarm.restore(JSON.parse(JSON.stringify(save)),{w:W,h:H});
  assert(save.version===3&&save.wave===1&&copy.wave===1&&copy.parts===g.parts&&copy.rerolls===0,'Wave checkpoint preserves parts and used reroutes');
  assert(copy.drones===g.drones&&copy.player.hp===g.player.hp,'Wave resume never duplicates salvage or healing');
  ticks(g,8);ticks(copy,8);
  assert(JSON.stringify(g.enemies)===JSON.stringify(copy.enemies),'Wave checkpoint keeps encounter randomness deterministic');
}
{
  const g=quiet(),p=g.player;g.drones=20;g.nextFire=1000;g.upgrades.echoGuard=1;g.upgrades.bastion=1;
  const e=spawn(g,'ram',p.x+90,p.y);e.dummy=true;
  g.hostile.push({x:p.x+43,y:p.y,vx:-200,vy:0,life:2});step(g);
  assert(g.stats.blocks===1&&e.hp<e.max,'Echo Shield turns a successful block into damage');
}
{
  const g=quiet(),p=g.player;g.unlocked=3;g.drones=25;g.nextFire=1000;g.upgrades.rotor=1;g.upgrades.siphon=1;p.hp=70;
  for(let i=0;i<3;i++){const e=spawn(g,'skimmer',p.x+50+i,p.y);e.hp=1;e.dummy=true;}
  setMode(g,'blades');step(g,{aim:{x:p.x+200,y:p.y},fire:true});assert(g.stats.bladeKills===3&&p.hp===72,'Vampire Rotor repairs on every third melee kill');
}
{
  const g=quiet(),p=g.player;g.unlocked=3;g.drones=30;g.nextFire=1000;g.upgrades.lance=1;g.upgrades.forkLance=1;p.angle=0;
  const e=spawn(g,'ram',p.x+40,p.y);e.dummy=true;e.hp=1;
  g.shots.push({x:e.x-6,y:e.y,vx:360,vy:0,life:.4,hit:80,pierce:0,kind:'spear',seen:[]});step(g);
  assert(g.shots.filter(b=>b.kind==='shard').length===2,'A Spear kill launches exactly two shards');
  const target=spawn(g,'skimmer',p.x+90,p.y+20);target.hp=1;target.dummy=true;
  const shard=g.shots.find(b=>b.kind==='shard');shard.x=target.x;shard.y=target.y;shard.vx=shard.vy=0;
  step(g);assert(g.kills===2&&g.shots.filter(b=>b.kind==='shard').length<=2,'Shard kills never recursively fork');
}
{
  const g=quiet(),p=g.player;g.drones=8;g.nextFire=1000;g.upgrades.afterburn=1;g.upgrades.recycler=1;
  const e=spawn(g,'ram',p.x+180,p.y);e.dummy=true;e.hp=260;
  g.shots.push({x:e.x,y:e.y,vx:0,vy:0,life:.1,hit:230,pierce:0,kind:'burst',seen:[]});step(g);
  assert(e.hp===30&&g.echoes.length===1,'Kamikaze schedules its delayed second blast');
  ticks(g,.4);assert(g.kills===1&&g.echoes.length===0&&g.parts===1,'Afterburn kills once and Recycler banks its part');
}
{
  const g=quiet();g.unlocked=3;g.upgrades.conductor=1;g.nextFire=1000;
  setMode(g,'spear');const n=g.shots.length;setMode(g,'blades');
  assert(n===0&&g.shots.length===0&&g.weapon.conductor,'Switching primes Conductor without automatic shooting');g.nextFire=0;step(g,{aim:{x:g.player.x+200,y:g.player.y},fire:true});assert(g.shots.length>=5&&!g.weapon.conductor,'Conductor releases only with an aimed manual shot');ticks(g,3.1,{fire:false});setMode(g,'ring');assert(g.weapon.conductor,'Conductor recharges after three seconds');
}
{
  const builds=new Set(),routes=new Set();
  for(let seed=1;seed<=8;seed++){
    const g=create(seed);g.nextSpawn=1000;g.salvage=[];
    routes.add([0,1,2].map(round=>Swarm.variant({...g,round}).id).join('/'));
    for(let wave=0;wave<3;wave++){
      g.wave=wave;g.waveStart=g.t-100;g.nextSpawn=g.t+1000;step(g);
      assert(g.draft.every(id=>!Content.upgrades[id].requires||g.upgrades[Content.upgrades[id].requires]),'Evolution requires its base module');
      choose(g,g.draft[seed%g.draft.length]);
    }
    builds.add(JSON.stringify(g.upgrades));
  }
  assert(builds.size>=5&&routes.size>=4,'Seeds produce varied builds and independent sector routes');
}
{
  const g=quiet();g.unlocked=3;g.upgrades.rotor=1;
  g.t=35;step(g);const previous=g.draft.slice();choose(g,g.draft[0]);
  g.wave=2;g.waveStart=g.t-100;g.nextSpawn=g.t+1000;g.player.hp=20;step(g);
  assert(g.draft.some(id=>id==='nanites'||id==='plating'),'A struggling campaign build receives a concrete repair choice');
  assert(new Set(g.draft).size===g.draft.length&&g.draft.every(id=>!previous.includes(id)||['nanites','plating'].includes(id)),'Ordinary drafts avoid repeated offers while allowing a needed repair choice');
  const selected=g.draft[0];choose(g,selected);const saved=Swarm.checkpoint(g),copy=Swarm.retryCheckpoint(saved,{w:W,h:H});
  assert(copy.retries===1&&copy.wave===g.wave&&copy.player.hp>=65&&copy.score===Math.floor(g.score*.8),'Retry preserves build and wave with explicit hull recovery and score cost');
  assert(JSON.stringify(saved)===JSON.stringify(Swarm.checkpoint(g)),'Retry cannot mutate the saved snapshot');
  const again=Swarm.restore(Swarm.checkpoint(copy),{w:W,h:H});again.phase='won';
  assert(again.retries===1&&Swarm.rank(again)==='R','Retry count survives save and resume and marks the final rank');
}
log('Progression passed: gradual fabrication, fresh drafts and reroutes, behavior modules, wave saves, assisted retries, varied builds and sector routes.');

{
  const original=quiet();original.round=2;original.wave=1;original.t=80;original.waveStart=80;original.stats.sectors=2;
  const legacy={...Swarm.checkpoint(original),version:2};delete legacy.sectorId;
  const migrated=Swarm.restore(legacy,{w:W,h:H});
  assert(migrated.round===4&&migrated.legacyRun&&migrated.stats.sectors===2,'Old Core checkpoint keeps its sector and real cleared count');
  migrated.phase='won';assert(Swarm.rank(migrated)===null&&Swarm.earnedBadges(migrated).length===0,'A legacy clear cannot claim a new five-chapter rank or badge');
}
{
  for(let chapter=0;chapter<5;chapter++){
    const g=Swarm.create(7,{kind:'sortie',chapter}),p=g.player;p.inv=10000;g.nextSpawn=Infinity;
    for(let wave=0;wave<4;wave++){
      g.waveStart=g.t-Swarm.waveDuration(g)-.1;Swarm.step(g,{fire:false});
      if(wave<3){assert(g.phase==='draft'&&g.wave===wave,'Every chapter phase ends in a single draft');Swarm.choose(g,g.draft[0]||'continue');assert(g.wave===wave+1&&g.phase==='playing','Draft advances exactly one phase');}
    }
    assert(g.wave===4&&!g.bossSpawned,'Fifth phase begins with a distinct arrival break');
    for(let n=0;n<165;n++)Swarm.step(g,{fire:false});
    assert(g.bossSpawned&&g.enemies.some(e=>e.boss),'Every chapter reaches its playable guardian');
  }
}
