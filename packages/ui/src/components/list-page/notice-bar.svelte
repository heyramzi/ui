<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { Warning, Info, CheckCircle, WarningCircle } from "phosphor-svelte";
import { cn } from "#src/lib/utils.js";
import { Alert } from "#src/shadcn/alert/index.js";
import { TONE_CLASS, type Tone as SeverityTone } from "#src/lib/tone.js";
import type { PhosphorIcon } from "#src/lib/icon-types.js";

// =========================
// TYPES
// =========================
// A strip that stops the reader is a severity. Neutral and accent are chip tones.
type Tone = Extract<SeverityTone, "destructive" | "warning" | "info" | "success">;

interface Props {
	// The "look at this before you act" strip. Hand-rolled ones used raw amber
	// and sky, so one severity showed two colours one route apart.
	tone?: Tone;
	icon?: PhosphorIcon;
	// The trailing control: a retry, a jump to the thing that needs fixing.
	actions?: Snippet;
	children: Snippet;
	class?: string;
}

const TONE_ICON: Record<Tone, PhosphorIcon> = {
	destructive: Warning,
	warning: WarningCircle,
	info: Info,
	success: CheckCircle,
};

// =========================
// PROPS
// =========================
let { tone = "destructive", icon, actions, children, class: className }: Props = $props();

// =========================
// DERIVED
// =========================
let Icon = $derived(icon ?? TONE_ICON[tone]);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- WHY `status` for the calm tones: info and success shouldn't interrupt a
     screen reader the way a failure does. -->
<Alert
	variant={tone === "destructive" ? "destructive" : "default"}
	role={tone === "destructive" || tone === "warning" ? "alert" : "status"}
	class={cn(
		"flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl [&>svg]:translate-y-0",
		TONE_CLASS[tone],
		className,
	)}
>
	<Icon class="size-4 shrink-0" aria-hidden="true" />
	<span class="min-w-0 flex-1 font-medium">{@render children()}</span>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</Alert>
