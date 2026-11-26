(() => {
  const {modes,worldSize}=Swarm;
  const nodes=new Map();
  const $=id=>{if(!nodes.has(id))nodes.set(id,document.getElementById(id));return nodes.get(id);};
  const cap=id=>id[0].toUpperCase()+id.slice(1);
  const t=(id,values={})=>copy[id].replace(/\{(\w+)\}/g,(_,key)=>String(values[key]));
  const write=(id,v)=>{const el=$(id);if(el.textContent!==v)el.textContent=v;};
  const numberFormat=new Intl.NumberFormat('en');
  const numeric=n=>numberFormat.format(n);
  const pad=(n,width)=>String(n).padStart(width,'0');
  const clock=s=>pad(Math.floor(s/60),2)+':'+pad(Math.floor(s)%60,2);
  const scale=(n,limit)=>'scaleX('+Math.max(0,Math.min(1,n/limit))+')';
  const svg=FlightRender.icon;
  document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=t(el.dataset.t);});

  const root=$('game'),canvas=$('canvas'),renderer=FlightRender.create(canvas),sound=FlightAudio.create();
  const screens={menu:'menu',paused:'pauseMenu',options:'options',bindings:'bindingsMenu',manual:'manualMenu',records:'recordsMenu',map:'mapMenu',changelog:'changelogMenu',draft:'draft',debrief:'debrief'};
  const protocols=Object.keys(Content.difficulty),forms=[...modes,'burst'];
  const browserReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchInput=matchMedia('(pointer: coarse)').matches;
  const settingsKeys=['audio','music','guide','reduced','autoFull'];
  const directions=['up','down','left','right'];
  const keys=new Set();
  const get=(k)=>{try{return localStorage.getItem('swarmwar.'+k);}catch{return null;}};
  const read=(k)=>{try{return JSON.parse(get(k));}catch{return null;}};
  const save=(k,v)=>{try{localStorage.setItem('swarmwar.'+k,JSON.stringify(v));}catch{}};
  const bindings=FlightBindings.create(read('bindings.v1'));
  const defaults={mute:get('muted')==='1',audio:true,music:true,guide:true,reduced:browserReduced,autoFull:true,protocol:'standard'};
  const saved=read('settings.v1')||{};
  const settings={...defaults};
  for(const key of ['mute',...settingsKeys])if(typeof saved[key]==='boolean')settings[key]=saved[key];
  if(protocols.includes(saved.protocol))settings.protocol=saved.protocol;

  const records={campaign:{},endless:{},rush:{},sortie:{}};
  const savedRecords=read('records.v2')||{};
  for(const kind of ['campaign','endless','rush','sortie'])for(const p of protocols){
    const item=savedRecords[kind]?.[p];
    if(!item||!Number.isSafeInteger(item.score)||item.score<0)continue;
    records[kind][p]={
      score:item.score,sectors:Number.isSafeInteger(item.sectors)&&item.sectors>=0?item.sectors:0,
      rank:['S','A','B','C','R'].includes(item.rank)?item.rank:null,fastest:Number.isFinite(item.fastest)&&item.fastest>0?item.fastest:null
    };
  }
  const checkpoints={};
  const savedCheckpoints=read('checkpoints.v1')||{};
  for(const kind of ['campaign','endless']){
    const data=savedCheckpoints[kind];
    if(data?.kind===kind&&Swarm.validCheckpoint(data))checkpoints[kind]=data;
  }
  const latestCheckpoint=()=>Object.values(checkpoints).sort((a,b)=>(b.savedAt||0)-(a.savedAt||0))[0];
  const canSave=()=>checkpoints[g.kind]?.seed===g.seed&&checkpoints[g.kind]?.round===g.round;
  const oldBadges=read('badges.v1');
  const badges=new Set(Content.badges.filter(id=>Array.isArray(oldBadges)&&oldBadges.includes(id)));
  let trained=read('training.v1')===true,newBest=false,newBadges=[];
  if(trained)badges.add('certified');
  const rushAvailable=()=>badges.has('liberator')||Object.values(records.campaign).some(record=>record.fastest);
  let inspecting=false,firing=false,releasePending=null,clearAimAfterRelease=false,padAimAngle=null,selectedChapter=0,mapTransit=false;
  let page='menu',optionsFrom='menu',manualFrom='menu',manualPage='forms',g=Swarm.create(42),adviser=Swarm.createAdvisor(),guide=null,aim=null,aimPoint=null,moveTouch=null,aimTouch=null,retryPoint=null;
  let bounds=worldSize(920,560),viewport=null,carry=0,previous=null,lastHud=-1,shownDraft=[],draftReadyAt=0,toastUntil=0,drawDirty=true,lastDraw=-Infinity;
  let hadFullscreen=false,intendedExit=false,requesting=false,padButtons=[],padIndex=null;
  const formNodes={},protocolNodes={},settingNodes={},manualNodes={},bindingNodes={};
  let pendingBinding=null;
  const toast=document.createElement('div');
  toast.className='utility-message';toast.hidden=true;toast.setAttribute('role','status');root.append(toast);

  function fullscreenElement(){return document.fullscreenElement||document.webkitFullscreenElement||null;}
  function iconButton(id,name){
    const el=$(id),text=t(name);
    if(el.dataset.icon===name)return;
    el.dataset.icon=name;el.innerHTML=svg(name)+'<span class="icon-label"></span>';
    el.querySelector('.icon-label').textContent=text;el.title=text;el.setAttribute('aria-label',text);
  }
  function utilities(){
    iconButton('sound',settings.mute?'soundOff':'soundOn');
    $('sound').setAttribute('aria-pressed',String(!settings.mute));
    iconButton('fullscreen',fullscreenElement()?'exitFullscreen':'fullscreen');
    $('fullscreen').setAttribute('aria-pressed',String(!!fullscreenElement()));
    iconButton('pause','pause');
    $('pause').hidden=page!=='playing';
  }
  function failedFullscreen(){
    requesting=false;
    toast.textContent=t('fullUnavailable');toast.hidden=false;toastUntil=performance.now()+2900;
  }
  function enterFullscreen(notify=true){
    if(fullscreenElement()||requesting)return;
    const fn=root.requestFullscreen||root.webkitRequestFullscreen||root.webkitRequestFullScreen;
    if(!fn){if(notify)failedFullscreen();return;}
    try{
      requesting=true;
      const result=fn.call(root);
      if(result?.then)result.then(()=>{requesting=false;},()=>{requesting=false;if(notify)failedFullscreen();});
      else requesting=false;
    }catch{requesting=false;if(notify)failedFullscreen();}
  }
  function toggleFullscreen(){
    if(!fullscreenElement()){enterFullscreen();return;}
    const fn=document.exitFullscreen||document.webkitExitFullscreen||document.webkitCancelFullScreen;
    if(!fn)return;
    intendedExit=true;
    try{const result=fn.call(document);if(result?.catch)result.catch(()=>{intendedExit=false;});}
    catch{intendedExit=false;}
  }
  function fullscreenChanged(){
    const isFull=!!fullscreenElement();
    if(hadFullscreen&&!isFull&&!intendedExit&&page==='playing')pause();
    hadFullscreen=isFull;intendedExit=false;requesting=false;
    resize();utilities();
  }
  for(const evt of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(evt,fullscreenChanged);
  $('fullscreen').addEventListener('click',toggleFullscreen);

  for(const id of forms){
    const b=document.createElement('button');
    b.type='button';b.className='formation';
    b.innerHTML=svg(id)+'<span class="formation-title"></span><span class="form-status"></span><kbd></kbd>'+(id==='burst'?'<i class="formation-charge"></i>':'');
    b.querySelector('.formation-title').textContent=t(id+'Name');
    b.querySelector('kbd').textContent=keyLabel(id,true);
    b.addEventListener('click',event=>{command(id);if(event.detail>0)b.blur();});
    $('formations').append(b);
    formNodes[id]={b,status:b.querySelector('.form-status'),charge:b.querySelector('.formation-charge'),key:b.querySelector('kbd')};
  }
  for(const id of protocols){
    const b=document.createElement('button');b.type='button';b.textContent=t(id);
    b.addEventListener('click',()=>{settings.protocol=id;save('settings.v1',settings);menuHud();});
    $('protocols').append(b);protocolNodes[id]=b;
  }
  for(const id of settingsKeys){
    const row=document.createElement('div');row.className='setting';
    row.innerHTML='<div><strong></strong><small></small></div><button class="toggle" type="button"></button>';
    row.querySelector('strong').textContent=t(id);row.querySelector('small').textContent=t(id+'Help');
    const b=row.querySelector('button');b.setAttribute('aria-label',t(id));
    b.addEventListener('click',()=>changeSetting(id));
    $('settingList').append(row);settingNodes[id]=b;
  }
  for(const id of ['forms','threats','bosses']){
    const b=document.createElement('button');b.type='button';b.textContent=t('manual'+cap(id));
    b.addEventListener('click',()=>{manualPage=id;manualHud();});
    $('manualTabs').append(b);manualNodes[id]=b;
  }
  for(const id of [...directions,...forms]){
    const row=document.createElement('div');row.className='binding';
    row.innerHTML='<span></span><button type="button"></button>';
    row.querySelector('span').textContent=t('key'+cap(id));
    const b=row.querySelector('button');b.addEventListener('click',()=>{
      pendingBinding=id;bindingsHud(t('keyChoose',{action:t('key'+cap(id))}));
    });
    $('bindingList').append(row);bindingNodes[id]=b;
  }
  function keyLabel(id,short=false){
    const key=bindings.display(id);
    return short&&key==='SPACE'?'SPC':key;
  }
  const displayMove=()=>['up','left','down','right'].map(id=>keyLabel(id,true)).join('/');
  function controlsHud(){
    const values={move:displayMove(),forms:modes.map(id=>keyLabel(id,true)).join('/'),burst:keyLabel('burst')};
    write('pauseControls',t(padIndex!==null?'controlsPad':touchInput?'controlsTouch':'controlsDesktop',values));write('optionsControls',t('controls',values));
    write('quickControls',t('quickControls',values));
    for(const id of forms)formNodes[id].key.textContent=keyLabel(id,true);
  }
  function bindingsHud(message=''){
    for(const [id,b] of Object.entries(bindingNodes)){
      const pending=id===pendingBinding;
      b.className=pending?'listening':'';
      b.textContent=pending?'…':keyLabel(id,true);
      b.setAttribute('aria-label',t('key'+cap(id))+' / '+keyLabel(id));
    }
    write('bindingStatus',message);controlsHud();
  }
  function changeSetting(id){
    settings[id]=!settings[id];
    save('settings.v1',settings);sound.wake();sound.configure(settings);
    if(settings.audio&&!settings.mute)sound.cue('switch');
    if(id==='guide'&&!settings.guide)guide=null;
    drawDirty=true;utilities();optionsHud();
  }
  $('sound').addEventListener('click',()=>changeSetting('mute'));

  function zoneName(){return g.kind==='training'?t('lab'):t(Swarm.sector(g).id);}
  function objective(){
    if(g.kind==='training')return t('trainingCount',{n:Math.min(4,g.training.index+1)});
    return g.bossDefeated?t('cleared'):g.bossSpawned?t('boss'):g.kind==='rush'?t('rushPrep'):g.wave>=Swarm.sector(g).waves.length?t('boss'):t('wave',{n:g.wave+1})+' · '+t(Swarm.sector(g).waves[g.wave].name);
  }
  function menuHud(){
    chapterButtons($('menuRoute'),true);
    for(const id of protocols)protocolNodes[id].setAttribute('aria-pressed',String(id===settings.protocol));
    write('protocolNote',t(settings.protocol+'Note'));
    const record=records.campaign[settings.protocol],checkpoint=latestCheckpoint();
    $('continueRun').hidden=$('savedStatus').hidden=!checkpoint;
    if(checkpoint){
      write('continueRun',t('continueRun',{kind:t(checkpoint.kind)}));
      write('savedStatus',t('savedStatus',{protocol:t(checkpoint.protocol),n:checkpoint.round+1}));
    }
    $('rush').hidden=!rushAvailable();
    write('training',t(trained?'trainingPassed':'trainingAction'));
    write('menuStatus',record?t('recordLine',{protocol:t(settings.protocol),score:numeric(record.score)}):t('noRecord'));
  }
  const chapterPositions=[[13,76],[31,33],[50,62],[68,21],[88,47]];
  function chapterButtons(container,mini=false){
    container.replaceChildren();
    Content.sectors.forEach((sector,index)=>{
      const b=document.createElement('button');b.type='button';b.className='route-node'+(index===selectedChapter?' selected':'')+(mapTransit&&index<g.round?' completed':'');
      b.setAttribute('aria-label',t('chapterNumber',{n:index+1})+' · '+t(sector.id));b.setAttribute('aria-pressed',String(index===selectedChapter));
      b.innerHTML='<span class="node-mark">'+String(index+1).padStart(2,'0')+'</span><span class="node-name"></span>';
      b.querySelector('.node-name').textContent=t(sector.id);
      if(!mini){b.style.left=chapterPositions[index][0]+'%';b.style.top=chapterPositions[index][1]+'%';}
      b.addEventListener('click',()=>{if(mini){mapTransit=false;selectedChapter=index;show('map');}else{selectedChapter=index;mapHud();}});
      container.append(b);
    });
  }
  function mapHud(){
    const sector=Content.sectors[selectedChapter],current=mapTransit&&selectedChapter===g.round;
    chapterButtons($('mapNodes'));
    write('chapterIndex',t('chapterNumber',{n:selectedChapter+1})+' / 05');write('chapterTitle',t(sector.id));write('chapterBrief',t(sector.id+'Brief'));
    write('chapterRules',t(sector.id+'Rules'));
    const list=$('chapterPhases');list.replaceChildren();
    [...sector.waves.map(w=>t(w.name)),t(sector.bossTitle||sector.boss)].forEach((name,i)=>{
      const row=document.createElement('li');row.textContent=(i<4?t('phaseWave',{n:i+1}):t('phaseBoss'))+' · '+name;list.append(row);
    });
    write('mapStatus',t(mapTransit?(current?'routeContinue':'routeInspect'):'routeStart'));
    write('mapDeploy',t(mapTransit?'departChapter':'startCampaign'));$('mapDeploy').disabled=mapTransit&&!current;
    $('mapPractice').hidden=mapTransit;
  }
  function openMap(){mapTransit=false;selectedChapter=0;show('map');}
  function releaseHud(){
    const list=$('releaseList');list.replaceChildren();
    for(const release of releaseNotes){
      const article=document.createElement('article'),title=document.createElement('h3'),date=document.createElement('span'),body=document.createElement('ul');
      title.textContent=release.version+' · '+release.title;date.textContent=release.date;
      for(const text of release.items){const item=document.createElement('li');item.textContent=text;body.append(item);}
      article.append(title);article.append(date);article.append(body);list.append(article);
    }
  }
  function optionsHud(){
    for(const id of settingsKeys){
      const b=settingNodes[id];b.textContent=t(settings[id]?'on':'off');b.setAttribute('aria-pressed',String(settings[id]));
    }
  }
  function manualHud(){
    for(const [id,b] of Object.entries(manualNodes))b.setAttribute('aria-pressed',String(id===manualPage));
    const list=$('manualList'),items=manualPage==='forms'?forms:manualPage==='threats'?
      ['skimmer','sentry','ram','splitter','mine','prism','pulsar','weaver','bulwark','debris','surge','wave','sweep']:Content.sectors.map(s=>s.bossTitle||s.boss);
    list.replaceChildren();
    for(const id of items){
      const card=document.createElement('div'),form=manualPage==='forms';
      card.className='manual-card';
      card.innerHTML=(form?svg(id):FlightRender.contactIcon(id))+'<strong></strong><p></p>';
      const title=card.querySelector('strong');
      title.textContent=t(manualPage==='bosses'?id:id+'Name');
      if(form){
        const key=document.createElement('kbd');key.textContent=keyLabel(id);title.append(key);
      }
      card.querySelector('p').textContent=t(id+'Manual',form?{key:keyLabel(id)}:{});list.append(card);
    }
  }
  function recordsHud(){
    const list=$('recordList');
    list.replaceChildren();
    const row=(parts)=>{
      const el=document.createElement('div');el.className='record-row';
      for(const text of parts){const cell=document.createElement('span');cell.textContent=text;el.append(cell);}
      list.append(el);
    };
    row([t('recordProtocol'),t('recordCampaign'),t('recordEndless')]);
    for(const id of protocols){
      const c=records.campaign[id],e=records.endless[id];
      row([t(id),c?t('recordCampaignSummary',{score:numeric(c.score),rank:c.rank||t('dash')})+(c.fastest?' · '+t('recordBestTime',{time:clock(c.fastest)}):''):t('dash'),
        e?t('recordEndlessSummary',{score:numeric(e.score),n:e.sectors}):t('dash')]);
    }
    const rushTimes=protocols.filter(id=>records.rush[id]?.fastest).map(id=>t(id)+' '+clock(records.rush[id].fastest));
    $('rushRecord').hidden=false;
    write('rushRecord',rushTimes.length?t('rushRecord',{records:rushTimes.join(' · ')}):rushAvailable()?t('dash'):t('rushLocked'));
    const shelf=$('badgeList');shelf.replaceChildren();
    for(const id of Content.badges){
      const badge=document.createElement('div'),earned=badges.has(id);
      badge.className='badge'+(earned?' earned-badge':'');
      badge.innerHTML='<span class="mark" aria-hidden="true"></span><strong></strong><small></small>';
      badge.querySelector('.mark').textContent=earned?'◆':'◇';
      badge.querySelector('strong').textContent=t(id+'Badge');
      badge.querySelector('small').textContent=t(id+'Goal');
      badge.setAttribute('aria-label',t(id+'Badge')+' · '+t(earned?'badgeEarned':'badgeLocked')+' · '+t(id+'Goal'));
      shelf.append(badge);
    }
  }
  function draftHud(){
    const list=$('upgradeList');
    write('rerollDraft',t('rerollDraft',{n:g.rerolls||0}));$('rerollDraft').disabled=!g.rerolls||!g.draft.length;$('rerollDraft').title=t('rerollHelp');
    list.replaceChildren();shownDraft=g.draft.length?g.draft.slice():['continue'];
    const waveDraft=g.draftReason==='wave';
    write('draftKicker',t(waveDraft?'waveDraftKicker':'draftKicker',{sector:zoneName(),n:g.wave+1}));
    const next=Content.sectors[(g.round+1)%Content.sectors.length].id;
    write('draftNext',t(waveDraft?'waveDraftNext':'draftNext',{sector:t(next),wave:t(Swarm.sector(g).waves[g.wave+1]?.name||'boss')}));
    const installed=Object.entries(g.upgrades).map(([id,n])=>t(id+'Name')+(n>1?' '+n:''));
    write('buildSummary',installed.length?t('buildInstalled',{modules:installed.join(' · ')}):t('buildEmpty'));
    for(const [i,id] of shownDraft.entries()){
      const b=document.createElement('button');b.type='button';b.className=id==='continue'?'button primary':'upgrade';
      if(id==='continue')b.textContent=t('continue');
      else{
        b.innerHTML='<span class="module-icon">'+FlightRender.icon(Content.upgrades[id].group==='all'?id:Content.upgrades[id].group)+'</span><span class="micro"></span><strong></strong><em class="upgrade-effect"></em><small></small><kbd></kbd>';
        b.querySelector('.micro').textContent=(Content.upgrades[id].slot?t('group'+cap(Content.upgrades[id].group))+' · '+t('coreChoice'):(Content.upgrades[id].requires?t('evolution'):t('group'+cap(Content.upgrades[id].group)))+' · '+t('upgradeLevel',{n:(g.upgrades[id]||0)+1}));
        b.querySelector('strong').textContent=t(id+'Name');const description=t(id+'Desc').split('. ');const effect=description.shift();b.querySelector('.upgrade-effect').textContent=effect.endsWith('.')?effect:effect+'.';b.querySelector('small').textContent=description.join('. ');
        b.querySelector('kbd').textContent=t('equipModule');
      }
      b.addEventListener('click',event=>{if(!draftClickBlocked(event))pick(id);});list.append(b);
    }
  }
  function debriefHud(){
    const list=$('result'),outcome=g.phase;
    list.replaceChildren();
    const caption=outcome==='won'&&g.kind==='rush'?'rushWon':outcome==='won'&&g.kind==='sortie'?'sortieWon':outcome;
    $('deathCause').hidden=outcome!=='lost';if(outcome==='lost')write('deathCause',t('deathCause',{source:copy[g.lastHit+'Name']?t(g.lastHit+'Name'):t('hazardContact')}));
    write('debriefKicker',t(caption+'Kicker')+(outcome==='trained'?'':' / '+t(g.protocol))+(g.kind==='sortie'?' / '+t('sortie'):'')+(g.legacyRun?' / '+t('legacyRun'):''));
    write('debriefTitle',t(caption+'Title'));write('debriefText',t(caption+'Text',{sector:zoneName()}));
    write('retry',t(outcome==='trained'?'playCampaign':retryPoint?'retryWave':'retry'));
    $('debriefNote').hidden=outcome!=='lost';
    if(outcome==='lost'){
      const lesson={wave:'lossWave',sweep:'lossSweep',weaver:'lossBeam',beam:'lossBeam',debris:'lossDebris',surge:'lossSurge',mine:'lossMine',ram:'lossRam',reaver:'lossReaver',sentry:'lossSentry',prism:'lossSentry',splitter:'lossPack',skimmer:'lossPack'};
      const advice=['skimmer','splitter'].includes(g.lastHit)&&g.unlocked<3?'lossPackLocked':lesson[g.lastHit]||'lossDefault';
      write('debriefNote',t(advice)+(retryPoint?' '+t('retryHelp'):''));
    }
    const stats=outcome==='trained'?[[t('statDrills'),'4 / 4'],[t('statTime'),clock(g.t)]]:
      [[t(newBest?'statRecord':'statScore'),numeric(g.score)],[t('statTime'),clock(g.t)],[t('statSector'),g.stats.sectors],
        [t('statDrones'),g.peak],[t('statKills'),g.kills],[t('statSwitches'),g.stats.switches],[t('statBlocks'),g.stats.blocks],[t('statChain'),g.stats.bestChain],[t('statCounters'),g.stats.counterSalvos],[t('statInterrupts'),g.stats.interrupts]];
    const installed=Object.entries(g.upgrades).map(([id,n])=>t(id+'Name')+(n>1?' '+n:''));
    $('resultBuild').hidden=!installed.length;if(installed.length)write('resultBuild',t('resultBuild',{modules:installed.join(' · ')}));
    const rank=Swarm.rank(g);
    $('earned').hidden=!newBadges.length;
    if(newBadges.length)write('earned',t(newBadges.length===1?'newBadge':'newBadges',{name:newBadges.map(id=>t(id+'Badge')).join(' · ')}));
    if(rank)stats.push([t('statRank'),rank]);
    if(g.kind==='campaign')stats.push([t('statRetries'),g.retries||0]);
    for(const [name,value] of stats){
      const cell=document.createElement('div');cell.innerHTML='<span></span><strong></strong>';
      cell.querySelector('span').textContent=name;cell.querySelector('strong').textContent=value;list.append(cell);
    }
  }
  function recordResult(){
    retryPoint=g.kind==='campaign'&&g.phase==='lost'&&canSave()?checkpoints.campaign:null;
    newBadges=Swarm.earnedBadges(g).filter(id=>!badges.has(id));
    if(newBadges.length){newBadges.forEach(id=>badges.add(id));save('badges.v1',[...badges]);}
    if(g.phase==='trained'){trained=true;save('training.v1',true);return;}
    if(checkpoints[g.kind]?.seed===g.seed){delete checkpoints[g.kind];save('checkpoints.v1',checkpoints);}
    if(g.legacyRun)return;
    const group=records[g.kind],old=group[g.protocol],rank=Swarm.rank(g);
    newBest=g.score>(old?.score??0);
    const ranks=['S','A','B','C','R',null];
    group[g.protocol]={
      score:Math.max(old?.score??0,g.score),sectors:Math.max(old?.sectors??0,g.stats.sectors),
      rank:ranks[Math.min(ranks.indexOf(old?.rank??null),ranks.indexOf(rank))],
      fastest:g.phase==='won'&&!g.retries?Math.min(old?.fastest??Infinity,g.t):old?.fastest??null
    };
    save('records.v2',records);
  }

  function focus(id){
    if(id)$(id).focus({preventScroll:true});
    else document.activeElement?.blur?.();
  }
  function show(next,initial=false){
    page=next;inspecting=false;root.dataset.inspect='false';$('inspectBar').hidden=true;root.dataset.page=page;drawDirty=true;pendingBinding=null;keys.clear();firing=false;releasePending=null;clearAimAfterRelease=false;padAimAngle=null;if(g.weapon){g.weapon.held=false;}aim=null;aimPoint=null;moveTouch=null;aimTouch=null;carry=0;lastHud=-1;
    if(page!=='playing')toast.hidden=true;
    for(const [screen,id] of Object.entries(screens))$(id).hidden=screen!==page;
    $('flight').hidden=page!=='playing';
    if(page==='menu'){menuHud();if(!initial)focus(latestCheckpoint()?'continueRun':'campaign');}
    else if(page==='map'){mapHud();focus('mapTitle');}
    else if(page==='changelog'){releaseHud();focus('changelogBack');}
    else if(page==='options'){optionsHud();focus('optionsBack');}
    else if(page==='bindings'){bindingsHud();focus('bindingsBack');}
    else if(page==='records'){recordsHud();focus('recordsBack');}
    else if(page==='manual'){manualHud();focus('manualBack');}
    else if(page==='paused'){
      const saved=canSave();
      write('pauseInfo',t(g.kind)+' / '+t('pauseInfo',{sector:zoneName(),objective:objective(),time:clock(g.t)})+(saved?' '+t('pauseSaved'):''));
      write('retire',t(saved?'saveExit':'retire'));focus('resume');
    }
    else if(page==='draft'){draftReadyAt=(previous??0)+450;draftHud();focus('draftTitle');}
    else if(page==='debrief'){debriefHud();focus('retry');}
    else if(page==='playing'){hud();focus(null);}
    utilities();
  }
  function launch(kind,chapter=0){
    const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
    begin(Swarm.create(seed,{kind,chapter,protocol:settings.protocol,bounds}));
  }
  function begin(game){
    g=game;adviser=Swarm.createAdvisor();guide=null;newBest=false;newBadges=[];retryPoint=null;
    sound.wake();sound.configure(settings);
    if(settings.autoFull)enterFullscreen(false);
    show('playing');
    drain();
  }
  function pick(id){
    if(page!=='draft'||!Swarm.choose(g,id))return;
    const data=Swarm.checkpoint(g);
    if(data){checkpoints[g.kind]={...data,savedAt:Date.now()};save('checkpoints.v1',checkpoints);}
    sound.wake();adviser=Swarm.createAdvisor();guide=null;if(g.phase==='transit'){mapTransit=true;selectedChapter=g.round;show('map');}else show('playing');drain();
  }
  const draftClickBlocked=event=>event.detail>0&&(previous??0)<draftReadyAt;
  function pause(){if(page==='playing')show('paused');}
  function inspectField(){
    if(page!=='paused')return;
    inspecting=!inspecting;root.dataset.inspect=String(inspecting);$('pauseMenu').hidden=inspecting;$('inspectBar').hidden=!inspecting;$('flight').hidden=!inspecting;if(inspecting)hud();drawDirty=true;focus(inspecting?'inspectBack':'resume');
  }
  $('inspectField').addEventListener('click',inspectField);$('inspectBack').addEventListener('click',inspectField);$('inspectResume').addEventListener('click',()=>resume());
  function resume(){
    if(page!=='paused')return;
    sound.wake();show('playing');
  }
  function options(from){optionsFrom=from;show('options');}
  function openManual(from){manualFrom=from;manualPage='forms';show('manual');}
  for(const kind of ['campaign','endless','training','rush'])$(kind).addEventListener('click',()=>{
    if(kind==='campaign')openMap();else if(kind!=='rush'||rushAvailable())launch(kind);
  });
  $('viewMap').addEventListener('click',openMap);
  $('mapBack').addEventListener('click',()=>show('menu'));
  $('mapDeploy').addEventListener('click',()=>{
    if(mapTransit){if(selectedChapter===g.round&&Swarm.depart(g)){show('playing');drain();}}
    else launch('campaign');
  });
  $('mapPractice').addEventListener('click',()=>launch('sortie',selectedChapter));
  $('changelog').addEventListener('click',()=>show('changelog'));
  $('changelogBack').addEventListener('click',()=>show('menu'));
  $('continueRun').addEventListener('click',()=>{
    const game=Swarm.restore(latestCheckpoint(),bounds);
    if(game)begin(game);
  });
  $('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);
  $('settings').addEventListener('click',()=>options('menu'));$('pauseSettings').addEventListener('click',()=>options('paused'));
  $('optionsBack').addEventListener('click',()=>show(optionsFrom));
  $('editKeys').addEventListener('click',()=>show('bindings'));$('bindingsBack').addEventListener('click',()=>show('options'));
  $('restoreKeys').addEventListener('click',()=>{
    pendingBinding=null;bindings.reset();save('bindings.v1',bindings.snapshot());bindingsHud(t('keyReset'));
  });
  $('manual').addEventListener('click',()=>openManual('menu'));$('pauseManual').addEventListener('click',()=>openManual('paused'));
  $('manualBack').addEventListener('click',()=>show(manualFrom));
  $('records').addEventListener('click',()=>show('records'));$('recordsBack').addEventListener('click',()=>show('menu'));
  $('retry').addEventListener('click',()=>{
    const game=retryPoint?Swarm.retryCheckpoint(retryPoint,bounds):null;
    if(game){const data=Swarm.checkpoint(game);checkpoints.campaign={...data,savedAt:Date.now()};save('checkpoints.v1',checkpoints);begin(game);}
    else launch(g.phase==='trained'?'campaign':g.kind,g.kind==='sortie'?g.round:0);
  });
  $('return').addEventListener('click',()=>show('menu'));
  $('retire').addEventListener('click',()=>show('menu'));
  $('rerollDraft').addEventListener('click',event=>{if(!draftClickBlocked(event)&&Swarm.reroll(g)){draftHud();focus('draftTitle');}});
  $('draftBack').addEventListener('click',event=>{if(!draftClickBlocked(event))show('menu');});

  function command(id,steer=aim){
    if(page!=='playing'||g.bossDefeated)return;
    if(id==='burst'){
      if(steer&&Math.hypot(steer.x-g.player.x,steer.y-g.player.y)>4)g.player.angle=Math.atan2(steer.y-g.player.y,steer.x-g.player.x);
      Swarm.burst(g);
    }else if(!Swarm.setMode(g,id)&&g.mode!==id){toast.textContent=t(id==='spear'?'lockedSpear':'lockedBlades');toast.hidden=false;toastUntil=performance.now()+1800;}
    drain();hud();
  }
  function cycle(direction){
    const i=modes.indexOf(g.mode);
    command(modes[(i+direction+g.unlocked)%g.unlocked]);
  }
  function back(){
    if(page==='playing')pause();
    else if(page==='paused')resume();
    else if(page==='options')show(optionsFrom);
    else if(page==='manual')show(manualFrom);
    else if(page==='bindings'){if(pendingBinding){pendingBinding=null;bindingsHud();}else show('options');}
    else if(page==='records'||page==='debrief'||page==='map'||page==='changelog')show('menu');
  }
  addEventListener('keydown',event=>{
    if(event.metaKey||event.ctrlKey||event.altKey)return;
    const key=event.key.toLowerCase();
    if(page==='bindings'&&pendingBinding){
      event.preventDefault();
      if(event.repeat)return;
      if(key==='escape'){pendingBinding=null;bindingsHud();return;}
      if(!bindings.set(pendingBinding,key)){bindingsHud(t('keyInvalid'));return;}
      const name=t('key'+cap(pendingBinding)),value=keyLabel(pendingBinding);
      pendingBinding=null;save('bindings.v1',bindings.snapshot());bindingsHud(t('keySaved',{action:name,key:value}));return;
    }
    if(page==='paused'&&(key==='p'||key==='h')){event.preventDefault();if(!event.repeat){if(key==='p')resume();else inspectField();}return;}
    if(key==='escape'){
      if(event.repeat)return;
      if(['playing','paused','options','manual','bindings','records','debrief','map','changelog'].includes(page))event.preventDefault();
      back();return;
    }
    if(key==='f'&&!event.repeat){event.preventDefault();toggleFullscreen();return;}
    if(page==='draft'&&(forms.includes(bindings.action(key))||key===' ')){event.preventDefault();return;}
    if(page!=='playing')return;
    const action=bindings.action(key);
    if(action||['q','e','p'].includes(key))event.preventDefault();
    if(directions.includes(action)){keys.add(key);return;}
    if(event.repeat)return;
    if(forms.includes(action))command(action);
    else if(key==='q')cycle(-1);
    else if(key==='e')cycle(1);
    else if(key==='p')pause();
  });
  addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
  addEventListener('blur',()=>{keys.clear();firing=false;moveTouch=null;aimTouch=null;aim=null;aimPoint=null;if(!requesting)pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});

  const screenPoint=event=>{
    const r=canvas.getBoundingClientRect();
    return {x:event.clientX-r.left,y:event.clientY-r.top};
  };
  function aimAt(event){
    const r=canvas.getBoundingClientRect(),p=screenPoint(event);
    aimPoint={x:p.x/Math.max(1,r.width),y:p.y/Math.max(1,r.height)};
    aim=FlightRender.project(FlightRender.camera(g),aimPoint.x,aimPoint.y);
  }
  canvas.addEventListener('pointerdown',event=>{
    if(page!=='playing')return;
    document.activeElement?.blur?.();
    if(event.pointerType==='mouse'){if(event.button!==0)return;aimAt(event);firing=true;try{canvas.setPointerCapture(event.pointerId);}catch{}return;}
    const p=screenPoint(event),r=canvas.getBoundingClientRect();
    if(!moveTouch&&p.x<r.width*.61){moveTouch={id:event.pointerId,from:p,to:p};}
    else if(aimTouch===null){aimTouch=event.pointerId;aimAt(event);firing=true;}
    else return;
    try{canvas.setPointerCapture(event.pointerId);}catch{}
  });
  canvas.addEventListener('pointermove',event=>{
    if(page!=='playing')return;
    if(event.pointerType==='mouse'||aimTouch===event.pointerId){if(event.pointerType==='mouse')padAimAngle=null;aimAt(event);}
    else if(moveTouch?.id===event.pointerId)moveTouch.to=screenPoint(event);
  });
  canvas.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'&&!firing){aim=null;aimPoint=null;}});
  for(const evt of ['pointerup','pointercancel','lostpointercapture']){
    canvas.addEventListener(evt,event=>{
      const triggerPointer=event.pointerType==='mouse'||aimTouch===event.pointerId;
      if(triggerPointer){
        if(evt==='pointerup'&&firing&&page==='playing'&&g.mode==='spear'){aimAt(event);releasePending={...aim};}
        else if(evt!=='pointerup'&&firing){g.weapon.held=false;releasePending=null;}
        firing=false;
      }
      if(moveTouch?.id===event.pointerId)moveTouch=null;
      if(aimTouch===event.pointerId){aimTouch=null;if(evt==='pointerup')clearAimAfterRelease=true;else{aim=null;aimPoint=null;clearAimAfterRelease=false;}}
    });
  }

  function resize(){
    const r=canvas.getBoundingClientRect();
    if(r.width<1||r.height<1)return;
    // A changed play area invalidates held movement and pointer bearings.
    // Freeze before rescaling instead of leaving the core exposed to old input.
    if(viewport&&(Math.abs(r.width-viewport.w)>1||Math.abs(r.height-viewport.h)>1))pause();
    viewport={w:r.width,h:r.height};
    const ratio=Math.min(2,devicePixelRatio||1,Math.sqrt(5900000/(r.width*r.height)));
    const w=Math.max(1,Math.round(r.width*ratio)),h=Math.max(1,Math.round(r.height*ratio));
    if(w!==canvas.width){canvas.width=w;drawDirty=true;}
    if(h!==canvas.height){canvas.height=h;drawDirty=true;}
    const next=worldSize(r.width,r.height);
    if(Math.abs(next.w-bounds.w)>.03||Math.abs(next.h-bounds.h)>.03){
      bounds=next;drawDirty=true;Swarm.resize(g,bounds);aim=null;aimPoint=null;moveTouch=null;aimTouch=null;
    }
  }

  function tacticalHud(){
    const panel=$('tactical');
    panel.hidden=!guide;
    if(!guide)return;
    const mode=guide.mode;
    const state=!mode?'evade':mode===g.mode?'hold':'switch';
    const className='tactical hud-panel '+state;
    if(panel.className!==className)panel.className=className;
    write('tacticalLabel',t('tactical'+cap(state)));
    $('tacticalOrder').hidden=!mode;
    if(mode)write('tacticalOrder',keyLabel(mode,true)+' / '+t(mode+'Name'));
    write('tacticalReason',t('reason'+cap(guide.reason),{name:guide.target?.boss?t(Swarm.sector(g).bossTitle||guide.target.type):''}));
  }
  function announcementHud(){
    const banner=$('announcement'),hint=$('hint');
    if(g.kind==='training'){
      const drill=g.training,index=drill.index;
      banner.hidden=false;banner.style.opacity=1;hint.hidden=true;
      write('announceLabel',drill.success?t('drillSuccess'):t('trainingCount',{n:index+1}));
      write('announceTitle',t('drill'+index+'Title'));write('announceBody',t('drill'+index+'Text',{key:keyLabel(forms[index])}));
      return;
    }
    const data=g.banner,s=Swarm.sector(g);
    banner.hidden=!data||g.t>=data.until;
    if(!banner.hidden){
      banner.style.opacity=settings.reduced?1:Math.min(1,(data.until-g.t)*2.2);
      const [label,title,body]=data.id==='clear'?['clearBanner',s.bossTitle||s.boss,'clearBrief']:
        data.id==='sector'?['sectorBanner',s.id,s.id+'Brief']:
        data.id==='wave'?['waveBanner','wave',g.wave===1?'wave2Brief':'wave3Brief']:['bossBanner',s.bossTitle||s.boss,(s.bossTitle||s.boss)+'Brief'];
      write('announceLabel',t(label,{n:data.id==='sector'?g.round+1:g.wave+1}));
      write('announceTitle',data.id==='wave'?t(s.waves[g.wave]?.name||'boss'):t(title,{n:g.wave+1}));
      write('announceBody',data.id==='wave'?t(s.waves[g.wave].name+'Brief'):data.id==='sector'?t(body)+' '+t(Swarm.variant(g).id):t(body));
    }
    hint.hidden=!g.tip||g.t>=g.tip.until||!!guide;
    if(!hint.hidden){
      const id=g.tip.id,value={move:displayMove(),key:forms.includes(id)?keyLabel(id):''};
      write('hint',t(touchInput&&id==='move'?'tipTouch':'tip'+cap(id),value));
    }
  }
  function hud(){
    const p=g.player,boss=g.enemies.find(e=>e.boss),view=FlightRender.camera(g);root.dataset.hud=(p.x-view.x)/view.w<.4&&(p.y-view.y)/view.h<.17?'clear':'normal';root.dataset.utility=(p.x-view.x)/view.w>.8&&(p.y-view.y)/view.h<.17?'clear':'normal';
    const screen=o=>({x:(o.x-view.x)/view.w,y:(o.y-view.y)/view.h});
    const underDock=o=>{const s=screen(o);return s.x>.25&&s.x<.75&&s.y>.83;};
    root.dataset.dock=underDock(p)||g.enemies.some(e=>e.hp>0&&underDock(e))?'clear':'normal';
    const underBanner=o=>{const s=screen(o);return s.x>.28&&s.x<.72&&s.y>.07&&s.y<.25;};
    root.dataset.announcement=underBanner(p)||g.enemies.some(e=>e.hp>0&&underBanner(e))?'clear':'normal';
    write('clock',clock(g.t));write('operation',t(g.kind)+(g.kind==='training'?'':' / '+pad(g.round+1,2)));
    write('sectorName',zoneName());write('objective',objective());
    $('wavePips').hidden=g.kind==='training'||g.kind==='rush';
    const duration=g.kind==='training'?0:Swarm.waveDuration(g);
    $('waveTrack').hidden=!duration;
    if(duration)$('waveFill').style.transform=scale(g.t-g.waveStart,duration);
    [...$('wavePips').children].forEach((el,i)=>{el.className=i===g.wave?'now':i<g.wave?'past':'';});
    $('boss').hidden=!boss;
    if(boss){
      write('bossName',t(Swarm.sector(g).bossTitle||boss.type));write('bossPhase',t(Swarm.exposed(g,boss)?'exposed':boss.hp<boss.max*.5?'enraged':'shielded'));
      $('bossFill').style.transform=scale(boss.hp,boss.max);
    }
    write('hullNumber',Math.round(p.hp)+' / '+p.max);
    $('hullFill').style.transform=scale(p.hp,p.max);
    $('hullFill').style.background=p.hp/p.max<=.3?'#ff887f':'';root.dataset.hull=p.hp/p.max<=.3?'critical':'stable';
    write('droneCount',pad(g.drones,3));
    $('droneCount').title=t('swarmCapacity',{n:Swarm.capacity(g)});
    write('fabrication',g.drones>=Swarm.capacity(g)?t('atCapacity'):t('fabrication',{parts:g.parts,cost:Swarm.fabricationCost(g)}));$('fabrication').title=t('fabricationHelp');write('score',pad(g.score,6));
    const chain=Swarm.multiplier(g);
    $('chain').hidden=chain===1;if(chain>1)write('chain',t('chain',{n:chain}));
    $('support').hidden=!g.relay&&!g.repair;
    write('support',[g.relay?t('relayName'):'',g.repair?t('medicName'):''].filter(Boolean).join(' · '));
    tacticalHud();announcementHud();
    const cost=Swarm.burstCost(g),ready=g.charge>=100&&g.drones>cost;
    for(const [i,id] of forms.entries()){
      const {b,status,charge}=formNodes[id];
      const burst=id==='burst',active=g.mode===id,available=burst?ready:i<g.unlocked,advised=guide?.mode===id;
      const name='formation'+(!available?' locked':'')+(active?' active':'')+(advised&&!active?' recommended':'')+(burst&&ready?' burst-ready':'');
      if(b.className!==name)b.className=name;
      b.disabled=g.bossDefeated;b.setAttribute('aria-disabled',String(!available||g.bossDefeated));
      if(!burst)b.setAttribute('aria-pressed',String(active));
      const value=burst?(ready?t('ready'):g.charge>=100?t('needsDrones',{n:cost+1}):t('charge',{n:g.charge})):
        advised?t(active?'countering':'counter'):active?t('active'):available?t('ready'):t(id==='spear'?'lockedSpear':'lockedBlades');
      if(status.textContent!==value)status.textContent=value;
      b.title=t(id+'Desc',{n:cost});
      if(charge)charge.style.transform=scale(g.charge,100);
    }
  }

  function stick(x=0,y=0){
    const magnitude=Math.min(1,Math.hypot(x,y));
    if(magnitude<.20)return null;
    const v=(magnitude-.20)/.80,scale=v/Math.hypot(x,y);
    return {x:x*scale,y:y*scale};
  }
  function gamepad(){
    let input;
    try{input=Array.from(globalThis.navigator?.getGamepads?.()||[]).find(p=>p&&p.connected!==false&&p.mapping==='standard');}
    catch{}
    if(!input){padButtons=[];padIndex=null;padAimAngle=null;return null;}
    if(input.index!==padIndex){padIndex=input.index;padButtons=[];padAimAngle=null;}
    const pressed=input.buttons.map(b=>!!b.pressed),tap=i=>pressed[i]&&!padButtons[i];
    const start=tap(9),cancel=tap(1);
    let move=null,steer=null;
    if(page==='playing'){
      const stickAim=stick(input.axes[2],input.axes[3]);
      if(stickAim){
        padAimAngle=Math.atan2(stickAim.y,stickAim.x);
      }
      if(padAimAngle!==null){const p=g.player;steer={x:p.x+Math.cos(padAimAngle)*180,y:p.y+Math.sin(padAimAngle)*180};}
      move=stick(input.axes[0],input.axes[1]);
      if(start)pause();
      else if(tap(14))command('ring');
      else if(tap(12))command('spear');
      else if(tap(15))command('blades');
      else if(tap(4))cycle(-1);
      else if(tap(5))cycle(1);
      else if(tap(0))command('burst',steer||aim);
    }else if(start&&page==='paused')resume();
    else if(cancel)back();
    else if(screens[page]){
      const choices=[...($(screens[page]).querySelectorAll?.('button')||[])].filter(b=>!b.hidden&&!b.disabled);
      const i=choices.indexOf(document.activeElement);
      if(choices.length&&(tap(12)||tap(13)||tap(14)||tap(15))){
        const direction=tap(12)||tap(14)?-1:1;
        choices[(i<0?0:(i+direction+choices.length)%choices.length)].focus({preventScroll:true});
      }else if(tap(0)&&choices.length){
        const current=choices[i]||(page==='menu'?(latestCheckpoint()?$('continueRun'):$('campaign')):choices[0]);
        current.click();
      }
    }
    padButtons=pressed;
    return {move,steer,fire:pressed[7]||pressed[6]};
  }

  function drain(){
    if(!g.cues.length)return;
    for(const id of new Set(g.cues))sound.cue(id);
    g.cues.length=0;
  }
  function frame(ms){
    const dt=previous===null?0:Math.max(0,Math.min(.083,(ms-previous)/1000));
    previous=ms;
    if(!toast.hidden&&ms>toastUntil)toast.hidden=true;
    const pad=gamepad();
    if(aimPoint)aim=FlightRender.project(FlightRender.camera(g),aimPoint.x,aimPoint.y);
    const steer=pad?.steer||aim;
    if(page==='playing'){
      let x=0,y=0;
      if(keys.size){
        const down=new Set(Array.from(keys,k=>bindings.action(k)));
        x=Number(down.has('right'))-Number(down.has('left'));
        y=Number(down.has('down'))-Number(down.has('up'));
      }
      if(pad?.move&&!x&&!y){x=pad.move.x;y=pad.move.y;}
      if(moveTouch){
        const dx=moveTouch.to.x-moveTouch.from.x,dy=moveTouch.to.y-moveTouch.from.y,n=Math.max(34,Math.hypot(dx,dy));
        x=dx/n;y=dy/n;
      }
      carry+=dt;let stepped=false;
      while(carry>=1/60&&g.phase==='playing'){
        Swarm.step(g,{x,y,aim:releasePending||steer,fire:!releasePending&&!!steer&&(firing||pad?.fire),release:!!releasePending});
        releasePending=null;carry-=1/60;stepped=true;
      }
      if(clearAimAfterRelease&&stepped){aim=null;aimPoint=null;clearAimAfterRelease=false;}
      const arriving=g.wave>=Swarm.sector(g).waves.length&&!g.bossSpawned;
      const nextGuide=settings.guide&&g.kind!=='training'&&!arriving&&!g.bossDefeated?adviser(g):null;
      const changed=nextGuide?.reason!==guide?.reason;
      guide=nextGuide;
      drain();
      if(g.phase==='transit'){mapTransit=true;selectedChapter=g.round;show('map');}
      else if(g.phase==='draft')show('draft');
      else if(g.phase!=='playing'){recordResult();show('debrief');}
      else if(changed||ms-lastHud>95){hud();lastHud=ms;}
    }
    const menu=page==='menu'||page==='records'||page==='map'||page==='changelog'||(page==='options'||page==='bindings')&&optionsFrom==='menu'||
      page==='manual'&&manualFrom==='menu';
    const reduced=settings.reduced;
    const flash=page==='playing'?Math.max(0,(g.hurtFlash-g.t)/.38)*(reduced?.21:1):0;
    $('hurt').style.opacity=flash;
    if(drawDirty||page==='playing'||menu&&!reduced&&ms-lastDraw>=32){
      renderer.draw(g,{edgeBeamLabel:t('edgeBeam'),edgeRingLabel:t('edgeRing'),hullLabel:t('hull'),weaponLabel:t('status'+cap(g.mode),{n:g.mode==='ring'?g.weapon.guard:g.mode==='spear'?Math.floor(g.weapon.lock*100):(1+g.weapon.spin*.8).toFixed(1)}),menu,reduced,wall:ms/1000,dt,frozen:page!=='playing',inspect:inspecting,guide,keyLabel,aim:steer,touch:moveTouch?{
        from:FlightRender.project(FlightRender.camera(g),moveTouch.from.x/Math.max(1,canvas.getBoundingClientRect().width),moveTouch.from.y/Math.max(1,canvas.getBoundingClientRect().height)),
        to:FlightRender.project(FlightRender.camera(g),moveTouch.to.x/Math.max(1,canvas.getBoundingClientRect().width),moveTouch.to.y/Math.max(1,canvas.getBoundingClientRect().height))
      }:null});
      drawDirty=false;lastDraw=ms;
    }
    sound.tick(g.round,page==='playing'&&(g.bossSpawned||g.enemies.length>10),page==='playing'||menu,page==='playing'?g.t:ms/1000,page==='playing'?g.sectorStart:0);
    requestAnimationFrame(frame);
  }
  if(typeof ResizeObserver==='function')new ResizeObserver(resize).observe(canvas);
  addEventListener('resize',resize);
  resize();sound.configure(settings);controlsHud();show('menu',true);requestAnimationFrame(frame);
})();
