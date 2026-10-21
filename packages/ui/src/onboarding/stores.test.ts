import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { localStorageStore, memoryStore } from "#src/onboarding/stores.js";
import type { SeenStore } from "#src/onboarding/types.js";

function fakeStorage(): Storage {
	const data = new Map<string, string>();
	return {
		get length() {
			return data.size;
		},
		clear: () => data.clear(),
		getItem: (key) => data.get(key) ?? null,
		key: (i) => [...data.keys()][i] ?? null,
		removeItem: (key) => void data.delete(key),
		setItem: (key, value) => void data.set(key, String(value)),
	};
}

function behavesLikeAStore(make: () => SeenStore) {
	it("starts empty", async () => {
		expect(await make().load()).toEqual({});
	});

	it("remembers the version it saw", async () => {
		const store = make();
		await store.markSeen("home", 1, "completed");
		await store.markSeen("board", 2, "dismissed");
		expect(await store.load()).toEqual({ home: 1, board: 2 });
	});

	it("never goes back to an older version", async () => {
		const store = make();
		await store.markSeen("home", 3, "completed");
		await store.markSeen("home", 2, "completed");
		expect((await store.load()).home).toBe(3);
	});

	it("resets one tour or all of them", async () => {
		const store = make();
		await store.markSeen("home", 1, "completed");
		await store.markSeen("board", 1, "completed");
		await store.reset("home");
		expect(await store.load()).toEqual({ board: 1 });
		await store.reset();
		expect(await store.load()).toEqual({});
	});
}

describe("memoryStore", () => {
	behavesLikeAStore(() => memoryStore());

	it("takes a starting state and keeps its own copy", async () => {
		const initial = { home: 1 };
		const store = memoryStore(initial);
		await store.markSeen("board", 1, "completed");
		expect(initial).toEqual({ home: 1 });
		expect(await store.load()).toEqual({ home: 1, board: 1 });
	});
});

describe("localStorageStore", () => {
	beforeEach(() => {
		vi.stubGlobal("localStorage", fakeStorage());
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	behavesLikeAStore(() => localStorageStore());

	it("shares state between two stores on one key and keeps keys apart", async () => {
		await localStorageStore("a").markSeen("home", 1, "completed");
		expect(await localStorageStore("a").load()).toEqual({ home: 1 });
		expect(await localStorageStore("b").load()).toEqual({});
	});

	it("reads corrupt or foreign data as empty", async () => {
		localStorage.setItem("heyramzi:onboarding", "{nope");
		expect(await localStorageStore().load()).toEqual({});
		localStorage.setItem("heyramzi:onboarding", JSON.stringify(["x"]));
		expect(await localStorageStore().load()).toEqual({});
		localStorage.setItem("heyramzi:onboarding", JSON.stringify({ home: 1, bad: "yes" }));
		expect(await localStorageStore().load()).toEqual({ home: 1 });
	});

	it("doesn't throw when storage is blocked", async () => {
		vi.stubGlobal("localStorage", {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {
				throw new Error("blocked");
			},
			removeItem: () => {
				throw new Error("blocked");
			},
		});
		const store = localStorageStore();
		expect(await store.load()).toEqual({});
		await expect(store.markSeen("home", 1, "completed")).resolves.toBeUndefined();
		await expect(store.reset()).resolves.toBeUndefined();
	});
});
