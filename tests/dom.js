// A narrow DOM, Canvas and Web Audio contract for exercising the packaged scripts.
const assert=(v,msg)=>{if(!v)throw new Error(msg);};
const report=typeof print==='function'?print:console.log;
class Target{
  constructor(){this.events={};}
  addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
  send(name,extra={}){
    const event={target:this,preventDefault(){this.defaultPrevented=true;},...extra};
    for(const fn of this.events[name]||[])fn(event);
    return event;
  }
}
const host=new Target();
globalThis.addEventListener=(...args)=>host.addEventListener(...args);
const view={width:1600,height:900};
globalThis.devicePixelRatio=2;
let nextFrame=null,now=0,observer=null;
globalThis.requestAnimationFrame=fn=>{nextFrame=fn;};
globalThis.matchMedia=()=>({matches:false});
globalThis.ResizeObserver=class{constructor(fn){observer=fn;}observe(){}};

const drawStats={calls:0,depth:0,paint:0};
const noop=()=>{};
const drawing={
  createRadialGradient(){return {addColorStop:noop};},
  save(){drawStats.depth++;},
  restore(){assert(drawStats.depth>0,'Canvas restore underflow');drawStats.depth--;},
  fill(){drawStats.paint++;},stroke(){drawStats.paint++;}
};
for(const k of ['setTransform','fillText','fillRect','moveTo','lineTo','arc','translate','rotate','scale','drawImage','setLineDash','beginPath','closePath']){
  drawing[k]=(...args)=>{
    for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),'Non-finite Canvas coordinate in '+k);
    if(k==='arc')assert(args[2]>=0,'Negative arc radius');
    if(k==='fillText'&&drawStats.text)drawStats.text.push(args[0]);
    drawStats.calls++;
  };
}
class Element extends Target{
  constructor(tag='div'){
    super();this.tagName=tag.toUpperCase();this.children=[];this.style={};this.dataset={};this.attributes={};
    this.textContent='';this.className='';this.selected={};this.hidden=false;this.disabled=false;
  }
  setAttribute(k,v){this.attributes[k]=String(v);}
  append(child){this.children.push(child);}
  replaceChildren(...parts){this.children=parts;}
  get firstElementChild(){return this.children[0];}
  click(){this.send('click');}
  querySelector(selector){
    const key=selector.startsWith('.')?selector.slice(1):selector;
    if(!String(this.innerHTML).includes(key))return null;
    return this.selected[selector]??=(new Element(selector.startsWith('.')?'span':selector));
  }
  getContext(){return drawing;}
  getBoundingClientRect(){return {width:view.width,height:view.height,left:0,top:0};}
  setPointerCapture(){this.capture=true;}
  focus(){document.activeElement=this;}
  blur(){if(document.activeElement===this)document.activeElement=null;}
  matches(){return false;}
}
const dom=Object.fromEntries(Object.entries(bundledMarkup.ids).map(([id,tag])=>[id,new Element(tag)]));
dom.wavePips.children=[new Element('i'),new Element('i'),new Element('i'),new Element('i')];
const doc=new Target(),body=new Element('body');
Object.assign(doc,{
  activeElement:body,hidden:false,fullscreenElement:null,
  getElementById:id=>dom[id]||null,createElement:tag=>new Element(tag),
  querySelectorAll(selector){
    assert(selector==='[data-t]','Unexpected document query');
    return bundledMarkup.strings.map(([id,tag,key])=>{
      const node=id?dom[id]:new Element(tag);
      node.dataset.t=key;return node;
    });
  }
});
globalThis.document=doc;
const storage=new Map();
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
let pad=null;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>pad?[pad]:[]}});
let fsRequests=0,fsExits=0,fsReject=false;
dom.game.requestFullscreen=()=>{
  fsRequests++;
  if(fsReject)throw new Error('Fullscreen not granted by the browser');
  doc.fullscreenElement=dom.game;doc.send('fullscreenchange');return Promise.resolve();
};
doc.exitFullscreen=()=>{
  fsExits++;doc.fullscreenElement=null;doc.send('fullscreenchange');return Promise.resolve();
};
const audioStats={created:0,voices:0};
const param=()=>({value:0,setValueAtTime:noop,linearRampToValueAtTime:noop,exponentialRampToValueAtTime:noop,setTargetAtTime:noop});
globalThis.AudioContext=class{
  constructor(){this.state='running';this.destination={};audioStats.created++;}
  get currentTime(){return now/1000;}
  createGain(){return {gain:param(),connect:noop};}
  createOscillator(){return {frequency:param(),start(){audioStats.voices++;},stop:noop,connect:noop};}
};
function frames(n){
  for(let i=0;i<n;i++){
    now+=1000/60;
    nextFrame(now);
    assert(drawStats.depth===0,'Canvas state leaked between frames');
  }
}
function key(name){
  return host.send('keydown',{key:name,target:doc.activeElement||body});
}
function up(name){host.send('keyup',{key:name});}
function click(node){
  assert(!node.disabled,'Clicked a disabled control');
  return node.send('click');
}
