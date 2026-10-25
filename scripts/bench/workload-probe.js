/* Local inspection harness, loaded only by QA. No production imports.
 * Native runs observe real input; scripted runs label placements/DOM input.
 * Keep startup/transition frames, bounded raw samples, asynchronous GPU queries.
 */
window.installBenchProbe = function (label) {
  const b = window.bench,
    r = b.renderer,
    gl = r.getContext();
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const report = {
    label,
    userAgent: navigator.userAgent,
    viewport: [innerWidth, innerHeight],
    dpr: devicePixelRatio,
    gpu: debug && gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),
    depth: r.capabilities.reversedDepthBuffer ? "reversed" : "logarithmic",
    timerAvailable: !!ext,
    quality: b.status.quality,
    transmission: r.transmissionResolutionScale,
    samples: [],
    events: [],
    longTasks: [],
    disjoint: 0,
  };
  let phase = "native",
    last = 0,
    inputAt = 0,
    physics = 0,
    flip = 0,
    stopped = false;
  const queries = [],
    render = r.render,
    update = b.walker.update,
    turn = b.flip.update;
  const autoReset = r.info.autoReset;
  r.info.autoReset = false;
  b.walker.update = function (...a) {
    const t = performance.now();
    const result = update.apply(this, a);
    physics += performance.now() - t;
    return result;
  };
  b.flip.update = function (...a) {
    const t = performance.now();
    const result = turn.apply(this, a);
    flip += performance.now() - t;
    return result;
  };
  const onInput = (e) => {
    if (!b.status.captured) return;
    if (!inputAt) inputAt = performance.now();
    if (e.type === "keydown" && !e.repeat)
      report.events.push({ at: performance.now(), key: e.code, phase });
  };
  document.addEventListener("mousemove", onInput);
  document.addEventListener("keydown", onInput);
  let observer;
  if (PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
    observer = new PerformanceObserver((list) =>
      report.longTasks.push(
        ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration, phase })),
      ),
    );
    observer.observe({ type: "longtask", buffered: true });
  }
  r.render = function (...a) {
    const now = performance.now();
    if (ext && gl.getParameter(ext.GPU_DISJOINT_EXT)) {
      report.disjoint++;
      for (const { q } of queries.splice(0)) gl.deleteQuery(q);
    }
    while (queries.length && gl.getQueryParameter(queries[0].q, gl.QUERY_RESULT_AVAILABLE)) {
      const { q, sample } = queries.shift();
      sample.gpu = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
      gl.deleteQuery(q);
    }
    const sample = {
      phase,
      at: now,
      interval: last ? now - last : null,
      physics,
      flip,
      inputAge: inputAt ? now - inputAt : null,
      focused: document.hasFocus(),
      hidden: document.hidden,
      viewport: [innerWidth, innerHeight],
      captured: b.status.captured,
      keys: [...b.walker.keys].join(","),
      turning: b.flip.active,
      ratio: r.getPixelRatio(),
      quality: b.status.quality,
      programs: r.info.programs.length,
      memory: { ...r.info.memory },
      feet: b.walker.feet.toArray(),
      yaw: b.walker.yaw,
      pitch: b.walker.pitch,
    };
    last = now;
    inputAt = physics = flip = 0;
    r.info.reset();
    const q = ext && queries.length < 8 ? gl.createQuery() : null;
    if (q) gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
    const start = performance.now();
    render.apply(this, a);
    if (q) {
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      queries.push({ q, sample });
    }
    sample.cpu = performance.now() - start;
    sample.calls = r.info.render.calls;
    sample.triangles = r.info.render.triangles;
    report.samples.push(sample);
    if (report.samples.length > 40000) throw Error("Probe sample bound exceeded");
  };
  const api = {
    report,
    phase(name) {
      phase = name;
      last = inputAt = 0;
      report.events.push({ phase, at: performance.now() });
    },
    async stop() {
      if (stopped) return report;
      stopped = true;
      r.render = render;
      b.walker.update = update;
      b.flip.update = turn;
      r.info.autoReset = autoReset;
      document.removeEventListener("mousemove", onInput);
      document.removeEventListener("keydown", onInput);
      observer?.disconnect();
      for (const { q } of queries) gl.deleteQuery(q);
      await fetch("http://127.0.0.1:4201/report", { method: "POST", body: JSON.stringify(report) });
      return report;
    },
  };
  window.benchProbe = api;
  return api;
};
window.runBenchWorkload = async function (label, diagnostics = false) {
  const b = window.bench,
    p = installBenchProbe(label);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const place = (xyz, yaw, pitch, side = "bridge") => {
    b.clearInput();
    b.walker.velocity.set(0, 0, 0);
    b.flip.setRest(side);
    b.walker.feet.fromArray(xyz);
    b.walker.yaw = yaw;
    b.walker.pitch = pitch;
    b.walker.grounded = false;
    b.status.captured = true;
    b.emit();
    b.wake();
  };
  let timer;
  const sample = async (name, xyz, yaw, pitch, keys = [], seconds = 8, side = "bridge") => {
    p.phase(name);
    place(xyz, yaw, pitch, side);
    const start = performance.now();
    timer = setInterval(() => {
      const phase = Math.floor((performance.now() - start) / 700) % 2 ? -1 : 1;
      b.walker.keys = new Set(
        keys.map((k) => (k === "alternate" ? (phase > 0 ? "KeyW" : "KeyS") : k)),
      );
      document.dispatchEvent(
        new MouseEvent("mousemove", { movementX: phase * 3, movementY: phase * 0.4 }),
      );
      b.wake();
    }, 8);
    await sleep(seconds * 1000);
    clearInterval(timer);
    b.walker.clear();
  };
  try {
    for (let repeat = 0; repeat < (diagnostics ? 1 : window.benchWorkloadRepeats || 2); repeat++) {
      await sample(`arrival-${repeat}`, [0, 0.002, 54], 0, 0.08, [], 6);
      await sample(`walk-${repeat}`, [25, 0.002, 40], 0, -0.12, ["alternate"], 10);
      await sample(`run-${repeat}`, [25, 0.002, 40], 0, -0.12, ["alternate", "ShiftLeft"], 10);
      await sample(`flight-${repeat}`, [25, 0.002, 40], 0, 0.2, ["Space", "KeyW"], 6);
      await sample(`wood-${repeat}`, [-20, -0.998, 67], -1.2, -0.35, [], 10);
      await sample(`stand-${repeat}`, [91, 2.002, 16], 0.35, -0.45, [], 10);
      await sample(
        `cad-bridge-${repeat}`,
        [-8, b.world.floor(-8, -7) + 0.002, -7],
        -Math.PI / 2,
        -0.55,
        ["alternate"],
        10,
      );
      await sample(
        `cad-dial-${repeat}`,
        [-8, 20, -7],
        -Math.PI / 2,
        -0.55,
        ["alternate"],
        10,
        "dial",
      );
      for (const side of ["dial", "bridge"]) {
        p.phase(`flip-from-${side}-${repeat}`);
        place([0, 0.002, 40], 0, 0.2, side);
        if (!b.startFlip()) throw Error('Clear fixture failed to start flip');
        await sleep(4800);
        if (b.flip.active) throw Error('Flip exceeded the transition budget');
      }
      p.phase(`pause-${repeat}`);
      b.pause();
      await sleep(2000);
      await sample(`resume-${repeat}`, [0, 0.002, 54], 0, 0.08, ["alternate"], 5);
    }
    if (diagnostics) {
      const woods = [];
      b.scene.traverse((o) => {
        if (o.material && ["Oak", "Stand oak", "Matte green"].includes(o.material.name))
          woods.push(o.material);
      });
      const saved = woods.map((m) => [m, m.onBeforeCompile, m.customProgramCacheKey]);
      for (const [m] of saved) {
        m.onBeforeCompile = () => {};
        m.customProgramCacheKey = () => "diagnostic-no-surface";
        m.needsUpdate = true;
      }
      await sample("diagnostic-no-surface", [-20, -0.998, 67], -1.2, -0.35, [], 10);
      for (const [m, onBeforeCompile, customProgramCacheKey] of saved) {
        Object.assign(m, { onBeforeCompile, customProgramCacheKey, needsUpdate: true });
      }
      const transmission = [];
      b.scene.traverse((o) => {
        if (o.material?.transmission > 0 && !transmission.some(([m]) => m === o.material))
          transmission.push([o.material, o.material.transmission]);
      });
      for (const [m] of transmission) {
        m.transmission = 0;
        m.needsUpdate = true;
      }
      await sample(
        "diagnostic-no-transmission",
        [-8, 20, -7],
        -Math.PI / 2,
        -0.55,
        ["alternate"],
        10,
        "dial",
      );
      for (const [m, v] of transmission) {
        m.transmission = v;
        m.needsUpdate = true;
      }
      const before = b.scene.onBeforeRender;
      b.scene.onBeforeRender = () => {};
      b.renderer.shadowMap.needsUpdate = false;
      p.phase("diagnostic-frozen-shadow-flip");
      place([0, 0.002, 40], 0, 0.2);
      b.startFlip();
      await sleep(4800);
      b.scene.onBeforeRender = before;
    }
  } finally {
    clearInterval(timer);
    b.pause();
    await p.stop();
  }
};
window.compareBenchTransmission = async function (label) {
  const b = bench,
    p = installBenchProbe(label),
    saved = b.renderer.transmissionResolutionScale;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    for (const scale of [0.5, 0.25, 0.5, 0.25]) {
      p.phase("transmission-" + scale + "-" + p.report.events.length);
      b.quality("High");
      b.renderer.setPixelRatio(1);
      b.detail.ratio = 1;
      b.renderer.transmissionResolutionScale = scale;
      b.clearInput();
      b.flip.setRest("bridge");
      b.walker.feet.set(-8, b.world.floor(-8, -7) + 0.002, -7);
      b.walker.velocity.set(0, 0, 0);
      b.walker.yaw = -Math.PI / 2;
      b.walker.pitch = -0.55;
      b.status.captured = true;
      b.emit();
      b.wake();
      const start = performance.now();
      const timer = setInterval(() => {
        const sign = Math.floor((performance.now() - start) / 700) % 2 ? -1 : 1;
        b.walker.keys = new Set([sign > 0 ? "KeyW" : "KeyS"]);
        document.dispatchEvent(
          new MouseEvent("mousemove", { movementX: sign * 3, movementY: sign * 0.4 }),
        );
        b.wake();
      }, 8);
      await sleep(10000);
      clearInterval(timer);
    }
  } finally {
    b.renderer.transmissionResolutionScale = saved;
    b.pause();
    b.quality("Auto");
    await p.stop();
  }
};
window.recordNativeBench = function (label, duration = 90000) {
  bench.reset();
  bench.quality("Auto");
  const p = installBenchProbe(label);
  p.report.workload =
    "Native OS keyboard/pointer actions through the visible Firefox window; idle gaps separated.";
  const down = (e) => {
    if (!e.repeat) p.phase("native-" + e.code + "-" + p.report.events.length);
  };
  const up = (e) => p.phase("settle-" + e.code + "-" + p.report.events.length);
  document.addEventListener("keydown", down);
  document.addEventListener("keyup", up);
  setTimeout(async () => {
    document.removeEventListener("keydown", down);
    document.removeEventListener("keyup", up);
    await p.stop();
  }, duration);
  return p;
};
window.recordBenchReentries = function (label, count = 3) {
  const proto = Object.getPrototypeOf(bench),
    load = proto.load;
  let visit = 0;
  proto.load = async function (...args) {
    const b = this,
      r = b.renderer,
      render = r.render,
      start = performance.now();
    const report = {
      label: label + "-" + ++visit,
      viewport: [innerWidth, innerHeight],
      dpr: devicePixelRatio,
      userAgent: navigator.userAgent,
      samples: [],
      events: [],
      disjoint: 0,
      workload: "Native link/back SPA re-entry, existing browser cache",
    };
    r.render = function (...a) {
      const t = performance.now(),
        before = r.info.programs.length;
      render.apply(this, a);
      report.samples.push({
        phase: "loading",
        at: t,
        cpu: performance.now() - t,
        ready: b.status.ready,
        programsBefore: before,
        programs: r.info.programs.length,
        memory: { ...r.info.memory },
        focused: document.hasFocus(),
        hidden: document.hidden,
      });
    };
    try {
      return await load.apply(this, args);
    } finally {
      report.readyMs = performance.now() - start;
      setTimeout(async () => {
        r.render = render;
        await fetch("http://127.0.0.1:4201/report", {
          method: "POST",
          body: JSON.stringify(report),
        });
      }, 300);
      if (visit >= count) proto.load = load;
    }
  };
};
