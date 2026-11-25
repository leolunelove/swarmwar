const check=(ok,message)=>{if(!ok)throw new Error(message);};
const advance=(g,seconds,input={})=>{for(let n=0;n<seconds*60;n++)Swarm.step(g,{aim:g.aim||{x:g.player.x+300,y:g.player.y},fire:g.mode!=='spear'||g.weapon.lock>=.999&&!g.weapon.held,...input});};
function arena(mode){
  const g=Swarm.create(71);
  g.unlocked=3;g.drones=44;g.salvage=[];g.nextSpawn=Infinity;g.player.inv=0;g.player.angle=0;
  Swarm.setMode(g,mode);
  return g;
}
const modes=['ring','spear','blades'];
const pack=modes.map(mode=>{
  const g=arena(mode),p=g.player;
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,e=Swarm.spawn(g,'skimmer',p.x+Math.cos(a)*66,p.y+Math.sin(a)*66);
    e.dummy=true;
  }
  advance(g,.37);
  return {mode,kills:g.kills,damage:g.stats.bladeDamage,cut:g.cues.includes('cut')};
});
check(pack[2].kills===6&&pack[2].kills>pack[0].kills&&pack[2].kills>pack[1].kills&&pack[2].cut,
  'Blades must clear a surrounding pack faster and report a distinct cutting hit');
const armor=modes.map(mode=>{
  const g=arena(mode),p=g.player;
  for(let i=0;i<3;i++){
    const e=Swarm.spawn(g,'ram',p.x+150+i*61,p.y);e.dummy=true;
  }
  advance(g,1.10,{aim:{x:p.x+300,y:p.y}});
  return {mode,kills:g.kills,pierces:g.stats.pierceHits};
});
check(armor[1].kills===3&&armor[1].kills>armor[0].kills&&armor[1].kills>armor[2].kills&&armor[1].pierces>=3,
  'Spear must pierce an armored line faster than either alternative');
const volley=modes.map(mode=>{
  const g=arena(mode),p=g.player;
  for(let i=0;i<3;i++)g.hostile.push({x:p.x+96+i*28,y:p.y,vx:-160,vy:0,life:3,amount:11});
  advance(g,1.1);
  return {mode,hp:g.player.hp,blocked:g.stats.blocks};
});
check(volley[0].hp===100&&volley[0].blocked===3&&volley[1].hp<100&&volley[2].hp<100,
  'Ring must protect against a staggered volley that hits the other formations');
{
  const g=arena('spear'),p=g.player;
  Swarm.step(g,{aim:{x:p.x-200,y:p.y}});
  check(Math.abs(Math.abs(p.angle)-Math.PI)<.01&&g.shots.length===0,'Pointer aim turns the spear directly without firing or seeking a target');
}
{
  const g=arena('ring'),p=g.player;
  g.round=1;g.wave=Content.sectors[1].waves.length-1;g.waveStart=-60;g.nextSpawn=0;
  Swarm.spawn(g,'sentry',p.x+180,p.y);
  g.hostile.push({x:p.x+60,y:p.y,vx:-100,vy:0,life:2});
  Swarm.step(g);advance(g,2.7,{fire:false});
  check(g.bossSpawned&&g.enemies.length===1&&g.enemies[0].boss&&g.hostile.length===0&&p.inv>0,
    'Boss entrance must clear leftover combat and give a short readable phase break');
  check(Math.abs(g.enemies[0].y-p.y)<=151,'The boss should arrive near the fight instead of offscreen');
}
{
  const g=arena('ring');
  g.nextFire=Infinity;
  const e=Swarm.spawn(g,'reaver',g.player.x,g.player.y-150);
  e.born=-1;e.ready=0;
  advance(g,1.1);
  check(e.dashUntil>g.t&&e.ready>=e.recoverUntil,
    'Reaver may not queue another attack inside its recovery window');
}
const report=typeof print==='function'?print:console.log;
report('Formation matchups passed: surrounding pack, armored line, incoming volley, turn commitment, and boss phase recovery.');
