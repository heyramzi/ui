<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/animations/digit-pop-in.css";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// PROPS
	// =========================
	interface Props {
		/** The formatted value. Characters that change between renders pop in; the rest stay still. */
		value: string;
		class?: string;
	}
	let { value, class: className }: Props = $props();

	// =========================
	// STATE
	// =========================
	let group = $state<HTMLElement | null>(null);
	// Plain, not $state: it only remembers the last value painted, so writing it never re-renders.
	let previous: string | null = null;

	// =========================
	// DERIVED
	// =========================
	// Only the characters that differ from the last value animate, so 1,204 to 1,205 moves one
	// digit, not four. The stagger caps at 2 steps to keep the whole pop under the 300ms ceiling
	// plus two stagger beats.
	let chars = $derived.by(() => {
		const before = previous;
		let changed = 0;
		return [...value].map((char, index) => {
			const moved = before !== null && before[index] !== char;
			return { char, moved, stagger: moved ? Math.min(changed++, 2) : 0 };
		});
	});

	// =========================
	// EFFECTS
	// =========================
	// transitions-dev number pop-in: drop the class, force a reflow, add it back, or a second
	// change never replays. The first paint doesn't animate: nothing changed yet.
	$effect(() => {
		const next = value;
		if (!group) return;
		if (previous !== null && previous !== next) {
			group.classList.remove("is-animating");
			void group.offsetWidth;
			group.classList.add("is-animating");
		}
		previous = next;
	});
</script>

<span bind:this={group} class={cn("t-digit-group whitespace-pre tabular-nums", className)}>
	<span class="sr-only">{value}</span>
	<span aria-hidden="true" class="contents">
		{#each chars as part, index (`${index}:${part.char}`)}
			{#if part.moved}
				<span class="t-digit" data-stagger={part.stagger}>{part.char}</span>
			{:else}
				<span>{part.char}</span>
			{/if}
		{/each}
	</span>
</span>
