import * as THREE from "three";
import { handDisplayMatrix } from "../../../explorer/src/viewer/HandDisplayPose";
import { immutableBase } from "./foundation";
import { parameters, manifest } from "./parameters";
/** Reuse the visitor's reviewed fit function once at initialization; never refit a moving pose. */
export const bases = manifest.instances
  .filter((p) => !p.isAssembly)
  .map((p) => {
    const source = new THREE.Matrix4().set(
      ...(p.worldTransform.flat() as Parameters<THREE.Matrix4["set"]>),
    );
    const fitted = handDisplayMatrix(p.id, source);
    const rowMajor = (m: THREE.Matrix4) => m.clone().transpose().toArray();
    const owner = parameters.shafts.find((s) => s.members.includes(p.id));
    return immutableBase(
      p.id,
      rowMajor(source),
      fitted ? rowMajor(fitted) : rowMajor(source),
      owner?.id,
    );
  });
