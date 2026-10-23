<script lang="ts">
	import { isOpenBeat } from "#src/core/beats.js";
	import type { Session, Tone } from "#src/core/types.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import { useApp } from "#src/hooks/app.svelte.js";
	import { askForScript } from "#src/ui/handoff.js";
	import Swap from "#src/ui/Swap.svelte";

	const app = useApp();
	const id = $props.id();
	const session = $derived(app.review.session);
	const connect = $derived(session === "offline" ? undefined : app.review.model?.connect);
	const left = $derived((app.review.model?.beats ?? []).filter(isOpenBeat).length);

	const COPY: Record<Session, { text: string; tone: Tone; tip: string }> = {
		offline: {
			text: "Editor OS is offline",
			tone: "neutral",
			tip: "Your changes wait here and send when it's back.",
		},
		idle: {
			text: "Connect your agent",
			tone: "warn",
			tip: "Copy the prompt and paste it into your agent. Your notes then go straight to it.",
		},
		listening: {
			text: "Agent listening",
			tone: "ok",
			tip: "Your notes go straight to your agent. Paste the prompt into another agent to switch.",
		},
	};
	const copy = $derived(COPY[session]);

	let sent = $state(false);
	function send() {
		sent = true;
		askForScript(app);
		setTimeout(() => (sent = false), 4000);
	}

	let said = $state<string | undefined>();
	let timer: ReturnType<typeof setTimeout> | undefined;
	async function copyPrompt() {
		if (!connect) return;
		clearTimeout(timer);
		try {
			await navigator.clipboard.writeText(connect);
			said = "Copied";
		} catch {
			said = "Couldn't copy";
		}
		timer = setTimeout(() => (said = undefined), 2000);
	}

	let trigger = $state<HTMLElement>();
	let pop = $state<HTMLElement>();
	let openPop = $state(false);
	let side = $state<"above" | "below">("above");

	// WHY: a popover sits in the top layer, so it's placed by hand: above the dock, or below on a phone where the dock is at the top.
	function place() {
		if (!trigger || !pop) return;
		const GAP = 8;
		const box = trigger.getBoundingClientRect();
		const above = box.top > innerHeight / 2;
		pop.style.left = `${Math.max(GAP, Math.min(box.left, innerWidth - pop.offsetWidth - GAP))}px`;
		pop.style.top = above ? "" : `${box.bottom + GAP}px`;
		pop.style.bottom = above ? `${innerHeight - box.top + GAP}px` : "";
		side = above ? "above" : "below";
	}
</script>

<div class="dock">
	<button
		class="btn send solid"
		class:primary={left === 0}
		disabled={sent || session === "offline"}
		data-tip={left > 0
			? `${left} ${left === 1 ? "change" : "changes"} still to decide`
			: "Ask your agent to update the video to match"}
		onclick={send}
	>
		<Icon name="send" small />
		<span class="words">{sent ? "Sent" : "Send to agent"}</span>
	</button>
	<button
		class="status tone-{copy.tone}"
		data-session={session}
		aria-label="{copy.text}: show the prompt"
		aria-expanded={openPop}
		popovertarget="{id}-agent"
		bind:this={trigger}
	>
		<span class="dot" class:live={session === "listening"}></span>
		<span class="words"><Swap value={copy.text} /></span>
		<Icon name="chevron" small />
	</button>
	<div
		id="{id}-agent"
		class="pop"
		popover="auto"
		data-side={side}
		role="dialog"
		aria-label="Connect your agent"
		bind:this={pop}
		onbeforetoggle={(e) => {
			if (e.newState === "open") requestAnimationFrame(place);
		}}
		ontoggle={(e) => (openPop = e.newState === "open")}
	>
		<p class="tip">{copy.tip}</p>
		{#if connect}
			<button class="btn primary copy" onclick={copyPrompt}
				><Swap value={said ?? "Copy prompt"} /></button
			>
		{/if}
	</div>
</div>

<style>
	.dock {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px 8px;
		border-top: 1px solid var(--line-soft);
		background: var(--surface);
	}
	.send {
		width: 100%;
	}
	/* WHY: the shared disabled style drops a quiet button to 45% and it vanishes. Keep the frame and the words readable, and say it's off with the cursor. */
	.dock .send:disabled {
		opacity: 1;
		color: var(--faint);
		border-color: var(--line);
		background: var(--raised);
		cursor: not-allowed;
	}
	/* The icon strip has no room for words: the send button is its icon, the status is its dot. */
	:global(.shell.compact) .status .words,
	:global(.shell.compact) .status :global(.ic) {
		display: none;
	}
	/* WHY: the send button's words are its only name, so the strip hides them visually and keeps them for screen readers. */
	:global(.shell.compact) .send .words {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	:global(.shell.compact) .status {
		justify-content: center;
		padding: 0;
	}
	.status {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-height: var(--control);
		padding: 0 10px;
		border-radius: var(--radius-sm);
		color: var(--dim);
		font-size: var(--fs-xs);
		font-weight: 500;
		transition: background-color var(--duration-quick) var(--ease-smooth-out);
	}
	.status[aria-expanded="true"] {
		background: var(--hover);
		color: var(--text);
	}
	@media (hover: hover) and (pointer: fine) {
		.status:hover {
			background: var(--hover);
			color: var(--text);
		}
	}
	.status:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.status .words {
		flex: 1;
		text-align: left;
	}
	.status :global(.ic) {
		rotate: -90deg;
		color: var(--faint);
	}
	.dot {
		position: relative;
		flex: none;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--tone);
	}
	.dot.live::after {
		content: "";
		position: absolute;
		inset: -3px;
		border-radius: 50%;
		border: 1.5px solid var(--tone);
		animation: ring var(--pulse-dur) var(--ease-out) infinite;
	}
	@keyframes ring {
		from {
			opacity: 0.7;
			scale: 0.6;
		}
		to {
			opacity: 0;
			scale: 1.5;
		}
	}
	.pop {
		position: fixed;
		inset: auto;
		width: min(360px, calc(100vw - 16px));
		margin: 0;
		padding: 14px;
		border: 0;
		border-radius: var(--radius-lg);
		background: var(--raised);
		color: var(--text);
		box-shadow: var(--shadow-pop);
		opacity: 0;
		scale: var(--dropdown-pre-scale);
		transform-origin: bottom left;
		transition:
			opacity var(--dropdown-close-dur) var(--ease-smooth-out),
			scale var(--dropdown-close-dur) var(--ease-smooth-out),
			display var(--dropdown-close-dur) allow-discrete,
			overlay var(--dropdown-close-dur) allow-discrete;
	}
	.pop[data-side="below"] {
		transform-origin: top left;
	}
	.pop:popover-open {
		opacity: 1;
		scale: 1;
		transition-duration: var(--dropdown-open-dur);
	}
	@starting-style {
		.pop:popover-open {
			opacity: 0;
			scale: var(--dropdown-pre-scale);
		}
	}
	.tip {
		color: var(--dim);
		font-size: var(--fs-xs);
		line-height: 1.45;
	}
	.copy {
		width: 100%;
		margin-top: 10px;
	}
	@media (prefers-reduced-motion: reduce) {
		.pop,
		.pop:popover-open {
			transition: none;
		}
	}
</style>
