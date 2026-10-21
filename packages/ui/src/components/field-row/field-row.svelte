<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";
	import * as Field from "#src/shadcn/field/index.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		label: string;
		/** Id of the control, so the label focuses it. */
		for: string;
		description?: string;
		error?: string;
		class?: string;
		/** The control: an Input, a Select trigger. It takes the width the action leaves. */
		children: Snippet;
		/** The button that acts on the control. Same height as the control, bottom of the row. */
		action?: Snippet;
	}

	// =========================
	// PROPS
	// =========================
	let { label, for: htmlFor, description, error, class: className, children, action }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- WHY a measure of its own: a settings card fills the page, but a text field
     stretched over 1200px is hard to read and to aim at. 36rem, left aligned. -->
<!-- WHY the coarse-pointer height: Button grows to 44px on touch and Input
     does not, so a row built from the two drew a 12px step. -->
<!-- =========================== -->
<Field.Simple
	{label}
	{description}
	{error}
	for={htmlFor}
	class={cn("max-w-xl", className)}
>
	<div
		class="flex items-start gap-2 any-pointer-coarse:[&_[data-slot=input]]:h-11"
		data-slot="field-row"
	>
		<div class="min-w-0 flex-1">{@render children()}</div>
		{#if action}
			<!-- A disabled action reads as a muted button, not a half-faded one. -->
			<div
				class="shrink-0 [&_button:disabled]:bg-muted [&_button:disabled]:text-muted-foreground [&_button:disabled]:opacity-100 [&_button:disabled]:shadow-none"
			>
				{@render action()}
			</div>
		{/if}
	</div>
</Field.Simple>
