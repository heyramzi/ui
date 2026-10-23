<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import {
		ArrowsOutCardinal,
		CaretLeft,
		CaretRight,
		ClockCounterClockwise,
		Alarm,
		Clipboard,
		CopySimple,
		DotsThree,
		FileDashed,
		PencilSimple,
		Star,
		Trash,
	} from "phosphor-svelte";
	import type { Component, Snippet } from "svelte";
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
	} from "#src/shadcn/alert-dialog/index.js";
	import { buttonVariants } from "#src/shadcn/button/index.js";
	import {
		Command,
		CommandEmpty,
		CommandGroup,
		CommandInput,
		CommandItem,
		CommandList,
		CommandSeparator,
		CommandShortcut,
	} from "#src/shadcn/command/index.js";
	import { Popover, PopoverContent, PopoverTrigger } from "#src/shadcn/popover/index.js";
	import { docLabels, type DocLabels } from "#src/work/docs/labels.js";
	import {
		copyOptions,
		deleteName,
		filterMenu,
		menuItems,
		shortcutLabel,
		shortcutTarget,
		type CopyKind,
		type MenuId,
	} from "#src/work/docs/menu.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** The doc's title. An empty one reads "Untitled" in the delete confirm. */
		title: string;
		/** The doc's address; "Copy URL" and "title as link" need it. */
		url?: string;
		/** The doc as Tiptap JSON; "Copy content as Markdown" needs it. */
		content?: unknown;
		favorited?: boolean;
		/** Every item is a callback. One that isn't passed doesn't show. */
		onmove?: () => void;
		onduplicate?: () => void;
		onrename?: () => void;
		ontemplate?: () => void;
		onfavorite?: () => void;
		/** Passing it shows Copy. It runs after the text is on the clipboard, for a toast. */
		oncopy?: (kind: CopyKind, text: string) => void;
		onremind?: () => void;
		onhistory?: () => void;
		/** Passing it shows Delete, behind a confirm that names the doc. */
		ondelete?: () => void;
		/** One line under the confirm title: "and its 3 sub-pages". */
		deleteDetail?: string;
		/** Fire items from the keyboard (⇧R) while no field has focus. */
		shortcuts?: boolean;
		open?: boolean;
		labels?: Partial<DocLabels>;
		/** Replaces the round `…` button. Spread `props` on the element. */
		trigger?: Snippet<[Record<string, unknown>]>;
	}

	// =========================
	// PROPS
	// =========================
	let {
		title,
		url,
		content,
		favorited = false,
		onmove,
		onduplicate,
		onrename,
		ontemplate,
		onfavorite,
		oncopy,
		onremind,
		onhistory,
		ondelete,
		deleteDetail,
		shortcuts = true,
		open = $bindable(false),
		labels: labelOverrides,
		trigger,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let query = $state("");
	let page = $state<"root" | "copy">("root");
	let confirming = $state(false);

	// =========================
	// DERIVED
	// =========================
	let t = $derived(docLabels(labelOverrides));
	let all = $derived(
		menuItems(
			{
				move: !!onmove,
				duplicate: !!onduplicate,
				rename: !!onrename,
				template: !!ontemplate,
				favorite: !!onfavorite,
				copy: !!oncopy,
				remind: !!onremind,
				history: !!onhistory,
				delete: !!ondelete,
			},
			t,
			{ favorited },
		),
	);
	let visible = $derived(filterMenu(all, query));
	// Groups keep their order; a hairline sits between the ones that still have an item.
	let groups = $derived.by(() => {
		const byGroup = new Map<number, typeof visible>();
		for (const item of visible) byGroup.set(item.group, [...(byGroup.get(item.group) ?? []), item]);
		return [...byGroup.entries()].toSorted((a, b) => a[0] - b[0]).map(([, items]) => items);
	});
	// Built only while the copy list is showing: the Markdown of a long doc isn't free.
	let copies = $derived(
		page === "copy" ? filterMenu(copyOptions({ title, url, content }, t), query) : [],
	);
	let confirmName = $derived(deleteName(title, t));

	const ICONS: Record<MenuId, Component<{ class?: string }>> = {
		move: ArrowsOutCardinal,
		duplicate: CopySimple,
		rename: PencilSimple,
		template: FileDashed,
		favorite: Star,
		copy: Clipboard,
		remind: Alarm,
		history: ClockCounterClockwise,
		delete: Trash,
	};

	// =========================
	// FUNCTIONS
	// =========================
	function reset() {
		query = "";
		page = "root";
	}

	function fire(id: MenuId) {
		const run: Partial<Record<MenuId, (() => void) | undefined>> = {
			move: onmove,
			duplicate: onduplicate,
			rename: onrename,
			template: ontemplate,
			favorite: onfavorite,
			remind: onremind,
			history: onhistory,
		};
		if (id === "copy") {
			query = "";
			page = "copy";
			return;
		}
		open = false;
		if (id === "delete") confirming = true;
		else run[id]?.();
	}

	async function copy(kind: CopyKind, text: string) {
		open = false;
		// A blocked clipboard still reports, so the host can say the copy didn't land.
		await navigator.clipboard.writeText(text).catch(() => {});
		oncopy?.(kind, text);
	}

	function onWindowKey(event: KeyboardEvent) {
		if (!shortcuts || event.defaultPrevented || event.repeat) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest("input, textarea, select, [contenteditable='true'], [role='dialog']"))
			return;
		const id = shortcutTarget(event, all);
		if (!id) return;
		event.preventDefault();
		fire(id);
	}

	function onListKey(event: KeyboardEvent) {
		if (page !== "copy") return;
		const empty = query === "";
		if (event.key === "ArrowLeft" || (event.key === "Backspace" && empty)) {
			if (event.key === "ArrowLeft" && !empty) return;
			event.preventDefault();
			reset();
		}
	}
</script>

<svelte:window onkeydown={onWindowKey} />

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Popover
	bind:open
	onOpenChange={(next) => {
		// Reset as it opens, not as it closes: a reset mid-fade flashes the root list.
		if (next) reset();
	}}
>
	<PopoverTrigger aria-label={t.menu}>
		{#snippet child({ props })}
			{#if trigger}
				{@render trigger(props)}
			{:else}
				<button
					{...props}
					type="button"
					class="t-press inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] outline-none hover:bg-foreground/6 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-foreground/6 aria-expanded:text-foreground any-pointer-coarse:size-10"
				>
					<DotsThree size={18} weight="bold" aria-hidden="true" />
				</button>
			{/if}
		{/snippet}
	</PopoverTrigger>
	<PopoverContent align="start" sideOffset={6} class="w-64 gap-0 overflow-hidden p-0">
		<Command shouldFilter={false} onkeydown={onListKey} class="rounded-xl">
			<CommandInput
				bind:value={query}
				placeholder={page === "copy" ? t.copy : t.filter}
				aria-label={t.filter}
			/>
			<CommandList class="max-h-[22rem] p-1.5">
				{#if page === "root"}
					{#each groups as items, i (i)}
						{#if i > 0 && !query}<CommandSeparator class="my-1.5" />{/if}
						<CommandGroup class="p-0">
							{#each items as item (item.id)}
								{@const Icon = ICONS[item.id]}
								<CommandItem
									value={item.id}
									onSelect={() => fire(item.id)}
									class={item.danger ? "text-destructive data-selected:text-destructive" : ""}
								>
									<Icon
										class={item.id === "favorite" && favorited
											? "text-brand"
											: item.danger
												? ""
												: "text-muted-foreground"}
									/>
									<span class="flex-1 truncate">{item.label}</span>
									{#if item.shortcut}
										<CommandShortcut class="text-xs tracking-normal"
											>{shortcutLabel(item.shortcut)}</CommandShortcut
										>
									{:else if item.submenu}
										<CaretRight size={12} class="text-muted-foreground" aria-hidden="true" />
									{/if}
								</CommandItem>
							{/each}
						</CommandGroup>
					{/each}
					{#if visible.length === 0}
						<CommandEmpty class="py-6 text-center text-[13px] text-muted-foreground">
							{t.noResults}
						</CommandEmpty>
					{/if}
				{:else}
					<CommandGroup class="p-0">
						{#if !query}
							<CommandItem value="__back" onSelect={reset} class="text-muted-foreground">
								<CaretLeft size={14} aria-hidden="true" />
								<span>{t.back}</span>
							</CommandItem>
							<CommandSeparator class="my-1.5" />
						{/if}
						{#each copies as option (option.kind)}
							<CommandItem value={option.kind} onSelect={() => copy(option.kind, option.text)}>
								<span class="truncate">{option.label}</span>
							</CommandItem>
						{/each}
					</CommandGroup>
					{#if copies.length === 0}
						<CommandEmpty class="py-6 text-center text-[13px] text-muted-foreground">
							{t.noResults}
						</CommandEmpty>
					{/if}
				{/if}
			</CommandList>
		</Command>
	</PopoverContent>
</Popover>

<AlertDialog bind:open={confirming}>
	<AlertDialogContent class="sm:max-w-sm">
		<AlertDialogHeader>
			<AlertDialogTitle>{t.deleteTitle(confirmName)}</AlertDialogTitle>
			<AlertDialogDescription>{deleteDetail ?? t.deleteDetail}</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>{t.cancel}</AlertDialogCancel>
			<AlertDialogAction
				class={buttonVariants({ variant: "destructive" })}
				onclick={() => ondelete?.()}
			>
				{t.delete}
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
