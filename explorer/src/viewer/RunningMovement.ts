import * as THREE from 'three';
import specification from '../../public/models/movement-runtime.json' with { type: 'json' };
import settings from '../../../assets/authored/running-movement.json' with { type: 'json' };
import { BalanceExposure, MAX_EXPOSURE_SECONDS } from './BalanceExposure.ts';

export const MOVEMENT = {
  ...specification,
  // Hz counts complete balance oscillations; each has two beats.
  secondsPerCycle: 1 / settings.frequencyHz,
};
const RAD = Math.PI / 180;
type Slice = { offset: number; count: number };
type MeshData = { position: Slice; normal: Slice; index: Slice };
export type MovementPose = { balance: number; pallet: number; escape: number };

/** Absolute, unwrapped escape phase. Never reduce E before applying train ratios. */
export function movementPose(seconds: number, out: MovementPose) {
  const cycles = Math.max(0, seconds) / MOVEMENT.secondsPerCycle;
  const count = Math.floor(cycles),
    u = cycles - count;
  const b = -180 * Math.cos(2 * Math.PI * u);
  const p =
    Math.abs(b) > 90
      ? -Math.sign(b) * 6.95
      : Math.max(
          -6.95,
          Math.min(
            6.95,
            -Math.atan2(
              0.695 * Math.sin(b * RAD),
              3.1 - 0.695 * Math.cos(b * RAD),
            ) / RAD,
          ),
        );
  const samples = MOVEMENT.segments[u < 0.5 ? 0 : 1];
  let lo = 0,
    hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1;
    if (samples[mid][0] <= p) lo = mid;
    else hi = mid;
  }
  const a = samples[lo],
    z = samples[hi];
  const t = Math.max(0, Math.min(1, (p - a[0]) / (z[0] - a[0])));
  out.balance = MOVEMENT.centers.balance + b;
  out.pallet = MOVEMENT.centers.pallet + p;
  out.escape = 18 * count + a[1] + (z[1] - a[1]) * t;
  return out;
}

/** Visible active time, with explicit suspension; dropped frames do not slow time. */
export class MovementClock {
  seconds = 0;
  private last: number | undefined;
  suspend() {
    this.last = undefined;
  }
  advance(now: number, active: boolean) {
    if (!active) this.suspend();
    else {
      if (this.last !== undefined)
        this.seconds += Math.max(0, now - this.last) / 1000;
      this.last = now;
    }
    return this.seconds;
  }
}

export function shaftMatrix(
  out: THREE.Matrix4,
  pivot: number[],
  degrees: number,
) {
  const a = (degrees % 360) * RAD,
    c = Math.cos(a),
    s = Math.sin(a),
    [x, y] = pivot;
  return out.set(
    c,
    -s,
    0,
    x - c * x + s * y,
    s,
    c,
    0,
    y - s * x - c * y,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  );
}

export async function loadMovementBuffer(): Promise<ArrayBuffer> {
  const response = await fetch(MOVEMENT.file);
  if (!response.ok) throw Error('Running movement geometry unavailable');
  const buffer = await response.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const hash = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  if (buffer.byteLength !== MOVEMENT.byteLength || hash !== MOVEMENT.sha256)
    throw Error('Running movement geometry integrity mismatch');
  return buffer;
}

function floats(buffer: ArrayBuffer, slice: Slice) {
  return new Float32Array(buffer, slice.offset * 4, slice.count);
}
function geometry(buffer: ArrayBuffer, spec: MeshData) {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    'position',
    new THREE.BufferAttribute(floats(buffer, spec.position), 3),
  );
  const normal = new THREE.BufferAttribute(floats(buffer, spec.normal), 3);
  g.setAttribute('normal', normal);
  g.setAttribute('sourceFinishNormal', normal);
  g.setAttribute(
    'sourceFinishRole',
    new THREE.BufferAttribute(new Float32Array(normal.count), 1),
  );
  g.setIndex(
    new THREE.BufferAttribute(
      new Uint32Array(buffer, spec.index.offset * 4, spec.index.count),
      1,
    ),
  );
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/** Fixed topology, reusable position/normal buffers. No solver or geometry rebuild per frame. */
export class RunningSpring {
  readonly geometry: THREE.BufferGeometry;
  readonly points: Float64Array;
  private readonly residual: Float32Array;
  private readonly weights: Float32Array;
  private readonly inverse = new THREE.Matrix4()
    .set(
      ...(MOVEMENT.spring.sourceMatrix.flat() as Parameters<
        THREE.Matrix4['set']
      >),
    )
    .invert();
  constructor(buffer: ArrayBuffer) {
    const spec = MOVEMENT.spring,
      n = spec.pointCount;
    this.points = new Float64Array(n * 2);
    this.residual = floats(buffer, spec.residual);
    this.weights = floats(buffer, spec.weights);
    const terminal = geometry(buffer, spec.terminal);
    const pos = new Float32Array(n * 24 + spec.terminal.position.count);
    const norm = new Float32Array(pos.length);
    pos.set(floats(buffer, spec.terminal.position), n * 24);
    norm.set(floats(buffer, spec.terminal.normal), n * 24);
    const idx: number[] = [];
    // Four independent strips retain sharp edges between top, bottom and sides.
    for (let i = 0; i < n - 1; i++)
      for (let side = 0; side < 4; side++) {
        const a = i * 8 + side * 2,
          b = a + 8;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    // End caps (hidden in attachment neighborhoods).
    idx.push(0, 1, 2, 1, 3, 2);
    const end = (n - 1) * 8;
    idx.push(end, end + 2, end + 1, end + 1, end + 2, end + 3);
    for (const value of terminal.index!.array) idx.push(value + n * 8);
    terminal.dispose();
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage),
    );
    const normal = new THREE.BufferAttribute(norm, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    this.geometry.setAttribute('normal', normal);
    this.geometry.setAttribute('sourceFinishNormal', normal);
    this.geometry.setAttribute(
      'sourceFinishRole',
      new THREE.BufferAttribute(new Float32Array(pos.length / 3), 1),
    );
    this.geometry.setIndex(idx);
    this.update(0);
    // Conservative full-rotation local envelope plus unchanged terminal.
    this.geometry.computeBoundingBox();
    this.geometry.boundingBox!.union(
      new THREE.Box3(
        new THREE.Vector3(-3.6, -3.6, -0.22),
        new THREE.Vector3(3.6, 3.6, 0),
      ),
    );
    this.geometry.boundingSphere = this.geometry.boundingBox!.getBoundingSphere(
      new THREE.Sphere(),
    );
  }
  update(degrees: number) {
    const spec = MOVEMENT.spring,
      n = spec.pointCount,
      angles = spec.angles;
    let lo = 0,
      hi = angles.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >>> 1;
      if (angles[mid] <= degrees) lo = mid;
      else hi = mid;
    }
    const t = Math.max(
      0,
      Math.min(1, (degrees - angles[lo]) / (angles[hi] - angles[lo])),
    );
    for (let i = 0; i < n; i++) {
      const a = (lo * n + i) * 2,
        b = (hi * n + i) * 2;
      const x = this.residual[a] + t * (this.residual[b] - this.residual[a]);
      const y =
        this.residual[a + 1] +
        t * (this.residual[b + 1] - this.residual[a + 1]);
      const angle = degrees * RAD * this.weights[i],
        c = Math.cos(angle),
        s = Math.sin(angle);
      this.points[2 * i] = c * x - s * y;
      this.points[2 * i + 1] = s * x + c * y - 10;
    }
    const position = this.geometry.getAttribute(
      'position',
    ) as THREE.BufferAttribute;
    const normal = this.geometry.getAttribute(
      'normal',
    ) as THREE.BufferAttribute;
    const e = this.inverse.elements;
    for (let i = 0; i < n; i++) {
      const before = Math.max(0, i - 1) * 2,
        after = Math.min(n - 1, i + 1) * 2;
      const dx = this.points[after] - this.points[before],
        dy = this.points[after + 1] - this.points[before + 1];
      const len = Math.hypot(dx, dy),
        nx = -dy / len,
        ny = dx / len;
      for (let j = 0; j < 8; j++) {
        // top right/left; bottom left/right; left top/bottom; right bottom/top
        const left = j === 1 || j === 2 || j === 4 || j === 5;
        const top = j === 0 || j === 1 || j === 4 || j === 7;
        const sign = left ? 1 : -1;
        const x = this.points[i * 2] + sign * nx * 0.0175,
          y = this.points[i * 2 + 1] + sign * ny * 0.0175;
        const z = spec.z + (top ? 0.1075 : -0.1075);
        position.setXYZ(
          i * 8 + j,
          e[0] * x + e[4] * y + e[8] * z + e[12],
          e[1] * x + e[5] * y + e[9] * z + e[13],
          e[2] * x + e[6] * y + e[10] * z + e[14],
        );
        const vx = j < 4 ? 0 : sign * nx,
          vy = j < 4 ? 0 : sign * ny,
          vz = j < 4 ? (top ? 1 : -1) : 0;
        normal.setXYZ(
          i * 8 + j,
          e[0] * vx + e[4] * vy + e[8] * vz,
          e[1] * vx + e[5] * vy + e[9] * vz,
          e[2] * vx + e[6] * vy + e[10] * vz,
        );
      }
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
  }
}

/** One controller per loaded movement. Scene parents (including Bench flips) remain untouched. */
export class RunningMovement {
  readonly clock = new MovementClock();
  readonly pose: MovementPose = { balance: 0, pallet: 0, escape: 0 };
  readonly spring: RunningSpring;
  readonly fork: THREE.BufferGeometry;
  readonly exposure: BalanceExposure;
  active = false;
  private dead = false;
  private readonly delta = new THREE.Matrix4();
  private readonly entries: {
    mesh: THREE.Mesh;
    base: THREE.Matrix4;
    packet: (typeof MOVEMENT.packets)[number];
  }[] = [];
  private readonly springMesh: THREE.Mesh;
  private readonly forkMesh: THREE.Mesh;
  private readonly sourceSpring: THREE.BufferGeometry;
  private readonly sourceFork: THREE.BufferGeometry;
  constructor(buffer: ArrayBuffer, meshes: Map<string, THREE.Mesh>) {
    for (const packet of MOVEMENT.packets)
      for (const id of packet.members) {
        const mesh = meshes.get(id);
        if (!mesh) throw Error(`Running movement member missing: ${id}`);
        this.entries.push({ mesh, base: mesh.matrix.clone(), packet });
      }
    const spring = meshes.get(MOVEMENT.spring.id),
      fork = meshes.get(MOVEMENT.fork.id);
    if (!spring || !fork) throw Error('Running movement geometry missing');
    this.springMesh = spring;
    this.forkMesh = fork;
    this.sourceSpring = spring.geometry;
    this.sourceFork = fork.geometry;
    this.spring = new RunningSpring(buffer);
    this.fork = geometry(buffer, MOVEMENT.fork);
    // Recorded packet order: rim, four eccentrics, then jewel/staff/rollers.
    this.exposure = new BalanceExposure(this.entries.slice(0, 5));
  }
  /** Call before the owning viewer writes presentation poses or reparents pieces. */
  restore() {
    this.exposure.hide();
    if (!this.active) return;
    for (const entry of this.entries) {
      entry.mesh.matrix.copy(entry.base);
      entry.mesh.matrixWorldNeedsUpdate = true;
    }
    this.springMesh.geometry = this.sourceSpring;
    this.forkMesh.geometry = this.sourceFork;
    this.active = false;
  }
  update(now: number, eligible: boolean) {
    if (this.dead) return false;
    this.restore();
    const before = this.clock.seconds;
    const seconds = this.clock.advance(now, eligible);
    movementPose(seconds, this.pose);
    if (!eligible) return false;
    for (const entry of this.entries) {
      entry.base.copy(entry.mesh.matrix);
      const packet = entry.packet;
      const degrees =
        packet.name === 'balance'
          ? this.pose.balance
          : packet.name === 'pallet'
            ? this.pose.pallet
            : (this.pose.escape * packet.ratio[0]) / packet.ratio[1];
      entry.mesh.matrix.premultiply(
        shaftMatrix(this.delta, packet.pivot, degrees),
      );
      entry.mesh.matrixWorldNeedsUpdate = true;
    }
    this.spring.update(this.pose.balance);
    this.springMesh.geometry = this.spring.geometry;
    this.forkMesh.geometry = this.fork;
    this.active = true;
    this.exposure.show(
      seconds,
      Math.min(MAX_EXPOSURE_SECONDS, (seconds - before) / 2),
      balanceAngle,
      shaftMatrix,
    );
    return true;
  }
  /** Expected displayed matrix for diagnostics, including prescribed motion. */
  presentationMatrix(id: string, source: THREE.Matrix4, out: THREE.Matrix4) {
    out.copy(source);
    if (!this.active) return out;
    const packet = MOVEMENT.packets.find((p) => p.members.includes(id));
    if (!packet) return out;
    const degrees =
      packet.name === 'balance'
        ? this.pose.balance
        : packet.name === 'pallet'
          ? this.pose.pallet
          : (this.pose.escape * packet.ratio[0]) / packet.ratio[1];
    return out.premultiply(shaftMatrix(this.delta, packet.pivot, degrees));
  }
  dispose() {
    if (this.dead) return;
    this.restore();
    this.clock.suspend();
    this.exposure.dispose();
    this.spring.geometry.dispose();
    this.fork.dispose();
    this.dead = true;
  }
}

function balanceAngle(seconds: number) {
  return (
    MOVEMENT.centers.balance -
    180 * Math.cos(2 * Math.PI * ((seconds / MOVEMENT.secondsPerCycle) % 1))
  );
}
