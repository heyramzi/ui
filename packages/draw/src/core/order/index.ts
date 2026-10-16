// Fractional z-order keys, the same index domain tldraw uses: plain string order
// is z-order, and inserting between two keys never renumbers siblings.

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SMALLEST_DIGIT = DIGITS[0];
const LARGEST_DIGIT = DIGITS[DIGITS.length - 1];
// The reserved floor. It has no valid predecessor and is never a key itself.
const SMALLEST_INTEGER = "A" + SMALLEST_DIGIT.repeat(26);

/** The first key in an empty list. */
export const ZERO_INDEX = "a0";

function digitValue(ch: string): number {
  return DIGITS.indexOf(ch);
}

function digitChar(value: number): string {
  return DIGITS[value];
}

function integerLength(head: string): number {
  if (head >= "a" && head <= "z") {
    return head.charCodeAt(0) - 97 + 2;
  }
  if (head >= "A" && head <= "Z") {
    return 90 - head.charCodeAt(0) + 2;
  }
  throw new Error(`invalid index head "${head}"`);
}

function integerPart(key: string): string {
  const length = integerLength(key[0]);
  if (key.length < length) {
    throw new Error(`invalid index "${key}"`);
  }
  return key.slice(0, length);
}

function checkKey(key: string): void {
  const integer = integerPart(key);
  if (key === SMALLEST_INTEGER || key.slice(integer.length).endsWith(SMALLEST_DIGIT)) {
    throw new Error(`invalid index "${key}"`);
  }
}

/** A fraction strictly between `a` (may be "") and `b` (null is the high end). */
function midpoint(a: string, b: string | null): string {
  if (b !== null && a >= b) {
    throw new Error(`cannot place a fraction between "${a}" and "${b}"`);
  }
  if (b) {
    let n = 0;
    while ((a[n] ?? SMALLEST_DIGIT) === b[n]) {
      n += 1;
    }
    if (n > 0) {
      return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
    }
  }
  const digitA = a ? digitValue(a[0]) : 0;
  const digitB = b !== null ? digitValue(b[0]) : DIGITS.length;
  if (digitB - digitA > 1) {
    return digitChar(Math.round(0.5 * (digitA + digitB)));
  }
  if (b && b.length > 1) {
    return b.slice(0, 1);
  }
  return digitChar(digitA) + midpoint(a.slice(1), null);
}

/** The next integer part, or null when the integer is exhausted. */
function incrementInteger(x: string): string | null {
  const head = x[0];
  const digs = x.slice(1).split("");
  let carry = true;
  for (let i = digs.length - 1; carry && i >= 0; i -= 1) {
    const d = digitValue(digs[i]) + 1;
    if (d === DIGITS.length) {
      digs[i] = SMALLEST_DIGIT;
    } else {
      digs[i] = DIGITS[d];
      carry = false;
    }
  }
  if (!carry) {
    return head + digs.join("");
  }
  if (head === "Z") {
    return "a" + SMALLEST_DIGIT;
  }
  if (head === "z") {
    return null;
  }
  const next = String.fromCharCode(head.charCodeAt(0) + 1);
  if (next > "a") {
    digs.push(SMALLEST_DIGIT);
  } else {
    digs.pop();
  }
  return next + digs.join("");
}

/** The previous integer part, or null when the integer is exhausted. */
function decrementInteger(x: string): string | null {
  const head = x[0];
  const digs = x.slice(1).split("");
  let borrow = true;
  for (let i = digs.length - 1; borrow && i >= 0; i -= 1) {
    const d = digitValue(digs[i]) - 1;
    if (d === -1) {
      digs[i] = LARGEST_DIGIT;
    } else {
      digs[i] = DIGITS[d];
      borrow = false;
    }
  }
  if (!borrow) {
    return head + digs.join("");
  }
  if (head === "a") {
    return "Z" + LARGEST_DIGIT;
  }
  if (head === "A") {
    return null;
  }
  const previous = String.fromCharCode(head.charCodeAt(0) - 1);
  if (previous < "Z") {
    digs.push(LARGEST_DIGIT);
  } else {
    digs.pop();
  }
  return previous + digs.join("");
}

/**
 * A z-order key that sorts strictly between `a` and `b`. Null is an open end:
 * `a` null starts the list, `b` null ends it, both null is the empty list.
 */
export function indexBetween(a: string | null, b: string | null): string {
  if (a !== null) {
    checkKey(a);
  }
  if (b !== null) {
    checkKey(b);
  }
  if (a !== null && b !== null && a >= b) {
    throw new Error(`indexBetween needs a below b, got "${a}" and "${b}"`);
  }
  if (a === null) {
    if (b === null) {
      return ZERO_INDEX;
    }
    const ib = integerPart(b);
    const fb = b.slice(ib.length);
    if (ib === SMALLEST_INTEGER) {
      return ib + midpoint("", fb);
    }
    if (ib < b) {
      return ib;
    }
    const below = decrementInteger(ib);
    if (below === null) {
      throw new Error("cannot go below the smallest index");
    }
    return below;
  }
  if (b === null) {
    const ia = integerPart(a);
    const fa = a.slice(ia.length);
    const above = incrementInteger(ia);
    return above === null ? ia + midpoint(fa, null) : above;
  }
  const ia = integerPart(a);
  const fa = a.slice(ia.length);
  const ib = integerPart(b);
  const fb = b.slice(ib.length);
  if (ia === ib) {
    return ia + midpoint(fa, fb);
  }
  const above = incrementInteger(ia);
  if (above === null) {
    throw new Error("cannot go above the largest index");
  }
  if (above < b) {
    return above;
  }
  return ia + midpoint(fa, null);
}
