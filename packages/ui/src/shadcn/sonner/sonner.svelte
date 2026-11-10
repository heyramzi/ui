<script lang="ts">
	import { CheckCircle, Info, Warning, XCircle } from "phosphor-svelte";

	import { Spinner } from "#src/shadcn/spinner/index.js";
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	import { mode } from "mode-watcher";

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={mode.current}
	class="toaster group"
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
	{...restProps}
	>{#snippet loadingIcon()}
		<Spinner />
	{/snippet}
	{#snippet successIcon()}
		<CheckCircle aria-hidden="true" class="size-4" />
	{/snippet}
	{#snippet errorIcon()}
		<XCircle aria-hidden="true" class="size-4" />
	{/snippet}
	{#snippet infoIcon()}
		<Info aria-hidden="true" class="size-4" />
	{/snippet}
	{#snippet warningIcon()}
		<Warning aria-hidden="true" class="size-4" />
	{/snippet}
</Sonner>
