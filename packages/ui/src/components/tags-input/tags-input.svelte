<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { Plus, X } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
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
	}

	interface Props {
		/** The tags. Order is kept. */
		value: readonly string[];
		/** Called with the whole next list. Throw to refuse: the list reverts. */
		onchange: (next: string[]) => void | Promise<void>;
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
		 * Tags typed freely, with no options and no menu: Enter, comma, space or Tab adds what's
		 * typed, a pasted list adds every part, and leaving the field keeps what was typed.
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
		onchange,
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
	const nothing = $derived(
		!free && editing && !full && query.trim() !== "" && rows.length === 0,
	);
	const open = $derived(editing && !full && (rows.length > 0 || nothing));

	// =========================
	// FUNCTIONS
	// =========================
	async function commit(next: readonly string[]) {
		if (next === tags) return;
		pending = [...next];
		try {
			await onchange([...next]);
		} finally {
			pending = null;
		}
	}

	function start() {
		if (disabled) return;
		editing = true;
		queueMicrotask(() => input?.focus());
	}

	// Leaving the field keeps what was typed only when it is an existing label said another way.
	// Anything else is dropped unless the field is free: free text is never saved by walking away.
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
			else if (event.key === "Enter") stop();
		} else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			if (rows.length === 0) return;
			event.preventDefault();
			const step = event.key === "ArrowDown" ? 1 : -1;
			active = (active + step + rows.length) % rows.length;
		} else if (event.key === "Enter") {
			event.preventDefault();
			// The highlighted row: a close option when there is one, else the visible Create row.
			if (!query.trim()) stop();
			else if (rows.length > 0) add(rows[Math.min(active, last)].name);
		} else if (event.key === "," || (event.key === "Tab" && query.trim())) {
			event.preventDefault();
			if (query.trim() && rows.length > 0) add(rows[Math.min(active, last)].name);
		} else if (event.key === "Backspace" && query === "" && tags.length > 0) {
			void commit(removeTag(tags, tags[tags.length - 1]));
		} else if (event.key === "Escape") {
			event.preventDefault();
			if (query) query = "";
			else {
				editing = false;
				root?.querySelector("button")?.focus();
			}
		}
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

	// WHY: Chrome fires focusout from the read-state button as editing removes it, so only the input leaving counts.
	function onFocusOut(event: FocusEvent) {
		if (event.target !== input) return;
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
<!-- WHY: the edit frame is --radius-lg with 4px of padding, so the chip inside is --radius-xs
     (8 - 4), and a read-state chip on its own takes --radius-sm. -->
<!-- WHY text-base on the input: below 16px iOS zooms the page when it gets focus. -->
<!-- =========================== -->
{#snippet chip(tag: string, removable: boolean)}
	<span
		class={cn(
			"inline-flex h-5 max-w-full items-center gap-0.5 bg-muted px-1.5 text-xs font-medium text-foreground",
			removable ? "rounded-(--radius-xs) pr-0.5" : "rounded-(--radius-sm)",
		)}
	>
		<span class="truncate" title={tag}>{tag}</span>
		{#if removable}
			<button
				type="button"
				tabindex="-1"
				class="relative grid size-4 shrink-0 place-items-center rounded-(--radius-xs) text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground before:absolute before:-inset-1.5 before:content-['']"
				aria-label={text.remove(tag)}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => commit(removeTag(tags, tag))}
			>
				<X class="size-3" weight="bold" aria-hidden="true" />
			</button>
		{/if}
	</span>
{/snippet}

<div
	bind:this={root}
	class={cn("relative min-w-0", className)}
	onfocusout={onFocusOut}
	role="presentation"
>
	{#if editing}
		<div
			class="-ml-1.5 flex min-h-7 flex-wrap items-center gap-1 rounded-lg bg-background p-1 ring-1 ring-ring/60 focus-within:ring-2 focus-within:ring-ring"
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
				class="absolute top-full left-0 z-50 mt-1 max-h-60 w-full min-w-48 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-(--elev-overlay)"
			>
				{#each rows as row, index (row.kind + row.name)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<li
						id="{listId}-{index}"
						role="option"
						aria-selected={index === active}
						class={cn(
							"flex min-h-8 cursor-default items-center gap-2 rounded-lg px-2 text-sm any-pointer-coarse:min-h-11",
							index === active && "bg-accent text-accent-foreground",
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
				"-ml-1.5 flex min-h-7 w-full flex-wrap items-center gap-1 rounded-lg px-1.5 py-1 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
			)}
			aria-label={label}
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
</div>
