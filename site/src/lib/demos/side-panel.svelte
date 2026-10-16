<script lang="ts">
  import { SidePanel } from "@heyramzi/tasks";
  import { Button } from "@heyramzi/ui/shadcn/button";
  import type { OpenInTool } from "@heyramzi/ui/components/open-in";
  import { GithubLogo } from "phosphor-svelte";

  const github: OpenInTool = { name: "GitHub", action: "Open on GitHub", icon: GithubLogo };

  let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open the panel</Button>

<SidePanel
  bind:open
  title="Write the pricing page"
  description="Ada, due Friday"
  badges={[{ label: "In review", tone: "warning" }]}
  openIn={[{ tool: github, href: "https://github.com/heyramzi/ui", label: "Open the issue on GitHub" }]}
  handoff={{ value: () => "Draft the pricing page copy for the three plans.", label: "Copy a prompt", copiedLabel: "Prompt copied" }}
  stats={[
    { label: "Logged", value: "6h 30m", sub: "of 8h" },
    { label: "Open comments", value: "0", tone: "good" },
  ]}
>
  <p class="text-sm text-muted-foreground">The body scrolls under the header. Put the record's fields here.</p>
</SidePanel>
