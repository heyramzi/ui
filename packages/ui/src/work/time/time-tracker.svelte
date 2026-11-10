<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";
	import { initial } from "#src/lib/initials.js";
	import { TONE_COLOR, TONE_TEXT } from "#src/lib/tone.js";
	import * as Popover from "#src/shadcn/popover/index.js";
	import { Button, buttonVariants } from "#src/shadcn/button/index.js";
	import { Input } from "#src/shadcn/input/index.js";
	import * as Avatar from "#src/shadcn/avatar/index.js";
	import { ganttLooks, workLooks } from "#src/components/work-parts/looks.js";
	import {
		budgetTone,
		dayLabel,
		formatClock,
		formatMinutes,
		localDay,
		parseMinutes,
		personColor,
	} from "#src/work/time/duration.js";
	import { DEFAULT_TIME_LABELS } from "#src/work/time/time-types.js";
	import type {
		TimeLabels,
		TimeLogInput,
		TimeRunning,
		TimeStopInfo,
	} from "#src/work/time/time-types.js";
	import TimeDot from "#src/work/time/time-dot.svelte";
	import { CaretDown, Play, Stop, X } from "phosphor-svelte";

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
		/** Kept so existing callers compile. The tracker is always the compact chip now, so it does nothing. */
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
		class: className,
	}: Props<T> = $props();

	let labels = $derived({ ...DEFAULT_TIME_LABELS, ...labelOverrides });

	// ---- timer
	let now = $state(Date.now());
	let open = $state(false);
	let stoppedNote = $state("");
	let startedMs = $derived(running ? new Date(running.startedAt).getTime() : null);
	let elapsedMs = $derived(startedMs === null ? 0 : Math.max(0, now - startedMs));
	let clock = $derived(formatClock(elapsedMs));
	let elapsedMinutes = $derived(Math.floor(elapsedMs / 60_000));
	// What the trigger shows, so its name holds it (WCAG 2.5.3, label in name).
	let shown = $derived(
		running
			? `${clock.hours}:${clock.minutes}:${clock.seconds}`
			: total > 0
				? `${formatMinutes(total)}${estimate ? ` / ${formatMinutes(estimate)}` : ""}`
				: labels.timer,
	);

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
	let preview = $derived(
		parsed !== null && parsed >= 1 && parsed <= 1440 ? formatMinutes(parsed) : "",
	);

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
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section class={cn("inline-flex", className)} aria-label={labels.title} onkeydown={onRootKeyDown}>
	<div class="sr-only" role="status" aria-live="polite">{status}</div>

	<Popover.Root bind:open>
		<div
			class={cn(
				"time-chip inline-flex items-stretch text-(length:--text-control) text-foreground",
				workLooks.row,
			)}
			class:is-running={!!running}
		>
			<Button
				variant="ghost"
				size="sm"
				icon
				onclick={toggle}
				aria-label={running ? labels.stop : labels.start}
				aria-keyshortcuts="Alt+S"
				title="{running ? labels.stop : labels.start} (Alt+S)"
			>
				{#if running}
					<Stop weight="fill" class="size-3.5" aria-hidden="true" />
				{:else}
					<Play weight="fill" class="size-3.5" aria-hidden="true" />
				{/if}
			</Button>
			<Popover.Trigger
				class={cn(
					buttonVariants({ variant: "ghost", size: "sm" }),
					"time-open gap-1.5 ps-1 pe-2 text-(length:--text-control) tabular-nums data-[state=open]:bg-muted",
				)}
				aria-label="{labels.title}: {shown}"
			>
				{#if running}
					<TimeDot running size={6} />
					<span role="timer" aria-label={labels.elapsed}
						>{clock.hours}:{clock.minutes}:{clock.seconds}</span
					>
				{:else if total > 0}
					<span
						>{formatMinutes(total)}{#if estimate}<span
								class="ms-1 font-normal text-muted-foreground">/ {formatMinutes(estimate)}</span
							>{/if}</span
					>
				{:else}
					<span class="text-muted-foreground">{labels.timer}</span>
				{/if}
				<CaretDown class="size-3 text-muted-foreground" aria-hidden="true" />
			</Popover.Trigger>
		</div>

		<Popover.Content
			align="start"
			class="flex w-80 flex-col gap-3 p-3 text-(length:--text-control)"
		>
			<form onsubmit={submit} class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2">
				<div class="relative">
					<Input
						bind:ref={durationInput}
						bind:value={duration}
						oninput={() => (invalid = false)}
						placeholder={labels.durationPlaceholder}
						aria-label={labels.duration}
						aria-invalid={invalid}
						aria-describedby={invalid ? "time-invalid" : undefined}
						autocomplete="off"
						inputmode="text"
						class={cn(
							"h-7 text-(length:--text-control) tabular-nums md:text-(length:--text-control)",
							preview && "pr-12",
						)}
					/>
					{#if preview && preview !== duration.trim()}
						<span
							class="time-preview pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground tabular-nums"
							aria-hidden="true"
						>
							{preview}
						</span>
					{/if}
				</div>
				<Input
					type="date"
					bind:value={day}
					aria-label={labels.date}
					class="h-7 text-(length:--text-control) tabular-nums md:text-(length:--text-control)"
				/>
				<Input
					bind:value={note}
					placeholder={labels.notePlaceholder}
					aria-label={labels.note}
					autocomplete="off"
					class="h-7 text-(length:--text-control) md:text-(length:--text-control)"
				/>
				<Button type="submit" variant="outline" size="sm" disabled={saving || !duration.trim()}>
					{saving ? labels.saving : labels.log}
				</Button>
			</form>
			{#if invalid}
				<p id="time-invalid" class="text-xs text-destructive-ink" role="alert">{labels.invalid}</p>
			{/if}

			{#if entries.length > 0 || estimate}
				<div class="flex flex-col gap-2 border-t border-border/60 pt-3">
					<div class="flex items-baseline justify-between gap-2">
						<span class="text-xs font-medium text-muted-foreground">{labels.logged}</span>
						{#key total}
							<span class="time-pop font-medium tabular-nums">{formatMinutes(total)}</span>
						{/key}
					</div>
					{#if estimate}
						<div class="flex flex-col gap-1">
							<div class={cn("h-1 overflow-hidden bg-muted", ganttLooks.track)} aria-hidden="true">
								<div
									class={cn("time-segment h-full", ganttLooks.track)}
									style:background={tone === "neutral"
										? "var(--color-foreground)"
										: TONE_COLOR[tone]}
									style:width="{Math.min(100, percent)}%"
								></div>
							</div>
							<p
								class={cn(
									"text-xs tabular-nums",
									tone === "neutral" ? "text-muted-foreground" : TONE_TEXT[tone],
								)}
							>
								{liveTotal > estimate
									? labels.over(formatMinutes(liveTotal - estimate), formatMinutes(estimate))
									: labels.remaining(formatMinutes(estimate - liveTotal), formatMinutes(estimate))}
							</p>
						</div>
					{/if}
					{#if people.length > 1}
						<ul class="flex flex-wrap gap-x-3 gap-y-1">
							{#each people as person (person.key)}
								<li class="flex items-center gap-1.5 text-xs">
									<span
										class={cn("size-2", ganttLooks.day)}
										style:background={personColor(person.key)}
										aria-hidden="true"
									></span>
									<span class="text-muted-foreground">{person.name}</span>
									<span class="font-medium tabular-nums">{formatMinutes(person.minutes)}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}

			{#if groups.length > 0}
				<div class="-mx-1 flex max-h-56 flex-col gap-2 overflow-y-auto px-1">
					{#each groups as group (group.day)}
						<div>
							<div class="flex items-baseline justify-between border-b border-border/60 pb-1">
								<h3 class="text-xs font-medium text-muted-foreground">
									{dayLabel(group.day, locale)}
								</h3>
								<span class="text-xs font-medium text-muted-foreground tabular-nums"
									>{formatMinutes(group.minutes)}</span
								>
							</div>
							<ul>
								{#each group.items as entry (getId(entry))}
									{@const name = getPerson(entry)}
									{@const text = getNote?.(entry)}
									<li
										class={cn(
											"time-row group flex h-7 items-center gap-2 px-1 transition-colors duration-quick ease-smooth-out hover:bg-muted/50 focus-within:bg-muted/50",
											workLooks.row,
										)}
										class:is-new={!firstIds.has(getId(entry))}
										class:opacity-50={deleting === getId(entry)}
									>
										<Avatar.Root class="size-5" title={name} aria-hidden="true">
											<Avatar.Fallback
												class="text-xs font-semibold text-white"
												style="background: {personColor(getPersonId?.(entry) ?? name)}"
												>{initial(name)}</Avatar.Fallback
											>
										</Avatar.Root>
										<span class="min-w-0 flex-1 truncate">
											<span class="sr-only">{name},</span>
											{#if text}{text}{:else}<span class="text-muted-foreground">{name}</span>{/if}
											{#if renderMeta}<span class="ms-1.5 text-xs text-muted-foreground"
													>{@render renderMeta(entry)}</span
												>{/if}
										</span>
										<span class="shrink-0 font-medium tabular-nums"
											>{formatMinutes(getMinutes(entry))}</span
										>
										{#if onDelete && (canDelete?.(entry) ?? true)}
											<Button
												variant="ghost"
												size="sm"
												icon
												onclick={() => remove(entry)}
												disabled={deleting === getId(entry)}
												aria-label={labels.deleteEntry(formatMinutes(getMinutes(entry)))}
												class="time-delete size-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
											>
												<X weight="bold" class="size-3" aria-hidden="true" />
											</Button>
										{/if}
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			{:else}
				<p class="py-2 text-center text-xs text-muted-foreground">{labels.empty}</p>
			{/if}
		</Popover.Content>
	</Popover.Root>
</section>

<style>
	@layer theme, base, components, utilities;

	/* Unlayered: the ghost button's hover and open text-foreground would otherwise drop the running accent. */
	.time-chip.is-running :global(.time-open) {
		color: var(--tone-accent, var(--color-primary));
	}

	@layer components {
		/* A running timer tints the whole split button in the accent. */
		.time-chip {
			transition: background-color var(--duration-fast) var(--ease-smooth-out);
		}

		.time-chip.is-running {
			background: color-mix(in oklab, var(--tone-accent, var(--color-primary)) 10%, transparent);
		}

		.time-segment {
			transition: width var(--duration-slow) var(--ease-smooth-out);
		}

		.time-row :global(.time-delete) {
			opacity: 0;
		}

		.time-row:focus-within :global(.time-delete) {
			opacity: 1;
		}

		@media (hover: hover) and (pointer: fine) {
			.time-row:hover :global(.time-delete) {
				opacity: 1;
			}
		}

		@media (hover: none) {
			.time-row :global(.time-delete) {
				opacity: 1;
			}
		}

		.time-pop,
		.time-preview {
			animation: time-pop var(--duration-quick) var(--ease-smooth-out) backwards;
		}

		.time-row.is-new {
			animation: time-row-in var(--duration-fast) var(--ease-smooth-out) backwards;
		}

		@media (prefers-reduced-motion: reduce) {
			.time-chip,
			.time-segment {
				transition: none;
			}

			.time-pop,
			.time-preview,
			.time-row.is-new {
				animation: none;
			}
		}
	}

	@keyframes time-pop {
		from {
			opacity: 0;
			transform: translateY(var(--distance-micro));
			filter: blur(var(--blur-small));
		}
	}

	@keyframes time-row-in {
		from {
			opacity: 0;
			transform: translateY(var(--distance-base));
			filter: blur(var(--blur-small));
		}
	}
</style>
