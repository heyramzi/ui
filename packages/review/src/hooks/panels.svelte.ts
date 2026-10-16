const KEY = "review.panels.v1";
const LIMITS = {
  rail: { min: 208, max: 360, def: 264 },
  panel: { min: 320, max: 560, def: 384 },
  pane: { min: 280, max: 760, def: 400 },
} as const;
/** The main column width where Main's container query puts a vertical video beside its pass. */
const MAIN_SIDE = 700;

type Saved = {
  railOpen: boolean;
  panelOpen: boolean;
  railW: number;
  panelW: number;
  paneW: number;
  /** Set once the user drags an edge. Until then the panel and pane widths follow the screen. */
  panelSized: boolean;
  paneSized: boolean;
};

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

function read(): Saved {
  const fallback: Saved = {
    railOpen: true,
    panelOpen: true,
    railW: LIMITS.rail.def,
    panelW: LIMITS.panel.def,
    paneW: LIMITS.pane.def,
    panelSized: false,
    paneSized: false,
  };
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (typeof raw !== "object" || raw === null) return fallback;
    const saved = raw as Partial<Saved>;
    return {
      railOpen: typeof saved.railOpen === "boolean" ? saved.railOpen : fallback.railOpen,
      panelOpen: typeof saved.panelOpen === "boolean" ? saved.panelOpen : fallback.panelOpen,
      railW: clamp(Number(saved.railW) || fallback.railW, LIMITS.rail.min, LIMITS.rail.max),
      panelW: clamp(Number(saved.panelW) || fallback.panelW, LIMITS.panel.min, LIMITS.panel.max),
      paneW: clamp(Number(saved.paneW) || fallback.paneW, LIMITS.pane.min, LIMITS.pane.max),
      panelSized: saved.panelSized === true,
      paneSized: saved.paneSized === true,
    };
  } catch {
    return fallback;
  }
}

/** Rail and panel open state and width, and the pass pane beside a tall video, remembered per browser. On a phone the panel is a sheet that starts closed. */
export function usePanels() {
  const start = read();
  let railOpen = $state(start.railOpen);
  let panelOpen = $state(start.panelOpen);
  let railW = $state(start.railW);
  let panelW = $state(start.panelW);
  let paneW = $state(start.paneW);
  let panelSized = $state(start.panelSized);
  let paneSized = $state(start.paneSized);
  /** A laptop width: the rail shrinks to an icon strip so the video and the notes keep their room. */
  let compact = $state(false);
  /** On a phone, which sheet covers the work under the video: the notes, the steps, or neither. */
  let sheet = $state<"none" | "notes" | "steps">("none");
  let narrow = $state(false);
  let dragging = $state(false);

  $effect(() => {
    const query = matchMedia("(max-width: 900px)");
    narrow = query.matches;
    const change = () => (narrow = query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  });

  let viewport = $state(0);
  $effect(() => {
    viewport = innerWidth;
    const change = () => (viewport = innerWidth);
    addEventListener("resize", change);
    return () => removeEventListener("resize", change);
  });

  // WHY: the rail strips to icons whenever its full width would leave the main column under
  // MAIN_SIDE, where Main stops putting a Short beside its pass and the frame shrinks.
  // It holds still mid-drag so the edge under the cursor doesn't vanish.
  $effect(() => {
    if (dragging) return;
    const panel = !panelOpen ? 0 : panelSized ? panelW : clamp(viewport * 0.28, 320, 400);
    compact = !narrow && (viewport < 1200 || viewport - railW - panel < MAIN_SIDE);
  });

  $effect(() => {
    const snapshot: Saved = { railOpen, panelOpen, railW, panelW, paneW, panelSized, paneSized };
    try {
      localStorage.setItem(KEY, JSON.stringify(snapshot));
    } catch {
      // WHY: private windows and blocked storage throw. The layout still works, it just isn't remembered.
    }
  });

  return {
    limits: LIMITS,
    get narrow() {
      return narrow;
    },
    get railOpen() {
      return railOpen;
    },
    get panelShown() {
      return narrow ? sheet === "notes" : panelOpen;
    },
    get stepsShown() {
      return narrow && sheet === "steps";
    },
    get railW() {
      return railW;
    },
    get compact() {
      return compact;
    },
    get panelW() {
      return panelW;
    },
    get paneW() {
      return paneW;
    },
    /** The CSS width of the notes panel: dragged by the user, or fitted to the screen. */
    get panelCss() {
      return panelSized ? `${panelW}px` : "clamp(320px, 28vw, 400px)";
    },
    /** The CSS width of the pass beside a tall video: at least 480px on a desktop, and never more than most of the column. */
    get paneCss() {
      return paneSized ? `${paneW}px` : "clamp(480px, 45%, 640px)";
    },
    get dragging() {
      return dragging;
    },
    set dragging(value: boolean) {
      dragging = value;
    },
    toggleRail: () => (railOpen = !railOpen),
    togglePanel: () => (narrow ? (sheet = sheet === "notes" ? "none" : "notes") : (panelOpen = !panelOpen)),
    showPanel: () => (narrow ? (sheet = "notes") : (panelOpen = true)),
    hidePanel: () => (narrow ? (sheet === "notes" && (sheet = "none")) : (panelOpen = false)),
    toggleSteps: () => (sheet = sheet === "steps" ? "none" : "steps"),
    hideSteps: () => (sheet === "steps" && (sheet = "none")),
    hideSheet: () => (sheet = "none"),
    resizeRail: (px: number) => (railW = clamp(px, LIMITS.rail.min, LIMITS.rail.max)),
    resizePanel: (px: number) => {
      panelSized = true;
      panelW = clamp(px, LIMITS.panel.min, LIMITS.panel.max);
    },
    resizePane: (px: number) => {
      paneSized = true;
      paneW = clamp(px, LIMITS.pane.min, LIMITS.pane.max);
    },
  };
}

export type Panels = ReturnType<typeof usePanels>;
