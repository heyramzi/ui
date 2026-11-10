<script lang="ts" module>
	/** A type the part spreads onto its root and doesn't expand: a bits-ui part, HTML attributes. */
	export type ApiBase = { kind: string; label: string; from?: string; omit?: string[] };

	export type ApiProp = {
		name: string;
		type?: string;
		values?: string[];
		default?: string;
		bindable?: boolean;
		required?: boolean;
		description?: string;
	};

	/** One component file's table, as `scripts/component-api.ts` writes it. */
	export type ApiPart = {
		name: string;
		file: string;
		props: ApiProp[];
		bases: ApiBase[];
		untyped?: boolean;
	};

	/** The id a part's heading carries, shared with the page's contents list. */
	export const apiAnchor = (name: string) => `api-${name.toLowerCase().replaceAll(".", "-")}`;
</script>

<script lang="ts">
	import * as Table from "@heyramzi/ui/shadcn/table";
	import DocHeading from "#lib/DocHeading.svelte";

	let { parts }: { parts: ApiPart[] } = $props();

	const typeOf = (prop: ApiProp) => prop.values?.join(" | ") ?? prop.type;
</script>

<!-- The raw destructive red reads 3.7:1 on the page grey; mixed toward the ground it clears 4.5. -->
<section
	aria-labelledby="api"
	class="mt-14 [--required:color-mix(in_oklab,var(--destructive)_72%,black)] dark:[--required:color-mix(in_oklab,var(--destructive)_75%,white)]"
>
	<DocHeading id="api">API reference</DocHeading>
	{#each parts as part (part.file)}
		<div class="mt-6">
			{#if parts.length > 1}
				<DocHeading id={apiAnchor(part.name)} level={3} class="mb-3">{part.name}</DocHeading>
			{/if}
			<!-- A phone gets one row per prop, stacked: three columns in 390px put Default off-screen. -->
			<dl class="divide-y divide-border rounded-(--radius-xl) border border-border sm:hidden">
				{#each part.props as prop (prop.name)}
					<div class="px-4 py-3">
						<dt class="flex flex-wrap items-center gap-x-3 gap-y-1">
							<span class="flex items-center gap-1.5">
								<code class="font-mono text-[13px] font-medium">{prop.name}</code>
								{#if prop.required}
									<span class="text-xs font-medium text-(--required)">required</span>
								{/if}
								{#if prop.bindable}
									<span
										class="rounded-(--radius-sm) border border-border px-1.5 font-mono text-xs leading-5 text-muted-foreground"
										>bindable</span
									>
								{/if}
							</span>
							{#if typeOf(prop)}
								<code class="font-mono text-xs leading-5 text-foreground">{typeOf(prop)}</code>
							{:else if part.bases[0]}
								<code class="font-mono text-xs leading-5 text-muted-foreground"
									>{part.bases[0].label}</code
								>
							{/if}
						</dt>
						{#if prop.default !== undefined}
							<dd class="mt-1 text-xs text-muted-foreground">
								Default <code class="font-mono text-foreground">{prop.default}</code>
							</dd>
						{/if}
						{#if prop.description}
							<dd class="mt-1 text-xs leading-relaxed text-muted-foreground">{prop.description}</dd>
						{/if}
					</div>
				{/each}
				{#each part.bases as base (base.label)}
					<div class="px-4 py-3">
						<dt><code class="font-mono text-[13px] text-muted-foreground">...rest</code></dt>
						<dd class="mt-1 text-xs text-muted-foreground">
							Every prop of <code class="font-mono text-foreground">{base.label}</code>
							{#if base.from}from <code class="font-mono">{base.from}</code>{/if}
							{#if base.omit}except <code class="font-mono">{base.omit.join(", ")}</code>{/if}
						</dd>
					</div>
				{/each}
			</dl>
			<div class="overflow-hidden rounded-(--radius-xl) border border-border max-sm:hidden">
				<Table.Root class="min-w-[40rem]">
					<Table.Header class="border-b border-border bg-muted/40">
						<Table.Row class="hover:bg-transparent">
							<Table.Head class="w-[32%] pl-4">Prop</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head class="w-[18%] pr-4">Default</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each part.props as prop (prop.name)}
							<Table.Row class="border-b border-border last:border-0">
								<Table.Cell wrap class="py-3 pl-4 align-top">
									<span class="flex min-h-5 flex-wrap items-center gap-1.5">
										<code class="font-mono text-[13px] font-medium">{prop.name}</code>
										{#if prop.required}
											<span class="text-xs font-medium text-(--required)">required</span>
										{/if}
										{#if prop.bindable}
											<span
												class="rounded-(--radius-sm) border border-border px-1.5 font-mono text-xs leading-5 text-muted-foreground"
												>bindable</span
											>
										{/if}
									</span>
									{#if prop.description}
										<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
											{prop.description}
										</p>
									{/if}
								</Table.Cell>
								<Table.Cell wrap class="py-3 align-top">
									{#if typeOf(prop)}
										<code class="font-mono text-xs leading-5 text-foreground">{typeOf(prop)}</code>
									{:else if part.bases[0]}
										<code class="font-mono text-xs leading-5 text-muted-foreground"
											>{part.bases[0].label}</code
										>
									{/if}
								</Table.Cell>
								<Table.Cell wrap class="py-3 pr-4 align-top">
									{#if prop.default !== undefined}
										<code class="font-mono text-xs leading-5 text-foreground">{prop.default}</code>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
						{#each part.bases as base (base.label)}
							<Table.Row class="border-b border-border last:border-0">
								<Table.Cell class="py-3 pl-4 align-top">
									<code class="font-mono text-[13px] text-muted-foreground">...rest</code>
								</Table.Cell>
								<Table.Cell
									wrap
									colspan={2}
									class="py-3 pr-4 align-top text-xs text-muted-foreground"
								>
									Every prop of <code class="font-mono text-foreground">{base.label}</code>
									{#if base.from}from <code class="font-mono">{base.from}</code>{/if}
									{#if base.omit}except <code class="font-mono">{base.omit.join(", ")}</code>{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	{/each}
</section>
