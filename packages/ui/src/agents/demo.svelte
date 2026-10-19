<script lang="ts">
  import AgentAvatar from '#src/agents/agent-avatar.svelte';
  import AgentCast from '#src/agents/agent-cast.svelte';
  import type { Agent, AgentState } from '#src/agents/types.js';

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

  const states: { value: AgentState; label: string }[] = [
    { value: 'default', label: 'Idle' },
    { value: 'working', label: 'Working' },
    { value: 'sleeping', label: 'Sleeping' },
  ];

  let selected = $state<string | null>('ada');
  let leadState = $state<AgentState>('working');
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
        state={leadState}
      />
    </div>
    <div class="demo__intro">
      <p class="demo__eyebrow">AgentCast</p>
      <h1 class="demo__title">{lead.name}</h1>
      <p class="demo__role">{lead.role}</p>
      <div class="demo__states" role="radiogroup" aria-label="State">
        {#each states as s (s.value)}
          <button
            type="button"
            role="radio"
            aria-checked={leadState === s.value}
            onclick={() => (leadState = s.value)}
          >
            {s.label}
          </button>
        {/each}
      </div>
    </div>
  </header>

  <AgentCast agents={cast} selectedId={selected} onSelect={(agent) => (selected = agent.id ?? agent.name)} />
</div>

<style>
  .demo {
    max-width: 56rem;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    color: var(--color-foreground, #18181b);
    background: var(--color-background, #fafafa);
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
    color: var(--color-muted-foreground, #71717a);
  }
  .demo__title {
    margin: 0.25rem 0 0;
    font-size: 2.25rem;
    letter-spacing: -0.03em;
  }
  .demo__role {
    margin: 0.25rem 0 0;
    color: var(--color-muted-foreground, #52525b);
  }
  .demo__states {
    display: inline-flex;
    gap: 0.25rem;
    margin-top: 0.875rem;
    padding: 0.1875rem;
    border-radius: 0.625rem;
    background: color-mix(in oklab, var(--color-foreground, #18181b) 6%, transparent);
  }
  .demo__states button {
    padding: 0.3125rem 0.75rem;
    font: inherit;
    font-size: 0.8125rem;
    color: var(--color-muted-foreground, #71717a);
    background: transparent;
    border: 0;
    border-radius: 0.4375rem;
    cursor: pointer;
    transition:
      color var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
      background-color var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
  }
  .demo__states button[aria-checked='true'] {
    color: var(--color-foreground, #18181b);
    background: var(--color-card, #fff);
    box-shadow: var(--elev-hairline, 0 0 0 1px rgb(0 0 0 / 0.06));
  }
  .demo__states button:focus-visible {
    outline: 2px solid var(--color-ring, #6366f1);
    outline-offset: 1px;
  }
</style>
