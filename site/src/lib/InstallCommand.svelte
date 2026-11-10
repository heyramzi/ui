<script lang="ts" module>
	const managers = [
		{ value: "pnpm", label: "pnpm", add: "pnpm add" },
		{ value: "npm", label: "npm", add: "npm install" },
		{ value: "bun", label: "bun", add: "bun add" },
		{ value: "yarn", label: "yarn", add: "yarn add" },
	] as const;
	type Manager = (typeof managers)[number]["value"];

	const key = "docs:package-manager";

	// Storage throws in a private window or with site data blocked; the pick then lasts the visit.
	function stored(): Manager {
		try {
			const value = localStorage.getItem(key);
			return managers.some((m) => m.value === value) ? (value as Manager) : "pnpm";
		} catch {
			return "pnpm";
		}
	}
</script>

<script lang="ts">
	import { SegmentedFilter } from "@heyramzi/ui/components/segmented";
	import CodeSnippet from "#lib/CodeSnippet.svelte";

	let { packages }: { packages: string } = $props();

	let manager = $state<Manager>("pnpm");
	$effect.pre(() => {
		manager = stored();
	});

	function pick(next: Manager) {
		manager = next;
		try {
			localStorage.setItem(key, next);
		} catch {
			// Kept in memory only.
		}
	}

	const command = $derived(`${managers.find((m) => m.value === manager)?.add} ${packages}`);
</script>

<CodeSnippet code={command} label="Copy install command">
	{#snippet header()}
		<SegmentedFilter
			options={managers}
			value={manager}
			onValueChange={pick}
			ariaLabel="Package manager"
			block={false}
		/>
	{/snippet}
</CodeSnippet>
