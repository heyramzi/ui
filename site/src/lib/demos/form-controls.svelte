<script lang="ts">
  import { Input } from "@heyramzi/ui/shadcn/input";
  import { Label } from "@heyramzi/ui/shadcn/label";
  import { Switch } from "@heyramzi/ui/shadcn/switch";
  import { Checkbox } from "@heyramzi/ui/shadcn/checkbox";
  import { Progress } from "@heyramzi/ui/shadcn/progress";

  let notify = $state(true);
  let news = $state(false);
</script>

<div class="flex w-80 flex-col gap-5">
  <div class="flex flex-col gap-2">
    <Label for="fc-name">Display name</Label>
    <Input id="fc-name" placeholder="Alex Morgan" />
  </div>
  <div class="flex items-center justify-between">
    <Label for="fc-notify">Email notifications</Label>
    <Switch id="fc-notify" bind:checked={notify} />
  </div>
  <div class="flex items-center gap-2">
    <Checkbox id="fc-news" bind:checked={news} />
    <Label for="fc-news">Product news</Label>
  </div>
  <Progress value={64} />
</div>
