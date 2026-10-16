<script lang="ts">
  import { AgentAvatar } from "@heyramzi/agents";

  const crew = [
    { name: "Ada", role: "Researcher", shape: "clover", color: "#41C4FF" },
    { name: "Bo", role: "Analyst", shape: "flower", color: "#A78BFA" },
    { name: "Cy", role: "Planner", shape: "mech", color: "#34D399" },
    { name: "Dia", role: "Scheduler", shape: "droid", color: "#FBBF24" },
  ] as const;
</script>

<div class="flex items-end justify-center gap-4">
  {#each crew as member (member.name)}
    <div class="flex w-20 flex-col items-center gap-1.5">
      <AgentAvatar name={member.name} role={member.role} shape={member.shape} color={member.color} state="working" />
      <p class="text-xs font-medium">{member.name}</p>
      <p class="text-[11px] text-muted-foreground">{member.role}</p>
    </div>
  {/each}
</div>
