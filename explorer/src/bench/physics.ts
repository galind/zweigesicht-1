import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

export const WALK = Object.freeze({
  radius: 0.22,
  height: 1.65,
  eye: 1.48,
  speed: 5.5,
  runSpeed: 11,
  gravity: 18,
  thrust: 26,
  verticalDrag: 0.18,
  acceleration: 22,
  step: 0.22,
  tick: 1 / 180,
});
type Solid = {
  mesh: THREE.Mesh;
  tree: MeshBVH;
  matrix: THREE.Matrix4;
  inverse: THREE.Matrix4;
  bounds: THREE.Box3;
  referencePose?: THREE.Matrix4;
  referenceBounds?: THREE.Box3;
};
/** BVHs are per reusable CAD definition. No proxy floors cover source openings. */
export class CollisionWorld {
  solids: Solid[] = [];
  trees = new Map<THREE.BufferGeometry, MeshBVH>();
  add(mesh: THREE.Mesh, referencePose?: THREE.Matrix4) {
    let tree = this.trees.get(mesh.geometry);
    if (!tree) {
      tree = new MeshBVH(mesh.geometry, { indirect: true, maxLeafSize: 12 });
      this.trees.set(mesh.geometry, tree);
    }
    mesh.updateWorldMatrix(true, false);
    this.solids.push({
      mesh,
      tree,
      matrix: mesh.matrixWorld.clone(),
      inverse: mesh.matrixWorld.clone().invert(),
      bounds: new THREE.Box3().setFromObject(mesh),
      referencePose: referencePose?.clone(),
      referenceBounds: referencePose
        ? mesh.geometry.boundingBox!.clone()
        : undefined,
    });
  }
  sync() {
    for (const s of this.solids) {
      // CAD leaves have matrixAutoUpdate=false. Parent updates alone do not dirty
      // those leaves in Three r186; force them before copying collision matrices.
      s.mesh.matrixWorldNeedsUpdate = true;
      s.mesh.updateWorldMatrix(true, false);
      if (s.referencePose && s.referenceBounds) {
        // Prescribed internals are visual only. Keep the existing collision pose
        // in the moving station frame; never pair a deformed mesh with a rest BVH.
        if (s.mesh.parent)
          s.matrix.copy(s.mesh.parent.matrixWorld).multiply(s.referencePose);
        else s.matrix.copy(s.referencePose);
      } else {
        s.matrix.copy(s.mesh.matrixWorld);
      }
      // Both query directions must use the retained collision frame, even when
      // the displayed mesh is rotating or borrowing the deforming spring.
      s.inverse.copy(s.matrix).invert();
      s.bounds
        .copy(s.referenceBounds ?? s.mesh.geometry.boundingBox!)
        .applyMatrix4(s.matrix);
    }
  }
  active(s: Solid) {
    let o: THREE.Object3D | null = s.mesh;
    while (o) {
      if (!o.visible) return false;
      o = o.parent;
    }
    return true;
  }
  /** Read-only capsule query, also used to verify relocation and holder exchange. */
  overlaps(feet: THREE.Vector3, meshes?: Set<THREE.Mesh>) {
    const segment = new THREE.Line3(),
      a = new THREE.Vector3(),
      b = new THREE.Vector3();
    const start = feet.clone().add(new THREE.Vector3(0, WALK.radius, 0));
    const end = feet
      .clone()
      .add(new THREE.Vector3(0, WALK.height - WALK.radius, 0));
    const box = new THREE.Box3()
      .setFromPoints([start, end])
      .expandByScalar(WALK.radius);
    for (const s of this.solids) {
      if (meshes ? !meshes.has(s.mesh) : !this.active(s)) continue;
      if (!s.bounds.intersectsBox(box)) continue;
      segment.start.copy(start).applyMatrix4(s.inverse);
      segment.end.copy(end).applyMatrix4(s.inverse);
      const ray = new THREE.Ray(
        segment.start.clone(),
        segment.delta(new THREE.Vector3()).normalize(),
      );
      const length = segment.distance();
      const localBox = new THREE.Box3()
        .setFromPoints([segment.start, segment.end])
        .expandByScalar(WALK.radius);
      if (
        s.tree.shapecast({
          intersectsBounds: (bounds) => bounds.intersectsBox(localBox),
          intersectsTriangle: (triangle) => {
            // BVH closestPointToSegment checks edges/endpoints but not a segment
            // piercing a triangle's interior. Include that case for static swaps.
            if (
              ray.intersectTriangle(
                triangle.a,
                triangle.b,
                triangle.c,
                false,
                a,
              ) &&
              a.distanceTo(ray.origin) <= length
            )
              return true;
            return (
              triangle.closestPointToSegment(segment, a, b) < WALK.radius - 1e-5
            );
          },
        })
      )
        return true;
      if (meshes) {
        // The incoming original holder is closed. A capsule entirely inside its
        // solid may not touch any triangle; parity detects that obstruction too.
        ray.direction.set(0.83, 0.37, 0.43).normalize();
        const distances = s.tree
          .raycast(ray, THREE.DoubleSide)
          .map((hit) => hit.distance)
          .sort((x, y) => x - y);
        const crossings = distances.filter(
          (d, i) => i === 0 || d - distances[i - 1] > 1e-5,
        );
        if (crossings.length % 2) return true;
      }
    }
    return false;
  }
  resolve(feet: THREE.Vector3) {
    let grounded = false;
    let ceiling = false;
    const start = feet.clone().add(new THREE.Vector3(0, WALK.radius, 0));
    const end = feet
      .clone()
      .add(new THREE.Vector3(0, WALK.height - WALK.radius, 0));
    const box = new THREE.Box3();
    const segment = new THREE.Line3(),
      a = new THREE.Vector3(),
      b = new THREE.Vector3(),
      normal = new THREE.Vector3();
    const contacts: THREE.Vector3[] = [];
    for (let pass = 0; pass < 4; pass++) {
      let moved = false;
      box.setFromPoints([start, end]).expandByScalar(WALK.radius + 0.001);
      for (const s of this.solids) {
        if (!this.active(s) || !s.bounds.intersectsBox(box)) continue;
        segment.start.copy(start).applyMatrix4(s.inverse);
        segment.end.copy(end).applyMatrix4(s.inverse);
        const localBox = new THREE.Box3()
          .setFromPoints([segment.start, segment.end])
          .expandByScalar(WALK.radius);
        s.tree.shapecast({
          intersectsBounds: (bounds) => bounds.intersectsBox(localBox),
          intersectsTriangle: (triangle) => {
            const distance = triangle.closestPointToSegment(segment, a, b);
            if (distance >= WALK.radius - 1e-7) return false;
            if (distance > 1e-8) normal.subVectors(b, a).divideScalar(distance);
            else triangle.getNormal(normal);
            const push = normal
              .clone()
              .multiplyScalar(WALK.radius - distance + 1e-6);
            segment.start.add(push);
            segment.end.add(push);
            const worldNormal = normal
              .clone()
              .transformDirection(s.matrix);
            if (worldNormal.y > 0.55) grounded = true;
            // A closest-point contact on a vertical triangle's internal diagonal
            // can point down. Only a surface with a vertical normal component
            // can stop ascent; sliding up a wall must not kill thrust velocity.
            if (worldNormal.y < -0.5) {
              const faceNormal = triangle
                .getNormal(new THREE.Vector3())
                .transformDirection(s.matrix);
              if (Math.abs(faceNormal.y) > 0.5) ceiling = true;
            }
            contacts.push(worldNormal);
            moved = true;
            return false;
          },
        });
        start.copy(segment.start).applyMatrix4(s.matrix);
        end.copy(segment.end).applyMatrix4(s.matrix);
      }
      if (!moved) break;
    }
    feet.copy(start).add(new THREE.Vector3(0, -WALK.radius, 0));
    return { grounded, contacts, ceiling };
  }
  floor(x: number, z: number, top = 30, meshes?: Set<THREE.Mesh>) {
    const ray = new THREE.Ray(
      new THREE.Vector3(x, top, z),
      new THREE.Vector3(0, -1, 0),
    );
    let height = -Infinity;
    for (const s of this.solids) {
      if (
        (meshes ? !meshes.has(s.mesh) : !this.active(s)) ||
        x < s.bounds.min.x ||
        x > s.bounds.max.x ||
        z < s.bounds.min.z ||
        z > s.bounds.max.z
      )
        continue;
      const localRay = ray.clone().applyMatrix4(s.inverse);
      const hit = s.tree.raycastFirst(localRay, THREE.DoubleSide);
      if (hit)
        height = Math.max(height, hit.point.applyMatrix4(s.matrix).y);
    }
    return height;
  }
}
export type DeskBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export class Walker {
  feet = new THREE.Vector3(-59, 0.002, 0);
  spawn = new THREE.Vector3(-59, 0.002, 0);
  spawnYaw = -Math.PI / 2;
  velocity = new THREE.Vector3();
  grounded = false;
  yaw = -Math.PI / 2;
  pitch = 0;
  keys = new Set<string>();
  resets = 0;
  world: CollisionWorld;
  bounds?: DeskBounds;
  // Temporary animation safety constraint, invoked on every physics substep.
  guard?: (previous: THREE.Vector3) => void;
  constructor(world: CollisionWorld, bounds?: DeskBounds) {
    this.world = world;
    this.bounds = bounds;
  }
  clear() {
    this.keys.clear();
    // Input loss cuts thrust, not physical momentum. Gravity still acts.
  }
  reset() {
    this.clear();
    this.velocity.set(0, 0, 0);
    this.feet.copy(this.spawn);
    this.yaw = this.spawnYaw;
    this.pitch = 0.08;
    this.grounded = false;
    this.resets++;
  }
  update(dt: number) {
    // Clamp elapsed catch-up, and bound each sweep by capsule radius even for
    // unusually fast motion. The desk constraint is applied on every substep.
    const duration = Math.max(0, Math.min(dt, 0.05));
    const speed =
      this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
        ? WALK.runSpeed
        : WALK.speed;
    const maxSpeed =
      Math.max(speed, this.velocity.length()) + WALK.thrust * duration;
    const steps = Math.ceil(
      duration / Math.min(WALK.tick, WALK.radius / (3 * maxSpeed)),
    );
    if (!steps) return;
    const h = duration / steps;
    for (let i = 0; i < steps; i++) {
      const forward =
        Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS'));
      const right =
        Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'));
      const n = Math.max(1, Math.hypot(forward, right));
      const targetX =
        ((-Math.sin(this.yaw) * forward + Math.cos(this.yaw) * right) * speed) /
        n;
      const targetZ =
        ((-Math.cos(this.yaw) * forward - Math.sin(this.yaw) * right) * speed) /
        n;
      const delta = new THREE.Vector2(
        targetX - this.velocity.x,
        targetZ - this.velocity.z,
      );
      delta.clampLength(0, WALK.acceleration * h);
      this.velocity.x += delta.x;
      this.velocity.z += delta.y;
      // Continuous thrust, unchanged gravity, and quadratic air resistance.
      // No impulse, hover state, altitude target or instantaneous speed change.
      const thrust = this.keys.has('Space') ? WALK.thrust : 0;
      this.velocity.y +=
        (thrust -
          WALK.gravity -
          WALK.verticalDrag * this.velocity.y * Math.abs(this.velocity.y)) *
        h;
      const before = this.feet.clone(),
        wasGrounded = this.grounded;
      this.feet.addScaledVector(this.velocity, h);
      this.constrainToDesk();
      this.guard?.(before);
      let result = this.world.resolve(this.feet);
      // Step only when grounded and blocked, and only onto an actual nearby surface.
      const wanted = Math.hypot(this.velocity.x, this.velocity.z) * h;
      const got = Math.hypot(this.feet.x - before.x, this.feet.z - before.z);
      if (
        wasGrounded &&
        this.velocity.y <= 0 &&
        wanted > 0.001 &&
        got < wanted * 0.6
      ) {
        const trial = before
          .clone()
          .add(
            new THREE.Vector3(
              this.velocity.x * h,
              WALK.step,
              this.velocity.z * h,
            ),
          );
        this.world.resolve(trial);
        const floor = this.world.floor(trial.x, trial.z, trial.y + 0.001);
        if (
          floor >= before.y - 0.01 &&
          floor <= before.y + WALK.step &&
          Math.hypot(trial.x - before.x, trial.z - before.z) > got + 0.001
        ) {
          trial.y = floor + 0.001;
          const check = this.world.resolve(trial);
          if (trial.y <= before.y + WALK.step + 0.01) {
            this.feet.copy(trial);
            result = { ...check, grounded: true };
          }
        }
      }
      this.grounded = result.grounded;
      if (this.grounded && this.velocity.y < 0) this.velocity.y = 0;
      if (result.ceiling && this.velocity.y > 0) this.velocity.y = 0;
      this.constrainToDesk();
      this.guard?.(before);
    }
  }
  /** Project only outward displacement; tangential travel and Y remain free. */
  constrainToDesk() {
    if (!this.bounds) return;
    for (const [axis, min, max] of [
      ['x', this.bounds.minX + WALK.radius, this.bounds.maxX - WALK.radius],
      ['z', this.bounds.minZ + WALK.radius, this.bounds.maxZ - WALK.radius],
    ] as const) {
      this.feet[axis] = THREE.MathUtils.clamp(this.feet[axis], min, max);
      if (
        (this.feet[axis] <= min && this.velocity[axis] < 0) ||
        (this.feet[axis] >= max && this.velocity[axis] > 0)
      )
        this.velocity[axis] = 0;
    }
  }
}
