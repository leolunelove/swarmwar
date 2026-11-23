const FlightAudio=(()=>{
  const effects={
    arc:[920,340,.16,.055,'triangle',.14],counter:[310,1140,.18,.075,'triangle',.12],reflect:[1240,740,.09,.05,'sine',.08],interrupt:[1400,430,.19,.07,'triangle',.12],pattern:[100,43,.16,.085,'sine',.12],shotRing:[270,145,.065,.034,'triangle',.070],shotSpear:[560,125,.105,.047,'sawtooth',.095],shotBlades:[155,230,.075,.028,'triangle',.12],pickup:[580,950,.12,.072,'sine',.047],
    switch:[280,740,.16,.074,'sine',.05],unlock:[392,1120,.31,.10,'triangle',.25],
    kill:[230,52,.16,.061,'triangle',.063],hurt:[110,33,.23,.092,'sawtooth',.15],
    burst:[108,40,.46,.16,'sawtooth',.28],block:[1020,420,.089,.058,'sine',.062],
    pierce:[810,1480,.10,.055,'sine',.09],armor:[185,110,.07,.038,'square',.16],cut:[710,160,.11,.057,'triangle',.10],chain:[420,690,.13,.06,'sine',.24],wave:[90,260,.40,.080,'triangle',.25],
    wind:[205,420,.22,.040,'sine',.38],warning:[230,490,.28,.081,'square',.4],
    beam:[114,55,.35,.115,'sawtooth',.3],bossDown:[118,27,.66,.13,'sawtooth',.3],
    clear:[330,870,.53,.09,'triangle',.2],won:[330,1046,.67,.10,'triangle',.5],
    trained:[440,880,.55,.10,'triangle',.4],lost:[150,37,.57,.10,'triangle',.3]
  };
  const patterns=[
    [36,0,43,0,38,45,0,0,34,0,41,0,31,38,0,0],
    [33,0,45,40,36,0,43,0,31,0,43,38,29,41,0,0],
    [40,0,47,0,42,0,49,0,38,0,45,0,35,0,42,0],
    [29,41,0,29,36,0,41,0,28,40,0,28,35,0,40,0],
    [31,43,0,38,30,42,38,0,29,41,0,36,27,39,36,0]
  ];
  const hz=n=>440*2**((n-69)/12);
  function create(){
    let context,sfx,score,playing=false,music=false,nextBeat=0,beat=-1,lastZone=-1,wasActive=false;
    const last={};
    function wake(){
      try{
        const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
        if(!Audio)return;
        if(!context){
          context=new Audio();
          sfx=context.createGain();sfx.gain.value=.43;sfx.connect(context.destination);
          score=context.createGain();score.gain.value=.32;score.connect(context.destination);
        }
        if(context.state==='suspended')context.resume().catch(()=>{});
      }catch{}
    }
    function voice(bus,start,a,b,len,volume,wave){
      const tone=context.createOscillator(),shape=context.createGain();
      tone.type=wave;
      tone.frequency.setValueAtTime(a,start);tone.frequency.exponentialRampToValueAtTime(b,start+len);
      shape.gain.setValueAtTime(.0001,start);shape.gain.linearRampToValueAtTime(volume,start+Math.min(.017,len*.2));
      shape.gain.exponentialRampToValueAtTime(.0001,start+len);
      tone.connect(shape);shape.connect(bus);tone.start(start);tone.stop(start+len+.025);
    }
    function cue(id){
      if(!playing||context?.state!=='running'||!effects[id])return;
      const [a,b,len,v,type,hold]=effects[id],t=context.currentTime;
      if(t-(last[id]??-100)<hold)return;
      last[id]=t;voice(sfx,t,a,b,len,v,type);
      if(id==='burst')voice(sfx,t+.04,52,24,.40,.09,'sine');
      if(id==='block')voice(sfx,t+.014,1460,780,.055,.025,'sine');
      if(id==='won'||id==='clear'||id==='trained'){
        voice(sfx,t+.11,440,445,.28,.054,'sine');
        voice(sfx,t+.22,659,663,.52,.056,'sine');
      }
    }
    function configure({mute,audio,music:musicOn}){
      playing=!mute&&audio;music=!mute&&musicOn;
      if(context){
        sfx.gain.setTargetAtTime(playing?.43:0,context.currentTime,.035);
        score.gain.setTargetAtTime(music?.32:0,context.currentTime,.09);
      }
    }
    function tick(zone,busy,active,time=0,epoch=0){
      if(!context||context.state!=='running')return;
      const audible=music&&active;
      const resumed=audible&&!wasActive;
      if(audible!==wasActive){score.gain.setTargetAtTime(audible?.32:0,context.currentTime,.035);wasActive=audible;}
      if(!audible)return;
      const bpm=Content.sectors[zone%Content.sectors.length].bpm,period=60/bpm/2,index=Math.floor(Math.max(0,time-epoch)/period+1e-6);
      if(resumed&&((time-epoch)/period)%1>.12){beat=index;lastZone=zone;return;}
      if(index===beat&&lastZone===zone)return;
      beat=index;lastZone=zone;nextBeat=context.currentTime+.008;
      const pattern=patterns[zone%patterns.length],n=pattern[index%pattern.length];
      if(n)voice(score,nextBeat,hz(n),hz(n),period*.86,.070,zone%3===1?'triangle':'sine');
      if(index%2===0)voice(score,nextBeat,116,38,.14,.10,'sine');
      if(index%8===4)voice(score,nextBeat,210,85,.09,.035,'triangle');
      if(index%8===0){
        const root=pattern[index%pattern.length]||pattern[0];
        voice(score,nextBeat,hz(root+12),hz(root+12),period*3.5,.024,'triangle');
        voice(score,nextBeat,hz(root+19),hz(root+19),period*3.5,.016,'sine');
      }
      if((busy||zone%3===2)&&n&&index%4===2)voice(score,nextBeat,hz(n+24),hz(n+24),.12,.022,'triangle');
    }
    return {wake,cue,configure,tick};
  }
  return {create};
})();
