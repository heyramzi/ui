<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import { cn } from "@heyramzi/utils";
	import { TONE_TEXT } from "@heyramzi/ui/lib/tone.js";
	import {
		budgetTone,
		dayLabel,
		formatClock,
		formatMinutes,
		localDay,
		parseMinutes,
		personColor,
	} from "#src/time/duration.js";
	import { DEFAULT_TIME_LABELS } from "#src/time/time-types.js";
	import type { TimeLabels, TimeLogInput, TimeRunning, TimeStopInfo } from "#src/time/time-types.js";
	import TimeDot from "#src/time/time-dot.svelte";
	import TimeRing from "#src/time/time-ring.svelte";
	import { Play, Stop, X } from "phosphor-svelte";

	interface Props<T> {
		/** Every entry logged on the task. Order within a day is kept. */
		entries: T[];
		getId: (entry: T) => string;
		getMinutes: (entry: T) => number;
		/** The day worked, `YYYY-MM-DD`. */
		getDay: (entry: T) => string;
		/** The name shown for the person who logged it. */
		getPerson: (entry: T) => string;
		/** Groups the split by id when two people share a name. Defaults to the name. */
		getPersonId?: (entry: T) => string;
		getNote?: (entry: T) => string | null | undefined;
		/** The timer in progress, or null. The host stores it, so it survives a reload. */
		running?: TimeRunning | null;
		/** Minutes budgeted for the task. Draws the progress ring. */
		estimate?: number;
		onStart?: () => void | Promise<void>;
		/** Called with the elapsed time. Log it, then clear `running`. */
		onStop?: (info: TimeStopInfo) => void | Promise<void>;
		/** A manual entry. Return false, or throw, to keep what was typed. */
		onLog: (input: TimeLogInput) => void | boolean | Promise<void | boolean>;
		/** Shows a delete button on rows where `canDelete` allows it. */
		onDelete?: (entry: T) => void | Promise<void>;
		canDelete?: (entry: T) => boolean;
		/** Extra text after the note, e.g. the project. */
		renderMeta?: Snippet<[T]>;
		/** BCP 47 tag for day names. Defaults to the browser's. */
		locale?: string;
		labels?: Partial<TimeLabels>;
		/** Drops the card: no border, radius, background, shadow or padding. For a host that already sits the tracker in a panel. */
		flat?: boolean;
		class?: string;
	}

	let {
		entries,
		getId,
		getMinutes,
		getDay,
		getPerson,
		getPersonId,
		getNote,
		running = null,
		estimate,
		onStart,
		onStop,
		onLog,
		onDelete,
		canDelete,
		renderMeta,
		locale,
		labels: labelOverrides,
		flat = false,
		class: className,
	}: Props<T> = $props();

	let labels = $derived({ ...DEFAULT_TIME_LABELS, ...labelOverrides });

	// ---- timer
	let now = $state(Date.now());
	let stoppedNote = $state("");
	let startedMs = $derived(running ? new Date(running.startedAt).getTime() : null);
	let elapsedMs = $derived(startedMs === null ? 0 : Math.max(0, now - startedMs));
	let clock = $derived(formatClock(elapsedMs));
	let elapsedMinutes = $derived(Math.floor(elapsedMs / 60_000));

	// The tick runs only while a timer does, and re-reads the clock so a sleeping tab catches up.
	$effect(() => {
		if (startedMs === null) return;
		now = Date.now();
		const id = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(id);
	});

	// Screen readers hear the start, then one update a minute, then the stop.
	let status = $derived(
		running
			? elapsedMinutes === 0
				? labels.started
				: labels.runningFor(formatMinutes(elapsedMinutes))
			: stoppedNote,
	);

	function sinceLabel(): string {
		if (startedMs === null) return "";
		return labels.since(
			new Date(startedMs).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }),
		);
	}

	async function toggle(): Promise<void> {
		if (!running || startedMs === null) {
			stoppedNote = "";
			await onStart?.();
			return;
		}
		const stoppedAt = new Date();
		const startedAt = new Date(startedMs);
		const minutes = Math.max(1, Math.round((stoppedAt.getTime() - startedMs) / 60_000));
		stoppedNote = labels.stopped(formatMinutes(minutes));
		await onStop?.({ minutes, startedAt, stoppedAt, day: localDay(startedAt) });
	}

	function onRootKeyDown(event: KeyboardEvent): void {
		if (event.altKey && event.code === "KeyS" && !event.repeat) {
			event.preventDefault();
			void toggle();
		}
	}

	// ---- manual entry
	let duration = $state("");
	let day = $state(localDay());
	let note = $state("");
	let saving = $state(false);
	let invalid = $state(false);
	let durationInput = $state<HTMLInputElement>();
	let parsed = $derived(parseMinutes(duration));
	let preview = $derived(parsed !== null && parsed >= 1 && parsed <= 1440 ? formatMinutes(parsed) : "");

	async function submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		invalid = parsed === null || parsed < 1 || parsed > 1440;
		if (invalid || parsed === null || saving) return;
		saving = true;
		try {
			const result = await onLog({ minutes: parsed, day, note: note.trim() || undefined });
			if (result !== false) {
				duration = "";
				note = "";
				durationInput?.focus();
			}
		} catch {
			// The host owns the error message. The fields stay as typed.
		} finally {
			saving = false;
		}
	}

	// ---- summary
	let total = $derived(entries.reduce((sum, entry) => sum + getMinutes(entry), 0));
	let liveTotal = $derived(total + elapsedMinutes);
	let tone = $derived(budgetTone(liveTotal, estimate));
	let percent = $derived(estimate ? Math.round((liveTotal / estimate) * 100) : 0);

	let groups = $derived.by(() => {
		const byDay = new Map<string, { day: string; items: T[]; minutes: number }>();
		for (const entry of entries) {
			const key = getDay(entry);
			const group = byDay.get(key) ?? { day: key, items: [], minutes: 0 };
			group.items.push(entry);
			group.minutes += getMinutes(entry);
			byDay.set(key, group);
		}
		return [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
	});

	let people = $derived.by(() => {
		const byPerson = new Map<string, { key: string; name: string; minutes: number }>();
		for (const entry of entries) {
			const key = getPersonId?.(entry) ?? getPerson(entry);
			const person = byPerson.get(key) ?? { key, name: getPerson(entry), minutes: 0 };
			person.minutes += getMinutes(entry);
			byPerson.set(key, person);
		}
		return [...byPerson.values()].sort((a, b) => b.minutes - a.minutes);
	});

	// Rows that arrive after the first paint ease in. The first paint shows them as they are.
	// svelte-ignore state_referenced_locally
	const firstIds = new Set(entries.map(getId));

	let deleting = $state<string | null>(null);

	async function remove(entry: T): Promise<void> {
		deleting = getId(entry);
		try {
			await onDelete?.(entry);
		} finally {
			deleting = null;
		}
	}

	function initial(name: string): string {
		return name.trim().charAt(0).toLocaleUpperCase() || "?";
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section
	class={cn("flex flex-col gap-5", className)}
	aria-label={labels.title}
	onkeydown={onRootKeyDown}
>
	<div class="sr-only" role="status" aria-live="polite">{status}</div>

	<!-- Timer and manual entry -->
	<div
		class={cn("time-panel", !flat && "rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm")}
		class:is-running={!!running && !flat}
	>
		<div class="flex items-center gap-4">
			<div class="min-w-0 flex-1">
				<p
					class={cn(
						"flex h-5 items-center gap-2 text-xs font-medium",
						running ? TONE_TEXT.accent : "text-muted-foreground",
					)}
				>
					<TimeDot running={!!running} />
					<span>{running ? labels.running : labels.timer}</span>
					{#if running}
						<span class="font-normal text-muted-foreground">{sinceLabel()}</span>
					{/if}
				</p>
				<p
					role="timer"
					aria-label={labels.elapsed}
					class={cn("time-readout mt-2 flex items-baseline text-[2.5rem] leading-none font-medium tracking-tight tabular-nums", running ? "text-foreground" : "text-muted-foreground/50")}
				>
					<span>{clock.hours}</span><span class="time-colon">:</span><span>{clock.minutes}</span><span class="time-colon">:</span><span>{clock.seconds}</span>
				</p>
			</div>

			<button
				type="button"
				onclick={toggle}
				aria-label={running ? labels.stop : labels.start}
				aria-keyshortcuts="Alt+S"
				title="{running ? labels.stop : labels.start} (Alt+S)"
				class={cn(
					"time-toggle relative grid size-12 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
					running ? "bg-foreground text-background" : "bg-primary text-primary-foreground",
				)}
				class:is-running={!!running}
			>
				{#if running}
					<Stop weight="fill" class="size-4.5" aria-hidden="true" />
				{:else}
					<span class="size-5 translate-x-px [&>svg]:size-full" aria-hidden="true"><Play weight="fill" /></span>
				{/if}
			</button>
		</div>

		<form
			onsubmit={submit}
			class="mt-4 grid grid-cols-2 items-center gap-2 border-t border-border/60 pt-4 sm:grid-cols-[7rem_8.75rem_minmax(0,1fr)_auto]"
		>
			<div class="relative">
				<input
					bind:this={durationInput}
					bind:value={duration}
					oninput={() => (invalid = false)}
					placeholder={labels.durationPlaceholder}
					aria-label={labels.duration}
					aria-invalid={invalid}
					aria-describedby={invalid ? "time-invalid" : undefined}
					autocomplete="off"
					inputmode="text"
					class={cn("time-field w-full tabular-nums", preview && "pr-12")}
				/>
				{#if preview && preview !== duration.trim()}
					<span class="time-preview pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground tabular-nums" aria-hidden="true">
						{preview}
					</span>
				{/if}
			</div>
			<input
				type="date"
				bind:value={day}
				aria-label={labels.date}
				class="time-field w-full tabular-nums"
			/>
			<input
				bind:value={note}
				placeholder={labels.notePlaceholder}
				aria-label={labels.note}
				autocomplete="off"
				class="time-field col-span-2 w-full sm:col-span-1"
			/>
			<button
				type="submit"
				disabled={saving || !duration.trim()}
				class="col-span-2 inline-flex h-9 items-center justify-center rounded-md sm:col-span-1 border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
			>
				{saving ? labels.saving : labels.log}
			</button>
		</form>
		{#if invalid}
			<p id="time-invalid" class="mt-2 text-xs text-destructive" role="alert">{labels.invalid}</p>
		{/if}
	</div>

	<!-- Total, budget, split -->
	{#if entries.length > 0 || estimate}
		<div class="flex flex-col gap-4 px-1">
			<div class="flex items-center gap-4">
				{#if estimate}
					<TimeRing value={liveTotal} max={estimate} size={60} stroke={4}>
						<span class={cn("text-xs font-semibold tabular-nums", tone === "neutral" ? "text-foreground" : TONE_TEXT[tone])}>{percent}%</span>
					</TimeRing>
				{/if}
				<div class="min-w-0">
					<p class="text-xs font-medium text-muted-foreground">{labels.logged}</p>
					{#key total}
						<p class="time-pop mt-0.5 text-2xl leading-tight font-semibold tracking-tight tabular-nums">
							{formatMinutes(total)}
						</p>
					{/key}
					{#if estimate}
						<p class={cn("mt-0.5 text-xs tabular-nums", tone === "neutral" ? "text-muted-foreground" : TONE_TEXT[tone])}>
							{liveTotal > estimate
								? labels.over(formatMinutes(liveTotal - estimate), formatMinutes(estimate))
								: labels.remaining(formatMinutes(estimate - liveTotal), formatMinutes(estimate))}
						</p>
					{/if}
				</div>
			</div>

			{#if people.length > 1}
				<div>
					<div class="flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
						{#each people as person (person.key)}
							<span
								class="time-segment min-w-1 rounded-full"
								style:flex-grow={person.minutes}
								style:background={personColor(person.key)}
							></span>
						{/each}
					</div>
					<ul class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
						{#each people as person (person.key)}
							<li class="flex items-center gap-1.5 text-xs">
								<span class="size-2 rounded-full" style:background={personColor(person.key)} aria-hidden="true"></span>
								<span class="text-muted-foreground">{person.name}</span>
								<span class="font-medium tabular-nums">{formatMinutes(person.minutes)}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Entries by day -->
	{#if groups.length > 0}
		<div class="flex flex-col gap-4">
			{#each groups as group (group.day)}
				<div>
					<div class="flex items-baseline justify-between border-b border-border/60 px-2 pb-1.5">
						<h3 class="text-xs font-medium text-muted-foreground">{dayLabel(group.day, locale)}</h3>
						<span class="text-xs font-medium text-muted-foreground tabular-nums">{formatMinutes(group.minutes)}</span>
					</div>
					<ul class="mt-1">
						{#each group.items as entry (getId(entry))}
							{@const name = getPerson(entry)}
							{@const text = getNote?.(entry)}
							<li
								class="time-row group flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/50 focus-within:bg-muted/50"
								class:is-new={!firstIds.has(getId(entry))}
								class:opacity-50={deleting === getId(entry)}
							>
								<span
									class="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
									style:background={personColor(getPersonId?.(entry) ?? name)}
									title={name}
									aria-hidden="true"
								>
									{initial(name)}
								</span>
								<span class="min-w-0 flex-1 truncate">
									<span class="sr-only">{name},</span>
									{#if text}{text}{:else}<span class="text-muted-foreground">{name}</span>{/if}
									{#if renderMeta}<span class="ms-2 text-xs text-muted-foreground">{@render renderMeta(entry)}</span>{/if}
								</span>
								<span class="shrink-0 font-medium tabular-nums">{formatMinutes(getMinutes(entry))}</span>
								{#if onDelete && (canDelete?.(entry) ?? true)}
									<button
										type="button"
										onclick={() => remove(entry)}
										disabled={deleting === getId(entry)}
										aria-label={labels.deleteEntry(formatMinutes(getMinutes(entry)))}
										class="time-delete -my-1 -me-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/50"
									>
										<span class="size-3.5 [&>svg]:size-full" aria-hidden="true"><X weight="bold" /></span>
									</button>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{:else}
		<p class="px-1 py-6 text-center text-sm text-muted-foreground">{labels.empty}</p>
	{/if}
</section>

<style>
	.time-panel {
		transition:
			border-color var(--duration-medium, 350ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			background-color var(--duration-medium, 350ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
	}

	.time-panel.is-running {
		border-color: color-mix(in oklab, var(--tone-accent, var(--color-primary)) 32%, var(--color-border));
		background-color: color-mix(in oklab, var(--tone-accent, var(--color-primary)) 4%, var(--color-card));
	}

	.time-readout {
		transition: color var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
		font-feature-settings: "tnum" 1;
	}

	.time-colon {
		margin-inline: 0.04em;
		opacity: 0.45;
	}

	.time-toggle {
		transition:
			transform var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			background-color var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			color var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
	}

	.time-toggle:active {
		transform: scale(0.94);
	}

	.time-toggle.is-running::after {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: inherit;
		border: 1.5px solid var(--tone-accent, var(--color-primary));
		animation: time-halo var(--time-pulse-duration, 2000ms) var(--ease-out, ease-out) infinite;
	}

	.time-field {
		height: 2.25rem;
		border-radius: var(--radius-md, 0.5rem);
		border: 1px solid var(--color-input, var(--color-border));
		background: var(--color-background);
		padding-inline: 0.625rem;
		font-size: 0.875rem;
		color: var(--color-foreground);
		outline: none;
		transition:
			border-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out),
			box-shadow var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	.time-field::placeholder {
		color: var(--color-muted-foreground);
		opacity: 0.7;
	}

	.time-field:focus-visible {
		border-color: var(--color-ring);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 40%, transparent);
	}

	.time-field[aria-invalid="true"] {
		border-color: var(--color-destructive);
	}

	.time-segment {
		transition: flex-grow var(--duration-slow, 400ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
	}

	.time-delete {
		opacity: 0;
	}

	.time-row:focus-within .time-delete {
		opacity: 1;
	}

	@media (hover: hover) and (pointer: fine) {
		.time-row:hover .time-delete {
			opacity: 1;
		}
	}

	@media (hover: none) {
		.time-delete {
			opacity: 1;
		}
	}

	.time-pop,
	.time-preview {
		animation: time-pop var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out) backwards;
	}

	.time-row.is-new {
		animation: time-row-in var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)) backwards;
	}

	@keyframes time-halo {
		from {
			transform: scale(1);
			opacity: 0.55;
		}
		to {
			transform: scale(1.5);
			opacity: 0;
		}
	}

	@keyframes time-pop {
		from {
			opacity: 0;
			transform: translateY(4px);
			filter: blur(var(--blur-small, 2px));
		}
	}

	@keyframes time-row-in {
		from {
			opacity: 0;
			transform: translateY(var(--distance-base, 8px));
			filter: blur(var(--blur-small, 2px));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.time-panel,
		.time-readout,
		.time-toggle,
		.time-field,
		.time-segment {
			transition: none;
		}

		.time-toggle.is-running::after {
			animation: none;
			transform: scale(1.18);
			opacity: 0.4;
		}

		.time-pop,
		.time-preview,
		.time-row.is-new {
			animation: none;
		}
	}
</style>
