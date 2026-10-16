import { copyText } from "#src/components/copy/clipboard.js";

/**
 * The copied flag for a surface whose affordance is a whole row or card rather
 * than a `CopyButton`. Keyed, so one instance serves a list of rows.
 */
export class Copied {
  /** The key that last copied, or null. Empty string when a surface has one. */
  key = $state<string | null>(null);
  #timer: ReturnType<typeof setTimeout> | null = null;

  /** True when anything copied; with a key, true only for that one. */
  is(key = ""): boolean {
    return this.key === key;
  }

  /** Writes, then holds the check for `hold` ms. False when the write failed. */
  async copy(value: string, key = "", hold = 1400): Promise<boolean> {
    if (!(await copyText(value))) return false;
    this.mark(key, hold);
    return true;
  }

  /** The confirmation without the write, for a copy this class did not make. */
  mark(key = "", hold = 1400): void {
    this.key = key;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.key = null;
      this.#timer = null;
    }, hold);
  }

  reset(): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    this.key = null;
  }
}
