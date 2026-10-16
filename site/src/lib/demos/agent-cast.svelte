<script lang="ts">
  import { AgentCast, type Agent } from "@heyramzi/ui/agents";

  const cast: Agent[] = [
    { id: "ada", name: "Ada", role: "Researcher", shape: "clover", color: "#41C4FF", group: "Research" },
    { id: "bo", name: "Bo", role: "Analyst", shape: "flower", group: "Research" },
    { id: "cy", name: "Cy", role: "Planner", shape: "mech", group: "Planning" },
    { id: "dia", name: "Dia", role: "Scheduler", shape: "droid", group: "Planning" },
  ];

  let selected = $state<string | null>("ada");
</script>

<div class="w-full max-w-md">
  <AgentCast agents={cast} selectedId={selected} onSelect={(a) => (selected = a.id ?? a.name)} />
</div>
