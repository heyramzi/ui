<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { DropdownMenu } from "bits-ui";
	import { Check } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { checkboxBoxClass } from "#src/shadcn/checkbox/checkbox-box.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		checked: boolean;
		onclick: () => void;
		variant?: "checkbox" | "radio";
		children: Snippet;
	}

	// =========================
	// PROPS
	// =========================
	let { checked, onclick, variant = "checkbox", children }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- WHY both variants are checkbox items: a radio item needs a group value, and `checked` with
     `onclick` is the whole interface callers have. The setter hands the toggle to `onclick`, so
     the caller's state stays the only truth. -->
<DropdownMenu.CheckboxItem
	bind:checked={() => checked, () => onclick()}
	closeOnSelect={false}
	data-slot="dropdown-menu-checkbox-item"
	class="flex min-h-8 items-center gap-2 rounded-lg px-2 text-sm outline-hidden select-none transition-colors duration-quick ease-smooth-out hover:bg-foreground/6 data-highlighted:bg-foreground/6 motion-reduce:transition-none any-pointer-coarse:min-h-11"
>
	{#if variant === "radio"}
		<span
			class={cn(
				"grid size-3.5 shrink-0 place-items-center rounded-full border transition-colors duration-quick ease-smooth-out motion-reduce:transition-none",
				checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
			)}
		>
			{#if checked}
				<Check aria-hidden="true" class="size-2.5" weight="bold" />
			{/if}
		</span>
	{:else}
		<span
			aria-hidden="true"
			data-state={checked ? "checked" : "unchecked"}
			class={checkboxBoxClass}
		>
			{#if checked}
				<Check aria-hidden="true" size={14} />
			{/if}
		</span>
	{/if}
	{@render children()}
</DropdownMenu.CheckboxItem>
