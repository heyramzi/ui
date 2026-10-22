type Replay = (tourId?: string) => Promise<boolean>;

class Onboarding {
  /** True when the current page has a tour, so a menu item can hide itself. */
  hasTour = $state(false);
  /** True while a tour is on screen. */
  running = $state(false);
  #replay: Replay | null = null;

  /** The provider registers itself here. Returns the undo for cleanup. */
  bind(replay: Replay): () => void {
    this.#replay = replay;
    return () => {
      if (this.#replay === replay) this.#replay = null;
    };
  }

  /** Restarts this page's tour, or the one named. Writes no seen-state. False when nothing started. */
  replay(tourId?: string): Promise<boolean> {
    return this.#replay ? this.#replay(tourId) : Promise.resolve(false);
  }
}

export const onboarding = new Onboarding();
