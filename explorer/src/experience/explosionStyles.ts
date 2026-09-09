import {
  EXPLOSION,
  explosionOffsets,
  stageProgress,
  type ExplosionState,
} from './explosion';
import type { Part } from './catalog';

export const EXPLOSION_STYLES = [
  {
    id: 'current',
    label: 'Current',
    description: 'Mounting-axis release, including individual screws.',
  },
  {
    id: 'layers',
    label: 'Axial layers',
    description:
      'A quiet depth reveal. Assemblies stay aligned; screws travel with their hosts.',
  },
  {
    id: 'islands',
    label: 'Assembly islands',
    description:
      'Lift, then spread into a readable overview of complete assemblies.',
  },
  {
    id: 'guided',
    label: 'Guided reveal',
    description:
      'Bridges, balance, barrels, then the smaller mechanisms. One group leads each beat.',
  },
] as const;
export type ExplosionStyle = (typeof EXPLOSION_STYLES)[number]['id'];
type Vec3 = [number, number, number];
// Presentation studies only: parking destinations do not represent service paths.
// Every leaf in a host receives exactly the same translation, including fasteners.
const packets = [
  {
    hosts: [
      'train-bridge',
      'barrel-bridge',
      'rear-display',
      'center-bridge',
      'pallet-bridge',
    ],
    offset: [0, -35, -18],
  },
  { hosts: ['regulator'], offset: [-28, -22, -12] },
  { hosts: ['barrel-left', 'barrel-right'], offset: [-35, 4, -10] },
  { hosts: ['center-wheel', 'train-wheels', 'pallet'], offset: [29, -18, -10] },
  { hosts: ['front-cap', 'front-display', 'ratchets'], offset: [0, 32, 12] },
  {
    hosts: ['winding-bridge', 'stem', 'keyless', 'stem-gears'],
    offset: [32, 23, -8],
  },
  { hosts: ['shock'], offset: [-27, 29, -8] },
];
export function styleOffsets(
  parts: Part[],
  state: ExplosionState,
  style: ExplosionStyle = 'current',
) {
  if (style === 'current' || state.group) return explosionOffsets(parts, state);
  const result = new Map<string, Vec3>();
  const byId = new Map(parts.map((p) => [p.id, p]));
  const hosts = new Map(EXPLOSION.hosts.map((h) => [h.id, h]));
  const axial = new Map<string, Vec3>();
  function layer(id: string): Vec3 {
    if (axial.has(id)) return axial.get(id)!;
    const host = hosts.get(id)!;
    const frame = byId.get(host.frameId);
    if (!frame) return [0, 0, 0];
    const parent = host.parent ? layer(host.parent) : [0, 0, 0];
    // Keep the reviewed axes and hierarchy, with enlarged presentation spacing.
    const amount = stageProgress(state.separation, [0, 1]);
    const offset = [0, 1, 2].map(
      (i) =>
        parent[i] +
        host.directionLocal.reduce(
          (sum, n, j) => sum + frame.worldTransform[i][j] * n,
          0,
        ) *
          host.distanceMm *
          1.9 *
          amount,
    ) as Vec3;
    axial.set(id, offset);
    return offset;
  }
  for (const rule of EXPLOSION.parts) {
    if (!byId.has(rule.id)) continue;
    if (style === 'layers') {
      result.set(rule.id, [...layer(rule.host)]);
      continue;
    }
    const index = packets.findIndex((packet) =>
      packet.hosts.includes(rule.host),
    );
    if (index < 0) {
      result.set(rule.id, [0, 0, 0]);
      continue;
    }
    const packet = packets[index];
    const p =
      style === 'guided'
        ? stageProgress(state.separation, [
            index / packets.length,
            (index + 1) / packets.length,
          ])
        : state.separation;
    const lift = stageProgress(p, [0, 0.42]);
    const park = stageProgress(p, [0.3, 1]);
    result.set(rule.id, [
      packet.offset[0] * park,
      packet.offset[1] * park,
      packet.offset[2] * lift,
    ]);
  }
  return result;
}
