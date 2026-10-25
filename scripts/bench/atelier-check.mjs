/** Independent source-pose, triangle-clearance and screenshot fixtures; headless only. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : 'playwright'
);
const out = process.env.PLAY_QA_OUTPUT || 'artifacts/paired-atelier';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const report = { checks: [], errors: [] };
page.on('pageerror', (e) => report.errors.push(e.message));
const layout = JSON.parse(await fs.readFile('assets/authored/atelier-layout.json'));
const workshop = JSON.parse(
  await fs.readFile('assets/source-manifest/workshop-environment.json'),
);
const phases = JSON.parse(
  await fs.readFile('assets/authored/wheel-display-poses.json'),
).wheels;
try {
  await page.goto(
    (process.argv[2] || 'http://127.0.0.1:4182') + '/bench?inspect=1',
  );
  await page.waitForFunction(
    () => window.bench?.status.ready || window.bench?.status.error,
    null,
    {
      timeout: 90000,
    },
  );
  assert.equal(await page.evaluate(() => window.bench.status.error), '');
  report.geometry = await page.evaluate(async ({ phases, layout }) => {
    const b = window.bench,
      manifest = await (await fetch('/models/assembly-manifest.json')).json();
    const byId = new Map(manifest.instances.map((p) => [p.id, p]));
    for (const solid of b.world.solids)
      solid.mesh.geometry.boundsTree = solid.tree;
    const stations = [];
    for (const spec of layout.stations) {
      b.flip.setRest(spec.id);
      const station = { ...spec, ...b.station, holder: b.station.holders[spec.id] };
      let matrixError = 0,
        collisionError = 0,
        worldMatrixError = 0;
      const changed = [],
        crowns = [],
        clearances = [];
      for (const mesh of station.movement.children) {
        const source = byId.get(mesh.userData.partId).worldTransform;
        const expected = source.map((row) => [...row]);
        const phase = phases.find((p) => p.leafId === mesh.userData.partId);
        if (phase) {
          if (phase.pivotLocalMm.some((v) => v !== 0))
            throw Error('Nonzero pivot requires independent audit');
          const a = (phase.localZDegrees * Math.PI) / 180,
            c = Math.cos(a),
            s = Math.sin(a);
          for (let r = 0; r < 3; r++) {
            expected[r][0] = source[r][0] * c + source[r][1] * s;
            expected[r][1] = -source[r][0] * s + source[r][1] * c;
          }
          changed.push(mesh.userData.partId);
        }
        matrixError = Math.max(
          matrixError,
          ...mesh.matrix.elements.map((v, i) =>
            Math.abs(v - expected[i % 4][Math.floor(i / 4)]),
          ),
        );
        const bridge = station.id === 'bridge';
        const expectedWorld = [
          expected[0].slice(),
          expected[2].map((v) => v * (bridge ? -1 : 1)),
          expected[1].map((v) => v * (bridge ? 1 : -1)),
          [0, 0, 0, 1],
        ];
        const spec = layout.stations.find((s) => s.id === station.id);
        expectedWorld[0][3] += spec.x;
        expectedWorld[1][3] += spec.seat;
        expectedWorld[2][3] += spec.z;
        worldMatrixError = Math.max(
          worldMatrixError,
          ...mesh.matrixWorld.elements.map((v, i) =>
            Math.abs(v - expectedWorld[i % 4][Math.floor(i / 4)]),
          ),
        );
        const solid = b.world.solids.find((s) => s.mesh === mesh);
        const identity = solid.inverse.clone().multiply(mesh.matrixWorld);
        collisionError = Math.max(
          collisionError,
          ...identity.elements.map((v, i) =>
            Math.abs(v - (i % 5 === 0 ? 1 : 0)),
          ),
        );
        if (mesh.userData.packet === 'crown') {
          crowns.push({
            id: mesh.userData.partId,
            instanceId: mesh.userData.instanceId,
            min: solid.bounds.min.toArray(),
            max: solid.bounds.max.toArray(),
          });
          const targets = b.world.solids.filter(
            (s) =>
              s.mesh === station.holder.children[0] ||
              s.mesh.userData.collisionRole,
          );
          for (const target of targets) {
            const transform = solid.inverse
              .clone()
              .multiply(target.mesh.matrixWorld);
            const intersects = solid.tree.intersectsGeometry(
              target.mesh.geometry,
              transform,
            );
            const closest = solid.tree.closestPointToGeometry(
              target.mesh.geometry,
              transform,
              {},
              {},
              0,
              40,
            );
            clearances.push({
              crown: mesh.userData.partId,
              target: target.mesh.name,
              intersects,
              distance: closest?.distance ?? null,
            });
          }
        }
      }
      const holder = station.holder.children[0];
      const holderSolid = b.world.solids.find((s) => s.mesh === holder);
      // Independent +90 Y / −90 X composition, including station translation.
      const expectedHolder = [
        [0, -1, 0, station.x],
        [0, 0, 1, 0],
        [-1, 0, 0, station.z],
        [0, 0, 0, 1],
      ];
      const holderMatrixError = Math.max(
        ...holder.matrixWorld.elements.map((v, i) =>
          Math.abs(v - expectedHolder[i % 4][Math.floor(i / 4)]),
        ),
      );
      const holderIdentity = holderSolid.inverse
        .clone()
        .multiply(holder.matrixWorld);
      const holderCollisionError = Math.max(
        ...holderIdentity.elements.map((v, i) =>
          Math.abs(v - (i % 5 === 0 ? 1 : 0)),
        ),
      );
      const holderSurfaceContacts = station.movement.children
        .filter((mesh) => {
          const solid = b.world.solids.find((s) => s.mesh === mesh);
          return solid.tree.intersectsGeometry(
            holder.geometry,
            solid.inverse.clone().multiply(holder.matrixWorld),
          );
        })
        .map((mesh) => mesh.userData.partId);
      const stem = station.movement.children.find((m) =>
        m.userData.partId.endsWith('__0_1_1_83_27'),
      );
      const stemSolid = b.world.solids.find((s) => s.mesh === stem);
      const stemClearances = b.world.solids
        .filter((s) => s.mesh.userData.collisionRole)
        .map((target) => ({
          target: target.mesh.name,
          intersects: stemSolid.tree.intersectsGeometry(
            target.mesh.geometry,
            stemSolid.inverse.clone().multiply(target.mesh.matrixWorld),
          ),
        }));
      const envelopeSolids = b.world.solids.filter(
        (s) =>
          s.mesh === stem ||
          s.mesh === station.holder.children[0] ||
          (s.mesh.userData.stationId === 'movement' &&
            s.mesh.userData.packet === 'crown'),
      );
      const envelope = {
        min: [0, 1, 2].map((i) =>
          Math.min(...envelopeSolids.map((s) => s.bounds.min.toArray()[i])),
        ),
        max: [0, 1, 2].map((i) =>
          Math.max(...envelopeSolids.map((s) => s.bounds.max.toArray()[i])),
        ),
      };
      const drops = [];
      for (const [x, z] of [
        [-12, 0],
        [-6, 5],
        [6, 10],
        [-10, -5],
        [3, 8],
        [8, 8],
        [-8, 4],
        [10, -4],
      ]) {
        const wx = x + station.x,
          wz = z + station.z,
          floor = b.world.floor(wx, wz);
        b.walker.clear();
        b.walker.feet.set(wx, floor + 0.5, wz);
        b.walker.grounded = false;
        for (let i = 0; i < 180; i++) b.walker.update(1 / 180);
        drops.push({
          x,
          z,
          floor,
          feet: b.walker.feet.toArray(),
          grounded: b.walker.grounded,
          pass: b.walker.feet.y >= floor - 0.08,
        });
      }
      const heights = [];
      for (let x = -12; x <= 12; x++)
        for (let z = -12; z <= 12; z++)
          if (x * x + z * z < 180)
            heights.push(b.world.floor(x + station.x, z + station.z));
      stations.push({
        id: station.id,
        count: station.movement.children.length,
        changed,
        matrixError,
        worldMatrixError,
        collisionError,
        crowns,
        clearances,
        stemClearances,
        holderMatrixError,
        holderCollisionError,
        holderSurfaceContacts,
        envelope,
        drops,
        heightRange: [Math.min(...heights), Math.max(...heights)],
        lowerOpenings: heights.filter((y) => y < 15.5).length,
      });
    }
    const environment = [];
    b.scene.traverse((node) => {
      if (node.geometry && node.userData.atelierVersion)
        environment.push({
          name: node.name,
          role: node.userData.collisionRole,
          triangles:
            (node.geometry.index?.count ||
              node.geometry.attributes.position.count) / 3,
          material: node.material.name,
          hasAlbedoMap: !!node.material.map,
          collides: b.world.solids.some((s) => s.mesh === node),
        });
    });
    const single = b.station.movement.children.length === 219 &&
      b.world.solids.filter((s) => s.mesh.userData.stationId === 'movement').length === 219;
    b.flip.setRest('bridge');
    return {
      environment,
      single,
      stations,
      solids: b.world.solids.length,
      trees: b.world.trees.size,
      environmentMeshes: b.world.solids.filter(
        (s) => s.mesh.userData.collisionRole,
      ).length,
    };
  }, { phases, layout });
  for (const s of report.geometry.stations) {
    assert.equal(s.count, 219);
    assert.equal(s.crowns.length, 4);
    assert.ok(s.stemClearances.every((c) => !c.intersects));
    assert.equal(s.changed.length, 18);
    assert.ok(s.matrixError < 1e-12);
    assert.ok(s.collisionError < 1e-12);
    assert.ok(s.worldMatrixError < 1e-12);
    assert.ok(s.drops.every((d) => d.pass));
    assert.ok(s.holderMatrixError < 1e-12);
    assert.ok(s.holderCollisionError < 1e-12);
    assert.ok(s.clearances.every((c) => !c.intersects));
    assert.deepEqual(
      s.holderSurfaceContacts,
      s.id === 'bridge'
        ? ['p_0_1_1_1__0_1_1_1_4__0_1_1_83_54__0_1_1_194_1']
        : [],
    );
    report.checks.push({
      name: s.id + ' crown and underside surface clearance',
      pass: true,
    });
    // Bridge mainplate surface contact is expected seating. Separate original-STEP
    // common-volume + support-witness checks distinguish seating from penetration.
  }
  assert.ok(report.geometry.stations[1].lowerOpenings > 0);
  assert.ok(report.geometry.single);
  assert.ok(
    report.geometry.environment.every(
      (e) => e.collides === (e.role !== 'decor'),
    ),
  );
  assert.equal(report.geometry.environment.length, workshop.budgets.drawsPerPass);
  assert.equal(
    report.geometry.environment.reduce((n, e) => n + e.triangles, 0),
    workshop.budgets.visibleTriangles,
  );
  assert.ok(report.geometry.environment.filter(e => e.collides)
    .reduce((n, e) => n + e.triangles, 0) <= 8000);
  for (const material of ['Oak', 'Stand oak', 'Matte green'])
    assert.ok(report.geometry.environment.some(e => e.material === material && e.hasAlbedoMap));
  // Boundary and actual first-person captures live in jetpack-check.mjs.
  assert.deepEqual(report.errors, []);
  console.log(
    JSON.stringify(
      report.geometry.stations.map((s) => ({
        id: s.id,
        count: s.count,
        matrixError: s.matrixError,
        minCrownClearance: Math.min(
          ...s.clearances.map((c) => c.distance ?? 40),
        ),
      })),
      null,
      2,
    ),
  );
} finally {
  await fs.writeFile(
    out + '/geometry-report.json',
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
