<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { ClockCounterClockwise, SlidersHorizontal } from "phosphor-svelte";
	import { Avatar, AvatarFallback, AvatarImage } from "#src/shadcn/avatar/index.js";
	import { Popover, PopoverContent, PopoverTrigger } from "#src/shadcn/popover/index.js";
	import { Switch } from "#src/shadcn/switch/index.js";
	import { initials } from "#src/lib/initials.js";
	import { editStamp, editedLabel, type DateInput } from "#src/work/docs/edited.js";
	import { docLabels, type DocLabels } from "#src/work/docs/labels.js";

	// =========================
	// TYPES
	// =========================
	type Person = { name: string; image?: string | null };

	interface Props {
		/** When the doc last changed. Unreadable or missing leaves just "Edited". */
		editedAt?: DateInput;
		owner?: Person | null;
		/** The last editor. Their time falls back to `editedAt`. */
		lastEditor?: (Person & { at?: DateInput }) | null;
		/** The switch row shows only when this is passed. */
		showAuthorNames?: boolean;
		onshowauthors?: (show: boolean) => void;
		/** The history button shows only when this is passed. */
		onhistory?: () => void;
		labels?: Partial<DocLabels>;
		timeZone?: string;
		now?: Date;
	}

	// =========================
	// PROPS
	// =========================
	let {
		editedAt,
		owner = null,
		lastEditor = null,
		showAuthorNames = false,
		onshowauthors,
		onhistory,
		labels: labelOverrides,
		timeZone,
		now,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let t = $derived(docLabels(labelOverrides));
	let chip = $derived(editedLabel(editedAt, t.edited, { timeZone, now }));
	let editorStamp = $derived(editStamp(lastEditor?.at ?? editedAt, { timeZone, now }));
	// Nothing to open: the chip is a plain label rather than a button that opens an empty card.
	let hasDetails = $derived(!!onshowauthors || !!owner || !!lastEditor || !!onhistory);
</script>

{#snippet person(who: Person)}
	<Avatar class="size-5">
		{#if who.image}<AvatarImage src={who.image} alt="" />{/if}
		<AvatarFallback class="text-[9px]">{initials(who.name)}</AvatarFallback>
	</Avatar>
	<span class="truncate text-foreground">{who.name}</span>
{/snippet}

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if hasDetails}
	<Popover>
		<PopoverTrigger
			class="t-press inline-flex h-7 items-center gap-1.5 rounded-md bg-foreground/5 px-2 @max-xl/doc:px-1.5 text-[13px] font-medium text-foreground/90 tabular-nums transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] outline-none hover:bg-foreground/8 focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-foreground/8 any-pointer-coarse:h-10"
		>
			<SlidersHorizontal size={14} class="text-muted-foreground" aria-hidden="true" />
			<!-- On a narrow page the glyph stands alone, so the title keeps the bar. -->
			<span class="@max-xl/doc:sr-only">{chip}</span>
		</PopoverTrigger>
		<PopoverContent align="end" sideOffset={6} class="w-[21.5rem] gap-0 p-0 text-[13px]">
			<div class="divide-y divide-border/70">
				{#if onshowauthors}
					<div class="flex items-center justify-between px-4 py-3">
						<span class="text-muted-foreground">{t.showAuthorNames}</span>
						<Switch
							checked={showAuthorNames}
							onCheckedChange={(next) => onshowauthors?.(next)}
							aria-label={t.showAuthorNames}
						/>
					</div>
				{/if}
				{#if owner}
					<div class="flex items-center gap-3 px-4 py-3">
						<span class="w-20 shrink-0 text-muted-foreground">{t.ownedBy}</span>
						<span class="flex min-w-0 items-center gap-2">{@render person(owner)}</span>
					</div>
				{/if}
				{#if lastEditor}
					<div class="flex items-center gap-3 px-4 py-3">
						<span class="w-20 shrink-0 text-muted-foreground">{t.lastEditBy}</span>
						<span class="flex min-w-0 flex-1 items-center gap-2">{@render person(lastEditor)}</span>
						{#if editorStamp}
							<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{editorStamp}</span>
						{/if}
					</div>
				{/if}
				{#if onhistory}
					<div class="p-2">
						<button
							type="button"
							onclick={onhistory}
							class="t-press flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-foreground/5 font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] outline-none hover:bg-foreground/8 focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							<ClockCounterClockwise size={14} aria-hidden="true" />
							{t.showHistory}
						</button>
					</div>
				{/if}
			</div>
		</PopoverContent>
	</Popover>
{:else}
	<span class="inline-flex h-7 items-center text-[13px] text-muted-foreground tabular-nums">
		{chip}
	</span>
{/if}
