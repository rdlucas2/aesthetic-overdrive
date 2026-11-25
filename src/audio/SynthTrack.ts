import type { TrackDef } from '../data/tracks';

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Procedural vaporwave/synthwave backing so the prototype needs no audio assets.
// Schedules notes on the Web Audio timeline with a lookahead; the BeatClock reads the same timeline.
export class SynthTrack {
  private timer: ReturnType<typeof setInterval> | undefined;
  private nextStep = 0;
  private t0 = 0;
  private master: GainNode;
  private bus: GainNode;
  private noise: AudioBuffer;
  private stepDur: number;

  constructor(private ctx: AudioContext, private track: TrackDef) {
    const spb = 60 / track.bpm;
    this.stepDur = spb / 4;

    const comp = ctx.createDynamicsCompressor();
    this.master = ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(comp).connect(ctx.destination);

    this.bus = ctx.createGain();
    this.bus.connect(this.master);
    const delay = ctx.createDelay(2);
    delay.delayTime.value = spb * 0.75; // dotted eighth
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(this.master);
    this.bus.connect(delay);

    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  /** audioTime is the AudioContext time of the track's start. Returns after scheduling begins. */
  start(audioTime: number) {
    this.t0 = audioTime + this.track.offset;
    this.nextStep = 0;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.1);
  }

  private schedule() {
    const horizon = this.ctx.currentTime + 0.3;
    for (;;) {
      const time = this.t0 + this.nextStep * this.stepDur;
      if (time >= horizon) break;
      if (time > this.ctx.currentTime - 0.05) this.playStep(this.nextStep, time);
      this.nextStep++;
    }
  }

  private playStep(step: number, t: number) {
    const L = this.track.layers;
    const bar = Math.floor(step / 16);
    const s = step % 16;
    const chord = this.track.chords[bar % this.track.chords.length];

    if (s % 4 === 0) this.kick(t);
    if (bar >= L.clap && (s === 4 || s === 12)) this.clap(t);
    if (bar >= L.hat && (bar >= L.hat16 || s % 4 === 2)) this.hat(t, bar >= L.hat16 && s % 2 === 1 ? 0.04 : 0.08);
    if (bar >= L.bass && s % 2 === 0) this.bass(t, chord[0] - 24 + (s === 6 || s === 14 ? 12 : 0));
    if (s === 0) this.pad(t, chord, this.stepDur * 16);
    if (bar >= L.arp) {
      const notes = [chord[0], chord[1], chord[2], chord[1] + 12];
      this.pluck(t, notes[(s >> 1) % 4] + 12 * ((s >> 3) & 1), s % 2 === 0 ? 0.09 : 0.05);
    }
  }

  private env(g: GainNode, t: number, peak: number, attack: number, release: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }

  private osc(type: OscillatorType, freq: number, t: number, dur: number, out: AudioNode): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.connect(out);
    o.start(t);
    o.stop(t + dur);
    return o;
  }

  private kick(t: number) {
    const g = this.ctx.createGain();
    g.connect(this.master);
    this.env(g, t, 0.9, 0.003, 0.28);
    const o = this.osc('sine', 150, t, 0.35, g);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  }

  private noiseHit(t: number, dur: number, peak: number, hp: number, out: AudioNode) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const g = this.ctx.createGain();
    this.env(g, t, peak, 0.002, dur);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  private clap(t: number) { this.noiseHit(t, 0.18, 0.35, 1200, this.bus); }
  private hat(t: number, vol: number) { this.noiseHit(t, 0.05, vol, 7000, this.master); }

  private bass(t: number, midi: number) {
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(180, t + 0.18);
    f.connect(g).connect(this.master);
    this.env(g, t, 0.32, 0.005, 0.2);
    this.osc('sawtooth', mtof(midi), t, 0.3, f);
  }

  private pad(t: number, chord: number[], dur: number) {
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1400;
    f.connect(g).connect(this.bus);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.12, t + dur * 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    for (const m of chord) {
      for (const detune of [-9, 9]) {
        const o = this.osc('sawtooth', mtof(m), t, dur + 0.05, f);
        o.detune.value = detune;
      }
    }
  }

  private pluck(t: number, midi: number, vol: number) {
    const g = this.ctx.createGain();
    g.connect(this.bus);
    this.env(g, t, vol, 0.003, 0.16);
    this.osc('square', mtof(midi + 12), t, 0.2, g);
  }
}
