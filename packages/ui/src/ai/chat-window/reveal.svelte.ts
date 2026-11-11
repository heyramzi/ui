import { untrack } from "svelte";
import type { ChatPhase, ChatRole } from "#src/ai/chat-window/types.js";

/** Milliseconds each beat holds, read as one conversation's pacing, not a transition. */
export const REVEAL_BEATS = {
  lead: 400,
  user: 900,
  thinking: 900,
  stream: 1500,
  running: 1300,
  after: 350,
} as const;

export interface RevealBeat {
  at: number;
  index: number;
  phase: ChatPhase;
}

/** The timeline for a conversation: when each message enters and settles, and when it ends. */
export function revealSchedule(
  roles: readonly ChatRole[],
  beats: typeof REVEAL_BEATS = REVEAL_BEATS,
): { beats: RevealBeat[]; end: number } {
  const out: RevealBeat[] = [];
  let t = beats.lead;
  roles.forEach((role, index) => {
    if (role === "user") {
      out.push({ at: t, index, phase: "done" });
      t += beats.user;
    } else if (role === "assistant") {
      out.push({ at: t, index, phase: "thinking" });
      t += beats.thinking;
      out.push({ at: t, index, phase: "streaming" });
      t += beats.stream;
      out.push({ at: t, index, phase: "done" });
      t += beats.after;
    } else {
      out.push({ at: t, index, phase: "running" });
      t += beats.running;
      out.push({ at: t, index, phase: "done" });
      t += beats.after;
    }
  });
  return { beats: out, end: t };
}

interface RevealOptions {
  roles: readonly ChatRole[];
  enabled: boolean;
  active: boolean;
  hold: number;
  ondone?: () => void;
}

/**
 * Plays a conversation once the window is on screen and `active`, again each time `active` turns on.
 * Renders finished for SSR, no JavaScript and reduced motion.
 */
export function createReveal(options: () => RevealOptions) {
  let phases = $state<ChatPhase[]>([]);
  let node = $state<HTMLElement | null>(null);
  let seen = $state(false);

  $effect(() => {
    const { enabled } = options();
    if (!node || !enabled || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          seen = true;
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(node);
    return () => io.disconnect();
  });

  $effect(() => {
    const { enabled, active } = options();
    if (!enabled || !active || !seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { roles, hold, ondone } = untrack(options);
    const { beats, end } = revealSchedule(roles);
    phases = roles.map(() => "hidden");
    const timers = beats.map((b) => setTimeout(() => (phases[b.index] = b.phase), b.at));
    timers.push(setTimeout(() => ondone?.(), end + hold));
    return () => {
      timers.forEach(clearTimeout);
      phases = [];
    };
  });

  return {
    /** A message's phase; `done` when nothing is playing. */
    phase: (index: number): ChatPhase => phases[index] ?? "done",
    /** Attach to the window's root, so the reveal waits until it scrolls into view. */
    attach: (el: HTMLElement) => {
      node = el;
      return () => (node = null);
    },
    streamMs: REVEAL_BEATS.stream,
  };
}
