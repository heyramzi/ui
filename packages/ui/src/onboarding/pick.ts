import type { Step, Tour } from "#src/onboarding/types.js";

export type SeenMap = Record<string, number>;

/** The seen version has to reach the tour's own, so bumping `version` shows it again. */
export function isSeen(tour: Tour, seen: SeenMap): boolean {
	return (seen[tour.id] ?? 0) >= (tour.version ?? 1);
}

export function toursForRoute(tours: readonly Tour[], routeId: string | null | undefined): Tour[] {
	return routeId ? tours.filter((tour) => tour.route === routeId) : [];
}

/** The first unseen tour on a route, in the order they were defined. One per page view. */
export function pickTour(
	tours: readonly Tour[],
	routeId: string | null | undefined,
	seen: SeenMap,
): Tour | undefined {
	return toursForRoute(tours, routeId).find((tour) => !isSeen(tour, seen));
}

/** What replay starts: a named tour, or the page's first one whether or not it was seen. */
export function pickForReplay(
	tours: readonly Tour[],
	routeId: string | null | undefined,
	tourId?: string,
): Tour | undefined {
	if (tourId) return tours.find((tour) => tour.id === tourId);
	return toursForRoute(tours, routeId)[0];
}

/** Keeps the steps whose target is on the page. A tour with none left starts nothing. */
export function keepFoundSteps(steps: readonly Step[], exists: (selector: string) => boolean): Step[] {
	return steps.filter((step) => exists(step.target));
}
