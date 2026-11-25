const FlightRender=(()=>{
  const {TAU,guardRadius,bladeRadius}=Swarm;
  const colors={ally:'#91fced',enemy:'#ff817b',salvage:'#ddff88',burst:'#9bddff'};
  const families={wave:'#f6a9c6',sweep:'#ff9caa',debris:'#e3c3a4',surge:'#ff9acd',skimmer:'#ff9c87',sentry:'#ffac91',ram:'#ff8a83',splitter:'#f4a2c6',mine:'#f9c478',
    pulsar:'#f6a9c6',weaver:'#ffc48b',bulwark:'#d4b5ff',prism:'#f7a1eb',warden:'#ff8b82',reaver:'#ff97bb',sovereign:'#ffd4e8'};
  const starfield=Array.from({length:160},(_,i)=>[((i*293.783)%997)/997,((i*181.673)%991)/991,((i*67)%90)/100]);
  const svgPaths={
    ring:'<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="3"/><path d="M16 2v7m0 14v7M2 16h7m14 0h7"/>',
    spear:'<path d="m28 16-21-9 6 9-6 9zM13 16H2m25 0H17"/>',
    blades:'<path d="M16 3l3 8-3 2-3-2zM27 23l-8-1-1-4 4-1zM5 23l5-6 4 1-1 4z"/><circle cx="16" cy="16" r="3"/>',
    burst:'<path d="m16 3 2.5 9 8-5-5 8 8 2-9 2 4.5 8-8-5-2 7-2-9-8 4 5-7-8-2 9-2-4-7 7 5z"/>',
    foundry:'<rect x="4" y="4" width="8" height="8" rx="2"/><rect x="20" y="4" width="8" height="8" rx="2"/><rect x="12" y="20" width="8" height="8" rx="2"/><path d="M8 12v4h16v-4m-8 4v4"/>',
    thrusters:'<path d="m5 23 11-15 11 15M10 27l6-8 6 8M16 3v2"/>',
    nanites:'<path d="M12 4h8v8h8v8h-8v8h-8v-8H4v-8h8z"/>',
    scatter:'<path d="M16 28V12M7 25V8m18 17V8m-21 3 3-5 3 5m12 0 3-5 3 5m-15 3 3-5 3 5"/>',
    salvager:'<path d="M7 4v14a9 9 0 0 0 18 0V4h-6v14a3 3 0 0 1-6 0V4zM7 10h6m6 0h6"/>',
    plating:'<path d="m16 3 11 4v10c0 6-11 12-11 12S5 23 5 17V7zM11 16l4 4 7-9"/>',
    conductor:'<circle cx="16" cy="16" r="4"/><path d="M8 7a12 12 0 0 1 17 3M25 22a12 12 0 0 1-17 3M4 20a12 12 0 0 1 0-8"/>',
    soundOn:'<path d="M4 12h5l8-6v20l-8-6H4zM21 11q7 5 0 10m3-15q12 10 0 20"/>',
    soundOff:'<path d="M4 12h5l8-6v20l-8-6H4zm17 1 7 7m0-7-7 7"/>',
    fullscreen:'<path d="M4 12V4h8m8 0h8v8M4 20v8h8m8 0h8v-8"/>',
    exitFullscreen:'<path d="M4 12h8V4m8 0v8h8M4 20h8v8m8 0v-8h8"/>',
    pause:'<path d="M11 6v20M21 6v20" stroke-width="4"/>'
  };
  const icon=id=>'<svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+svgPaths[id]+'</svg>';
  const circle=(c,x,y,r)=>{c.beginPath();c.arc(x,y,r,0,TAU);};
  const ring=(c,x,y,r)=>{circle(c,x,y,r);c.stroke();};
  const line=(c,x,y,xx,yy)=>{c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
  function path(c,points){
    c.beginPath();c.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
    c.closePath();
  }
  const radial=(n,r,fn=i=>1)=>Array.from({length:n},(_,i)=>[Math.cos(i*TAU/n)*r*fn(i),Math.sin(i*TAU/n)*r*fn(i)]);
  function triangle(c,ax,ay,bx,by,cx,cy){c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.lineTo(cx,cy);c.closePath();}
  const enemyShapes={
    debris:r=>[[-r,-r*.36],[-r*.17,-r*.83],[r*.82,-r*.52],[r,r*.15],[r*.45,r*.73],[-r*.76,r*.67]],
    surge:r=>radial(12,r,i=>i%2?.53:1),
    skimmer:r=>[[r,0],[-r,-r*.69],[-r*.51,0],[-r,r*.69]],
    sentry:r=>[[r,0],[0,r],[-r,0],[0,-r]],
    ram:r=>[[r,0],[r*.41,r*.77],[-r,r*.77],[-r*.47,0],[-r,-r*.77],[r*.41,-r*.77]],
    splitter:r=>radial(6,r,i=>i%2?.73:1),
    mine:r=>radial(16,r,i=>i%2?.64:1),
    prism:r=>[[-r*.92,0],[r*.55,-r*.82],[r,0],[r*.55,r*.82]],
    pulsar:r=>radial(12,r,i=>i%2?.82:1),
    weaver:r=>[[-r,-r*.7],[0,-r*.23],[r,-r*.7],[r*.55,0],[r,r*.7],[0,r*.23],[-r,r*.7],[-r*.55,0]],
    bulwark:r=>[[r,0],[r*.64,r*.85],[-r*.64,r*.85],[-r,0],[-r*.64,-r*.85],[r*.64,-r*.85]],
    wave:r=>radial(12,r,i=>i%2?.75:1),sweep:r=>[[-r,-r],[r,-r],[r,-r*.3],[-r,-r*.3],[-r,r*.3],[r,r*.3],[r,r],[-r,r]],
    warden:r=>radial(12,r,i=>i%2?.76:1),
    reaver:r=>[[r,0],[r*.25,r*.49],[-r*.85,r],[-r*.47,r*.37],[-r*.72,0],[-r*.47,-r*.37],[-r*.85,-r],[r*.25,-r*.49]],
    sovereign:r=>radial(16,r,i=>i%2?.70:1)
  };
  function camera(g){
    const zoom=g.h>g.w?1.42:1.34,w=g.w/zoom,h=g.h/zoom;
    return {x:Math.max(0,Math.min(g.w-w,g.player.x-w*.5)),y:Math.max(0,Math.min(g.h-h,g.player.y-h*.5)),w,h,zoom};
  }
  function project(view,u,v){return {x:view.x+u*view.w,y:view.y+v*view.h};}
  function create(canvas){
    const c=canvas.getContext('2d',{alpha:false});
    const background=document.createElement('canvas'),grid=background.getContext('2d',{alpha:false});
    let bw=0,bh=0,theme=null,droneVisuals=[],lastKey='',lastGame=null;
    const cachedShapes={};

    function bake(w,h,zone){
      if(w===bw&&h===bh&&theme===zone)return;
      bw=w;bh=h;theme=zone;
      const s=Math.min(1,1600/Math.max(w,h));
      background.width=Math.ceil(w*s);background.height=Math.ceil(h*s);
      grid.setTransform(background.width/w,0,0,background.height/h,0,0);
      const [dark,light,accent]=zone.palette;
      const gradient=grid.createRadialGradient(w*.61,h*.42,10,w*.53,h*.50,Math.hypot(w,h)*.62);
      gradient.addColorStop(0,light);gradient.addColorStop(1,dark);
      grid.fillStyle=gradient;grid.fillRect(0,0,w,h);
      const spacing=zone.id==='belt'?38:32;
      grid.strokeStyle=accent+'16';grid.lineWidth=1;grid.beginPath();
      for(let x=spacing;x<w;x+=spacing){grid.moveTo(x,0);grid.lineTo(x,h);}
      for(let y=spacing;y<h;y+=spacing){grid.moveTo(0,y);grid.lineTo(w,y);}
      grid.stroke();
      grid.strokeStyle=accent+'21';
      if(zone.id==='belt'){
        for(let i=0;i<18;i++){
          const x=(i*113)%w,y=(i*79)%h,size=13+(i*19)%48;
          path(grid,[[x-size,y],[x-size*.36,y-size*.60],[x+size,y-size*.31],[x+size*.68,y+size*.50]]);grid.stroke();
        }
        // Derelict convoy: long broken hulls and cargo ribs, rather than a generic grid.
        for(let i=0;i<4;i++){
          grid.save();grid.translate(w*(.13+i*.24),h*(i%2?.72:.24));grid.rotate(-.33+i*.13);
          grid.strokeStyle=accent+'35';grid.fillStyle=dark+'99';
          path(grid,[[-74,-22],[35,-22],[70,0],[35,22],[-74,22],[-52,0]]);grid.fill();grid.stroke();
          for(let j=-45;j<35;j+=18)line(grid,j,-17,j+9,17);
          line(grid,-94,-39,-46,-39);line(grid,45,34,88,34);grid.restore();
        }
        grid.setLineDash([16,9]);
        for(let i=0;i<5;i++)line(grid,0,h*.23+i*62,w,h*.02+i*68);
        grid.setLineDash([]);
      }else if(zone.id==='core'){
        // Reactor: nested hexagonal chambers, conduit bundles and isolated cells.
        grid.save();grid.translate(w*.5,h*.5);
        for(let i=1;i<=5;i++){path(grid,radial(6,i*68));grid.stroke();}
        for(let i=0;i<6;i++){
          grid.save();grid.rotate(i*TAU/6);
          grid.strokeStyle=accent+'35';
          for(const dy of [-9,0,9])line(grid,94,dy,460,dy);
          for(let x=154;x<440;x+=105){path(grid,[[x,-18],[x+28,-18],[x+37,0],[x+28,18],[x,18],[x-9,0]]);grid.stroke();}
          grid.restore();
        }
        grid.restore();
        for(let i=0;i<12;i++){
          const a=i*TAU/12;
          line(grid,w*.5+Math.cos(a)*72,h*.5+Math.sin(a)*72,w*.5+Math.cos(a)*490,h*.5+Math.sin(a)*490);
        }
      }else if(zone.id==='veil'){
        for(let i=0;i<7;i++){const x=w*(.08+i*.14);grid.strokeStyle=accent+'25';line(grid,x,35,x,h-35);for(let j=0;j<4;j++){const y=60+j*130;path(grid,[[x-22,y],[x,y-15],[x+22,y],[x,y+15]]);grid.stroke();}}
      }else if(zone.id==='forge'){
        grid.strokeStyle=accent+'26';for(let i=0;i<5;i++){const x=w*(.1+i*.2);path(grid,[[x-27,50],[x+27,50],[x+42,h-50],[x-42,h-50]]);grid.stroke();for(let y=75;y<h-50;y+=58)line(grid,x-23,y,x+23,y);}
      }else{
        // Listening posts with dish silhouettes and signal routes.
        for(const [u,v] of [[.18,.23],[.78,.21],[.19,.78],[.80,.77]]){
          const x=w*u,y=h*v;
          grid.strokeStyle=accent+'36';
          grid.beginPath();grid.arc(x,y,30,.12,Math.PI-.12);grid.stroke();
          line(grid,x-27,y+5,x+27,y+5);line(grid,x,y+5,x,y+38);line(grid,x-16,y+38,x+16,y+38);
          line(grid,x,y-6,x+11,y-22);ring(grid,x+11,y-22,3);
          grid.strokeStyle=accent+'19';grid.setLineDash([3,11]);line(grid,x,y,w*.57,h*.48);grid.setLineDash([]);
        }
        [95,158,230,310].forEach(r=>ring(grid,w*.57,h*.48,r));
        grid.setLineDash([6,8]);line(grid,w*.57,0,w*.57,h);line(grid,0,h*.48,w,h*.48);grid.setLineDash([]);
      }
      // Keep scenery a quiet layer below telegraphs and enemies.
      grid.fillStyle=dark+'78';grid.fillRect(0,0,w,h);
      grid.fillStyle=accent+'26';
      for(const [x,y,a] of starfield)grid.fillRect(x*w,y*h,a>.70?2:1.05,a>.70?2:1.05);
      grid.strokeStyle=accent+'46';grid.lineWidth=1.1;
      for(const [x,y,a,b] of [[12,12,1,1],[w-12,12,-1,1],[12,h-12,1,-1],[w-12,h-12,-1,-1]]){
        grid.beginPath();grid.moveTo(x+a*21,y);grid.lineTo(x,y);grid.lineTo(x,y+b*21);grid.stroke();
      }
    }
    function menuArt(w,h,t,reduced){
      const x=w*(w<h?.67:.72),y=h*(w<h?.40:.46),scale=Math.min(w,h)/560;
      const k=reduced?0:t;
      c.save();c.translate(x,y);c.scale(scale,scale);
      const glow=c.createRadialGradient(0,0,12,0,0,278);
      glow.addColorStop(0,'#88f9df2f');glow.addColorStop(1,'#2d7b7600');
      c.fillStyle=glow;c.fillRect(-278,-278,556,556);
      c.strokeStyle='#94ece249';c.lineWidth=1;
      [58,102,151,198,240].forEach(r=>ring(c,0,0,r));c.setLineDash([5,9]);ring(c,0,0,227);c.setLineDash([]);
      line(c,-270,0,270,0);line(c,0,-268,0,268);
      for(let i=0;i<60;i++){
        const a=i*TAU/60,r=240,v=i%5===0?14:6;
        line(c,Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(r+v),Math.sin(a)*(r+v));
      }
      c.rotate(-.33);
      for(let i=0;i<710;i++){
        const band=i%14,a=i*2.399963+k*(band%2?.12:-.19),r=30+band*15+Math.sin(i*.93+k)*7;
        const px=Math.cos(a)*r,py=Math.sin(a)*r*.70,unit=i%19===0?3.4:i%4===0?2:1.18;
        c.fillStyle=i%21===0?'#ffcf80':i%5===0?'#d2fff6':'#69e3d5';
        c.globalAlpha=.22+(i%9)*.074;c.fillRect(px,py,unit,unit);
        if(i%8===0){c.strokeStyle='#91fbef';c.globalAlpha*=.4;line(c,px,py,px+Math.sin(a)*22,py-Math.cos(a)*12);}
      }
      c.globalAlpha=1;c.rotate(k*.31);
      c.lineWidth=2.2;c.strokeStyle='#befff4';path(c,radial(4,25));c.stroke();
      c.fillStyle='#d5fff9';path(c,radial(4,12));c.fill();
      c.restore();
    }

    function hazards(g,reduced){
      for(const h of g.hazards){
        const ready=g.t<h.fire;
        if(h.end<=g.t)continue;
        if(h.type==='wave'){
          const progress=Math.max(0,Math.min(1,(g.t-h.start)/(h.fire-h.start))),r=ready?32+progress*42:Swarm.patternRadius(h,g.t);
          c.save();c.lineCap='butt';
          // Carry the opening through the field, including when the caster or
          // one endpoint is outside the camera. The tint is never a hitbox.
          const reach=Swarm.patternRadius(h,h.end);
          c.fillStyle='#a7ffe60b';c.beginPath();c.moveTo(h.x,h.y);
          c.arc(h.x,h.y,reach,h.gap-h.gapHalf,h.gap+h.gapHalf);c.closePath();c.fill();
          c.strokeStyle='#a7ffe63d';c.lineWidth=1;c.setLineDash([4,9]);
          for(const side of [-1,1]){const a=h.gap+side*h.gapHalf;line(c,h.x,h.y,h.x+Math.cos(a)*reach,h.y+Math.sin(a)*reach);}
          c.setLineDash([]);c.strokeStyle='#a7ffe6a8';c.lineWidth=1.5;
          for(const distance of [100,220,340]){
            c.save();c.translate(h.x+Math.cos(h.gap)*distance,h.y+Math.sin(h.gap)*distance);c.rotate(h.gap);
            line(c,-5,-5,2,0);line(c,2,0,-5,5);c.restore();
          }
          if(ready)c.setLineDash([5,7]);
          c.strokeStyle=ready?'#ffd0a89c':'#ff93b86e';c.lineWidth=ready?1.5:h.width;
          c.beginPath();c.arc(h.x,h.y,r,h.gap+h.gapHalf,h.gap+TAU-h.gapHalf);c.stroke();
          if(!ready){c.strokeStyle='#ffe1ea';c.lineWidth=2;c.beginPath();c.arc(h.x,h.y,r,h.gap+h.gapHalf,h.gap+TAU-h.gapHalf);c.stroke();}
          c.setLineDash([]);c.strokeStyle='#a7ffe6';c.lineWidth=2;
          for(const side of [-1,1]){const a=h.gap+side*h.gapHalf;line(c,h.x+Math.cos(a)*(r-11),h.y+Math.sin(a)*(r-11),h.x+Math.cos(a)*(r+11),h.y+Math.sin(a)*(r+11));}
          c.restore();continue;
        }
        if(h.type==='sweep'){
          c.save();const pos=Swarm.hazardPosition(h,g.t),vertical=h.axis==='x',edge=vertical?g.h:g.w;
          // The corridor remains visible before the wall itself enters the camera.
          c.fillStyle='#a7ffe60c';
          if(vertical)c.fillRect(0,h.gap-h.gapHalf,g.w,h.gapHalf*2);
          else c.fillRect(h.gap-h.gapHalf,0,h.gapHalf*2,g.h);
          c.strokeStyle='#9ef6e664';c.lineWidth=1;c.setLineDash([5,9]);
          for(const side of [-1,1]){const cross=h.gap+side*h.gapHalf;if(vertical)line(c,0,cross,g.w,cross);else line(c,cross,0,cross,g.h);}
          const v=camera(g),low=vertical?v.y:v.x,high=low+(vertical?v.h:v.w),outside=h.gap<low||h.gap>high;
          if(outside){
            const cross=Math.max(low+16,Math.min(high-16,h.gap)),direction=h.gap<low?-1:1;
            c.setLineDash([]);c.strokeStyle='#a7ffe6';c.lineWidth=1.8;
            for(const part of [.2,.5,.8]){
              const along=vertical?v.x+v.w*part:v.y+v.h*part;
              if(vertical){line(c,along-4,cross-direction*4,along,cross+direction*2);line(c,along,cross+direction*2,along+4,cross-direction*4);}
              else{line(c,cross-direction*4,along-4,cross+direction*2,along);line(c,cross+direction*2,along,cross-direction*4,along+4);}
            }
          }
          c.setLineDash([]);c.strokeStyle=ready?'#ffd0acb0':'#ff87a97d';c.lineWidth=ready?2:h.width;
          const stroke=(start,end)=>vertical?line(c,pos.x,start,pos.x,end):line(c,start,pos.y,end,pos.y);
          stroke(0,h.gap-h.gapHalf);stroke(h.gap+h.gapHalf,edge);
          if(!ready){c.strokeStyle='#ffe1e8';c.lineWidth=2;stroke(0,h.gap-h.gapHalf);stroke(h.gap+h.gapHalf,edge);}
          c.strokeStyle='#9effe4';c.lineWidth=3;
          for(const side of [-1,1]){const cross=h.gap+side*h.gapHalf;if(vertical)line(c,pos.x-8,cross,pos.x+8,cross);else line(c,cross,pos.y-8,cross,pos.y+8);}
          c.restore();continue;
        }
        if(h.type==='surge'){
          const k=Math.max(0,Math.min(1,(g.t-h.start)/(h.fire-h.start)));
          c.save();
          c.fillStyle=ready?'#f95fa329':reduced?'#e883be50':'#ff8fc97d';
          circle(c,h.x,h.y,h.radius);c.fill();
          c.strokeStyle=ready?'#ffa5d5':'#ffdcf1';c.lineWidth=ready?1.6:2.8;
          ring(c,h.x,h.y,h.radius);
          if(ready){c.setLineDash([4,5]);ring(c,h.x,h.y,8+(h.radius-8)*k);c.setLineDash([]);}
          else ring(c,h.x,h.y,h.radius*.72);
          c.restore();continue;
        }
        if(h.type==='debris'){
          c.save();
          c.strokeStyle='#ffbf7838';c.lineWidth=h.width;line(c,h.x,h.y,h.endX,h.endY);
          c.strokeStyle='#f7bb88b9';c.lineWidth=1.35;c.setLineDash([10,8]);line(c,h.x,h.y,h.endX,h.endY);c.setLineDash([]);
          if(!ready){
            const p=Swarm.hazardPosition(h,g.t),a=Math.atan2(h.endY-h.y,h.endX-h.x);
            c.translate(p.x,p.y);c.rotate(a);
            c.strokeStyle='#f8b47b75';c.lineWidth=6;line(c,-17,0,-64,0);
            c.fillStyle='#ffe1b961';c.strokeStyle='#ffe1b9';c.lineWidth=1.8;
            path(c,enemyShapes.debris(h.width*.46));c.fill();c.stroke();
            c.strokeStyle='#ffe3bcbb';c.lineWidth=1.2;line(c,-13,-6,9,1);line(c,9,1,2,11);
          }
          c.restore();continue;
        }
        c.save();c.lineCap='round';
        if(ready){
          c.strokeStyle='#ff775f30';c.lineWidth=h.width;line(c,h.x,h.y,h.endX,h.endY);
          c.strokeStyle='#ff9e91';c.lineWidth=1.7;c.setLineDash([8,6]);line(c,h.x,h.y,h.endX,h.endY);
        }else{
          c.strokeStyle='#f4556ab0';c.lineWidth=h.width+9;line(c,h.x,h.y,h.endX,h.endY);
          c.strokeStyle='#ffa78a';c.lineWidth=h.width*.63;line(c,h.x,h.y,h.endX,h.endY);
          c.strokeStyle='#fff9e9';c.lineWidth=h.width*.24;line(c,h.x,h.y,h.endX,h.endY);
        }
        c.restore();
      }
      for(const e of g.enemies){
        if(e.wind<=g.t)continue;
        if(e.type==='mine'){
          const a=Math.max(0,Math.min(1,1-(e.wind-g.t)/.58));
          c.fillStyle='#ff7a5038';circle(c,e.x,e.y,86);c.fill();
          c.strokeStyle='#ffc081';c.lineWidth=1.5;ring(c,e.x,e.y,86);ring(c,e.x,e.y,16+70*a);
        }
        if(e.attack==='volley'||e.attack==='spread'){
          c.save();c.strokeStyle='#ffcda24d';c.lineWidth=1;c.setLineDash([4,8]);
          for(const side of [-1,0,1]){const a=e.windAngle+side*(e.type==='prism'?.4:.148);line(c,e.x+Math.cos(a)*(e.r+5),e.y+Math.sin(a)*(e.r+5),e.x+Math.cos(a)*155,e.y+Math.sin(a)*155);}
          c.restore();
        }
        if(e.attack==='charge'||e.attack==='dash'){
          const length=e.attack==='dash'?450:280;
          c.strokeStyle='#ff9b84a6';c.lineWidth=1.8;c.setLineDash([7,7]);
          line(c,e.x,e.y,e.x+Math.cos(e.windAngle)*length,e.y+Math.sin(e.windAngle)*length);
          c.setLineDash([]);
        }
      }
    }
    function enemies(g,reduce){
      for(const e of g.enemies)if(e.type==='bulwark'&&e.hp>0){
        const open=e.shieldOpen>g.t;c.save();c.strokeStyle=open?'#bac6d72a':'#c6a9ff65';c.lineWidth=1.4;c.setLineDash(open?[3,12]:[10,5]);ring(c,e.x,e.y,104);c.setLineDash([]);
        if(!open)for(const other of g.enemies)if(other!==e&&!other.boss&&other.hp>0&&Math.hypot(other.x-e.x,other.y-e.y)<104){c.strokeStyle='#c5a5ff3b';line(c,e.x,e.y,other.x,other.y);}
        c.restore();
      }
      for(const e of g.enemies){
        const age=g.t-e.born;
        if(age<.35){
          c.strokeStyle='#ffc1b294';c.lineWidth=1.3;
          ring(c,e.x,e.y,e.r+7+(.35-age)*62);
          c.globalAlpha=.38+age*1.77;
        }
        c.save();c.translate(e.x,e.y);c.rotate(e.angle);
        const flash=!reduce&&e.flash>g.t,wind=e.wind>g.t,col=e.boss&&Swarm.sector(g).id==='veil'?'#d2b5ff':e.boss&&Swarm.sector(g).id==='forge'?'#ffc28a':families[e.type];
        c.lineWidth=e.boss?2.7:1.75;
        c.strokeStyle=flash?(e.hitKind==='spear'?'#c8fff5':e.hitKind==='blade'?'#d5ff9d':'#fff7ec'):wind?'#ffe0a2':col;
        c.fillStyle=flash?'#ffb1a88a':col+'2d';
        const points=cachedShapes[e.type]??=(enemyShapes[e.type](e.r));
        path(c,points);c.fill();c.stroke();
        if(e.departAt!==undefined){c.globalAlpha=.38;c.strokeStyle='#9bf4de';}
        if(e.boss||e.type==='prism'||e.type==='sentry'){
          c.strokeStyle=col;ring(c,0,0,e.r*(e.boss?.43:.32));
          c.fillStyle=e.boss?(Swarm.exposed(g,e)?'#ffe098':'#fff2d6'):col;
          const r=e.boss?6:3.2;
          path(c,radial(4,r));c.fill();
          if(e.boss){
            c.rotate(reduce?0:g.t*.84);c.strokeStyle=col+'8c';path(c,radial(4,e.r*.72));c.stroke();
            if(e.hp<e.max*.5){c.strokeStyle='#ff907d9c';c.lineWidth=1.2;ring(c,0,0,e.r+5);}
          }
        }
        if(e.type==='pulsar'){
          c.strokeStyle='#ffc2d4';ring(c,0,0,e.r*.58);ring(c,0,0,e.r*.22);
        }
        if(e.type==='weaver'){c.strokeStyle='#ffd4a5';line(c,-e.r*.65,0,e.r*.65,0);line(c,0,-e.r*.25,0,e.r*.25);}
        if(e.type==='prism'){
          c.strokeStyle=e.shieldOpen>g.t?'#b6ffb36b':'#ded6ff';c.lineWidth=3;c.beginPath();c.arc(0,0,e.r+6,-1.05,1.05);c.stroke();
        }
        if(e.type==='bulwark'){c.strokeStyle=e.shieldOpen>g.t?'#b7ffa6':'#e9dfff';path(c,radial(6,10));c.stroke();}
        if(e.armored&&!e.boss){
          line(c,0,-e.r*.51,e.r*.40,0);line(c,e.r*.40,0,0,e.r*.51);
        }
        if(wind){
          c.setLineDash([4,5]);c.strokeStyle='#ffd398';
          ring(c,0,0,e.r+5+(e.wind-g.t)*12);
        }
        c.restore();c.globalAlpha=1;
        if(wind&&['weaver','pulsar','sentry','prism'].includes(e.type)){
          const progress=Math.max(0,Math.min(1,(g.t-(e.windStart??e.born))/(e.wind-(e.windStart??e.born))));
          for(let i=0;i<3;i++){c.fillStyle=progress>(i+1)/3?'#fff0cf':'#ba947b66';circle(c,e.x+(i-1)*8,e.y-e.r-14,2.2);c.fill();}
        }
        if(!e.boss&&e.hp<e.max&&e.hp>0){
          c.strokeStyle='#18252c';c.lineWidth=2.4;line(c,e.x-e.r,e.y-e.r-7,e.x+e.r,e.y-e.r-7);
          c.strokeStyle=e.armored?'#ffd485':'#ffa69b';c.lineWidth=1.7;
          line(c,e.x-e.r,e.y-e.r-7,e.x-e.r+e.r*2*e.hp/e.max,e.y-e.r-7);
        }
      }
    }
    function projectiles(g){
      for(const b of g.shots){
        const burst=b.kind==='burst',spear=b.kind==='spear';
        c.strokeStyle=burst?'#9bddffb0':spear?'#a8dfffea':'#6beed591';
        c.lineWidth=burst?6:spear?(g.upgrades.siege?6:4.2):b.kind==='counter'||b.kind==='reflect'?2.7:1.7;
        line(c,b.x,b.y,b.x-b.vx*(spear?.042:.031),b.y-b.vy*(spear?.042:.031));
        if(burst){
          c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));c.strokeStyle='#ffe3ac';c.lineWidth=1.4;path(c,[[9,0],[0,6],[-7,0],[0,-6]]);c.stroke();
          c.fillStyle='#fff0bc';for(const dy of [-5,5]){c.fillRect(-5,dy-1,2,2);c.fillRect(2,dy-1,2,2);}c.restore();
          const x=b.x+b.vx*Math.max(0,b.life),y=b.y+b.vy*Math.max(0,b.life);c.strokeStyle='#ffd78b59';c.lineWidth=1;ring(c,x,y,7);
        }
        c.fillStyle=burst?'#e1f8ff':spear?'#f3faff':'#c1ffe9';
        c.fillRect(b.x-1.25,b.y-1.25,burst?4.3:2.5,burst?4.3:2.5);
      }
      for(const b of g.hostile){
        c.strokeStyle='#fc6d7c95';c.lineWidth=1.7;
        line(c,b.x,b.y,b.x-b.vx*.052,b.y-b.vy*.052);
        c.fillStyle='#f37c755e';circle(c,b.x,b.y,b.amount>=16?6.2:5.1);c.fill();
        c.fillStyle='#ffc4a8';circle(c,b.x,b.y,b.amount>=16?3.7:2.9);c.fill();
      }
      for(const [i,s] of g.salvage.entries()){
        c.save();c.translate(s.x,s.y);c.rotate(i+g.t*1.8);
        c.fillStyle='#dcff8433';c.fillRect(-4,-4,8,8);
        c.fillStyle='#dbfa8f';c.fillRect(-2.3,-2.3,4.6,4.6);c.restore();
      }
    }
    function swarm(g,state){
      const p=g.player,ang=p.angle,cos=Math.cos(ang),sin=Math.sin(ang),mode=g.mode,n=g.drones-1,spin=g.t;
      const shield=guardRadius(g),blade=bladeRadius(g);
      if(mode==='ring'&&g.drones>=3){
        c.strokeStyle=g.shieldFlash>g.t?'#c6fff7':'#73f3e56c';c.lineWidth=g.shieldFlash>g.t?3:1.25;ring(c,p.x,p.y,shield);
      }else if(mode==='blades'){
        c.strokeStyle=g.weapon.held?'#86ffdac0':'#86ffda35';c.lineWidth=2.1;
        for(let arm=0;arm<3;arm++){
          const a=g.weapon.phase+arm*TAU/3;c.beginPath();c.arc(p.x,p.y,blade,a-.27,a+.27);c.stroke();
          c.strokeStyle='#b5ffe756';c.lineWidth=1;line(c,p.x+Math.cos(a)*28,p.y+Math.sin(a)*28,p.x+Math.cos(a)*blade,p.y+Math.sin(a)*blade);c.strokeStyle='#adffdbb0';c.lineWidth=2.1;
        }
      }else if(mode==='spear'){
        c.strokeStyle='#9ef3f97f';c.lineWidth=1;c.setLineDash([5,8]);
        line(c,p.x+cos*37,p.y+sin*37,p.x+cos*150,p.y+sin*150);c.setLineDash([]);
      }
      // Weapon state is drawn next to the core, never as another combat panel.
      c.save();c.lineWidth=1.6;
      if(mode==='spear'){
        c.strokeStyle='#8bc9e33b';ring(c,p.x,p.y,23);c.strokeStyle=g.weapon.railFlash>g.t?'#ffffff':'#afe8ff';
        c.beginPath();c.arc(p.x,p.y,23,-Math.PI/2,-Math.PI/2+Math.max(.005,g.weapon.lock)*TAU);c.stroke();
        c.strokeStyle='#afe8ff'+Math.round(25+g.weapon.lock*120).toString(16).padStart(2,'0');c.lineWidth=1.2;line(c,p.x+cos*24,p.y+sin*24,p.x+cos*77,p.y+sin*77);
        if(g.weapon.railFlash>g.t){c.lineWidth=3;line(c,p.x+cos*26,p.y+sin*26,p.x+cos*72,p.y+sin*72);}
      }else if(mode==='ring'){
        for(let i=0;i<3;i++){c.fillStyle=g.weapon.guardFlash>g.t||i<g.weapon.guard?'#e0fff3':'#729e9b5c';circle(c,p.x+(i-1)*9,p.y+22,2.2);c.fill();}
      }else{
        c.strokeStyle='#d6ff9c88';c.beginPath();c.arc(p.x,p.y,22,-Math.PI/2,-Math.PI/2+Math.max(.02,g.weapon.spin)*TAU);c.stroke();
      }
      c.restore();
      const rings=n>62?3:n>23?2:1,slots=Math.max(5,Math.ceil(n/rings));
      droneVisuals.length=Math.min(droneVisuals.length,n);
      const mix=state.frozen?0:1-Math.exp(-Math.max(state.dt,.007)*16);
      c.save();c.lineWidth=1;
      for(let i=0;i<n;i++){
        let x,y,a;
        if(mode==='spear'){
          const row=Math.floor((Math.sqrt(8*i+1)-1)/2),col=i-row*(row+1)/2;
          const f=77-row*12,side=(col-row*.5)*11;
          x=p.x+f*cos-side*sin;y=p.y+f*sin+side*cos;a=ang;
        }else if(mode==='blades'){
          const j=Math.floor(i/3),arm=i%3;
          a=g.weapon.phase+arm*TAU/3-j*.083;
          const r=28+(blade-28)*Math.min(j,12)/12+(j%3)*2;
          x=p.x+Math.cos(a)*r;y=p.y+Math.sin(a)*r;a+=1.5;
        }else{
          const row=Math.floor(i/slots);
          a=i%slots*TAU/slots+spin*(row%2?-.96:1.31)+row*.39;
          const r=shield+row*13;
          x=p.x+Math.cos(a)*r;y=p.y+Math.sin(a)*r;a+=Math.PI/2;
        }
        const d=droneVisuals[i]??=( {x,y} );
        d.x+=(x-d.x)*mix;d.y+=(y-d.y)*mix;
        const dx=Math.cos(a),dy=Math.sin(a),col=i===0&&g.repair?'#e7fb9b':i===1&&g.relay?'#ffdc8a':'#9bf9eb';
        c.strokeStyle=col;c.globalAlpha=.29;
        line(c,d.x,d.y,d.x-dx*(mode==='spear'?18:12),d.y-dy*(mode==='spear'?18:12));
        c.globalAlpha=.93;c.fillStyle=col;
        triangle(c,d.x+dx*4.8,d.y+dy*4.8,d.x-dx*3.3-dy*2.4,d.y-dy*3.3+dx*2.4,d.x-dx*3.3+dy*2.4,d.y-dy*3.3-dx*2.4);c.fill();
      }
      c.globalAlpha=!state.reduced&&p.inv>0&&Math.floor(p.inv*15)%2?.66:1;
      c.translate(p.x,p.y);c.rotate(ang);
      c.fillStyle='#06141b';circle(c,0,0,18);c.fill();c.strokeStyle='#c5fff39c';c.lineWidth=.8;ring(c,0,0,18);
      c.strokeStyle='#eafffa';c.lineWidth=1.75;path(c,[[14,0],[-8,-9],[-4,0],[-8,9]]);c.stroke();
      c.fillStyle='#cafff3';path(c,[[7,0],[-4,-4],[-2,0],[-4,4]]);c.fill();
      c.restore();
    }
    function effects(g,reduced){
      const stride=reduced?3:1;
      for(let i=0;i<g.fx.length;i+=stride){
        const f=g.fx[i],age=g.t-f.t,k=age/f.life;
        c.globalAlpha=(1-k)*(reduced?.50:.88);
        c.fillStyle=c.strokeStyle=colors[f.color];
        if(f.type==='link'){
          c.strokeStyle='#c5eaff';c.lineWidth=1.8;line(c,f.x,f.y,(f.x+f.endX)/2+5,(f.y+f.endY)/2-7);line(c,(f.x+f.endX)/2+5,(f.y+f.endY)/2-7,f.endX,f.endY);
        }else if(f.type==='spark'){
          const speed=age*(1-k*.40),size=1.2+1.7*(1-k);
          c.fillRect(f.x+f.vx*speed,f.y+f.vy*speed,size,size);
        }else if(f.type==='pulse'){
          c.lineWidth=1.7;ring(c,f.x,f.y,5+f.rad*(1-(1-k)**2));
        }else{
          c.save();c.translate(f.x,f.y);c.rotate(f.a||0);
          c.lineWidth=2.2*(1-k)+.8;
          if(f.type==='guard'){
            c.strokeStyle='#ccfff8';c.beginPath();c.arc(-5,0,f.rad,-1.05,1.05);c.stroke();
            line(c,4,-7,10,0);line(c,10,0,4,7);
          }else if(f.type==='pierce'){
            c.strokeStyle='#d1fff2';line(c,-f.rad-9,0,f.rad+19+k*16,0);
            c.strokeStyle='#90dbff';c.lineWidth=1;line(c,-7,-5,7,-5);line(c,-7,5,7,5);
          }else if(f.type==='cut'){
            c.strokeStyle='#d5ff9d';c.beginPath();c.arc(0,0,f.rad*(.8+k*.3),-.95+k*.4,.95+k*.4);c.stroke();
            if(!reduced){c.strokeStyle='#93f4d1';c.lineWidth=1;c.beginPath();c.arc(0,0,f.rad*.64,-.55,1.1);c.stroke();}
          }else if(f.type==='armor'){
            c.strokeStyle='#ffcd87';line(c,-5,-9,5,0);line(c,5,0,-5,9);
          }else if(f.type==='interrupt'){
            c.strokeStyle='#eaffb2';path(c,radial(6,f.rad*(1+k*.5)));c.stroke();
          }else if(f.type==='hurt'){
            c.font='800 13px ui-monospace,monospace';c.textAlign='center';c.textBaseline='middle';
            c.fillStyle='#ffc1b6';c.fillText('−'+f.rad,0,-27-(reduced?0:k*16));
          }
          c.restore();
        }
      }
      c.globalAlpha=1;
    }
    function annotations(g,{guide,aim,touch,keyLabel,weaponLabel,hullLabel}){
      if(weaponLabel&&!g.bossDefeated){
        const p=g.player,v=camera(g),x=Math.max(v.x+62,Math.min(v.x+v.w-62,p.x)),y=p.y+43>v.y+v.h-10?p.y-22:p.y+36;c.font='600 8px ui-monospace,monospace';c.textAlign='center';c.textBaseline='middle';
        c.fillStyle='#071218db';c.fillRect(x-59,y-7,118,13);c.fillStyle=g.mode==='spear'?'#b7e8ff':g.mode==='blades'?'#d5efad':'#a7e7dc';c.fillText(weaponLabel,x,y);
      }
      if(g.player.hp/g.player.max<=.3){const p=g.player,v=camera(g),x=Math.max(v.x+30,Math.min(v.x+v.w-30,p.x));c.strokeStyle='#ffac91';c.lineWidth=2.5;c.setLineDash([4,5]);ring(c,p.x,p.y,18);c.setLineDash([]);c.fillStyle='#ffc0a3';c.font='700 9px ui-monospace,monospace';c.textAlign='center';c.fillText(hullLabel+' '+Math.ceil(p.hp),x,p.y+55);}
      if(guide){
        const o=guide.target||guide.shot;
        if(guide.mode!==g.mode){
          const key=guide.mode?(keyLabel?.(guide.mode,true)||String(Swarm.modes.indexOf(guide.mode)+1)):'!';
          const p=g.player,v=camera(g),b=Math.max(9,key.length*4+3),x=Math.max(v.x+b+3,Math.min(v.x+v.w-b-3,p.x)),y=p.y-49<v.y+10?p.y+61:p.y-39;
          c.fillStyle='#0a1724f2';c.fillRect(x-b,y-10,b*2,16);
          c.strokeStyle=guide.mode?'#ffdc90':'#ff9b90';c.lineWidth=1;
          path(c,[[x-b,y-10],[x+b,y-10],[x+b,y+6],[x-b,y+6]]);c.stroke();
          c.font='700 12px ui-monospace,monospace';c.textAlign='center';c.textBaseline='middle';
          c.fillStyle=c.strokeStyle;c.fillText(key,x,y-2);
        }
        if(o){
          const r=guide.target?o.r+7:9,arm=guide.target?Math.min(9,r*.48):4.5;
          c.strokeStyle=!guide.mode?'#ffb38d':guide.mode===g.mode?'#95ffebc2':'#ffdc90';
          c.lineWidth=1.7;c.beginPath();
          for(const x of [-1,1])for(const y of [-1,1]){
            c.moveTo(o.x+x*r,o.y+y*(r-arm));c.lineTo(o.x+x*r,o.y+y*r);c.lineTo(o.x+x*(r-arm),o.y+y*r);
          }
          c.stroke();
        }
      }
      if(aim){
        c.strokeStyle='#ebfffac2';c.lineWidth=1.25;ring(c,aim.x,aim.y,7.5);
        line(c,aim.x-12,aim.y,aim.x-5,aim.y);line(c,aim.x+5,aim.y,aim.x+12,aim.y);
      }
      if(touch){
        c.strokeStyle='#abfff187';c.lineWidth=1.1;ring(c,touch.from.x,touch.from.y,34);
        const dx=touch.to.x-touch.from.x,dy=touch.to.y-touch.from.y,n=Math.max(1,Math.hypot(dx,dy)/34);
        const x=touch.from.x+dx/n,y=touch.from.y+dy/n;
        line(c,touch.from.x,touch.from.y,x,y);ring(c,x,y,8);
      }
    }
    function edgeContacts(g,view,state){
      const inset=11,center={x:view.x+view.w/2,y:view.y+view.h/2};
      const off=g.enemies.filter(e=>e.hp>0&&(e.boss||Math.hypot(e.x-g.player.x,e.y-g.player.y)<255)&&
        (e.x<view.x||e.x>view.x+view.w||e.y<view.y||e.y>view.y+view.h));
      for(const e of off.slice(0,8)){
        const dx=e.x-center.x,dy=e.y-center.y,ratio=Math.min((view.w/2-inset)/Math.max(.01,Math.abs(dx)),(view.h/2-inset)/Math.max(.01,Math.abs(dy)));
        const x=center.x+dx*ratio,y=center.y+dy*ratio,a=Math.atan2(dy,dx);
        c.save();c.translate(x,y);c.rotate(a);c.fillStyle=e.boss?'#ffd399':'#ff9b87ac';
        path(c,[[4,0],[-4,-3],[-4,3]]);c.fill();c.restore();
      }
      // Telegraph origins can sit beyond the camera while their patterns cross
      // the arena. Keep the deadline readable without requiring the adviser.
      const outside=h=>h.x<view.x||h.x>view.x+view.w||h.y<view.y||h.y>view.y+view.h;
      for(const h of g.hazards.filter(h=>['ray','wave'].includes(h.type)&&h.fire>g.t&&outside(h)).slice(0,4)){
        const dx=h.x-center.x,dy=h.y-center.y,ratio=Math.min((view.w/2-28)/Math.max(.01,Math.abs(dx)),(view.h/2-54)/Math.max(.01,Math.abs(dy)));
        const x=center.x+dx*ratio,y=center.y+dy*ratio,a=Math.atan2(dy,dx),label=h.type==='ray'?state.edgeBeamLabel:state.edgeRingLabel;
        if(!label)continue;
        c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#ffb69b';path(c,[[6,0],[-4,-4],[-4,4]]);c.fill();c.restore();
        const text=label+' '+Math.max(0,h.fire-g.t).toFixed(1)+'s',tx=Math.max(view.x+32,Math.min(view.x+view.w-32,x));
        c.fillStyle='#101a26eb';c.fillRect(tx-31,y+7,62,13);c.fillStyle='#ffd0b7';c.font='700 8px ui-monospace,monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(text,tx,y+14);
      }
    }
    function draw(g,state){
      const zone=state.menu||g.kind==='training'?Content.sectors[0]:Swarm.sector(g);
      bake(g.w,g.h,zone);
      const view=state.menu?{x:0,y:0,w:g.w,h:g.h}:camera(g);
      const sx=canvas.width/view.w,sy=canvas.height/view.h;
      c.setTransform(sx,0,0,sy,-view.x*sx,-view.y*sy);
      c.drawImage(background,0,0,g.w,g.h);
      if(state.menu){menuArt(g.w,g.h,state.wall,state.reduced);return;}
      const key=g.round+':'+(g.training?.index??'-');
      if(key!==lastKey||g!==lastGame){lastKey=key;lastGame=g;droneVisuals=[];}
      c.save();
      if(!state.reduced){
        const shake=Math.max(0,(g.hurtFlash-g.t)/.38);
        c.translate(Math.sin(g.t*97)*shake*5,Math.cos(g.t*76)*shake*4);
      }
      // Subtle motion gives each place its own rhythm without hiding combat silhouettes.
      c.save();c.strokeStyle=zone.palette[2]+'19';c.lineWidth=1.3;
      if(zone.id==='array'){
        c.translate(g.w*.57,g.h*.48);c.rotate(state.reduced?0:g.t*.13);
        for(const r of [160,230,310]){c.beginPath();c.arc(0,0,r,-.09,.09);c.stroke();}
      }else if(zone.id==='belt'){
        for(let i=0;i<11;i++){const x=(i*137+(state.reduced?0:g.t*9))%(g.w+60)-30,y=(i*173)%g.h;line(c,x,y,x-9,y+4);}
      }else{
        const k=state.reduced?.5:.5+.5*Math.sin(g.t*1.8);
        c.globalAlpha=.25+k*.6;ring(c,g.w*.5,g.h*.5,64+k*11);
      }
      c.restore();
      for(const f of g.fields){
        c.save();c.fillStyle=f.type==='cryo'?'#72d9ff22':'#a2ffe112';circle(c,f.x,f.y,f.radius);c.fill();c.strokeStyle=f.type==='cryo'?'#9eeaffc9':'#aff4d991';c.lineWidth=1.5;c.setLineDash([2,5]);ring(c,f.x,f.y,f.radius);
        if(f.type==='cryo'){c.setLineDash([]);for(let i=0;i<6;i++){const a=i*Math.PI/3;line(c,f.x+Math.cos(a)*5,f.y+Math.sin(a)*5,f.x+Math.cos(a)*14,f.y+Math.sin(a)*14);}}
        if(f.type==='gravity')ring(c,f.x,f.y,f.radius*(.35+Swarm.beatPhase(g)*.5));c.restore();
      }
      hazards(g,state.reduced);projectiles(g);enemies(g,state.reduced);swarm(g,state);effects(g,state.reduced);
      if(!state.frozen||state.inspect){annotations(g,state);edgeContacts(g,view,state);}
      c.restore();
    }
    return {draw};
  }
  function contactIcon(type){
    type=type==='archivist'?'warden':type==='crucible'?'reaver':type;
    const points=enemyShapes[type](10).map(([x,y])=>(x+16).toFixed(1)+','+(y+16).toFixed(1)).join(' ');
    return '<svg aria-hidden="true" viewBox="0 0 32 32" fill="none"><polygon points="'+points+'" stroke="'+families[type]+'" stroke-width="1.55"/></svg>';
  }
  return {create,icon,contactIcon,camera,project};
})();
