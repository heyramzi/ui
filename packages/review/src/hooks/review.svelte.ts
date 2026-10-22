import { applyOptimistic } from "#src/core/optimistic.js";
import type { ReviewClient } from "#src/client/http.js";
import type { ReviewAction, ReviewModel, Session } from "#src/core/types.js";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type Connection = "connecting" | "up" | "down";

type Pending = {
  key: number;
  tempId: string;
  action: ReviewAction;
  settled: boolean;
};

const SAVED_FOR = 1800;
const MIN_SPIN = 700;
const SETTLE_WAIT = 1500;

/**
 * The model the page draws. Actions show at once, and a failed one drops out so the screen falls back.
 */
export function createReview(client: ReviewClient) {
  let confirmed = $state.raw<ReviewModel | null>(null);
  let pending = $state.raw<Pending[]>([]);
  let connection = $state<Connection>("connecting");
  let save = $state<SaveStatus>("idle");
  let saveError = $state("");
  let reloading = $state(false);
  let loadError = $state("");
  let seq = 0;
  let chain: Promise<void> = Promise.resolve();
  let savedTimer: ReturnType<typeof setTimeout> | undefined;
  let failed: ReviewAction | null = null;
  let unsubscribe: (() => void) | undefined;

  const model = $derived.by(() =>
    confirmed
      ? pending.reduce((acc, item) => applyOptimistic(acc, item.action, item.tempId), confirmed)
      : null,
  );
  const session = $derived<Session>(
    connection === "down" ? "offline" : (model?.session ?? "offline"),
  );

  function setSave(next: SaveStatus) {
    clearTimeout(savedTimer);
    save = next;
    if (next === "saved") savedTimer = setTimeout(() => (save = "idle"), SAVED_FOR);
  }

  /** A model from the server is the truth: every action it already includes stops being pending. */
  function accept(next: ReviewModel) {
    confirmed = next;
    loadError = "";
    pending = pending.filter((item) => !item.settled);
  }

  async function load(): Promise<void> {
    try {
      accept(await client.load());
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Couldn't load this video.";
    }
  }

  async function send(item: Pending): Promise<void> {
    let ok = false;
    let error = "";
    try {
      const result = await client.act(item.action);
      ok = result.ok;
      if (!result.ok) error = result.error;
    } catch {
      error = "Couldn't reach Editor OS.";
    }
    if (!ok) {
      pending = pending.filter((entry) => entry.key !== item.key);
      failed = item.action;
      saveError = error;
      setSave("error");
      return;
    }
    // A model that arrived mid-act may predate the write, so only a model read after the write
    // retires the act; if the stream doesn't push one, we ask.
    pending = pending.map((entry) =>
      entry.key === item.key ? { ...entry, settled: true } : entry,
    );
    setTimeout(
      () => {
        if (pending.some((entry) => entry.key === item.key)) void load();
      },
      connection === "up" ? SETTLE_WAIT : 0,
    );
    if (pending.every((entry) => entry.settled)) setSave("saved");
  }

  function act(action: ReviewAction): void {
    seq += 1;
    const item: Pending = { key: seq, tempId: `tmp-${seq}`, action, settled: false };
    pending = [...pending, item];
    failed = null;
    setSave("saving");
    chain = chain.then(() => send(item));
  }

  async function refresh(): Promise<void> {
    if (reloading) return;
    reloading = true;
    const started = Date.now();
    await client.act({ type: "refresh" }).catch(() => undefined);
    await load();
    await new Promise((done) => setTimeout(done, Math.max(0, MIN_SPIN - (Date.now() - started))));
    reloading = false;
  }

  /** Read the model again, without asking the backend to pull anything. Sync uses this. */
  async function reload(): Promise<void> {
    await load();
  }

  return {
    get model() {
      return model;
    },
    get session() {
      return session;
    },
    get connection() {
      return connection;
    },
    get save() {
      return save;
    },
    get saveError() {
      return saveError;
    },
    get reloading() {
      return reloading;
    },
    get loadError() {
      return loadError;
    },
    act,
    refresh,
    reload,
    retry() {
      if (failed) act(failed);
    },
    async start() {
      await load();
      unsubscribe = client.subscribe({
        model: accept,
        connection: (up) => {
          const was = connection;
          connection = up ? "up" : "down";
          // WHY: after an outage the stream's first model is the catch-up, but a load is cheap insurance.
          if (up && was === "down") void load();
        },
      });
    },
    stop() {
      unsubscribe?.();
      clearTimeout(savedTimer);
    },
  };
}

export type Review = ReturnType<typeof createReview>;
