import { benchmarkFrame, type Benchmark } from './validation';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SurfaceOcclusion } from './SurfaceOcclusion';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import {
  ROOT,
  PREFIX,
  GROUPS,
  belongs,
  inMembers,
  type Part,
  type Manifest,
  type Mechanism,
} from '../experience/catalog';
import {
  initialState,
  resolveState,
  layerOffset,
  damp,
  type ExperienceState,
} from '../experience/state';
import { PlaybackClock, evaluatePose } from '../motion/evaluate';
import { createMaterial, finishFor, setFinishEnabled } from './materials';

type RenderPart = {
  source: Part;
  mesh: THREE.Mesh;
  assembled: THREE.Matrix4;
  offset: THREE.Vector3;
  target: THREE.Vector3;
  material: THREE.MeshStandardMaterial;
  center: THREE.Vector3;
};
type Saved = {
  state: ExperienceState;
  position: THREE.Vector3;
  target: THREE.Vector3;
};
export interface ViewerSnapshot extends ExperienceState {
  ready: boolean;
  status: string;
  error: string;
  detailError: string;
  parts: Part[];
  canBack: boolean;
  catalogLoaded: boolean;
  benchmarkResult: unknown;
  stats: Record<string, unknown>;
}
export class MovementViewer {
  benchmark: Benchmark | null = null;
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(33, 1, 0.05, 2000);
  controls: OrbitControls;
  root = new THREE.Group();
  environment: THREE.WebGLRenderTarget;
  surfaceOcclusion?: SurfaceOcclusion;
  beautyTriangles?: number;
  beautyDrawCalls?: number;
  observer: ResizeObserver;
  frame = 0;
  dead = false;
  ready = false;
  status = 'Loading original movement…';
  error = '';
  detailError = '';
  state = { ...initialState };
  clock = new PlaybackClock();
  manifest: Manifest | null = null;
  parts: Part[] = [];
  renderParts = new Map<string, RenderPart>();
  history: Saved[] = [];
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  travel: { position: THREE.Vector3; target: THREE.Vector3 } | null = null;
  needsRender = true;
  lastFrame = 0;
  lastNotify = 0;
  frameIntervals: number[] = [];
  renderCount = 0;
  qualityChanged = 0;
  loadStart = performance.now();
  loadMs = 0;
  presentationMoving = true;
  catalogLoaded = false;
  catalogPending: Promise<void> | null = null;
  loadGeneration = 0;
  contextLosses = 0;
  contextLost = false;
  selectionBox = new THREE.Box3Helper(new THREE.Box3(), 0xffdaa0);
  raycaster = new THREE.Raycaster();
  pointer = { x: 0, y: 0, id: -1 };
  constructor(
    public host: HTMLElement,
    public notify: (s: ViewerSnapshot) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.setClearColor(0, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Movement; drag to orbit or use the view buttons',
    );
    this.camera.up.set(0, -1, 0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 200;
    this.controls.addEventListener('start', this.manual);
    this.controls.addEventListener('change', this.invalidate);
    const pmrem = new THREE.PMREMGenerator(this.renderer),
      room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.9;
    room.dispose();
    pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight(0xc8e0ed, 0x29221b, 0.25));
    const key = new THREE.DirectionalLight(0xffecd6, 0.8);
    key.position.set(-25, 40, -45);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xc0dff3, 0.6);
    rim.position.set(30, -10, 35);
    this.scene.add(rim);
    this.scene.add(this.root, this.selectionBox);
    this.surfaceOcclusion = new SurfaceOcclusion(this.scene, this.camera);
    this.selectionBox.visible = false;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.pointerUp);
    this.renderer.domElement.addEventListener(
      'webglcontextlost',
      this.onContextLost,
    );
    this.renderer.domElement.addEventListener(
      'webglcontextrestored',
      this.onContextRestored,
    );
    document.addEventListener('visibilitychange', this.onVisibility);
    void this.load();
    this.frame = requestAnimationFrame(this.tick);
  }
  snapshot(): ViewerSnapshot {
    return {
      ...this.state,
      ready: this.ready,
      status: this.status,
      error: this.error,
      detailError: this.detailError,
      parts: this.parts,
      canBack: !!this.history.length,
      catalogLoaded: this.catalogLoaded,
      benchmarkResult: this.benchmark?.result,
      stats: this.stats(),
    };
  }
  emit() {
    if (!this.dead) this.notify(this.snapshot());
  }
  stats() {
    const a = [...this.frameIntervals].sort((a, b) => a - b);
    return {
      benchmark: this.benchmark
        ? {
            running: !this.benchmark.done,
            elapsedSeconds: (performance.now() - this.benchmark.start) / 1000,
          }
        : null,
      sourceInstances: this.parts.length ? this.parts.length - 1 : 0,
      renderableLoaded: this.renderParts.size,
      visible: [...this.renderParts.values()].filter((p) => p.mesh.visible)
        .length,
      triangles: this.beautyTriangles ?? this.renderer.info.render.triangles,
      drawCalls: this.beautyDrawCalls ?? this.renderer.info.render.calls,
      contactShading:
        this.state.treatment === 'finish' && this.state.quality !== 'low',
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      renderCount: this.renderCount,
      samples: a.length,
      p95FrameMs: a.length ? a[Math.floor((a.length - 1) * 0.95)] : null,
      pixelRatio: this.renderer.getPixelRatio(),
      loadMs: this.loadMs,
      contextLosses: this.contextLosses,
      camera: this.camera.position.toArray(),
      target: this.controls.target.toArray(),
      maxAssemblyError: this.assemblyError(),
      assetTransfers: performance
        .getEntriesByType('resource')
        .filter((e) => e.name.includes('/models/'))
        .map((e) => {
          const r = e as PerformanceResourceTiming;
          return {
            name: r.name.split('/').pop(),
            transferBytes: r.transferSize,
            encodedBytes: r.encodedBodySize,
            decodedBytes: r.decodedBodySize,
            durationMs: r.duration,
          };
        }),
      userAgent: navigator.userAgent,
    };
  }
  assemblyError() {
    if (
      this.state.study ||
      this.state.reveal ||
      this.state.separation ||
      this.state.partSpread
    )
      return null;
    let error = 0;
    for (const p of this.renderParts.values())
      for (let i = 0; i < 16; i++)
        error = Math.max(
          error,
          Math.abs(p.mesh.matrix.elements[i] - p.assembled.elements[i]),
        );
    return error;
  }
  invalidate = () => {
    this.needsRender = true;
  };
  manual = () => {
    this.travel = null;
    this.needsRender = true;
  };
  onVisibility = () => {
    this.clock.rebase();
    this.lastFrame = 0;
    this.invalidate();
  };
  onContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    this.contextLosses++;
    this.patch({ playing: false });
    this.error = '3D paused after a graphics interruption. Restoring…';
    this.emit();
  };
  onContextRestored = () => {
    this.environment.dispose();
    const pmrem = new THREE.PMREMGenerator(this.renderer),
      room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environment.texture;
    room.dispose();
    pmrem.dispose();
    this.contextLost = false;
    this.error = '';
    this.needsRender = true;
    this.emit();
  };
  async load() {
    const generation = ++this.loadGeneration;
    this.error = '';
    this.status = 'Loading original movement…';
    this.emit();
    try {
      const response = await fetch('/models/assembly-manifest.json');
      if (!response.ok) throw new Error('Manifest unavailable');
      this.manifest = await response.json();
      this.parts = this.manifest!.instances;
      const paths = await fetch('/models/asset-paths.json')
        .then((r) =>
          r.ok
            ? (r.json() as Promise<{ overview: string; catalog: string }>)
            : null,
        )
        .catch(() => null);
      if (
        paths &&
        typeof paths.overview === 'string' &&
        typeof paths.catalog === 'string'
      )
        this.paths = { overview: paths.overview, catalog: paths.catalog };
      const gltf = await new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .loadAsync(this.paths.overview, (p) => {
          if (!this.dead && generation === this.loadGeneration && p.total) {
            this.status = `Loading movement · ${Math.round((100 * p.loaded) / p.total)}%`;
            this.emit();
          }
        });
      if (this.dead || generation !== this.loadGeneration) {
        this.disposeObject(gltf.scene);
        return;
      }
      this.ingest(gltf.scene);
      this.ready = true;
      this.state = { ...initialState, phase: 'whole' };
      this.status = '';
      this.loadMs = performance.now() - this.loadStart;
      this.homeCamera(true);
      this.retarget();
      this.emit();
    } catch (error) {
      if (this.dead || generation !== this.loadGeneration) return;
      this.error =
        'The movement could not load. The reference view remains available.';
      this.status = '';
      this.emit();
      console.error('Movement load', error);
    }
  }
  paths = {
    overview: '/models/zweigesicht.glb',
    catalog: '/models/catalog.glb',
  };
  ingest(scene: THREE.Object3D) {
    scene.updateMatrixWorld(true);
    const byId = new Map(this.parts.map((p) => [p.id, p]));
    const accepted: RenderPart[] = [];
    scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      let parent: THREE.Object3D | null = node,
        record: Part | undefined;
      while (parent && !record) {
        record = byId.get(parent.name);
        parent = parent.parent;
      }
      if (!record || this.renderParts.has(record.id)) return;
      const original = node.material;
      const material = createMaterial(
        record.name,
        record.definitionId,
        node.geometry,
      );
      node.material = material;
      for (const m of Array.isArray(original) ? original : [original])
        m.dispose();
      const assembled = new THREE.Matrix4().set(
        ...(record.worldTransform.flat() as [
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
        ]),
      );
      node.matrixAutoUpdate = false;
      node.matrix.copy(assembled);
      node.userData.partId = record.id;
      const b = record.boundsWorldMm;
      const center = b
        ? new THREE.Vector3()
            .fromArray(b[0])
            .add(new THREE.Vector3().fromArray(b[1]))
            .multiplyScalar(0.5)
        : new THREE.Vector3().setFromMatrixPosition(assembled);
      accepted.push({
        source: record,
        mesh: node,
        assembled,
        offset: new THREE.Vector3(),
        target: new THREE.Vector3(),
        material,
        center,
      });
    });
    for (const p of accepted) {
      p.mesh.removeFromParent();
      this.root.add(p.mesh);
      this.renderParts.set(p.source.id, p);
    }
    const retained = new Set(
      [...this.renderParts.values()].map((p) => p.mesh.geometry),
    );
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        if (!retained.has(o.geometry)) o.geometry.dispose();
        for (const material of Array.isArray(o.material)
          ? o.material
          : [o.material])
          material.dispose();
      }
    });
    this.needsRender = true;
  }
  async loadCatalog() {
    if (this.catalogLoaded) return;
    if (this.catalogPending) return this.catalogPending;
    this.detailError = '';
    this.status = 'Loading source catalog…';
    this.emit();
    this.catalogPending = (async () => {
      try {
        const gltf = await new GLTFLoader()
          .setMeshoptDecoder(MeshoptDecoder)
          .loadAsync(this.paths.catalog);
        if (this.dead) {
          this.disposeObject(gltf.scene);
          return;
        }
        this.ingest(gltf.scene);
        this.catalogLoaded = true;
        this.status = '';
        this.retarget();
        this.emit();
      } catch (e) {
        this.status = '';
        this.detailError =
          'Catalog geometry could not load. The movement is still available.';
        this.emit();
        throw e;
      } finally {
        this.catalogPending = null;
      }
    })();
    return this.catalogPending;
  }
  patch(patch: Partial<ExperienceState>) {
    this.state = resolveState(this.state, {
      ...(patch.time !== undefined ? { playing: false } : {}),
      ...patch,
    });
    if (patch.time !== undefined) this.clock.seek(this.state.time);
    this.clock.playing = this.state.playing;
    this.clock.speed = this.state.speed;
    this.retarget();
    this.emit();
  }
  save() {
    this.history.push({
      state: { ...this.state, playing: false },
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
    });
    if (this.history.length > 12) this.history.shift();
  }
  group(id: string | null) {
    if (!this.ready) {
      this.state = { ...this.state, group: id };
      this.emit();
      return;
    }
    this.save();
    const group = GROUPS.find((g) => g.id === id);
    this.patch({
      group: id,
      part: null,
      isolated: false,
      phase: id ? 'revealing' : 'recovering',
      reveal: id ? 1 : 0,
      separation: 0,
      partSpread: 0,
      study: false,
      playing: false,
      side: group?.side === 1 ? 'front' : 'back',
    });
    if (group) this.frameGroup(group);
    else this.homeCamera();
  }
  back() {
    const previous = this.history.pop();
    if (!previous) {
      this.reset();
      return;
    }
    this.state = resolveState(previous.state, {
      playing: false,
      phase: 'recovering',
    });
    this.clock.seek(this.state.time);
    this.travel = { position: previous.position, target: previous.target };
    this.ensureFramingRange();
    this.retarget();
    this.emit();
  }
  reset() {
    this.history = [];
    this.state = { ...initialState, phase: 'recovering' };
    this.clock.seek(0);
    this.detailError = '';
    this.homeCamera();
    this.retarget();
    this.emit();
  }
  homeCamera(immediate = false) {
    this.frameTo(
      new THREE.Vector3(1.8, 0, -2.8),
      81,
      new THREE.Vector3(0.1, 0.17, -1),
      immediate,
    );
  }
  frameTo(
    target: THREE.Vector3,
    distance: number,
    direction: THREE.Vector3,
    immediate = false,
  ) {
    const scale = 1 / Math.min(1, this.camera.aspect);
    const position = target
      .clone()
      .add(direction.normalize().multiplyScalar(distance * scale));
    this.controls.maxDistance = Math.max(200, distance * scale * 1.5);
    this.camera.far = Math.max(1000, this.controls.maxDistance * 2);
    this.camera.updateProjectionMatrix();
    if (immediate || this.reduced) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      this.travel = null;
    } else this.travel = { position, target };
    this.needsRender = true;
  }
  frameGroup(g: Mechanism) {
    this.frameTo(
      new THREE.Vector3(...(g.target as [number, number, number])),
      g.distance,
      new THREE.Vector3(0.14, 0.18, g.side),
    );
  }
  setSide(side: 'back' | 'front') {
    this.patch({ side });
    const distance = this.camera.position.distanceTo(this.controls.target);
    this.frameTo(
      this.controls.target.clone(),
      distance * Math.min(1, this.camera.aspect),
      new THREE.Vector3(0.08, 0.1, side === 'back' ? -1 : 1),
    );
  }
  view(kind: 'front' | 'back' | 'side' | 'oblique') {
    if (kind === 'side') {
      this.frameTo(
        new THREE.Vector3(0, 0, -2.8),
        84,
        new THREE.Vector3(1, 0.05, 0.05),
      );
      return;
    }
    if (kind === 'oblique') {
      this.frameTo(
        new THREE.Vector3(0, 0, -2.8),
        84,
        new THREE.Vector3(0.65, 0.6, -1),
      );
      return;
    }
    this.setSide(kind);
  }
  zoom(factor: number) {
    this.travel = null;
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.setLength(
      THREE.MathUtils.clamp(
        offset.length() * factor,
        3,
        this.controls.maxDistance,
      ),
    );
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
    this.invalidate();
  }
  orbit(dx: number, dy: number) {
    this.travel = null;
    const offset = this.camera.position.clone().sub(this.controls.target),
      spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += dx;
    spherical.phi = THREE.MathUtils.clamp(
      spherical.phi + dy,
      0.02,
      Math.PI - 0.02,
    );
    this.camera.position
      .copy(this.controls.target)
      .add(new THREE.Vector3().setFromSpherical(spherical));
    this.controls.update();
    this.invalidate();
  }
  async select(id: string) {
    const part = this.parts.find((p) => p.id === id);
    if (!part) return;
    const prior = this.state.part;
    if (prior !== id) this.save();
    this.patch({
      part: id,
      isolated: false,
      playing: false,
      study: false,
      phase: 'part',
    });
    if (!belongs(id, ROOT) && !this.catalogLoaded) {
      try {
        await this.loadCatalog();
      } catch {
        return;
      }
      if (this.state.part !== id) return;
    }
    const bounds = new THREE.Box3();
    for (const p of this.renderParts.values())
      if (belongs(p.source.id, id)) {
        bounds.union(new THREE.Box3().setFromObject(p.mesh));
      }
    if (!bounds.isEmpty()) {
      const center = bounds.getCenter(new THREE.Vector3()),
        size = bounds.getSize(new THREE.Vector3()).length();
      this.frameTo(
        center,
        Math.max(8, size * 2.2),
        this.camera.position.clone().sub(this.controls.target),
      );
    }
    this.retarget();
    this.emit();
  }
  setStudy(enabled: boolean) {
    this.patch({
      study: enabled,
      playing: false,
      time: 0,
      part: null,
      isolated: false,
    });
    if (enabled)
      this.frameGroup(
        GROUPS.find((g) => g.id === this.state.group) || GROUPS[0],
      );
  }
  retarget() {
    const group = GROUPS.find((g) => g.id === this.state.group),
      selection = this.state.part;
    for (const p of this.renderParts.values()) {
      const id = p.source.id,
        selected = !!selection && belongs(id, selection),
        member = !!group && inMembers(id, group.members),
        context = !!group && inMembers(id, group.context),
        obstruction =
          !!group &&
          (inMembers(id, group.obstructions) ||
            group.partObstructions?.some((suffix) =>
              belongs(id, PREFIX + suffix),
            ));
      p.target.set(0, 0, layerOffset(p.center.z, this.state.separation));
      if (group && obstruction)
        p.target.z += group.side * 26 * this.state.reveal;
      if (group && member && this.state.partSpread) {
        p.target.z += (p.center.z + 2.8) * this.state.partSpread * 7;
        p.target.x +=
          (p.center.x - group.target[0]) * this.state.partSpread * 0.35;
        p.target.y +=
          (p.center.y - group.target[1]) * this.state.partSpread * 0.35;
      }
      const external = !belongs(id, ROOT);
      let visible = !external || selected;
      if (this.state.isolated) visible = selected;
      if (id === PREFIX + '66' && !selected) visible = false;
      if (id === PREFIX + '53' && this.state.part === PREFIX + '66')
        visible = false;
      if (
        group &&
        this.state.reveal > 0.5 &&
        !selected &&
        !this.state.isolated &&
        !member &&
        !context &&
        !obstruction
      )
        visible = false;
      if (group && obstruction && Math.abs(p.offset.z) > 24 && !selected)
        visible = false;
      const unsafe =
        ['d_0_1_1_112', 'd_0_1_1_114', 'd_0_1_1_116'].includes(
          p.source.definitionId,
        ) ||
        belongs(id, PREFIX + '13') ||
        id === PREFIX + '4';
      if (this.state.study && unsafe) visible = false;
      p.mesh.visible = visible;
      const finish = finishFor(p.source.name, p.source.definitionId);
      p.material.color.setHex(finish.color);
      p.material.metalness = finish.metalness;
      p.material.roughness = finish.roughness;
      p.material.emissive.setHex(0);
      setFinishEnabled(
        p.material,
        this.state.treatment === 'finish' && (!group || member) && !selected,
      );
      if (this.state.treatment === 'function') {
        p.material.metalness = 0.22;
        p.material.roughness = 0.55;
        p.material.color.set(
          member
            ? ['#deb776', '#8abfcf', '#bcaad9'][
                Math.max(
                  0,
                  group!.members.findIndex((i) => belongs(id, PREFIX + i)),
                ) % 3
              ]
            : '#6c808a',
        );
      }
      if (group && !member && !selected) {
        p.material.color.multiplyScalar(context ? 0.16 : 0.1);
        p.material.metalness = 0.05;
        p.material.roughness = 0.95;
      }
      if (selected) {
        p.material.color.set('#f5cf88');
        p.material.emissive.set('#493014');
      }
    }
    this.needsRender = true;
  }
  applyPose(dt: number) {
    let moving = false;
    const pose = evaluatePose(this.clock.time),
      temp = new THREE.Matrix4(),
      rotation = new THREE.Matrix4(),
      pivot = new THREE.Vector3();
    for (const p of this.renderParts.values()) {
      p.offset.set(
        damp(p.offset.x, p.target.x, dt, this.reduced),
        damp(p.offset.y, p.target.y, dt, this.reduced),
        damp(p.offset.z, p.target.z, dt, this.reduced),
      );
      if (p.offset.distanceToSquared(p.target) < 1e-8) p.offset.copy(p.target);
      else moving = true;
      p.mesh.matrix.copy(p.assembled);
      let angle = 0;
      if (this.state.study) {
        const id = p.source.id;
        if (
          belongs(id, PREFIX + '7__0_1_1_108_1') ||
          id === PREFIX + '7__0_1_1_108_2'
        ) {
          angle = pose.balance;
          pivot.set(0, -10, -2.65);
        } else if (belongs(id, PREFIX + '62')) {
          angle = pose.escape;
          pivot.set(-1.99989817890187, -4.131405, -4.14);
        } else if (belongs(id, PREFIX + '65')) {
          angle = pose.seconds;
          pivot.set(0, 0, -4.31);
        } else if (belongs(id, PREFIX + '63')) {
          angle = pose.third;
          pivot.set(3.17046045103862, -3.61722, -3.21);
        } else if (belongs(id, PREFIX + '3')) {
          angle = pose.minute;
          pivot.set(0, 0, -2.98);
        }
        if (angle) {
          temp.makeTranslation(-pivot.x, -pivot.y, -pivot.z);
          p.mesh.matrix.premultiply(temp);
          rotation.makeRotationZ(angle);
          p.mesh.matrix.premultiply(rotation);
          temp.makeTranslation(pivot.x, pivot.y, pivot.z);
          p.mesh.matrix.premultiply(temp);
        }
      }
      temp.makeTranslation(p.offset.x, p.offset.y, p.offset.z);
      p.mesh.matrix.premultiply(temp);
      p.mesh.matrixWorldNeedsUpdate = true;
    }
    if (this.state.part) {
      const b = new THREE.Box3();
      for (const p of this.renderParts.values())
        if (p.mesh.visible && belongs(p.source.id, this.state.part))
          b.union(new THREE.Box3().setFromObject(p.mesh));
      this.selectionBox.box.copy(b);
      this.selectionBox.visible = !b.isEmpty();
    } else this.selectionBox.visible = false;
    return moving;
  }
  pointerDown = (e: PointerEvent) => {
    this.pointer = { x: e.clientX, y: e.clientY, id: e.pointerId };
    if (!e.isPrimary) this.pointer.id = -1;
  };
  pointerUp = (e: PointerEvent) => {
    if (
      this.pointer.id !== e.pointerId ||
      Math.hypot(e.clientX - this.pointer.x, e.clientY - this.pointer.y) > 6
    )
      return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    const hits = this.raycaster.intersectObjects(
      [...this.renderParts.values()]
        .filter((p) => p.mesh.visible)
        .map((p) => p.mesh),
      false,
    );
    if (hits[0]) void this.select(hits[0].object.userData.partId);
  };
  resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (w < 1 || h < 1) return;
    const old = this.camera.aspect;
    this.renderer.setSize(w, h);
    this.surfaceOcclusion?.resize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.ready && Math.abs(old - this.camera.aspect) > 0.15) {
      const factor = Math.min(1, old) / Math.min(1, this.camera.aspect);
      this.camera.position
        .sub(this.controls.target)
        .multiplyScalar(factor)
        .add(this.controls.target);
      if (this.travel)
        this.travel.position
          .sub(this.travel.target)
          .multiplyScalar(factor)
          .add(this.travel.target);
    }
    this.ensureFramingRange();
    this.invalidate();
  }
  ensureFramingRange() {
    const distance = Math.max(
      this.camera.position.distanceTo(this.controls.target),
      this.travel ? this.travel.position.distanceTo(this.travel.target) : 0,
    );
    this.controls.maxDistance = Math.max(
      this.controls.maxDistance,
      distance * 1.1,
    );
    if (this.camera.far < this.controls.maxDistance * 2) {
      this.camera.far = this.controls.maxDistance * 2;
      this.camera.updateProjectionMatrix();
    }
  }
  tick = (now: number) => {
    if (this.dead) return;
    this.frame = requestAnimationFrame(this.tick);
    if (document.hidden || this.contextLost) {
      this.clock.sample(now, true);
      this.lastFrame = 0;
      return;
    }
    const interval = this.lastFrame ? now - this.lastFrame : 0;
    const dt = Math.min(interval / 1000, 0.1);
    this.lastFrame = now;
    if (this.benchmark) benchmarkFrame(this, this.benchmark, now, interval);
    this.clock.sample(now);
    this.state.time = this.clock.time;
    let moving = false;
    if (this.needsRender || this.presentationMoving || this.clock.playing) {
      moving = this.applyPose(dt);
      this.presentationMoving = moving;
      this.retargetVisibility();
    }
    if (this.travel) {
      const a = this.reduced ? 1 : 1 - Math.exp(-dt * 6);
      this.camera.position.lerp(this.travel.position, a);
      this.controls.target.lerp(this.travel.target, a);
      if (
        this.camera.position.distanceTo(this.travel.position) < 0.005 &&
        this.controls.target.distanceTo(this.travel.target) < 0.005
      ) {
        this.camera.position.copy(this.travel.position);
        this.controls.target.copy(this.travel.target);
        this.travel = null;
      } else moving = true;
    }
    this.ensureFramingRange();
    const controlsChanged = this.controls.update();
    if (this.needsRender || moving || this.clock.playing || controlsChanged) {
      this.renderer.render(this.scene, this.camera);
      this.beautyTriangles = this.renderer.info.render.triangles;
      this.beautyDrawCalls = this.renderer.info.render.calls;
      if (this.state.treatment === 'finish' && this.state.quality !== 'low')
        this.surfaceOcclusion?.render(this.renderer);
      this.renderCount++;
      if (this.clock.playing && dt > 0) {
        this.frameIntervals.push(interval);
        if (this.frameIntervals.length > 20000) this.frameIntervals.shift();
      }
      this.needsRender = false;
    }
    if (!moving && ['revealing', 'recovering'].includes(this.state.phase)) {
      this.state.phase = this.state.part
        ? 'part'
        : this.state.group
          ? 'mechanism'
          : 'whole';
      this.emit();
    }
    if (now - this.lastNotify > 400) {
      this.lastNotify = now;
      this.retargetVisibility();
      this.adjustQuality(now);
      this.emit();
    }
  };
  retargetVisibility() {
    const group = GROUPS.find((g) => g.id === this.state.group);
    for (const p of this.renderParts.values()) {
      const id = p.source.id,
        selected = !!this.state.part && belongs(id, this.state.part),
        member = !!group && inMembers(id, group.members),
        context = !!group && inMembers(id, group.context),
        obstruction =
          !!group &&
          (inMembers(id, group.obstructions) ||
            group.partObstructions?.some((suffix) =>
              belongs(id, PREFIX + suffix),
            ));
      let visible = belongs(id, ROOT) || selected;
      if (this.state.isolated) visible = selected;
      if (id === PREFIX + '66' && !selected) visible = false;
      if (id === PREFIX + '53' && this.state.part === PREFIX + '66')
        visible = false;
      if (
        group &&
        this.state.reveal > 0.5 &&
        !selected &&
        !this.state.isolated &&
        !member &&
        !context &&
        !obstruction
      )
        visible = false;
      if (group && obstruction && Math.abs(p.offset.z) > 24 && !selected)
        visible = false;
      if (
        this.state.study &&
        (['d_0_1_1_112', 'd_0_1_1_114', 'd_0_1_1_116'].includes(
          p.source.definitionId,
        ) ||
          belongs(id, PREFIX + '13') ||
          id === PREFIX + '4')
      )
        visible = false;
      if (p.mesh.visible !== visible) {
        p.mesh.visible = visible;
        this.needsRender = true;
      }
    }
  }
  adjustQuality(now: number) {
    const desired =
      this.state.quality === 'low'
        ? 1
        : Math.min(devicePixelRatio, this.state.quality === 'high' ? 2 : 1.5);
    if (this.state.quality !== 'auto') {
      if (this.renderer.getPixelRatio() !== desired) {
        this.renderer.setPixelRatio(desired);
        this.resize();
      }
      return;
    }
    if (this.frameIntervals.length > 120 && now - this.qualityChanged > 10000) {
      const recent = this.frameIntervals.slice(-120).sort((a, b) => a - b);
      if (recent[114] > 32 && this.renderer.getPixelRatio() > 1) {
        this.renderer.setPixelRatio(1);
        this.resize();
        this.qualityChanged = now;
      }
    }
  }
  disposeObject(o: THREE.Object3D) {
    o.traverse((p) => {
      if (p instanceof THREE.Mesh) {
        p.geometry.dispose();
        for (const m of Array.isArray(p.material) ? p.material : [p.material])
          m.dispose();
      }
    });
  }
  dispose() {
    this.dead = true;
    this.loadGeneration++;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.controls.dispose();
    this.disposeObject(this.root);
    this.selectionBox.geometry.dispose();
    (this.selectionBox.material as THREE.Material).dispose();
    this.environment.dispose();
    this.surfaceOcclusion?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
