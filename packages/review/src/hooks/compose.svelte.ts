import type { Frame, NoteTarget, ReviewAction } from "#src/core/types.js";

/**
 * The note being written. It pins to what was pointed at, else to the beat, playhead or video.
 */
export function createCompose(contextTarget: () => NoteTarget) {
  let open = $state(false);
  let text = $state("");
  let pinned = $state.raw<NoteTarget | null>(null);
  let focusTick = $state(0);
  const target = $derived(pinned ?? contextTarget());

  function reset() {
    open = false;
    text = "";
    pinned = null;
  }

  return {
    get open() {
      return open;
    },
    get text() {
      return text;
    },
    set text(value: string) {
      text = value;
    },
    get target() {
      return target;
    },
    get pinned() {
      return pinned !== null;
    },
    /** Bumps every time the box should take focus. */
    get focusTick() {
      return focusTick;
    },
    start(pin?: NoteTarget) {
      if (pin) pinned = pin;
      open = true;
      focusTick += 1;
    },
    pin(next: NoteTarget | null) {
      pinned = next;
    },
    /** The moment being noted, when the target is one. */
    get time() {
      return target.kind === "time" ? target : null;
    },
    /** Stretch a moment to `end`, or clear the stretch. Too short a span is ignored. */
    setSpan(end: number | null) {
      if (target.kind !== "time") return;
      const { span: _gone, ...rest } = target;
      const length = end === null ? 0 : Math.round((end - target.at) * 10) / 10;
      pinned = length > 0.05 ? { ...rest, span: length } : rest;
    },
    /** Add a point or an area on the frame to the moment, or take it off. */
    setFrame(frame: Frame | null) {
      if (target.kind !== "time") return;
      const { frame: _gone, ...rest } = target;
      pinned = frame ? { ...rest, frame } : rest;
    },
    /** The whole video, no time. Again to go back to the playhead. */
    toggleGeneral() {
      pinned = target.kind === "video" && pinned ? null : { kind: "video" };
      open = true;
      focusTick += 1;
    },
    cancel: reset,
    /** The action to send, or null when there's nothing to say. Clears the box. */
    take(): ReviewAction | null {
      const words = text.trim();
      if (!words) return null;
      const action: ReviewAction = { type: "note", target, text: words };
      reset();
      return action;
    },
  };
}

export type Compose = ReturnType<typeof createCompose>;
