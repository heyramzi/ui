/** Narrows a value a test knows is there. Fails with `what` named when it isn't. */
export function must<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Expected ${what} to exist`);
  return value;
}
