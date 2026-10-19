<script lang="ts">
	import { onDestroy } from "svelte";
	import Icon from "#src/components/icons/Icon.svelte";

	/** The round copy-for-AI button on a card. The studio's shelf and Motion cards draw the same one from `.spark` in shelf.html: same size, same states, same placement. */
	let { label, text }: { label: string; text: string } = $props();

	let phase = $state<"idle" | "copied" | "failed">("idle");
	let resetAt: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		let ok = true;
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// A page without clipboard permission falls back to a hidden textarea, as the shelf does.
			const box = Object.assign(document.createElement("textarea"), { value: text });
			document.body.append(box);
			box.select();
			ok = document.execCommand("copy");
			box.remove();
		}
		phase = ok ? "copied" : "failed";
		clearTimeout(resetAt);
		resetAt = setTimeout(() => (phase = "idle"), 1800);
	}
	onDestroy(() => clearTimeout(resetAt));
</script>

<button
	type="button"
	class="spark"
	class:done={phase === "copied"}
	data-state={phase === "idle" ? undefined : phase}
	title={phase === "copied" ? "Copied" : phase === "failed" ? "Couldn't copy. Allow clipboard access and try again." : "Copy for your agent"}
	aria-label={label}
	onclick={copy}
>
	<span class="glyphs">
		<Icon name={phase === "copied" ? "check" : "spark"} />
	</span>
	<span class="sr" aria-live="polite">{phase === "copied" ? "Copied" : phase === "failed" ? "Couldn't copy" : ""}</span>
</button>

<style>
	/* The card that holds it carries `has-spark` and is `position: relative`. Hidden until the card is hovered or focused, and always there on a coarse pointer. */
	.spark {
		position: absolute;
		inset: 10px 10px auto auto;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--ground);
		color: var(--dim);
		cursor: pointer;
		opacity: 0;
		transform: translateY(-3px) scale(0.94);
		transition:
			opacity var(--duration-quick) var(--ease-smooth-out),
			transform var(--duration-fast) var(--ease-smooth-out),
			color var(--duration-quick) var(--ease-smooth-out),
			border-color var(--duration-quick) var(--ease-smooth-out);
	}
	.glyphs :global(.ic) {
		width: 15px;
		height: 15px;
	}
	:global(.has-spark:focus-within) .spark,
	.spark[data-state] {
		opacity: 1;
		transform: none;
	}
	@media (hover: hover) and (pointer: fine) {
		:global(.has-spark:hover) .spark {
			opacity: 1;
			transform: none;
		}
		.spark:hover {
			color: var(--text);
			border-color: var(--accent);
			background: var(--raised);
		}
	}
	.spark[data-state="copied"] {
		color: var(--ok);
		border-color: var(--ok);
	}
	.spark[data-state="failed"] {
		color: var(--bad);
		border-color: var(--bad);
	}
	.spark:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	@media (any-pointer: coarse) {
		.spark {
			opacity: 1;
			transform: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spark {
			transition: none;
		}
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
</style>
