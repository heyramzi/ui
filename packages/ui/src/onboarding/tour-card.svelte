<script lang="ts">
	import { Button } from "#src/shadcn/button/index.js";
	import { X } from "phosphor-svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Strings } from "#src/onboarding/types.js";

	type Attrs = HTMLAttributes<HTMLElement>;

	// The card is plain markup. The engine hands it the attribute bags that wire it to the machine.
	let {
		title,
		body,
		image,
		intro = false,
		index,
		total,
		strings,
		titleAttrs,
		bodyAttrs,
		onclose,
		onprev,
		onnext,
	}: {
		title: string;
		body: string;
		image?: string;
		intro?: boolean;
		index: number;
		total: number;
		strings: Strings;
		titleAttrs: Attrs;
		bodyAttrs: Attrs;
		onclose: () => void;
		onprev: () => void;
		/** The last step's button reads "done", and this closes the tour. */
		onnext: () => void;
	} = $props();

	const last = $derived(index === total - 1);
</script>

{#if image}
	<img
		src={image}
		alt=""
		class="aspect-video w-full rounded-t-[inherit] object-cover outline -outline-offset-1 outline-black/10 dark:outline-white/10"
	/>
{/if}
<div class="flex flex-col gap-1.5 p-4 pb-3">
	<div class="flex items-start justify-between gap-3">
		<h2
			{...titleAttrs}
			class={["font-semibold leading-snug text-balance", intro ? "text-base" : "text-sm"]}
		>
			{title}
		</h2>
		<Button
			onclick={onclose}
			variant="ghost"
			size="sm"
			icon
			class="-mt-1 -mr-1.5 text-muted-foreground"
			aria-label={strings.skip}
		>
			<X weight="bold" />
		</Button>
	</div>
	<p {...bodyAttrs} class="text-muted-foreground text-sm text-pretty">{body}</p>
</div>
<div class="flex items-center justify-between gap-3 px-4 pb-4">
	{#if total > 1}
		<div
			role="img"
			aria-label={strings.progress(index + 1, total)}
			class="flex items-center gap-1.5"
		>
			{#each { length: total } as _, i (i)}
				<span
					class={[
						"h-1.5 rounded-full transition-[width,background-color] duration-(--duration-fast) ease-(--ease-smooth-out) motion-reduce:transition-none",
						i === index ? "bg-foreground w-4" : "bg-border w-1.5",
					]}
				></span>
			{/each}
		</div>
	{:else}
		<span></span>
	{/if}
	<div class="flex items-center gap-2">
		{#if index > 0}
			<Button onclick={onprev} variant="ghost" size="sm">{strings.back}</Button>
		{/if}
		<Button onclick={onnext} size="sm">{last ? strings.done : strings.next}</Button>
	</div>
</div>
