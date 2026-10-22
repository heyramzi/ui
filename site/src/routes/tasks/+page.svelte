<script lang="ts">
  import Demo from "@heyramzi/ui/tasks/demo.svelte";
  import DetailDemo from "@heyramzi/ui/tasks/detail-demo.svelte";
  import PackagePage from "#lib/PackagePage.svelte";
</script>

<PackagePage title="Task app" from="@heyramzi/ui/tasks" blurb="One set of tasks as a board, a list or a gantt, plus status badges, dots and icons from one config.">
  <Demo />
  <section class="mt-10 flex flex-col gap-3 border-t border-border pt-6">
    <h2 class="text-sm font-semibold">Task detail</h2>
    <DetailDemo />
  </section>
</PackagePage>
