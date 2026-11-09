<script lang="ts">
	import type { Snippet } from "svelte";
	import { ArrowRight } from "phosphor-svelte";

	// One running part on the home page: the live demo on a stage, then its name, the import
	// it comes from and a link to its page, read like a figure caption.
	interface Props {
		title: string;
		href: string;
		importPath: string;
		/** `plain` drops the stage surface, for a demo that brings its own frame. */
		plain?: boolean;
		class?: string;
		children: Snippet;
	}

	let { title, href, importPath, plain = false, class: className = "", children }: Props = $props();
</script>

<figure class="flex min-w-0 flex-col gap-3 {className}">
	<div
		class={[
			"flex min-h-0 flex-1 items-center justify-center",
			!plain && "rounded-(--radius-xl) bg-card p-4 shadow-(--elev-card) sm:p-6",
		]}
	>
		{@render children()}
	</div>
	<figcaption class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
		<h2 class="text-sm font-medium">{title}</h2>
		<code class="truncate font-mono text-xs text-muted-foreground">{importPath}</code>
		<a
			{href}
			class="group ml-auto inline-flex min-h-6 items-center gap-1 text-sm text-muted-foreground transition-colors duration-(--duration-quick) hover:text-foreground"
		>
			Open<span class="sr-only"> {title}</span>
			<ArrowRight
				class="size-3.5 transition-transform duration-(--duration-quick) group-hover:translate-x-0.5 motion-reduce:transition-none"
				aria-hidden="true"
			/>
		</a>
	</figcaption>
</figure>
