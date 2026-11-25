function chooseModule(g){
  return ['nanites','lance','plating','rotor','foundry','scatter','bastion'].find(k=>g.draft.includes(k))||g.draft[0]||'continue';
}
function createPilot(){
  const advise=Swarm.createAdvisor();
  let desired=null,changed=-1;
  return g=>{
    const p=g.player,rec=advise(g),d2=s=>(p.x-s.x)**2+(p.y-s.y)**2;
    const nearest=list=>list.reduce((a,b)=>!a||d2(b)<d2(a)?b:a,null);
    let x=(g.w/2-p.x)*.004,y=(g.h/2-p.y)*.004;
    const s=nearest(g.salvage),near=nearest(g.enemies),boss=g.enemies.find(e=>e.boss);
    if(s&&d2(s)>25**2){const a=Math.atan2(s.y-p.y,s.x-p.x);x+=Math.cos(a)*1.10;y+=Math.sin(a)*1.10;}
    for(const e of g.enemies){
      const r=e.r+74,d=Math.sqrt(d2(e));
      if(d<r&&d>0){const f=(1-d/r)*5;x+=(p.x-e.x)*f/d;y+=(p.y-e.y)*f/d;}
    }
    for(const b of g.hostile){
      const r=50,d=Math.sqrt(d2(b));
      if(d<r&&d>0){const f=(1-d/r)*2.7;x+=(p.x-b.x)*f/d;y+=(p.y-b.y)*f/d;}
    }
    for(const h of g.hazards){
      if(h.type==='sweep'){
        const pos=Swarm.hazardPosition(h,g.t),cross=h.axis==='x'?p.y:p.x;
        if(g.t<h.end&&Math.abs(cross-h.gap)>h.gapHalf-23){if(h.axis==='x')y+=Math.sign(h.gap-cross)*6;else x+=Math.sign(h.gap-cross)*6;}
        continue;
      }
      if(h.type==='wave'){
        const r=Math.hypot(p.x-h.x,p.y-h.y),radius=Swarm.patternRadius(h,g.t),a=Math.atan2(p.y-h.y,p.x-h.x),delta=Math.atan2(Math.sin(h.gap-a),Math.cos(h.gap-a));
        if(radius<r+27&&Math.abs(delta)>h.gapHalf-.17){x-=Math.sin(a)*Math.sign(delta)*5;y+=Math.cos(a)*Math.sign(delta)*5;}
        continue;
      }
      if(h.type==='surge'){
        const dx=p.x-h.x,dy=p.y-h.y,d=Math.hypot(dx,dy);
        if(d<h.radius+31){x+=4*(dx/(d||1)||.2);y+=4*dy/(d||1);}
        continue;
      }
      const dx=h.endX-h.x,dy=h.endY-h.y,l=Math.hypot(dx,dy),dd=((p.x-h.x)*dy-(p.y-h.y)*dx)/l;
      if(Math.abs(dd)<h.width*.5+25){x+=4*dy/l*Math.sign(dd||1);y-=4*dx/l*Math.sign(dd||1);}
    }
    const close=g.enemies.filter(e=>!e.armored&&d2(e)<100**2).length;
    const aim=rec?.mode==='spear'?rec.target:near&&d2(near)<132**2?near:boss||near;
    let mode=rec?.mode||(g.unlocked>=3&&close>=2?'blades':g.unlocked>=2&&aim?.armored?'spear':'ring');
    if(mode!==desired){changed=g.t;desired=mode;}
    if(g.t-changed<.12)mode=g.mode;
    return {x,y,aim,mode,fire:mode!=='spear'||g.weapon.lock>=.999&&!g.weapon.held,burst:!!boss&&g.charge===100&&d2(boss)<350**2&&aim===boss};
  };
}
function autopilot(seed,options={},seconds=1800){
  const g=Swarm.create(seed,options),pilot=createPilot(),results=[];
  let lastHits=0;
  for(let i=0;i<seconds*60&&(g.phase==='draft'||g.phase==='playing'||g.phase==='transit');i++){
    if(g.phase==='draft'){
      results.push({round:g.round,at:g.t,hp:g.player.hp,hits:g.stats.hits-lastHits});lastHits=g.stats.hits;
      Swarm.choose(g,chooseModule(g));
    }else if(g.phase==='transit')Swarm.depart(g);else Swarm.step(g,pilot(g));
  }
  if(g.phase==='won')results.push({round:g.round,at:g.t,hp:g.player.hp,hits:g.stats.hits-lastHits});
  return {g,results};
}
