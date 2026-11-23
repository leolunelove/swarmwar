const FlightBindings=(()=>{
  const defaults=Object.freeze({up:'w',down:'s',left:'a',right:'d',ring:'1',spear:'2',blades:'3',burst:' '});
  const arrows=Object.freeze({arrowup:'up',arrowdown:'down',arrowleft:'left',arrowright:'right'});
  const valid=key=>typeof key==='string'&&/^[a-z0-9 ]$/.test(key)&&!['q','e','f','p'].includes(key);
  const label=key=>key===' '?'SPACE':key.toUpperCase();
  function create(saved){
    let keys={...defaults};
    if(saved&&typeof saved==='object'){
      const proposed=Object.keys(defaults).map(id=>saved[id]);
      if(proposed.every(valid)&&new Set(proposed).size===proposed.length)
        keys=Object.fromEntries(Object.keys(defaults).map((id,i)=>[id,proposed[i]]));
    }
    const action=key=>arrows[key]||Object.keys(keys).find(id=>keys[id]===key);
    const display=id=>label(keys[id]);
    const snapshot=()=>({...keys});
    const reset=()=>{keys={...defaults};};
    function set(id,key){
      if(!Object.hasOwn(defaults,id)||!valid(key))return false;
      const other=action(key);
      if(other&&other!==id)keys[other]=keys[id];
      keys[id]=key;
      return true;
    }
    return {action,display,snapshot,reset,set};
  }
  return {create};
})();
