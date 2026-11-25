// Beat clock derived from AUDIO time (not frame time). `now` returns seconds on the audio timeline.
export class BeatClock {
  private startAt = 0;
  readonly secPerBeat: number;

  constructor(private now: () => number, readonly bpm: number, readonly offset: number) {
    this.secPerBeat = 60 / bpm;
  }

  start(audioTime: number) { this.startAt = audioTime; }

  /** Fractional beat position; negative before the first beat. */
  beat(): number {
    return (this.now() - this.startAt - this.offset) / this.secPerBeat;
  }
}
