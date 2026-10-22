<script lang="ts">
  import Demo from "@heyramzi/ui/onboarding/demo.svelte";
  import PackagePage from "#lib/PackagePage.svelte";
</script>

<PackagePage title="Page tour" from="@heyramzi/ui/onboarding" blurb="A lit element and a short card per step, shown once per page, with replay and a bottom sheet on a phone.">
  <Demo />
</PackagePage>
