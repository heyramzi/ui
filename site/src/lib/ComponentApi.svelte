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
</script>

<script lang="ts">
	import * as Table from "@heyramzi/ui/shadcn/table";

	let { parts }: { parts: ApiPart[] } = $props();

	const anchor = (name: string) => `api-${name.toLowerCase().replaceAll(".", "-")}`;
	const typeOf = (prop: ApiProp) => prop.values?.join(" | ") ?? prop.type;
</script>

<section aria-labelledby="api" class="mt-12">
	<h2 id="api" class="text-2xl font-semibold tracking-tight">API</h2>
	{#each parts as part (part.file)}
		<div class="mt-6">
			{#if parts.length > 1}
				<h3 id={anchor(part.name)} class="mb-3 font-mono text-sm font-medium">{part.name}</h3>
			{/if}
			<div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
											<span class="text-xs text-destructive">required</span>
										{/if}
										{#if prop.bindable}
											<span
												class="rounded-md border border-border bg-muted/50 px-1.5 py-px font-mono text-[11px] text-muted-foreground"
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
										<code class="font-mono text-xs leading-5 text-foreground/80"
											>{typeOf(prop)}</code
										>
									{:else if part.bases[0]}
										<code class="font-mono text-xs leading-5 text-muted-foreground"
											>{part.bases[0].label}</code
										>
									{/if}
								</Table.Cell>
								<Table.Cell wrap class="py-3 pr-4 align-top">
									{#if prop.default !== undefined}
										<code class="font-mono text-xs leading-5 text-foreground/80"
											>{prop.default}</code
										>
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
									Every prop of <code class="font-mono text-foreground/80">{base.label}</code>
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
