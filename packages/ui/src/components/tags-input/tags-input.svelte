<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { tick } from "svelte";
	import { Plus } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import TagChip from "#src/components/chip/tag-chip.svelte";
	import {
		addTag,
		canCreate,
		findOption,
		matchOptions,
		removeTag,
		splitTags,
		splitTyped,
	} from "#src/components/tags-input/tags.js";

	// =========================
	// TYPES
	// =========================
	interface Labels {
		/** Shown in the empty read state and as the input's placeholder. */
		add: string;
		create: (query: string) => string;
		remove: (tag: string) => string;
		max: string;
		/** Shown when what's typed matches nothing and creating isn't allowed. */
		none: string;
		/** Announced to a screen reader once a tag is saved, and once one is gone. */
		added: (tag: string) => string;
		removed: (tag: string) => string;
	}

	interface Props {
		/** The tags. Order is kept. */
		value: readonly string[];
		/** Called with the whole next list. Throw to refuse: the list reverts. */
		onValueChange: (next: string[]) => void | Promise<void>;
		/** The labels people pick from. Picking one stores its exact spelling and case. */
		options?: readonly string[];
		/**
		 * Whether a label that isn't an option may be made, through the "Create" row only.
		 * Text close to an option never becomes a label unless that row is chosen.
		 */
		allowCreate?: boolean;
		/** Most tags the list holds. Past it the input goes away. */
		max?: number;
		/**
		 * Free typing, no options or menu: Enter, comma, space or Tab adds what's typed, a paste
		 * adds every part, and leaving the field keeps the text.
		 */
		free?: boolean;
		/** Accessible name of the field. */
		label: string;
		labels?: Partial<Labels>;
		disabled?: boolean;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		value,
		onValueChange,
		options = [],
		allowCreate = true,
		max,
		free = false,
		label,
		labels,
		disabled = false,
		class: className,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let editing = $state(false);
	let query = $state("");
	let active = $state(0);
	// What the list shows while a save is in flight, so a tag doesn't blink out and back.
	let pending = $state<string[] | null>(null);
	let input = $state<HTMLInputElement | null>(null);
	let root = $state<HTMLElement | null>(null);
	/** What the live region last said: the tags a save added or removed. */
	let announcement = $state("");
	const listId = $props.id();

	// =========================
	// DERIVED
	// =========================
	const text: Labels = $derived({
		add: "Add",
		create: (q) => `Create “${q}”`,
		remove: (tag) => `Remove ${tag}`,
		max: "Limit reached",
		none: "No match",
		added: (tag) => `Added ${tag}`,
		removed: (tag) => `Removed ${tag}`,
		...labels,
	});
	const tags = $derived(pending ?? [...value]);
	const full = $derived(max !== undefined && tags.length >= max);
	const matches = $derived(matchOptions(options, tags, query));
	const creatable = $derived(canCreate(options, tags, query, allowCreate));
	// Options closest first (a typo's fix comes before anything new), then the one row that makes what's typed.
	const rows = $derived(
		free
			? []
			: [
					...matches.map((name) => ({ kind: "pick" as const, name })),
					...(creatable ? [{ kind: "create" as const, name: query.trim() }] : []),
				],
	);
	const nothing = $derived(!free && editing && !full && query.trim() !== "" && rows.length === 0);
	const open = $derived(editing && !full && (rows.length > 0 || nothing));

	// =========================
	// FUNCTIONS
	// =========================
	async function commit(next: readonly string[]) {
		if (next === tags) return;
		const before = tags;
		pending = [...next];
		try {
			await onValueChange([...next]);
			announcement = [
				...next.filter((tag) => !before.includes(tag)).map(text.added),
				...before.filter((tag) => !next.includes(tag)).map(text.removed),
			].join(", ");
		} finally {
			pending = null;
		}
	}

	function start() {
		if (disabled) return;
		editing = true;
		// A full list has no box, so focus lands on the last chip instead.
		void tick().then(() => (input ?? chipButtons().at(-1))?.focus());
	}

	const chipButtons = () => [
		...(root?.querySelectorAll<HTMLButtonElement>("[data-slot=tag-chip] button") ?? []),
	];

	// Arrows walk the chips and the box, Backspace or Delete removes the focused chip, Esc goes back to the box.
	function onChipKey(event: KeyboardEvent, tag: string) {
		const buttons = chipButtons();
		const index = buttons.findIndex((button) => button === event.target);
		if (index < 0) return;
		const next = buttons[index + 1] ?? input;
		if (event.key === "ArrowLeft") buttons[index - 1]?.focus();
		else if (event.key === "ArrowRight") next?.focus();
		else if (event.key === "Escape") (input ?? next)?.focus();
		else if (["Backspace", "Delete", "Enter", " "].includes(event.key)) {
			// Focus moves on first, so it never drops to the page. A full list's last chip waits for the box.
			(next ?? buttons[index - 1])?.focus();
			void commit(removeTag(tags, tag));
			void tick().then(() => {
				if (!root?.contains(document.activeElement)) input?.focus();
			});
		} else return;
		event.preventDefault();
	}

	// Blur keeps typed text only when it's an existing label spelt another way, or the field is free.
	function stop() {
		const typed = query;
		query = "";
		editing = false;
		const match = free ? typed.trim() : findOption(options, typed);
		if (match) void commit(addTag(tags, match, options, max));
	}

	function add(name: string) {
		query = "";
		active = 0;
		void commit(addTag(tags, name, options, max));
	}

	function onKey(event: KeyboardEvent) {
		const last = rows.length - 1;
		const separator = event.key === "," || (free && event.key === " ");
		if (free && (separator || event.key === "Enter" || (event.key === "Tab" && query.trim()))) {
			event.preventDefault();
			if (query.trim()) add(query);
			else if (event.key === "Enter") finish();
		} else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			if (rows.length === 0) return;
			event.preventDefault();
			const step = event.key === "ArrowDown" ? 1 : -1;
			active = (active + step + rows.length) % rows.length;
		} else if (event.key === "Enter") {
			event.preventDefault();
			// The highlighted row: a close option when there is one, else the visible Create row.
			if (!query.trim()) finish();
			else if (rows.length > 0) add(rows[Math.min(active, last)].name);
		} else if (event.key === "," || (event.key === "Tab" && query.trim())) {
			event.preventDefault();
			if (query.trim() && rows.length > 0) add(rows[Math.min(active, last)].name);
		} else if (
			event.key === "ArrowLeft" &&
			tags.length > 0 &&
			input?.selectionStart === 0 &&
			input.selectionEnd === 0
		) {
			event.preventDefault();
			chipButtons().at(-1)?.focus();
		} else if (event.key === "Backspace" && query === "" && tags.length > 0) {
			void commit(removeTag(tags, tags[tags.length - 1]));
		} else if (event.key === "Escape") {
			event.preventDefault();
			if (query) query = "";
			else finish();
		}
	}

	// Closing from the keyboard hands focus back to the field, once it's drawn again.
	function finish() {
		stop();
		void tick().then(() => root?.querySelector("button")?.focus());
	}

	// Pasted words that are existing labels are added. The rest stay in the box to be created on purpose.
	function onPaste(event: ClipboardEvent) {
		const pasted = event.clipboardData?.getData("text") ?? "";
		if (free) return pasteTyped(event, pasted);
		if (!/[,\n]/.test(pasted)) return;
		event.preventDefault();
		const parts = splitTags(pasted);
		const known = parts.filter((part) => findOption(options, part));
		const rest = parts.filter((part) => !findOption(options, part));
		query = rest.join(", ");
		void commit(
			known.reduce((list, part) => addTag(list, part, options, max), tags as readonly string[]),
		);
	}

	// A free field takes a pasted list whole, one tag per part. One word pastes into the box as usual.
	function pasteTyped(event: ClipboardEvent, pasted: string) {
		const parts = splitTyped(pasted);
		if (parts.length < 2) return;
		event.preventDefault();
		query = "";
		void commit(
			parts.reduce((list, part) => addTag(list, part, options, max), tags as readonly string[]),
		);
	}

	// WHY: Chrome fires focusout from the read-state button as editing removes it, so only the box or a chip leaving counts.
	function onFocusOut(event: FocusEvent) {
		const chipLeft = editing && (event.target as Element).closest("[data-slot=tag-chip]");
		if (event.target !== input && !chipLeft) return;
		const next = event.relatedTarget as Node | null;
		if (editing && !(next && root?.contains(next))) stop();
	}

	// A new query starts from its best match.
	$effect(() => {
		void query;
		active = 0;
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- WHY: the chips are TagChip at --radius-sm (6px); the edit frame is --radius-lg (10px), which
     is 6 plus its 4px of padding, so the curves stay concentric. -->
<!-- WHY text-base on the input: below 16px iOS zooms the page when it gets focus. -->
<!-- =========================== -->
{#snippet chip(tag: string, removable: boolean)}
	<TagChip
		title={tag}
		removeLabel={text.remove(tag)}
		removeFocusable={false}
		onRemove={removable ? () => commit(removeTag(tags, tag)) : undefined}
		onkeydown={removable ? (event: KeyboardEvent) => onChipKey(event, tag) : undefined}
	>
		{tag}
	</TagChip>
{/snippet}

<div
	bind:this={root}
	class={cn("relative min-w-0", className)}
	onfocusout={onFocusOut}
	role="presentation"
>
	{#if editing}
		<div
			class="-ml-1.5 flex min-h-7 flex-wrap items-center gap-1 rounded-lg bg-card p-1 ring-1 ring-ring/60 focus-within:ring-2 focus-within:ring-ring"
		>
			{#each tags as tag (tag.toLowerCase())}
				{@render chip(tag, true)}
			{/each}
			{#if full}
				<span class="px-1 text-xs text-muted-foreground">{text.max}</span>
			{:else}
				<input
					bind:this={input}
					bind:value={query}
					type="text"
					role="combobox"
					aria-label={label}
					aria-expanded={open}
					aria-controls={listId}
					aria-autocomplete="list"
					aria-activedescendant={open ? `${listId}-${active}` : undefined}
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					enterkeyhint="done"
					placeholder={tags.length === 0 ? text.add : ""}
					class="h-5 min-w-16 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground sm:text-xs"
					onkeydown={onKey}
					onpaste={onPaste}
				/>
			{/if}
		</div>
		{#if open}
			<ul
				id={listId}
				role="listbox"
				aria-label={label}
				class="absolute top-full left-0 z-50 mt-1 max-h-60 w-full min-w-48 overflow-y-auto rounded-xl bg-popover p-1 text-popover-foreground shadow-edge-raised"
			>
				{#each rows as row, index (row.kind + row.name)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<li
						id="{listId}-{index}"
						role="option"
						aria-selected={index === active}
						class={cn(
							"flex min-h-8 cursor-default items-center gap-2 rounded-lg px-2 text-sm any-pointer-coarse:min-h-11",
							index === active && "bg-foreground/6 text-foreground",
						)}
						onmousedown={(e) => e.preventDefault()}
						onmousemove={() => (active = index)}
						onclick={() => add(row.name)}
					>
						{#if row.kind === "create"}
							<Plus class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
							<span class="truncate">{text.create(row.name)}</span>
						{:else}
							<span class="truncate">{row.name}</span>
						{/if}
					</li>
				{/each}
				{#if nothing}
					<li class="flex min-h-8 items-center px-2 text-sm text-muted-foreground">{text.none}</li>
				{/if}
			</ul>
		{/if}
	{:else}
		<button
			type="button"
			class={cn(
				"-ml-1.5 flex min-h-7 w-full flex-wrap items-center gap-1 rounded-lg px-1.5 py-1 text-left transition-colors outline-none duration-quick ease-smooth-out hover:bg-foreground/4 focus-visible:shadow-(--ring-focus) disabled:pointer-events-none motion-reduce:transition-none",
			)}
			aria-label={tags.length > 0 ? `${label}: ${tags.join(", ")}` : label}
			{disabled}
			onclick={start}
		>
			{#each tags as tag (tag.toLowerCase())}
				{@render chip(tag, false)}
			{:else}
				<span class="text-sm text-muted-foreground">{text.add}</span>
			{/each}
		</button>
	{/if}
	<span class="sr-only" role="status">{announcement}</span>
</div>
