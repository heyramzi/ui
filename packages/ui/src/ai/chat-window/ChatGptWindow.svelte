<script lang="ts" module>
	import type { ChatGptLabels } from "#src/ai/chat-window/labels.js";
	import type { ChatMessage, ChatTheme } from "#src/ai/chat-window/types.js";

	export interface ChatGptWindowProps {
		/** The conversation's name, read out as the picture's label. */
		title: string;
		messages: ChatMessage[];
		/** The picker in the bar. */
		model?: string;
		placeholder?: string;
		theme?: ChatTheme;
		/** Plays the messages in once the window is on screen. Off, it is a still. */
		reveal?: boolean;
		/** With `reveal`, plays each time this turns on, for a rotator. */
		active?: boolean;
		/** Called after the reveal ends and `hold` ms have passed. */
		ondone?: () => void;
		hold?: number;
		/** Draws macOS's traffic lights, as the desktop app. */
		frame?: boolean;
		labels?: Partial<ChatGptLabels>;
		class?: string;
	}
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import ChatGlyph from "#src/ai/chat-window/ChatGlyph.svelte";
	import { CHATGPT_ICONS as I } from "#src/ai/chat-window/icons.js";
	import { CHATGPT_LABELS } from "#src/ai/chat-window/labels.js";
	import { createReveal } from "#src/ai/chat-window/reveal.svelte.js";
	import { fillName } from "#src/ai/chat-window/types.js";

	// =========================
	// PROPS
	// =========================
	let {
		title,
		messages,
		model = "ChatGPT",
		placeholder = "Ask anything",
		theme = "auto",
		reveal = false,
		active = true,
		ondone,
		hold = 4000,
		frame = true,
		labels = {},
		class: className = "",
	}: ChatGptWindowProps = $props();

	// =========================
	// STATE
	// =========================
	const text = $derived({ ...CHATGPT_LABELS, ...labels });
	const lastAssistant = $derived(messages.findLastIndex((m) => m.role === "assistant"));
	const player = createReveal(() => ({
		roles: messages.map((m) => m.role),
		enabled: reveal,
		active,
		hold,
		ondone,
	}));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<figure
	class="gpt {className}"
	data-mode={theme}
	aria-label="ChatGPT: {title}"
	style:--gpt-stream="{player.streamMs}ms"
	{@attach player.attach}
>
	<div class="bar" aria-hidden="true">
		{#if frame}
			<span class="lights"><i></i><i></i><i></i></span>
		{/if}
		<span class="ib"><ChatGlyph src={I.sidebar} /></span>
		<span class="model"
			>{model}<span class="dim"><ChatGlyph src={I.chevron} size={16} /></span></span
		>
		<span class="share wide"><ChatGlyph src={I.share} />{text.share}</span>
		<span class="ib end"><ChatGlyph src={I.more} /></span>
	</div>

	<div class="scroll">
		<ol class="thread">
			{#each messages as message, i (i)}
				{@const phase = player.phase(i)}
				<li class="turn {message.role}" data-phase={phase}>
					{#if message.role === "user"}
						<span class="vh">{text.userSaid}</span>
						<p class="bubble">{message.text}</p>
					{:else if message.role === "assistant"}
						<span class="think" aria-hidden="true"></span>
						<div class="reply">
							<span class="vh">{text.assistantSaid}</span>
							{#if message.content}
								{@render message.content()}
							{:else if message.text}
								<p>{message.text}</p>
							{/if}
						</div>
						{#if i === lastAssistant}
							<div class="actions" aria-hidden="true">
								<span class="ab"><ChatGlyph src={I.copy} /></span>
								<span class="ab"><ChatGlyph src={I.thumb} /></span>
								<span class="ab flip"><ChatGlyph src={I.thumb} /></span>
								<span class="ab"><ChatGlyph src={I.share} /></span>
								<span class="ab wide"><ChatGlyph src={I.regenerate} /></span>
								<span class="ab"><ChatGlyph src={I.more} /></span>
							</div>
						{/if}
					{:else}
						<!-- An app call, as ChatGPT draws one between two parts of a reply: its label shimmers while it runs. -->
						<p class="call">
							<span class="tool-icon" aria-hidden="true">
								{#if message.icon}
									{@render message.icon()}
								{:else if message.iconSrc}
									<img src={message.iconSrc} alt="" width="20" height="20" />
								{:else}
									<span class="tool-letter">{message.name.slice(0, 1)}</span>
								{/if}
							</span>
							<span class="tool-text">
								{fillName(phase === "running" ? text.running : text.done, message.name)}
							</span>
							{#if message.label}
								<span class="tool-label">{message.label}</span>
							{/if}
							<span class="tool-chev" aria-hidden="true"
								><ChatGlyph src={I.chevron} size={16} /></span
							>
						</p>
					{/if}
				</li>
			{/each}
		</ol>
	</div>

	<div class="dock" aria-hidden="true">
		<div class="composer">
			<span class="ib round"><ChatGlyph src={I.plus} size={22} /></span>
			<span class="prompt">{placeholder}</span>
			<span class="ib round wide"><ChatGlyph src={I.mic} /></span>
			<span class="voice"><ChatGlyph src={I.voice} /></span>
		</div>
		<span class="note">{text.disclaimer}</span>
	</div>
</figure>

<style>
	@layer theme, base, components, utilities;

	@layer components {
		/* chatgpt.com's signed-in tokens, measured 11 Nov 2026. A connector needs an account, so this is the screen its users see. */
		.gpt {
			--gpt-bg: light-dark(#ffffff, #212121);
			--gpt-bar: light-dark(#ffffff, #212121);
			--gpt-bubble: light-dark(#f4f4f4, #303030);
			--gpt-ink: light-dark(#0d0d0d, #ffffff);
			--gpt-soft: light-dark(#5d5d5d, #afafaf);
			--gpt-faint: light-dark(#767676, #979797);
			--gpt-line: light-dark(rgb(13 13 13 / 0.07), rgb(255 255 255 / 0.1));
			--gpt-rim: light-dark(rgb(0 0 0 / 0.1), rgb(255 255 255 / 0.12));
			--gpt-composer: light-dark(#ffffff, #303030);
			--gpt-solid: light-dark(#000000, #ffffff);
			--gpt-on-solid: light-dark(#ffffff, #000000);
			--gpt-letter: light-dark(#e8e8e8, #424242);

			all: initial;
			box-sizing: border-box;
			display: grid;
			grid-template-rows: auto minmax(0, 1fr) auto;
			grid-template-columns: minmax(0, 1fr);
			width: 100%;
			height: 100%;
			margin: 0;
			container-type: inline-size;
			overflow: hidden;
			color-scheme: inherit;
			/* The Mac window's 12px corner, not a kit role: it is the product's own. */
			border-radius: 12px;
			background: var(--gpt-bg);
			color: var(--gpt-ink);
			box-shadow:
				0 0 0 1px var(--gpt-rim),
				var(--elev-overlay);
			font-family:
				ui-sans-serif,
				-apple-system,
				system-ui,
				"Segoe UI",
				Helvetica,
				Arial,
				sans-serif;
			font-size: 16px;
			line-height: 1.5;
			text-align: left;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
			user-select: none;
		}

		.gpt[data-mode="light"] {
			color-scheme: light;
		}

		.gpt[data-mode="dark"],
		:global(.dark) .gpt[data-mode="auto"],
		:global([data-theme="dark"]) .gpt[data-mode="auto"] {
			color-scheme: dark;
		}

		:global([data-theme="light"]) .gpt[data-mode="auto"] {
			color-scheme: light;
		}

		.gpt *,
		.gpt *::before,
		.gpt *::after {
			box-sizing: border-box;
		}

		.vh {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		/* A fake icon button: a span, so no site button style reaches it and nothing takes focus. */
		.ib {
			display: grid;
			place-items: center;
			flex: none;
			width: 36px;
			height: 36px;
			border-radius: 10px;
			color: var(--gpt-ink);
		}

		.round {
			border-radius: 50%;
		}

		/* ---------- the bar ---------- */
		.bar {
			display: flex;
			align-items: center;
			gap: 2px;
			height: 52px;
			padding: 0 8px 0 14px;
			background: var(--gpt-bar);
		}

		.lights {
			display: flex;
			gap: 8px;
			margin-right: 12px;
		}

		.lights i {
			width: 12px;
			height: 12px;
			border-radius: 50%;
			background: #ff5f57;
			box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 0.18);
		}

		.lights i:nth-child(2) {
			background: #febc2e;
		}

		.lights i:nth-child(3) {
			background: #28c840;
		}

		.model {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			min-width: 0;
			height: 36px;
			padding: 0 8px;
			font-size: 18px;
			margin-right: auto;
			line-height: 1.5556;
			white-space: nowrap;
		}

		.dim {
			color: var(--gpt-soft);
		}

		.share {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			height: 36px;
			padding: 0 12px 0 10px;
			border-radius: 999px;
			font-size: 14px;
			font-weight: 500;
		}

		/* ---------- the conversation ---------- */
		/* End-aligned: a chat sits scrolled to its newest turn, so a short window crops the top, never the composer. */
		.scroll {
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			min-height: 0;
			overflow: hidden;
		}

		.thread {
			display: grid;
			gap: 24px;
			width: 100%;
			max-width: 768px;
			margin: 0 auto;
			padding: 12px clamp(16px, 5cqi, 32px) 20px;
			list-style: none;
		}

		.turn {
			display: grid;
			min-width: 0;
		}

		.user {
			justify-items: end;
		}

		.bubble {
			max-width: 70%;
			margin: 0;
			padding: 10px 16px;
			border-radius: 22px;
			background: var(--gpt-bubble);
			overflow-wrap: anywhere;
			white-space: pre-wrap;
		}

		/* The reply and the thinking dot share one cell, so the dot never pushes the reply down. */
		.assistant > .think,
		.assistant > .reply {
			grid-area: 1 / 1;
		}

		.think {
			align-self: start;
			width: 12px;
			height: 12px;
			margin: 8px 0 0 2px;
			border-radius: 50%;
			background: var(--gpt-ink);
			opacity: 0;
		}

		.reply {
			display: grid;
			gap: 16px;
			min-width: 0;
			line-height: 1.75;
			overflow-wrap: anywhere;
		}

		/* What a site renders in the snippet takes ChatGPT's markdown look. */
		.reply :global(:is(p, ul, ol, h3, table)) {
			margin: 0;
		}

		.reply :global(:is(ul, ol)) {
			padding-left: 1.5em;
		}

		.reply :global(:is(strong, b, h3, th)) {
			font-weight: 600;
		}

		.reply :global(h3) {
			font-size: 18px;
		}

		.reply :global(table) {
			width: 100%;
			border-collapse: collapse;
			font-size: 14px;
			line-height: 1.5;
			font-variant-numeric: tabular-nums;
		}

		.reply :global(:is(th, td)) {
			padding: 8px 8px 8px 0;
			border-bottom: 1px solid var(--gpt-line);
			text-align: left;
		}

		.reply :global(tr:last-child td) {
			border-bottom: 0;
		}

		.actions {
			display: flex;
			margin: 6px 0 0 -8px;
		}

		.ab {
			display: grid;
			place-items: center;
			width: 32px;
			height: 32px;
			border-radius: 8px;
			color: var(--gpt-soft);
		}

		.flip {
			scale: 1 -1;
		}

		.call {
			display: flex;
			align-items: center;
			gap: 8px;
			min-width: 0;
			margin: 0;
			font-size: 14px;
			line-height: 1.4286;
			color: var(--gpt-soft);
		}

		.tool-icon {
			display: grid;
			place-items: center;
			flex: none;
			width: 20px;
			height: 20px;
			overflow: hidden;
			border-radius: 6px;
		}

		.tool-icon img {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.tool-letter {
			display: grid;
			place-items: center;
			width: 100%;
			height: 100%;
			background: var(--gpt-letter);
			color: var(--gpt-ink);
			font-size: 12px;
			font-weight: 600;
		}

		.tool-text {
			flex: none;
			font-weight: 500;
			color: var(--gpt-ink);
		}

		.tool-label {
			min-width: 0;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.tool-chev {
			flex: none;
			margin-left: -2px;
			rotate: -90deg;
		}

		/* ---------- the composer ---------- */
		.dock {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
			gap: 8px;
			padding: 0 clamp(12px, 4cqi, 24px) 10px;
		}

		.composer {
			display: flex;
			align-items: center;
			gap: 4px;
			width: 100%;
			max-width: 768px;
			min-height: 52px;
			padding: 6px 8px 6px 6px;
			border-radius: 28px;
			background: var(--gpt-composer);
			box-shadow:
				0 0 0 1px light-dark(rgb(0 0 0 / 0.04), transparent),
				0 2px 8px light-dark(rgb(0 0 0 / 0.04), transparent),
				0 4px 80px 8px light-dark(rgb(0 0 0 / 0.024), transparent),
				inset 0 0 1px light-dark(transparent, rgb(255 255 255 / 0.2));
			color: var(--gpt-faint);
		}

		.prompt {
			flex: 1;
			min-width: 0;
			padding-left: 4px;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.voice {
			display: grid;
			place-items: center;
			flex: none;
			width: 36px;
			height: 36px;
			border-radius: 50%;
			background: var(--gpt-solid);
			color: var(--gpt-on-solid);
		}

		.note {
			font-size: 12px;
			line-height: 1.3333;
			color: var(--gpt-soft);
			text-align: center;
		}

		/* At phone width the app drops its secondary controls and the disclaimer. */
		@container (width < 460px) {
			.wide,
			.note,
			.lights {
				display: none;
			}

			.bubble {
				max-width: 85%;
			}

			.dock {
				padding-bottom: 12px;
			}
		}

		/* ---------- the reveal: only opacity, a short rise and a mask move, so nothing reflows ---------- */
		.turn > *,
		.tool-text {
			transition:
				opacity var(--duration-fast) var(--ease-smooth-out),
				translate var(--duration-fast) var(--ease-smooth-out);
		}

		.turn[data-phase="hidden"] > *,
		.turn[data-phase="thinking"] > :not(.think) {
			opacity: 0;
			translate: 0 6px;
		}

		.turn[data-phase="thinking"] > .think {
			opacity: 1;
			translate: none;
			animation: gpt-pulse calc(var(--duration-overlay) * 2.4) var(--ease-in-out) infinite;
		}

		.turn[data-phase="streaming"] > :is(.reply, .actions) {
			animation: gpt-stream var(--gpt-stream) var(--ease-linear) both;
		}

		.turn[data-phase="streaming"] > .actions {
			opacity: 0;
		}

		.reply,
		.actions {
			mask-image: linear-gradient(to bottom, #000 40%, transparent 60%);
			mask-size: 100% 250%;
			mask-position: 0 0;
		}

		/* The label keeps its colour; a dimmer band sweeps through it by mask. */
		.turn[data-phase="running"] .tool-text {
			mask-image: linear-gradient(100deg, #000 40%, rgb(0 0 0 / 0.4) 50%, #000 60%);
			mask-size: 300% 100%;
			animation: gpt-shimmer calc(var(--duration-overlay) * 3) var(--ease-linear) infinite;
		}

		@keyframes gpt-pulse {
			50% {
				scale: 0.7;
			}
		}

		@keyframes gpt-stream {
			from {
				mask-position: 0 100%;
			}
			to {
				mask-position: 0 0;
			}
		}

		@keyframes gpt-shimmer {
			from {
				mask-position: 100% 0;
			}
			to {
				mask-position: 0 0;
			}
		}

		@media (prefers-reduced-motion: reduce) {
			.turn > *,
			.tool-text,
			.turn[data-phase] > *,
			.turn[data-phase] .tool-text {
				transition: none;
				animation: none;
			}
		}
	}
</style>
