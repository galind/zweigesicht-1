export type QualityMode = 'Auto' | 'Low' | 'High';

/** Mouse events only accumulate intent; the next requested frame consumes it once. */
export class LookActivity {
  x = 0;
  y = 0;
  pending = false;
  lastInput = -Infinity;
  previousFrame: number | null = null;
  add(x: number, y: number, now: number) {
    if (!x && !y) return;
    this.lastInput = now;
    this.x += x;
    this.y += y;
    this.pending = true;
  }
  consume(now: number, moving: boolean) {
    // A short scheduling-only tail measures frame cadence even with sparse mouse
    // events. It never requests a redundant render or includes a sleeping interval.
    const active = moving || this.pending || now - this.lastInput < 80;
    const elapsed =
      active && this.previousFrame !== null ? now - this.previousFrame : null;
    const result = {
      x: this.x,
      y: this.y,
      looked: this.pending,
      active,
      elapsed,
    };
    this.x = this.y = 0;
    this.pending = false;
    this.previousFrame = active ? now : null;
    return result;
  }
  clear() {
    this.lastInput = -Infinity;
    this.x = this.y = 0;
    this.pending = false;
    this.previousFrame = null;
  }
}

/** Conservative session policy: automatic resolution only steps down.
 * No periodic recovery probes/resizes during exploration. Selecting Auto again
 * starts a new assessment; explicit High/Low remain fixed until changed.
 */
export class BenchQuality {
  mode: QualityMode = 'Auto';
  ratio: number;
  readonly ceiling: number;
  private readonly minimum: number;
  private samples: number[] = [];
  private duration = 0;
  private slowWindows = 0;
  private cooldown = 0;
  constructor(dpr: number, ceiling = 1, minimum = 0.7) {
    this.minimum = minimum;
    this.ceiling = Math.min(dpr, ceiling);
    this.ratio = this.ceiling;
  }
  select(mode: QualityMode, dpr: number) {
    this.mode = mode;
    this.ratio =
      mode === 'High'
        ? Math.min(dpr, 1.5)
        : mode === 'Low'
          ? Math.min(dpr, 0.85)
          : this.ceiling;
    this.resetSamples();
    this.cooldown = 0;
    return this.ratio;
  }
  resetSamples() {
    this.samples = [];
    this.duration = this.slowWindows = 0;
  }
  sample(ms: number): boolean {
    if (this.mode !== 'Auto' || !Number.isFinite(ms) || ms <= 0) return false;
    // Cooldown uses active time, so an idle menu cannot trigger a new resize.
    if (this.cooldown > 0) {
      this.cooldown -= ms;
      return false;
    }
    this.samples.push(ms);
    this.duration += ms;
    if (this.duration < 1500 || this.samples.length < 40) return false;
    const sorted = this.samples.sort((a, b) => a - b);
    // Repeated missed refreshes are stutter even with a healthy median/p75.
    // Require two windows with a slow p95; isolated stalls still do
    // not resize the scene. This includes close CAD on logarithmic-depth GPUs.
    const slow = sorted[Math.floor((sorted.length - 1) * 0.95)] > 22;
    this.slowWindows = slow ? this.slowWindows + 1 : 0;
    this.samples = [];
    this.duration = 0;
    if (this.slowWindows < 2) return false;
    this.slowWindows = 0;
    // Slower fallback backends can still miss refresh at .7. Only that path
    // permits the extra bounded steps; explicit High/Low are never altered.
    const next = [1, 0.85, 0.7, 0.6, 0.5].find(
      (r) => r >= this.minimum && r < this.ratio - 0.01,
    );
    if (next === undefined) return false;
    this.ratio = next;
    this.cooldown = 5000;
    return true;
  }
}
