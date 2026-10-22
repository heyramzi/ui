export type Side = "top" | "bottom" | "left" | "right";
export type Placement = Side | `${Side}-${"start" | "end"}`;

/** One stop on a page. `target` is a CSS selector, usually `[data-tour="name"]`. */
export type Step = { target: string; title: string; body: string; placement?: Placement };

/**
 * `route` is a SvelteKit route id such as `/(app)/projects/[id]`, so params never matter.
 * `version` starts at 1. Raise it and everyone who saw the old one sees the tour again.
 */
export type Tour =
  | { id: string; version?: number; route: string; kind: "steps"; steps: Step[] }
  | {
      id: string;
      version?: number;
      route: string;
      kind: "intro";
      title: string;
      body: string;
      image?: string;
    };

export type Outcome = "completed" | "dismissed";

/** Where seen-state lives. `load` runs once per session. */
export interface SeenStore {
  /** Tour id to the version seen. */
  load(): Promise<Record<string, number>>;
  markSeen(tourId: string, version: number, outcome: Outcome): Promise<void>;
  /** One tour, or all of them when no id is given. */
  reset(tourId?: string): Promise<void>;
}

export type Strings = {
  next: string;
  back: string;
  done: string;
  skip: string;
  progress: (n: number, total: number) => string;
};

export const MAX_STEPS = 6;
