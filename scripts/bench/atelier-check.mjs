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
  report.geometry = await page.evaluate(async (phases) => {
    const b = window.bench,
      manifest = await (await fetch('/models/assembly-manifest.json')).json();
    const byId = new Map(manifest.instances.map((p) => [p.id, p]));
    for (const solid of b.world.solids)
      solid.mesh.geometry.boundsTree = solid.tree;
    const stations = [];
    for (const station of b.stations) {
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
        expectedWorld[0][3] += bridge ? -24 : 38;
        expectedWorld[1][3] += bridge ? 12.2 : 16.3;
        expectedWorld[2][3] += bridge ? 12 : -6;
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
          (s.mesh.userData.stationId === station.id &&
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
    const shared = b.stations[0].movement.children.every((a) => {
      const c = b.stations[1].movement.children.find(
        (c) => c.userData.partId === a.userData.partId,
      );
      return (
        c &&
        a !== c &&
        a.geometry === c.geometry &&
        a.material === c.material &&
        a.userData.instanceId !== c.userData.instanceId
      );
    });
    return {
      environment,
      shared,
      stations,
      solids: b.world.solids.length,
      trees: b.world.trees.size,
      environmentMeshes: b.world.solids.filter(
        (s) => s.mesh.userData.collisionRole,
      ).length,
    };
  }, phases);
  for (const s of report.geometry.stations) {
    assert.equal(s.count, 227);
    assert.equal(s.crowns.length, 4);
    assert.ok(s.stemClearances.every((c) => !c.intersects));
    assert.equal(s.changed.length, 18);
    assert.ok(s.matrixError < 1e-12);
    assert.ok(s.collisionError < 1e-12);
    assert.ok(s.worldMatrixError < 1e-12);
    assert.ok(s.drops.every((d) => d.pass));
    // Preserve genuine source-holder conflicts as blocking evidence; still capture the review.
    const conflicts = s.clearances.filter((c) => c.intersects);
    report.checks.push({
      name:
        s.id + ' source crown/holder fit remains unresolved by owner decision',
      pass: false,
      conflicts,
    });
    assert.deepEqual(conflicts.map((c) => c.crown.split('_').at(-1)).sort(), [
      '1',
      '3',
      '4',
    ]);
    assert.ok(
      conflicts.every(
        (c) =>
          c.target === (s.id === 'bridge' ? 'movement' : 'dial') + '-holder',
      ),
    );
    assert.ok(
      s.clearances
        .filter((c) => !c.target.endsWith('-holder'))
        .every((c) => !c.intersects),
    );
  }
  assert.ok(report.geometry.stations[1].lowerOpenings > 0);
  assert.ok(report.geometry.shared);
  assert.ok(
    report.geometry.environment.every(
      (e) => e.collides === (e.role !== 'decor'),
    ),
  );
  // Former rail locations are now freely walkable. Outer edges remain real drops.
  report.boundaries = await page.evaluate(() => {
    const b = window.bench,
      rows = [];
    for (const [id, x, z, key] of [
      ['open worktop at former west rail', -50, -5, 'KeyA'],
      ['open worktop north of dial', 14, -32, 'KeyD'],
      ['visible outer edge has no invisible wall', 86, 40, 'KeyD'],
    ]) {
      b.walker.clear();
      b.walker.feet.set(x, 13.502, z);
      b.walker.grounded = true;
      b.walker.yaw = 0;
      b.walker.keys.add(key);
      for (let i = 0; i < 180; i++) b.walker.update(1 / 180);
      rows.push({
        id,
        feet: b.walker.feet.toArray(),
        pass:
          Math.abs(b.walker.feet.x - x) > 5 &&
          (x === 86 ? b.walker.feet.y < 13 : b.walker.grounded),
      });
    }
    b.walker.clear();
    return rows;
  });
  assert.ok(report.boundaries.every((b) => b.pass));
  await page.addStyleTag({
    content:
      '.bench-menu,.bench-header,.bench-legend,.bench-reticle{display:none!important}',
  });
  const views = [
    ['overall', [-85, 85, 110], [0, 8, 10]],
    ['pair-detail', [-52, 54, 68], [4, 12, 4]],
    ['circulation', [0, 150, 10], [0, 0, 10]],
    ['arrival', [-64, 14.98, 40], [-24, 17, 12]],
    ['approach', [-65, 16.48, 12], [-24, 17, 12]],
    ['worktop', [-35, 14.98, -18], [38, 16, -6]],
    ['bridge-entry', [-39, 19.08, 12], [-22, 17, 12]],
    ['dial-entry', [20.8, 17.38, -6], [38, 15.7, -6]],
    ['bridge-crown', [5, 16.48, 18], [-1, 14, 12]],
    ['dial-crown', [68, 17.38, 0], [60, 15, -6]],
  ];
  report.views = views;
  for (const [name, eye, target] of views) {
    const cameraRecord = await page.evaluate(
      ({ name, eye, target }) => {
        const b = window.bench;
        b.walker.clear();
        b.walker.grounded = true;
        cancelAnimationFrame(b.frame);
        b.frame = 0;
        const floor = b.world.floor(eye[0], eye[2], 100);
        const atEyeHeight = !['overall', 'pair-detail', 'circulation'].includes(
          name,
        );
        if (atEyeHeight) eye[1] = floor + 1.48;
        // Aerial review cameras are ~150 mm away: the walking near plane loses
        // depth precision between the thin mat and timber at that distance.
        // Actual eye-height captures retain the unchanged runtime near plane.
        b.camera.near = atEyeHeight ? 0.035 : 0.5;
        b.camera.updateProjectionMatrix();
        b.camera.position.set(...eye);
        b.camera.lookAt(...target);
        b.renderer.render(b.scene, b.camera);
        return { name, eye, target, floor, atEyeHeight, near: b.camera.near };
      },
      { name, eye, target },
    );
    (report.cameras ||= []).push(cameraRecord);
    await page.screenshot({ path: out + '/' + name + '.png' });
  }
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
