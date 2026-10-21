<script lang="ts">
	// The only file that knows Zag. Swap the machine and nothing else in the package changes.
	import * as zag from "@zag-js/tour";
	import { normalizeProps, portal, useMachine } from "@zag-js/svelte";
	import { onMount, tick, untrack } from "svelte";
	import TourCard from "#src/onboarding/tour-card.svelte";
	import type { Outcome, Step, Strings, Tour } from "#src/onboarding/types.js";

	let {
		tour,
		steps,
		strings,
		onfinish,
	}: {
		tour: Tour;
		steps: Step[];
		strings: Strings;
		/** `null` means the tour never showed, so nothing is worth recording. */
		onfinish: (outcome: Outcome | null) => void;
	} = $props();

	// The provider keys this component per run, so the tour never changes under it.
	const { tour: fixed, steps: fixedSteps } = untrack(() => ({ tour, steps }));
	const intro = fixed.kind === "intro" ? fixed : null;

	const zagSteps: zag.StepDetails[] = intro
		? [{ id: "intro", type: "dialog", title: intro.title, description: intro.body, backdrop: true }]
		: fixedSteps.map((step, i) => ({
				id: `step-${i}`,
				type: "tooltip",
				target: () => document.querySelector<HTMLElement>(step.target),
				title: step.title,
				description: step.body,
				placement: step.placement ?? "bottom",
				offset: { mainAxis: 12 },
				backdrop: true,
			}));

	let finished = false;
	function finish(outcome: Outcome | null) {
		if (finished) return;
		finished = true;
		onfinish(outcome);
	}

	// Dismissing on the last step reports "dismissed" and then "completed" in one go, so the
	// dismissal waits a microtask and the completion wins.
	function onStatusChange({ status }: zag.StatusChangeDetails) {
		if (status === "completed") finish("completed");
		else if (status === "dismissed" || status === "skipped") queueMicrotask(() => finish("dismissed"));
		else if (status === "not-found") finish(null);
	}

	const id = $props.id();
	const service = useMachine(zag.machine, () => ({
		id,
		steps: zagSteps,
		onStatusChange,
		closeOnInteractOutside: false,
		spotlightOffset: { x: 8, y: 8 },
		spotlightRadius: 10,
		translations: {
			progressText: ({ current, total }) => strings.progress(current + 1, total),
			nextStep: strings.next,
			prevStep: strings.back,
			close: strings.skip,
			skip: strings.skip,
		},
	}));
	const api = $derived(zag.connect(service, normalizeProps));

	const dismiss = () => service.send({ type: "DISMISS" });

	onMount(() => api.start());

	// Zag marks a repositioning (scroll, resize) with a zero-length spotlight transition. The
	// backdrop hole has to snap with it, or it trails the ring.
	const instant = $derived(String(api.getSpotlightProps().style ?? "").includes("0ms"));

	let card = $state<HTMLElement | null>(null);
	let cleanupMargin: (() => void) | null = null;

	// Under 640px the card is a sheet over the bottom of the screen. Scroll the target above it.
	$effect(() => {
		const step = api.open ? api.step : null;
		cleanupMargin?.();
		cleanupMargin = null;
		if (!step?.target || !matchMedia("(max-width: 639px)").matches) return;
		let cancelled = false;
		void tick().then(() => {
			const target = step.target?.();
			if (cancelled || !target || !card) return;
			const previous = target.style.scrollMarginBottom;
			target.style.scrollMarginBottom = `${card.offsetHeight + 16}px`;
			target.scrollIntoView({ block: "nearest", behavior: "instant" });
			cleanupMargin = () => {
				target.style.scrollMarginBottom = previous;
			};
		});
		return () => {
			cancelled = true;
		};
	});

	const index = $derived(Math.max(api.stepIndex, 0));
	const step = $derived(api.step);
</script>

{#if step}
	<div use:portal {...api.getBackdropProps()} class="tour-backdrop" data-instant={instant || undefined}></div>
	<div use:portal {...api.getSpotlightProps()} class="tour-spotlight"></div>
	<div use:portal {...api.getPositionerProps()} class="tour-positioner">
		<div
			{...api.getContentProps()}
			bind:this={card}
			class={["tour-card bg-popover text-popover-foreground ring-foreground/10 shadow-overlay pointer-events-auto max-w-full text-sm ring-1 outline-none", intro ? "w-96 rounded-2xl" : "w-80 rounded-xl"]}
		>
			<TourCard
				title={String(step.title)}
				body={String(step.description)}
				image={intro?.image}
				intro={intro !== null}
				{index}
				total={api.totalSteps}
				{strings}
				titleAttrs={api.getTitleProps()}
				bodyAttrs={api.getDescriptionProps()}
				onclose={dismiss}
				onprev={() => api.prev()}
				onnext={() => (api.lastStep ? dismiss() : api.next())}
			/>
		</div>
	</div>
{/if}

<style>
	.tour-backdrop,
	.tour-spotlight,
	.tour-positioner {
		--tour-z-index: 60;
		z-index: calc(var(--tour-layer) + var(--tour-z-index));
	}
	.tour-backdrop {
		background: oklch(0 0 0 / 0.5);
		transition: clip-path var(--duration-fast) var(--ease-smooth-out);
	}
	.tour-backdrop[data-instant] {
		transition-duration: 0ms;
	}
	.tour-spotlight {
		outline: 2px solid oklch(1 0 0 / 0.7);
		transition-property: left, top, width, height;
		transition-duration: var(--duration-fast);
		transition-timing-function: var(--ease-smooth-out);
	}
	.tour-positioner[data-type="dialog"] {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 1rem;
		pointer-events: none;
	}
	.tour-card[data-state="open"] {
		animation: tour-in var(--duration-fast) var(--ease-smooth-out);
	}
	@keyframes tour-in {
		from {
			opacity: 0;
			scale: 0.97;
		}
	}
	@media (max-width: 639px) {
		.tour-positioner {
			position: fixed !important;
			inset: auto 0 0 0 !important;
			transform: none !important;
			translate: none !important;
			min-width: 0 !important;
			width: auto !important;
			display: block !important;
			padding: 0.75rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom));
		}
		.tour-card {
			width: 100%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tour-backdrop,
		.tour-spotlight {
			transition: none;
		}
		.tour-card[data-state="open"] {
			animation: none;
		}
	}
</style>
