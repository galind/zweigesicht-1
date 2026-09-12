import graph from "../../../docs/running-movement/graph.json";
import manifest from "../../../explorer/public/models/assembly-manifest.json";
import hands from "../../../assets/authored/hand-display-poses.json";
import dials from "../../../assets/authored/dial-configurations.json";
import type { Evidence, Parameters, Shaft } from "./foundation";

const evidence = (evidenceId: string, units: string, derivation: string): Evidence => ({
  evidenceId,
  units,
  frame: "right-handed STEP world; +Z",
  derivation,
  confidence: "geometry supported; operating relationship unresolved",
  reviewStatus: "engineering evidence; external mechanical review open",
});
const leafIds = new Set(manifest.instances.filter((p) => !p.isAssembly).map((p) => p.id));
const shafts: Shaft[] = Object.entries(graph.shafts).map(([id, s]) => ({
  id,
  members: graph.nodes.find((n) => n.id === id)!.instanceIds.filter((i) => leafIds.has(i)),
  pivot: {
    value: s.pivotWorldMm,
    ...evidence("E-MECH", "mm", s.axisEvidence + "; graph.json#/shafts/" + id),
  },
  axis: { value: s.axisWorld, ...evidence("E-MECH", "unit vector", s.axisEvidence) },
  membership: evidence("E-MECH", "instance IDs", s.rigidMembershipEvidence),
}));
for (const face of ["central", "small"] as const)
  for (const role of ["hour", "minute", "seconds"]) {
    const selected = hands.hands.filter((h) => h.face === face && h.role === role);
    if (!selected.length) continue;
    shafts.push({
      id: `${face}-${role}`,
      members: [...new Set(selected.flatMap((h) => [h.leafId, h.supportLeafId]))],
      pivot: {
        value: [...dials.faces[face].axleWorldXYMm, 0],
        ...evidence("E-HANDS", "mm", "Reviewed fitted arbor; any Z on the same axial line"),
      },
      axis: {
        value: [0, 0, 1],
        ...evidence(
          "E-HANDS",
          "unit vector",
          "Common world +Z experiment convention; no running direction",
        ),
      },
      membership: evidence(
        "E-HANDS",
        "instance IDs",
        "Fitted blades and their recorded support only; no upstream drive assumed",
      ),
    });
  }
const owners = new Set<string>();
for (const shaft of shafts) {
  if (shaft.axis.value.join(",") !== "0,0,1")
    throw new Error("M1 only supports evidenced world +Z axes");
  for (const id of shaft.members) {
    if (!leafIds.has(id) || owners.has(id))
      throw new Error("Invalid or duplicate leaf ownership: " + id);
    owners.add(id);
  }
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export const parameters: Parameters = freeze({
  id: "M1-foundation-v1",
  shafts,
  diagnostics: graph.edges.map((e) => ({
    id: e.id,
    status: e.status.startsWith("rejected") ? "rejected" : "unresolved operating relationship",
    reason: `${e.from} → ${e.to}: ${e.kind}; M0 ${e.status}; ${e.phase}; ${e.unknown}`,
    evidenceId: e.evidence,
  })),
  deformations: manifest.instances
    .filter((p) => !p.isAssembly && ["d_0_1_1_116", "d_0_1_1_88"].includes(p.definitionId))
    .map((p) => ({
      id: p.id,
      status: "unresolved; source geometry retained",
      reason:
        p.definitionId === "d_0_1_1_116"
          ? "116: terminal frames, source precision and deformation law missing; inner collet fixture disconnects stationary spring"
          : "88: barrel hooks, coupling, winding state and deformation law missing",
      evidenceId: p.definitionId === "d_0_1_1_116" ? "U-SPRING" : "U-BARREL",
    })),
  operating: Object.fromEntries(
    ["balanceAmplitude", "escapementPhase", "barrelCouplings", "springLaw"].map((id) => [
      id,
      {
        value: null,
        ...evidence(
          "M0-UNKNOWNS",
          id === "balanceAmplitude" || id === "escapementPhase" ? "rad" : "unresolved contract",
          "Unset; see docs/running-movement/UNKNOWNS.md",
        ),
      },
    ]),
  ),
});
export { manifest, hands, dials };
