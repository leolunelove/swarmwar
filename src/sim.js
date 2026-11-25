const Swarm=(()=>{
  const W=920,H=560,TAU=Math.PI*2;
  const modes=['ring','spear','blades'];
  const {sectors,enemy,difficulty,upgrades}=Content;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const d2=(x,y,xx,yy)=>(x-xx)**2+(y-yy)**2;
  const angle=(x,y,xx,yy)=>Math.atan2(yy-y,xx-x);
  const level=(g,id)=>g.upgrades[id]||0;
  const capacity=g=>(g.kind==='campaign'?12+9*Math.min(19,g.round*4+Math.min(3,g.wave)):Math.min(150,65+35*g.round))+18*level(g,'foundry');
  const fabricationCost=g=>Math.max(1,(g.drones<16?2:g.drones<48?3:4)-Math.min(1,level(g,'foundry')));
  const variant=g=>{const list=sector(g).variants;let n=(g.seed^Math.imul(g.round+1,0x9e3779b9))>>>0;n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);return list[((n^(n>>>16))>>>0)%list.length];};

  const freshWeapon=()=>({guard:0,lock:0,spin:0,phase:0,guardFlash:0,railFlash:0,held:false,conductor:false});
  const chargeDuration=g=>level(g,'siege')?1.02:level(g,'arc')?.78:.62;
  const beatLength=g=>60/sector(g).bpm;
  const beatAt=(g,time,division=1)=>g.sectorStart+Math.ceil((time-g.sectorStart)/(beatLength(g)/division)-1e-8)*(beatLength(g)/division);
  const beatPhase=g=>((g.t-g.sectorStart)/beatLength(g))%1;
  const angularDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
  function bladeContact(g,e,pad=0){
    const p=g.player,r=Math.hypot(e.x-p.x,e.y-p.y);
    if(r>bladeRadius(g)+e.r*.6+pad)return false;
    if(r<24+e.r*.3)return true;
    const a=angle(p.x,p.y,e.x,e.y),width=.26+Math.asin(Math.min(.70,(e.r+pad)/r));
    for(let arm=0;arm<3;arm++)if(angularDistance(a,g.weapon.phase+arm*TAU/3)<width)return true;
    return false;
  }
  function addField(g,type,x,y,radius,duration){
    const existing=g.fields.find(f=>f.type===type&&d2(f.x,f.y,x,y)<40**2);
    if(existing){existing.end=g.t+duration;return;}
    if(g.fields.length>=6)g.fields.shift();
    g.fields.push({type,x,y,radius,start:g.t,end:g.t+duration});
  }
  function slowFactor(g,o,projectile=false){
    let slow=o.slowUntil>g.t?.70:1;
    for(const f of g.fields)if(g.t<f.end&&d2(o.x,o.y,f.x,f.y)<f.radius*f.radius){
      if(f.type==='cryo')slow=Math.min(slow,projectile?.48:o.boss?.70:.40);
      else if(!projectile)slow=Math.min(slow,o.boss?.82:.58);
    }
    return slow;
  }
  function alliedBolt(g,x,y,a,speed,hit,kind='ally',pierce=0,life=.8){
    if(g.shots.length>=90)return;
    const bolt={x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life,hit,pierce,kind,seen:[]};g.shots.push(bolt);return bolt;
  }
  function guardResponse(g,b){
    const p=g.player,w=g.weapon;
    w.guard++;g.stats.captured++;
    w.guard=Math.min(3,w.guard);w.guardFlash=g.t+.18;
    if(level(g,'gravity'))addField(g,'gravity',b.x,b.y,83,2.2);
    cue(g,'guard');
  }

  function updateWeapon(g,input,dt){
    const w=g.weapon,p=g.player,moving=Math.hypot(input.x||0,input.y||0)>.16;
    const held=input.fire===true&&!!g.aim, released=input.release===true||w.held&&!held;
    w.spin=clamp(w.spin+(g.mode==='blades'&&held&&moving?dt*.85:-dt*.38),0,1);
    if(g.mode==='blades')w.phase+=dt*(2.7+w.spin*2.2)*(level(g,'vortex')?1.15:1);
    if(g.mode==='spear'){
      // Assembly is automatic; only an intentional trigger release can launch it.
      w.lock=clamp(w.lock+dt/chargeDuration(g),0,1);
      if(released){
        if(w.lock>=.25&&g.t>=g.nextFire&&fire(g)){w.railFlash=g.t+.18;g.nextFire=g.t+.16;g.stats.railShots++;w.lock=0;}
      }
    }else{
      if(held&&g.t>=g.nextFire&&(g.kind!=='training'||g.training.index!==0)){
        g.nextFire=g.t+(g.mode==='blades'?.52:level(g,'mirror')?.54:.35);fire(g);
      }
    }
    w.held=held;
    if(g.mode!=='blades'||!held)return;
    for(const e of g.enemies.slice())if(e.hp>0&&bladeContact(g,e)){
      // One contact per arm per pass. A time cooldown would make slow, wide sweeps
      // hit twice and could perversely reduce damage when the rotor spins faster.
      const r=Math.hypot(e.x-p.x,e.y-p.y),raw=angle(p.x,p.y,e.x,e.y);
      e.bladeAngle=e.bladeAngle===undefined?raw:e.bladeAngle+Math.atan2(Math.sin(raw-e.bladeAngle),Math.cos(raw-e.bladeAngle));
      const width=.26+Math.asin(Math.min(.70,e.r/Math.max(1,r)));
      e.cutPasses??=[null,null,null];let contact=false;
      for(let arm=0;arm<3;arm++){
        const phase=w.phase+arm*TAU/3,pass=Math.floor((phase-e.bladeAngle+Math.PI)/TAU);
        if((r<24+e.r*.3||angularDistance(phase,raw)<width)&&e.cutPasses[arm]!==pass){e.cutPasses[arm]=pass;contact=true;break;}
      }
      if(!contact)continue;
      let cut=e.type==='reaver'&&exposed(g,e)?220+level(g,'rotor')*28+Math.min(40,g.drones*.25):
        e.armored?12+level(g,'rotor')*3:39+Math.min(30,g.drones*.65)+level(g,'rotor')*9;
      if(level(g,'longOrbit'))cut*=.72;
      if(level(g,'vortex')){cut*=1.25;e.slowUntil=g.t+.6;}
      damage(g,e,cut,'blade');
    }
  }

  function rng(seed){
    let n=seed>>>0||1;
    const next=()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296;};
    next.state=()=>n>>>0;return next;
  }
  function emit(g,id,data={}){
    if(g.events.length>=1600)g.events.shift();
    g.events.push({...data,id,t:g.t});
  }
  function cue(g,id){if(g.cues.length<96)g.cues.push(id);}
  function tip(g,id,duration=4){g.tip={id,until:g.t+duration};}
  function signal(g,id,duration=2.6){g.banner={id,until:g.t+duration};cue(g,'wave');}
  function worldSize(width,height){
    const aspect=Math.max(1,width)/Math.max(1,height);
    return aspect<.86?{w:460,h:460/aspect}:{w:560*aspect,h:560};
  }
  function resize(g,{w,h}){
    if(w===g.w&&h===g.h)return;
    const sx=w/g.w,sy=h/g.h;
    for(const o of [g.player,...g.enemies,...g.shots,...g.hostile,...g.salvage,...g.fx,...g.hazards,...g.echoes,...g.fields]){
      o.x*=sx;o.y*=sy;
      if(o.type==='sweep')o.gap*=o.axis==='x'?sy:sx;
      if(o.type==='wave')o.gap=Math.atan2(Math.sin(o.gap)*sy,Math.cos(o.gap)*sx);
      if(o.endX!==undefined){o.endX*=sx;o.endY*=sy;}
      if(o.vx!==undefined){
        const speed=Math.hypot(o.vx,o.vy),a=Math.atan2(o.vy*sy,o.vx*sx);
        o.vx=Math.cos(a)*speed;o.vy=Math.sin(a)*speed;
      }
      for(const key of ['angle','windAngle','dashAngle'])if(o[key]!==undefined){
        o[key]=Math.atan2(Math.sin(o[key])*sy,Math.cos(o[key])*sx);
      }
    }
    g.w=w;g.h=h;g.aim=null;
  }

  function create(seed=1,options={}){
    seed=seed>>>0;
    const kind=['campaign','endless','training','rush','sortie'].includes(options.kind)?options.kind:'campaign';
    const protocol=Object.hasOwn(difficulty,options.protocol)?options.protocol:'standard';
    const {w=W,h=H}=options.bounds||{};
    const g={
      seed,kind,protocol,rules:difficulty[protocol],w,h,t:0,round:0,wave:0,sectorStart:0,waveStart:0,retries:0,recentOffers:[],
      phase:'playing',player:{x:w/2,y:h/2,hp:100,max:100,angle:-Math.PI/2,inv:0},
      rand:rng(seed),loot:rng((seed^0x7b8bc0a3)>>>0),visual:rng((seed^0x2717d5)>>>0),
      enemies:[],shots:[],hostile:[],salvage:[],fx:[],hazards:[],events:[],cues:[],
      kills:0,score:0,chain:0,chainUntil:0,drones:1,peak:1,parts:0,charge:0,mode:'ring',unlocked:1,repair:false,relay:false,
      upgrades:{},draft:[],draftReason:'sector',weapon:freshWeapon(),fields:[],seenTypes:{},echoes:[],nextConductor:0,nextEchoGuard:0,stats:{captured:0,counterSalvos:0,railShots:0,interrupts:0,shieldBreaks:0,collected:0,sectors:0,switches:0,blocks:0,pierceHits:0,bladeKills:0,bursts:0,burstHits:0,hits:0,bestChain:0,ringDamage:0,spearDamage:0,bladeDamage:0,burstDamage:0},
      nextFire:.18,nextBlade:0,nextRepair:0,nextBlock:0,shieldFlash:0,hurtFlash:0,aim:null
    };
    emit(g,'run_started',{kind,protocol,seed});
    if(kind==='training'){g.training={index:0};startDrill(g);}
    else {if(kind==='sortie'){g.round=clamp(Math.floor(options.chapter||0),0,sectors.length-1);g.drones=g.peak=24+g.round*10;g.unlocked=3;g.upgrades={bastion:1,lance:1,rotor:1};g.charge=100;}startSector(g,kind!=='sortie');}
    return g;
  }
  const sector=g=>sectors[g.round%sectors.length];
  function startSector(g,reward=true){
    const p=g.player;
    g.phase='playing';g.weapon=freshWeapon();g.fields.length=0;g.rerolls=1;g.sectorStart=g.t;g.waveStart=g.t;g.wave=g.kind==='rush'?sector(g).waves.length:0;g.groupIndex=0;
    g.nextSpawn=g.t+1.1;g.nextField=g.t+14;g.nextFire=g.t+.18;g.nextBlock=g.t;g.nextBlade=g.t;g.nextRepair=g.t+1;
    g.hurtFlash=0;g.shieldFlash=0;g.tip=null;g.chain=0;g.chainUntil=0;g.bossSpawned=false;g.bossArrival=0;g.bossDefeated=false;g.clearAt=0;
    g.enemies.length=g.shots.length=g.hostile.length=g.salvage.length=g.hazards.length=g.fx.length=g.echoes.length=0;
    p.x=g.w/2;p.y=g.h/2;p.angle=-Math.PI/2;p.inv=.9;g.aim=null;
    if(g.round>0&&reward){p.hp=Math.min(p.max,p.hp+32);g.drones=Math.min(capacity(g),g.drones+5);g.peak=Math.max(g.peak,g.drones);}
    else if(g.round===0&&reward){
      if(g.kind==='rush'){g.drones=g.peak=44;g.unlocked=3;g.charge=100;g.relay=g.repair=true;g.burstTaught=true;}
      else drop(g,p.x+112,p.y+16,3);
    }
    signal(g,'sector');
    if(g.round===0&&g.kind!=='rush')tip(g,'move',6);
    emit(g,'sector_started',{round:g.round+1,sector:sector(g).id});
    if(g.kind!=='rush')emit(g,'wave_started',{round:g.round+1,wave:1});
  }
  function finish(g,result){
    g.phase=result;emit(g,'run_finished',{result,score:g.score,kills:g.kills,peak:g.peak,cleared:g.stats.sectors});cue(g,result);
  }
  function rank(g){
    if(g.kind!=='campaign'||g.phase!=='won'||g.legacyRun)return null;
    return g.retries?'R':g.stats.hits<=10&&g.player.hp>=70?'S':g.stats.hits<=21?'A':g.stats.hits<=35?'B':'C';
  }
  function clearSector(g){
    g.stats.sectors++;
    const clearBonus=900+(g.round+1)*300+Math.round(g.player.hp*8);
    g.score+=clearBonus;
    emit(g,'sector_cleared',{round:g.round+1,clearBonus});
    if(g.kind==='sortie'||(g.kind==='campaign'||g.kind==='rush')&&g.round===sectors.length-1){finish(g,'won');return;}
    g.phase='draft';g.draftReason='sector';g.draft=draft(g);cue(g,'clear');
  }
  function draft(g,exclude=[]){
    let available=Object.keys(upgrades).filter(id=>level(g,id)<upgrades[id].max&&(!upgrades[id].requires||level(g,upgrades[id].requires)>0)&&(!upgrades[id].slot||!Object.keys(g.upgrades).some(other=>other!==id&&upgrades[other]?.slot===upgrades[id].slot)));
    const fresh=available.filter(id=>!exclude.includes(id));if(fresh.length>=3)available=fresh;
    const pick=list=>list.length?list[Math.floor(g.loot()*list.length)]:null;
    const offered=list=>{g.recentOffers=list.filter(Boolean);return g.recentOffers.slice();};
    const sustain=available.filter(id=>['nanites','plating'].includes(id));
    const needsRepair=g.player.hp<g.player.max*.55;
    const corePairs=available.filter(id=>upgrades[id].slot).filter(id=>available.some(other=>other!==id&&upgrades[other].slot===upgrades[id].slot));
    if(g.wave===1&&corePairs.length){
      const first=corePairs.find(id=>upgrades[id].group===g.mode)||corePairs[Math.floor(g.loot()*corePairs.length)];
      const second=corePairs.find(id=>id!==first&&upgrades[id].slot===upgrades[first].slot);
      const rest=available.filter(id=>id!==first&&id!==second);
      return offered([first,second,pick(needsRepair&&sustain.length?sustain:rest)]);
    }
    const unseen=available.filter(id=>!g.recentOffers.includes(id));if(unseen.length>=3)available=unseen;
    // Eligible evolutions compete with the active formation, leaving two wildcards for a different build.
    const evolution=available.filter(id=>upgrades[id].requires);
    const specialist=available.filter(id=>upgrades[id].group===g.mode);
    const first=pick(evolution.length?evolution:specialist.length?specialist:available);
    const remaining=available.filter(id=>id!==first);
    const second=(needsRepair?pick(sustain.filter(id=>id!==first)):null)||pick(remaining.filter(id=>upgrades[id].group==='all'))||pick(remaining);
    const third=pick(remaining.filter(id=>id!==second));
    return offered([first,second,third]);
  }
  function reroll(g){
    if(g.phase!=='draft'||!g.rerolls||!g.draft.length)return false;
    g.draft=draft(g,g.draft);
    g.rerolls--;emit(g,'draft_rerolled');return true;
  }
  function prepareWave(g){
    g.phase='playing';g.weapon=freshWeapon();g.fields.length=0;g.waveStart=g.t;g.groupIndex=0;g.nextSpawn=g.t+1.25;g.nextField=g.t+10;
    g.nextFire=g.t+.18;g.nextBlade=g.t;g.nextBlock=g.t;g.nextRepair=g.t+1;
    g.nextConductor=g.nextEchoGuard=g.t;g.chain=0;g.chainUntil=0;g.shieldFlash=g.hurtFlash=0;g.aim=null;
    const p=g.player;p.x=g.w/2;p.y=g.h/2;p.angle=-Math.PI/2;p.inv=.9;
    g.enemies.length=g.hostile.length=g.shots.length=g.hazards.length=g.echoes.length=g.fx.length=0;
  }
  function nextWave(g){
    g.wave++;prepareWave(g);g.player.hp=Math.min(g.player.max,g.player.hp+6);
    // Uncollected wreckage is banked at a wave break so the draft never erases earned growth.
    for(const part of g.salvage)collect(g);
    g.salvage.length=0;
    if(g.round===0){if(g.wave===1)unlock(g,2);if(g.wave===2)unlock(g,3);}
    signal(g,'wave');emit(g,'wave_started',{round:g.round+1,wave:g.wave+1});
  }
  function choose(g,id){
    if(g.phase!=='draft'||(g.draft.length?!g.draft.includes(id):id!=='continue'))return false;
    if(id!=='continue'){
      const def=upgrades[id];
      if(def?.slot&&Object.keys(g.upgrades).some(other=>other!==id&&upgrades[other]?.slot===def.slot))return false;
      g.upgrades[id]=level(g,id)+1;emit(g,'upgrade_chosen',{upgrade:id,level:g.upgrades[id]});
      if(id==='plating'){g.player.max+=22;g.player.hp+=22;}
      if(id==='foundry'){g.parts+=3;fabricate(g);}
      if(id==='nanites')g.nextRepair=g.t+1;
    }
    if(g.draftReason==='wave')nextWave(g);else{const bank=g.salvage.length;g.round++;startSector(g);for(let i=0;i<bank;i++)collect(g);g.phase='transit';emit(g,'route_ready',{round:g.round+1});}
    return true;
  }

  function depart(g){if(g.phase!=='transit')return false;g.phase='playing';signal(g,'sector');return true;}

  function burstCost(g){return level(g,'capacitor')>=2?3:4;}
  function checkpoint(g){
    if(!['campaign','endless'].includes(g.kind)||!['playing','transit'].includes(g.phase)||(g.round===0&&g.wave===0)||g.t!==g.waveStart)return null;
    return {
      version:3,sectorId:sector(g).id,legacyRun:!!g.legacyRun,kind:g.kind,protocol:g.protocol,round:g.round,wave:g.wave,sectorStart:g.sectorStart,parts:g.parts,rerolls:g.rerolls,seed:g.seed,t:g.t,retries:g.retries,recentOffers:g.recentOffers.slice(),
      hp:g.player.hp,drones:g.drones,peak:g.peak,charge:g.charge,mode:g.mode,unlocked:g.unlocked,
      repair:g.repair,relay:g.relay,burstTaught:!!g.burstTaught,upgrades:{...g.upgrades},
      score:g.score,kills:g.kills,stats:{...g.stats},rand:g.rand.state(),loot:g.loot.state(),visual:g.visual.state()
    };
  }
  const intRange=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
  function validCheckpoint(data){
    if(!data||![1,2,3].includes(data.version)||!['campaign','endless'].includes(data.kind)||!Object.hasOwn(difficulty,data.protocol))return false;
    if(data.version===3&&!sectors.some(s=>s.id===data.sectorId&&sectors.indexOf(s)===data.round))return false;
    const slots=new Set();
    for(const [id,n] of Object.entries(data.upgrades||{}))if(n>0&&upgrades[id]?.slot){const slot=upgrades[id].slot;if(slots.has(slot))return false;slots.add(slot);}
    const final=data.kind==='campaign'?(data.version===3?sectors.length-1:2):10000;
    return intRange(data.round,data.version===1?1:0,final)&&(data.version===1||intRange(data.wave,0,sectors[data.round%sectors.length].waves.length-1))&&intRange(data.seed,0,0xffffffff)&&Number.isFinite(data.t)&&data.t>=0&&
      intRange(data.rand,1,0xffffffff)&&intRange(data.loot,1,0xffffffff)&&intRange(data.visual,1,0xffffffff);
  }
  function restore(data,bounds){
    if(!validCheckpoint(data))return null;
    const g=create(data.seed,{kind:data.kind,protocol:data.protocol,bounds});
    g.round=data.version===3?data.round:Math.floor(data.round/3)*5+[0,1,4][data.round%3];g.legacyRun=data.legacyRun===true||data.version<3;g.wave=data.version>=2?data.wave:0;g.parts=intRange(data.parts,0,3)?data.parts:0;g.t=data.t;
    for(const [id,def] of Object.entries(upgrades)){
      const n=data.upgrades?.[id];if(intRange(n,1,def.max))g.upgrades[id]=n;
    }
    g.player.max=100+22*level(g,'plating');
    if(Number.isFinite(data.hp))g.player.hp=clamp(Math.round(data.hp),1,g.player.max);
    if(Number.isFinite(data.drones))g.drones=clamp(Math.round(data.drones),1,capacity(g));
    g.peak=intRange(data.peak,g.drones,300)?data.peak:g.drones;
    g.charge=intRange(data.charge,0,100)?data.charge:0;
    g.unlocked=intRange(data.unlocked,1,3)?data.unlocked:3;
    g.mode=modes.slice(0,g.unlocked).includes(data.mode)?data.mode:'ring';
    g.repair=data.repair===true;g.relay=data.relay===true;g.burstTaught=data.burstTaught===true;
    g.score=intRange(data.score,0,Number.MAX_SAFE_INTEGER)?data.score:0;
    g.kills=intRange(data.kills,0,Number.MAX_SAFE_INTEGER)?data.kills:0;
    for(const key of Object.keys(g.stats)){
      const n=data.stats?.[key];
      const valid=key.endsWith('Damage')?typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER:intRange(n,0,Number.MAX_SAFE_INTEGER);
      if(valid)g.stats[key]=n;
    }
    g.stats.sectors=g.legacyRun&&intRange(data.stats?.sectors,0,10000)?data.stats.sectors:g.round;
    g.rand=rng(data.rand);g.loot=rng(data.loot);g.visual=rng(data.visual);
    g.events.length=g.cues.length=0;g.tip=null;g.nextRepair=g.t+1;
    emit(g,'run_resumed',{round:g.round+1,kind:g.kind,protocol:g.protocol});
    startSector(g,false);
    g.wave=data.version>=2?data.wave:0;g.waveStart=g.t;g.parts=intRange(data.parts,0,3)?data.parts:0;
    if(g.wave>0)prepareWave(g);g.tip=null;
    g.sectorStart=Number.isFinite(data.sectorStart)&&data.sectorStart>=0&&data.sectorStart<=g.t?data.sectorStart:g.t;
    g.rerolls=intRange(data.rerolls,0,1)?data.rerolls:1;
    g.retries=intRange(data.retries,0,10000)?data.retries:0;
    g.recentOffers=Array.isArray(data.recentOffers)?data.recentOffers.filter(id=>Object.hasOwn(upgrades,id)).slice(0,3):[];
    if(g.wave>0)g.banner={id:'wave',until:g.t+2.6};
    return g;
  }
  function retryCheckpoint(data,bounds){
    if(data?.kind!=='campaign')return null;
    const g=restore(data,bounds);if(!g)return null;
    g.retries++;g.score=Math.floor(g.score*.8);g.player.hp=Math.max(g.player.hp,Math.ceil(g.player.max*.65));
    emit(g,'checkpoint_retried',{retries:g.retries});return g;
  }

  function setMode(g,id){
    const i=modes.indexOf(id);
    if(g.phase!=='playing'||g.bossDefeated||i<0||i>=g.unlocked||id===g.mode)return false;
    g.mode=id;g.nextFire=Math.min(g.nextFire,g.t+.1);
    g.stats.switches++;pulse(g,g.player.x,g.player.y,80,'ally',.35);
    if(level(g,'conductor')&&g.t>=g.nextConductor){g.weapon.conductor=true;g.nextConductor=g.t+3;}
    emit(g,'formation_changed',{mode:id});cue(g,'switch');return true;
  }
  function unlock(g,count){
    if(count<=g.unlocked)return;
    for(let i=g.unlocked;i<count;i++)emit(g,'formation_unlocked',{mode:modes[i]});
    g.unlocked=count;tip(g,modes[count-1]);cue(g,'unlock');
  }
  function fabricate(g){
    while(g.parts>=fabricationCost(g)&&g.drones<capacity(g)){g.parts-=fabricationCost(g);g.drones++;}
    g.parts=Math.min(g.parts,fabricationCost(g)-1);g.peak=Math.max(g.peak,g.drones);
  }
  function collect(g){
    g.parts++;fabricate(g);
    g.charge=Math.min(100,g.charge+8+level(g,'capacitor')*3);
    g.stats.collected++;g.score+=15;cue(g,'pickup');
    if(g.drones>=7)unlock(g,2);
    if(g.drones>=17)unlock(g,3);
    if(g.drones>=12&&!g.relay){g.relay=true;emit(g,'support_unlocked',{unit:'relay'});tip(g,'relay');cue(g,'unlock');}
    if(g.drones>=24&&!g.repair){g.repair=true;g.nextRepair=g.t+1;emit(g,'support_unlocked',{unit:'medic'});tip(g,'medic');cue(g,'unlock');}
    if(g.charge===100&&!g.burstTaught){g.burstTaught=true;tip(g,'burst');}
  }
  function drop(g,x,y,count){
    for(let i=0;i<count&&g.salvage.length<300;i++){
      const a=g.loot()*TAU,v=23+g.loot()*75;
      g.salvage.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v});
    }
  }
  function pulse(g,x,y,rad,color,life=.48){
    if(g.fx.length<1500)g.fx.push({type:'pulse',x,y,t:g.t,life,rad,color});
  }
  function spark(g,x,y,color,count=8){
    for(let i=0;i<count&&g.fx.length<1500;i++){
      const a=g.visual()*TAU,v=35+g.visual()*190;
      g.fx.push({type:'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:g.t,life:.22+g.visual()*.5,color});
    }
  }

  function spawnPoint(g){
    const p=g.player;
    let x,y;
    // Spawn around the active fight so very wide or tall screens don't create dead zones.
    for(let attempt=0;attempt<8;attempt++){
      const a=g.rand()*TAU,r=240+g.rand()*185;
      x=clamp(p.x+Math.cos(a)*r,24,g.w-24);
      y=clamp(p.y+Math.sin(a)*r,24,g.h-24);
      if(d2(x,y,p.x,p.y)>220**2)break;
    }
    return {x,y};
  }
  function spawn(g,type,x,y){
    if(x===undefined)({x,y}=spawnPoint(g));
    const spec=enemy[type];
    const scale=1+Math.min(8,g.round)*(g.kind==='endless'?.13:.10)+Math.max(0,g.round-8)*.075;
    const endurance=spec.boss&&g.kind==='campaign'?1.45+g.round*.35:1;
    const hp=Math.ceil(spec.hp*scale*g.rules.health*endurance);
    const e={type,x,y,hp,max:hp,r:spec.r,speed:spec.speed*g.rules.travel*(1+Math.min(g.round,8)*.018),
      boss:!!spec.boss,armored:!!spec.armored,angle:0,wind:0,ready:g.t+1.1+g.rand()*.7,flash:0,born:g.t,attackIndex:0};
    g.enemies.push(e);
    if(['pulsar','weaver','bulwark'].includes(type)&&!g.seenTypes[type]){g.seenTypes[type]=true;tip(g,type,5);emit(g,'enemy_discovered',{type});}
    return e;
  }
  function spawnGroup(g,group){
    const pos=spawnPoint(g),p=g.player,a=angle(p.x,p.y,pos.x,pos.y)+Math.PI/2;
    const limit=34+Math.min(10,g.round*2);
    group.forEach((type,i)=>{
      if(g.enemies.length>=limit)return;
      if(['pulsar','weaver','bulwark'].includes(type)&&g.enemies.some(e=>e.type===type&&e.hp>0))return;
      if(['pulsar','weaver'].includes(type)&&g.enemies.filter(e=>['pulsar','weaver'].includes(e.type)&&e.hp>0).length>=2)return;
      const off=(i-(group.length-1)/2)*28;
      spawn(g,type,clamp(pos.x+Math.cos(a)*off,18,g.w-18),clamp(pos.y+Math.sin(a)*off,18,g.h-18));
    });
  }
  function waveDuration(g){
    return (sector(g).waves[g.wave]?.length||0)*(g.kind==='endless'?.42:1);
  }
  function scheduleWave(g,e,gap,fire){
    if(g.hazards.filter(h=>h.end>g.t).length>=3)return;
    g.hazards.push({type:'wave',x:e.x,y:e.y,start:g.t,fire,end:fire+2.55,speed:174,width:15,gap,gapHalf:.60,owner:e,source:'wave'});
    emit(g,'pattern_spawned',{pattern:'wave',enemy:e.type});
  }
  function scheduleSweep(g,e,fire){
    if(g.hazards.filter(h=>h.end>g.t).length>=3)return;
    const horizontal=e.attackIndex%2===0,p=g.player,axis=horizontal?'x':'y',cross=horizontal?g.h:g.w;
    const origin=horizontal?p.y:p.x;
    const direction=origin<cross*.35?1:origin>cross*.65?-1:e.attackIndex%2?1:-1;
    // The warning asks for a deliberate move into the corridor, including near an arena edge.
    const gap=clamp(origin+direction*120,85,cross-85);
    g.hazards.push({type:'sweep',axis,x:horizontal?-32:0,y:horizontal?0:-32,endX:horizontal?g.w+32:0,endY:horizontal?0:g.h+32,
      gap,gapHalf:75,width:28,start:g.t,fire,end:fire+3.1,source:'sweep',owner:e});
    emit(g,'pattern_spawned',{pattern:'sweep',enemy:e.type});
  }
  function patternRadius(h,time){return 24+Math.max(0,time-h.fire)*h.speed;}
  function patternDanger(g,h,p,pad=8,time=g.t){
    if(h.end<=time)return false;
    if(h.type==='wave'){
      const r=Math.hypot(p.x-h.x,p.y-h.y),a=angle(h.x,h.y,p.x,p.y);
      return angularDistance(a,h.gap)>h.gapHalf-Math.min(.2,pad/Math.max(30,r))&&Math.abs(r-patternRadius(h,time))<h.width/2+pad;
    }
    if(h.type==='sweep'){
      const pos=hazardPosition(h,time),distance=h.axis==='x'?Math.abs(p.x-pos.x):Math.abs(p.y-pos.y),cross=h.axis==='x'?p.y:p.x;
      return distance<h.width/2+pad&&Math.abs(cross-h.gap)>h.gapHalf-pad;
    }
    return false;
  }

  function fieldAttack(g,id){
    const p=g.player;
    if(id==='veil'){
      const axis=g.rand()>.5?'x':'y',edge=axis==='x'?g.w:g.h;
      g.hazards.push({type:'sweep',axis,x:axis==='x'?-30:0,y:axis==='y'?-30:0,gap:axis==='x'?p.y:p.x,gapHalf:82,width:24,endX:axis==='x'?g.w+30:0,endY:axis==='y'?g.h+30:0,start:g.t,fire:g.t+1.7,end:g.t+5.5,source:'sweep'});
    }else if(id==='forge'){
      for(const side of [-1,1])g.hazards.push({type:'surge',x:clamp(p.x+side*112,40,g.w-40),y:clamp(p.y+side*35,40,g.h-40),radius:66,start:g.t,fire:g.t+1.6,end:g.t+2,source:'surge'});
    }else if(id==='belt'){
      const horizontal=g.rand()>.44,reverse=g.rand()>.50,spread=(g.rand()-.5)*144;
      const cross=clamp((horizontal?p.y:p.x)+spread,36,(horizontal?g.h:g.w)-36);
      const edge=horizontal?g.w:g.h,start=reverse?edge+44:-44,end=reverse?-44:edge+44;
      const x=horizontal?start:cross,y=horizontal?cross:start,endX=horizontal?end:cross,endY=horizontal?cross:end;
      const travel=clamp(edge/840,.84,1.38);
      g.hazards.push({type:'debris',x,y,endX,endY,width:51,start:g.t,fire:g.t+1.22,end:g.t+1.22+travel,source:'debris'});
    }else if(id==='core'){
      const a=g.rand()*TAU;
      for(let i=0;i<(g.wave===0?1:2);i++){
        const r=i?157:38,b=a+i*2.34;
        g.hazards.push({type:'surge',x:clamp(p.x+Math.cos(b)*r,32,g.w-32),y:clamp(p.y+Math.sin(b)*r,32,g.h-32),
          radius:i?51:67,start:g.t,fire:g.t+1.42+i*.12,end:g.t+1.81+i*.12,source:'surge'});
      }
    }
    cue(g,'wind');emit(g,'field_warning',{sector:id});
  }
  function encounter(g){
    const s=sector(g),elapsed=g.t-g.waveStart;
    if(g.wave<s.waves.length&&elapsed>=waveDuration(g)){
      if(g.wave<s.waves.length-1){
        g.phase='draft';g.draftReason='wave';g.draft=draft(g);cue(g,'clear');return;
      }
      g.wave++;g.waveStart=g.t;g.nextSpawn=g.t+2.6;g.bossArrival=g.t+2.6;g.enemies.length=g.hostile.length=g.shots.length=g.hazards.length=0;g.player.inv=2.8;signal(g,'boss',2.6);emit(g,'boss_approach',{chapter:g.round+1});
    }
    if(g.wave===s.waves.length&&!g.bossSpawned){
      if(g.kind==='rush'&&g.t-g.sectorStart<1.95||g.t<g.bossArrival)return;
      g.bossSpawned=true;
      // A readable phase break: the boss takes over after the wave, rather than stacking on its leftovers.
      for(const e of g.enemies)if(e.hp>0){spark(g,e.x,e.y,'ally',7);}
      g.enemies.length=0;g.hostile.length=0;g.hazards.length=0;g.fields.length=0;
      g.player.inv=Math.max(g.player.inv,1.15);
      pulse(g,g.player.x,g.player.y,150,'ally',.55);
      const radius=enemy[s.boss].r;
      const x=clamp(g.player.x,radius+20,g.w-radius-20);
      const side=g.player.y>g.h*.5?-1:1;
      const y=clamp(g.player.y+side*150,radius+20,g.h-radius-20);
      spawn(g,s.boss,x,y);signal(g,'boss',3.1);g.nextSpawn=g.t+4.4;
      emit(g,'boss_entered',{type:s.boss});
    }
    if(!g.bossSpawned&&s.id!=='array'&&g.t>=g.nextField&&g.hazards.length<2&&g.t-g.waveStart<waveDuration(g)-3.1){
      fieldAttack(g,s.id);g.nextField=g.t+((s.id==='belt'?11.4:10.8)+g.rand()*2.7)*variant(g).field;
    }
    if(g.t<g.nextSpawn)return;
    if(g.bossSpawned){
      if(!g.bossDefeated){spawnEscorts(g,s.escort[g.groupIndex++%s.escort.length],s.id==='core'?4:35);g.nextSpawn=g.t+Math.max(3.1,(s.id==='core'?8.5:6.6-g.round*.3)*g.rules.pace);}
    }else{
      const wave=s.waves[g.wave];
      if(g.t-g.waveStart<waveDuration(g)-2.2){
        const v=variant(g),index=g.groupIndex++;
        spawnGroup(g,wave.groups[(index+v.offset)%wave.groups.length]);
        if(v.reinforcement&&g.wave>0&&index%6===5)spawnGroup(g,[v.reinforcement]);
      }
      const interval=wave.interval*g.rules.pace*(g.kind==='endless'?.92:1)/Math.min(1.28,1+Math.max(0,g.round-2)*.045);
      // Four spawn groups form a phrase, followed by a brief collection and repositioning window.
      g.nextSpawn=beatAt(g,g.t+interval+(g.groupIndex%4===0?1.35:0),2);
    }
  }

  const multiplier=g=>g.t>=g.chainUntil?1:g.chain>=14?3:g.chain>=6?2:1;
  function kill(g,e,source){
    const previous=multiplier(g);
    g.chain=g.t<g.chainUntil?g.chain+1:1;
    g.chainUntil=g.t+2.6;g.stats.bestChain=Math.max(g.stats.bestChain,g.chain);
    if(multiplier(g)>previous)cue(g,'chain');
    for(const h of g.hazards)if(h.owner===e&&h.fire>g.t)h.end=g.t;
    g.kills++;
    const points=e.boss?2300:e.type==='ram'?180:e.type==='prism'?165:e.type==='splitter'?130:85;
    g.score+=points*multiplier(g);
    if(source==='blade'){
      if(level(g,'siphon')&&(g.stats.bladeKills+1)%3===0){g.player.hp=Math.min(g.player.max,g.player.hp+2);pulse(g,e.x,e.y,32,'ally',.3);}
      g.stats.bladeKills++;combatMark(g,'cut',e.x,e.y,g.player.angle,e.r+19);}
    if(source==='spear'&&level(g,'forkLance')&&g.shots.length<86){
      for(const side of [-1,1]){const a=g.player.angle+side*.55;g.shots.push({x:e.x,y:e.y,vx:Math.cos(a)*500,vy:Math.sin(a)*500,life:.5,hit:30,pierce:1,kind:'shard',seen:[e]});}
    }
    if(source==='burst'&&level(g,'recycler')){g.parts++;fabricate(g);}
    if(g.kind!=='training')drop(g,e.x,e.y,e.boss?0:e.type==='ram'?5:e.type==='skimmer'?2:3);
    spark(g,e.x,e.y,'enemy',e.boss?160:e.r>20?31:18);cue(g,e.boss?'bossDown':'kill');
    if(e.boss){
      const finale=(g.kind==='campaign'||g.kind==='rush')&&g.round===sectors.length-1;
      g.bossDefeated=true;g.clearAt=g.t+(finale?1.85:1.4);
      g.banner={id:'clear',until:g.clearAt};g.tip=null;g.hostile.length=0;g.hazards.length=0;
      pulse(g,e.x,e.y,340,'enemy',1.25);pulse(g,e.x,e.y,210,'burst',.82);
      for(const enemy of g.enemies)if(enemy!==e&&enemy.hp>0)enemy.departAt=g.t+.17+g.visual()*.62;
    }
    if(e.type==='splitter'&&source!=='blade'&&source!=='burst'&&g.enemies.length<42){
      const a=e.angle+Math.PI/2;
      for(const side of [-1,1])spawn(g,'skimmer',clamp(e.x+Math.cos(a)*26*side,17,g.w-17),clamp(e.y+Math.sin(a)*26*side,17,g.h-17));
    }
  }
  function combatMark(g,type,x,y,a=0,rad=20){
    if(g.fx.length<1500)g.fx.push({type,x,y,a,rad,t:g.t,life:type==='hurt'?.48:.29,
      color:type==='guard'?'ally':type==='armor'?'burst':type==='hurt'?'enemy':'salvage'});
  }
  function damage(g,e,amount,source,impactAngle=null){
    if(e.hp<=0)return;
    if(source==='spear'&&!e.boss){
      if(e.wind>g.t){
        e.wind=0;e.attack=null;e.ready=g.t+2.1;e.staggerUntil=g.t+.65;g.stats.interrupts++;
        for(const h of g.hazards)if(h.owner===e&&h.fire>g.t)h.end=g.t;
        combatMark(g,'interrupt',e.x,e.y,0,e.r+15);cue(g,'interrupt');
      }
      if(e.type==='prism'||e.type==='bulwark'){
        if(!(e.shieldOpen>g.t)){g.stats.shieldBreaks++;combatMark(g,'interrupt',e.x,e.y,0,e.r+15);pulse(g,e.x,e.y,e.type==='bulwark'?104:35,'ally',.35);cue(g,'interrupt');}
        e.shieldOpen=g.t+1.6;
      }
    }
    if(source!=='spear'&&!e.boss){
      const ward=g.enemies.find(other=>other!==e&&other.type==='bulwark'&&other.hp>0&&!(other.shieldOpen>g.t)&&d2(e.x,e.y,other.x,other.y)<104**2&&d2(g.player.x,g.player.y,other.x,other.y)>104**2);
      if(ward){amount*=.32;combatMark(g,'armor',e.x,e.y,0,14);}
      if(e.type==='prism'&&!(e.shieldOpen>g.t)&&Math.cos((impactAngle??angle(e.x,e.y,g.player.x,g.player.y))-e.angle)>.25)amount*=.30;
    }
    const dealt=Math.min(e.hp,amount);
    e.hp-=amount;e.flash=g.t+.11;e.hitKind=source;
    const stat=(source==='blade'||source==='bladeShot')?'bladeDamage':['spear','shard','arc'].includes(source)?'spearDamage':source==='burst'?'burstDamage':'ringDamage';
    g.stats[stat]=(g.stats[stat]||0)+dealt;
    if(source==='spear'&&e.armored){
      g.stats.pierceHits++;cue(g,'pierce');
      if(g.t>=(e.nextPierceFx||0)){combatMark(g,'pierce',e.x,e.y,g.player.angle,e.r+12);e.nextPierceFx=g.t+.09;}
    }else if(e.armored&&source!=='burst'&&source!=='blade'){
      if(g.t>=(e.nextArmorFx||0)){combatMark(g,'armor',e.x,e.y,e.angle,e.r+4);e.nextArmorFx=g.t+.18;cue(g,'armor');}
    }
    if(source==='blade'){
      if(g.t>=(g.nextCutFx||0)){combatMark(g,'cut',e.x,e.y,angle(g.player.x,g.player.y,e.x,e.y),e.r+10);g.nextCutFx=g.t+.09;cue(g,'cut');}
      if(!e.armored&&e.hp>0){
        const a=angle(g.player.x,g.player.y,e.x,e.y)+(level(g,'vortex')?Math.PI*.68:0);
        e.x=clamp(e.x+Math.cos(a)*8,15,g.w-15);e.y=clamp(e.y+Math.sin(a)*8,15,g.h-15);
      }
    }
    if(source==='burst')g.stats.burstHits++;
    if(e.hp<=0)kill(g,e,source);
  }
  function hit(g,amount,source){
    const p=g.player;
    if(p.inv>0||g.bossDefeated)return;
    p.inv=.65;g.chain=0;g.chainUntil=0;g.hurtFlash=g.t+.38;g.stats.hits++;g.lastHit=source;
    p.hp=Math.max(g.kind==='training'?10:0,p.hp-Math.round(amount*g.rules.damage));
    if(g.kind!=='training')g.drones=Math.max(1,g.drones-(amount>=17?2:1));
    spark(g,p.x,p.y,'enemy',24);combatMark(g,'hurt',p.x,p.y,0,Math.round(amount*g.rules.damage));cue(g,'hurt');
  }
  function burst(g){
    const cost=burstCost(g);
    if(g.phase!=='playing'||g.bossDefeated||g.charge<100||g.drones<=cost)return false;
    const p=g.player;g.charge=0;g.drones-=cost;g.stats.bursts++;
    const target=g.aim;
    const direction=target?angle(p.x,p.y,target.x,target.y):p.angle;
    const distance=clamp(target?Math.hypot(target.x-p.x,target.y-p.y):260,65,400),n=level(g,'cluster')?3:1;
    for(let i=0;i<n;i++){
      const a=direction+(i-(n-1)/2)*.23;
      alliedBolt(g,p.x,p.y,a,480,n===3?105:230,'burst',0,distance/480);
    }
    emit(g,'burst_used',{cost});cue(g,'burst');pulse(g,p.x,p.y,75,'burst');return true;
  }
  function clearBullets(g,x,y,radius){
    for(const b of g.hostile)if(b.life>0&&d2(x,y,b.x,b.y)<radius*radius){b.life=0;spark(g,b.x,b.y,'burst',3);}
  }
  function blast(g,x,y,payload=230){
    const boost=level(g,'capacitor'),radius=level(g,'cluster')?72:94;
    clearBullets(g,x,y,radius+boost*8);
    pulse(g,x,y,radius+boost*9,'burst',.43);spark(g,x,y,'burst',38);
    if(level(g,'afterburn')&&g.echoes.length<64)g.echoes.push({x,y,at:g.t+.35});
    if(level(g,'cryo'))addField(g,'cryo',x,y,110,2.4);
    for(const e of g.enemies.slice())if(d2(x,y,e.x,e.y)<(radius+boost*8+e.r*.5)**2)damage(g,e,(payload+boost*25)*(level(g,'cryo')?.65:1),'burst');
  }

  const isSpear=g=>g.mode==='spear';
  function fire(g){
    const p=g.player,w=g.weapon;
    if(!g.aim)return false;
    // Every projectile follows the actual pointer/stick bearing. There is no target search.
    if(w.conductor){
      w.conductor=false;
      for(let i=-2;i<=2;i++)alliedBolt(g,p.x,p.y,p.angle+i*.13,570,27,'ally',1,.65);
      pulse(g,p.x,p.y,72,'salvage',.25);
    }
    if(g.mode==='spear'){
      const power=(52+Math.min(110,g.drones*1.7)+level(g,'lance')*16)*(level(g,'siege')?1.9:level(g,'arc')?.78:1)*(.35+.65*w.lock);
      alliedBolt(g,p.x+Math.cos(p.angle)*18,p.y+Math.sin(p.angle)*18,p.angle,1080,power,'spear',level(g,'siege')?11:4+level(g,'lance'),.85);
      if(level(g,'arc'))for(const side of [-1,1])alliedBolt(g,p.x,p.y,p.angle+side*.15,900,power*.55,'shard',2,.7);
      for(let i=0;i<level(g,'scatter');i++)alliedBolt(g,p.x,p.y,p.angle+(i?-.18:.18),620,16,'ally',0,.7);
      cue(g,'shotSpear');return true;
    }
    if(g.mode==='blades'){
      const n=1+level(g,'scatter');
      for(let i=0;i<n;i++)alliedBolt(g,p.x,p.y,p.angle+(i-(n-1)/2)*.2,410,27,'bladeShot',0,.40);
      cue(g,'cut');return true;
    }
    const charged=w.guard>=3,mirror=level(g,'mirror')&&w.guard>0;
    const n=Math.min(4,1+Math.floor(g.drones/24))+level(g,'scatter')+(charged?2:0);
    for(let i=0;i<n;i++){
      const offset=i===0?0:Math.ceil(i/2)*(i%2?1:-1)*.12;
      const bolt=alliedBolt(g,p.x+Math.cos(p.angle)*18,p.y+Math.sin(p.angle)*18,p.angle+offset,charged?670:620,(i===0?28:16)+(charged?22:0)+(mirror?12:0),mirror?'reflect':charged?'counter':'ally',charged?1:0);
      if(bolt)bolt.primary=i===0;
    }
    if(charged){w.guard=0;w.guardFlash=g.t+.32;g.stats.counterSalvos++;cue(g,'counter');}
    else if(mirror)w.guard--;
    cue(g,'shotRing');return true;
  }
  function enemyShot(g,e,a,speed,amount,source=e.type){
    if(g.hostile.length>=340)return;
    const v=speed*g.rules.travel,offset=e.r+4;
    g.hostile.push({x:e.x+Math.cos(a)*offset,y:e.y+Math.sin(a)*offset,
      vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:5,amount,source,owner:e});
  }
  function fan(g,e,a,n,spacing,speed,amount){
    for(let i=0;i<n;i++)enemyShot(g,e,a+(i-(n-1)/2)*spacing,speed,amount);
  }
  function radial(g,e,n,offset,speed,amount){
    for(let i=0;i<n;i++)enemyShot(g,e,offset+i*TAU/n,speed,amount);
  }
  function ray(g,e,a,length,width,delay=.85){
    if(g.hazards.filter(h=>h.end>g.t).length>=3)return;
    g.hazards.push({type:'ray',x:e.x,y:e.y,endX:e.x+Math.cos(a)*length,endY:e.y+Math.sin(a)*length,
      width,start:g.t,fire:g.t+delay,end:g.t+delay+.27,source:e.type,owner:e});
  }
  function mineBlast(g,e){
    radial(g,e,12,g.t,191,11);pulse(g,e.x,e.y,86,'enemy',.4);spark(g,e.x,e.y,'enemy',24);
    if(d2(e.x,e.y,g.player.x,g.player.y)<85**2)hit(g,17,'mine');
    e.hp=0;
  }
  function charge(e,g,kind,duration){
    e.attack=kind;e.wind=g.kind!=='training'&&['volley','pulse','weave','spread','beam','sweep'].includes(kind)?beatAt(g,g.t+duration,2):g.t+duration;
    e.windStart=g.t;
    e.windAngle=angle(e.x,e.y,g.player.x,g.player.y);
    if(kind==='dash')e.dashDistance=clamp(Math.hypot(e.x-g.player.x,e.y-g.player.y)-64,60,340);
  }
  function planBoss(g,e){
    const enraged=e.hp<e.max*.5,n=e.attackIndex++;
    if(sector(g).id==='veil'&&e.boss){
      charge(e,g,n%3===1?'pulse':'beam',1.15);
      if(e.attack==='pulse')scheduleWave(g,e,e.windAngle+(n%2?.8:-.8),e.wind);
      else ray(g,e,e.windAngle,Math.hypot(g.w,g.h),28,e.wind-g.t);
    }else if(sector(g).id==='forge'&&e.boss){
      charge(e,g,n%3===0?'dash':n%3===1?'pulse':'spread',n%3===0?1.1:1.0);
      if(e.attack==='pulse')scheduleWave(g,e,e.windAngle+Math.PI/2,e.wind);
    }else if(e.type==='warden'){
      charge(e,g,n%3===2?'pulse':'spread',n%3===2?.95:enraged?.64:.77);
      if(e.attack==='pulse')scheduleWave(g,e,e.windAngle+(n%2?.65:-.65),e.wind);
    }
    else if(e.type==='reaver')charge(e,g,n%3===0?'dash':n%3===2?'summon':'spread',n%3===0?.95:.64);
    else {
      const variant=(n+1)%(enraged?4:3);
      if(variant===1||variant===3){
        charge(e,g,'beam',.90);
        ray(g,e,e.windAngle,Math.hypot(g.w,g.h),42,e.wind-g.t);
        if(enraged){ray(g,e,e.windAngle-.52,Math.hypot(g.w,g.h),27,e.wind-g.t);ray(g,e,e.windAngle+.52,Math.hypot(g.w,g.h),27,e.wind-g.t);}
      }else if(variant===0){charge(e,g,'sweep',1.15);scheduleSweep(g,e,e.wind);}
      else charge(e,g,'summon',.72);
    }
    emit(g,'boss_attack',{type:e.type,attack:e.attack});
    cue(g,e.attack==='beam'||e.attack==='dash'?'warning':'wind');
  }
  function exposed(g,e){
    return !!e.boss&&g.t<(e.recoverUntil||0)&&g.t>=(e.exposeAt||0);
  }
  function spawnEscorts(g,group,limit){
    const count=g.enemies.filter(e=>!e.boss&&e.hp>0).length;
    if(count<limit)spawnGroup(g,group.slice(0,limit-count));
  }
  function fireBoss(g,e,a){
    a=e.windAngle;
    const enraged=e.hp<e.max*.5;
    if(e.attack==='sweep')e.patternUntil=Math.max(g.t,...g.hazards.filter(h=>h.owner===e&&h.type==='sweep').map(h=>h.end));
    if(e.attack==='spread'){
      radial(g,e,e.type==='warden'?(enraged?17:12):enraged?23:17,g.t*.65,enraged?214:170,13);
      fan(g,e,a,e.type==='warden'?3:5,.127,284,16);
    }else if(e.attack==='pulse'||e.attack==='sweep'){
      e.exposeAt=g.t+.15;e.recoverUntil=g.t+1.25;cue(g,'pattern');
    }else if(e.attack==='dash'){
      e.dashUntil=g.t+(e.dashDistance||240)/(530*g.rules.travel);e.dashAngle=e.windAngle;e.exposeAt=e.dashUntil;e.recoverUntil=e.dashUntil+2.05;
      fan(g,e,e.windAngle,3,.22,245,14);
    }else if(e.attack==='summon'){
      spawnEscorts(g,e.type==='reaver'?['skimmer','skimmer','splitter']:['prism','mine','skimmer'],e.type==='sovereign'?4:35);
      radial(g,e,enraged?18:12,g.t,188,12);
    }else if(e.attack==='beam'){e.exposeAt=g.t+.28;e.recoverUntil=g.t+1.17;cue(g,'beam');}
    e.ready=g.t+(e.type==='warden'?enraged?1.30:1.55:enraged?.91:1.22)*g.rules.pace;
    if(e.recoverUntil)e.ready=Math.max(e.ready,e.recoverUntil+.15);
    if(e.patternUntil)e.ready=Math.max(e.ready,e.patternUntil+.25);
    e.attack=null;e.wind=0;
  }
  function moveEnemy(g,e,dt){
    if(e.hp<=0)return;
    const p=g.player,dist=Math.hypot(e.x-p.x,e.y-p.y),a=angle(e.x,e.y,p.x,p.y);
    if(e.type==='prism'||e.type==='bulwark'){const delta=Math.atan2(Math.sin(a-e.angle),Math.cos(a-e.angle));e.angle+=clamp(delta,-dt*1.25,dt*1.25);}
    else e.angle=e.wind>g.t&&e.attack==='volley'?e.windAngle:a;
    const age=g.t-e.born;
    if(age<.35)return; // Visible arrival before enemies can act.
    if(e.dummy)return;
    let speed=e.speed,dir=a;
    const space=e.type==='sentry'?220:e.type==='prism'?260:e.type==='weaver'?255:e.type==='pulsar'?220:e.type==='bulwark'?165:e.boss?e.type==='reaver'?155:222:0;
    if(space) speed=dist>space+20?speed:dist<space-40?-speed*.66:0;
    if(e.type==='reaver'&&dist<290&&dist>128){dir=a+Math.PI*.40;speed=e.speed*.87;}
    if(['pulsar','weaver'].includes(e.type)&&e.wind>g.t)speed=0;
    if(e.staggerUntil>g.t)speed=0;
    for(const f of g.fields)if(f.type==='gravity'&&g.t<f.end&&!e.boss&&d2(f.x,f.y,e.x,e.y)<f.radius*f.radius){
      const pull=angle(e.x,e.y,f.x,f.y);e.x+=Math.cos(pull)*24*dt;e.y+=Math.sin(pull)*24*dt;
    }
    if(e.boss&&e.wind>g.t&&(e.attack==='beam'||e.attack==='dash'))speed=0;
    if(exposed(g,e))speed*=e.type==='reaver'?.08:.24;
    if(e.dashUntil>g.t){speed=530*g.rules.travel;dir=e.dashAngle;e.angle=dir;}
    if(e.type==='ram'){
      if(dist<240&&g.t>=e.ready){charge(e,g,'charge',g.round===0?.62:.53);e.ready=g.t+2.8;}
      if(e.attack==='charge'){
        if(g.t<e.wind)speed*=.22;
        else if(g.t<e.wind+.43){speed*=3;dir=e.windAngle;e.angle=dir;}
        else {e.attack=null;e.wind=0;}
      }
    }
    if(e.type==='mine'&&(e.wind||dist<91)&&!(e.staggerUntil>g.t)){
      if(!e.wind){charge(e,g,'mine',.58);cue(g,'wind');}
      speed=0;
      if(g.t>=e.wind){mineBlast(g,e);return;}
    }
    speed*=slowFactor(g,e);
    e.x=clamp(e.x+Math.cos(dir)*speed*dt,15,g.w-15);
    e.y=clamp(e.y+Math.sin(dir)*speed*dt,15,g.h-15);
    if(e.boss&&g.t>=e.ready){
      if(!e.wind&&dist<510)planBoss(g,e);
      if(e.wind&&g.t>=e.wind)fireBoss(g,e,a);
    }
    if(['pulsar','weaver'].includes(e.type)&&g.t>=e.ready){
      if(!e.wind&&dist<510&&g.hazards.filter(h=>h.end>g.t).length<2){
        charge(e,g,e.type==='pulsar'?'pulse':'weave',e.type==='pulsar'?.95:1.4);
        if(e.type==='pulsar')scheduleWave(g,e,e.windAngle+(e.attackIndex++%2?.65:-.65),e.wind);
        else ray(g,e,e.windAngle,Math.hypot(g.w,g.h),20,e.wind-g.t);
        cue(g,'wind');
      }
      if(e.wind&&g.t>=e.wind){e.wind=0;e.attack=null;e.ready=beatAt(g,g.t+(e.type==='pulsar'?3.7:2.8)*g.rules.pace);cue(g,'pattern');}
    }
    if((e.type==='sentry'||e.type==='prism')&&g.t>=e.ready){
      if(!e.wind&&dist<460)charge(e,g,'volley',e.type==='prism'?.62:.47);
      if(e.wind&&g.t>=e.wind){
        if(e.type==='prism'){
          fan(g,e,e.windAngle,5,.20,235,12);fan(g,e,e.windAngle+.36,3,.26,163,11);
        }else fan(g,e,e.windAngle,3,.148,217,11);
        e.wind=0;e.attack=null;e.ready=g.kind==='training'?g.t+1.8:beatAt(g,g.t+(e.type==='prism'?2.1:1.75)*g.rules.pace);
      }
    }
    if(d2(e.x,e.y,p.x,p.y)<(e.r+11)**2){
      hit(g,e.boss?24:e.type==='ram'?18:13,e.type);
      e.x=clamp(e.x-Math.cos(a)*25,12,g.w-12);e.y=clamp(e.y-Math.sin(a)*25,12,g.h-12);
    }
  }

  function guardRadius(g){return 33+Math.min(28,g.drones*.67)+level(g,'bastion')*7;}
  function bladeRadius(g){return 82+level(g,'rotor')*11+(level(g,'longOrbit')?32:0)-(level(g,'vortex')?16:0);}
  function hazardPosition(h,time){
    if(!['debris','sweep'].includes(h.type))return {x:h.x,y:h.y};
    const k=clamp((time-h.fire)/(h.end-h.fire),0,1);
    return {x:h.x+(h.endX-h.x)*k,y:h.y+(h.endY-h.y)*k};
  }
  function lineDistance(h,p){
    const dx=h.endX-h.x,dy=h.endY-h.y,t=clamp(((p.x-h.x)*dx+(p.y-h.y)*dy)/(dx*dx+dy*dy||1),0,1);
    return Math.hypot(h.x+dx*t-p.x,h.y+dy*t-p.y);
  }
  function projectiles(g,dt){
    const p=g.player,shield=guardRadius(g);
    for(const echo of g.echoes)if(g.t>=echo.at){
      clearBullets(g,echo.x,echo.y,100);pulse(g,echo.x,echo.y,105,'burst',.4);
      for(const e of g.enemies.slice())if(d2(echo.x,echo.y,e.x,e.y)<(100+e.r*.5)**2)damage(g,e,48,'burst');
    }
    g.echoes=g.echoes.filter(e=>g.t<e.at);
    for(const b of g.shots){
      b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(b.life<=0){if(b.kind==='burst')blast(g,b.x,b.y,b.hit);continue;}
      for(const e of g.enemies){
        if(e.hp<=0||b.seen.includes(e)||d2(b.x,b.y,e.x,e.y)>(e.r+4)**2)continue;
        if(b.kind==='burst'){blast(g,b.x,b.y,b.hit);b.life=0;break;}
        const factor=e.armored?(b.kind==='spear'?(e.boss?1.20:1.7):e.boss?.53:.51):b.kind==='spear'?.45:1;
        damage(g,e,b.hit*factor*(exposed(g,e)?b.kind==='spear'&&e.type!=='reaver'?2.0:1.35:1),b.kind,Math.atan2(-b.vy,-b.vx));

        spark(g,b.x,b.y,'ally',3);b.seen.push(e);
        if(b.pierce--<=0){b.life=0;break;}
      }
    }
    if(g.bossDefeated)return;
    for(const b of g.hostile){
      if(b.life<=0)continue;
      const drag=slowFactor(g,b,true);b.x+=b.vx*dt*drag;b.y+=b.vy*dt*drag;b.life-=dt;
      const dx=b.x-p.x,dy=b.y-p.y,dist=dx*dx+dy*dy;
      if(g.mode==='ring'&&g.drones>=3&&dist<=shield*shield&&dx*b.vx+dy*b.vy<0&&g.t>=g.nextBlock){
        b.life=0;guardResponse(g,b);g.nextBlock=g.t+Math.max(.08,.50-g.drones*.017-level(g,'bastion')*.10);
        if(level(g,'echoGuard')&&g.t>=g.nextEchoGuard){
          g.nextEchoGuard=g.t+.65;pulse(g,p.x,p.y,115,'ally',.36);
          for(const e of g.enemies.slice())if(d2(p.x,p.y,e.x,e.y)<(115+e.r)**2)damage(g,e,22,'echo');
        }
        g.shieldFlash=g.t+.18;g.stats.blocks++;combatMark(g,'guard',b.x,b.y,Math.atan2(dy,dx),12);spark(g,b.x,b.y,'ally',9);cue(g,'block');continue;
      }
      if(dist<12**2){hit(g,b.amount||11,b.source||'projectile');b.life=0;}
    }
    for(const h of g.hazards){
      if(g.t<h.fire||g.t>=h.end)continue;
      if(h.type==='wave'||h.type==='sweep'){
        if(patternDanger(g,h,p))hit(g,h.type==='wave'?16:22,h.type);
      }else if(h.type==='surge'){
        if(d2(p.x,p.y,h.x,h.y)<h.radius*h.radius)hit(g,19,'surge');
      }else if(h.type==='debris'){
        const b=hazardPosition(h,g.t);
        if(d2(p.x,p.y,b.x,b.y)<(h.width*.5+9)**2)hit(g,18,'debris');
      }else if(lineDistance(h,p)<h.width*.5+8)hit(g,27,'beam');
    }
    const active=b=>b.life>0&&b.x>=-95&&b.x<=g.w+95&&b.y>=-95&&b.y<=g.h+95;
    g.shots=g.shots.filter(active);g.hostile=g.hostile.filter(active);g.hazards=g.hazards.filter(h=>h.end>g.t);
  }

  function startDrill(g){
    const d=g.training,p=g.player;g.weapon=freshWeapon();g.fields.length=0;
    p.x=g.w/2;p.y=g.h/2;p.hp=p.max;p.inv=1;g.mode=d.index===0?'spear':'ring';g.unlocked=3;g.drones=14;
    g.charge=d.index===3?100:0;g.aim=null;
    g.enemies.length=g.shots.length=g.hostile.length=g.fx.length=0;
    d.success=0;d.baseline={...g.stats};d.next=g.t+.75;
    emit(g,'training_started',{drill:d.index+1});
  }
  function drills(g){
    const d=g.training,p=g.player;
    if(d.success){
      if(g.t>=d.success+1.12){
        d.index++;
        if(d.index===4)finish(g,'trained');else startDrill(g);
      }
      return;
    }
    const goal=['blocks','pierceHits','bladeKills','burstHits'][d.index];
    if(g.stats[goal]>d.baseline[goal]){
      d.success=g.t;emit(g,'training_completed',{drill:d.index+1});cue(g,'clear');return;
    }
    if(g.t<d.next)return;
    if(d.index===0){
      const fromX=p.x<g.w/2?p.x+Math.min(165,g.w-30-p.x):p.x-Math.min(165,p.x-30);
      const e={x:fromX,y:p.y,r:0,type:'sentry'};
      fan(g,e,angle(fromX,p.y,p.x,p.y),1,0,205,8);
      d.next=g.t+1.45;
    }else if(!g.enemies.length){
      if(d.index===3){g.charge=100;g.drones=14;}
      const side=p.x<g.w/2?1:-1;
      const count=d.index===2?3:1;
      for(let i=0;i<count;i++){
        const e=spawn(g,d.index===2?'skimmer':'ram',p.x+side*(d.index===2?65:123),clamp(p.y+(i-1)*21,20,g.h-20));
        e.dummy=true;
      }
      d.next=g.t+1;
    }else if(d.index===3&&g.charge<100&&!g.shots.some(b=>b.kind==='burst')){g.charge=100;g.drones=14;}
  }

  function sweep(g){
    if(g.player.hp<=0){finish(g,'lost');return;}
    for(const e of g.enemies)if(e.hp>0&&g.t>=(e.departAt??g.t)){
      spark(g,e.x,e.y,'ally',12);e.hp=0;
    }
    g.enemies=g.enemies.filter(e=>e.hp>0);g.fx=g.fx.filter(f=>g.t<f.t+f.life);
    g.shots.length=g.hostile.length=g.hazards.length=0;
    if(g.t>=g.clearAt)clearSector(g);
  }
  function step(g,input={},dt=1/60){
    if(g.phase!=='playing')return;
    g.t+=dt;
    const p=g.player;
    if(input.aim!==undefined)g.aim=input.aim;
    const mx=clamp(input.x||0,-1,1),my=clamp(input.y||0,-1,1),len=Math.max(1,Math.hypot(mx,my));
    const speed=(g.mode==='spear'?209:g.mode==='blades'?229:222)*(1+.10*level(g,'thrusters'))*(g.mode==='ring'&&level(g,'gravity')?.88:1);
    p.x=clamp(p.x+mx*speed*dt/len,16,g.w-16);p.y=clamp(p.y+my*speed*dt/len,16,g.h-16);
    p.inv=Math.max(0,p.inv-dt);
    if(g.bossDefeated){sweep(g);return;}
    let targetAim=g.aim;
    if(targetAim&&d2(p.x,p.y,targetAim.x,targetAim.y)>4**2)p.angle=angle(p.x,p.y,targetAim.x,targetAim.y);
    if(input.mode)setMode(g,input.mode);
    if(input.burst)burst(g);
    if(g.kind==='training')drills(g);else encounter(g);
    if(g.phase!=='playing')return;
    if((g.repair||level(g,'nanites'))&&g.t>=g.nextRepair){
      g.nextRepair=g.t+Math.max(2.3,4-level(g,'nanites')*.7);
      p.hp=Math.min(p.max,p.hp+(g.repair?3:0)+level(g,'nanites')*2);
    }
    g.fields=g.fields.filter(f=>g.t<f.end);
    updateWeapon(g,input,dt);
    if(!g.bossDefeated){
      for(const e of g.enemies)moveEnemy(g,e,dt);
      projectiles(g,dt);
    }
    if(g.bossDefeated){sweep(g);return;}
    for(const s of g.salvage){
      const dist=Math.hypot(p.x-s.x,p.y-s.y),reach=(g.relay?165:94)+level(g,'salvager')*34;
      if(dist<15){collect(g);s.used=true;spark(g,s.x,s.y,'salvage',6);continue;}
      if(dist<reach){const v=235+(reach-dist)*2.35;s.x+=(p.x-s.x)/dist*v*dt;s.y+=(p.y-s.y)/dist*v*dt;}
      else{s.x=clamp(s.x+s.vx*dt,10,g.w-10);s.y=clamp(s.y+s.vy*dt,10,g.h-10);s.vx*=.94;s.vy*=.94;}
    }
    g.enemies=g.enemies.filter(e=>e.hp>0);g.salvage=g.salvage.filter(s=>!s.used);g.fx=g.fx.filter(f=>g.t<f.t+f.life);
    if(p.hp<=0)finish(g,'lost');
  }

  function formationThreat(g){
    if(g.bossDefeated)return null;
    const p=g.player;
    for(const h of g.hazards){
      const reason=h.type==='ray'?'beam':h.type;
      const radius=h.type==='wave'?Math.hypot(p.x-h.x,p.y-h.y):0;
      const approaching=h.type==='wave'&&radius+20>patternRadius(h,g.t)&&radius<patternRadius(h,h.end)+20&&
        angularDistance(angle(h.x,h.y,p.x,p.y),h.gap)>h.gapHalf-.18;
      const close=h.type==='wave'?approaching:h.type==='sweep'?patternDanger(g,h,p,30,Math.max(g.t,h.fire)+.65):h.type==='surge'?d2(h.x,h.y,p.x,p.y)<(h.radius+15)**2:lineDistance(h,p)<h.width*.5+22;
      if(g.t<h.end&&close){
        if(h.type==='ray'&&h.owner?.type==='weaver'&&g.unlocked>=2&&h.fire-g.t>chargeDuration(g)*(1-g.weapon.lock)+Math.hypot(h.x-p.x,h.y-p.y)/1080+.15)continue;
        if(h.type==='debris'&&g.t>h.fire){
          const before=hazardPosition(h,g.t),after=hazardPosition(h,g.t+.55);
          if(lineDistance({x:before.x,y:before.y,endX:after.x,endY:after.y},p)>(h.width*.5+28))continue;
        }
        return {mode:null,reason,hazard:h,urgent:true};
      }
    }
    let volley=null, armor=null, boss=null, interrupt=null, ward=null, skimmer=null, skimmerDistance=Infinity, pack=0;
    for(const e of g.enemies){
      if(e.hp<=0)continue;
      const dist=d2(e.x,e.y,p.x,p.y);
      if(e.type==='mine'&&e.wind>g.t&&dist<110**2)return {mode:null,reason:'mine',target:e,urgent:true};
      if(e.type==='ram'&&e.attack==='charge'&&g.t<e.wind+.43){
        const dx=p.x-e.x,dy=p.y-e.y,c=Math.cos(e.windAngle),s=Math.sin(e.windAngle);
        const along=dx*c+dy*s,across=Math.abs(dx*s-dy*c);
        const reach=e.speed*3*Math.min(.43,e.wind+.43-g.t)+e.r+28;
        if(along>-e.r&&along<reach&&across<e.r+18)return {mode:null,reason:'ramCharge',target:e,urgent:true};
      }
      if(e.type==='reaver'&&e.attack==='dash'&&e.wind>g.t&&dist<410**2){
        const aim=angle(e.x,e.y,p.x,p.y);
        if(Math.cos(aim-e.windAngle)>.966)return {mode:null,reason:'dash',target:e,urgent:true};
      }
      if((e.type==='sentry'||e.type==='prism'||e.boss&&['spread','summon'].includes(e.attack))&&e.wind>g.t&&dist<350**2&&
        (!volley||e.wind<volley.wind))volley=e;
      if(e.type==='weaver'&&e.wind-g.t>chargeDuration(g)*(1-g.weapon.lock)+Math.sqrt(dist)/1080+.15&&g.unlocked>=2&&dist<380**2)interrupt=e;
      if(e.type==='bulwark'&&!(e.shieldOpen>g.t)&&g.unlocked>=2&&dist<400**2)ward=e;
      if((e.armored||e.type==='prism'&&!(e.shieldOpen>g.t))&&!e.boss&&dist<330**2&&(!armor||dist<d2(armor.x,armor.y,p.x,p.y)))armor=e;
      if(e.boss&&dist<490**2)boss=e;
      if((e.type==='skimmer'||e.type==='splitter')&&dist<175**2){
        pack++;if(dist<skimmerDistance){skimmer=e;skimmerDistance=dist;}
      }
    }
    let shot=null,impact=Infinity;
    if(g.drones>=3)for(const b of g.hostile){
      const dx=b.x-p.x,dy=b.y-p.y,v2=b.vx*b.vx+b.vy*b.vy;
      if(!v2)continue;
      const eta=-(dx*b.vx+dy*b.vy)/v2;
      if(eta>0&&eta<.82&&eta<b.life&&eta<impact&&(dx+b.vx*eta)**2+(dy+b.vy*eta)**2<30**2){shot=b;impact=eta;}
    }
    const ring=shot?{mode:'ring',reason:'incoming',shot,urgent:impact<.56}:null;
    const close=skimmerDistance<124**2||pack>=2&&skimmerDistance<158**2;
    const blades=g.unlocked>=3&&close?
      {mode:'blades',reason:'skimmers',target:skimmer,urgent:skimmerDistance<(pack>=2?115:96)**2}:null;
    if(ring?.urgent)return ring;
    if(blades?.urgent)return blades;
    const reaverOpen=boss?.type==='reaver'&&g.unlocked>=3&&exposed(g,boss)&&d2(boss.x,boss.y,p.x,p.y)<(bladeRadius(g)+boss.r*.6+45)**2;
    if(reaverOpen&&!ring?.urgent)return {mode:'blades',reason:'reaverOpen',target:boss,urgent:false};
    const railRemaining=chargeDuration(g)*(1-g.weapon.lock);
    // A summon also fires a radial volley. Leave time to switch before its release.
    const finishBeforeVolley=!volley||railRemaining+.18<volley.wind-g.t;
    if(g.mode==='spear'&&g.weapon.lock>.65&&finishBeforeVolley&&(!ring||railRemaining+.12<impact)&&!blades&&(interrupt||ward||boss||armor||volley||ring))return {mode:'spear',reason:'finishCharge',target:interrupt||ward||boss||armor||volley,urgent:false};
    if(ring)return ring;
    if(interrupt)return {mode:'spear',reason:'interrupt',target:interrupt,urgent:false};
    if(volley&&g.drones>=3)return {mode:'ring',reason:'volley',target:volley,urgent:volley.wind-g.t<.24};
    if(blades)return blades;
    if(boss?.type==='reaver'&&g.unlocked>=3&&exposed(g,boss)&&d2(boss.x,boss.y,p.x,p.y)<(bladeRadius(g)+boss.r*.6)**2)
      return {mode:'blades',reason:'reaverOpen',target:boss,urgent:false};
    if(ward)return {mode:'spear',reason:'ward',target:ward,urgent:false};
    if(g.unlocked>=2&&(armor||boss))return {mode:'spear',reason:boss?(exposed(g,boss)?'bossOpen':'bossArmor'):armor.type==='prism'?'facet':'armor',target:boss||armor,urgent:false};
    return null;
  }
  function createAdvisor(){
    let shown=null,pending=null,since=0,last=null;
    return g=>{
      const key=g.round+(g.training?':'+g.training.index:'');
      if(last!==key||g.phase!=='playing'){shown=null;pending=null;last=key;}
      if(g.phase!=='playing')return null;
      const next=formationThreat(g),reason=next?.reason??null;
      if(reason===(shown?.reason??null)){shown=next;pending=reason;since=g.t;}
      else{
        if(reason!==pending){pending=reason;since=g.t;}
        const delay=!next ? .34 : next.mode===shown?.mode ? 0 : .18;
        if(next?.urgent||g.t-since>=delay)shown=next;
      }
      if(shown?.shot&&!g.hostile.includes(shown.shot))shown={...shown,shot:null};
      if(shown?.target&&shown.target.hp<=0)shown={...shown,target:null};
      if(shown?.hazard&&shown.hazard.end<=g.t)shown={...shown,hazard:null};
      if(shown?.mode==='ring'&&g.drones<3)shown=null;
      return shown;
    };
  }
  function earnedBadges(g){
    if(g.legacyRun||g.kind==='sortie')return [];
    if(g.phase==='trained')return ['certified'];
    if(g.phase!=='won'&&g.phase!=='lost'||g.kind==='training')return [];
    const badges=[];
    if(g.phase==='won'&&g.kind==='campaign'){
      badges.push('liberator');
      if(!g.retries&&g.protocol!=='scout'&&g.stats.hits<=5)badges.push('cleanRun');
      if(!g.retries&&g.protocol==='overclock')badges.push('ace');
    }
    if(g.phase==='won'&&g.kind==='rush')badges.push('rushClear');
    if(g.stats.blocks>=75)badges.push('bulwark');
    if(g.stats.bladeKills>=30)badges.push('bladeMaster');
    if(g.kind==='endless'&&g.stats.sectors>=5)badges.push('endurance');
    return badges;
  }

  return {W,H,TAU,modes,create,resize,worldSize,sector,step,setMode,burst,choose,depart,reroll,rank,spawn,createAdvisor,guardRadius,bladeRadius,burstCost,capacity,fabricationCost,variant,patternRadius,patternDanger,beatLength,beatPhase,beatAt,chargeDuration,bladeContact,slowFactor,checkpoint,validCheckpoint,restore,retryCheckpoint,earnedBadges,multiplier,exposed,waveDuration,hazardPosition};
})();
