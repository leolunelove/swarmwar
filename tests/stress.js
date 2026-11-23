// Accelerated long-run soak. Keep the core alive so later encounters are exercised.
const g=Swarm.create(97321,{kind:'endless',protocol:'overclock'}),pilot=createPilot();
const layouts=[[1600,900],[390,844],[2560,1080],[844,390],[1024,768]];
const max={enemies:0,shots:0,hostile:0,fx:0,hazards:0,salvage:0,fields:0,echoes:0,events:0};
const cap={enemies:46,shots:90,hostile:340,fx:1500,hazards:9,salvage:300,fields:6,echoes:64,events:1600};
let layout=0,oversized=0;
for(let frame=0;frame<60*60*60;frame++){
  if(g.phase==='draft'){
    const id=g.draft.includes('foundry')?'foundry':chooseModule(g);
    Swarm.choose(g,id);
  }
  if(g.phase==='transit')Swarm.depart(g);
  if(frame%4200===0)Swarm.resize(g,Swarm.worldSize(...layouts[layout++%layouts.length]));
  g.player.hp=g.player.max;g.player.inv=1;
  Swarm.step(g,pilot(g));
  for(const k of Object.keys(max)){
    max[k]=Math.max(max[k],g[k].length);
    if(g[k].length>cap[k])throw new Error(k+' exceeded its bound: '+g[k].length);
  }
  for(const o of [g.player,...g.enemies,...g.hostile,...g.shots,...g.hazards,...g.fields,...g.echoes])
    if(!Number.isFinite(o.x)||!Number.isFinite(o.y))throw new Error('Invalid position at '+g.t);
  if(g.drones>Swarm.capacity(g))oversized++;
}
if(g.stats.sectors<12||oversized)throw new Error('Long-run progression failed: '+g.stats.sectors+' sectors');
const log=typeof print==='function'?print:console.log;
log('Endless soak: '+Math.round(g.t)+' simulated seconds, '+g.stats.sectors+' sectors, '+layout+' resizes; max '+JSON.stringify(max));
