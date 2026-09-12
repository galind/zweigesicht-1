/** M1 only. Column vectors, flat ROW-major matrices; STEP world mm, RH +Z radians.
 * No scene, wall clock, integration, graph traversal, or retired cycle defaults.
 */
export type Matrix = readonly number[];
export interface Evidence {
  evidenceId: string;
  units: string;
  frame: string;
  derivation: string;
  confidence: string;
  reviewStatus: string;
}
export interface Parameter<T> extends Evidence {
  value: T;
}
export interface Shaft {
  id: string;
  members: readonly string[];
  pivot: Parameter<readonly number[]>;
  axis: Parameter<readonly number[]>;
  membership: Evidence;
}
export interface Diagnostic {
  id: string;
  status: string;
  reason: string;
  evidenceId: string;
}
export interface Parameters {
  id: string;
  shafts: readonly Shaft[];
  diagnostics: readonly Diagnostic[];
  deformations: readonly Diagnostic[];
  operating: Readonly<Record<string, Parameter<null>>>;
}
export type State =
  | { kind: "sourceRest" }
  | { kind: "connected" }
  | { kind: "fixture"; shaftId: string; rate: Parameter<number>; phase: Parameter<number> };
export const identity: Matrix = Object.freeze([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
export function multiply(a: Matrix, b: Matrix): Matrix {
  return Array.from({ length: 16 }, (_, i) => {
    const r = Math.floor(i / 4),
      c = i % 4;
    return (
      a[r * 4] * b[c] + a[r * 4 + 1] * b[c + 4] + a[r * 4 + 2] * b[c + 8] + a[r * 4 + 3] * b[c + 12]
    );
  });
}
export function validTime(t: number) {
  if (!Number.isFinite(t) || t < 0 || t > 43200)
    throw new RangeError(
      "Time must be finite, 0–43200 seconds (M1 numerical qualification interval).",
    );
  return t;
}
function finite(n: number) {
  if (!Number.isFinite(n)) throw new RangeError("Nonfinite fixture parameter");
  return n;
}
export function fixture(shaftId: string, turnsPerSecond: number, phaseTurns = 0): State {
  const parameter = (value: number, units: string): Parameter<number> => ({
    value: finite(value),
    units,
    frame: "STEP world +Z relative to immutable base",
    evidenceId: "M1-FIXTURE",
    derivation: "Explicit user input; independent constant-rate transform experiment",
    confidence: "arbitrary test input; no mechanical claim",
    reviewStatus: "experiment only",
  });
  return {
    kind: "fixture",
    shaftId,
    rate: parameter(turnsPerSecond, "turn/s"),
    phase: parameter(phaseTurns, "turn"),
  };
}
export function evaluate(timeSeconds: number, state: State, parameters: Parameters) {
  validTime(timeSeconds);
  if (!["sourceRest", "connected", "fixture"].includes(state.kind))
    throw new Error("Unknown operating state");
  if (state.kind === "fixture" && !parameters.shafts.some((s) => s.id === state.shaftId))
    throw new Error("Unknown shaft");
  if (
    state.kind === "fixture" &&
    (state.rate.units !== "turn/s" ||
      state.phase.units !== "turn" ||
      !state.rate.evidenceId ||
      !state.phase.evidenceId)
  )
    throw new Error("Invalid fixture provenance/units");
  const owners = new Set<string>();
  for (const shaft of parameters.shafts) {
    if (
      shaft.axis.units !== "unit vector" ||
      shaft.axis.value.join(",") !== "0,0,1" ||
      shaft.pivot.units !== "mm" ||
      shaft.pivot.value.length !== 3 ||
      !shaft.pivot.value.every(Number.isFinite)
    )
      throw new Error("Unsupported shaft axis/pivot contract");
    for (const id of shaft.members) {
      if (owners.has(id)) throw new Error("Duplicate rigid ownership");
      owners.add(id);
    }
  }
  const shafts = parameters.shafts.map((shaft) => {
    const active = state.kind === "fixture" && state.shaftId === shaft.id;
    const turns = active
      ? finite(finite(state.rate.value) * timeSeconds + finite(state.phase.value))
      : 0;
    // Keep elapsed turns; only reduce the trigonometric argument. Bound precision explicitly.
    if (Math.abs(turns) > 65536)
      throw new RangeError("Fixture exceeds 65536 turns; numerical qualification unavailable");
    const phaseTurns = turns - Math.floor(turns),
      angleRad = phaseTurns * 2 * Math.PI;
    const [x, y] = shaft.pivot.value,
      c = Math.cos(angleRad),
      s = Math.sin(angleRad);
    const delta: Matrix =
      phaseTurns === 0
        ? identity
        : [c, -s, 0, x - c * x + s * y, s, c, 0, y - s * x - c * y, 0, 0, 1, 0, 0, 0, 0, 1];
    return {
      id: shaft.id,
      turns,
      phaseTurns,
      angleRad,
      delta,
      status: active
        ? "independent experiment"
        : state.kind === "sourceRest"
          ? "source rest"
          : "unresolved; held at base",
    };
  });
  return {
    timeSeconds,
    kind: state.kind,
    parameterSetId: parameters.id,
    connectedReady: false as const,
    shafts,
    diagnostics: parameters.diagnostics,
    deformations: parameters.deformations,
    operating: parameters.operating,
  };
}
export type Pose = ReturnType<typeof evaluate>;
export interface Base {
  id: string;
  source: Matrix;
  fitted: Matrix;
  shaftId?: string;
}
export function immutableBase(
  id: string,
  source: Matrix,
  fitted: Matrix = source,
  shaftId?: string,
): Base {
  if (
    source.length !== 16 ||
    fitted.length !== 16 ||
    ![...source, ...fitted].every(Number.isFinite)
  )
    throw new Error("Invalid base");
  return Object.freeze({
    id,
    source: Object.freeze([...source]),
    fitted: Object.freeze([...fitted]),
    shaftId,
  });
}
/** Raw inspection bypasses BOTH mechanical and presentation transforms exactly.
 * Deformation is unresolved, therefore geometry is never modified here.
 */
export function compose(
  base: Base,
  pose: Pose,
  mode: "raw" | "fitted",
  presentation: Matrix = identity,
): Matrix {
  if (mode === "raw") return base.source;
  const shaft = base.shaftId ? pose.shafts.find((s) => s.id === base.shaftId) : undefined;
  if (base.shaftId && !shaft) throw new Error("Missing shaft pose");
  const delta = shaft?.delta ?? identity;
  const moved = delta === identity ? base.fitted : multiply(delta, base.fitted);
  return presentation === identity ? moved : multiply(presentation, moved);
}
/** Event-rebased clock. Reads do not mutate anchors, so frame histories cannot accumulate error. */
export class MechanicalClock {
  private anchorTime = 0;
  private anchorWall = 0;
  private lastWall = 0;
  private playing = false;
  private hidden = false;
  private speed = 1;
  private wall(now: number) {
    if (!Number.isFinite(now) || now < this.lastWall)
      throw new RangeError("Wall time must be finite and monotonic milliseconds");
    this.lastWall = now;
    return now;
  }
  read(now: number) {
    this.wall(now);
    return validTime(
      this.anchorTime +
        (this.playing && !this.hidden ? ((now - this.anchorWall) * this.speed) / 1000 : 0),
    );
  }
  private rebase(now: number) {
    this.anchorTime = this.read(now);
    this.anchorWall = now;
  }
  play(now: number) {
    this.rebase(now);
    this.playing = true;
  }
  pause(now: number) {
    this.rebase(now);
    this.playing = false;
  }
  seek(time: number, now: number) {
    validTime(time);
    this.wall(now);
    this.anchorTime = time;
    this.anchorWall = now;
  }
  setSpeed(speed: number, now: number) {
    if (!Number.isFinite(speed) || speed < 0 || speed > 100)
      throw new RangeError("Speed must be 0–100");
    this.rebase(now);
    this.speed = speed;
  }
  setHidden(hidden: boolean, now: number) {
    this.rebase(now);
    this.hidden = hidden;
  }
  get running() {
    return this.playing && !this.hidden && this.speed > 0;
  }
}
