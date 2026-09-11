import { focusRole, focusCover } from '../experience/emphasis';
import { explosionOffsets, uncoverHost } from '../experience/explosion';
import {
  DIALS,
  fittedLeaves,
  displayHostPart,
  type DialView,
  type DialFace,
  type DialPreferences,
} from '../experience/dials';
import { benchmarkFrame, type Benchmark } from './validation';
import { handDisplayMatrix, HAND_TIME } from './HandDisplayPose';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { StudioEnvironment } from './StudioEnvironment';
import {
  attachSourceSurface,
  loadSourceSurfaces,
  type SourceSurfaces,
} from './SourceSurfaces';
import { SurfaceOcclusion } from './SurfaceOcclusion';
import { loadRecoveredDiamond } from './RecoveredDiamond';
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
  resetViewState,
  resolveState,
  type ExperienceState,
} from '../experience/state';
import { makeSpread, type SpreadPlacement } from '../experience/spread';
import {
  createMaterial,
  finishFor,
  setFinishEnabled,
  setEmphasis,
} from './materials';
import {
  transferProgress,
  assetRequestUrl,
  type LoadStage,
} from '../experience/loading';

type RenderPart = {
  cutaway?: {
    level: number;
    from: number;
    target: number;
    elapsed: number;
    opacity: number;
    transparent: boolean;
    depthWrite: boolean;
  };
  motion?: {
    offset: THREE.Vector3;
    rotation: THREE.Quaternion;
    elapsed: number;
    duration: number;
  };
  source: Part;
  mesh: THREE.Mesh;
  assembled: THREE.Matrix4;
  displayMatrix?: THREE.Matrix4;
  offset: THREE.Vector3;
  target: THREE.Vector3;
  rotation: THREE.Quaternion;
  targetRotation: THREE.Quaternion;
  material: THREE.MeshStandardMaterial;
  center: THREE.Vector3;
};
type Saved = {
  up: THREE.Vector3;
  aspect: number;
  cameraUserOwned: boolean;
  spreadFocus: string | null;
  state: ExperienceState;
  position: THREE.Vector3;
  target: THREE.Vector3;
};
export interface ViewerSnapshot extends ExperienceState {
  spreadFocus: string | null;
  ready: boolean;
  loadStage: LoadStage;
  transfer: number | null;
  catalogLoading: boolean;
  dialRequest: DialPreferences | null;
  dialError: string;
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
  inspectionFrame?: (now: number, rendered: boolean) => void;
  benchmark: Benchmark | null = null;
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(33, 1, 0.05, 2000);
  controls: OrbitControls;
  root = new THREE.Group();
  environment: THREE.WebGLRenderTarget;
  sourceSurfaces?: SourceSurfaces;
  sourceSurfaceError = '';
  diamondRecoveryError = '';
  surfaceOcclusion?: SurfaceOcclusion;
  beautyTriangles?: number;
  beautyDrawCalls?: number;
  observer: ResizeObserver;
  frame = 0;
  dead = false;
  ready = false;
  loadStage: LoadStage = 'movement';
  transfer: number | null = null;
  awaitingFirstFrame = false;
  contentPrepared = false;
  reloadState: ExperienceState | null = null;
  status = '';
  error = '';
  detailError = '';
  state = { ...initialState };
  displayedExplosionState?: ExperienceState;
  explosionTravel?: {
    from: ExperienceState;
    to: ExperienceState;
    elapsed: number;
    duration: number;
  };
  manifest: Manifest | null = null;
  parts: Part[] = [];
  renderParts = new Map<string, RenderPart>();
  history: Saved[] = [];
  restoringCamera: Saved | null = null;
  spread = new Map<string, SpreadPlacement>();
  spreadFocus: string | null = null;
  inventoryAngle = 0;
  inventoryTravel?: { from: number; to: number; elapsed: number };
  inventoryApplied = false;
  inventoryEntering = false;
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  travel: {
    position: THREE.Vector3;
    target: THREE.Vector3;
    up?: THREE.Vector3;
    fromUp?: THREE.Vector3;
    fromPosition?: THREE.Vector3;
    fromTarget?: THREE.Vector3;
    elapsed?: number;
    duration?: number;
  } | null = null;
  poseDuration = 0.85;
  needsRender = true;
  lastFrame = 0;
  lastNotify = 0;
  frameIntervals: number[] = [];
  renderCount = 0;
  qualityChanged = 0;
  loadStart = performance.now();
  loadMs = 0;
  presentationMoving = true;
  cameraGeneration = 0;
  cameraUserOwned = false;
  dialRequest: ViewerSnapshot['dialRequest'] = null;
  dialError = '';
  dialGeneration = 0;
  fitted = new Set<string>();
  catalogLoaded = false;
  catalogPending: Promise<void> | null = null;
  loadGeneration = 0;
  selectionGeneration = 0;
  catalogRetry?: { id: string; request: number };
  contextLosses = 0;
  contextLost = false;
  selectionBox = new THREE.Box3Helper(new THREE.Box3(), 0xffdaa0);
  raycaster = new THREE.Raycaster();
  pointer = { x: 0, y: 0, id: -1, cancelled: false };
  pointers = new Set<number>();
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
      'Movement; drag to orbit, pinch to zoom. Arrow keys move the view, plus and minus zoom, Home resets, Escape deselects.',
    );
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.addEventListener('keydown', this.keyDown);
    this.camera.up.set(0, -1, 0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 200;
    this.controls.addEventListener('start', this.manual);
    this.controls.addEventListener('change', this.invalidate);
    const pmrem = new THREE.PMREMGenerator(this.renderer),
      room = new StudioEnvironment();
    this.environment = pmrem.fromScene(room, 0.015);
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
    this.renderer.domElement.addEventListener('pointermove', this.pointerMove);
    this.renderer.domElement.addEventListener('wheel', this.pointerWheel, {
      passive: true,
    });
    this.renderer.domElement.addEventListener(
      'pointercancel',
      this.pointerCancel,
    );
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
      loadStage: this.loadStage,
      transfer: this.transfer,
      catalogLoading: !!this.catalogPending,
      dialRequest: this.dialRequest,
      dialError: this.dialError,
      spreadFocus: this.spreadFocus,
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
      contactShading: this.state.quality !== 'low',
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      renderCount: this.renderCount,
      samples: a.length,
      p95FrameMs: a.length ? a[Math.floor((a.length - 1) * 0.95)] : null,
      pixelRatio: this.renderer.getPixelRatio(),
      loadMs: this.loadMs,
      contextLosses: this.contextLosses,
      sourceSurfaceDefinitions: this.sourceSurfaces?.size ?? 0,
      sourceSurfaceError: this.sourceSurfaceError,
      diamondRecoveryError: this.diamondRecoveryError,
      recoveredDiamond: [...this.renderParts.values()].some(
        (p) => p.mesh.userData.sourceRecovery === 'maker-component-stl',
      ),
      camera: this.camera.position.toArray(),
      cameraUp: this.camera.up.toArray(),
      target: this.controls.target.toArray(),
      maxAssemblyError: this.assemblyError(),
      maxDisplayPoseError: this.assemblyError('presentation'),
      handTime: this.state.presentation === 'dials' ? HAND_TIME : null,
      spreadMembers: this.spread?.size ?? 0,
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
  auditSpread() {
    this.scene.updateMatrixWorld(true);
    this.camera.updateMatrixWorld(true);
    const projected: { id: string; box: THREE.Box3 }[] = [];
    let maxScaleError = 0;
    for (const p of this.renderParts.values())
      if (this.spread.has(p.source.id)) {
        const box = new THREE.Box3().setFromObject(p.mesh);
        const points = [];
        for (let i = 0; i < 8; i++)
          points.push(
            new THREE.Vector3(
              i & 1 ? box.max.x : box.min.x,
              i & 2 ? box.max.y : box.min.y,
              i & 4 ? box.max.z : box.min.z,
            ).project(this.camera),
          );
        projected.push({
          id: p.source.id,
          box: new THREE.Box3().setFromPoints(points),
        });
        maxScaleError = Math.max(
          maxScaleError,
          Math.abs(p.mesh.matrix.determinant() - p.assembled.determinant()),
        );
      }
    // Rotated world AABBs can overlap in projection even when the actual mesh
    // silhouettes are disjoint. Refine only broad-phase candidates with source
    // vertices; this is an opt-in QA audit, never part of the render loop.
    const refined = new Set<string>();
    const precise = (entry: { id: string; box: THREE.Box3 }) => {
      if (refined.has(entry.id)) return entry.box;
      const p = this.renderParts.get(entry.id)!;
      const positions = p.mesh.geometry.getAttribute('position');
      entry.box.makeEmpty();
      const point = new THREE.Vector3();
      for (let i = 0; i < positions.count; i++)
        entry.box.expandByPoint(
          point
            .fromBufferAttribute(positions, i)
            .applyMatrix4(p.mesh.matrixWorld)
            .project(this.camera),
        );
      refined.add(entry.id);
      return entry.box;
    };
    const intersects = (a: THREE.Box3, b: THREE.Box3) =>
      a.max.x > b.min.x &&
      b.max.x > a.min.x &&
      a.max.y > b.min.y &&
      b.max.y > a.min.y;
    const outside = (b: THREE.Box3) =>
      b.min.x < -1 || b.max.x > 1 || b.min.y < -1 || b.max.y > 1;
    const overlaps: string[][] = [];
    for (let i = 0; i < projected.length; i++)
      for (let j = i + 1; j < projected.length; j++)
        if (
          intersects(projected[i].box, projected[j].box) &&
          intersects(precise(projected[i]), precise(projected[j]))
        )
          overlaps.push([projected[i].id, projected[j].id]);
    return {
      members: projected.length,
      visible: [...this.renderParts.values()].filter((p) => p.mesh.visible)
        .length,
      maxScaleError,
      overlaps,
      clipped: projected
        .filter((p) => outside(p.box) && outside(precise(p)))
        .map((p) => p.id),
    };
  }
  assemblyError(reference: 'source' | 'presentation' = 'source') {
    if (
      this.state.layout === 'spread' ||
      this.state.reveal ||
      this.state.separation ||
      this.state.partSpread
    )
      return null;
    let error = 0;
    for (const p of this.renderParts.values()) {
      const expected =
        reference === 'presentation'
          ? (p.displayMatrix ?? p.assembled)
          : p.assembled;
      for (let i = 0; i < 16; i++)
        error = Math.max(
          error,
          Math.abs(p.mesh.matrix.elements[i] - expected.elements[i]),
        );
    }
    return error;
  }
  invalidate = () => {
    this.needsRender = true;
  };
  manual = () => {
    this.cameraGeneration = (this.cameraGeneration ?? 0) + 1;
    this.selectionGeneration++;
    this.restoringCamera = null;
    this.cameraUserOwned = true;
    this.travel = null;
    this.needsRender = true;
  };
  onVisibility = () => {
    this.lastFrame = 0;
    this.invalidate();
  };
  onContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    this.contextLosses++;
    this.ready = false;
    this.loadStage = 'recovering';
    this.controls.enabled = false;
    this.error = '';
    this.emit();
  };
  onContextRestored = () => {
    this.environment.dispose();
    const pmrem = new THREE.PMREMGenerator(this.renderer),
      room = new StudioEnvironment();
    this.environment = pmrem.fromScene(room, 0.015);
    this.scene.environment = this.environment.texture;
    room.dispose();
    pmrem.dispose();
    this.contextLost = false;
    this.error = '';
    this.awaitingFirstFrame = this.contentPrepared;
    if (!this.contentPrepared) this.loadStage = 'preparing';
    this.needsRender = true;
    this.emit();
  };
  async load() {
    if (this.contentPrepared) this.reloadState = { ...this.state };
    this.cancelDialRequest();
    let preparedScene: THREE.Object3D | undefined,
      recoveredScene: THREE.Object3D | undefined;
    const generation = ++this.loadGeneration;
    this.selectionGeneration++;
    this.ready = false;
    this.awaitingFirstFrame = false;
    this.contentPrepared = false;
    this.loadStart = performance.now();
    this.loadStage = 'movement';
    this.transfer = null;
    if (this.controls) this.controls.enabled = false;
    this.error = '';
    this.status = '';
    this.emit();
    try {
      const response = await fetch('/models/assembly-manifest.json');
      if (!response.ok) throw new Error('Manifest unavailable');
      const manifest = (await response.json()) as Manifest;
      if (this.dead || generation !== this.loadGeneration) return;
      const paths = await fetch('/models/asset-paths.json')
        .then((r) =>
          r.ok
            ? (r.json() as Promise<{ overview: string; catalog: string }>)
            : null,
        )
        .catch(() => null);
      if (this.dead || generation !== this.loadGeneration) return;
      this.manifest = manifest;
      this.parts = manifest.instances;
      this.sourceSurfaceError = '';
      if (
        paths &&
        typeof paths.overview === 'string' &&
        typeof paths.catalog === 'string'
      )
        this.paths = { overview: paths.overview, catalog: paths.catalog };
      const surfaces = (
        new URLSearchParams(location.search).get('sourcefinish') === '0'
          ? Promise.resolve(undefined)
          : loadSourceSurfaces(this.paths.overview)
      ).catch((error: Error) => {
        if (!this.dead && generation === this.loadGeneration)
          this.sourceSurfaceError = error.message;
        return { error };
      });
      const gltf = await new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .loadAsync(assetRequestUrl(this.paths.overview), (p) => {
          if (!this.dead && generation === this.loadGeneration) {
            this.transfer = transferProgress(p.loaded, p.total);
            if (this.transfer === 100) {
              this.loadStage = 'preparing';
              this.transfer = null;
            }
            this.emit();
          }
        });
      preparedScene = gltf.scene;
      if (!this.dead && generation === this.loadGeneration) {
        this.loadStage = 'preparing';
        this.transfer = null;
        this.emit();
      }
      const sourceSurfaces = await surfaces;
      if (this.dead || generation !== this.loadGeneration) {
        return;
      }
      if (sourceSurfaces && 'error' in sourceSurfaces)
        throw sourceSurfaces.error;
      this.sourceSurfaces = sourceSurfaces;
      this.diamondRecoveryError = '';
      try {
        recoveredScene = await loadRecoveredDiamond(this.parts);
        if (this.dead || generation !== this.loadGeneration) {
          return;
        }
      } catch (error) {
        if (!this.dead && generation === this.loadGeneration)
          this.diamondRecoveryError = String(error);
        throw error;
      }
      if (this.dead || generation !== this.loadGeneration) return;
      this.ingest(preparedScene);
      preparedScene = undefined;
      this.ingest(recoveredScene);
      recoveredScene = undefined;
      this.rebuildSpread();
      this.contentPrepared = true;
      this.awaitingFirstFrame = true;
      this.state = resolveState(this.reloadState ?? initialState, {
        phase: 'whole',
      });
      this.status = '';
      if (!this.reloadState) this.homeCamera(true);
      this.reloadState = null;
      this.retarget();
      this.emit();
    } catch (error) {
      if (this.dead || generation !== this.loadGeneration) return;
      this.error =
        'The movement could not load. Retry, or explore the section descriptions.';
      this.loadStage = 'error';
      this.transfer = null;
      this.status = '';
      this.emit();
      console.error('Movement load', error);
    } finally {
      if (preparedScene) this.disposeObject(preparedScene);
      if (recoveredScene) this.disposeObject(recoveredScene);
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
      try {
        attachSourceSurface(
          node.geometry,
          this.sourceSurfaces?.get(record.definitionId),
        );
      } catch (error) {
        this.sourceSurfaceError = `${record.definitionId}: ${String(error)}`;
        throw error;
      }
      const material = createMaterial(
        record.name,
        record.definitionId,
        node.geometry,
        record.id,
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
      const recoveredBounds = node.userData.sourceRecovery
        ? new THREE.Box3()
            .setFromBufferAttribute(
              node.geometry.getAttribute('position') as THREE.BufferAttribute,
            )
            .applyMatrix4(assembled)
        : null;
      const center = recoveredBounds
        ? recoveredBounds.getCenter(new THREE.Vector3())
        : b
          ? new THREE.Vector3()
              .fromArray(b[0])
              .add(new THREE.Vector3().fromArray(b[1]))
              .multiplyScalar(0.5)
          : new THREE.Vector3().setFromMatrixPosition(assembled);
      accepted.push({
        source: record,
        mesh: node,
        assembled,
        rotation: new THREE.Quaternion(),
        targetRotation: new THREE.Quaternion(),
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
    const forDials = !!this.dialRequest;
    const selectionRequest = this.selectionGeneration;
    this.detailError = '';
    this.status = this.dialRequest ? '' : 'Loading source catalog…';
    this.emit();
    this.catalogPending = (async () => {
      try {
        const gltf = await new GLTFLoader()
          .setMeshoptDecoder(MeshoptDecoder)
          .loadAsync(assetRequestUrl(this.paths.catalog));
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
        if (
          !this.dead &&
          !forDials &&
          selectionRequest === this.selectionGeneration
        )
          this.detailError =
            'Catalog geometry could not load. The movement is still available.';
        this.emit();
        throw e;
      } finally {
        this.catalogPending = null;
        this.emit();
      }
    })();
    this.emit();
    return this.catalogPending;
  }
  cancelDialRequest() {
    this.dialGeneration = (this.dialGeneration ?? 0) + 1;
    this.dialRequest = null;
    this.dialError = '';
  }
  chooseDial(face: DialFace, visible: boolean, style?: string) {
    return this.configureDials(
      {
        [face === 'central' ? 'centralVisible' : 'smallVisible']: visible,
        ...(style
          ? { [face === 'central' ? 'centralStyle' : 'smallStyle']: style }
          : {}),
      },
      visible ? face : undefined,
    );
  }
  async configureDials(patch: Partial<DialPreferences> = {}, focus?: DialFace) {
    if (!this.ready) return;
    const focusAssembly = !!focus && this.state.layout === 'assembly';
    const next = resolveState(this.state, {
      ...patch,
      ...(focus ? { part: null, isolated: false, phase: 'recovering' } : {}),
      ...(focusAssembly
        ? {
            side: focus === 'central' ? 'front' : 'back',
            viewAngle: 'face',
            // An unrelated section can suppress a requested display. Return to the
            // whole view so choosing the dial always makes its face available.
            ...(this.state.group && this.state.group !== 'display'
              ? { group: null, partSpread: 0, reveal: 0 }
              : {}),
          }
        : {}),
    });
    const changed = [
      'centralVisible',
      'smallVisible',
      'centralStyle',
      'smallStyle',
      'side',
      'viewAngle',
      'group',
      'part',
      'isolated',
    ].some(
      (key) =>
        next[key as keyof ExperienceState] !==
        this.state[key as keyof ExperienceState],
    );
    if (changed) this.save();
    // A selected outgoing blade/dial must not override its visibility toggle.
    if (
      next.part &&
      this.fitted.has(next.part) &&
      !fittedLeaves(next).has(next.part)
    ) {
      next.part = null;
      next.isolated = false;
      next.phase = next.group ? 'mechanism' : 'whole';
    }
    this.cancelDialRequest();
    const request = this.dialGeneration;
    // Preferences commit immediately. A late load only supplies geometry; it
    // never restores an obsolete side, selection, layout or visibility choice.
    this.state = next;
    this.retarget();
    if (focus) this.selectionGeneration++;
    if (focusAssembly) {
      this.restoringCamera = null;
      this.cameraUserOwned = false;
      this.fitPresentation();
    }
    const leaves = fittedLeaves(next);
    if (!leaves.size) {
      this.emit();
      return;
    }
    this.dialRequest = {
      centralVisible: next.centralVisible,
      smallVisible: next.smallVisible,
      centralStyle: next.centralStyle,
      smallStyle: next.smallStyle,
    };
    this.emit();
    try {
      await this.loadCatalog();
      if (this.dead || request !== this.dialGeneration) return;
      if ([...fittedLeaves(this.state)].some((id) => !this.renderParts.has(id)))
        throw new Error('Incomplete display geometry');
      this.dialRequest = null;
      this.retarget();
      if (this.state.layout === 'spread' && !this.cameraUserOwned)
        this.frameSpread(this.spreadFocus ?? undefined);
      else if (
        (this.state.separation || this.state.partSpread || this.state.group) &&
        !this.cameraUserOwned &&
        !this.restoringCamera
      )
        this.fitPresentation();
      this.emit();
    } catch {
      if (!this.dead && request === this.dialGeneration) {
        this.dialError = 'Dials could not load. Try again.';
        this.emit();
      }
    }
  }
  // Explicit single-face camera preset retained for inspection tooling.
  // Visitor controls use chooseDial to reveal a face without hiding its partner.
  async showDial(view: DialView, face?: DialFace, style?: string) {
    const generation = this.cameraGeneration;
    const pending = this.configureDials({
      centralVisible: view === 'central',
      smallVisible: view === 'small',
      ...(face && style
        ? { [face === 'central' ? 'centralStyle' : 'smallStyle']: style }
        : {}),
    });
    const request = this.dialGeneration;
    await pending;
    if (
      this.dead ||
      this.dialError ||
      request !== this.dialGeneration ||
      generation !== this.cameraGeneration
    )
      return;
    this.state.viewAngle = view === 'movement' ? 'overview' : 'face';
    this.setSide(view === 'central' ? 'front' : 'back');
    this.fitPresentation();
  }
  async retryDials() {
    if (this.dialError) this.catalogLoaded = false;
    await this.configureDials();
  }
  frameDials() {
    this.homeCamera();
    if (this.travel) this.travel.duration = 1.05;
  }
  patch(patch: Partial<ExperienceState>) {
    this.selectionGeneration++;
    this.state = resolveState(this.state, {
      ...patch,
      ...((patch.separation ?? 0) > 0 || (patch.partSpread ?? 0) > 0
        ? { viewAngle: 'overview' }
        : {}),
    });
    this.retarget();
    if (
      this.ready &&
      this.state.layout === 'assembly' &&
      ('separation' in patch || 'partSpread' in patch)
    )
      this.fitPresentation();
    this.emit();
  }
  scrub(patch: Partial<ExperienceState>) {
    this.poseDuration = 0.075;
    this.patch(patch);
    this.poseDuration = 0.85;
  }
  targetBounds(include: (p: RenderPart) => boolean) {
    const bounds = new THREE.Box3();
    for (const p of this.renderParts.values())
      if (include(p)) {
        const matrix = new THREE.Matrix4()
          .makeTranslation(
            p.center.x + p.target.x,
            p.center.y + p.target.y,
            p.center.z + p.target.z,
          )
          .multiply(
            new THREE.Matrix4().makeRotationFromQuaternion(p.targetRotation),
          )
          .multiply(
            new THREE.Matrix4().makeTranslation(
              -p.center.x,
              -p.center.y,
              -p.center.z,
            ),
          )
          .multiply(p.displayMatrix ?? p.assembled);
        p.mesh.geometry.computeBoundingBox();
        bounds.union(p.mesh.geometry.boundingBox!.clone().applyMatrix4(matrix));
      }
    return bounds;
  }
  fitPresentation() {
    if (this.cameraUserOwned) return;
    if (
      !this.state.group &&
      !this.state.part &&
      !this.state.separation &&
      !this.state.partSpread
    ) {
      this.homeCamera();
      return;
    }
    const group = GROUPS.find((g) => g.id === this.state.group);
    const include = (p: RenderPart) =>
      this.state.part
        ? belongs(p.source.id, this.state.part)
        : group
          ? inMembers(
              this.fitted.has(p.source.id)
                ? displayHostPart(p.source.id)
                : p.source.id,
              group.members,
            )
          : (belongs(p.source.id, ROOT) && p.source.id !== PREFIX + '66') ||
            this.fitted.has(p.source.id);
    const points = this.targetPoints(include);
    const bounds = new THREE.Box3().setFromPoints(points);
    if (bounds.isEmpty()) return;
    const progress = this.state.separation;
    const eased = progress * progress * (3 - 2 * progress);
    const direction =
      this.state.viewAngle === 'face'
        ? new THREE.Vector3(0, 0, this.state.side === 'front' ? 1 : -1)
        : this.state.group || this.state.part
          ? new THREE.Vector3(
              0.62,
              0.38,
              this.state.side === 'front' ? 1 : -1,
            ).normalize()
          : this.assemblyDirection()
              .lerp(
                new THREE.Vector3(
                  1.05,
                  0.38,
                  this.state.side === 'front' ? 1 : -1,
                ).normalize(),
                eased,
              )
              .normalize();
    if (!group && !this.state.part) {
      const envelope = this.assemblyBounds();
      bounds.union(envelope);
      points.push(...this.boundsCorners(envelope));
      this.centerOnMovementAxis(bounds);
    }
    this.frameBounds(bounds, direction, points);
  }
  targetPoints(include: (p: RenderPart) => boolean) {
    const points: THREE.Vector3[] = [];
    for (const p of this.renderParts.values()) {
      if (!include(p)) continue;
      p.mesh.geometry.computeBoundingBox();
      const b = p.mesh.geometry.boundingBox!;
      const matrix = p.displayMatrix ?? p.assembled;
      for (let i = 0; i < 8; i++)
        points.push(
          new THREE.Vector3(
            i & 1 ? b.max.x : b.min.x,
            i & 2 ? b.max.y : b.min.y,
            i & 4 ? b.max.z : b.min.z,
          )
            .applyMatrix4(matrix)
            .add(p.target),
        );
    }
    return points;
  }
  frameBounds(
    bounds: THREE.Box3,
    direction: THREE.Vector3,
    points?: THREE.Vector3[],
    immediate = false,
  ) {
    const center = bounds.getCenter(new THREE.Vector3());
    const right = new THREE.Vector3()
      .crossVectors(this.defaultUp(), direction)
      .normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    const tangent = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    let distance = 8;
    const corners = points ?? this.boundsCorners(bounds);
    for (const corner of corners) {
      const point = corner.clone().sub(center);
      distance = Math.max(
        distance,
        point.dot(direction) +
          1.18 *
            Math.max(
              Math.abs(point.dot(right)) / (tangent * this.camera.aspect),
              Math.abs(point.dot(up)) / tangent,
            ),
      );
    }
    this.frameTo(
      center,
      distance * Math.min(1, this.camera.aspect),
      direction,
      immediate,
    );
  }
  save() {
    this.history.push({
      state: { ...this.state },
      up: this.camera.up.clone(),
      aspect: this.camera.aspect,
      cameraUserOwned: this.cameraUserOwned,
      spreadFocus: this.spreadFocus,
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
    this.cameraUserOwned = false;
    this.restoringCamera = null;
    const group = GROUPS.find((g) => g.id === id);
    this.patch({
      layout: 'assembly',
      group: id,
      part: null,
      isolated: false,
      phase: id ? 'revealing' : 'recovering',
      viewAngle: 'overview',
      reveal: id ? 1 : 0,
      separation: 0,
      partSpread: 0,
      side:
        !group && this.state.layout === 'spread'
          ? this.state.side
          : group?.side === 1
            ? 'front'
            : 'back',
    });
    if (group) this.frameGroup(group);
    else this.homeCamera();
  }
  back() {
    this.cancelDialRequest();
    this.selectionGeneration++;
    const previous = this.history.pop();
    if (!previous) {
      this.reset();
      return;
    }
    this.restoringCamera = previous;
    this.cameraUserOwned = previous.cameraUserOwned ?? true;
    this.spreadFocus = previous.spreadFocus ?? null;
    this.state = resolveState(previous.state, {
      phase: 'recovering',
    });
    this.travel = {
      position: previous.position,
      target: previous.target,
      up: previous.up,
    };
    this.ensureFramingRange();
    this.retarget();
    this.emit();
    // History restores intent, including a display whose earlier load failed.
    // Reuse an in-flight catalog request and keep its error/retry observable.
    if ([...fittedLeaves(this.state)].some((id) => !this.renderParts.has(id)))
      void this.configureDials();
  }
  reset() {
    this.cancelDialRequest();
    this.selectionGeneration++;
    this.restoringCamera = null;
    this.cameraUserOwned = false;
    this.history = [];
    this.spreadFocus = null;
    this.state = resetViewState(this.state);
    this.detailError = '';
    this.homeCamera();
    this.retarget();
    this.emit();
    // Retained preferences may still need the shared catalog request. Invalidate
    // old navigation intent, then reconcile loading against the reset view.
    if ([...fittedLeaves(this.state)].some((id) => !this.renderParts.has(id)))
      void this.configureDials();
  }
  homeCamera(immediate = false) {
    this.frameBounds(
      this.assemblyBounds(),
      this.assemblyDirection(),
      undefined,
      immediate,
    );
  }
  assemblyDirection() {
    return new THREE.Vector3(0, 0, this.state.side === 'front' ? 1 : -1);
  }
  defaultUp() {
    return new THREE.Vector3(
      0,
      this.state.layout === 'spread'
        ? -1
        : this.state.side === 'front'
          ? 1
          : -1,
      0,
    );
  }
  boundsCorners(bounds: THREE.Box3) {
    return Array.from(
      { length: 8 },
      (_, i) =>
        new THREE.Vector3(
          i & 1 ? bounds.max.x : bounds.min.x,
          i & 2 ? bounds.max.y : bounds.min.y,
          i & 4 ? bounds.max.z : bounds.min.z,
        ),
    );
  }
  assemblyBounds() {
    // One immutable envelope for bare movement and either display, available
    // before optional meshes load. Fitted hand tips stay inside the dial rings.
    const structures = new Set(
      Object.values(DIALS.faces).flatMap((face) => face.structureLeafIds),
    );
    const bounds = new THREE.Box3();
    for (const p of this.parts) {
      if (p.isAssembly || !p.boundsWorldMm || p.id === PREFIX + '66') continue;
      if (!belongs(p.id, ROOT) && !structures.has(p.id)) continue;
      bounds.expandByPoint(new THREE.Vector3(...p.boundsWorldMm[0]));
      bounds.expandByPoint(new THREE.Vector3(...p.boundsWorldMm[1]));
    }
    return this.centerOnMovementAxis(bounds.expandByScalar(0.75));
  }
  centerOnMovementAxis(bounds: THREE.Box3) {
    // The stem affects the required space, never the orbit anchor. Keep the
    // envelope symmetric about the authored central hand arbor in the XY plane.
    const [x, y] = DIALS.faces.central.axleWorldXYMm;
    const radiusX = Math.max(
      Math.abs(bounds.min.x - x),
      Math.abs(bounds.max.x - x),
    );
    const radiusY = Math.max(
      Math.abs(bounds.min.y - y),
      Math.abs(bounds.max.y - y),
    );
    bounds.min.x = x - radiusX;
    bounds.max.x = x + radiusX;
    bounds.min.y = y - radiusY;
    bounds.max.y = y + radiusY;
    return bounds;
  }
  syncOrbitUp() {
    // Three r186 caches its orbit basis at construction. Keep that basis aligned
    // with the camera's continuous turnover, without recreating its event handlers.
    const controls = this.controls as OrbitControls & {
      _quat?: THREE.Quaternion;
      _quatInverse?: THREE.Quaternion;
    };
    if (controls._quat && controls._quatInverse) {
      controls._quat.setFromUnitVectors(
        this.camera.up,
        new THREE.Vector3(0, 1, 0),
      );
      controls._quatInverse.copy(controls._quat).invert();
    }
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
    const up = this.defaultUp();
    if (immediate || this.reduced) {
      this.camera.up.copy(up);
      this.syncOrbitUp();
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      this.travel = null;
    } else this.travel = { position, target, up, duration: this.poseDuration };
    this.needsRender = true;
  }
  frameGroup(g: Mechanism) {
    const bounds = this.targetBounds(
      (p) =>
        inMembers(
          this.fitted.has(p.source.id)
            ? displayHostPart(p.source.id)
            : p.source.id,
          g.members,
        ) &&
        !g.partObstructions?.some((suffix) =>
          belongs(p.source.id, PREFIX + suffix),
        ),
    );
    if (bounds.isEmpty()) return;
    // Fit the mechanism with room for its local connections, not the whole
    // plate. Whole-movement framing made small mechanisms impossible to read.
    bounds.expandByScalar(2.5);
    this.frameBounds(bounds, new THREE.Vector3(0.22, 0.24, g.side).normalize());
  }
  renderableDials() {
    const preferences = this.state ?? initialState;
    const result = fittedLeaves(preferences);
    for (const face of ['central', 'small'] as const) {
      const packet = [...result].filter((id) =>
        belongs(id, DIALS.faces[face].rootId),
      );
      if (packet.some((id) => !this.renderParts.has(id)))
        for (const id of packet) result.delete(id);
    }
    return result;
  }
  rebuildSpread() {
    const fitted = this.renderableDials();
    this.spread = makeSpread(
      [...this.renderParts.values()].map((p) => ({
        ...p,
        assembled: fitted.has(p.source.id)
          ? (handDisplayMatrix(p.source.id, p.assembled) ?? p.assembled)
          : p.assembled,
      })),
      this.camera.aspect,
      fitted,
    );
  }
  allParts() {
    if (!this.ready) return;
    this.save();
    this.restoringCamera = null;
    this.cameraUserOwned = false;
    this.rebuildSpread();
    this.patch({
      layout: 'spread',
      group: null,
      part: null,
      isolated: false,
      phase: 'recovering',
      inventoryBack: false,
    });
    this.frameSpread();
  }
  frameSpread(group?: string) {
    this.spreadFocus = group ?? null;
    if (!this.spread.size) return;
    const bounds = new THREE.Box3();
    for (const p of this.spread.values())
      if (!group || p.group === group) bounds.union(p.sweptBounds ?? p.bounds);
    const size = bounds.getSize(new THREE.Vector3());
    const distance =
      (Math.max(size.y, size.x / this.camera.aspect) /
        (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)))) *
        1.14 +
      size.z;
    this.frameTo(
      bounds.getCenter(new THREE.Vector3()),
      distance * Math.min(1, this.camera.aspect),
      new THREE.Vector3(0, 0, -1),
    );
  }
  pan(dx: number, dy: number) {
    this.manual();
    this.travel = null;
    const distance = this.camera.position.distanceTo(this.controls.target);
    const right = new THREE.Vector3().setFromMatrixColumn(
      this.camera.matrix,
      0,
    );
    const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
    const delta = right
      .multiplyScalar(dx * distance * 0.3)
      .add(up.multiplyScalar(-dy * distance * 0.3));
    this.camera.position.add(delta);
    this.controls.target.add(delta);
    this.controls.update();
    this.invalidate();
  }
  flipMovement() {
    if (!this.ready) return;
    if (this.state.layout !== 'spread') {
      this.setSide(this.state.side === 'back' ? 'front' : 'back');
      return;
    }
    this.save();
    // Finish entry framing before a queued turn starts. Otherwise freeze an
    // inspection close-up at its displayed pose; the turn never orbits or refits.
    if (!this.inventoryEntering) this.travel = null;
    this.restoringCamera = null;
    this.state = resolveState(this.state, {
      inventoryBack: !this.state.inventoryBack,
    });
    this.inventoryTravel = {
      from: this.inventoryAngle,
      to: this.state.inventoryBack ? Math.PI : 0,
      elapsed: 0,
    };
    this.invalidate();
    this.emit();
  }
  setSide(side: 'back' | 'front') {
    if (this.state.layout === 'spread' || this.state.side === side) return;
    this.save();
    this.cameraUserOwned = false;
    this.restoringCamera = null;
    this.patch({ side });
    this.fitPresentation();
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
    this.state.viewAngle = 'face';
    this.setSide(kind);
    this.fitPresentation();
  }
  zoom(factor: number) {
    this.manual();
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
    this.manual();
    if (this.state.layout === 'spread') {
      this.pan(dx, dy);
      return;
    }
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
    if (!this.ready) return;
    const part = this.parts.find((p) => p.id === id);
    if (!part) return;
    const request = ++this.selectionGeneration;
    this.catalogRetry = undefined;
    // Keep the displayed inspection intact until optional geometry is available.
    if (!belongs(id, ROOT) && !this.catalogLoaded) {
      try {
        await this.loadCatalog();
      } catch {
        if (!this.dead && request === this.selectionGeneration) {
          this.catalogRetry = { id, request };
          this.detailError =
            'Catalog geometry could not load. The movement is still available.';
          this.emit();
        }
        return;
      }
      if (this.dead || request !== this.selectionGeneration || !this.ready)
        return;
    }
    const prior = this.state.part;
    if (prior !== id) this.save();
    if (this.state.layout === 'spread' && !this.spread.has(part.id))
      this.patch({ layout: 'assembly', group: null, reveal: 0 });
    this.patch({
      part: id,
      isolated: false,
      phase: 'part',
    });
    const bounds = this.targetBounds((p) => belongs(p.source.id, id));
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
  deselect() {
    // Invalidate pending optional selections even when no part is displayed yet.
    this.selectionGeneration++;
    this.catalogRetry = undefined;
    const hadError = !!this.detailError || !!this.status;
    if (!this.dialRequest) this.status = '';
    this.detailError = '';
    if (!this.state.part) {
      if (hadError) this.emit();
      return;
    }
    // Freeze the displayed camera, including an interrupted selection close-up.
    // This is not navigation: retain history, mode, reveal and inventory focus.
    this.travel = null;
    this.restoringCamera = null;
    this.state = resolveState(this.state, {
      part: null,
      isolated: false,
      phase: this.state.group ? 'mechanism' : 'whole',
    });
    this.retarget();
    this.emit();
  }
  async retryCatalog() {
    const retry = this.catalogRetry;
    await this.loadCatalog();
    if (retry && retry.request === this.selectionGeneration && this.ready)
      await this.select(retry.id);
  }
  retarget() {
    // Fold the actually displayed inventory turn into each departing pose before
    // starting the ordinary assembly transition; interruption cannot snap back.
    if (this.inventoryApplied && this.state.layout !== 'spread') {
      for (const p of this.renderParts.values()) {
        if (!this.spread.has(p.source.id)) continue;
        const delta = p.mesh.matrix
          .clone()
          .multiply((p.displayMatrix ?? p.assembled).clone().invert());
        p.rotation.setFromRotationMatrix(delta);
        p.offset.copy(p.center).applyMatrix4(delta).sub(p.center);
        p.targetRotation.copy(p.rotation);
        p.target.copy(p.offset);
      }
    }
    // Navigation can happen before the first inventory frame. Clear its pending
    // turn even when there is no displayed inventory matrix to fold yet.
    if (this.state.layout !== 'spread') {
      this.inventoryAngle = 0;
      this.inventoryTravel = undefined;
      this.inventoryApplied = false;
      this.inventoryEntering = false;
    }
    if (this.state.layout === 'spread') {
      if (!this.inventoryApplied) this.inventoryEntering = true;
      const to = this.state.inventoryBack ? Math.PI : 0;
      if ((this.inventoryTravel?.to ?? this.inventoryAngle ?? 0) !== to)
        this.inventoryTravel = {
          from: this.inventoryAngle ?? 0,
          to,
          elapsed: 0,
        };
    }
    const previousFitted = this.fitted;
    this.fitted = this.renderableDials();
    if (this.state.layout === 'spread') this.rebuildSpread();
    if (this.controls) {
      const spread = this.state.layout === 'spread';
      this.renderer?.domElement?.setAttribute(
        'aria-label',
        spread
          ? 'Parts spread; drag to pan, pinch to zoom. Arrow keys pan, plus and minus zoom, Home resets, Escape deselects.'
          : 'Movement; drag to orbit, pinch to zoom. Arrow keys orbit, plus and minus zoom, Home resets, Escape deselects.',
      );
      this.controls.enableRotate = !spread;
      this.controls.enablePan = spread;
      this.controls.screenSpacePanning = true;
      this.controls.mouseButtons.LEFT = spread
        ? THREE.MOUSE.PAN
        : THREE.MOUSE.ROTATE;
      this.controls.touches.ONE = spread ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
      this.controls.touches.TWO = spread
        ? THREE.TOUCH.DOLLY_PAN
        : THREE.TOUCH.DOLLY_ROTATE;
    }
    const group = GROUPS.find((g) => g.id === this.state.group),
      selection = this.state.part;
    const previous = this.displayedExplosionState;
    const changed =
      previous &&
      ['separation', 'partSpread', 'reveal'].some(
        (key) =>
          previous[key as keyof ExperienceState] !==
          this.state[key as keyof ExperienceState],
      );
    if (
      changed &&
      previous.layout === 'assembly' &&
      this.state.layout === 'assembly' &&
      previous.group === this.state.group &&
      (this.explosionTravel ||
        ![...this.renderParts.values()].some((p) => p.motion))
    ) {
      this.explosionTravel = {
        from: { ...previous },
        to: { ...this.state },
        elapsed: 0,
        duration: this.poseDuration ?? 0.85,
      };
    } else if (
      previous?.group !== this.state.group ||
      previous?.layout !== this.state.layout
    ) {
      this.explosionTravel = undefined;
    }
    const explosion = explosionOffsets(this.parts, this.state);
    for (const p of this.renderParts.values()) {
      const previousTarget = p.target.clone(),
        previousRotation = p.targetRotation.clone();
      const id = p.source.id;
      p.displayMatrix =
        this.fitted.has(id) &&
        !(selection && !belongs(selection, ROOT) && !this.fitted.has(selection))
          ? handDisplayMatrix(id, p.assembled)
          : undefined;
      p.targetRotation.identity();
      p.target.fromArray(explosion.get(id) ?? [0, 0, 0]);
      if (this.state.layout === 'spread') {
        const placement = this.spread.get(id);
        if (placement) {
          p.target.copy(placement.offset);
          p.targetRotation.copy(placement.rotation);
        }
      }
      p.mesh.visible = this.partVisible(p);
      const finish = finishFor(
        p.source.name,
        p.source.definitionId,
        p.source.id,
      );
      p.material.color.setHex(finish.color);
      p.material.metalness = finish.metalness;
      p.material.roughness = finish.roughness;
      p.material.emissive.setHex(0);
      if (
        DIALS.presentationOverrides.some((override) => override.leafId === id)
      ) {
        const enamel = p.material as THREE.MeshPhysicalMaterial;
        const fitted =
          this.fitted.has(id) &&
          !(
            selection &&
            !belongs(selection, ROOT) &&
            !this.fitted.has(selection)
          );
        enamel.color.setHex(fitted ? 0x062e78 : finish.color);
        (enamel.userData.fittedRingBlue as { value: number }).value = fitted ? 1 : 0;
        enamel.metalness = fitted ? 1 : finish.metalness;
        enamel.roughness = fitted ? 0.055 : finish.roughness;
        enamel.transmission = 0;
        enamel.userData.finishTransmission = enamel.transmission;
        enamel.ior = 1.53;
        enamel.thickness = 0.35;
        enamel.attenuationColor.setHex(0x063b9a);
        enamel.attenuationDistance = 0.65;
        enamel.clearcoat = 0;
        enamel.clearcoatRoughness = 0.035;
        // The supplied carrier and enamel share coplanar outward faces.
        // Depth bias resolves their source overlap without moving either mesh.
        enamel.polygonOffset = fitted;
        enamel.polygonOffsetFactor = -1;
        enamel.polygonOffsetUnits = -1;
      }
      // Highlighting changes emphasis, not craftsmanship. Any part that remains
      // in the scene keeps its authored finish, including muted context and
      // covers that are still visible while exploring a mechanism.
      setFinishEnabled(p.material, true);
      const scopeId = this.fitted.has(id) ? displayHostPart(id) : id;
      const emphasis =
        selection && belongs(id, selection)
          ? 'selected'
          : focusRole(scopeId, p.source.definitionId, group, selection);
      setEmphasis(p.material, emphasis, group?.color);
      const cutawayTarget =
        ((belongs(id, ROOT) || this.fitted.has(id)) &&
          emphasis === 'surrounding') ||
        (focusCover(id, group) &&
          this.state.reveal > 0.8 &&
          emphasis !== 'selected')
          ? 0
          : 1;
      if (!cutawayTarget || p.cutaway) {
        p.cutaway ??= {
          level: 1,
          from: 1,
          target: 1,
          elapsed: 0,
          opacity: p.material.opacity,
          transparent: p.material.transparent,
          depthWrite: p.material.depthWrite,
        };
        if (p.cutaway.target !== cutawayTarget)
          Object.assign(p.cutaway, {
            from: p.cutaway.level,
            target: cutawayTarget,
            elapsed: 0,
          });
      }
      if (
        !previousTarget.equals(p.target) ||
        !previousRotation.equals(p.targetRotation)
      ) {
        p.motion = {
          offset: p.offset.clone(),
          rotation: p.rotation.clone(),
          elapsed: 0,
          duration: this.poseDuration ?? 0.85,
        };
      }
      // A newly enabled complete display appears in place on the next frame.
      // Do not animate it from a hidden part's stale assembly/inventory pose.
      if (this.fitted.has(id) && !previousFitted?.has(id)) {
        p.offset.copy(p.target);
        p.rotation.copy(p.targetRotation);
        p.motion = undefined;
      }
    }
    this.needsRender = true;
  }
  applyPose(dt: number) {
    let moving = false;
    const temp = new THREE.Matrix4();
    if (this.inventoryTravel && (!this.inventoryEntering || this.reduced)) {
      const turn = this.inventoryTravel;
      turn.elapsed += Math.max(0, dt);
      const t = this.reduced ? 1 : Math.min(1, turn.elapsed / 0.85);
      this.inventoryAngle = THREE.MathUtils.lerp(
        turn.from,
        turn.to,
        t * t * (3 - 2 * t),
      );
      moving = t < 1;
      if (!moving) this.inventoryTravel = undefined;
    }
    const flip = new THREE.Matrix4().makeRotationY(this.inventoryAngle ?? 0);
    let staged: Map<string, [number, number, number]> | undefined;
    if (this.explosionTravel) {
      const travel = this.explosionTravel;
      travel.elapsed += Math.max(0, dt);
      const t = this.reduced
        ? 1
        : Math.min(1, travel.elapsed / travel.duration);
      const eased = t * t * (3 - 2 * t);
      const displayed = { ...travel.to };
      for (const key of ['separation', 'partSpread', 'reveal'] as const)
        displayed[key] =
          travel.from[key] + (travel.to[key] - travel.from[key]) * eased;
      staged = explosionOffsets(this.parts, displayed);
      this.displayedExplosionState = displayed;
      moving = t < 1;
      if (!moving) this.explosionTravel = undefined;
    }
    for (const p of this.renderParts.values()) {
      if (p.cutaway) {
        const fade = p.cutaway;
        fade.elapsed += Math.max(0, dt);
        const t = this.reduced ? 1 : Math.min(1, fade.elapsed / 0.28);
        fade.level = THREE.MathUtils.lerp(
          fade.from,
          fade.target,
          t * t * (3 - 2 * t),
        );
        const fading = t < 1 && fade.from !== fade.target;
        const transparent = fading || fade.transparent;
        if (p.material.transparent !== transparent)
          p.material.needsUpdate = true;
        p.material.transparent = transparent;
        p.material.opacity = fade.opacity * (fading ? fade.level : 1);
        p.material.depthWrite = fading ? false : fade.depthWrite;
        p.mesh.userData.cutawayFading = fading;
        if (!fading && fade.target === 1) p.cutaway = undefined;
        moving = fading || moving;
      }
      if (staged) {
        p.motion = undefined;
        p.offset.fromArray(staged.get(p.source.id) ?? [0, 0, 0]);
        p.rotation.copy(p.targetRotation);
      } else if (p.motion && !this.reduced) {
        p.motion.elapsed += Math.max(0, dt);
        const t = Math.min(1, p.motion.elapsed / p.motion.duration);
        const eased = t * t * (3 - 2 * t);
        p.offset.lerpVectors(p.motion.offset, p.target, eased);
        p.rotation.slerpQuaternions(p.motion.rotation, p.targetRotation, eased);
        if (t < 1) moving = true;
        else p.motion = undefined;
      } else p.motion = undefined;
      if (!p.motion && !staged) {
        p.offset.copy(p.target);
        p.rotation.copy(p.targetRotation);
      }
      p.mesh.matrix.copy(p.displayMatrix ?? p.assembled);
      if (p.rotation.angleTo(new THREE.Quaternion()) > 0) {
        temp.makeTranslation(-p.center.x, -p.center.y, -p.center.z);
        p.mesh.matrix.premultiply(temp);
        temp.makeRotationFromQuaternion(p.rotation);
        p.mesh.matrix.premultiply(temp);
        temp.makeTranslation(p.center.x, p.center.y, p.center.z);
        p.mesh.matrix.premultiply(temp);
      }
      temp.makeTranslation(p.offset.x, p.offset.y, p.offset.z);
      p.mesh.matrix.premultiply(temp);
      if (this.state.layout === 'spread' && this.spread.has(p.source.id)) {
        const pivot = p.mesh.geometry
          .boundingBox!.getCenter(new THREE.Vector3())
          .applyMatrix4(p.mesh.matrix);
        if (this.inventoryAngle) {
          p.mesh.matrix.premultiply(
            temp.makeTranslation(-pivot.x, -pivot.y, -pivot.z),
          );
          p.mesh.matrix.premultiply(flip);
          p.mesh.matrix.premultiply(
            temp.makeTranslation(pivot.x, pivot.y, pivot.z),
          );
        }
        this.inventoryApplied = true;
      }
      p.mesh.matrixWorldNeedsUpdate = true;
    }
    if (
      this.inventoryEntering &&
      !this.travel &&
      ![...this.renderParts.values()].some((p) => p.motion)
    )
      this.inventoryEntering = false;
    // Keep rendering a queued turn after the entry camera and poses arrive.
    moving = !!this.inventoryTravel || moving;
    if (!moving) this.displayedExplosionState = { ...this.state };
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
  keyDown = (e: KeyboardEvent) => {
    if (!this.ready) return;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-0.2, 0],
      ArrowRight: [0.2, 0],
      ArrowUp: [0, -0.2],
      ArrowDown: [0, 0.2],
    };
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.deselect();
    } else if (moves[e.key]) {
      e.preventDefault();
      this.orbit(...moves[e.key]);
    } else if (['+', '=', '-', 'Home'].includes(e.key)) {
      e.preventDefault();
      if (e.key === 'Home') this.reset();
      else this.zoom(e.key === '-' ? 1.2 : 0.83);
    }
  };
  pointerDown = (e: PointerEvent) => {
    this.pointers.add(e.pointerId);
    if (this.pointers.size === 1)
      this.pointer = {
        x: e.clientX,
        y: e.clientY,
        id: e.pointerId,
        cancelled: !e.isPrimary || e.button !== 0,
      };
    else this.pointer.cancelled = true;
  };
  pointerMove = (e: PointerEvent) => {
    if (
      e.pointerId === this.pointer.id &&
      Math.hypot(e.clientX - this.pointer.x, e.clientY - this.pointer.y) > 6
    )
      this.pointer.cancelled = true;
  };
  pointerWheel = () => {
    this.pointer.cancelled = true;
  };
  pointerCancel = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    this.pointer.cancelled = true;
  };
  pointerUp = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    this.pointerMove(e);
    if (
      this.pointer.cancelled ||
      this.pointers.size ||
      this.pointer.id !== e.pointerId ||
      e.button !== 0
    )
      return;
    this.pointer.cancelled = true;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.left + rect.width ||
      e.clientY < rect.top ||
      e.clientY > rect.top + rect.height
    )
      return;
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
    else this.deselect();
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
    if (
      this.ready &&
      this.state.layout === 'spread' &&
      Math.abs(old - this.camera.aspect) > 0.01
    ) {
      this.rebuildSpread();
      this.retarget();
    }
    if (this.restoringCamera && Math.abs(old - this.camera.aspect) > 0.01) {
      const saved = this.restoringCamera;
      const factor =
        Math.min(1, saved.aspect ?? this.camera.aspect) /
        Math.min(1, this.camera.aspect);
      this.travel = {
        up: saved.up?.clone(),
        target: saved.target.clone(),
        position: saved.position
          .clone()
          .sub(saved.target)
          .multiplyScalar(factor)
          .add(saved.target),
      };
    } else if (
      this.ready &&
      Math.abs(old - this.camera.aspect) > 0.01 &&
      !this.cameraUserOwned &&
      !this.state.part
    ) {
      if (this.state.layout === 'spread')
        this.frameSpread(this.spreadFocus ?? undefined);
      else if (
        this.state.viewAngle === 'face' ||
        this.state.separation ||
        this.state.partSpread
      )
        this.fitPresentation();
      else if (this.state.group)
        this.frameGroup(GROUPS.find((g) => g.id === this.state.group)!);
      else if (this.state.presentation === 'dials') this.frameDials();
      else this.homeCamera();
    } else if (this.ready && Math.abs(old - this.camera.aspect) > 0.01) {
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
      if (this.travel) {
        this.travel.duration = Math.max(
          0.075,
          (this.travel.duration ?? 0.85) - (this.travel.elapsed ?? 0),
        );
        this.travel.fromPosition = this.camera.position.clone();
        this.travel.fromTarget = this.controls.target.clone();
        this.travel.fromUp = this.camera.up.clone();
        this.travel.elapsed = 0;
      }
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
    if (document.hidden || this.contextLost || this.loadStage === 'error') {
      this.lastFrame = 0;
      return;
    }
    const interval = this.lastFrame ? now - this.lastFrame : 0;
    const dt = Math.min(interval / 1000, 0.1);
    this.lastFrame = now;
    if (this.benchmark) benchmarkFrame(this, this.benchmark, now, interval);
    let moving = false;
    const poseWasMoving = this.presentationMoving,
      cameraWasMoving = !!this.travel;
    if (this.needsRender || this.presentationMoving) {
      moving = this.applyPose(dt);
      this.presentationMoving = moving;
      this.retargetVisibility();
    }
    if (this.travel) {
      const travel = this.travel;
      travel.fromPosition ??= this.camera.position.clone();
      travel.fromTarget ??= this.controls.target.clone();
      travel.elapsed = (travel.elapsed ?? 0) + dt;
      const t = this.reduced
        ? 1
        : Math.min(1, travel.elapsed / (travel.duration ?? 0.85));
      const a = t * t * (3 - 2 * t);
      const from = travel.fromPosition.clone().sub(travel.fromTarget),
        to = travel.position.clone().sub(travel.target);
      const distance = THREE.MathUtils.lerp(from.length(), to.length(), a);
      travel.fromUp ??= this.camera.up.clone();
      if (travel.up && travel.fromUp.distanceToSquared(travel.up) > 1e-12) {
        // Turn the entire viewing frame together. Independent direction/up arcs
        // twist around different axes when the two dial faces are opposite.
        const origin = new THREE.Vector3();
        const orientation = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(from, origin, travel.fromUp),
        );
        const destination = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(to, origin, travel.up),
        );
        orientation.slerp(destination, a);
        from.set(0, 0, 1).applyQuaternion(orientation);
        this.camera.up.set(0, 1, 0).applyQuaternion(orientation);
        this.syncOrbitUp();
      } else {
        const rotation = new THREE.Quaternion().setFromUnitVectors(
          from.normalize(),
          to.normalize(),
        );
        from.applyQuaternion(new THREE.Quaternion().slerp(rotation, a));
      }
      this.controls.target.lerpVectors(travel.fromTarget, travel.target, a);
      this.camera.position
        .copy(this.controls.target)
        .add(from.multiplyScalar(distance));
      if (t === 1) {
        if (travel.up) {
          this.camera.up.copy(travel.up);
          this.syncOrbitUp();
        }
        this.camera.position.copy(this.travel.position);
        this.controls.target.copy(this.travel.target);
        this.travel = null;
        this.restoringCamera = null;
      } else moving = true;
    }
    this.ensureFramingRange();
    const controlsChanged = this.controls.update();
    const rendered =
      this.needsRender ||
      moving ||
      poseWasMoving ||
      cameraWasMoving ||
      controlsChanged;
    if (rendered) {
      try {
        this.renderer.render(this.scene, this.camera);
        this.beautyTriangles = this.renderer.info.render.triangles;
        this.beautyDrawCalls = this.renderer.info.render.calls;
        if (this.state.quality !== 'low')
          this.surfaceOcclusion?.render(this.renderer);
      } catch {
        this.ready = false;
        this.awaitingFirstFrame = false;
        this.loadStage = 'error';
        this.error =
          'The view could not render. Retry, or explore the section descriptions.';
        this.controls.enabled = false;
        this.travel = null;
        this.presentationMoving = false;
        this.needsRender = false;
        this.emit();
        return;
      }
      this.renderCount++;
      if (interval > 0) {
        this.frameIntervals.push(interval);
        if (this.frameIntervals.length > 20000) this.frameIntervals.shift();
      }
      this.needsRender = false;
      if (this.awaitingFirstFrame) {
        this.awaitingFirstFrame = false;
        this.ready = true;
        const recovering = this.loadStage === 'recovering';
        this.loadStage = 'ready';
        this.controls.enabled = true;
        if (!recovering) this.loadMs = performance.now() - this.loadStart;
        this.emit();
      }
    }
    this.inspectionFrame?.(now, !!rendered);
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
  partVisible(p: RenderPart) {
    const id = p.source.id,
      selection = this.state.part;
    const selected = !!selection && belongs(id, selection);
    if (this.state.layout === 'spread')
      return this.spread.has(id) && (!this.state.isolated || selected);
    if (this.state.isolated) return selected;
    // A raw external selection replaces fitted display overlays until Back.
    const raw =
      !!selection && !belongs(selection, ROOT) && !this.fitted.has(selection);
    let visible =
      belongs(id, ROOT) || selected || (!raw && !!this.fitted?.has(id));
    if (id === PREFIX + '66' && !selected) visible = false;
    if (id === PREFIX + '53' && selection === PREFIX + '66') visible = false;
    const group = GROUPS.find((g) => g.id === this.state.group);
    if (group) {
      // Retained covers retire after travelling clear. Unrelated assemblies
      // use the independent section fade, regardless of the reveal slider.
      const scopeId = this.fitted.has(id) ? displayHostPart(id) : id;
      const obstruction = uncoverHost(scopeId, this.state.group);

      if (
        obstruction &&
        p.offset.length() > 24 &&
        !selected &&
        !inMembers(scopeId, group.members)
      )
        visible = false;
    }
    if (p.cutaway?.level === 0 && !selected) visible = false;
    return visible;
  }
  retargetVisibility() {
    for (const p of this.renderParts.values()) {
      const visible = this.partVisible(p);
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
