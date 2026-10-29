// Conservative energy gate: record only turns containing sustained sound.
export class SpeechGate {
  constructor() { this.voicedMs = 0; this.quietMs = 0; this.totalMs = 0; this.heard = false; }
  update(rms, elapsed) {
    this.totalMs += elapsed;
    if (rms > 0.018) { this.voicedMs += elapsed; this.quietMs = 0; }
    else { this.quietMs += elapsed; if (!this.heard) this.voicedMs = 0; }
    if (this.voicedMs >= 180) this.heard = true;
    if (this.heard && this.quietMs >= 650) return 'send';
    if (this.totalMs >= 15000) return this.heard ? 'send' : 'discard';
    return null;
  }
}
export class MicrophoneListener {
  constructor({ context, onAudio, onListening, onError, onSpeechStart = () => {} }) {
    Object.assign(this, { context, onAudio, onListening, onError, onSpeechStart }); this.active = false;
  }
  async start() {
    this.active = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (!this.active) { stream.getTracks().forEach(track => track.stop()); return; }
      this.stream = stream;
      this.input = this.context.createMediaStreamSource(stream);
      this.analyser = this.context.createAnalyser(); this.analyser.fftSize = 1024;
      this.input.connect(this.analyser); // Never connect microphone to speakers.
      this.onListening(); this.listen();
    } catch (error) {
      if (!this.active) return;
      this.stop(); this.onError(error.name === 'NotAllowedError' ? 'Tillad mikrofonadgang i browseren, og prøv igen.' : 'Kunne ikke åbne mikrofonen. Tjek, at den er tilsluttet og ikke blokeret.');
    }
  }
  stop() {
    this.active = false; clearInterval(this.timer); clearTimeout(this.resumeTimer);
    if (this.recorder) { this.recorder.onstop = this.recorder.onerror = this.recorder.ondataavailable = null; if (this.recorder.state !== 'inactive') this.recorder.stop(); }
    this.stream?.getTracks().forEach(track => track.stop()); this.input?.disconnect(); this.analyser?.disconnect();
  }
  listen() {
    if (!this.active) return;
    this.stream.getAudioTracks().forEach(track => track.enabled = true);
    const mimeType = ['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) { this.stop(); this.onError('Browseren kan ikke optage et understøttet lydformat. Opdatér Firefox, Chrome eller Safari.'); return; }
    const recorder = new MediaRecorder(this.stream, { mimeType }); this.recorder = recorder;
    const gate = new SpeechGate(), samples = new Float32Array(1024), chunks = [];
    let send = false, previous = performance.now();
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => { if (this.active) { this.stop(); this.onError('Mikrofonoptagelsen fejlede. Start samtalen igen.'); } };
    recorder.onstop = () => {
      clearInterval(this.timer);
      if (!this.active) return;
      // Keep recording while transcription, generation and playback run.
      this.listen();
      if (send && chunks.length) {
        Promise.resolve().then(() => this.onAudio(new Blob(chunks, { type: mimeType }))).catch(error => {
          if (this.active && error.name !== 'AbortError') { this.stop(); this.onError(error.message); }
        });
      }
    };
    recorder.start();
    this.timer = setInterval(() => {
      if (!this.active || recorder.state !== 'recording') return;
      this.analyser.getFloatTimeDomainData(samples);
      let sum = 0; for (const sample of samples) sum += sample * sample;
      const wasHeard = gate.heard;
      const now = performance.now(), action = gate.update(Math.sqrt(sum / samples.length), now - previous); previous = now;
      if (!wasHeard && gate.heard) this.onSpeechStart();
      if (action) { send = action === 'send'; clearInterval(this.timer); recorder.stop(); }
    }, 50);
  }
}
