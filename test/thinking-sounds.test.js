import test from 'node:test';
import assert from 'node:assert/strict';
import { ThinkingSounds } from '../src/thinking-sounds.js';
function fixture(random=()=>0) {
 const sources=[],jobs=[];const context={createBufferSource(){const source={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(source);return source;}};
 const sounds=new ThinkingSounds(context,{}, {random,schedule:callback=>{jobs.push(callback);return jobs.length;},cancel:()=>{}});sounds.buffers=[{}];return {sounds,sources,jobs};
}
test('one immediate murmur per thinking turn, despite phase updates',()=>{
 const {sounds,jobs,sources}=fixture();sounds.setThinking(true);sounds.setThinking(true);
 assert.equal(jobs.length,1);jobs[0]();assert.equal(sources.length,1);assert.equal(sources[0].started,true);
 sounds.setThinking(false);assert.equal(sources[0].stopped,true);assert.equal(sounds.source,null);
});
test('fast replies and cancellation suppress a pending murmur',()=>{
 const {sounds,jobs,sources}=fixture();sounds.setThinking(true);sounds.setThinking(false);jobs[0]();assert.equal(sources.length,0);
});
test('every turn gets a murmur, and missing clips never block the reply',()=>{
 const active=fixture(()=>.9);active.sounds.setThinking(true);assert.equal(active.jobs.length,1);active.jobs[0]();assert.equal(active.sources.length,1);
 const empty=fixture();empty.sounds.buffers=[];empty.sounds.setThinking(true);empty.jobs[0]();assert.equal(empty.sources.length,0);
});
test('default timers retain the global receiver required by browsers',()=>{
 const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
 let scheduled=0,cancelled=0;
 try {
   globalThis.setTimeout=function(callback,delay){assert.equal(this,globalThis);assert.equal(delay,0);scheduled++;return 42;};
   globalThis.clearTimeout=function(){assert.equal(this,globalThis);cancelled++;};
   const sounds=new ThinkingSounds({}, {}, {random:()=>0});
   sounds.setThinking(true);sounds.setThinking(false);
   assert.equal(scheduled,1);assert.equal(cancelled,2);
 } finally {globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}
});

test('consecutive turns never repeat the same clip',()=>{
 const {sounds,jobs,sources}=fixture();sounds.buffers=[{id:0},{id:1},{id:2}];
 for(let i=0;i<10;i++){
   sounds.setThinking(true);jobs[i]();sounds.setThinking(false);
   if(i>0)assert.notEqual(sources[i].buffer,sources[i-1].buffer);
 }
});
