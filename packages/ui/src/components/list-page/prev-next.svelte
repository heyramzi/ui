<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { CaretLeft, CaretRight } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { stepTo } from "#src/components/list-page/step.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** Ids in the order the list shows them. */
		ids: readonly string[];
		current: string | null | undefined;
		onselect: (id: string) => void;
		previousLabel?: string;
		nextLabel?: string;
		/** Off when two steppers share a page, so one key press moves one list. */
		keys?: boolean;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		ids,
		current,
		onselect,
		previousLabel = "Previous",
		nextLabel = "Next",
		keys = true,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let index = $derived(current ? ids.indexOf(current) : -1);
	let prev = $derived(stepTo(ids, current, -1));
	let next = $derived(stepTo(ids, current, 1));

	// =========================
	// HANDLERS
	// =========================
	function isTyping(event: KeyboardEvent): boolean {
		const target = event.target as HTMLElement | null;
		return Boolean(target?.closest("input, textarea, select, [contenteditable='true']"));
	}

	function ignored(event: KeyboardEvent): boolean {
		const modified = event.metaKey || event.ctrlKey || event.altKey;
		return !keys || modified || event.defaultPrevented || isTyping(event);
	}

	// K and J, as in Gmail: the arrows already belong to slide viewers and text fields.
	function targetFor(key: string): string | null {
		if (key === "k") return prev;
		if (key === "j") return next;
		return null;
	}

	function onkeydown(event: KeyboardEvent) {
		if (ignored(event)) return;
		const id = targetFor(event.key);
		if (!id) return;
		event.preventDefault();
		onselect(id);
	}
</script>

<svelte:window {onkeydown} />

{#if index >= 0 && ids.length > 1}
	<div class={cn("flex items-center gap-0.5 text-muted-foreground", className)}>
		<Button
			variant="ghost"
			size="sm"
			icon
			class="text-muted-foreground"
			disabled={!prev}
			onclick={() => prev && onselect(prev)}
			aria-label={previousLabel}
			title={`${previousLabel} (K)`}
		>
			<CaretLeft size={15} />
		</Button>
		<span class="min-w-9 text-center text-xs tabular-nums">{index + 1}/{ids.length}</span>
		<Button
			variant="ghost"
			size="sm"
			icon
			class="text-muted-foreground"
			disabled={!next}
			onclick={() => next && onselect(next)}
			aria-label={nextLabel}
			title={`${nextLabel} (J)`}
		>
			<CaretRight size={15} />
		</Button>
	</div>
{/if}
