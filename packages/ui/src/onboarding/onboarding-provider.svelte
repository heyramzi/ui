<script lang="ts">
	import { tryCatchAsync } from "#src/lib/result.js";
	import { untrack } from "svelte";
	import { onboarding } from "#src/onboarding/onboarding.svelte.js";
	import {
		keepFoundSteps,
		pickForReplay,
		pickTour,
		toursForRoute,
		type SeenMap,
	} from "#src/onboarding/pick.js";
	import TourRunner from "#src/onboarding/tour-runner.svelte";
	import type { Outcome, SeenStore, Step, Strings, Tour } from "#src/onboarding/types.js";
	import { waitForElement } from "#src/onboarding/wait.js";

	let {
		tours,
		store,
		strings,
		routeId,
		enabled = true,
		replayKey = true,
		waitMs = 2000,
	}: {
		tours: readonly Tour[];
		store: SeenStore;
		strings: Strings;
		/** `page.route.id`. A tour runs on the route it names. */
		routeId: string | null | undefined;
		/** False while signed out, or anywhere a tour has no business starting. */
		enabled?: boolean;
		/** Press `?` to replay this page's tour. */
		replayKey?: boolean;
		/** How long to wait for the first target before giving the tour up. */
		waitMs?: number;
	} = $props();

	type Active = { tour: Tour; steps: Step[]; replay: boolean; run: number };

	let active = $state<Active | null>(null);
	let seen: SeenMap | null = null;
	let loaded: Promise<SeenMap | null> | null = null;
	let run = 0;

	// One read per session. A failed read shows nothing: a tour repeating on every page is worse than none.
	function loadSeen(): Promise<SeenMap | null> {
		loaded ??= store.load().then(
			(map) => (seen = map),
			() => null,
		);
		return loaded;
	}

	async function launch(tour: Tour, replay: boolean, signal: AbortSignal): Promise<boolean> {
		let steps: Step[] = [];
		if (tour.kind === "steps") {
			await waitForElement(tour.steps[0].target, waitMs, signal);
			if (signal.aborted) return false;
			steps = keepFoundSteps(tour.steps, (selector) => document.querySelector(selector) !== null);
			if (steps.length === 0) return false;
		}
		if (active) return false;
		active = { tour, steps, replay, run: ++run };
		return true;
	}

	let controller: AbortController | null = null;

	$effect(() => {
		const id = routeId;
		const list = tours;
		const on = enabled;
		onboarding.hasTour = on && toursForRoute(list, id).length > 0;
		active = null;
		if (!on || !id) return;
		const mine = new AbortController();
		controller = mine;
		void loadSeen().then((map) => {
			if (!map || mine.signal.aborted) return;
			const tour = pickTour(
				untrack(() => tours),
				id,
				map,
			);
			if (tour) void launch(tour, false, mine.signal);
		});
		return () => mine.abort();
	});

	$effect(() =>
		onboarding.bind(async (tourId) => {
			const tour = pickForReplay(tours, routeId, tourId);
			if (!tour || !controller || controller.signal.aborted) return false;
			return launch(tour, true, controller.signal);
		}),
	);

	$effect(() => {
		onboarding.running = active !== null;
		return () => {
			onboarding.running = false;
		};
	});

	async function finish(outcome: Outcome | null) {
		const done = active;
		active = null;
		if (!done || done.replay || !outcome) return;
		const version = done.tour.version ?? 1;
		if (seen) seen = { ...seen, [done.tour.id]: version };
		// A failed write shows the tour again next session, which beats an error toast.
		await tryCatchAsync(() => store.markSeen(done.tour.id, version, outcome));
	}

	function onkeydown(event: KeyboardEvent) {
		if (!replayKey || event.key !== "?" || event.ctrlKey || event.metaKey || event.altKey) return;
		const el = event.target instanceof HTMLElement ? event.target : null;
		if (el?.closest("input, textarea, select, [contenteditable]")) return;
		if (el?.isContentEditable) return;
		if (!onboarding.hasTour || active) return;
		event.preventDefault();
		void onboarding.replay();
	}
</script>

<svelte:window {onkeydown} />

{#if active}
	{#key active.run}
		<TourRunner tour={active.tour} steps={active.steps} {strings} onfinish={finish} />
	{/key}
{/if}
