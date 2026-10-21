import { describe, expect, it } from "vite-plus/test";
import { defineTours } from "#src/onboarding/define-tours.js";
import type { Step, Tour } from "#src/onboarding/types.js";

const step = (n: number): Step => ({ target: `[data-tour="s${n}"]`, title: `Title ${n}`, body: `Body ${n}` });
const steps = (count: number) => Array.from({ length: count }, (_, i) => step(i + 1));
const board = (over: Partial<Extract<Tour, { kind: "steps" }>> = {}): Tour => ({
	id: "board",
	route: "/(app)/projects",
	kind: "steps",
	steps: steps(3),
	...over,
});

describe("defineTours", () => {
	it("returns the tours it was given", () => {
		const list = [board(), { id: "home", route: "/(app)", kind: "intro", title: "Hi", body: "Welcome." } as const];
		expect(defineTours(list)).toBe(list);
	});

	it("rejects a repeated id", () => {
		expect(() => defineTours([board(), board({ route: "/(app)/other" })])).toThrow(/"board".*used twice/);
	});

	it("takes 1 to 6 steps", () => {
		expect(() => defineTours([board({ steps: steps(1) })])).not.toThrow();
		expect(() => defineTours([board({ steps: steps(6) })])).not.toThrow();
		expect(() => defineTours([board({ steps: [] })])).toThrow(/0 steps/);
		expect(() => defineTours([board({ steps: steps(7) })])).toThrow(/7 steps/);
	});

	it("rejects a route that isn't a route id", () => {
		expect(() => defineTours([board({ route: "projects" })])).toThrow(/not a route id/);
	});

	it("rejects a bad version", () => {
		expect(() => defineTours([board({ version: 0 })])).toThrow(/version/);
		expect(() => defineTours([board({ version: 1.5 })])).toThrow(/version/);
		expect(() => defineTours([board({ version: 2 })])).not.toThrow();
	});

	it("rejects a step with no target or no words", () => {
		expect(() => defineTours([board({ steps: [{ ...step(1), target: " " }] })])).toThrow(/step 1 has no target/);
		expect(() => defineTours([board({ steps: [{ ...step(1), body: "" }] })])).toThrow(/title and a body/);
	});

	it("rejects an intro with no title", () => {
		expect(() => defineTours([{ id: "home", route: "/(app)", kind: "intro", title: "", body: "x" }])).toThrow(/intro/);
	});
});
