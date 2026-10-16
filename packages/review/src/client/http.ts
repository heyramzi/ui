import type { ActionResult, ReviewAction, ReviewModel, Shelf } from "#src/core/types.js";

/** Everything the page needs from a server, so a test or a demo can stand in for HTTP. */
export type ReviewClient = {
  load(): Promise<ReviewModel>;
  /** The shelves the note box's @ picker offers. Left out, the picker stays shut. */
  library?(): Promise<Shelf[]>;
  act(action: ReviewAction): Promise<ActionResult>;
  /** Push fresh models and the connection state. Returns the unsubscribe. */
  subscribe(handlers: {
    model(model: ReviewModel): void;
    connection(up: boolean): void;
  }): () => void;
};

export type ClientOptions = { base: string; id: string };

function isModel(value: unknown): value is ReviewModel {
  if (typeof value !== "object" || value === null) return false;
  const model = value as Partial<Record<keyof ReviewModel, unknown>>;
  return (
    typeof model.id === "string" &&
    Array.isArray(model.passes) &&
    Array.isArray(model.groups) &&
    Array.isArray(model.beats) &&
    Array.isArray(model.notes) &&
    Array.isArray(model.paragraphs) &&
    Array.isArray(model.kinds)
  );
}

const RECONNECT = [1000, 2000, 4000, 8000] as const;

export function createHttpClient({ base, id }: ClientOptions): ReviewClient {
  const root = `${base.replace(/\/+$/, "")}/${encodeURIComponent(id)}`;
  return {
    async load() {
      const response = await fetch(`${root}/state`, { headers: { accept: "application/json" } });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof body === "object" && body !== null && "error" in body
            ? String(body.error)
            : response.statusText;
        throw new Error(message || "Couldn't load this video.");
      }
      if (!isModel(body)) throw new Error("Editor OS sent something this page can't read.");
      return body;
    },
    async library() {
      const response = await fetch(`${root}/library`, { headers: { accept: "application/json" } });
      const body: unknown = await response.json().catch(() => null);
      return response.ok && Array.isArray(body) ? (body as Shelf[]) : [];
    },
    async act(action) {
      const response = await fetch(`${root}/act`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action),
      });
      const body: unknown = await response.json().catch(() => null);
      if (typeof body === "object" && body !== null && "ok" in body) return body as ActionResult;
      return { ok: false, error: response.statusText || "Editor OS didn't answer." };
    },
    subscribe({ model, connection }) {
      let source: EventSource | undefined;
      let retry: ReturnType<typeof setTimeout> | undefined;
      let attempt = 0;
      let stopped = false;
      const open = () => {
        source = new EventSource(`${root}/events`);
        source.addEventListener("open", () => {
          attempt = 0;
          connection(true);
        });
        source.addEventListener("model", (event) => {
          const data: unknown = JSON.parse((event as MessageEvent<string>).data);
          if (isModel(data)) model(data);
        });
        source.addEventListener("error", () => {
          connection(false);
          // WHY: a non-200 answer closes the EventSource for good, so we reopen it ourselves.
          if (source?.readyState !== EventSource.CLOSED || stopped) return;
          source.close();
          retry = setTimeout(open, RECONNECT[Math.min(attempt++, RECONNECT.length - 1)]);
        });
      };
      open();
      return () => {
        stopped = true;
        clearTimeout(retry);
        source?.close();
      };
    },
  };
}
