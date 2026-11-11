<script lang="ts" module>
	import type { ChatMessage, ChatTheme } from "#src/ai/chat-window/types.js";

	/** Every string the window prints itself. `{name}` is the connector's name. */
	export interface ClaudeLabels {
		running: string;
		done: string;
		share: string;
		disclaimer: string;
		userSaid: string;
		assistantSaid: string;
	}

	export const CLAUDE_LABELS: ClaudeLabels = {
		running: "Using {name}",
		done: "Used {name}",
		share: "Share",
		disclaimer: "Claude can make mistakes. Please double-check responses.",
		userSaid: "You said:",
		assistantSaid: "Claude said:",
	};

	export interface ClaudeWindowProps {
		/** The conversation's name, shown in the bar and read out as the picture's label. */
		title: string;
		messages: ChatMessage[];
		/** The model picker in the composer. */
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
		labels?: Partial<ClaudeLabels>;
		class?: string;
	}
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import ChatGlyph from "#src/ai/chat-window/ChatGlyph.svelte";
	import { CLAUDE_ICONS as I } from "#src/ai/chat-window/icons.js";
	import { createReveal } from "#src/ai/chat-window/reveal.svelte.js";
	import { fillName } from "#src/ai/chat-window/types.js";

	// =========================
	// PROPS
	// =========================
	let {
		title,
		messages,
		model = "Opus 5.5",
		placeholder = "Reply to Claude…",
		theme = "auto",
		reveal = false,
		active = true,
		ondone,
		hold = 4000,
		frame = true,
		labels = {},
		class: className = "",
	}: ClaudeWindowProps = $props();

	// =========================
	// STATE
	// =========================
	const text = $derived({ ...CLAUDE_LABELS, ...labels });
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
	class="claude {className}"
	data-mode={theme}
	aria-label="Claude: {title}"
	style:--claude-stream="{player.streamMs}ms"
	{@attach player.attach}
>
	<div class="bar" aria-hidden="true">
		{#if frame}
			<span class="lights"><i></i><i></i><i></i></span>
		{/if}
		<span class="ib"><ChatGlyph src={I.sidebar} size={18} /></span>
		<span class="title">{title}<ChatGlyph src={I.chevron} size={14} /></span>
		<span class="share">{text.share}</span>
	</div>

	<ol class="thread">
		{#each messages as message, i (i)}
			{@const phase = player.phase(i)}
			<li class="turn {message.role}" data-phase={phase}>
				{#if message.role === "user"}
					<span class="vh">{text.userSaid}</span>
					<p class="bubble">{message.text}</p>
				{:else if message.role === "assistant"}
					<span class="think" aria-hidden="true"><ChatGlyph src={I.spark} size={22} /></span>
					<div class="reply">
						<span class="vh">{text.assistantSaid}</span>
						{#if message.content}
							{@render message.content()}
						{:else if message.text}
							<p>{message.text}</p>
						{/if}
					</div>
					{#if i === lastAssistant}
						<div class="foot" aria-hidden="true">
							<span class="spark"><ChatGlyph src={I.spark} size={24} /></span>
							<span class="note">{text.disclaimer}</span>
							<span class="actions">
								<span class="ab"><ChatGlyph src={I.copy} size={18} /></span>
								<span class="ab"><ChatGlyph src={I.thumb} size={18} /></span>
								<span class="ab flip"><ChatGlyph src={I.thumb} size={18} /></span>
								<span class="ab"><ChatGlyph src={I.retry} size={18} /></span>
							</span>
						</div>
					{/if}
				{:else}
					<!-- A connector call, collapsed, as claude.ai draws it inside a reply: its text shimmers while it runs. -->
					<p class="call">
						<span class="call-icon" aria-hidden="true">
							{#if message.icon}
								{@render message.icon()}
							{:else if message.iconSrc}
								<img src={message.iconSrc} alt="" width="16" height="16" />
							{:else}
								<span class="call-letter">{message.name.slice(0, 1)}</span>
							{/if}
						</span>
						<span class="call-text">
							{fillName(phase === "running" ? text.running : text.done, message.name)}
						</span>
						{#if message.label}
							<span class="call-name">{message.label}</span>
						{/if}
						<span class="call-chev" aria-hidden="true"><ChatGlyph src={I.chevron} size={14} /></span
						>
					</p>
				{/if}
			</li>
		{/each}
	</ol>

	<div class="composer" aria-hidden="true">
		<span class="prompt">{placeholder}</span>
		<div class="tools">
			<span class="cb"><ChatGlyph src={I.plus} size={18} /></span>
			<span class="cb wide"><ChatGlyph src={I.sliders} size={18} /></span>
			<span class="model">{model}<ChatGlyph src={I.chevron} size={14} /></span>
			<span class="send"><ChatGlyph src={I.send} size={18} /></span>
		</div>
	</div>
</figure>

<style>
	@layer theme, base, components, utilities;

	@layer components {
		/* claude.ai's tokens: warm paper light, warm charcoal dark, the clay accent on send and the spark. */
		.claude {
			--c-bg: light-dark(#faf9f5, #262624);
			--c-bubble: light-dark(#f0eee6, #141413);
			--c-composer: light-dark(#ffffff, #30302e);
			--c-ink: light-dark(#141413, #faf9f5);
			--c-reply: light-dark(#141413, #f0eee6);
			--c-soft: light-dark(#3d3d3a, #c2c0b6);
			--c-muted: light-dark(#73726c, #9c9a92);
			--c-line: light-dark(rgb(31 30 29 / 0.15), rgb(222 220 209 / 0.15));
			--c-rim: light-dark(rgb(0 0 0 / 0.1), rgb(255 255 255 / 0.1));
			--c-letter: light-dark(#e8e6dc, #3d3d3a);
			--c-clay: #d97757;
			--c-send: #c6613f;

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
			background: var(--c-bg);
			color: var(--c-ink);
			box-shadow:
				0 0 0 1px var(--c-rim),
				var(--elev-overlay);
			font-family:
				system-ui,
				-apple-system,
				"Segoe UI",
				Roboto,
				Helvetica,
				Arial,
				sans-serif;
			font-size: 15px;
			line-height: 1.5;
			text-align: left;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
			user-select: none;
		}

		.claude[data-mode="light"] {
			color-scheme: light;
		}

		.claude[data-mode="dark"],
		:global(.dark) .claude[data-mode="auto"],
		:global([data-theme="dark"]) .claude[data-mode="auto"] {
			color-scheme: dark;
		}

		:global([data-theme="light"]) .claude[data-mode="auto"] {
			color-scheme: light;
		}

		.claude *,
		.claude *::before,
		.claude *::after {
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

		.ib {
			display: grid;
			place-items: center;
			flex: none;
			width: 32px;
			height: 32px;
			border-radius: 8px;
			color: var(--c-muted);
		}

		/* ---------- the bar ---------- */
		.bar {
			display: flex;
			align-items: center;
			gap: 4px;
			height: 48px;
			padding: 0 12px 0 14px;
		}

		.lights {
			display: flex;
			gap: 8px;
			margin-right: 10px;
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

		.title {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			min-width: 0;
			padding: 0 6px;
			overflow: hidden;
			font-size: 14px;
			color: var(--c-soft);
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.title :global(.chat-glyph) {
			color: var(--c-muted);
		}

		.share {
			flex: none;
			margin-left: auto;
			padding: 5px 12px;
			border: 0.5px solid var(--c-line);
			border-radius: 8px;
			font-size: 13px;
			font-weight: 500;
		}

		/* ---------- the conversation ---------- */
		/* Pinned to the bottom like a chat scrolled to its end; a short window clips the top under a soft edge. */
		.thread {
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			gap: 20px;
			min-height: 0;
			margin: 0;
			padding: 14px clamp(16px, 5cqi, 40px) 14px;
			overflow: hidden;
			list-style: none;
			mask-image: linear-gradient(to bottom, transparent, #000 16px);
		}

		.turn {
			display: grid;
			min-width: 0;
		}

		/* claude.ai sets the person's turn right, in a warm grey bubble, no avatar. */
		.user {
			justify-items: end;
		}

		.bubble {
			max-width: 80%;
			margin: 0;
			padding: 10px 16px;
			border-radius: 16px;
			background: var(--c-bubble);
			font-size: 15px;
			line-height: 1.5;
			overflow-wrap: anywhere;
			white-space: pre-wrap;
		}

		.assistant > .think,
		.assistant > .reply {
			grid-area: 1 / 1;
		}

		.think {
			align-self: start;
			color: var(--c-clay);
			opacity: 0;
		}

		/* Claude answers in a serif. ui-serif is New York on Apple systems, then Georgia: the closest free faces to Anthropic's. */
		.reply {
			display: grid;
			gap: 12px;
			min-width: 0;
			font-family: ui-serif, Georgia, Cambria, "Times New Roman", serif;
			font-size: 16.5px;
			line-height: 1.6;
			color: var(--c-reply);
			overflow-wrap: anywhere;
		}

		.reply :global(:is(p, ul, ol, h3, table)) {
			margin: 0;
		}

		.reply :global(:is(ul, ol)) {
			display: grid;
			gap: 4px;
			padding-left: 1.4em;
		}

		.reply :global(:is(strong, b, h3, th)) {
			font-weight: 600;
		}

		.reply :global(table) {
			width: 100%;
			border-collapse: collapse;
			font-family:
				system-ui,
				-apple-system,
				"Segoe UI",
				sans-serif;
			font-size: 14px;
			line-height: 1.45;
			font-variant-numeric: tabular-nums;
		}

		.reply :global(:is(th, td)) {
			padding: 7px 10px 7px 0;
			border-bottom: 0.5px solid var(--c-line);
			text-align: left;
		}

		.reply :global(th) {
			color: var(--c-soft);
			font-weight: 500;
		}

		.reply :global(tr:last-child td) {
			border-bottom: 0;
		}

		.call {
			display: inline-flex;
			align-items: center;
			justify-self: start;
			gap: 8px;
			max-width: 100%;
			min-width: 0;
			margin: 0;
			padding: 7px 10px 7px 9px;
			border: 0.5px solid var(--c-line);
			border-radius: 10px;
			font-size: 14px;
			line-height: 1.4286;
			color: var(--c-soft);
		}

		.call-icon {
			display: grid;
			place-items: center;
			flex: none;
			width: 16px;
			height: 16px;
			overflow: hidden;
			border-radius: 4px;
		}

		.call-icon img {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.call-letter {
			display: grid;
			place-items: center;
			width: 100%;
			height: 100%;
			background: var(--c-letter);
			color: var(--c-ink);
			font-size: 10px;
			font-weight: 600;
		}

		.call-text {
			flex: none;
			color: var(--c-ink);
		}

		/* The label gives way first: it truncates, the connector's name never does. */
		.call-name {
			min-width: 0;
			overflow: hidden;
			color: var(--c-muted);
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.call-chev {
			flex: none;
			color: var(--c-muted);
			rotate: -90deg;
		}

		.foot {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-top: 14px;
		}

		.spark {
			flex: none;
			color: var(--c-clay);
		}

		.note {
			margin-left: auto;
			font-size: 12px;
			color: var(--c-muted);
			text-align: right;
		}

		.actions {
			display: flex;
			margin-right: -6px;
		}

		.ab {
			display: grid;
			place-items: center;
			width: 30px;
			height: 30px;
			border-radius: 6px;
			color: var(--c-muted);
		}

		.flip {
			scale: 1 -1;
		}

		/* ---------- the composer ---------- */
		.composer {
			display: grid;
			gap: 12px;
			margin: 0 clamp(10px, 3cqi, 24px) clamp(10px, 3cqi, 18px);
			padding: 14px 10px 10px 16px;
			border: 0.5px solid var(--c-line);
			border-radius: 20px;
			background: var(--c-composer);
			box-shadow: 0 4px 20px light-dark(rgb(0 0 0 / 0.035), rgb(0 0 0 / 0.18));
		}

		.prompt {
			overflow: hidden;
			color: var(--c-muted);
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.tools {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-left: -6px;
		}

		.cb {
			display: grid;
			place-items: center;
			width: 32px;
			height: 32px;
			border: 0.5px solid var(--c-line);
			border-radius: 8px;
			color: var(--c-soft);
		}

		.model {
			display: inline-flex;
			align-items: center;
			gap: 2px;
			margin-left: auto;
			padding: 0 6px;
			font-size: 14px;
			color: var(--c-soft);
			white-space: nowrap;
		}

		.model :global(.chat-glyph) {
			color: var(--c-muted);
		}

		/* An empty composer's send button sits at half strength, as claude.ai shows it. */
		.send {
			display: grid;
			place-items: center;
			width: 32px;
			height: 32px;
			border-radius: 8px;
			background: var(--c-send);
			color: #ffffff;
			opacity: 0.5;
		}

		@container (width < 460px) {
			.wide,
			.note,
			.lights {
				display: none;
			}

			.actions {
				margin-left: auto;
			}

			.bubble {
				max-width: 88%;
			}

			.reply {
				font-size: 16px;
			}
		}

		/* ---------- the reveal: only opacity, a short rise and a mask move, so nothing reflows ---------- */
		.turn > *,
		.call-text,
		.call-name {
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
			animation: claude-think calc(var(--duration-overlay) * 3) var(--ease-in-out) infinite;
		}

		.turn[data-phase="streaming"] > .reply {
			animation: claude-stream var(--claude-stream) var(--ease-linear) both;
		}

		.turn[data-phase="streaming"] > .foot {
			opacity: 0;
		}

		.reply {
			mask-image: linear-gradient(to bottom, #000 40%, transparent 60%);
			mask-size: 100% 250%;
			mask-position: 0 0;
		}

		/* The label keeps its colour; a dimmer band sweeps through it by mask. */
		.turn[data-phase="running"] .call-text {
			mask-image: linear-gradient(100deg, #000 40%, rgb(0 0 0 / 0.4) 50%, #000 60%);
			mask-size: 300% 100%;
			animation: claude-shimmer calc(var(--duration-overlay) * 3) var(--ease-linear) infinite;
		}

		@keyframes claude-think {
			50% {
				rotate: 60deg;
				scale: 0.85;
			}
		}

		@keyframes claude-stream {
			from {
				mask-position: 0 100%;
			}
			to {
				mask-position: 0 0;
			}
		}

		@keyframes claude-shimmer {
			from {
				mask-position: 100% 0;
			}
			to {
				mask-position: 0 0;
			}
		}

		@media (prefers-reduced-motion: reduce) {
			.turn > *,
			.call-text,
			.call-name,
			.turn[data-phase] > *,
			.turn[data-phase] .call-text {
				transition: none;
				animation: none;
			}
		}
	}
</style>
