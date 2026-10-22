<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import {
		ArrowCounterClockwise,
		ArrowDown,
		ArrowUp,
		Check,
		DotsThreeVertical,
		Eye,
		EyeSlash,
		PencilSimple,
	} from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { Input } from "#src/shadcn/input/index.js";
	import { Skeleton } from "#src/shadcn/skeleton/index.js";
	import * as Popover from "#src/shadcn/popover/index.js";
	import * as ContextMenu from "#src/shadcn/context-menu/index.js";
	import { todayIso } from "#src/tasks/dates.js";
	import { formatRange } from "#src/record/format.js";
	import {
		groupSteps,
		nudgeStep,
		reorderIds,
		stepMarkers,
		stepProgress,
		visibleSteps,
	} from "#src/record/logic.js";
	import {
		resolveLabels,
		type RecordLabels,
		type StepDef,
		type StepGroupDef,
		type StepMarker,
	} from "#src/record/types.js";

	// =========================
	// PROPS
	// =========================
	interface Props {
		steps: StepDef[];
		/** Group headers in the order to draw them, such as Sales then Delivery. */
		groups?: StepGroupDef[];
		activeId?: string | null;
		onSelect?: (id: string) => void;
		/** Show or hide a step. Without it the visibility menu isn't drawn. */
		onToggle?: (id: string, visible: boolean) => void;
		/** The whole new id order, after a drag or a keyboard move. */
		onReorder?: (ids: string[]) => void;
		/** An empty label resets the name. */
		onRename?: (id: string, label: string) => void;
		loading?: boolean;
		labels?: Partial<RecordLabels>;
		locale?: string;
		/** ISO date. Decides "late". Defaults to the viewer's today. */
		today?: string;
		class?: string;
	}
	let {
		steps,
		groups = [],
		activeId = null,
		onSelect,
		onToggle,
		onReorder,
		onRename,
		loading = false,
		labels,
		locale,
		today = todayIso(),
		class: className,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let menuOpen = $state(false);
	// The order shown while the host round-trips. Cleared when the steps catch up,
	// or after five seconds so a failed save can't pin a wrong order.
	let pendingOrder = $state<string[] | null>(null);
	let pendingTimer: ReturnType<typeof setTimeout> | null = null;
	let draggedId = $state<string | null>(null);
	let draggedGroup = $state<string | undefined>(undefined);
	let overId = $state<string | null>(null);
	let insertBefore = $state(true);
	let renamingId = $state<string | null>(null);
	let renameValue = $state("");
	let renameInput = $state<HTMLInputElement | null>(null);
	// WHY: the context menu closing hands focus back and blurs a fresh input, which
	// would commit a rename nobody typed. Blur counts only once the input has had a frame.
	let renameArmed = $state(false);

	// =========================
	// DERIVED
	// =========================
	let t = $derived(resolveLabels(labels));
	let ordered = $derived.by(() => {
		if (!pendingOrder) return steps;
		const byId = new Map(steps.map((s) => [s.id, s]));
		return pendingOrder.flatMap((id) => byId.get(id) ?? []);
	});
	let visible = $derived(visibleSteps(ordered));
	let markers = $derived(stepMarkers(ordered, today));
	let buckets = $derived(groupSteps(visible, groups));
	let menuBuckets = $derived(groupSteps(ordered, groups));
	let progress = $derived(stepProgress(ordered));
	let hiddenCount = $derived(ordered.length - visible.length);
	let canReorder = $derived(Boolean(onReorder));

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (!pendingOrder) return;
		if (steps.map((s) => s.id).join(",") === pendingOrder.join(",")) clearPending();
	});

	$effect(() => {
		if (renamingId && renameInput) {
			renameInput.focus();
			renameInput.select();
			const frame = requestAnimationFrame(() => (renameArmed = true));
			return () => {
				cancelAnimationFrame(frame);
				renameArmed = false;
			};
		}
		renameArmed = false;
	});

	// =========================
	// FUNCTIONS
	// =========================
	function clearPending() {
		pendingOrder = null;
		if (pendingTimer) clearTimeout(pendingTimer);
		pendingTimer = null;
	}

	function applyOrder(ids: string[]) {
		if (ids.join(",") === ordered.map((s) => s.id).join(",")) return;
		pendingOrder = ids;
		if (pendingTimer) clearTimeout(pendingTimer);
		pendingTimer = setTimeout(clearPending, 5000);
		onReorder?.(ids);
	}

	function dateLabel(step: StepDef): string | null {
		const from = step.start ?? step.end;
		return from ? formatRange(from, step.start ? step.end : null, locale) : null;
	}

	function resetDrag() {
		draggedId = null;
		draggedGroup = undefined;
		overId = null;
	}

	function dragStart(event: DragEvent, step: StepDef) {
		draggedId = step.id;
		draggedGroup = step.group;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = "move";
			event.dataTransfer.setData("text/plain", step.id);
		}
	}

	// A step moves inside its own group only: a group is a phase, and dragging
	// between two would silently change what a step means.
	function dragOver(event: DragEvent, target: StepDef) {
		if (!draggedId || draggedId === target.id || target.group !== draggedGroup) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const before = event.clientY < box.top + box.height / 2;
		if (overId !== target.id || insertBefore !== before) {
			overId = target.id;
			insertBefore = before;
		}
	}

	function drop(event: DragEvent, target: StepDef) {
		const moved = draggedId;
		const before = insertBefore;
		const sameGroup = target.group === draggedGroup;
		resetDrag();
		if (!moved || moved === target.id || !sameGroup) return;
		event.preventDefault();
		applyOrder(
			reorderIds(
				ordered.map((s) => s.id),
				moved,
				target.id,
				before,
			),
		);
	}

	// Alt plus an arrow, not a bare arrow: the rail is walked with arrow keys and
	// taking them would lock keyboard users out.
	function keydown(event: KeyboardEvent, step: StepDef) {
		if (!canReorder || !event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown"))
			return;
		event.preventDefault();
		applyOrder(nudgeStep(ordered, step.id, event.key === "ArrowUp" ? -1 : 1));
	}

	function startRename(step: StepDef) {
		renamingId = step.id;
		renameValue = step.label;
	}

	function commitRename() {
		if (!renamingId) return;
		const step = ordered.find((s) => s.id === renamingId);
		const next = renameValue.trim();
		renamingId = null;
		// WHY: an unchanged name sends nothing, so a stray blur can't mark a step renamed.
		if (!step || next === step.label) return;
		onRename?.(step.id, next);
	}

	function renameKey(event: KeyboardEvent) {
		if (event.key === "Enter") {
			event.preventDefault();
			commitRename();
		} else if (event.key === "Escape") {
			event.preventDefault();
			renamingId = null;
		}
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->

<!-- One marker per state, one colour each. The accent marks only the step the
     record is on, and the warning ring only a step it has moved past. -->
{#snippet marker(kind: StepMarker)}
	{#if kind === "complete"}
		<span class="flex size-4 items-center justify-center rounded-full bg-success text-white">
			<Check class="size-2.5" weight="bold" />
		</span>
	{:else if kind === "current"}
		<span class="rounded-full bg-background p-0.75">
			<span
				class="block size-2 rounded-full bg-[color:var(--tone-accent,var(--color-primary))] ring-3 ring-[color-mix(in_oklab,var(--tone-accent,var(--color-primary))_20%,transparent)]"
			></span>
		</span>
	{:else if kind === "late"}
		<span class="size-2 rounded-full border-2 border-warning bg-background"></span>
	{:else}
		<span class="size-2 rounded-full border border-muted-foreground/40 bg-background"></span>
	{/if}
{/snippet}

<div class={cn("flex flex-col", className)}>
	<div class="mb-2 flex min-h-7 items-center gap-2 px-2">
		<h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t.steps}</h2>
		{#if !loading}
			<span class="text-xs tabular-nums text-muted-foreground">
				{t.stepsCount(progress.done, progress.total)}
			</span>
		{/if}
		{#if onToggle && !loading && ordered.length > 0}
			<Popover.Root bind:open={menuOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="sm"
							icon
							class="relative ml-auto text-muted-foreground"
							aria-label={t.editSteps}
						>
							<DotsThreeVertical class="size-4" weight="bold" />
							{#if hiddenCount > 0}
								<span
									class="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums"
									>{hiddenCount}</span
								>
							{/if}
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content align="end" class="w-64 p-1">
					{#each menuBuckets as bucket (bucket.key)}
						{#if bucket.label}
							<p
								class="px-2 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>
								{bucket.label}
							</p>
						{/if}
						{#each bucket.steps as step (step.id)}
							<Button
								variant="ghost"
								class="w-full justify-start gap-2.5 px-2 text-left"
								aria-pressed={!step.hidden}
								onclick={() => onToggle(step.id, Boolean(step.hidden))}
							>
								<span class="flex size-4 shrink-0 items-center justify-center">
									{#if step.hidden}
										<EyeSlash class="size-3.5 text-muted-foreground" />
									{:else}
										<Eye class="size-3.5" />
									{/if}
								</span>
								<span
									class={cn(
										"min-w-0 flex-1 truncate",
										step.hidden && "text-muted-foreground line-through",
									)}>{step.label}</span
								>
							</Button>
						{/each}
					{/each}
					<p
						class="mt-1 border-t border-border px-2 pt-2 pb-1 text-xs tabular-nums text-muted-foreground"
					>
						{t.shownCount(visible.length, ordered.length)}
					</p>
				</Popover.Content>
			</Popover.Root>
		{/if}
	</div>

	{#if loading}
		<div class="flex flex-col gap-2 px-2 py-1">
			{#each [0, 1, 2, 3] as i (i)}
				<Skeleton class="h-9" />
			{/each}
		</div>
	{:else if visible.length === 0}
		<p class="px-2 py-1 text-sm text-muted-foreground">{t.noSteps}</p>
	{:else}
		<div class="flex flex-col gap-4">
			{#each buckets as bucket (bucket.key)}
				<div class="flex flex-col">
					{#if bucket.label}
						<h3
							class="mb-1 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase select-none"
						>
							{bucket.label}
						</h3>
					{/if}
					{#each bucket.steps as step, index (step.id)}
						{@const kind = markers.get(step.id) ?? "pending"}
						{@const active = step.id === activeId}
						{@const when = dateLabel(step)}
						{@const renaming = renamingId === step.id}
						{@const live = draggedId !== null && draggedId !== step.id && overId === step.id}
						<ContextMenu.Root>
							<ContextMenu.Trigger>
								<div
									class={cn("relative", draggedId === step.id && "opacity-40")}
									role="presentation"
									ondragover={(e) => dragOver(e, step)}
									ondragleave={() => overId === step.id && (overId = null)}
									ondrop={(e) => drop(e, step)}
								>
									{#if live && insertBefore}
										<span
											class="pointer-events-none absolute -top-px right-2 left-2 z-10 h-0.5 rounded-full bg-[color:var(--tone-accent,var(--color-primary))]"
										></span>
									{/if}
									<!-- Raw button: the row is a drag source with a rename field and a spine
									     inside it, and Button's centred, nowrap layout can't hold that. -->
									<button
										type="button"
										draggable={canReorder && !renaming}
										class={cn(
											"relative flex min-h-9 w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors any-pointer-coarse:min-h-11 any-pointer-coarse:py-3",
											"outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
											canReorder && "active:cursor-grabbing",
											active ? "bg-muted" : "hover:bg-muted/60",
										)}
										aria-current={active ? "step" : undefined}
										onclick={() => onSelect?.(step.id)}
										ondragstart={(e) => dragStart(e, step)}
										ondragend={resetDrag}
										onkeydown={(e) => keydown(e, step)}
									>
										{#if index < bucket.steps.length - 1}
											<!-- Marker centre to the next marker's centre: py-2 plus mt-0.5 plus
											     half the size-4 marker, which paints over both ends. -->
											<span
												class={cn(
													"pointer-events-none absolute top-4.5 -bottom-4.5 left-4 z-5 w-px -translate-x-1/2 any-pointer-coarse:top-5.5 any-pointer-coarse:-bottom-5.5",
													kind === "complete" ? "bg-success/40" : "bg-border",
												)}
											></span>
										{/if}
										<span
											class="relative z-10 mt-0.5 flex size-4 shrink-0 items-center justify-center"
										>
											{@render marker(kind)}
										</span>
										<span class="min-w-0 flex-1">
											{#if renaming}
												<Input
													type="text"
													class="h-6 px-1.5 py-0 text-sm font-medium"
													aria-label={t.rename}
													bind:value={renameValue}
													bind:ref={renameInput}
													onkeydown={renameKey}
													onblur={() => renameArmed && commitRename()}
													onclick={(e: MouseEvent) => e.stopPropagation()}
												/>
											{:else}
												<span
													class={cn(
														"block truncate text-sm",
														kind === "complete" || kind === "pending"
															? "text-muted-foreground"
															: "text-foreground",
														(kind === "current" || active) && "font-medium text-foreground",
													)}>{step.label}</span
												>
												{#if when}
													<span
														class={cn(
															"mt-0.5 block text-xs tabular-nums",
															kind === "late"
																? "text-warning-800 dark:text-warning-400"
																: "text-muted-foreground",
														)}>{when}</span
													>
												{/if}
											{/if}
										</span>
									</button>
									{#if live && !insertBefore}
										<span
											class="pointer-events-none absolute right-2 -bottom-px left-2 z-10 h-0.5 rounded-full bg-[color:var(--tone-accent,var(--color-primary))]"
										></span>
									{/if}
								</div>
							</ContextMenu.Trigger>
							{#if onRename || onToggle || onReorder}
								<ContextMenu.Content class="w-48">
									{#if onRename}
										<ContextMenu.Item onclick={() => startRename(step)}>
											<PencilSimple class="mr-2 size-3.5" />
											{t.rename}
										</ContextMenu.Item>
										{#if step.renamed}
											<ContextMenu.Item onclick={() => onRename(step.id, "")}>
												<ArrowCounterClockwise class="mr-2 size-3.5" />
												{t.resetName}
											</ContextMenu.Item>
										{/if}
									{/if}
									{#if onReorder}
										<ContextMenu.Item onclick={() => applyOrder(nudgeStep(ordered, step.id, -1))}>
											<ArrowUp class="mr-2 size-3.5" />
											{t.moveUp}
										</ContextMenu.Item>
										<ContextMenu.Item onclick={() => applyOrder(nudgeStep(ordered, step.id, 1))}>
											<ArrowDown class="mr-2 size-3.5" />
											{t.moveDown}
										</ContextMenu.Item>
									{/if}
									{#if onToggle}
										<ContextMenu.Item onclick={() => onToggle(step.id, false)}>
											<EyeSlash class="mr-2 size-3.5" />
											{t.hide}
										</ContextMenu.Item>
									{/if}
								</ContextMenu.Content>
							{/if}
						</ContextMenu.Root>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>
