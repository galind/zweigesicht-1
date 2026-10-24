import * as THREE from 'three';
import { WALK, type CollisionWorld, type Walker } from './physics';

export type BenchSide = 'bridge' | 'dial';
type Rest = { id: string; seat: number; rotationX: number };
const LIFT = 1.05,
  TURN = 1.6,
  DWELL = 0.2,
  LOWER = 1.15;
export const FLIP_DURATION = LIFT + TURN + DWELL + LOWER;
const ease = (t: number) => {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** Rigid assembly turnover. Holder exchange is a visual operation, not maker mechanics. */
export class BenchFlip {
  side: BenchSide = 'bridge';
  target: BenchSide = 'dial';
  active = false;
  elapsed = 0;
  blocked = false;
  completed = 0;
  readonly swept = new THREE.Box3();
  readonly forbiddenFeet = new THREE.Box3();
  readonly columns: THREE.Box3[] = [];
  readonly discs: {
    minX: number;
    maxX: number;
    radius: number;
    y: number;
    z: number;
  }[] = [];
  readonly liftHeight: number;
  readonly movement: THREE.Group;
  readonly holders: Record<BenchSide, THREE.Group>;
  readonly world: CollisionWorld;
  readonly walker: Walker;
  readonly rests: Rest[];
  constructor(
    movement: THREE.Group,
    holders: Record<BenchSide, THREE.Group>,
    world: CollisionWorld,
    walker: Walker,
    rests: Rest[],
  ) {
    this.movement = movement;
    this.holders = holders;
    this.world = world;
    this.walker = walker;
    this.rests = rests;
    // Bound all original/reviewed vertices in assembly space. Rotation is X-only.
    const source = new THREE.Box3();
    const parts: THREE.Box3[] = [];
    for (const child of movement.children) {
      const mesh = child as THREE.Mesh;
      mesh.geometry.computeBoundingBox();
      const bounds = mesh.geometry
        .boundingBox!.clone()
        .applyMatrix4(mesh.matrix);
      parts.push(bounds);
      source.union(bounds);
    }
    const radius = Math.hypot(
      Math.max(Math.abs(source.min.y), Math.abs(source.max.y)),
      Math.max(Math.abs(source.min.z), Math.abs(source.max.z)),
    );
    const origin = movement.parent!.getWorldPosition(new THREE.Vector3());
    const holderTop = Math.max(
      ...Object.values(holders).map(
        (holder) => new THREE.Box3().setFromObject(holder).max.y,
      ),
    );
    this.liftHeight = holderTop - origin.y + radius + 1.5;
    const restBounds = rests.map((rest) =>
      source
        .clone()
        .applyMatrix4(
          new THREE.Matrix4()
            .makeRotationX(THREE.MathUtils.degToRad(rest.rotationX))
            .setPosition(0, rest.seat, 0),
        ),
    );
    const minY = Math.min(
      ...restBounds.map((box) => box.min.y),
      this.liftHeight - radius,
    );
    this.swept
      .set(
        new THREE.Vector3(source.min.x, minY, -radius),
        new THREE.Vector3(source.max.x, this.liftHeight + radius, radius),
      )
      .translate(origin)
      .expandByScalar(0.03);
    // Minkowski bound for the upright visitor, including a small support margin.
    this.forbiddenFeet.copy(this.swept);
    this.forbiddenFeet.min.add(
      new THREE.Vector3(-WALK.radius, -WALK.height, -WALK.radius),
    );
    this.forbiddenFeet.max.add(
      new THREE.Vector3(WALK.radius, 0.03, WALK.radius),
    );
    // Per-part lift columns and turnover discs retain empty space around the
    // crown and below the lift. The full half-turn is bounded continuously,
    // rather than relying on sampled frames to catch a fast-moving triangle.
    for (const part of parts) {
      this.discs.push({
        minX: part.min.x + origin.x,
        maxX: part.max.x + origin.x,
        radius: Math.hypot(
          Math.max(Math.abs(part.min.y), Math.abs(part.max.y)),
          Math.max(Math.abs(part.min.z), Math.abs(part.max.z)),
        ),
        y: this.liftHeight + origin.y,
        z: origin.z,
      });
      for (const rest of rests) {
        const column = part
          .clone()
          .applyMatrix4(
            new THREE.Matrix4()
              .makeRotationX(THREE.MathUtils.degToRad(rest.rotationX))
              .setPosition(0, rest.seat, 0),
          )
          .translate(origin);
        column.max.y += this.liftHeight - rest.seat;
        column.expandByScalar(0.03);
        column.min.add(
          new THREE.Vector3(-WALK.radius, -WALK.height, -WALK.radius),
        );
        column.max.add(new THREE.Vector3(WALK.radius, 0.03, WALK.radius));
        this.columns.push(column);
      }
    }
    this.setRest('bridge');
  }
  distance(feet: THREE.Vector3) {
    let distance = Infinity;
    for (const box of this.columns) {
      const dx = Math.max(box.min.x - feet.x, feet.x - box.max.x);
      const dy = Math.max(box.min.y - feet.y, feet.y - box.max.y);
      const dz = Math.max(box.min.z - feet.z, feet.z - box.max.z);
      distance = Math.min(
        distance,
        Math.hypot(Math.max(0, dx), Math.max(0, dy), Math.max(0, dz)) +
          Math.min(0, Math.max(dx, dy, dz)),
      );
    }
    for (const disc of this.discs) {
      const dx = Math.max(disc.minX - feet.x, feet.x - disc.maxX);
      const dy = Math.max(
        feet.y + WALK.radius - disc.y,
        disc.y - feet.y - WALK.height + WALK.radius,
        0,
      );
      const radial = Math.hypot(feet.z - disc.z, dy) - disc.radius;
      distance = Math.min(
        distance,
        Math.hypot(Math.max(0, dx), Math.max(0, radial)) +
          Math.min(0, Math.max(dx, radial)) -
          WALK.radius -
          0.03,
      );
    }
    return distance;
  }
  isUnsafe(feet: THREE.Vector3) {
    return this.forbiddenFeet.containsPoint(feet) && this.distance(feet) <= 0;
  }
  pose(side: BenchSide) {
    return this.rests.find((rest) => rest.id === side)!;
  }
  setRest(side: BenchSide) {
    const rest = this.pose(side);
    this.movement.rotation.x = THREE.MathUtils.degToRad(rest.rotationX);
    this.movement.position.y = rest.seat;
    this.holders.bridge.visible = side === 'bridge';
    this.holders.dial.visible = side === 'dial';
    this.side = side;
    this.world.sync();
  }
  holderMeshes(side: BenchSide) {
    return new Set(this.holders[side].children as THREE.Mesh[]);
  }
  holderSupportChanges(feet = this.walker.feet) {
    const w = this.walker;
    if (!w.grounded) return false;
    const oldFloor = this.world.floor(
      feet.x,
      feet.z,
      feet.y + 0.02,
      this.holderMeshes(this.side),
    );
    const newFloor = this.world.floor(
      feet.x,
      feet.z,
      feet.y + 0.02,
      this.holderMeshes(this.target),
    );
    return (
      Math.abs(oldFloor - feet.y) < 0.03 && Math.abs(newFloor - oldFloor) > 0.03
    );
  }
  obstructed(feet = this.walker.feet) {
    return (
      this.isUnsafe(feet) ||
      this.world.overlaps(feet, this.holderMeshes(this.target)) ||
      this.holderSupportChanges(feet)
    );
  }
  refreshBlocked() {
    if (this.blocked && !this.obstructed()) this.blocked = false;
  }
  start() {
    if (this.active) return false; // No queue; repeated presses never overlap.
    this.target = this.side === 'bridge' ? 'dial' : 'bridge';
    this.blocked = this.obstructed();
    if (this.blocked) return false; // Ask the visitor to move; never relocate them.
    this.elapsed = 0;
    this.active = true;
    this.walker.guard = this.guard;
    return true;
  }
  guard = (previous: THREE.Vector3) => {
    const w = this.walker;
    if (!this.obstructed()) return;
    if (this.obstructed(previous)) {
      // Fail closed if an external interruption bypassed the substep guard.
      this.blocked = true;
      this.finish(false);
      return;
    }
    const end = w.feet.clone(),
      trial = previous.clone();
    let lo = 0,
      hi = 1;
    for (let i = 0; i < 16; i++) {
      const t = (lo + hi) / 2;
      trial.copy(previous).lerp(end, t);
      if (this.obstructed(trial)) hi = t;
      else lo = t;
    }
    w.feet.copy(previous).lerp(end, lo);
    // The union's outward gradient cancels inward speed, preserving tangential
    // travel. The ordinary physics substep bounds prevent crossing a thin zone.
    const normal = new THREE.Vector3();
    for (const axis of ['x', 'y', 'z'] as const) {
      trial.copy(w.feet);
      trial[axis] += 0.0001;
      const above = this.distance(trial);
      trial[axis] -= 0.0002;
      normal[axis] = above - this.distance(trial);
    }
    // Holder-only obstruction has no movement-envelope gradient. Stop inward
    // travel along the attempted crossing without moving to another location.
    if (!this.isUnsafe(end)) normal.copy(previous).sub(end);
    normal.normalize();
    const inward = w.velocity.dot(normal);
    if (inward < 0) w.velocity.addScaledVector(normal, -inward);
  };
  exchange() {
    if (this.holders[this.target].visible) return true;
    // A visitor below the movement can remain there if the incoming holder clears
    // them. Recheck at the instant of exchange, including late arrivals.
    if (
      this.world.overlaps(this.walker.feet, this.holderMeshes(this.target)) ||
      this.holderSupportChanges()
    ) {
      this.blocked = true;
      return false;
    }
    this.holders.bridge.visible = this.target === 'bridge';
    this.holders.dial.visible = this.target === 'dial';
    return true;
  }
  update(dt: number) {
    if (!this.active) return;
    this.elapsed = Math.min(
      FLIP_DURATION,
      this.elapsed + Math.max(0, Math.min(dt, 0.05)),
    );
    const from = this.pose(this.side),
      to = this.pose(this.target),
      t = this.elapsed;
    if (t < LIFT) {
      this.movement.position.y = THREE.MathUtils.lerp(
        from.seat,
        this.liftHeight,
        ease(t / LIFT),
      );
    } else if (t < LIFT + TURN + DWELL) {
      this.movement.position.y = this.liftHeight;
      this.movement.rotation.x = THREE.MathUtils.degToRad(
        THREE.MathUtils.lerp(
          from.rotationX,
          to.rotationX,
          ease((t - LIFT) / TURN),
        ),
      );
      if (t >= LIFT + TURN / 2 && !this.exchange()) this.finish(false);
    } else {
      this.movement.rotation.x = THREE.MathUtils.degToRad(to.rotationX);
      this.movement.position.y = THREE.MathUtils.lerp(
        this.liftHeight,
        to.seat,
        ease((t - LIFT - TURN - DWELL) / LOWER),
      );
    }
    this.world.sync();
    if (this.elapsed >= FLIP_DURATION) this.finish();
  }
  /** Hidden tabs / graphics interruption settle atomically; visible Escape continues. */
  finish(toTarget = true) {
    if (!this.active) return;
    if (toTarget && !this.exchange()) toTarget = false;
    this.setRest(toTarget ? this.target : this.side);
    this.active = false;
    this.walker.guard = undefined;
    this.completed++;
  }
}
