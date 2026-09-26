import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import {
  syncOrbitUp,
  zoomCamera,
  KEYBOARD_ZOOM_IN,
  KEYBOARD_ZOOM_OUT,
} from '../viewer/CameraFrame';
import { motionEase, MOTION } from '../experience/motion';
import { SurfaceOcclusion } from '../viewer/SurfaceOcclusion';
import {
  configureRenderer,
  addStudioLights,
  createStudioEnvironment,
  disposeObjectResources,
} from '../viewer/GraphicsResources';
import {
  attachSourceSurface,
  loadSourceSurfaces,
} from '../viewer/SourceSurfaces';
import { loadRecoveredDiamond } from '../viewer/RecoveredDiamond';
import {
  createMaterial,
  FITTED_BLUE_ENAMEL,
  setFinishEnabled,
} from '../viewer/materials';
import { DIALS } from '../experience/dials';
import { assetRequestUrl } from '../experience/loading';
import type { Manifest, Part } from '../experience/catalog';
import type { PlayManifest, PlayStep } from './types';
import { dragCenter, snapDrop } from './state';
import { fixedViewDirection } from './fixedViews';

type Piece = { mesh: THREE.Mesh; pose: THREE.Matrix4; bounds: THREE.Box3 };
type Point = { x: number; y: number };
export type PlayViewStatus = {
  ready: boolean;
  error: string;
  busy: boolean;
  cutaway: boolean;
  obstructed?: boolean;
  side: 'front' | 'back';
  detail?: string;
};

/** A route-local controller. Source matrices and shared geometry are never mutated. */
export class PlayViewer {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(33, 1, 0.01, 2000);
  controls: OrbitControls;
  environment?: THREE.WebGLRenderTarget;
  surfaceOcclusion?: SurfaceOcclusion;
  cameraMotion?: {
    start: number;
    fromPosition: THREE.Vector3;
    fromTarget: THREE.Vector3;
    fromUp: THREE.Vector3;
    position: THREE.Vector3;
    target: THREE.Vector3;
    up: THREE.Vector3;
    rotation?: number;
    rotationPivot?: THREE.Vector3;
  };
  pieces = new Map<string, Piece>();
  staged = new THREE.Group();
  ghost = new THREE.Group();
  ghostMaterial = new THREE.MeshBasicMaterial({
    color: 0xe8c88e,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  available = true;
  hints = false;
  assistance = false;
  workspace: string | null = null;
  mainView?: {
    position: THREE.Vector3;
    target: THREE.Vector3;
    up: THREE.Vector3;
    focus: THREE.Vector3;
    side: 'front' | 'back';
    zoomLimits: [number, number];
  };
  detail: PlayStep | null = null;
  detailView?: PlayViewer['mainView'];
  captureElement?: HTMLElement;
  thumbnails = new Map<string, string>();
  seatSamples: THREE.Vector3[] = [];
  seatPoint = new THREE.Vector3();
  seatVisible = false;
  seatInView = false;
  observer: ResizeObserver;
  frame = 0;
  renderCount = 0;
  dead = false;
  ready = false;
  contextUnavailable = false;
  busy = false;
  error = '';
  cutaway = false;
  current: PlayStep | null = null;
  fitted = new Set<string>();
  active = false;
  target = new THREE.Vector3();
  frameFocus = new THREE.Vector3();
  stepBounds = new THREE.Box3();
  hasFramed = false;
  frameRegion = { top: 80, bottom: 500, left: 0, width: 1000 };
  side: 'front' | 'back' = 'back';
  drag?: {
    pointer: number;
    grab: Point;
    position: Point;
    moved: boolean;
    start: Point;
  };
  animation?: {
    start: number;
    from: Point;
    to: Point;
    fromScale: number;
    toScale: number;
    complete: () => void;
  };
  media = matchMedia('(prefers-reduced-motion: reduce)');
  loadedObjects: THREE.Object3D[] = [];
  generation = 0;
  constructor(
    public host: HTMLElement,
    public source: () => HTMLElement | null,
    public destination: HTMLElement,
    public manifest: PlayManifest,
    public notify: (status: PlayViewStatus) => void,
    public placed: (id: string) => void,
    public selected: () => void,
    public feedback: (message: string) => void = () => {},
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    try {
      configureRenderer(this.renderer);
      host.appendChild(this.renderer.domElement);
      this.renderer.domElement.tabIndex = 0;
      this.renderer.domElement.setAttribute(
        'aria-label',
        'Watch assembly. Flip switches sides. Pinch or scroll to zoom. F flips; plus and minus zoom; Home resets.',
      );
      this.camera.up.set(0, -1, 0);
      // Match the movement-side preset before controls can report a camera change.
      this.camera.position.set(0, 0, -60);
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enablePan = false;
      this.controls.enableRotate = false;
      this.controls.zoomToCursor = false;
      this.controls.enableDamping = true;
      this.controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
      this.controls.minDistance = 3;
      this.controls.maxDistance = 1500;
      this.controls.addEventListener('change', this.cameraChanged);
      this.makeEnvironment();
      addStudioLights(this.scene);
      this.scene.add(this.staged, this.ghost);
      this.surfaceOcclusion = new SurfaceOcclusion(this.scene, this.camera);
      window.addEventListener('keydown', this.escapeDrag);
      this.renderer.domElement.addEventListener(
        'webglcontextlost',
        this.contextLost,
      );
      this.renderer.domElement.addEventListener(
        'webglcontextrestored',
        this.contextRestored,
      );
      this.renderer.domElement.addEventListener('keydown', this.keyDown);
      this.media.addEventListener('change', this.motionChanged);
      this.observer = new ResizeObserver(this.resize);
      this.observer.observe(host);
      this.resize();
    } catch (error) {
      this.dispose();
      throw error;
    }
  }
  emit() {
    if (!this.dead)
      this.notify({
        ready: this.ready,
        error: this.error,
        busy: this.busy,
        cutaway: this.cutaway,
        obstructed: !!this.current && (!this.seatVisible || !this.seatInView),
        side: this.side,
        detail: this.detail?.id,
      });
  }
  makeEnvironment() {
    const environment = createStudioEnvironment(this.renderer);
    this.environment?.dispose();
    this.environment = environment;
    this.scene.environment = environment.texture;
    this.scene.environmentIntensity = 0.9;
  }
  async load() {
    const generation = ++this.generation;
    this.ready = false;
    this.error = '';
    this.emit();
    const loaded: THREE.Object3D[] = [];
    const prepared = new Map<string, Piece>();
    let committed = false;
    try {
      const get = async (url: string) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`${url} unavailable`);
        return r.json();
      };
      const [source, paths] = await Promise.all([
        get('/models/assembly-manifest.json') as Promise<Manifest>,
        get('/models/asset-paths.json') as Promise<{
          overview: string;
          catalog: string;
        }>,
      ]);
      if (this.dead || generation !== this.generation) return;
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      // All chosen leaves are required. A partial catalog can never enable completion.
      const results = await Promise.allSettled([
        loader.loadAsync(assetRequestUrl(paths.overview)).then((g) => {
          loaded.push(g.scene);
          return g.scene;
        }),
        loader.loadAsync(assetRequestUrl(paths.catalog)).then((g) => {
          loaded.push(g.scene);
          return g.scene;
        }),
        loadRecoveredDiamond(source.instances).then((g) => {
          loaded.push(g);
          return g;
        }),
        loadSourceSurfaces(paths.overview),
      ]);
      if (this.dead || generation !== this.generation) {
        return;
      }
      for (const result of results)
        if (result.status === 'rejected') throw result.reason;
      const surfaces = (
        results[3] as PromiseFulfilledResult<
          Awaited<ReturnType<typeof loadSourceSurfaces>>
        >
      ).value;
      const byId = new Map(source.instances.map((p) => [p.id, p]));
      const found = new Map<string, { mesh: THREE.Mesh; record: Part }>();
      for (const object of loaded)
        object.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          let parent: THREE.Object3D | null = node,
            record: Part | undefined;
          while (parent && !record) {
            record = byId.get(parent.name);
            parent = parent.parent;
          }
          if (
            record &&
            this.manifest.finalLeafIds.includes(record.id) &&
            !found.has(record.id)
          )
            found.set(record.id, { mesh: node, record });
        });
      const missing = this.manifest.finalLeafIds.filter((id) => !found.has(id));
      if (missing.length)
        throw new Error(`Required geometry missing: ${missing.join(', ')}`);
      for (const [id, { mesh: original, record }] of found) {
        attachSourceSurface(
          original.geometry,
          surfaces.get(record.definitionId),
        );
        const material = createMaterial(
          record.name,
          record.definitionId,
          original.geometry,
          id,
        );
        const mesh = new THREE.Mesh(original.geometry, material);
        // Track the clone immediately so any later preparation failure releases it.
        const piece = {
          mesh,
          pose: new THREE.Matrix4(),
          bounds: new THREE.Box3(),
        };
        prepared.set(id, piece);
        setFinishEnabled(material, true);
        if (DIALS.presentationOverrides.some((o) => o.leafId === id)) {
          const enamel = material as THREE.MeshPhysicalMaterial;
          Object.assign(enamel, {
            ...FITTED_BLUE_ENAMEL,
            color: new THREE.Color(FITTED_BLUE_ENAMEL.color),
            attenuationColor: new THREE.Color(
              FITTED_BLUE_ENAMEL.attenuationColor,
            ),
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
        }
        const pose = new THREE.Matrix4().set(
          ...(this.manifest.targetPoses[id].flat() as Parameters<
            THREE.Matrix4['set']
          >),
        );
        mesh.matrixAutoUpdate = false;
        mesh.matrix.copy(pose);
        mesh.userData.partId = id;
        const bounds = new THREE.Box3()
          .setFromBufferAttribute(
            original.geometry.getAttribute('position') as THREE.BufferAttribute,
          )
          .applyMatrix4(pose);
        piece.pose = pose;
        piece.bounds = bounds;
      }
      // Only replace the last complete scene once every required leaf is prepared.
      this.clearPieces();
      this.pieces = prepared;
      for (const { mesh } of prepared.values()) this.scene.add(mesh);
      this.loadedObjects = loaded;
      committed = true;
      this.ready = !this.contextUnavailable;
      if (this.ready) this.error = '';
      this.update(this.fitted, this.current, this.active);
      this.emit();
    } catch (error) {
      if (!this.dead && generation === this.generation) {
        this.error =
          'The watch could not load completely. Retry to restore your assembly.';
        this.ready = false;
        this.emit();
        console.error('Play asset load', error);
      }
    } finally {
      if (!committed) {
        for (const { mesh } of prepared.values())
          (mesh.material as THREE.Material).dispose();
        loaded.forEach((object) => this.disposeObject(object));
      }
    }
  }
  clearPieces() {
    this.staged.clear();
    this.ghost.clear();
    this.thumbnails.clear();
    for (const { mesh } of this.pieces.values()) {
      this.scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
    }
    this.pieces.clear();
    this.loadedObjects.forEach((o) => this.disposeObject(o));
    this.loadedObjects = [];
  }
  disposeObject(object: THREE.Object3D) {
    disposeObjectResources(object);
  }
  update(fitted: Set<string>, step: PlayStep | null, active: boolean) {
    this.cancel();
    this.animation = undefined;
    // A discrete selection never resumes an earlier guided transition.
    this.cameraMotion = undefined;
    this.stopOrbitMotion();
    this.busy = false;
    this.controls.enabled = this.ready;
    this.fitted = new Set(fitted);
    this.current = step;
    this.active = active;
    if (!this.ready) return;
    this.staged.clear();
    this.ghost.clear();
    this.stepBounds.makeEmpty();
    this.seatSamples = [];
    for (const id of step?.leafIds ?? [])
      this.stepBounds.union(this.pieces.get(id)!.bounds);
    if (step) {
      this.stepBounds.getCenter(this.target);
      for (const id of step.leafIds) {
        const part = this.pieces.get(id)!;
        const mesh = new THREE.Mesh(part.mesh.geometry, part.mesh.material);
        mesh.matrixAutoUpdate = false;
        mesh.matrix
          .makeTranslation(-this.target.x, -this.target.y, -this.target.z)
          .multiply(part.pose);
        this.staged.add(mesh);
        const overlay = new THREE.Mesh(part.mesh.geometry, this.ghostMaterial);
        overlay.matrixAutoUpdate = false;
        overlay.matrix.copy(part.pose);
        this.ghost.add(overlay);
        // Source surface samples, not an invisible centre behind a cover.
        const positions = part.mesh.geometry.getAttribute('position');
        const stride = Math.max(1, Math.floor(positions.count / 80));
        for (let i = 0; i < positions.count; i += stride)
          this.seatSamples.push(
            new THREE.Vector3()
              .fromBufferAttribute(positions, i)
              .applyMatrix4(part.pose),
          );
      }
    }
    this.staged.visible = false;
    this.presentContext();
    if (!this.hasFramed) {
      this.layout();
      this.reframe();
    }
    this.updateSeat();
    this.positionStage();
    this.invalidate();
    this.emit();
  }
  setAssistance(hints: boolean, available: boolean, assistance = false) {
    this.hints = hints;
    this.available = available;
    this.assistance = assistance;
    this.ghost.visible =
      !!this.current &&
      this.current.workspaceId === this.workspace &&
      available &&
      (hints || assistance);
    this.destination.dataset.assisted = String(hints || assistance);
    this.updateSeat();
    this.invalidate();
  }
  captureCamera() {
    return {
      workspace: this.workspace,
      mainView: this.mainView,
      detail: this.detail,
      detailView: this.detailView,
      zoomLimits: [this.controls.minDistance, this.controls.maxDistance],
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
      up: this.camera.up.clone(),
      focus: this.frameFocus.clone(),
      side: this.side,
      hasFramed: this.hasFramed,
    };
  }
  restoreCamera(saved: ReturnType<PlayViewer['captureCamera']>) {
    this.workspace = saved.workspace;
    this.mainView = saved.mainView;
    this.detail = saved.detail;
    this.detailView = saved.detailView;
    [this.controls.minDistance, this.controls.maxDistance] = saved.zoomLimits;
    this.camera.position.copy(saved.position);
    this.controls.target.copy(saved.target);
    this.camera.up.copy(saved.up);
    this.frameFocus.copy(saved.focus);
    this.side = saved.side;
    this.hasFramed = saved.hasFramed;
    syncOrbitUp(this.camera, this.controls);
    this.stopOrbitMotion();
    this.camera.lookAt(this.controls.target);
    this.camera.updateMatrixWorld();
    this.layout();
    this.invalidate();
  }
  setDetail(step: PlayStep | null) {
    if (
      this.busy ||
      this.drag ||
      this.workspace ||
      (step && !step.viewDirectionWorld)
    )
      return;
    if (step?.id === this.detail?.id) return;
    this.stopOrbitMotion();
    if (step) {
      if (!this.detail)
        this.detailView = {
          position: this.camera.position.clone(),
          target: this.controls.target.clone(),
          up: this.camera.up.clone(),
          focus: this.frameFocus.clone(),
          side: this.side,
          zoomLimits: [this.controls.minDistance, this.controls.maxDistance],
        };
      this.detail = step;
      this.side = step.side;
      this.reframe(false, true);
    } else {
      this.detail = null;
      if (this.detailView) {
        this.camera.position.copy(this.detailView.position);
        this.controls.target.copy(this.detailView.target);
        this.camera.up.copy(this.detailView.up);
        this.frameFocus.copy(this.detailView.focus);
        this.side = this.detailView.side;
        [this.controls.minDistance, this.controls.maxDistance] =
          this.detailView.zoomLimits;
        syncOrbitUp(this.camera, this.controls);
        this.camera.lookAt(this.controls.target);
        this.camera.updateMatrixWorld();
        this.detailView = undefined;
      }
      this.updateSeat();
      this.invalidate();
    }
    this.emit();
  }
  setWorkspace(workspace: string | null) {
    if (workspace === this.workspace || this.busy || this.drag) return;
    if (this.detail) this.setDetail(null);
    if (!this.workspace)
      this.mainView = {
        position: this.camera.position.clone(),
        target: this.controls.target.clone(),
        up: this.camera.up.clone(),
        focus: this.frameFocus.clone(),
        side: this.side,
        zoomLimits: [this.controls.minDistance, this.controls.maxDistance],
      };
    this.workspace = workspace;
    this.current = null;
    this.staged.clear();
    this.ghost.clear();
    this.cameraMotion = undefined;
    this.stopOrbitMotion();
    if (!workspace && this.mainView) {
      this.camera.position.copy(this.mainView.position);
      this.controls.target.copy(this.mainView.target);
      this.camera.up.copy(this.mainView.up);
      this.frameFocus.copy(this.mainView.focus);
      this.side = this.mainView.side;
      [this.controls.minDistance, this.controls.maxDistance] =
        this.mainView.zoomLimits;
      syncOrbitUp(this.camera, this.controls);
      this.camera.lookAt(this.controls.target);
      this.camera.updateMatrixWorld();
      this.updateProjection();
      this.mainView = undefined;
    } else {
      this.side =
        this.manifest.packets.find((p) => p.id === workspace)?.side ?? 'back';
      this.reframe(false, true);
    }
    this.invalidate();
    this.emit();
  }
  boundsFor(ids: Iterable<string>) {
    const b = new THREE.Box3();
    for (const id of ids) {
      const p = this.pieces.get(id);
      if (p) b.union(p.bounds);
    }
    return b;
  }
  reframe = (animate = false, _straightOn = false) => {
    if (!this.ready || this.drag || (this.busy && !this.cameraMotion)) return;
    const transition = (animate || !!this.cameraMotion) && this.hasFramed;
    this.hasFramed = true;
    const fromPosition = this.camera.position.clone(),
      fromTarget = this.controls.target.clone(),
      fromUp = this.camera.up.clone();
    const ids = this.workspace
      ? this.manifest.packets.find((p) => p.id === this.workspace)!.leafIds
      : this.manifest.initialLeafIds;
    const bounds = this.boundsFor(ids);
    const center = bounds.getCenter(new THREE.Vector3()),
      size = bounds.getSize(new THREE.Vector3());
    this.frameFocus.copy(center);
    const span = Math.max(size.x, size.y, size.z, this.workspace ? 1 : 25);
    const regionHeight = Math.max(
      80,
      this.frameRegion.bottom - this.frameRegion.top,
    );
    const distance =
      (span / (2 * Math.tan(THREE.MathUtils.degToRad(16.5)))) *
      Math.max(
        (this.host.clientHeight / regionHeight) * 1.18,
        (1.35 * this.host.clientHeight) / this.frameRegion.width,
      );
    const up = new THREE.Vector3(0, this.side === 'front' ? 1 : -1, 0);
    const direction = fixedViewDirection(
      this.side,
      this.workspace,
      this.detail,
    );
    // Centered zoom cannot enter the movement or lose it in the distance.
    this.controls.minDistance = distance / 2;
    this.controls.maxDistance = distance * 1.5;
    this.camera.up.copy(up);
    syncOrbitUp(this.camera, this.controls);
    this.controls.target.copy(center);
    this.updateProjection();
    this.camera.position
      .copy(this.controls.target)
      .addScaledVector(direction, distance);
    this.camera.lookAt(this.controls.target);
    this.camera.updateMatrixWorld();
    this.stopOrbitMotion();
    this.controls.update();
    if (transition && !this.media.matches) {
      const old = this.cameraMotion;
      this.cameraMotion = {
        start: old?.start ?? performance.now(),
        fromPosition: old?.fromPosition ?? fromPosition,
        fromTarget: old?.fromTarget ?? fromTarget,
        fromUp: old?.fromUp ?? fromUp,
        position: this.camera.position.clone(),
        target: this.controls.target.clone(),
        up: this.camera.up.clone(),
      };
      this.camera.position.copy(fromPosition);
      this.controls.target.copy(fromTarget);
      this.camera.up.copy(fromUp);
      syncOrbitUp(this.camera, this.controls);
      this.camera.lookAt(this.controls.target);
      this.camera.updateMatrixWorld();
      this.busy = true;
      this.controls.enabled = false;
      this.emit();
    }
    this.presentContext();
    this.positionStage();
    this.invalidate();
  };
  presentContext() {
    for (const [id, p] of this.pieces) p.mesh.visible = this.fitted.has(id);
    this.cutaway = false;
    this.ghost.visible =
      !!this.current &&
      this.current.workspaceId === this.workspace &&
      this.available &&
      (this.hints || this.assistance);
  }
  updateProjection() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    const x = this.frameRegion.left + this.frameRegion.width / 2;
    const y = (this.frameRegion.top + this.frameRegion.bottom) / 2;
    this.camera.setViewOffset(w, h, w / 2 - x, h / 2 - y, w, h);
    this.camera.updateProjectionMatrix();
  }
  occludersAt(point: THREE.Vector3) {
    const direction = point.clone().sub(this.camera.position);
    const distance = direction.length();
    const ray = new THREE.Raycaster(
      this.camera.position,
      direction.normalize(),
      0,
      Math.max(0, distance - 0.035),
    );
    // Transparent authored surfaces are not opaque blockers. Never mutate materials.
    const meshes = [...this.pieces.values()]
      .filter(
        (p) =>
          p.mesh.visible &&
          !(
            p.mesh.material instanceof THREE.Material &&
            p.mesh.material.transparent &&
            p.mesh.material.opacity < 0.5
          ),
      )
      .map((p) => p.mesh);
    return ray
      .intersectObjects(meshes, false)
      .map((hit) => hit.object.userData.partId as string);
  }
  visibleSeat(point: THREE.Vector3) {
    return this.occludersAt(point).length === 0;
  }
  inAssemblyView(point: Point) {
    return (
      point.x >= this.frameRegion.left &&
      point.x <= this.frameRegion.left + this.frameRegion.width &&
      point.y >= this.frameRegion.top &&
      point.y <= this.frameRegion.bottom
    );
  }
  updateSeat() {
    if (
      !this.current ||
      !this.ready ||
      this.current.workspaceId !== this.workspace
    ) {
      this.destination.style.visibility = 'hidden';
      this.seatVisible = false;
      this.seatInView = false;
      return;
    }
    const wasObscured = !this.seatVisible || !this.seatInView;
    this.scene.updateMatrixWorld(true);
    const center = this.project(this.target);
    const samples = [...this.seatSamples].sort((a, b) => {
      const p = this.project(a),
        q = this.project(b);
      return (
        Math.hypot(p.x - center.x, p.y - center.y) -
        Math.hypot(q.x - center.x, q.y - center.y)
      );
    });
    // Prefer an exposed point inside the usable view. The closest sample to
    // the source centre can be offscreen while another valid seat is visible.
    const best =
      samples.find(
        (point) =>
          this.inAssemblyView(this.project(point)) && this.visibleSeat(point),
      ) ?? samples.find((point) => this.visibleSeat(point));
    this.seatVisible = !!best;
    this.seatPoint.copy(best ?? this.target);
    const p = this.project(this.seatPoint);
    const inView = this.inAssemblyView(p);
    this.seatInView = inView;
    this.destination.style.visibility =
      this.seatVisible &&
      inView &&
      this.available &&
      (this.hints || this.assistance)
        ? 'visible'
        : 'hidden';
    this.destination.style.left = `${p.x}px`;
    this.destination.style.top = `${p.y}px`;
    if (wasObscured !== (!this.seatVisible || !this.seatInView)) this.emit();
  }
  cameraChanged = () => {
    if (this.dead) return;
    this.camera.updateMatrixWorld();
    if (!this.drag && !this.animation) this.positionStage();
    this.updateSeat();
    const side =
      this.camera.position.z >= this.controls.target.z ? 'front' : 'back';
    if (side !== this.side) {
      this.side = side;
      this.emit();
    }
    this.invalidate();
  };
  stagePoint(): Point {
    const a = this.host.getBoundingClientRect(),
      b = this.source()?.getBoundingClientRect();
    return b
      ? { x: b.left + b.width / 2 - a.left, y: b.top + b.height / 2 - a.top }
      : { x: a.width / 2, y: a.height };
  }

  project(point: THREE.Vector3): Point {
    const p = point.clone().project(this.camera);
    return {
      x: ((p.x + 1) * this.host.clientWidth) / 2,
      y: ((1 - p.y) * this.host.clientHeight) / 2,
    };
  }
  planePoint(point: Point) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        (point.x / this.host.clientWidth) * 2 - 1,
        1 - (point.y / this.host.clientHeight) * 2,
      ),
      this.camera,
    );
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      this.camera.getWorldDirection(new THREE.Vector3()),
      this.target,
    );
    return (
      ray.ray.intersectPlane(plane, new THREE.Vector3()) ?? this.target.clone()
    );
  }
  positionStage(point = this.stagePoint(), _scale?: number) {
    if (!this.current || !this.ready) return;
    this.staged.position.copy(this.planePoint(point));
    // Source geometry is already in world units. Pickup must not enlarge it.
    this.staged.scale.setScalar(1);
  }
  point(event: PointerEvent): Point {
    const r = this.host.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  }
  /** Gallery and touch controls share the same placement/cancellation path. */
  beginDrag(
    event: PointerEvent,
    origin: HTMLElement,
    center = this.point(event),
  ) {
    if (
      !this.ready ||
      !this.active ||
      !this.current ||
      (this.hints && !this.available) ||
      this.busy ||
      this.drag ||
      event.button !== 0
    )
      return false;
    event.preventDefault();
    event.stopPropagation();
    const p = this.point(event);
    this.drag = {
      pointer: event.pointerId,
      grab: { x: p.x - center.x, y: p.y - center.y },
      position: center,
      start: p,
      moved: false,
    };
    this.stopOrbitMotion();
    this.controls.enabled = false;
    this.captureElement = origin;
    {
      origin.addEventListener('pointermove', this.pointerMove);
      origin.addEventListener('pointerup', this.pointerUp);
      origin.addEventListener('pointercancel', this.cancel);
      origin.addEventListener('lostpointercapture', this.cancel);
    }
    this.captureElement.setPointerCapture(event.pointerId);
    this.staged.visible = true;
    this.positionStage(center);
    this.invalidate();
    this.selected();
    return true;
  }
  pointerMove = (event: PointerEvent) => {
    if (!this.drag || event.pointerId !== this.drag.pointer) return;
    const p = this.point(event);
    this.drag.moved ||=
      Math.hypot(p.x - this.drag.start.x, p.y - this.drag.start.y) > 5;
    this.drag.position = dragCenter(p, this.drag.grab);
    // No magnetic preview with hints off: acceptance happens only on release.
    const near =
      (this.hints || this.assistance) &&
      this.available &&
      this.isNear(this.drag.position);
    this.destination.dataset.near = String(near);
    this.positionStage(this.drag.position);
    this.invalidate();
  };
  isNear(point: Point) {
    return (
      this.seatVisible &&
      this.seatSamples.some((sample) => {
        const target = this.project(sample);
        return (
          this.inAssemblyView(target) &&
          snapDrop({ pointer: point, grabOffset: { x: 0, y: 0 }, target }) &&
          this.visibleSeat(sample)
        );
      })
    );
  }
  pointerUp = (event: PointerEvent) => {
    if (!this.drag || event.pointerId !== this.drag.pointer) return;
    const drag = this.drag,
      p = this.point(event);
    const center = dragCenter(p, drag.grab);
    const valid =
      drag.moved &&
      this.current?.workspaceId === this.workspace &&
      this.isNear(center) &&
      this.available;
    this.releaseCapture();
    if (valid) this.place();
    else if (!drag.moved) {
      this.staged.visible = false;
      this.positionStage();
      this.invalidate();
    } else {
      if (drag.moved)
        this.feedback(
          this.current?.workspaceId !== this.workspace
            ? this.current?.workspaceId
              ? 'This part belongs on its workbench. Choose Open workbench.'
              : 'Return to the watch to fit this piece.'
            : !this.available
              ? 'That piece cannot be fitted yet. Turn hints on to see what it needs.'
              : !this.seatVisible || !this.seatInView
                ? 'The fitting point is hidden from this view. Flip the watch or use Show destination.'
                : 'Not close enough to its fitting point. Try nearer, or use Show destination.',
        );
      this.animateToStage(drag.position);
    }
  };
  releaseCapture() {
    const pointer = this.drag?.pointer;
    this.drag = undefined;
    if (this.captureElement) {
      this.captureElement.removeEventListener('pointermove', this.pointerMove);
      this.captureElement.removeEventListener('pointerup', this.pointerUp);
      this.captureElement.removeEventListener('pointercancel', this.cancel);
      this.captureElement.removeEventListener(
        'lostpointercapture',
        this.cancel,
      );
    }
    if (
      pointer !== undefined &&
      this.captureElement?.hasPointerCapture(pointer)
    )
      this.captureElement.releasePointerCapture(pointer);
    this.captureElement = undefined;
    if (this.controls) this.controls.enabled = this.ready;
    this.destination.dataset.near = 'false';
  }
  cancel = () => {
    if (!this.drag) return;
    this.releaseCapture();
    this.staged.visible = false;
    this.positionStage();
    this.invalidate();
  };
  animateToStage(from: Point) {
    this.animate(from, this.stagePoint(), this.staged.scale.x, 1, () => {});
  }
  animate(
    from: Point,
    to: Point,
    fromScale: number,
    toScale: number,
    complete: () => void,
  ) {
    this.staged.visible = true;
    this.busy = true;
    this.controls.enabled = false;
    this.animation = {
      start: performance.now(),
      from,
      to,
      fromScale,
      toScale,
      complete,
    };
    this.emit();
    this.invalidate();
  }
  place = () => {
    if (!this.ready || !this.active || !this.current || this.busy || this.drag)
      return;
    if (this.current.workspaceId !== this.workspace) {
      this.feedback(
        this.current.workspaceId
          ? 'Open the workbench to fit this part.'
          : 'Return to the watch to fit this piece.',
      );
      return;
    }
    this.updateSeat();
    if (!this.available || !this.seatVisible || !this.seatInView) {
      this.feedback(
        this.available
          ? 'The seat is obscured. Try another view.'
          : 'That piece cannot be fitted yet.',
      );
      return;
    }
    this.stopOrbitMotion();
    const id = this.current.id;
    if (!this.staged.visible) this.positionStage();
    this.animate(
      this.project(this.staged.position),
      this.project(this.target),
      this.staged.scale.x,
      1,
      () => this.placed(id),
    );
  };
  resetView = () => {
    if (this.drag || this.busy) return;
    this.reframe(true, true);
  };
  guide = () => {
    if (this.drag || this.busy || !this.current) return;
    if (this.current.workspaceId !== this.workspace) return;
    if (!this.available) {
      this.feedback('That piece cannot be fitted yet.');
      return;
    }
    if (
      this.current.viewDirectionWorld &&
      this.detail?.id !== this.current.id
    ) {
      this.feedback('Use View dial edge to inspect this fitting point.');
      return;
    }
    const fromPosition = this.camera.position.clone(),
      fromTarget = this.controls.target.clone(),
      fromUp = this.camera.up.clone();
    this.assistance = true;
    this.side = this.current.side;
    this.reframe(false);
    // Guidance is limited to the same two fixed faces available through Flip.
    this.updateSeat();
    if (!this.seatVisible || !this.seatInView) {
      this.side = this.side === 'front' ? 'back' : 'front';
      this.reframe(false, true);
      this.updateSeat();
    }
    if (!this.media.matches) {
      this.cameraMotion = {
        start: performance.now(),
        fromPosition,
        fromTarget,
        fromUp,
        position: this.camera.position.clone(),
        target: this.controls.target.clone(),
        up: this.camera.up.clone(),
      };
      this.camera.position.copy(fromPosition);
      this.controls.target.copy(fromTarget);
      this.camera.up.copy(fromUp);
      syncOrbitUp(this.camera, this.controls);
      this.camera.lookAt(this.controls.target);
      this.camera.updateMatrixWorld();
      this.busy = true;
      this.controls.enabled = false;
    }
    this.presentContext();
    this.positionStage();
    this.invalidate();
    this.emit();
    if (!this.seatVisible)
      this.feedback(
        'This fitting point is obscured. Try Flip to inspect the other side.',
      );
  };
  flip = () => {
    if (!this.ready || this.drag || this.busy) return;
    this.stopOrbitMotion();
    const rotation = this.side === 'front' ? -Math.PI : Math.PI;
    this.side = this.side === 'front' ? 'back' : 'front';
    const axis = new THREE.Vector3(1, 0, 0);
    this.cameraMotion = {
      start: performance.now(),
      rotation,
      rotationPivot: this.frameFocus.clone(),
      fromPosition: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      fromUp: this.camera.up.clone(),
      position: this.camera.position
        .clone()
        .sub(this.frameFocus)
        .applyAxisAngle(axis, rotation)
        .add(this.frameFocus),
      target: this.controls.target
        .clone()
        .sub(this.frameFocus)
        .applyAxisAngle(axis, rotation)
        .add(this.frameFocus),
      up: this.camera.up.clone().applyAxisAngle(axis, rotation),
    };
    this.busy = true;
    this.controls.enabled = false;
    this.emit();
    this.invalidate();
  };
  stopOrbitMotion() {
    // The pinned controls retain damping deltas. Freeze them before placing a
    // piece, so the camera cannot drift under a captured pointer or a guided turn.
    const c = this.controls as OrbitControls & {
      _sphericalDelta?: THREE.Spherical;
      _panOffset?: THREE.Vector3;
      _scale?: number;
    };
    c._sphericalDelta?.set(0, 0, 0);
    c._panOffset?.set(0, 0, 0);
    c._scale = 1;
  }
  escapeDrag = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.drag) {
      this.cancel();
      event.preventDefault();
    }
  };
  keyDown = (event: KeyboardEvent) => {
    if (this.drag || this.busy) {
      if (event.key === 'Escape') this.cancel();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.resetView();
      return;
    }
    if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.flip();
      return;
    }
    if (['+', '=', '-'].includes(event.key)) {
      event.preventDefault();
      zoomCamera(
        this.camera,
        this.controls,
        event.key === '-' ? KEYBOARD_ZOOM_OUT : KEYBOARD_ZOOM_IN,
      );
    } else return;
    this.invalidate();
  };
  layout = () => {
    if (this.dead) return;
    const root = this.host.parentElement,
      rect = this.host.getBoundingClientRect();
    const heading = root
      ?.querySelector('.play-heading')
      ?.getBoundingClientRect();
    const dock = root
      ?.querySelector(this.active ? '.play-dock' : '.play-choice')
      ?.getBoundingClientRect();
    const landscape = rect.width / rect.height > 1.4 && rect.height < 600;
    const workspace = root
      ?.querySelector('.play-workspace')
      ?.getBoundingClientRect();
    const top =
      Math.max(heading?.bottom ?? 64, workspace?.bottom ?? 0) - rect.top + 12;
    const bottom = landscape
      ? rect.height - 20
      : (dock?.top ?? rect.bottom - 230) - rect.top - 12;
    const width = landscape
      ? (dock?.left ?? rect.right) - rect.left - 12
      : rect.width;
    const style = getComputedStyle(this.host);
    const safeLeft =
      parseFloat(style.getPropertyValue('--play-safe-left')) || 0;
    const safeRight =
      parseFloat(style.getPropertyValue('--play-safe-right')) || 0;
    const left = Math.max(12, safeLeft + 8);
    this.frameRegion = {
      top,
      bottom: Math.max(top + 80, bottom),
      left,
      width: Math.max(
        80,
        width - left - Math.max(12, landscape ? 12 : safeRight + 8),
      ),
    };
    if (this.hasFramed) this.updateProjection();
    this.updateSeat();
    this.positionStage();
    this.invalidate();
  };
  resize = () => {
    if (this.dead) return;
    this.cancel();
    const { clientWidth: w, clientHeight: h } = this.host;
    this.renderer.setSize(w, h);
    this.surfaceOcclusion?.resize(w, h);
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.layout();
    this.invalidate();
  };
  motionChanged = () => this.invalidate();
  contextLost = (event: Event) => {
    event.preventDefault();
    this.contextUnavailable = true;
    this.cameraMotion = undefined;
    this.cancel();
    this.animation = undefined;
    this.busy = false;
    this.ready = false;
    this.controls.enabled = false;
    this.error =
      'The 3D view was interrupted. Restoring it will keep your placed parts.';
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.emit();
  };
  contextRestored = () => {
    if (this.dead) return;
    try {
      this.makeEnvironment();
      this.contextUnavailable = false;
      this.ready = this.pieces.size === this.manifest.finalLeafIds.length;
      this.error = this.ready
        ? ''
        : this.error ||
          'The watch assets are incomplete. Retry to restore the assembly.';
      this.controls.enabled = this.ready;
      if (this.ready) this.update(this.fitted, this.current, this.active);
      this.invalidate();
      this.emit();
    } catch {
      this.ready = false;
      this.controls.enabled = false;
      this.error =
        'The 3D view could not be restored. Retry to keep assembling.';
      this.emit();
    }
  };
  invalidate = () => {
    if (!this.dead && !this.frame)
      this.frame = requestAnimationFrame(this.render);
  };
  render = (now: number) => {
    this.frame = 0;
    if (this.dead || this.contextUnavailable || this.error) return;
    if (this.animation) {
      const a = this.animation,
        t = this.media.matches ? 1 : Math.min(1, (now - a.start) / 220),
        eased = motionEase(t);
      this.positionStage(
        {
          x: THREE.MathUtils.lerp(a.from.x, a.to.x, eased),
          y: THREE.MathUtils.lerp(a.from.y, a.to.y, eased),
        },
        THREE.MathUtils.lerp(a.fromScale, a.toScale, eased),
      );
      if (t === 1) {
        this.animation = undefined;
        this.staged.visible = false;
        this.busy = false;
        this.controls.enabled = this.ready;
        a.complete();
        this.emit();
      } else this.invalidate();
    }
    if (this.cameraMotion) {
      const motion = this.cameraMotion;
      const t = this.media.matches
        ? 1
        : Math.min(1, (now - motion.start) / (MOTION.navigate * 1000));
      const eased = motionEase(t);
      this.controls.target.lerpVectors(motion.fromTarget, motion.target, eased);
      const offset = motion.fromPosition.clone().sub(motion.fromTarget);
      if (motion.rotation !== undefined) {
        const axis = new THREE.Vector3(1, 0, 0);
        if (motion.rotationPivot) {
          this.controls.target
            .copy(motion.fromTarget)
            .sub(motion.rotationPivot)
            .applyAxisAngle(axis, motion.rotation * eased)
            .add(motion.rotationPivot);
        }
        offset.applyAxisAngle(axis, motion.rotation * eased);
        this.camera.up
          .copy(motion.fromUp)
          .applyAxisAngle(axis, motion.rotation * eased);
      } else {
        const end = motion.position.clone().sub(motion.target),
          origin = new THREE.Vector3();
        const orientation = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(offset, origin, motion.fromUp),
        );
        orientation.slerp(
          new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().lookAt(end, origin, motion.up),
          ),
          eased,
        );
        offset
          .set(0, 0, THREE.MathUtils.lerp(offset.length(), end.length(), eased))
          .applyQuaternion(orientation);
        this.camera.up.set(0, 1, 0).applyQuaternion(orientation);
      }
      this.camera.position.copy(this.controls.target).add(offset);
      if (t === 1) {
        this.camera.position.copy(motion.position);
        this.controls.target.copy(motion.target);
        this.camera.up.copy(motion.up);
        this.cameraMotion = undefined;
        this.busy = false;
        this.controls.enabled = this.ready;
      } else this.invalidate();
      syncOrbitUp(this.camera, this.controls);
      this.camera.lookAt(this.controls.target);
      this.camera.updateMatrixWorld();
      this.updateSeat();
      this.positionStage();
      if (t === 1) this.emit();
    }
    // Orbit damping shares the explorer's feel, but only schedules while moving.
    if (!this.drag && !this.busy && this.controls.update()) this.invalidate();
    // React may have revealed/reflowed staging after the discrete update.
    if (!this.drag && !this.animation && !this.busy) this.positionStage();
    try {
      this.renderer.render(this.scene, this.camera);
      this.surfaceOcclusion?.render(this.renderer);
      this.renderCount++;
    } catch {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.ready = false;
      this.busy = false;
      this.cameraMotion = undefined;
      this.animation = undefined;
      this.controls.enabled = false;
      this.error = 'The view could not render. Retry to restore your assembly.';
      this.emit();
    }
  };
  thumbnail(step: PlayStep): string | null {
    if (!this.ready) return null;
    const cached = this.thumbnails.get(step.id);
    if (cached) return cached;
    const scene = new THREE.Scene();
    scene.environment = this.scene.environment;
    scene.environmentIntensity = this.scene.environmentIntensity;
    addStudioLights(scene);
    const bounds = this.boundsFor(step.leafIds),
      center = bounds.getCenter(new THREE.Vector3());
    for (const id of step.leafIds) {
      const piece = this.pieces.get(id)!;
      const mesh = new THREE.Mesh(piece.mesh.geometry, piece.mesh.material);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(piece.pose);
      scene.add(mesh);
    }
    const size = bounds.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.y, size.z, 0.1) * 0.72;
    const camera = new THREE.OrthographicCamera(
      -span,
      span,
      span,
      -span,
      0.001,
      1000,
    );
    camera.up.set(0, step.side === 'front' ? 1 : -1, 0);
    camera.position
      .copy(center)
      .add(
        new THREE.Vector3(0.2, -0.35, step.side === 'front' ? 1 : -1)
          .normalize()
          .multiplyScalar(span * 4 + 20),
      );
    camera.lookAt(center);
    const target = new THREE.WebGLRenderTarget(128, 128);
    const previous = this.renderer.getRenderTarget();
    try {
      this.renderer.setRenderTarget(target);
      this.renderer.clear();
      this.renderer.render(scene, camera);
      const buffer = new Uint8Array(128 * 128 * 4);
      this.renderer.readRenderTargetPixels(target, 0, 0, 128, 128, buffer);
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d')!;
      const data = context.createImageData(128, 128);
      for (let y = 0; y < 128; y++)
        data.data.set(
          buffer.subarray((127 - y) * 512, (128 - y) * 512),
          y * 512,
        );
      context.putImageData(data, 0, 0);
      const url = canvas.toDataURL();
      this.thumbnails.set(step.id, url);
      return url;
    } catch {
      this.ready = false;
      this.controls.enabled = false;
      this.error =
        'A part preview could not render. Retry to restore your assembly.';
      this.emit();
      return null;
    } finally {
      this.renderer.setRenderTarget(previous);
      target.dispose();
    }
  }
  /** Read-only diagnostics; placement tests use the same DOM pointer path as players. */
  inspect() {
    this.scene.updateMatrixWorld(true);
    const occluders = this.current ? this.occludersAt(this.seatPoint) : [];
    return {
      side: this.side,
      camera: this.camera.position.toArray(),
      cameraUp: this.camera.up.toArray(),
      cameraTarget: this.controls.target.toArray(),
      cameraMoving: !!this.cameraMotion,
      occluders,
      ready: this.ready,
      stepId: this.current?.id,
      leafIds: this.current?.leafIds,
      fitted: [...this.fitted],
      visible: [...this.pieces]
        .filter(([, p]) => p.mesh.visible)
        .map(([id]) => id),
      target: this.project(this.seatPoint),
      targetCenter: this.project(this.target),
      seatVisible: this.seatVisible,
      available: this.available,
      hints: this.hints,
      workspace: this.workspace,
      detail: this.detail?.id,
      rotationEnabled: this.controls.enableRotate,
      panEnabled: this.controls.enablePan,
      frameRegion: this.frameRegion,
      mainplateCenter: this.project(
        this.boundsFor(this.manifest.initialLeafIds).getCenter(
          new THREE.Vector3(),
        ),
      ),
      frameFocus: this.frameFocus.toArray(),
      projection: this.camera.projectionMatrix.toArray(),
      materials: [...this.pieces]
        .filter(([, p]) => p.mesh.visible)
        .map(([id, p]) => ({
          id,
          uuid: (p.mesh.material as THREE.Material).uuid,
          opacity: (p.mesh.material as THREE.Material).opacity,
          transparent: (p.mesh.material as THREE.Material).transparent,
        })),
      stage: this.stagePoint(),
      stageRendered: this.project(this.staged.position),
      stageCount: this.staged.children.length,
      stageVisible: this.staged.visible,
      stageScale: this.staged.scale.toArray(),
      busy: this.busy,
      dragging: !!this.drag,
      controlsEnabled: this.controls.enabled,
      renderCount: this.renderCount,
      scheduledFrame: !!this.frame,
      geometryCount: this.pieces.size,
      cutaway: this.cutaway,
    };
  }
  dispose() {
    if (this.dead) return;
    this.dead = true;
    ++this.generation;
    this.releaseCapture();
    if (this.frame) cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.controls?.removeEventListener('change', this.cameraChanged);
    this.controls?.dispose();
    this.clearPieces();
    this.environment?.dispose();
    this.ghostMaterial.dispose();
    this.surfaceOcclusion?.dispose();
    window.removeEventListener('keydown', this.escapeDrag);
    this.renderer.domElement.removeEventListener(
      'webglcontextlost',
      this.contextLost,
    );
    this.renderer.domElement.removeEventListener(
      'webglcontextrestored',
      this.contextRestored,
    );
    this.renderer.domElement.removeEventListener('keydown', this.keyDown);
    this.media.removeEventListener('change', this.motionChanged);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
