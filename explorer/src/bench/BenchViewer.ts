import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import {
  configureRenderer,
  createStudioEnvironment,
} from '../viewer/GraphicsResources';
import {
  attachSourceSurface,
  loadSourceSurfaces,
} from '../viewer/SourceSurfaces';
import { loadRecoveredDiamond } from '../viewer/RecoveredDiamond';
import { wheelDisplayMatrix } from '../viewer/WheelDisplayPose';
import { createMaterial, setFinishEnabled } from '../viewer/materials';
import { assetRequestUrl } from '../experience/loading';
import type { Manifest, Part } from '../experience/catalog';
import { CollisionWorld, Walker, WALK } from './physics';
import { BenchQuality, LookActivity, type QualityMode } from './performance';
import layout from '../../../assets/authored/atelier-layout.json';
import watchConfiguration from '../../../assets/authored/watch-configurations.json';
import holderManifest from '../../../assets/source-manifest/holder.json';
export type BenchStatus = {
  ready: boolean;
  captured: boolean;
  side: 'bridge' | 'dial';
  error: string;
  quality: QualityMode;
};

function printedPlastic() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xa82820,
    roughness: 0.78,
    metalness: 0,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 printPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nprintPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;',
    );
    shader.fragmentShader =
      'varying vec3 printPosition;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      float layers = printPosition.y * 6.28318530718 / 0.12;
      float layerFade = 1.0 - smoothstep(0.4, 2.0, fwidth(layers));
      vec3 axis = normalize(mat3(viewMatrix) * vec3(0.0, 1.0, 0.0));
      normal = normalize(normal + (axis - normal * dot(axis, normal)) * cos(layers) * 0.12 * layerFade);
    `,
    );
  };
  material.customProgramCacheKey = () => 'bench-print-0.12mm-v1';
  return material;
}

/** Route-owned scene; every input listener and GPU resource has one lifetime. */
export class BenchViewer {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(68, 1, 0.035, 250);
  renderer: THREE.WebGLRenderer;
  environment?: THREE.WebGLRenderTarget;
  stations = layout.stations.map((spec) => ({
    ...spec,
    root: new THREE.Group(),
    movement: new THREE.Group(),
    holder: new THREE.Group(),
  }));
  bridgeHolder?: THREE.Mesh;
  dialHolder?: THREE.Mesh;
  world = new CollisionWorld();
  walker = new Walker(this.world);
  status: BenchStatus = {
    ready: false,
    captured: false,
    side: 'bridge',
    error: '',
    quality: 'Auto',
  };
  dead = false;
  frame = 0;
  dirty = false;
  last = 0;
  observer!: ResizeObserver;
  assets: THREE.Object3D[] = [];
  generation = 0;
  releasedGeometry = new WeakSet<THREE.BufferGeometry>();
  releasedMaterial = new WeakSet<THREE.Material>();
  releasedTexture = new WeakSet<THREE.Texture>();
  renderCount = 0;
  frameTimes: number[] = [];
  cpuTimes: number[] = [];
  activity = new LookActivity();
  detail = new BenchQuality(devicePixelRatio);
  inspect = new URLSearchParams(location.search).has('inspect');
  constructor(
    public host: HTMLElement,
    public notify: (s: BenchStatus) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    try {
      configureRenderer(this.renderer);
      this.renderer.setClearColor(0xdfd6c4);
      this.renderer.setPixelRatio(this.detail.ratio);
      // Keep jewel transmission while reducing its full-scene offscreen pixel cost.
      this.renderer.transmissionResolutionScale = 0.5;
      host.appendChild(this.renderer.domElement);
      this.renderer.domElement.setAttribute(
        'aria-label',
        'First-person walk across the watch movement',
      );
      this.scene.background = new THREE.Color(0xdfd6c4);
      this.scene.fog = new THREE.Fog(0xdfd6c4, 210, 350);
      this.environment = createStudioEnvironment(this.renderer);
      this.scene.environment = this.environment.texture;
      this.scene.environmentIntensity = 0.85;
      this.scene.add(new THREE.HemisphereLight(0xf2f4eb, 0x635340, 0.8));
      const key = new THREE.DirectionalLight(0xffefd9, 1.4);
      key.position.set(-20, 65, 30);
      const fill = new THREE.DirectionalLight(0xd4e6ff, 0.7);
      fill.position.set(30, 30, -30);
      this.scene.add(key, fill);
      for (const station of this.stations) {
        station.root.name = station.id;
        station.root.position.set(station.x, 0, station.z);
        station.movement.rotation.x = THREE.MathUtils.degToRad(
          station.rotationX,
        );
        station.movement.position.y = station.seat;
        station.root.add(station.movement, station.holder);
        this.scene.add(station.root);
      }
      this.walker.spawn.fromArray(layout.arrival);
      this.walker.spawnYaw = layout.arrivalYaw;
      this.observer = new ResizeObserver(this.resize);
      this.observer.observe(host);
      document.addEventListener('pointerlockchange', this.lockChanged);
      document.addEventListener('pointerlockerror', this.lockError);
      document.addEventListener('mousemove', this.look);
      document.addEventListener('keydown', this.keyDown);
      document.addEventListener('keyup', this.keyUp);
      document.addEventListener('visibilitychange', this.visibility);
      window.addEventListener('blur', this.pause);
      this.renderer.domElement.addEventListener(
        'webglcontextlost',
        this.contextLost,
      );
      this.resize();
    } catch (error) {
      this.dispose();
      throw error;
    }
  }
  emit() {
    if (!this.dead) this.notify({ ...this.status });
  }
  releaseMaterial(material: THREE.Material) {
    if (this.releasedMaterial.has(material)) return;
    this.releasedMaterial.add(material);
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture && !this.releasedTexture.has(value)) {
        this.releasedTexture.add(value);
        value.dispose();
      }
    }
    material.dispose();
  }
  release(objects: THREE.Object3D[]) {
    for (const object of objects)
      object.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        if (!this.releasedGeometry.has(node.geometry)) {
          this.releasedGeometry.add(node.geometry);
          node.geometry.dispose();
        }
        for (const material of Array.isArray(node.material)
          ? node.material
          : [node.material])
          this.releaseMaterial(material);
      });
  }
  async load() {
    const generation = ++this.generation;
    const loaded: THREE.Object3D[] = [];
    this.status.error = '';
    this.emit();
    try {
      const get = async (url: string) => {
        const r = await fetch(url);
        if (!r.ok) throw Error(url + ' unavailable');
        return r.json();
      };
      const [manifest, paths] = await Promise.all([
        get('/models/assembly-manifest.json') as Promise<Manifest>,
        get('/models/asset-paths.json'),
      ]);
      if (this.dead || generation !== this.generation) return;
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const track = (o: THREE.Object3D) => {
        loaded.push(o);
        return o;
      };
      const holder = async (name: string) => {
        const response = await fetch('/bench-local/' + name + '.stl');
        if (!response.ok) throw Error('Local holder unavailable');
        const data = await response.arrayBuffer();
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest('SHA-256', data)),
          (v) => v.toString(16).padStart(2, '0'),
        ).join('');
        if (
          hash !==
          holderManifest.files.find((f) => f.path.endsWith('/' + name + '.stl'))
            ?.sha256
        )
          throw Error('Holder integrity mismatch');
        const mesh = new THREE.Mesh(
          new STLLoader().parse(data),
          printedPlastic(),
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.name = name + '-holder';
        track(mesh);
        return mesh;
      };
      const results = await Promise.allSettled([
        loader
          .loadAsync(assetRequestUrl(paths.overview))
          .then((g) => track(g.scene)),
        loadRecoveredDiamond(manifest.instances).then(track),
        loadSourceSurfaces(paths.overview),
        holder('movement'),
        holder('dial'),
        loader
          .loadAsync('/bench-local/environment.glb')
          .then((g) => track(g.scene)),
        loader
          .loadAsync(assetRequestUrl(paths.catalog))
          .then((g) => track(g.scene)),
      ]);
      if (this.dead || generation !== this.generation) {
        this.release(loaded);
        return;
      }
      for (const r of results) if (r.status === 'rejected') throw r.reason;
      const surfaces = (
        results[2] as PromiseFulfilledResult<
          Awaited<ReturnType<typeof loadSourceSurfaces>>
        >
      ).value;
      const records = new Map(manifest.instances.map((p) => [p.id, p]));
      const crownIds = new Set(
        watchConfiguration.leaves
          .filter((p) => p.packet === 'crown')
          .map((p) => p.id),
      );
      const required = manifest.instances.filter(
        (p) =>
          !p.isAssembly &&
          (p.id.startsWith('p_0_1_1_1__0_1_1_1_4__') || crownIds.has(p.id)),
      );
      const requiredIds = new Set(required.map((p) => p.id));
      const accepted = new Set<string>();
      for (const result of [results[0], results[1], results[6]]) {
        const object = (result as PromiseFulfilledResult<THREE.Object3D>).value;
        const meshes: { mesh: THREE.Mesh; record: Part }[] = [];
        object.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          let parent: THREE.Object3D | null = node;
          let record: Part | undefined;
          while (parent && !record) {
            record = records.get(parent.name);
            parent = parent.parent;
          }
          if (record) meshes.push({ mesh: node, record });
        });
        for (const { mesh, record } of meshes) {
          if (!requiredIds.has(record.id) || accepted.has(record.id)) continue;
          accepted.add(record.id);
          attachSourceSurface(mesh.geometry, surfaces.get(record.definitionId));
          const old = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          old.forEach((m) => this.releaseMaterial(m));
          mesh.material = createMaterial(
            record.name,
            record.definitionId,
            mesh.geometry,
            record.id,
          );
          setFinishEnabled(mesh.material as THREE.MeshStandardMaterial, true);
          mesh.matrixAutoUpdate = false;
          mesh.matrix.set(
            ...(record.worldTransform.flat() as Parameters<
              THREE.Matrix4['set']
            >),
          );
          mesh.matrix.copy(
            wheelDisplayMatrix(record.id, mesh.matrix) ?? mesh.matrix,
          );
          mesh.name = record.name;
          mesh.userData.partId = record.id;
          mesh.userData.packet = crownIds.has(record.id) ? 'crown' : 'movement';
          this.stations.forEach((station, i) => {
            const instance = i === 0 ? mesh : mesh.clone();
            instance.userData.stationId = station.id;
            instance.userData.instanceId = station.id + ':' + record.id;
            station.movement.add(instance);
          });
        }
      }
      if (required.some((p) => !accepted.has(p.id)))
        throw Error('Incomplete movement');
      this.bridgeHolder = (
        results[3] as PromiseFulfilledResult<THREE.Mesh>
      ).value;
      this.dialHolder = (
        results[4] as PromiseFulfilledResult<THREE.Mesh>
      ).value;
      this.stations[0].holder.add(this.bridgeHolder);
      this.stations[1].holder.add(this.dialHolder);
      const environment = (results[5] as PromiseFulfilledResult<THREE.Object3D>)
        .value;
      // glTF extras are the versioned Blender/renderer contract. Fail closed.
      environment.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        if (
          node.userData.atelierVersion !== 1 ||
          !['walkable', 'boundary', 'decor'].includes(
            node.userData.collisionRole,
          )
        )
          throw Error('Invalid atelier environment contract: ' + node.name);
      });
      this.scene.add(environment);
      const retained = new Set(
        this.stations.flatMap((station) =>
          station.movement.children.map(
            (node) => (node as THREE.Mesh).geometry,
          ),
        ),
      );
      for (const index of [0, 1, 6]) {
        const unused = (
          results[index] as PromiseFulfilledResult<THREE.Object3D>
        ).value;
        unused.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          if (
            !retained.has(node.geometry) &&
            !this.releasedGeometry.has(node.geometry)
          ) {
            this.releasedGeometry.add(node.geometry);
            node.geometry.dispose();
          }
          for (const material of Array.isArray(node.material)
            ? node.material
            : [node.material])
            this.releaseMaterial(material);
        });
        unused.clear();
      }
      this.assets = loaded;
      this.scene.updateMatrixWorld(true);
      // Yield between definitions so loading UI can paint while the BVHs are built.
      const solids: THREE.Mesh[] = [];
      for (const group of [...this.stations.map((s) => s.root), environment])
        group.traverse((node) => {
          if (
            node instanceof THREE.Mesh &&
            node.userData.collisionRole !== 'decor'
          )
            solids.push(node);
        });
      for (let i = 0; i < solids.length; i++) {
        if (this.dead) return;
        this.world.add(solids[i]);
        if (i % 16 === 0)
          await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (this.dead) return;
      // Compile both simultaneously present stations before capture.
      // Transmission renders opaque finishes a second time without tone mapping.
      const toneMapping = this.renderer.toneMapping;
      const outputColorSpace = this.renderer.outputColorSpace;
      try {
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        await this.renderer.compileAsync(this.scene, this.camera);
      } finally {
        this.renderer.toneMapping = toneMapping;
        this.renderer.outputColorSpace = outputColorSpace;
      }
      if (this.dead || generation !== this.generation) return;
      await this.renderer.compileAsync(this.scene, this.camera);
      if (this.dead || generation !== this.generation) return;
      this.status.ready = true;
      this.walker.reset();
      this.emit();
      this.wake();
    } catch (error) {
      console.error('Bench load', error);
      this.release(loaded);
      if (!this.dead) {
        this.status.error =
          'The bench could not load completely. Check the local bench assets, then retry.';
        this.status.ready = false;
        this.emit();
      }
    }
  }
  nearbyStation() {
    const { x, z } = this.walker.feet;
    return this.stations.reduce((best, station) =>
      Math.hypot(x - station.x, z - station.z) <
      Math.hypot(x - best.x, z - best.z)
        ? station
        : best,
    );
  }
  updateStation() {
    const station = this.nearbyStation();
    this.walker.recovery.fromArray(station.checkpoint);
    if (this.status.side !== station.id) {
      this.status.side = station.id as BenchStatus['side'];
      this.emit();
    }
  }
  enter = async () => {
    if (!this.status.ready) return;
    try {
      await this.renderer.domElement.requestPointerLock();
    } catch {
      this.lockError();
    }
  };
  lockError = () => {
    this.pause();
    this.status.error =
      'Mouse capture was declined. Choose Enter again to continue.';
    this.emit();
  };
  lockChanged = () => {
    this.status.captured =
      document.pointerLockElement === this.renderer.domElement;
    this.clearInput();
    if (this.status.captured) {
      this.status.error = '';
      this.wake();
    }
    this.emit();
  };
  clearInput() {
    this.walker.clear();
    this.activity.clear();
    this.detail.resetSamples();
    this.last = 0;
  }
  pause = () => {
    this.clearInput();
    this.status.captured = false;
    if (document.pointerLockElement === this.renderer.domElement)
      document.exitPointerLock();
    this.emit();
  };
  visibility = () => {
    if (document.hidden) {
      this.pause();
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    } else this.wake();
  };
  contextLost = (e: Event) => {
    e.preventDefault();
    this.pause();
    this.status.ready = false;
    this.status.error =
      'Graphics were interrupted. Retry to rebuild the bench.';
    this.emit();
  };
  look = (e: MouseEvent) => {
    if (!this.status.captured) return;
    if (!e.movementX && !e.movementY) return;
    this.activity.add(e.movementX, e.movementY, performance.now());
    this.wake();
  };
  keyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      if (this.status.captured) this.pause();
      return;
    }
    if (!this.status.captured) return;
    if (!['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyR'].includes(e.code))
      return;
    e.preventDefault();
    if (e.code === 'KeyR' && !e.repeat) this.reset();
    else if (e.code === 'Space' && !e.repeat) this.walker.jumpQueued = true;
    else if (e.code.startsWith('Key') && e.code !== 'KeyR')
      this.walker.keys.add(e.code);
    this.wake();
  };
  keyUp = (e: KeyboardEvent) => {
    if (this.walker.keys.delete(e.code)) this.wake();
  };
  reset = () => {
    this.clearInput();
    this.walker.reset();
    this.updateStation();
    this.wake();
  };
  quality = (mode: QualityMode | boolean) => {
    // Boolean remains accepted by existing local inspection scripts.
    this.detail.select(
      typeof mode === 'boolean' ? (mode ? 'Low' : 'High') : mode,
      devicePixelRatio,
    );
    this.status.quality = this.detail.mode;
    this.applyResolution();
    this.emit();
  };
  applyResolution() {
    if (this.renderer.getPixelRatio() !== this.detail.ratio)
      this.renderer.setPixelRatio(this.detail.ratio);
    this.wake();
  }
  resize = () => {
    if (this.dead) return;
    const { width, height } = this.host.getBoundingClientRect();
    this.renderer.setSize(width, height);
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.wake();
  };
  wake = () => {
    this.dirty = true;
    this.schedule();
  };
  schedule = () => {
    if (!this.frame && !this.dead && !document.hidden && this.status.ready)
      this.frame = requestAnimationFrame(this.tick);
  };
  tick = (now: number) => {
    this.frame = 0;
    if (this.dead || !this.status.ready || document.hidden) return;
    const start = this.inspect ? performance.now() : 0,
      elapsed = this.last ? now - this.last : 16.67;
    const moving =
      this.status.captured &&
      (this.walker.keys.size > 0 ||
        !this.walker.grounded ||
        this.walker.jumpQueued);
    const activity = this.activity.consume(now, moving);
    const dirty = this.dirty;
    this.dirty = false;
    if (!activity.active && !dirty && this.walker.grounded) {
      this.last = 0;
      this.detail.resetSamples();
      return;
    }
    this.walker.yaw -= activity.x * 0.002;
    this.walker.pitch = THREE.MathUtils.clamp(
      this.walker.pitch - activity.y * 0.002,
      -1.4,
      1.4,
    );
    if (activity.elapsed === null) this.detail.resetSamples();
    const shouldRender =
      dirty || moving || !this.walker.grounded || activity.looked;
    if (this.status.ready && (moving || !this.walker.grounded))
      this.walker.update(elapsed / 1000);
    this.updateStation();
    if (shouldRender) {
      this.camera.position.copy(this.walker.feet).y += WALK.eye;
      this.camera.rotation.set(this.walker.pitch, this.walker.yaw, 0, 'YXZ');
      this.renderer.render(this.scene, this.camera);
      this.renderCount++;
    }
    if (activity.elapsed !== null) {
      if (this.inspect) {
        this.frameTimes.push(activity.elapsed);
        this.cpuTimes.push(performance.now() - start);
        if (this.frameTimes.length > 3600) {
          this.frameTimes.shift();
          this.cpuTimes.shift();
        }
      }
      if (this.detail.sample(activity.elapsed)) this.applyResolution();
    }
    this.last = now;
    // A bounded scheduling-only tail ends sampling when a look burst stops.
    if (activity.active || !this.walker.grounded) this.schedule();
    if (!moving && this.walker.grounded) this.last = 0;
  };
  dispose() {
    this.dead = true;
    this.generation++;
    this.pause();
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    document.removeEventListener('pointerlockchange', this.lockChanged);
    document.removeEventListener('pointerlockerror', this.lockError);
    document.removeEventListener('mousemove', this.look);
    document.removeEventListener('keydown', this.keyDown);
    document.removeEventListener('keyup', this.keyUp);
    document.removeEventListener('visibilitychange', this.visibility);
    window.removeEventListener('blur', this.pause);
    this.renderer.domElement.removeEventListener(
      'webglcontextlost',
      this.contextLost,
    );
    this.release([this.scene, ...this.assets]);
    this.world.solids = [];
    this.world.trees.clear();
    this.environment?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
