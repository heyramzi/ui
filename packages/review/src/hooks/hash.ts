/** The `pass` param of a location hash, next to whatever else the host keeps there. */
const params = (hash: string) => new URLSearchParams(hash.replace(/^#/, ""));

export const readPassHash = (hash: string): string | null => params(hash).get("pass");

export function withPassHash(hash: string, id: string): string {
  const next = params(hash);
  next.set("pass", id);
  return `#${next.toString()}`;
}
