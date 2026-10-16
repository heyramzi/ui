import type { ReviewClient } from "#src/client/http.js";
import { findItem } from "#src/core/refs.js";
import type { Shelf } from "#src/core/types.js";

/** The adapter's shelves, fetched once. A tool with no `library` has none, and the picker stays shut. */
export function createLibrary(client: ReviewClient) {
  let shelves = $state.raw<Shelf[]>([]);
  let ready = $state(false);
  let loading: Promise<void> | undefined;

  return {
    get shelves() {
      return shelves;
    },
    /** True once the shelves have come back, even empty. */
    get ready() {
      return ready;
    },
    /** Load on first ask. A failed load is retried on the next one. */
    ensure(): Promise<void> {
      loading ??= (client.library?.() ?? Promise.resolve([])).then(
        (found) => {
          shelves = found;
          ready = true;
        },
        () => void (loading = undefined),
      );
      return loading;
    },
    find: (shelf: string, id: string) => findItem(shelves, shelf, id),
  };
}

export type Library = ReturnType<typeof createLibrary>;
