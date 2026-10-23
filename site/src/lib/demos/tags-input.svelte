<script lang="ts">
	import { TagsInput } from "@heyramzi/ui/components/tags-input";

	const tools = ["Airtable", "Docusign", "Make", "QuickBooks", "SharePoint", "Supabase", "Zapier"];
	let used = $state(["Docusign", "SharePoint"]);
</script>

<div class="w-full max-w-sm">
	<TagsInput
		value={used}
		options={tools}
		label="Tools"
		labels={{ add: "Add a tool" }}
		onchange={(next) => {
			used = next;
		}}
	/>
</div>
