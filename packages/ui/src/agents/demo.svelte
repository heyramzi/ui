<script lang="ts">
  import AgentAvatar from './agent-avatar.svelte';
  import AgentCast from './agent-cast.svelte';
  import type { Agent } from './types';

  const cast: Agent[] = [
    { id: 'ada', name: 'Ada', role: 'Researcher', shape: 'clover', color: '#41C4FF', group: 'Research' },
    { id: 'bo', name: 'Bo', role: 'Analyst', shape: 'flower', group: 'Research' },
    { id: 'cy', name: 'Cy', role: 'Planner', shape: 'mech', group: 'Planning' },
    { id: 'dia', name: 'Dia', role: 'Scheduler', shape: 'droid', group: 'Planning' },
    { id: 'eli', name: 'Eli', role: 'Writer', shape: 'cat', group: 'Craft' },
    { id: 'fen', name: 'Fen', role: 'Editor', shape: 'pill', group: 'Craft' },
    { id: 'gus', name: 'Gus', role: 'Runner', shape: 'ghost', group: 'Craft' },
    { id: 'hal', name: 'Hal', role: 'Watcher', shape: 'star', group: 'Craft' },
  ];

  let selected = $state<string | null>('ada');
  let lead = $derived(cast.find((agent) => agent.id === selected) ?? cast[0]);
</script>

<div class="demo">
  <header class="demo__hero">
    <div class="demo__portrait">
      <AgentAvatar
        name={lead.name}
        role={lead.role}
        shape={lead.shape}
        color={lead.color}
        state="working"
        theme="light"
      />
    </div>
    <div class="demo__intro">
      <p class="demo__eyebrow">AgentCast</p>
      <h1 class="demo__title">{lead.name}</h1>
      <p class="demo__role">{lead.role}</p>
    </div>
  </header>

  <AgentCast agents={cast} selectedId={selected} onSelect={(agent) => (selected = agent.id ?? agent.name)} />
</div>

<style>
  .demo {
    max-width: 56rem;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: #18181b;
    background: #fafafa;
  }
  .demo__hero {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }
  .demo__portrait {
    flex: none;
    width: 9rem;
  }
  .demo__eyebrow {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #71717a;
  }
  .demo__title {
    margin: 0.25rem 0 0;
    font-size: 2.25rem;
    letter-spacing: -0.03em;
  }
  .demo__role {
    margin: 0.25rem 0 0;
    color: #52525b;
  }
</style>
