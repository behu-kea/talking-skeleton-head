import test from 'node:test';
import assert from 'node:assert/strict';
import { PCMDecoder, PCMPlayer } from '../src/pcm-player.js';
test('PCM decode preserves split samples, signed values and byte offsets',()=>{
 const decoder=new PCMDecoder();
 assert.deepEqual([...decoder.decode(Uint8Array.of(0))],[]);
 assert.deepEqual([...decoder.decode(Uint8Array.of(128,255,127,0))],[-1,32767/32768]);
 assert.deepEqual([...decoder.decode(Uint8Array.of(0))],[0]);
 assert.equal(decoder.pending,null);
 assert.deepEqual([...decoder.decode(Uint8Array.of(9,0,128,9).subarray(1,3))],[-1]);
});
function context(){return {currentTime:0,scheduled:[],createBuffer(_,length,rate){return {duration:length/rate,copyToChannel(){}};},createBufferSource(){const source={connect(){},disconnect(){},stop(){this.stopped=true;},start(time){this.time=time;}};this.scheduled.push(source);return source;}};}
test('playback schedules first packet before the HTTP stream finishes',async()=>{
 let controller; const stream=new ReadableStream({start(c){controller=c;}});
 const audio=context(),player=new PCMPlayer(audio,{});let first=false;
 const playing=player.play(new Response(stream,{headers:{'X-Audio-Sample-Rate':'24000'}}),new AbortController().signal,()=>first=true);
 controller.enqueue(Uint8Array.of(0,0,255,127));
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(first,true);assert.equal(audio.scheduled.length,1);
 controller.enqueue(Uint8Array.of(0,128));controller.close();
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(audio.scheduled.length,2);
 for(const source of audio.scheduled)source.onended();
 await playing;
});
test('stop cancels reader and all queued audio',async()=>{
 let controller,cancelled=false;const stream=new ReadableStream({start(c){controller=c;},cancel(){cancelled=true;}});
 const audio=context(),player=new PCMPlayer(audio,{}),abort=new AbortController();
 const playing=player.play(new Response(stream,{headers:{'X-Audio-Sample-Rate':'24000'}}),abort.signal);
 controller.enqueue(Uint8Array.of(0,0));await new Promise(resolve=>setTimeout(resolve,0));
 abort.abort();await playing;
 assert.equal(cancelled,true);assert.ok(audio.scheduled.every(source=>source.stopped));assert.equal(player.sources.size,0);
});
