<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { HTMLInputAttributes } from "svelte/elements";
	import { LockKey, LockKeyOpen } from "phosphor-svelte";
	import Input from "#src/shadcn/input/input.svelte";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// TYPES
	// =========================
	type Props = Omit<HTMLInputAttributes, "type" | "value" | "class" | "files"> & {
		variant?: "lock" | "obfuscate";
		value?: string;
		class?: string;
		/** The reveal button's name while the value is hidden, in the app's language. */
		revealLabel?: string;
		/** The same button's name while the value shows. */
		hideLabel?: string;
		/** The name of the `obfuscate` box. */
		maskedLabel?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		variant = "lock",
		value = $bindable(""),
		class: className,
		revealLabel = "Reveal value",
		hideLabel = "Hide value",
		maskedLabel = "Encrypted value",
		...rest
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let revealed = $state(false);

	// =========================
	// DERIVED
	// =========================
	let masked = $derived.by(() => {
		const v = value || "";
		if (!v) return "";
		if (v.length <= 8) return "•".repeat(v.length);
		return `${v.slice(0, 4)}${"•".repeat(Math.max(4, v.length - 8))}${v.slice(-4)}`;
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if variant === "obfuscate"}
	<div
		class={cn(
			"border-input bg-muted/30 text-muted-foreground flex h-8 w-full items-center gap-2 rounded-lg border px-2.5 py-1 font-mono text-sm",
			className,
		)}
		aria-label={maskedLabel}
	>
		<LockKey aria-hidden="true" class="text-muted-foreground/70 size-3.5 shrink-0" />
		<span class="truncate">{masked || "••••••••"}</span>
	</div>
{:else}
	<div class="relative">
		<Input
			type={revealed ? "text" : "password"}
			bind:value
			class={cn("pr-9", className)}
			{...rest}
		/>
		<button
			type="button"
			aria-label={revealed ? hideLabel : revealLabel}
			class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-lg transition-colors"
			onclick={() => (revealed = !revealed)}
		>
			{#if revealed}
				<LockKeyOpen aria-hidden="true" class="size-4" />
			{:else}
				<LockKey aria-hidden="true" class="size-4" />
			{/if}
		</button>
	</div>
{/if}
