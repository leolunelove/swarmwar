let game;
const createGame=Swarm.create;
Swarm.create=(...args)=>(game=createGame(...args));
const restoreGame=Swarm.restore;
Swarm.restore=(...args)=>(game=restoreGame(...args));
const retryGame=Swarm.retryCheckpoint;
Swarm.retryCheckpoint=(...args)=>(game=retryGame(...args));
