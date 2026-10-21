import { describe, expect, it } from "vite-plus/test";
import { isSeen, keepFoundSteps, pickForReplay, pickTour, toursForRoute } from "#src/onboarding/pick.js";
import type { Tour } from "#src/onboarding/types.js";

const step = { target: "#a", title: "A", body: "a" };
const tours: Tour[] = [
	{ id: "home", route: "/(app)", kind: "intro", title: "Hi", body: "Welcome." },
	{ id: "board", route: "/(app)/projects", kind: "steps", steps: [step] },
	{ id: "board-extra", route: "/(app)/projects", kind: "steps", steps: [step], version: 2 },
	{ id: "record", route: "/(app)/projects/[id]", kind: "steps", steps: [step] },
];

describe("isSeen", () => {
	it("counts a tour as seen once the stored version reaches its own", () => {
		expect(isSeen(tours[1], {})).toBe(false);
		expect(isSeen(tours[1], { board: 1 })).toBe(true);
		expect(isSeen(tours[2], { "board-extra": 1 })).toBe(false);
		expect(isSeen(tours[2], { "board-extra": 2 })).toBe(true);
	});

	it("shows a tour again after its version is bumped", () => {
		const v1: Tour = { id: "t", route: "/", kind: "steps", steps: [step] };
		const v2: Tour = { ...v1, version: 2 };
		expect(isSeen(v1, { t: 1 })).toBe(true);
		expect(isSeen(v2, { t: 1 })).toBe(false);
	});
});

describe("pickTour", () => {
	it("matches the route id exactly, so a params route never borrows its parent's tour", () => {
		expect(pickTour(tours, "/(app)", {})?.id).toBe("home");
		expect(pickTour(tours, "/(app)/projects/[id]", {})?.id).toBe("record");
		expect(pickTour(tours, "/(app)/settings", {})).toBeUndefined();
	});

	it("takes the first unseen tour on a route, one at a time", () => {
		expect(pickTour(tours, "/(app)/projects", {})?.id).toBe("board");
		expect(pickTour(tours, "/(app)/projects", { board: 1 })?.id).toBe("board-extra");
		expect(pickTour(tours, "/(app)/projects", { board: 1, "board-extra": 2 })).toBeUndefined();
	});

	it("picks nothing without a route", () => {
		expect(pickTour(tours, null, {})).toBeUndefined();
		expect(pickTour(tours, undefined, {})).toBeUndefined();
	});
});

describe("toursForRoute", () => {
	it("lists every tour on the route in definition order", () => {
		expect(toursForRoute(tours, "/(app)/projects").map((t) => t.id)).toEqual(["board", "board-extra"]);
	});
});

describe("pickForReplay", () => {
	it("restarts the page's first tour even when it was seen", () => {
		expect(pickForReplay(tours, "/(app)/projects")?.id).toBe("board");
	});

	it("finds a tour by id on any route", () => {
		expect(pickForReplay(tours, "/(app)", "record")?.id).toBe("record");
		expect(pickForReplay(tours, "/(app)", "missing")).toBeUndefined();
	});
});

describe("keepFoundSteps", () => {
	const steps = [
		{ ...step, target: "#a" },
		{ ...step, target: "#b" },
		{ ...step, target: "#c" },
	];

	it("drops the steps whose target isn't on the page", () => {
		expect(keepFoundSteps(steps, (s) => s !== "#b").map((s) => s.target)).toEqual(["#a", "#c"]);
	});

	it("returns nothing when no target is found, so no empty spotlight starts", () => {
		expect(keepFoundSteps(steps, () => false)).toEqual([]);
	});
});
