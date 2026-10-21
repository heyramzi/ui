import { MAX_STEPS, type Tour } from "#src/onboarding/types.js";

function fail(id: string, problem: string): never {
	throw new Error(`tour "${id}": ${problem}`);
}

/** Returns the tours as written, after checking what a typo would hide until a user hits it. */
export function defineTours<const T extends readonly Tour[]>(tours: T): T {
	const ids = new Set<string>();
	for (const tour of tours) {
		const { id } = tour;
		if (!id || !id.trim()) throw new Error("a tour needs an id");
		if (ids.has(id)) fail(id, "its id is used twice");
		ids.add(id);
		if (!tour.route.startsWith("/")) fail(id, `route "${tour.route}" is not a route id`);
		const version = tour.version ?? 1;
		if (!Number.isInteger(version) || version < 1) fail(id, "version is a whole number from 1");
		if (tour.kind === "intro") {
			if (!tour.title || !tour.body) fail(id, "an intro needs a title and a body");
			continue;
		}
		if (tour.steps.length < 1 || tour.steps.length > MAX_STEPS) {
			fail(id, `has ${tour.steps.length} steps, and a tour takes 1 to ${MAX_STEPS}`);
		}
		tour.steps.forEach((step, i) => {
			if (!step.target.trim()) fail(id, `step ${i + 1} has no target`);
			if (!step.title || !step.body) fail(id, `step ${i + 1} needs a title and a body`);
		});
	}
	return tours;
}
