// End-to-end through the offline bundle: no health or phase injection.
const createReal=Swarm.create;
Swarm.create=(seed,options)=>createReal(42,options);

function fly(kind,limit){
  const pilot=createPilot();
  click(dom[kind]);if(kind==='campaign')click(dom.mapDeploy);
  pad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false}))};
  let lastAim=false,sectors=0,sawGuide=false,sawBoss=false,sawSweep=false;
  for(let i=0;i<limit*60&&dom.game.dataset.page!=='debrief';i++){
    if(dom.game.dataset.page==='draft'){
      sectors++;
      const choice=chooseModule(game),index=game.draft.indexOf(choice);
      click(dom.upgradeList.children[index<0?0:index]);
      if(kind==='campaign'&&sectors===1){view.width=430;view.height=870;observer();}
      if(kind==='campaign'&&sectors===2){view.width=1920;view.height=1080;observer();}
    }
    if(dom.game.dataset.page==='map')click(dom.mapDeploy);
    const input=pilot(game),size=Math.max(1,Math.hypot(input.x,input.y));
    const x=input.x/size,y=input.y/size,length=Math.hypot(x,y);
    const out=length?(.20+.80*length)/length:0;
    pad.axes[0]=x*out;pad.axes[1]=y*out;pad.buttons[7].pressed=input.fire;
    if(input.aim){
      lastAim=true;dom.canvas.send('pointermove',{pointerType:'mouse',clientX:(input.aim.x-FlightRender.camera(game).x)/FlightRender.camera(game).w*view.width,clientY:(input.aim.y-FlightRender.camera(game).y)/FlightRender.camera(game).h*view.height});
    }else if(lastAim){dom.canvas.send('pointerleave',{pointerType:'mouse'});lastAim=false;}
    if(game.mode!==input.mode)key(String(Swarm.modes.indexOf(input.mode)+1));
    if(input.burst)key(' ');
    frames(1);
    if(!dom.tactical.hidden)sawGuide=true;
    if(!dom.boss.hidden)sawBoss=true;
    if(!dom.announcement.hidden&&dom.announceLabel.textContent==='SECTOR SECURED')sawSweep=true;
  }
  pad=null;
  assert(game.phase==='won'&&game.stats.sectors===5&&sectors===(kind==='campaign'?19:4),'Play full '+kind+' through packaged controls to victory');
  assert(sawGuide&&sawBoss&&sawSweep,'Full flight renders advice, boss state, and sector clear');
  assert(JSON.parse(storage.get('swarmwar.records.v2'))[kind].standard.score===game.score,'Full flight writes its own score');
}
frames(2);
fly('campaign',1800);
assert(dom.debriefTitle.textContent==='ARRAY LIBERATED'&&!dom.earned.hidden,'Campaign debrief and flight badges appear');
report('Full client campaign: '+Math.round(game.t)+'s, 20 waves, 5 guardians, 19 upgrades, two viewport changes, '+game.score+' points.');
click(dom.return);
assert(!dom.rush.hidden,'Campaign clear unlocks Boss Rush');
fly('rush',900);
assert(dom.debriefTitle.textContent==='FIVE GUARDIANS DOWN'&&dom.earned.textContent.includes('Boss Hunter'),'Rush debrief saves its own achievement');
assert(JSON.parse(storage.get('swarmwar.records.v2')).rush.standard.fastest===game.t,'Boss Rush saves a clear time');
report('Full client Boss Rush: '+Math.round(game.t)+'s, five guardians, no waves.');
