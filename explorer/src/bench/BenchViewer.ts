import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import {
  configureRenderer,
  createStudioEnvironment,
  disposeObjectResources,
} from '../viewer/GraphicsResources';
import {
  attachSourceSurface,
  loadSourceSurfaces,
} from '../viewer/SourceSurfaces';
import { loadRecoveredDiamond } from '../viewer/RecoveredDiamond';
import { createMaterial, setFinishEnabled } from '../viewer/materials';
import { assetRequestUrl } from '../experience/loading';
import type { Manifest, Part } from '../experience/catalog';
import { CollisionWorld, Walker, WALK } from './physics';
import { BenchQuality, LookActivity, type QualityMode } from './performance';
import holderManifest from '../../../assets/source-manifest/holder.json';
export type BenchStatus = {
  ready: boolean;
  captured: boolean;
  busy: boolean;
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
  movement = new THREE.Group();
  holder = new THREE.Group();
  bridgeHolder?: THREE.Mesh;
  dialHolder?: THREE.Mesh;
  ramps: THREE.Object3D[] = [];
  world = new CollisionWorld();
  walker = new Walker(this.world);
  status: BenchStatus = {
    ready: false,
    captured: false,
    busy: false,
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
  timers = new Set<ReturnType<typeof setTimeout>>();
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
      this.renderer.setClearColor(0x33352f);
      this.renderer.setPixelRatio(this.detail.ratio);
      // Keep jewel transmission while reducing its full-scene offscreen pixel cost.
      this.renderer.transmissionResolutionScale = 0.5;
      host.appendChild(this.renderer.domElement);
      this.renderer.domElement.setAttribute(
        'aria-label',
        'First-person walk across the watch movement',
      );
      this.scene.background = new THREE.Color(0x33352f);
      this.scene.fog = new THREE.Fog(0x33352f, 110, 230);
      this.environment = createStudioEnvironment(this.renderer);
      this.scene.environment = this.environment.texture;
      this.scene.environmentIntensity = 0.85;
      this.scene.add(new THREE.HemisphereLight(0xf2f4eb, 0x635340, 0.8));
      const key = new THREE.DirectionalLight(0xffefd9, 1.4);
      key.position.set(-20, 65, 30);
      const fill = new THREE.DirectionalLight(0xd4e6ff, 0.7);
      fill.position.set(30, 30, -30);
      this.scene.add(key, fill, this.movement, this.holder);
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
  delay(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      if (!this.dead) fn();
    }, ms);
    this.timers.add(id);
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
      ]);
      if (this.dead || generation !== this.generation) {
        loaded.forEach(disposeObjectResources);
        return;
      }
      for (const r of results) if (r.status === 'rejected') throw r.reason;
      const surfaces = (
        results[2] as PromiseFulfilledResult<
          Awaited<ReturnType<typeof loadSourceSurfaces>>
        >
      ).value;
      const records = new Map(manifest.instances.map((p) => [p.id, p]));
      const accepted = new Set<string>();
      for (const result of [results[0], results[1]]) {
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
          if (accepted.has(record.id)) continue;
          accepted.add(record.id);
          attachSourceSurface(mesh.geometry, surfaces.get(record.definitionId));
          const old = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          old.forEach((m) => m.dispose());
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
          mesh.name = record.name;
          mesh.userData.partId = record.id;
          this.movement.add(mesh);
        }
      }
      const required = manifest.instances.filter(
        (p) => !p.isAssembly && p.id.startsWith('p_0_1_1_1__0_1_1_1_4__'),
      );
      if (required.some((p) => !accepted.has(p.id)))
        throw Error('Incomplete movement');
      this.bridgeHolder = (
        results[3] as PromiseFulfilledResult<THREE.Mesh>
      ).value;
      this.dialHolder = (
        results[4] as PromiseFulfilledResult<THREE.Mesh>
      ).value;
      this.holder.add(this.bridgeHolder, this.dialHolder);
      const environment = (results[5] as PromiseFulfilledResult<THREE.Object3D>)
        .value;
      environment.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        (node.material as THREE.Material).dispose();
        if (node.name.includes('ramp')) {
          node.material = printedPlastic();
          this.ramps.push(node);
        } else {
          const material = new THREE.MeshStandardMaterial({
            color: node.name === 'mat' ? 0x375b48 : 0x8a7356,
            roughness: 0.95,
          });
          if (node.name === 'mat') {
            material.onBeforeCompile = (shader) => {
              shader.vertexShader =
                'varying vec3 matPoint;\n' + shader.vertexShader;
              shader.vertexShader = shader.vertexShader.replace(
                '#include <worldpos_vertex>',
                '#include <worldpos_vertex>\nmatPoint = (modelMatrix * vec4(transformed, 1.0)).xyz;',
              );
              shader.fragmentShader =
                'varying vec3 matPoint;\n' + shader.fragmentShader;
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `#include <color_fragment>
                vec2 grid = abs(fract(matPoint.xz / 5.0 + 0.5) - 0.5) * 5.0;
                vec2 edge = smoothstep(vec2(0.018), vec2(0.018) + fwidth(matPoint.xz), grid);
                float line = 1.0 - min(edge.x, edge.y);
                diffuseColor.rgb *= 1.0 + line * 0.12;
                diffuseColor.rgb *= mix(0.55, 1.0, smoothstep(19.0, 24.0, length(matPoint.xz)));
              `,
              );
            };
            material.customProgramCacheKey = () => 'bench-mat-5mm-v1';
          }
          node.material = material;
        }
      });
      this.scene.add(environment);
      this.assets = loaded;
      this.present('bridge');
      this.scene.updateMatrixWorld(true);
      // Yield between definitions so loading UI can paint while the BVHs are built.
      const solids: THREE.Mesh[] = [];
      for (const group of [this.movement, this.holder, environment])
        group.traverse((node) => {
          if (node instanceof THREE.Mesh) solids.push(node);
        });
      for (let i = 0; i < solids.length; i++) {
        if (this.dead) return;
        this.world.add(solids[i]);
        if (i % 16 === 0)
          await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (this.dead) return;
      // Compile every material (including currently hidden fixtures) before capture.
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
      loaded.forEach(disposeObjectResources);
      if (!this.dead) {
        this.status.error =
          'The bench could not load completely. Check the local bench assets, then retry.';
        this.status.ready = false;
        this.emit();
      }
    }
  }
  present(side: BenchStatus['side']) {
    this.status.side = side;
    this.movement.rotation.x = side === 'bridge' ? Math.PI / 2 : -Math.PI / 2;
    this.movement.position.y = side === 'bridge' ? 12.2 : 16.3;
    if (this.bridgeHolder) this.bridgeHolder.visible = side === 'bridge';
    if (this.dialHolder) this.dialHolder.visible = side === 'dial';
    for (const ramp of this.ramps)
      ramp.visible = ramp.name.startsWith(side + '-ramp');
    this.scene.updateMatrixWorld(true);
    this.world.sync();
  }
  switchSide = () => {
    if (!this.status.ready || this.status.busy) return;
    this.clearInput();
    this.status.busy = true;
    this.emit();
    this.delay(() => {
      this.present(this.status.side === 'bridge' ? 'dial' : 'bridge');
      this.walker.reset();
      this.wake();
      this.emit();
      this.delay(() => {
        this.status.busy = false;
        this.emit();
        this.wake();
      }, 180);
    }, 220);
  };
  enter = async () => {
    if (!this.status.ready || this.status.busy) return;
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
    if (!this.status.captured || this.status.busy) return;
    if (!e.movementX && !e.movementY) return;
    this.activity.add(e.movementX, e.movementY, performance.now());
    this.wake();
  };
  keyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      if (this.status.captured) this.pause();
      return;
    }
    if (!this.status.captured || this.status.busy) return;
    if (
      !['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyR', 'KeyT'].includes(
        e.code,
      )
    )
      return;
    e.preventDefault();
    if (e.code === 'KeyR' && !e.repeat) this.reset();
    else if (e.code === 'KeyT' && !e.repeat) this.switchSide();
    else if (e.code === 'Space' && !e.repeat) this.walker.jumpQueued = true;
    else if (e.code.startsWith('Key') && !['KeyR', 'KeyT'].includes(e.code))
      this.walker.keys.add(e.code);
    this.wake();
  };
  keyUp = (e: KeyboardEvent) => {
    if (this.walker.keys.delete(e.code)) this.wake();
  };
  reset = () => {
    if (!this.status.busy) {
      this.clearInput();
      this.walker.reset();
      this.wake();
    }
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
      !this.status.busy &&
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
    if (
      this.status.ready &&
      !this.status.busy &&
      (moving || !this.walker.grounded)
    )
      this.walker.update(elapsed / 1000);
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
    this.timers.forEach(clearTimeout);
    this.timers.clear();
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
    disposeObjectResources(this.scene);
    this.assets.forEach(disposeObjectResources);
    this.world.solids = [];
    this.world.trees.clear();
    this.environment?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
