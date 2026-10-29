import { MicrophoneListener } from './listener.js';
import { jawFromSamples } from './audio.js';
import { skull } from './skull.js';
import { PCMPlayer } from './pcm-player.js';
import './style.css';
const $ = id => document.getElementById(id);
$('apparition').innerHTML = skull + '<div class="thought-bubble" aria-hidden="true"><i></i><i></i><span><b></b><b></b><b></b></span></div>';
$('skull').setAttribute('aria-label', 'Kaptajn Knogles kranium med glødende øjne');
const state = { generation:0, listener:null, request:null, audio:null, player:null, analyser:null,  history:[], jaw:0, wake:null, config:null, turnId:0 };
function status(text, speaking=false, thinking=false) {
  $('status').textContent=text; document.body.classList.toggle('speaking',speaking);
  document.body.classList.toggle('thinking',thinking);
}
function notice(text='') {
  $('notice').textContent=text; $('notice').hidden=!text;
  // Bring setup/error messages back into view instead of hiding them on stage.
  if(text && document.fullscreenElement)void document.exitFullscreen().catch(()=>{});
}
function interrupt() {
  ++state.turnId; state.request?.abort(); state.request=null;
  state.player?.stop(); state.player=null;
  status('Jeg lytter. Tal til mig.');
}
async function respond(blob, token) {
  if(token!==state.generation)return;
  interrupt(); const turnId=state.turnId;
  try { await turn(blob, token, turnId); }
  catch(error) {
    if(token===state.generation && turnId===state.turnId && error.name!=='AbortError') { stop(); notice(error.message); }
  } finally {
    if(token===state.generation && turnId===state.turnId) {state.request=null;status('Jeg lytter. Tal til mig.');}
  }
}
function stop() {
  ++state.generation; interrupt(); state.listener?.stop(); state.listener=null;
  document.body.classList.remove('active'); $('conversation').textContent='Start samtale'; status('Klar til at tale');
  state.wake?.release().catch(()=>{}); state.wake=null;
}
async function api(path, body, signal) {
  const audio=body instanceof Blob;
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':audio?body.type:'application/json'},body:audio?body:JSON.stringify(body),signal});
  if(!response.ok) {const data=await response.json().catch(()=>({})); throw new Error(data.error || 'Serveren kunne ikke svare. Genstart appen og prøv igen.');}
  return response;
}
async function turn(blob, token, turnId) {
  const request=new AbortController(); state.request=request;
  const started=performance.now(); let transcribed, replied;
  status('Lytter til din replik…',false,true);
  const {text}=await (await api('/api/transcribe',blob,request.signal)).json();
  if((token!==state.generation || turnId!==state.turnId) || !text?.trim()) return;
  transcribed=performance.now();
  status('Kaptajnen tænker…',false,true);
  const {text:reply}=await (await api('/api/chat',{text:text.slice(0,1500),history:state.history},request.signal)).json();
  if(token!==state.generation || turnId!==state.turnId) return;
  replied=performance.now();
  status('Kaptajnen gør klar til at svare…',false,true);
  const response=await api('/api/speak',{text:reply},request.signal);
  if(token!==state.generation || turnId!==state.turnId) { await response.body?.cancel(); return; }
  await state.audio.resume();
  if(token!==state.generation || turnId!==state.turnId) { await response.body?.cancel(); return; }
  const player=new PCMPlayer(state.audio,state.analyser);state.player=player;
  try {
    await player.play(response,request.signal,()=>{
      status('Kaptajnen taler…',true);
      console.info('Svartid (ms)', {transskription:Math.round(transcribed-started),svar:Math.round(replied-transcribed),stemme:Math.round(performance.now()-replied),total:Math.round(performance.now()-started)});
    });
    if(token===state.generation && turnId===state.turnId)state.history=[...state.history,{role:'user',content:text.slice(0,1500)},{role:'assistant',content:reply}].slice(-12);
  } finally { if(state.player===player)state.player=null; }
}
$('conversation').onclick=async()=>{
  if(state.listener){stop();return;}
  notice();
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){notice('Browseren mangler mikrofonoptagelse. Brug en opdateret Firefox, Chrome, Edge eller Safari på localhost.');return;}
  if(!state.config?.hasKey || !state.config?.hasVoice || !state.config?.hasOpenAI){notice('Udfyld OPENAI_API_KEY, ELEVENLABS_API_KEY og ELEVENLABS_VOICE_ID i .env, og genstart appen.');return;}
  stop();const token=state.generation;state.history=[];
  try{
    if(!state.audio){state.audio=new AudioContext();state.analyser=state.audio.createAnalyser();state.analyser.fftSize=1024;state.analyser.connect(state.audio.destination);}
    await state.audio.resume();if(token!==state.generation)return;
    state.listener=new MicrophoneListener({context:state.audio,onAudio:blob=>respond(blob,token),onSpeechStart:()=>{if(token===state.generation)interrupt();},onListening:()=>{if(token===state.generation)status('Jeg lytter. Tal til mig.');},onError:message=>{if(token===state.generation){stop();notice(message);}}});
    document.body.classList.add('active');$('conversation').textContent='Stop samtale';status('Åbner mikrofonen…');
    await state.listener.start();
    if(token===state.generation && state.listener && 'wakeLock' in navigator)state.wake=await navigator.wakeLock.request('screen').catch(()=>null);
  }catch(error){if(token===state.generation){stop();notice(error.message);}}
};
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notice('Brug browserens fuldskærmsfunktion.');}}
$('fullscreen').onclick=fullscreen;
document.addEventListener('keydown',event=>{if(event.key==='Escape')stop();if(event.key.toLowerCase()==='f')void fullscreen();});
window.addEventListener('pagehide',stop);
const samples=new Float32Array(1024),reduced=matchMedia('(prefers-reduced-motion: reduce)');let last=0;
function animate(time){const delta=Math.min(50,time-last||16);last=time;let target=0;if(state.player?.sources.size){state.analyser.getFloatTimeDomainData(samples);target=jawFromSamples(samples,2.4);}state.jaw+=(target-state.jaw)*(1-Math.exp(-delta/(target>state.jaw?35:75)));$('mandible').setAttribute('transform',`translate(0 ${state.jaw*31}) rotate(${state.jaw*1.3} 250 330)`);$('skull-motion').style.transform=reduced.matches?'':`translateY(${Math.sin(time/1700)*3}px) rotate(${Math.sin(time/2700)*.7}deg)`;requestAnimationFrame(animate);}
requestAnimationFrame(animate);
async function load(){ $('conversation').disabled=true;try{const response=await fetch('/api/config');if(!response.ok)throw new Error();state.config=await response.json();if(state.config.version!==3)notice('Serveren kører den gamle version. Stop den med Ctrl+C, kør npm run dev, og genindlæs siden.');}catch{notice('Kan ikke forbinde til den lokale server. Start appen med npm run dev.');}finally{$('conversation').disabled=false;}}
void load();
