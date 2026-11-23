const Content=(()=>{
  // Spawn scripts use weighted, ordered groups. Waves stop spawning shortly before the next phase.
  const sectors=[
    {id:'array',bpm:104,palette:['#07121a','#112d34','#74d9ce'],boss:'warden',
      waves:[
        {name:'coldBoot',length:34,interval:2.40,groups:[['skimmer'],['skimmer'],['sentry'],['skimmer','skimmer']]},
        {name:'patrolGrid',length:38,interval:2.00,groups:[['ram'],['skimmer','skimmer'],['pulsar'],['sentry'],['skimmer','skimmer','skimmer']]},
        {name:'crossedSignals',length:42,interval:1.75,groups:[['ram','skimmer'],['pulsar','sentry'],['skimmer','skimmer','skimmer'],['ram','sentry']]},
        {name:'watchtower',length:46,interval:1.65,groups:[['ram','skimmer'],['pulsar','sentry'],['skimmer','skimmer','skimmer']]}
      ], variants:[{id:'echoWatch',offset:0,field:1},{id:'patrolShift',offset:1,field:1,reinforcement:'sentry'}], escort:[['skimmer','skimmer'],['sentry']]},
    {id:'belt',bpm:116,palette:['#0e0d1c','#251b3e','#b8a4ff'],boss:'reaver',
      waves:[
        {name:'brokenConvoy',length:38,interval:1.95,groups:[['splitter'],['skimmer','mine'],['sentry','skimmer'],['ram','mine']]},
        {name:'scrapperWake',length:42,interval:1.85,groups:[['mine','mine'],['splitter','skimmer'],['weaver'],['ram','sentry'],['splitter','splitter']]},
        {name:'shrapnelTide',length:46,interval:1.70,groups:[['splitter','mine'],['weaver','skimmer'],['ram','ram'],['sentry','sentry']]},
        {name:'reaversClaim',length:50,interval:1.65,groups:[['splitter','mine'],['weaver','sentry'],['skimmer','skimmer','skimmer']]}
      ], variants:[{id:'wreckfall',offset:0,field:.78},{id:'salvageTide',offset:2,field:1.25,reinforcement:'splitter'}], escort:[['skimmer','skimmer','skimmer'],['mine','splitter']]},
    {id:'veil',bpm:112,palette:['#07151d','#102937','#80bded'],boss:'warden',bossTitle:'archivist',field:'veil',
      waves:[
        {name:'lostPackets',length:39,interval:2.25,groups:[['sentry','skimmer'],['weaver'],['skimmer','skimmer']]},
        {name:'blueShift',length:43,interval:2.20,groups:[['weaver','skimmer'],['prism'],['sentry','sentry']]},
        {name:'ghostChoir',length:47,interval:2.15,groups:[['pulsar'],['weaver','ram'],['prism','skimmer']]},
        {name:'memoryLock',length:51,interval:2.10,groups:[['weaver'],['pulsar','skimmer'],['prism','sentry']]}
      ],variants:[{id:'quietArchive',offset:0,field:1.2},{id:'signalStorm',offset:1,field:1,reinforcement:'sentry'}],escort:[['sentry'],['skimmer','skimmer']]},
    {id:'forge',bpm:122,palette:['#1a100c','#382319','#f3bd7d'],boss:'reaver',bossTitle:'crucible',field:'forge',
      waves:[
        {name:'slagRun',length:40,interval:2.20,groups:[['ram'],['mine','skimmer'],['bulwark']]},
        {name:'pressureTest',length:44,interval:2.15,groups:[['bulwark','skimmer'],['ram','mine'],['sentry']]},
        {name:'furnaceChoir',length:48,interval:2.10,groups:[['ram','ram'],['weaver'],['bulwark','splitter']]},
        {name:'lastTemper',length:52,interval:2.05,groups:[['bulwark','skimmer'],['ram','mine'],['prism']]}
      ],variants:[{id:'coolingCycle',offset:0,field:1.25},{id:'overpressure',offset:2,field:1,reinforcement:'mine'}],escort:[['mine'],['ram']]},
    {id:'core',bpm:128,palette:['#190f19','#371b34','#f89dc1'],boss:'sovereign',
      waves:[
        {name:'outerMembrane',length:42,interval:2.10,groups:[['prism'],['bulwark','skimmer'],['ram','splitter'],['mine','skimmer']]},
        {name:'pulseGarden',length:46,interval:1.95,groups:[['prism'],['bulwark','skimmer'],['weaver'],['sentry','ram']]},
        {name:'prismChoir',length:50,interval:2.05,groups:[['ram','prism'],['bulwark','splitter'],['pulsar'],['sentry','ram']]},
        {name:'heartlock',length:54,interval:1.95,groups:[['prism','skimmer'],['bulwark','splitter'],['weaver'],['pulsar','ram']]}
      ], variants:[{id:'pulseLattice',offset:0,field:.80},{id:'siegeMatrix',offset:1,field:1.25,reinforcement:'ram'}], escort:[['skimmer','splitter'],['mine','skimmer'],['ram']]}
  ];
  const difficulty={
    scout:{health:.82,pace:1.21,damage:.62,travel:.88},
    standard:{health:1,pace:1,damage:1,travel:1},
    overclock:{health:1.22,pace:.86,damage:1.23,travel:1.11}
  };
  const upgrades={
    bastion:{group:'ring',max:2}, lance:{group:'spear',max:2}, rotor:{group:'blades',max:2}, capacitor:{group:'burst',max:2},
    foundry:{group:'all',max:3}, thrusters:{group:'all',max:2}, nanites:{group:'all',max:2}, scatter:{group:'all',max:2},
    salvager:{group:'all',max:2}, plating:{group:'all',max:2},
    echoGuard:{group:'ring',max:1,requires:'bastion'}, forkLance:{group:'spear',max:1,requires:'lance'},
    siphon:{group:'blades',max:1,requires:'rotor'}, afterburn:{group:'burst',max:1,requires:'capacitor'},
    recycler:{group:'burst',max:1,requires:'foundry'}, conductor:{group:'all',max:1},
    mirror:{group:'ring',max:1,requires:'bastion',slot:'ringCore'}, gravity:{group:'ring',max:1,requires:'bastion',slot:'ringCore'},
    siege:{group:'spear',max:1,requires:'lance',slot:'spearCore'}, arc:{group:'spear',max:1,requires:'lance',slot:'spearCore'},
    longOrbit:{group:'blades',max:1,requires:'rotor',slot:'bladeCore'}, vortex:{group:'blades',max:1,requires:'rotor',slot:'bladeCore'},
    cluster:{group:'burst',max:1,requires:'capacitor',slot:'payload'}, cryo:{group:'burst',max:1,requires:'capacitor',slot:'payload'}
  };
  const enemy={
    skimmer:{hp:26,r:13,speed:104},sentry:{hp:53,r:17,speed:63},ram:{hp:121,r:23,speed:74,armored:true},
    splitter:{hp:81,r:19,speed:85},mine:{hp:58,r:16,speed:65},prism:{hp:108,r:21,speed:66},
    pulsar:{hp:128,r:22,speed:43},weaver:{hp:103,r:19,speed:58},bulwark:{hp:224,r:26,speed:42,armored:true},
    warden:{hp:2350,r:37,speed:52,boss:true,armored:true},
    reaver:{hp:3470,r:40,speed:76,boss:true,armored:true},
    sovereign:{hp:4800,r:46,speed:58,boss:true,armored:true}
  };
  const badges=['certified','liberator','cleanRun','bulwark','bladeMaster','endurance','ace','rushClear'];
  return {sectors,difficulty,upgrades,enemy,badges};
})();
