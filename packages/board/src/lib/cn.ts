export type ClassValue = string | false | null | undefined;

/** Join class values, dropping empties. Deliberately dependency-free. */
export function cn(...values: ClassValue[]): string {
  let out = "";
  for (const value of values) {
    if (!value) continue;
    out = out ? out + " " + value : value;
  }
  return out;
}
