<script lang="ts" generics="V extends string">
	import type { Snippet } from "svelte";
	import * as Command from "#src/shadcn/command/index.js";
	import * as Popover from "#src/shadcn/popover/index.js";
	import { cn } from "@heyramzi/utils";
	import type { PickerGroup, PickerOption } from "#src/components/picker/types.js";

	/**
	 * One menu for every "pick one of these" in the app: priority, person, week,
	 * goal, status. It's the Command palette at popover scale, same keys.
	 */
	// It replaced four pickers in one sidebar, each built differently. Only one
	// had search, only one had arrow keys, and the check mark sat in three places.

	interface Props {
		/** Flat list. Mutually exclusive with `groups`. */
		options?: PickerOption<V>[];
		/** Titled runs, when the menu has a shape worth naming. */
		groups?: PickerGroup<V>[];
		value: V | null;
		onSelect: (value: V) => void;
		/** The control that opens the menu. Rendered inside `Popover.Trigger`. */
		trigger: Snippet;
		/** Class for the trigger. Use `pickerTriggerClass` to build it. */
		triggerClass?: string;
		triggerLabel?: string;
		/**
		 * A mark drawn at the head of a row when the option carries no icon: an
		 * avatar, a client logo, a colour swatch.
		 */
		lead?: Snippet<[PickerOption<V>]>;
		/** Pinned under the list: a clear action, a hint, a secondary surface. */
		footer?: Snippet<[{ close: () => void }]>;
		/**
		 * Search field. `auto` shows it from seven rows, the point at which the
		 * eye stops finding a name faster than the fingers can type it.
		 */
		searchable?: boolean | "auto";
		searchPlaceholder?: string;
		emptyLabel?: string;
		open?: boolean;
		align?: "start" | "center" | "end";
		/** `sm` fits a word, `default` a name, `lg` a name and a date. */
		width?: "sm" | "default" | "lg";
		disabled?: boolean;
	};

	let {
		options,
		groups,
		value,
		onSelect,
		trigger,
		triggerClass,
		triggerLabel,
		lead,
		footer,
		searchable = "auto",
		searchPlaceholder,
		emptyLabel = "No matches",
		open = $bindable(false),
		align = "start",
		width = "default",
		disabled = false
	}: Props = $props();

	let resolved = $derived<PickerGroup<V>[]>(groups ?? [{ options: options ?? [] }]);
	let count = $derived(resolved.reduce((n, g) => n + g.options.length, 0));
	let showSearch = $derived(searchable === "auto" ? count >= 7 : searchable);

	// 176 / 208 / 240px. The reference runs a 5-row priority menu at 206px, so
	// `default` is the common case. `lg` fits a name and a date without cutting.
	const WIDTH = { sm: "w-44", default: "w-52", lg: "w-60" } as const;

	function pick(next: V) {
		open = false;
		onSelect(next);
	}

	/**
	 * WHY a custom filter: the default one scores `value`, which is often an id.
	 * Typing "an" fuzzy-matched every uuid, so only the visible words are searched.
	 */
	function filter(_value: string, search: string, keywords?: string[]) {
		return keywords ? Command.computeCommandScore(keywords.join(" "), search) : 0;
	}

	function keywordsFor(option: PickerOption<V>): string[] {
		return [option.label, option.hint, option.keywords].filter(Boolean) as string[];
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger class={triggerClass} aria-label={triggerLabel} {disabled}>
		{@render trigger()}
	</Popover.Trigger>
	<!-- A picker opens below its trigger. `side` was a prop taking four edges and
	 no caller in any repo had ever passed one. Deleted 4 Sep 2026. -->
	<Popover.Content {align} side="bottom" class={cn("p-0", WIDTH[width])}>
		<Command.Root {filter} loop>
			{#if showSearch}
				<Command.Input placeholder={searchPlaceholder} />
			{/if}
			<Command.List class={cn(!showSearch && "py-1.5")}>
				{#if showSearch}
					<Command.Empty>{emptyLabel}</Command.Empty>
				{/if}
				{#each resolved as group, i (group.heading ?? i)}
					<Command.Group heading={group.heading}>
						{#each group.options as option (option.value)}
							{@const active = option.value === value}
							<Command.Item
								value={option.value}
								keywords={keywordsFor(option)}
								disabled={option.disabled}
								data-checked={active ? "true" : undefined}
								onSelect={() => pick(option.value)}
							>
								{#if option.icon}
									{@const Icon = option.icon}
									<Icon class={cn("size-4", option.tone)} weight="bold" />
								{:else if lead}
									{@render lead(option)}
								{/if}
								<span class={cn("min-w-0 flex-1 truncate text-left", active && option.tone)}>
									{option.label}
								</span>
								{#if option.hint}
									<span class="text-muted-foreground shrink-0 text-xs tabular-nums">{option.hint}</span>
								{/if}
							</Command.Item>
						{/each}
					</Command.Group>
				{/each}
			</Command.List>
			{#if footer}
				<div class="border-border/70 border-t p-1.5">
					{@render footer({ close: () => (open = false) })}
				</div>
			{/if}
		</Command.Root>
	</Popover.Content>
</Popover.Root>
