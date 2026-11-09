<script lang="ts">
	import { Response } from "@heyramzi/ui/ai/response";
	import { formatDay, releases } from "#lib/changelog.js";

	const description =
		"Every @heyramzi/ui release, newest first: breaking changes, new parts and fixes.";
</script>

<svelte:head
	><title>Changelog | heyramzi/ui</title><meta
		name="description"
		content={description}
	/></svelte:head
>

<article class="max-w-3xl py-12">
	<h1 class="text-4xl font-semibold tracking-tight">Changelog</h1>
	<p class="mt-4 text-lg text-muted-foreground">{description}</p>

	{#each releases as release (release.id)}
		<section id={release.id} class="mt-16 scroll-mt-24">
			<h2 class="flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold tracking-tight">
				<a href="#{release.id}" class="hover:underline">{release.version}</a>
				{#if release.date}
					<time
						datetime={release.date}
						class="text-sm font-normal tracking-normal text-muted-foreground"
						>{formatDay(release.date)}</time
					>
				{/if}
			</h2>
			{#if release.body}
				<Response
					content={release.body}
					class="mt-4 text-sm leading-6 text-muted-foreground [&_a]:text-foreground [&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-foreground [&_li]:my-1.5 [&_ul]:ml-5"
				/>
			{/if}
		</section>
	{/each}
</article>
