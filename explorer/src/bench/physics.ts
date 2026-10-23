import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

export const WALK = Object.freeze({
  radius: 0.22,
  height: 1.65,
  eye: 1.48,
  speed: 5.5,
  gravity: 18,
  jump: 7,
  step: 0.22,
  tick: 1 / 180,
});
type Solid = {
  mesh: THREE.Mesh;
  tree: MeshBVH;
  inverse: THREE.Matrix4;
  bounds: THREE.Box3;
};
/** BVHs are per reusable CAD definition. No proxy floors cover source openings. */
export class CollisionWorld {
  solids: Solid[] = [];
  trees = new Map<THREE.BufferGeometry, MeshBVH>();
  add(mesh: THREE.Mesh) {
    let tree = this.trees.get(mesh.geometry);
    if (!tree) {
      tree = new MeshBVH(mesh.geometry, { indirect: true, maxLeafSize: 12 });
      this.trees.set(mesh.geometry, tree);
    }
    mesh.updateWorldMatrix(true, false);
    this.solids.push({
      mesh,
      tree,
      inverse: mesh.matrixWorld.clone().invert(),
      bounds: new THREE.Box3().setFromObject(mesh),
    });
  }
  sync() {
    for (const s of this.solids) {
      s.mesh.updateWorldMatrix(true, false);
      s.inverse.copy(s.mesh.matrixWorld).invert();
      s.bounds
        .copy(s.mesh.geometry.boundingBox!)
        .applyMatrix4(s.mesh.matrixWorld);
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
  resolve(feet: THREE.Vector3) {
    let grounded = false;
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
              .transformDirection(s.mesh.matrixWorld);
            if (worldNormal.y > 0.55) grounded = true;
            contacts.push(worldNormal);
            moved = true;
            return false;
          },
        });
        start.copy(segment.start).applyMatrix4(s.mesh.matrixWorld);
        end.copy(segment.end).applyMatrix4(s.mesh.matrixWorld);
      }
      if (!moved) break;
    }
    feet.copy(start).add(new THREE.Vector3(0, -WALK.radius, 0));
    return { grounded, contacts };
  }
  floor(x: number, z: number, top = 30) {
    const ray = new THREE.Ray(
      new THREE.Vector3(x, top, z),
      new THREE.Vector3(0, -1, 0),
    );
    let height = -Infinity;
    for (const s of this.solids) {
      if (
        !this.active(s) ||
        x < s.bounds.min.x ||
        x > s.bounds.max.x ||
        z < s.bounds.min.z ||
        z > s.bounds.max.z
      )
        continue;
      const localRay = ray.clone().applyMatrix4(s.inverse);
      const hit = s.tree.raycastFirst(localRay, THREE.DoubleSide);
      if (hit)
        height = Math.max(height, hit.point.applyMatrix4(s.mesh.matrixWorld).y);
    }
    return height;
  }
}
export class Walker {
  feet = new THREE.Vector3(-59, 0.002, 0);
  velocity = new THREE.Vector3();
  grounded = false;
  yaw = -Math.PI / 2;
  pitch = 0;
  keys = new Set<string>();
  jumpQueued = false;
  groundGrace = 0;
  jumpBuffer = 0;
  resets = 0;
  world: CollisionWorld;
  constructor(world: CollisionWorld) {
    this.world = world;
  }
  clear() {
    this.keys.clear();
    this.jumpQueued = false;
    this.groundGrace = 0;
    this.jumpBuffer = 0;
    this.velocity.set(0, 0, 0);
  }
  reset() {
    this.clear();
    this.feet.set(-59, 0.002, 0);
    this.yaw = -Math.PI / 2;
    this.pitch = 0.08;
    this.grounded = false;
    this.resets++;
  }
  update(dt: number) {
    // Substeps limit travel to < 1/3 capsule radius even at terminal fall speed.
    const steps = Math.ceil(Math.min(dt, 0.05) / WALK.tick);
    if (!steps) return;
    const h = Math.min(dt, 0.05) / steps;
    if (this.jumpQueued) this.jumpBuffer = 0.12;
    this.jumpQueued = false;
    for (let i = 0; i < steps; i++) {
      this.groundGrace = this.grounded
        ? 0.09
        : Math.max(0, this.groundGrace - h);
      this.jumpBuffer = Math.max(0, this.jumpBuffer - h);
      const forward =
        Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS'));
      const right =
        Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'));
      const n = Math.max(1, Math.hypot(forward, right));
      this.velocity.x =
        ((-Math.sin(this.yaw) * forward + Math.cos(this.yaw) * right) *
          WALK.speed) /
        n;
      this.velocity.z =
        ((-Math.cos(this.yaw) * forward - Math.sin(this.yaw) * right) *
          WALK.speed) /
        n;
      if (this.jumpBuffer > 0 && this.groundGrace > 0) {
        this.velocity.y = WALK.jump;
        this.jumpBuffer = 0;
        this.groundGrace = 0;
        this.grounded = false;
      }
      this.jumpQueued = false;
      this.velocity.y = Math.max(-8, this.velocity.y - WALK.gravity * h);
      const before = this.feet.clone(),
        wasGrounded = this.grounded;
      this.feet.addScaledVector(this.velocity, h);
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
            result = { grounded: true, contacts: check.contacts };
          }
        }
      }
      this.grounded = result.grounded;
      if (this.grounded && this.velocity.y < 0) this.velocity.y = 0;
      for (const normal of result.contacts)
        if (normal.y < -0.5 && this.velocity.y > 0) this.velocity.y = 0;
      if (
        this.feet.y < -8 ||
        Math.abs(this.feet.x) > 92 ||
        Math.abs(this.feet.z) > 72
      )
        this.reset();
    }
  }
}
