type Point = { x: number; y: number };

/** Keep the pointer's original offset from the grabbed piece's centre. */
export function dragCenter(pointer: Point, grabOffset: Point): Point {
  return { x: pointer.x - grabOffset.x, y: pointer.y - grabOffset.y };
}
