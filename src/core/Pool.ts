// Generic object pool. Iterate `active` backwards and call releaseAt(i) to recycle safely.
export class Pool<T> {
  readonly active: T[] = [];
  private free: T[] = [];

  constructor(
    private create: () => T,
    private onSpawn: (item: T) => void,
    private onRelease: (item: T) => void,
    prewarm = 0,
  ) {
    for (let i = 0; i < prewarm; i++) {
      const item = this.create();
      this.onRelease(item);
      this.free.push(item);
    }
  }

  spawn(): T {
    const item = this.free.pop() ?? this.create();
    this.active.push(item);
    this.onSpawn(item);
    return item;
  }

  releaseAt(index: number) {
    const item = this.active[index];
    const last = this.active.pop()!;
    if (index < this.active.length) this.active[index] = last;
    this.onRelease(item);
    this.free.push(item);
  }

  releaseAll() {
    for (let i = this.active.length - 1; i >= 0; i--) this.releaseAt(i);
  }
}
