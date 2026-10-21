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
	};

	// =========================
	// PROPS
	// =========================
	let { variant = "lock", value = $bindable(""), class: className, ...rest }: Props = $props();

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
		aria-label="Encrypted value"
	>
		<LockKey class="text-muted-foreground/70 size-3.5 shrink-0" />
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
			aria-label={revealed ? "Hide value" : "Reveal value"}
			class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-lg transition-colors"
			onclick={() => (revealed = !revealed)}
		>
			{#if revealed}
				<LockKeyOpen class="size-4" />
			{:else}
				<LockKey class="size-4" />
			{/if}
		</button>
	</div>
{/if}
