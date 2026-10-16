/** Where the handle sits for a pointer at `clientX`, as a 0-100 percentage of the frame. */
export function positionAt(clientX: number, left: number, width: number): number {
  if (width <= 0) return 50;
  return Math.min(Math.max(((clientX - left) / width) * 100, 0), 100);
}
