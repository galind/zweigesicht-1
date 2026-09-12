/** M2 source-centered sensitivity only. No operating escapement cycle. */
import evidence from "../../../docs/running-movement/M2_EVIDENCE.json";
import { evaluate, fixture, validTime, type Parameters } from "./foundation";
export type AuditShaft = "balance" | "pallet" | "escape";
export const auditDuration = 16; // seconds of inspection, not mechanical frequency
export const auditKeys = [
  { time: 0, label: "Source rest — known jewel/body penetration" },
  { time: 4, label: "Positive 5 µm travel bound — experiment" },
  { time: 8, label: "Source return — no phase alignment correction" },
  { time: 12, label: "Negative 5 µm travel bound — experiment" },
  { time: 16, label: "Final source return — M2 remains incomplete" },
];
export const thresholdTime = evidence.experimentalEvent.analyticZeroBracketsRad[1].reduce((a,b) => a+b) / 2 / evidence.experiments.find(r => r.shaft === "escape")!.extentRad * 4;
export function auditAngle(time: number, shaft: AuditShaft) {
  validTime(time);
  if (time > auditDuration) throw new RangeError("M2 sensitivity inspection ends at 16 s");
  const run = evidence.experiments.find((r) => r.shaft === shaft);
  if (!run) throw new Error("Unknown audit shaft");
  const u = time / 4;
  const fraction = u <= 1 ? u : u <= 3 ? 2 - u : u - 4;
  return fraction * run.extentRad;
}
export function auditPose(time: number, shaft: AuditShaft, parameters: Parameters) {
  const state = fixture(shaft, 0, auditAngle(time, shaft) / (2 * Math.PI));
  if (state.kind !== "fixture") throw new Error("Expected fixture");
  state.phase.evidenceId = "M2-SENSITIVITY";
  state.phase.derivation = "5 µm / BRep monitored radius bound; M2_EVIDENCE.json; no operating amplitude";
  state.rate.evidenceId = "M2-SENSITIVITY";
  return evaluate(time, state, parameters);
}
export function springMismatch(angle: number) {
  // Historical M0 inner terminal center only; not a complete accepted terminal frame.
  const x = 0.41668742107478446, y = -0.270732748192483;
  return 2 * Math.hypot(x, y) * Math.abs(Math.sin(angle / 2));
}
