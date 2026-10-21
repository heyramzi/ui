/**
 * Which heading the reader is in, for a box that scrolls. One spy feeds the
 * side rail and the compact bar, so the two can never disagree.
 */

export type DocHeading = { id: string; label: string };

/**
 * Where a heading sits inside the scroller, in scroller content coordinates.
 * The default reads the live DOM by id. A framed document supplies its own,
 * since its headings live in another document.
 */
export type LocateHeading = (id: string) => number | null;

/** How far below the scroller's top edge a heading counts as "reached" and lands. */
export const READ_LINE = 80;

export class ScrollSpy {
  active = $state("");

  #scroller: HTMLElement | null = null;
  #items: DocHeading[] = [];
  #locate: LocateHeading | undefined;
  #frame = 0;

  /** Point the spy at a scroller and a list. Returns the cleanup. */
  attach(scroller: HTMLElement | null, items: DocHeading[], locate?: LocateHeading) {
    this.#scroller = scroller;
    this.#items = items;
    this.#locate = locate;
    if (!scroller || items.length === 0) {
      this.active = "";
      return () => {};
    }

    const schedule = () => {
      this.#frame ||= requestAnimationFrame(() => {
        this.#frame = 0;
        this.update();
      });
    };
    scroller.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(scroller);
    // A document that grows after load (a diagram, a chart) moves every
    // heading below it, so watch the content too.
    for (const child of scroller.children) observer.observe(child);
    this.update();

    return () => {
      scroller.removeEventListener("scroll", schedule);
      observer.disconnect();
      if (this.#frame) cancelAnimationFrame(this.#frame);
      this.#frame = 0;
    };
  }

  topOf(id: string): number | null {
    const scroller = this.#scroller;
    if (!scroller) return null;
    if (this.#locate) return this.#locate(id);
    const el = scroller.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!el) return null;
    return (
      el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
    );
  }

  update() {
    const scroller = this.#scroller;
    if (!scroller || this.#items.length === 0) return;
    // At the very bottom the last heading wins, or a short final section could
    // never be the current one.
    const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
    if (atEnd && scroller.scrollTop > 0) {
      this.active = this.#items[this.#items.length - 1].id;
      return;
    }
    const line = scroller.scrollTop + READ_LINE + 1;
    let current = this.#items[0].id;
    for (const item of this.#items) {
      const top = this.topOf(item.id);
      if (top !== null && top <= line) current = item.id;
    }
    this.active = current;
  }

  /** Scroll so the heading lands on the read line, instant under reduced motion. */
  jump(id: string) {
    const scroller = this.#scroller;
    const top = this.topOf(id);
    if (!scroller || top === null) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.active = id;
    scroller.scrollTo({ top: Math.max(0, top - READ_LINE), behavior: reduced ? "auto" : "smooth" });
  }
}
