/** The review contract: one model the page draws, one action union it sends, one adapter a tool implements. */

// ---------- passes: the rail ----------

/** Where a pass is. `review` means the machine finished and beats are waiting on a person. */
export type PassState = "todo" | "started" | "review" | "done" | "blocked";

/**
 * What clicking a pass opens in the main pane. `none` makes the row a status line, not a button.
 */
export type PassView = "transcript" | "beats" | "music" | "handoff" | "none";

/** How a transcript view marks the words a pass touched. */
export type TranscriptLens = "read" | "cut" | "moved" | "pace";

export type Pass = {
  id: string;
  label: string;
  /** A group id from `ReviewModel.groups`. The rail draws one small heading per group. */
  group: string;
  state: PassState;
  view: PassView;
  /** For `view: "transcript"`: which marks to light up. */
  lens?: TranscriptLens;
  /** For `view: "beats"`: which beat kinds this pass owns. Also filters the feedback panel. */
  kinds?: string[];
  /** Beats still undecided. Shown as "3 left". */
  open?: number;
};

export type PassGroup = { id: string; label: string };

// ---------- the transcript ----------

/** What a pass did to a stretch of words, drawn by the matching lens. */
export type LineMark = "cut" | "moved" | "pause";

export type TranscriptLine = {
  /** Clock label, "0:18". */
  at: string;
  seconds: number;
  text: string;
  /** When each word of `text` starts, so a beat pin sits at its own word instead of after the line. */
  wordSeconds?: number[];
  marks?: LineMark[];
};

export type Paragraph = { at: string; chapter?: string; lines: TranscriptLine[] };

// ---------- beats: every choice a person makes ----------

export type BeatState = "proposed" | "changed" | "approved" | "skipped";

/**
 * A kind of beat and how it looks. The adapter names them; `tone` picks a theme colour token.
 */
export type BeatKind = { id: string; label: string; icon: IconName; tone: Tone };

/** `radius` is the layer's own corner radius, in the same units as the box. */
export type LayoutBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  role: string;
  radius?: number;
  /** A text layer's name, such as "Caption" or "Text 1". */
  text?: string;
  /** How far a picture layer zooms into its media, 1 being none. */
  zoom?: number;
};

/** The boxes a layout diagram is drawn from, in the card's own frame. */
export type LayoutPreview = { w: number; h: number; boxes: LayoutBox[] };

/** One card of a layout pack, as the library draws it. */
export type LibraryCard = {
  name: string;
  group?: string;
  job?: string;
  preview: LayoutPreview;
  /** The plain text the card's spark button copies for an agent. No button without it. */
  agent?: string;
  /** A clip (webm with alpha) that fills the card's Media slot, shown as its thumbnail instead of the empty frame. */
  clip?: string;
};

/** One sound of a roster, as the sound library draws it. */
export type SoundCard = {
  /** The key everything else uses. The page never shows it. */
  id: string;
  /** The plain name the card shows. Equal to `id` when the roster named none, and the card then words the id itself. */
  name: string;
  group?: string;
  /** What the sound is for, in one plain line with no ids or video codes. The roster's own words; none is invented. */
  job?: string;
  /** The audio's URL. Absent when no file of the sound exists on this machine. */
  src?: string;
  seconds: number;
  /** The pin's gain times the clip's own level, as the renderer plays it. Null while the level is unmeasured. */
  gain: number | null;
  /** The plain text the card's spark button copies for an agent. No button without it. */
  agent?: string;
};

export type BeatOption = {
  id: string;
  name: string;
  kind: "video" | "audio" | "layout" | "image";
  /** A URL the page can load as is. Adapters resolve paths to URLs, never the page. */
  src?: string;
  /** For `kind: "layout"`: the boxes a layout diagram is drawn from. */
  preview?: LayoutPreview;
  meta?: string;
  /** A transparent-background render. The card wears an Alpha tag. */
  alpha?: boolean;
};

export type Beat = {
  id: string;
  kind: string;
  seconds: number;
  at: string;
  /** The spoken line the beat sits on. */
  line: string;
  options: BeatOption[];
  state: BeatState;
  pick?: string;
  /** Its line is no longer in the cut. Reported, never dropped. */
  orphaned?: boolean;
  chat?: boolean;
  /** Why it has nothing to show yet, e.g. "Rendering". */
  pending?: string;
};

export type Music = {
  decision: "undecided" | "kept" | "skipped";
  keep?: string;
  /** More tracks were asked for and haven't arrived. */
  more: boolean;
  options: { id: string; title: string; mood: string; seconds: number; src?: string }[];
};

// ---------- the player: only a tool with a rendered cut has one ----------

export type Lane = {
  id: string;
  label: string;
  spans: { from: number; to: number; label?: string; tone?: Tone }[];
};

/** One piece of a take as edit.json holds it, in source seconds. The cut plays the kept ones in this order. */
export type LiveRange = { source: string; start: number; end: number; kept: boolean };

/** What the cut pass plays on its own: the edit's ranges and each take's proxy, so a note moves the cut with no render. */
export type LivePlan = { fps: number; ranges: LiveRange[]; sources: Record<string, string> };

export type Player = {
  /** The rendered preview. Absent until the first one is made; the cut pass doesn't need it. */
  src?: string;
  duration: number;
  poster?: string;
  lanes?: Lane[];
  /** Present for a local edit. The cut pass plays this; every other pass plays `src`. */
  live?: LivePlan;
};

// ---------- notes ----------

/** Where a point or an area sits on the frame, 0 to 1 from the top left. */
export type Frame = { x: number; y: number; w?: number; h?: number };

/**
 * What a note is about: a beat, a transcript range, a moment of the cut, or the whole video.
 */
export type NoteTarget =
  | { kind: "video" }
  | { kind: "beat"; beat: string }
  // WHY: `from` and `to` are the clock labels ("0:18") of the first and last transcript line selected.
  | { kind: "text"; from: string; to: string; quote: string }
  | {
      kind: "time";
      at: number;
      span?: number;
      frame?: Frame;
      anchor?: { source: string; at: number };
    };

/**
 * open → queued → working → answered, then the person ticks it `done`.
 */
export type NoteStatus =
  | "open"
  | "queued"
  | "working"
  | "answered"
  | "done"
  | "proposal"
  | "dismissed";

export type Note = {
  id: string;
  target: NoteTarget;
  text: string;
  status: NoteStatus;
  by: "person" | "agent";
  reply?: string;
  thread?: { by: "person" | "agent"; text: string }[];
  /** What the agent that took it says it's doing now. A reply clears it. */
  working?: { text: string; at: string; agent?: string };
  /** The pass this note belongs to, so selecting a pass narrows the panel. Adapters set it. */
  pass?: string;
  /** Its moment was cut out of the edit. */
  orphaned?: boolean;
  /** Marked true if the note was added from the CLI (chat). */
  chat?: boolean;
  /** A failing cut check shown as a note. Only the check clears it, so the page offers no verbs; `png` is its cut's filmstrip. */
  check?: { png: string | null };
  createdAt: string;
};

// ---------- the whole page ----------

export type Tone = "neutral" | "accent" | "ok" | "warn" | "bad";

/** Whether an agent is on the other end. Drives the agent dock. */
export type Session = "offline" | "idle" | "listening";

/**
 * Which tool owns the edit. `openscreen` is the experimental backend, and it turns on the
 * project page's Preview, Sync and Export actions.
 */
export type ReviewBackend = "descript" | "local" | "openscreen";

/** What the renderer says it's doing while it draws a preview or a final. */
export type RenderProgress =
  | { stage: "preparing" }
  | { stage: "matting"; done: number; total: number }
  | { stage: "rendering"; done: number; total: number }
  | { stage: "encoding"; done: number; total: number }
  | { stage: "finishing" };

/**
 * Where one render of a video stands. Only a final sits `outdated`; a stale preview rejoins the
 * queue, and `queued` or `rendering` flag `outdated` when replacing a file on disk.
 */
export type JobStatus =
  | { state: "current" }
  | { state: "none" }
  | { state: "outdated" }
  | { state: "queued"; ahead: number; outdated: boolean }
  | {
      state: "rendering";
      elapsedMs: number;
      expectedMs?: number;
      progress?: RenderProgress;
      outdated: boolean;
    }
  | { state: "failed"; stage: "probe" | "render"; error: string };

/** The cut check that follows a preview. Its failing cuts arrive as notes, so the page keeps only the count. */
export type CheckStatus =
  | { state: "none" }
  | { state: "waiting" }
  | { state: "checking" }
  | { state: "done"; checkedAt: string; cuts: number; failing: number }
  | { state: "error"; error: string };

/** Everything a video is rendering: its preview, its final, the check on the preview and the clips of its beats. */
export type RenderStatus = {
  preview: JobStatus;
  final: JobStatus;
  /** The take proxies the cut pass plays. Never `current` until every take has one. */
  live: JobStatus;
  check: CheckStatus;
  /** Beat clips not on disk yet, by beat id. */
  clips: Record<string, "queued" | "rendering" | "failed">;
};

/**
 * Speech no model could transcribe, for a person to type. `seconds` is on the cut's clock, while
 * `start` and `end` are on the take's.
 */
export type SpeechGap = {
  source: string;
  start: number;
  end: number;
  /** Where it plays in the cut. A stretch the cut removed sits at the next kept line. */
  seconds: number;
  cut?: boolean;
};

export type ReviewModel = {
  id: string;
  title: string;
  /** "In Descript", "On this computer". */
  route: string;
  /** The tool behind the edit, carried from the edit by the shared model. Absent means the page shows nothing extra. */
  backend?: ReviewBackend;
  /** Where "Open in Descript" goes: the project on the web, and the same project through the desktop app's link. Absent for a project that isn't a Descript one. */
  descript?: { web: string; app: string };
  /** The one line the header says about where the video is, e.g. "Reviewing inserts". */
  status: { tone: Tone; text: string };
  groups: PassGroup[];
  passes: Pass[];
  kinds: BeatKind[];
  paragraphs: Paragraph[];
  beats: Beat[];
  music?: Music;
  player?: Player;
  /** Where the video's preview, final, cut check and clips stand. Absent for tools that don't render. The checks that failed arrive as notes with `check` set. */
  render?: RenderStatus;
  /** Speech with no words yet, from the last transcript check. Absent when there is none. */
  speechGaps?: SpeechGap[];
  notes: Note[];
  session: Session;
  /** The prompt the agent dock copies: pasted into your agent, it plugs that session into this page. */
  connect?: string;
  /** The file the model was read from failed its schema. The page shows it with a fix action. */
  error?: string;
};

// ---------- actions: everything the page can send ----------

export type NoteAct = "tick" | "reopen" | "accept" | "dismiss" | "remove";

export type ReviewAction =
  | { type: "decide"; beat: string; state: BeatState; pick?: string }
  | { type: "music"; keep: string }
  | { type: "music"; skip: true }
  | { type: "music"; more: true }
  | { type: "note"; target: NoteTarget; text: string; chat?: boolean; reply?: string }
  | { type: "note.act"; note: string; act: NoteAct }
  | { type: "note.reply"; note: string; text: string }
  | { type: "speech"; source: string; start: number; end: number; text: string }
  | { type: "refresh" };

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

// ---------- the adapter: the one seam a tool implements ----------

/**
 * A tool plugs into the review by implementing this on the server, so it never touches a route.
 */
export interface ReviewAdapter {
  /** Build the model for one video. Throw a `ReviewError` for a missing video. */
  load(id: string): Promise<ReviewModel>;
  /** Apply one action. Validation of the action's shape has already happened. */
  act(id: string, action: ReviewAction): Promise<ActionResult>;
  /** The file on disk behind a media URL the model handed out, or null to refuse it. */
  media(id: string, file: string): string | null;
  /** Call `changed` whenever the video's files change. Return the unsubscribe. */
  watch(id: string, changed: () => void): () => void;
  /** The shelves the note box's @ picker offers. A pick is written into the note as `[shelf: item id]`. */
  library?(id: string): Promise<Shelf[]>;
}

/** One shelf of reusable media: motion templates, layouts, b-roll, sounds. `src` is a preview URL. */
export type Shelf = {
  id: string;
  label: string;
  items: { id: string; name: string; src?: string; meta?: string; preview?: LayoutPreview }[];
};

// ---------- icons ----------

/** Every icon the package draws. One sprite, one stroke weight. */
export type IconName =
  | "layout"
  | "motion"
  | "broll"
  | "sound"
  | "music"
  | "caption"
  | "zoom"
  | "note"
  | "check"
  | "refresh"
  | "keys"
  | "plug"
  | "panel-left"
  | "panel-right"
  | "back"
  | "x"
  | "play"
  | "pause"
  // WHY: note pins, undo, send, chevrons and the agent face need glyphs the first 18 didn't cover.
  | "clock"
  | "span"
  | "frame"
  | "quote"
  | "video"
  | "trash"
  | "undo"
  | "send"
  | "chevron"
  | "plus"
  | "expand"
  | "minus"
  | "alert"
  | "bot"
  | "sun"
  | "moon"
  // WHY: the one mark for "copy this for an agent", the app's four-point star.
  | "spark"
  // WHY: the quiet "Agent notes" disclosure needs an info mark.
  | "info"
  // WHY: the transport steps 5 seconds either side of play, as the first Shorts room did.
  | "skip-back"
  | "skip-fwd"
  // WHY: "Open in Descript" leaves this page, so it takes the arrow out of a box.
  | "external";
