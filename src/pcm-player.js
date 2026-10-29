// Preserve samples split across arbitrary network packet boundaries.
export class PCMDecoder {
  constructor() { this.pending = null; }
  decode(bytes) {
    if (this.pending !== null) { const merged = new Uint8Array(bytes.length + 1); merged[0] = this.pending; merged.set(bytes, 1); bytes = merged; this.pending = null; }
    if (bytes.length % 2) this.pending = bytes[bytes.length - 1];
    const count = Math.floor(bytes.length / 2), samples = new Float32Array(count);
    const view = new DataView(bytes.buffer, bytes.byteOffset, count * 2);
    for (let i = 0; i < count; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
    return samples;
  }
}
export class PCMPlayer {
  constructor(context, destination) { this.context = context; this.destination = destination; this.sources = new Set(); this.stopped = false; this.nextTime = 0; }
  stop() {
    this.stopped = true;
    for (const source of this.sources) { source.onended = null; try { source.stop(); } catch {} source.disconnect(); }
    this.sources.clear(); this.finish?.(); void this.reader?.cancel().catch(() => {});
  }
  async play(response, signal, onFirstAudio) {
    const rate = Number(response.headers.get('X-Audio-Sample-Rate'));
    if (rate !== 24000 || !response.body) throw new Error('Serveren skal genstartes for at bruge hurtig taleafspilning.');
    if (signal.aborted || this.stopped) return;
    const abort = () => this.stop(); signal.addEventListener('abort', abort, { once: true });
    const decoder = new PCMDecoder(); this.reader = response.body.getReader();
    let received = false, ended = false;
    const playback = new Promise(resolve => this.finish = resolve);
    try {
      while (!this.stopped) {
        const { value, done } = await this.reader.read(); if (done) break;
        if (this.stopped) break;
        const samples = decoder.decode(value); if (!samples.length) continue;
        const buffer = this.context.createBuffer(1, samples.length, rate); buffer.copyToChannel(samples, 0);
        const source = this.context.createBufferSource(); source.buffer = buffer; source.connect(this.destination);
        this.sources.add(source);
        source.onended = () => { source.disconnect(); this.sources.delete(source); if (ended && !this.sources.size) this.finish(); };
        this.nextTime = Math.max(this.nextTime, this.context.currentTime + (received ? .02 : .08));
        source.start(this.nextTime); this.nextTime += buffer.duration;
        if (!received) { received = true; onFirstAudio?.(); }
      }
      ended = true;
      if (!this.stopped && (!received || decoder.pending !== null)) throw new Error('Lydstrømmen var tom eller afbrudt. Prøv igen.');
      if (!this.sources.size) this.finish();
      await playback;
    } catch (error) { this.stop(); throw error; }
    finally { signal.removeEventListener('abort', abort); this.reader.releaseLock(); }
  }
}
