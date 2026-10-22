<script lang="ts">
	import AvatarGroupHover from "#lib/demos/motion/avatar-group-hover.svelte";
	import CardTilt from "#lib/demos/motion/card-tilt.svelte";
	import DigitPopIn from "#lib/demos/motion/digit-pop-in.svelte";
	import Dropdown from "#lib/demos/motion/dropdown.svelte";
	import InputClear from "#lib/demos/motion/input-clear.svelte";
	import InputShake from "#lib/demos/motion/input-shake.svelte";
	import LearnMoreHover from "#lib/demos/motion/learn-more-hover.svelte";
	import LikeButton from "#lib/demos/motion/like-button.svelte";
	import Modal from "#lib/demos/motion/modal.svelte";
	import PageSideBySide from "#lib/demos/motion/page-side-by-side.svelte";
	import PlusMenuMorph from "#lib/demos/motion/plus-menu-morph.svelte";
	import Resize from "#lib/demos/motion/resize.svelte";
	import ShimmerText from "#lib/demos/motion/shimmer-text.svelte";
	import SpinningCounter from "#lib/demos/motion/spinning-counter.svelte";
	import SuccessCheck from "#lib/demos/motion/success-check.svelte";
	import TextSwap from "#lib/demos/motion/text-swap.svelte";
	import ThinkingStates from "#lib/demos/motion/thinking-states.svelte";
</script>

<div class="grid">
	<TextSwap />
	<DigitPopIn />
	<Resize />
	<Modal />
	<Dropdown />
	<PageSideBySide />
	<SuccessCheck />
	<AvatarGroupHover />
	<InputShake />
	<InputClear />
	<ShimmerText />
	<CardTilt />
	<LearnMoreHover />
	<LikeButton />
	<PlusMenuMorph />
	<SpinningCounter />
	<ThinkingStates />
</div>

<style>
	/* One demo per row. An animation is read by watching it run, and a third-width stage clips it. */
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;

		/* transitions.dev demo material mapped onto host tokens. Nothing defined
		   the names, so eleven of eighteen drew transparent until 10 Sep 2026.
		   Every value reads the app palette. */
		--td-material-bg: var(--color-card, var(--card));
		--td-material-shadow:
			0 0 0 1px color-mix(in oklab, var(--color-border, var(--border)) 80%, transparent),
			0 6px 18px -8px
				color-mix(in oklab, var(--color-foreground, var(--foreground)) 22%, transparent);
		--td-skeleton: color-mix(
			in oklab,
			var(--color-muted-foreground, var(--muted-foreground)) 22%,
			transparent
		);
		--td-stage-bg: var(--color-background, var(--background));
		--td-text: var(--color-foreground, var(--foreground));
		--td-text-subtle: var(--color-muted-foreground, var(--muted-foreground));
		--td-icon-color: var(--color-foreground, var(--foreground));
		--td-icon-color-muted: var(--color-muted-foreground, var(--muted-foreground));
		--td-copy-bg: color-mix(in oklab, var(--color-muted, var(--muted)) 80%, transparent);
		--td-copy-bg-hover: var(--color-muted, var(--muted));
	}
</style>
