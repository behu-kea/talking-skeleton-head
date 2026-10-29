// Cached voice clips never hold up the real reply or trigger a TTS request per turn.
export class ThinkingSounds {
  // Browser timers require Window as their receiver, not this class instance.
  constructor(context, destination, { random = Math.random, schedule = (callback, delay) => globalThis.setTimeout(callback, delay), cancel = timer => globalThis.clearTimeout(timer) } = {}) {
    Object.assign(this, { context, destination, random, schedule, cancel });
    this.buffers = []; this.thinking = false; this.source = null; this.timer = null; this.lastIndex = -1;
  }
  setThinking(thinking) {
    if (thinking === this.thinking) return;
    this.thinking = thinking;
    this.cancel(this.timer); this.timer = null;
    if (!thinking) { this.stopSound(); return; }
    // Acknowledge every turn immediately, without delaying the real reply.
    this.timer = this.schedule(() => {
      if (!this.thinking || !this.buffers.length) return;
      const source = this.context.createBufferSource();
      const choices = this.buffers.map((_, index) => index).filter(index => this.buffers.length === 1 || index !== this.lastIndex);
      const index = choices[Math.floor(this.random() * choices.length)];
      source.buffer = this.buffers[index]; this.lastIndex = index;
      source.connect(this.destination); this.source = source;
      source.onended = () => { source.disconnect(); if (this.source === source) this.source = null; };
      source.start();
    }, 0);
  }
  stopSound() {
    const source = this.source; this.source = null;
    if (source) { source.onended = null; try { source.stop(); } catch {} source.disconnect(); }
  }
}
