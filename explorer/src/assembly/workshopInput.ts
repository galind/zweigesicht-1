/** Input assistance only; these values are not mechanical fit tolerances. */
export type Point = { x: number; y: number };
export const DRAG_INTENT_PX = 8;
export const TOUCH_AIM_OFFSET_PX = 64;
export function aimPoint(point: Point, pointerType: string): Point {
  return {
    x: point.x,
    y: point.y - (pointerType === 'touch' ? TOUCH_AIM_OFFSET_PX : 0),
  };
}
export function screwDestination(point: Point, first: Point, second: Point) {
  const a = Math.hypot(point.x - first.x, point.y - first.y);
  const b = Math.hypot(point.x - second.x, point.y - second.y);
  // A bisector is ambiguous. Never let the selected item decide the destination.
  if (Math.abs(a - b) < 0.5) return null;
  return a < b ? 'bridge-screw-1' : 'bridge-screw-2';
}
