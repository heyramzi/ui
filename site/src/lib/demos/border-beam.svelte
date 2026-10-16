<script lang="ts">
  import { Button } from "@heyramzi/ui/shadcn/button";
  import BorderBeam from "@heyramzi/ui/effects/border-beam";
</script>

<BorderBeam class="w-80 rounded-xl">
  <div class="flex items-center justify-between rounded-xl bg-card p-5">
    <div>
      <p class="text-sm font-medium">Border beam</p>
      <p class="text-sm text-muted-foreground">An animated edge.</p>
    </div>
    <Button variant="outline" size="sm">Try it</Button>
  </div>
</BorderBeam>
