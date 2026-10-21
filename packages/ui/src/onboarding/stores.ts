import { tryCatch } from "#src/lib/result.js";
import type { Outcome, SeenStore } from "#src/onboarding/types.js";

type Seen = Record<string, number>;

/** Holds seen-state in memory. Tests and previews. */
export function memoryStore(initial: Seen = {}): SeenStore {
	let seen: Seen = { ...initial };
	return {
		async load() {
			return { ...seen };
		},
		async markSeen(tourId, version, _outcome: Outcome) {
			seen[tourId] = Math.max(seen[tourId] ?? 0, version);
		},
		async reset(tourId) {
			if (tourId === undefined) seen = {};
			else delete seen[tourId];
		},
	};
}

function readSeen(key: string): Seen {
	const read = tryCatch(() => JSON.parse(localStorage.getItem(key) ?? "{}") as unknown);
	const parsed = read.ok ? read.value : null;
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
	return Object.fromEntries(
		Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
	);
}

// Blocked storage (private mode, a full disk) means the tour shows again next visit, which beats an error.
function writeSeen(key: string, seen: Seen): void {
	tryCatch(() => localStorage.setItem(key, JSON.stringify(seen)));
}

/** Keeps seen-state in this browser. Demos and signed-out pages. */
export function localStorageStore(key = "heyramzi:onboarding"): SeenStore {
	return {
		async load() {
			return readSeen(key);
		},
		async markSeen(tourId, version, _outcome: Outcome) {
			const seen = readSeen(key);
			seen[tourId] = Math.max(seen[tourId] ?? 0, version);
			writeSeen(key, seen);
		},
		async reset(tourId) {
			if (tourId === undefined) {
				tryCatch(() => localStorage.removeItem(key));
				return;
			}
			const seen = readSeen(key);
			delete seen[tourId];
			writeSeen(key, seen);
		},
	};
}
