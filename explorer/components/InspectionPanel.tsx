'use client';
import { useEffect, useRef, useState } from 'react';
import type {
  MovementViewer,
  ViewerSnapshot,
} from '@/src/viewer/MovementViewer';
import { runUxChecks } from '@/src/viewer/uxValidation';
import {
  runDisassemblyChecks,
  runDisassemblyTransitionChecks,
} from '@/src/viewer/disassemblyValidation';
import { runExplosionChecks } from '@/src/viewer/explosionValidation';
import { runWatchChecks } from '@/src/viewer/watchValidation';
import { runDialChecks } from '@/src/viewer/dialValidation';
import { runInventoryChecks } from '@/src/viewer/inventoryValidation';
import { runCameraChecks } from '@/src/viewer/cameraValidation';
import { startBenchmark } from '@/src/viewer/benchmark';
import { runBrowserChecks } from '@/src/viewer/validation';
import { captureMotion, type MotionCase } from '@/src/viewer/capture';
import {
  FROST_VIEWS,
  frostReviewView,
  recordFrostMotion,
} from '@/src/viewer/frostReview';
import { runFrostChecks } from '@/src/viewer/frostValidation';

/** Opt-in diagnostics are excluded from the ordinary page's static imports. */
export default function InspectionPanel({
  viewer,
  state: s,
}: {
  viewer: () => MovementViewer | null;
  state: ViewerSnapshot;
}) {
  const [qa, setQa] = useState<unknown>(null);
  const [motion, setMotion] = useState<unknown>(null);
  const recoveryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(recoveryTimer.current), []);
  async function run(task: (v: MovementViewer) => unknown, report = setQa) {
    const v = viewer();
    if (!v || v.dead) return;
    report({ running: true });
    try {
      const result = await task(v);
      if (!v.dead) report(result);
    } catch (error) {
      if (!v.dead) report({ error: String(error) });
    }
  }
  const available = s.ready && !s.error && s.loadStage === 'ready';
  return (
    <details className="inspection">
      <summary>Inspection tools</summary>
      <button onClick={() => viewer() && setQa(runFrostChecks(viewer()!))}>
        Run frost checks
      </button>
      {FROST_VIEWS.map((view) => (
        <button
          key={view}
          onClick={() => void run((v) => frostReviewView(v, view))}
        >
          Frost {view}
        </button>
      ))}
      <button onClick={() => void run((v) => recordFrostMotion(v), setMotion)}>
        Record frosting motion
      </button>
      <button onClick={() => void run((v) => runInventoryChecks(v))}>
        Run inventory checks
      </button>
      <button onClick={() => void run((v) => runCameraChecks(v))}>
        Run camera checks
      </button>
      <button onClick={() => void run((v) => runUxChecks(v))}>
        Run UX checks
      </button>
      {(
        [
          'separate',
          'scrub',
          'spread',
          'interrupt',
          'dials',
          'flip',
        ] as MotionCase[]
      ).map((kind) => (
        <button
          key={kind}
          onClick={() => void run((v) => captureMotion(v, kind), setMotion)}
        >
          Record {kind}
        </button>
      ))}
      <pre id="motion-report" hidden>
        {JSON.stringify(motion)}
      </pre>
      <div>
        <button onClick={() => viewer()?.view('front')}>Front reference</button>
        <button onClick={() => viewer()?.view('back')}>Back reference</button>
        <button onClick={() => viewer()?.view('side')}>Side reference</button>
        <button onClick={() => viewer()?.view('oblique')}>
          Oblique reference
        </button>
      </div>
      <button onClick={() => void run((v) => runExplosionChecks(v))}>
        Run explosion checks
      </button>
      <button onClick={() => void run((v) => runDisassemblyChecks(v))}>
        Run disassembly review
      </button>
      <button
        onClick={() => void run((v) => runDisassemblyTransitionChecks(v))}
      >
        Run disassembly transitions
      </button>
      <button onClick={() => void run((v) => runDialChecks(v))}>
        Run dial checks
      </button>
      <button onClick={() => void run((v) => runWatchChecks(v))}>
        Run watch checks
      </button>
      <button onClick={() => void run((v) => runBrowserChecks(v))}>
        Run interaction checks
      </button>
      <button
        onClick={() => {
          const v = viewer();
          if (v) v.benchmark = startBenchmark(v, 60);
        }}
      >
        Benchmark 60 seconds
      </button>
      <button
        onClick={() => {
          const v = viewer();
          if (v) v.benchmark = startBenchmark(v, 300);
        }}
      >
        Benchmark 5 minutes
      </button>
      <button
        disabled={s.catalogLoaded || !available}
        onClick={async () => {
          const v = viewer();
          if (!v) return;
          const path = v.paths.catalog;
          v.paths.catalog = '/models/intentionally-missing-dials.glb';
          try {
            await v.configureDials({ dialsVisible: true });
          } finally {
            v.paths.catalog = path;
          }
        }}
      >
        Test dial failure
      </button>
      <button
        disabled={s.catalogLoaded}
        onClick={async () => {
          const v = viewer();
          if (!v) return;
          const path = v.paths.catalog;
          v.paths.catalog = '/models/intentionally-missing-catalog.glb';
          try {
            await v.loadCatalog();
          } catch {
          } finally {
            v.paths.catalog = path;
          }
        }}
      >
        Test catalog failure
      </button>
      <button
        onClick={() => {
          const ext = viewer()
            ?.renderer.getContext()
            .getExtension('WEBGL_lose_context');
          if (ext) {
            ext.loseContext();
            clearTimeout(recoveryTimer.current);
            recoveryTimer.current = setTimeout(
              () => ext.restoreContext(),
              1200,
            );
          }
        }}
      >
        Test context recovery
      </button>
      <pre id="qa-report">{JSON.stringify(qa, null, 2)}</pre>
      <pre id="benchmark-report">
        {JSON.stringify(s.benchmarkResult ?? s.stats, null, 2)}
      </pre>
    </details>
  );
}
