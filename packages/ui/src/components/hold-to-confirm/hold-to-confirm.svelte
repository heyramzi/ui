<script lang="ts">
	// ========================= IMPORTS
	import { cn } from "#src/lib/utils.js";
	import LiveRegion from "#src/lib/live-region.svelte";
	import { buttonVariants, type ButtonSize, type ButtonVariant } from "#src/shadcn/button/index.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	// ========================= TYPES
	interface Props extends Omit<HTMLButtonAttributes, "class"> {
		duration?: number;
		onConfirm: () => void;
		disabled?: boolean;
		/** Uses the button recipe so call sites stop drawing their own.
		 *  `variant: null` opts out, for a caller that really is a menu row. */
		variant?: ButtonVariant | null;
		size?: ButtonSize;
		/** Square, for a glyph with no label. Mirrors `Button`. */
		icon?: boolean;
		class?: string;
		idle: Snippet;
		holding: Snippet;
		/** Read out when a screen reader's activate arms the button. Translate at the call site. */
		confirmPrompt?: string;
	}

	// A screen reader's activate can't hold, so its first click arms and a second one inside this window confirms.
	const ARM_MS = 5000;

	// ========================= PROPS
	let {
		duration = 800,
		onConfirm,
		disabled = false,
		variant = "destructive",
		size = "default",
		icon = false,
		class: className = "",
		idle,
		holding,
		confirmPrompt = "Press again to confirm",
		...restProps
	}: Props = $props();

	// ========================= STATE
	let progress = $state(0);
	let isHolding = $state(false);
	let rafId: number | null = $state(null);
	let startTime: number | null = $state(null);
	let armed = $state(false);
	let armTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => () => {
		if (armTimer !== null) clearTimeout(armTimer);
	});

	// ========================= FUNCTIONS
	function startHold() {
		// A held key repeats keydown, and restarting the clock on each one stalled the fill at 6%.
		if (disabled || isHolding) return;
		isHolding = true;
		startTime = performance.now();
		tick();
	}

	function tick() {
		if (!isHolding || startTime === null) return;

		const elapsed = performance.now() - startTime;
		progress = Math.min(elapsed / duration, 1);

		if (progress >= 1) {
			complete();
			return;
		}

		rafId = requestAnimationFrame(tick);
	}

	function cancelHold() {
		if (!isHolding) return;
		isHolding = false;
		startTime = null;
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		// WHY: dropping is-holding lets the fill retract via the CSS transition below
		progress = 0;
	}

	function complete() {
		isHolding = false;
		startTime = null;
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		onConfirm();
		// Reset after confirm fires
		progress = 0;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			startHold();
		}
	}

	function handleKeyup(e: KeyboardEvent) {
		if (e.key === " " || e.key === "Enter") {
			// Space clicks on keyup, and that click would arm the button behind a real hold.
			e.preventDefault();
			cancelHold();
		}
	}

	function disarm() {
		armed = false;
		if (armTimer !== null) clearTimeout(armTimer);
		armTimer = null;
	}

	// A pointer or a held key sends detail 1 or more. Assistive tech's activate sends a bare click, detail 0.
	function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		restProps.onclick?.(e);
		if (disabled || e.detail !== 0) return;
		if (armed) {
			disarm();
			onConfirm();
			return;
		}
		armed = true;
		armTimer = setTimeout(disarm, ARM_MS);
	}
</script>

<!-- ========================= MARKUP -->
<button
	{...restProps}
	type="button"
	class={cn(
		// Callers size this at about 22px. On touch, a hold needs a box the finger
		// can stay inside for the whole press without cancelling it.
		"hold-to-confirm relative overflow-hidden select-none",
		"any-pointer-coarse:inline-flex any-pointer-coarse:min-h-10 any-pointer-coarse:min-w-10 any-pointer-coarse:items-center any-pointer-coarse:justify-center",
		variant && buttonVariants({ variant, size, icon }),
		disabled && "pointer-events-none opacity-50",
		className,
	)}
	style="--progress: {progress}"
	data-holding={isHolding}
	data-armed={armed}
	onclick={handleClick}
	onpointerdown={startHold}
	onpointerup={cancelHold}
	onpointerleave={cancelHold}
	onpointercancel={cancelHold}
	onkeydown={handleKeydown}
	onkeyup={handleKeyup}
	onblur={(e) => {
		cancelHold();
		disarm();
		restProps.onblur?.(e);
	}}
	{disabled}
>
	<!-- Fill sweep: scales from the left across the whole control -->
	<span
		class="hold-to-confirm-fill pointer-events-none absolute inset-0 z-0 origin-left bg-destructive"
		class:is-holding={isHolding}
	></span>

	<!-- Leading edge: a bright sliver that rides the head of the fill -->
	<span
		class="hold-to-confirm-edge pointer-events-none absolute inset-y-0 z-0"
		class:is-holding={isHolding}
	></span>

	<!-- Content -->
	<span class="relative z-[1] flex items-center gap-1.5">
		{#if isHolding}
			<span class="hold-to-confirm-text flex items-center gap-1.5 text-destructive-foreground">
				{@render holding()}
			</span>
		{:else}
			<span class="hold-to-confirm-text flex items-center gap-1.5">
				{@render idle()}
			</span>
		{/if}
	</span>
</button>
<!-- Outside the button so it isn't part of its name, and mounted empty so the prompt is read when it lands. -->
<LiveRegion message={armed ? confirmPrompt : ""} />

<!-- ========================= STYLE -->
<style>
	@layer theme, base, components, utilities;

	@layer components {
		.hold-to-confirm {
			touch-action: none;
		}

		.hold-to-confirm:active:not(:disabled) {
			transform: scale(0.97);
		}

		/* Fill: GPU-friendly scaleX. A vertical sheen survives the horizontal
		   scale because it runs top-to-bottom, so the wipe keeps a crisp surface. */
		.hold-to-confirm-fill {
			transform: scaleX(var(--progress, 0));
			background-image: linear-gradient(
				to bottom,
				color-mix(in oklch, var(--color-destructive-foreground) 14%, transparent),
				transparent 55%
			);
			transition: transform var(--duration-quick) var(--ease-smooth-out);
		}

		.hold-to-confirm-fill.is-holding {
			transition: none;
		}

		/* Leading edge: positioned (not scaled) so its glow stays crisp at any
		   width. Sits exactly at the head of the fill and fades in while held. */
		.hold-to-confirm-edge {
			left: calc(var(--progress, 0) * 100%);
			width: 2px;
			margin-left: -2px;
			opacity: 0;
			background: color-mix(
				in oklch,
				var(--color-destructive-foreground) 65%,
				var(--color-destructive)
			);
			box-shadow: 0 0 4px 0 color-mix(in oklch, var(--color-destructive) 92%, transparent);
			transition:
				left var(--duration-quick) var(--ease-smooth-out),
				opacity var(--duration-quick) var(--ease-out);
		}

		.hold-to-confirm-edge.is-holding {
			opacity: 1;
			transition: opacity var(--duration-quick) var(--ease-out);
		}

		.hold-to-confirm-text {
			animation: holdTextFadeIn var(--duration-quick) var(--ease-out);
		}

		@media (prefers-reduced-motion: reduce) {
			.hold-to-confirm:active:not(:disabled) {
				transform: none;
			}

			.hold-to-confirm-fill {
				transition: none;
				transform: scaleX(var(--progress, 0));
				background-image: none;
				opacity: 0.5;
			}

			.hold-to-confirm-edge {
				transition: none;
				box-shadow: none;
			}

			.hold-to-confirm-text {
				animation: none;
			}
		}
	}

	@keyframes holdTextFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
