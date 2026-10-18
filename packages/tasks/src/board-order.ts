// Fractional indexing: an order key that always sorts between its neighbours,
// so a move writes one row instead of renumbering a column. The algorithm is
// the CC0 one from https://observablehq.com/@dgreensp/implementing-fractional-indexing
// (see the README credit). Kept inline so this package carries no runtime deps.
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const INT_DIGITS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ZERO = DIGITS.charAt(0);

function integerLength(head: string): number {
  const i = INT_DIGITS.indexOf(head);
  if (i === -1) throw new Error("invalid order key head: " + head);
  const half = INT_DIGITS.length / 2;
  return i < half ? half - i + 1 : i - half + 2;
}

function integerPart(key: string): string {
  const length = integerLength(key.charAt(0));
  if (length > key.length) throw new Error("invalid order key: " + key);
  return key.slice(0, length);
}

function smallestInteger(): string {
  return INT_DIGITS.charAt(0) + ZERO.repeat(INT_DIGITS.length / 2);
}

function midpoint(a: string, b: string | null): string {
  if (b != null && a >= b) throw new Error(a + " >= " + b);
  if (a.slice(-1) === ZERO || (b && b.slice(-1) === ZERO)) throw new Error("trailing zero");

  if (b) {
    let n = 0;
    while ((a[n] ?? ZERO) === b[n]) n++;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }

  const digitA = a ? DIGITS.indexOf(a.charAt(0)) : 0;
  const digitB = b != null ? DIGITS.indexOf(b.charAt(0)) : DIGITS.length;
  if (digitB - digitA > 1) {
    return DIGITS.charAt(Math.round(0.5 * (digitA + digitB)));
  }
  if (b && b.length > 1) return b.slice(0, 1);
  return DIGITS.charAt(digitA) + midpoint(a.slice(1), null);
}

function incrementInteger(x: string): string | null {
  const head = x.charAt(0);
  let trailing = "";
  for (let i = x.length - 1; i >= 1; i--) {
    const d = DIGITS.indexOf(x.charAt(i)) + 1;
    if (d === DIGITS.length) trailing = ZERO + trailing;
    else return head + x.slice(1, i) + DIGITS.charAt(d) + trailing;
  }

  const headIndex = INT_DIGITS.indexOf(head);
  if (headIndex === INT_DIGITS.length - 1) return null;
  const h = INT_DIGITS.charAt(headIndex + 1);
  const delta = integerLength(h) - integerLength(head);
  return h + (delta > 0 ? trailing + ZERO : delta < 0 ? trailing.slice(1) : trailing);
}

function decrementInteger(x: string): string | null {
  const head = x.charAt(0);
  const last = DIGITS.charAt(DIGITS.length - 1);
  let trailing = "";
  for (let i = x.length - 1; i >= 1; i--) {
    const d = DIGITS.indexOf(x.charAt(i)) - 1;
    if (d === -1) trailing = last + trailing;
    else return head + x.slice(1, i) + DIGITS.charAt(d) + trailing;
  }

  const headIndex = INT_DIGITS.indexOf(head);
  if (headIndex === 0) return null;
  const h = INT_DIGITS.charAt(headIndex - 1);
  const delta = integerLength(h) - integerLength(head);
  return h + (delta > 0 ? trailing + last : delta < 0 ? trailing.slice(1) : trailing);
}

/** An order key that sorts strictly between `a` and `b`. Null means an open end. */
export function keyBetween(a: string | null, b: string | null): string {
  if (a != null && b != null && a > b) [a, b] = [b, a];

  if (a == null) {
    if (b == null) return INT_DIGITS.charAt(INT_DIGITS.length / 2) + ZERO;
    const ib = integerPart(b);
    const fb = b.slice(ib.length);
    if (ib === smallestInteger()) return ib + midpoint("", fb);
    if (ib < b) return ib;
    const res = decrementInteger(ib);
    if (res == null) throw new Error("cannot decrement any more");
    return res;
  }

  if (b == null) {
    const ia = integerPart(a);
    const fa = a.slice(ia.length);
    const i = incrementInteger(ia);
    return i == null ? ia + midpoint(fa, null) : i;
  }

  const ia = integerPart(a);
  const fa = a.slice(ia.length);
  const ib = integerPart(b);
  const fb = b.slice(ib.length);
  if (ia === ib) return ia + midpoint(fa, fb);

  const i = incrementInteger(ia);
  if (i == null) throw new Error("cannot increment any more");
  if (i < b) return i;
  return ia + midpoint(fa, null);
}

/**
 * The key a card should take when dropped at `index`. Rows may share a key or
 * have none, so the bounds skip both and only compare against real keys.
 */
export function boardOrderAt<T>(
  column: readonly T[],
  index: number,
  order: (item: T) => string | null | undefined,
): string {
  let lower: string | null = null;
  for (const item of column.slice(0, index)) {
    const key = order(item);
    if (key != null && (lower === null || key > lower)) lower = key;
  }

  let upper: string | null = null;
  for (const item of column.slice(index)) {
    const key = order(item);
    if (key != null && (lower === null || key > lower)) {
      upper = key;
      break;
    }
  }

  return keyBetween(lower, upper);
}
