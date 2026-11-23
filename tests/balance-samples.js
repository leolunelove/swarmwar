// Both strategies use the same generic module policy, not an optimized build search.
// Optional diagnostic samples; these are controller results, not human win rates.
const sampleLog=typeof print==='function'?print:console.log;
for(const mode of ['adaptive','ring'])for(const seed of [4,42,73,315]){
 const g=Swarm.create(seed),pilot=createPilot();let input={};
 for(let frame=0;frame<1800*60&&['playing','draft','transit'].includes(g.phase);frame++){
  if(g.phase==='draft'){Swarm.choose(g,chooseModule(g));continue;}
  if(g.phase==='transit'){Swarm.depart(g);continue;}
  if(frame%13===0){input=pilot(g);if(mode==='ring')input={...input,mode:'ring',fire:true};}
  Swarm.step(g,input);
 }
 sampleLog(JSON.stringify({mode,seed,result:g.phase,time:Math.round(g.t),hits:g.stats.hits,sectors:g.stats.sectors,cores:Object.keys(g.upgrades).filter(id=>Content.upgrades[id].slot)}));
}
for(const protocol of ['scout','overclock']){const {g}=autopilot(42,{protocol},1800);sampleLog(JSON.stringify({protocol,result:g.phase,time:Math.round(g.t),hits:g.stats.hits,sectors:g.stats.sectors}));}
