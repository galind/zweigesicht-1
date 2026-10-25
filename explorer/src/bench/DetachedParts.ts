import * as THREE from 'three';
import type { Part } from '../experience/catalog';
import {
  createMaterial,
  setFinishEnabled,
  FITTED_BLUE_ENAMEL,
} from '../viewer/materials';
import {
  attachSourceSurface,
  type SourceSurfaces,
} from '../viewer/SourceSurfaces';
import layout from '../../../assets/authored/bench-parts-layout.json';
import watch from '../../../assets/authored/watch-configurations.json';
import dials from '../../../assets/authored/dial-configurations.json';

export const DETACHED_IDS = new Set(
  layout.groups.flatMap(
    (g) => g.leafIds ?? g.packets!.flatMap((p) => p.leafIds),
  ),
);
/** Own material instances, shared immutable catalog geometry. One bench owns both. */
export function createDetachedParts(
  catalog: THREE.Object3D,
  records: Map<string, Part>,
  surfaces: SourceSurfaces,
) {
  const root = new THREE.Group();
  root.name = 'detached-parts';
  const available = new Map<string, THREE.Mesh>();
  catalog.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    let parent: THREE.Object3D | null = node;
    while (parent && !records.has(parent.name)) parent = parent.parent;
    if (parent && DETACHED_IDS.has(parent.name))
      available.set(parent.name, node);
  });
  type Packet = {
    id: string;
    leafIds: string[];
    transform: number[];
    localMatrices: object;
  };
  const populate = (spec: Packet, parent: THREE.Group) => {
    const group = new THREE.Group();
    group.name = spec.id;
    group.matrixAutoUpdate = false;
    group.matrix.fromArray(spec.transform);
    parent.add(group);
    for (const id of spec.leafIds) {
      const original = available.get(id),
        record = records.get(id);
      if (!original || !record) throw Error('Missing detached part ' + id);
      attachSourceSurface(original.geometry, surfaces.get(record.definitionId));
      const material = createMaterial(
        record.name,
        record.definitionId,
        original.geometry,
        id,
      );
      if (
        watch.caseMaterialDefinitions.includes(record.definitionId) &&
        spec.id === 'case'
      ) {
        const steel = watch.caseMaterials.find((m) => m.id === 'steel')!;
        material.color.set(steel.color);
        material.metalness = 1;
        material.roughness = steel.roughness;
      }
      if (dials.presentationOverrides.some((p) => p.leafId === id)) {
        const enamel = material as THREE.MeshPhysicalMaterial,
          optical = FITTED_BLUE_ENAMEL;
        enamel.color.setHex(optical.color);
        enamel.metalness = optical.metalness;
        enamel.roughness = optical.roughness;
        enamel.transmission = optical.transmission;
        enamel.userData.finishTransmission = optical.transmission;
        enamel.ior = optical.ior;
        enamel.thickness = optical.thickness;
        enamel.attenuationColor.setHex(optical.attenuationColor);
        enamel.attenuationDistance = optical.attenuationDistance;
        enamel.clearcoat = optical.clearcoat;
        enamel.clearcoatRoughness = optical.clearcoatRoughness;
        enamel.polygonOffset = true;
        enamel.polygonOffsetFactor = -1;
        enamel.polygonOffsetUnits = -1;
      }
      setFinishEnabled(material, true);
      const mesh = new THREE.Mesh(original.geometry, material);
      mesh.name = record.name;
      mesh.matrixAutoUpdate = false;
      mesh.matrix.fromArray(
        (spec.localMatrices as Record<string, number[]>)[id],
      );
      mesh.userData = {
        ...original.userData,
        partId: id,
        instanceId: spec.id + ':' + id,
        packet: spec.id,
        collisionRole: 'walkable',
      };
      group.add(mesh);
    }
    return group;
  };
  try {
    for (const spec of layout.groups) {
      if (spec.leafIds) populate(spec as Packet, root);
      else {
        const group = new THREE.Group();
        group.name = spec.id;
        root.add(group);
        for (const packet of spec.packets!) populate(packet, group);
      }
    }
  } catch (error) {
    root.traverse((n) => {
      if (n instanceof THREE.Mesh) (n.material as THREE.Material).dispose();
    });
    throw error;
  }
  return root;
}
