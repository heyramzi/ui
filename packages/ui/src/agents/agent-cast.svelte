<script lang="ts">
  import AgentAvatar from './agent-avatar.svelte';
  import type { Agent, AgentState } from './types';

  type Props = {
    /** The cast to lay out. */
    agents: Agent[];
    /** Selected agent id, when the cast is a picker. */
    selectedId?: string | null;
    /** Called with the agent that was picked. */
    onSelect?: (agent: Agent) => void;
    /** Hide the role line under each name. */
    showRole?: boolean;
    /** Extra props forwarded to every `<AgentAvatar>`. */
    avatarProps?: Record<string, unknown>;
    /** Minimum card width, any CSS length. Controls the column count. */
    minColumn?: string;
    class?: string;
    style?: string;
  };

  let {
    agents,
    selectedId = null,
    onSelect,
    showRole = true,
    avatarProps = {},
    minColumn = '8.5rem',
    class: className,
    style,
  }: Props = $props();

  const keyOf = (agent: Agent) => agent.id ?? agent.name;

  /* The card under the pointer or focus wakes up and works; the rest idle.
     A `state` in avatarProps wins. */
  let awake = $state<string | null>(null);
  const stateFor = (id: string) =>
    (avatarProps.state as AgentState | undefined) ?? (awake === id ? 'working' : 'default');

  /* Group when any agent asks for one, otherwise a single flat grid. */
  const sections = $derived.by(() => {
    const anyGroup = agents.some((agent) => agent.group);
    if (!anyGroup) return [{ label: '', items: agents }];
    const order: string[] = [];
    const byGroup = new Map<string, Agent[]>();
    for (const agent of agents) {
      const label = agent.group ?? '';
      let list = byGroup.get(label);
      if (!list) {
        list = [];
        byGroup.set(label, list);
        order.push(label);
      }
      list.push(agent);
    }
    return order.map((label) => ({ label, items: byGroup.get(label) ?? [] }));
  });

  const rootStyle = $derived(
    `--agent-cast-min:${minColumn};${style ?? ''}`,
  );
</script>

<div
  class={className ? `agent-cast ${className}` : 'agent-cast'}
  style={rootStyle}
>
  {#each sections as section, s (section.label || `flat-${s}`)}
    <section class="agent-cast__section">
      {#if section.label}
        <h3 class="agent-cast__heading">{section.label}</h3>
      {/if}
      <ul class="agent-cast__grid">
        {#each section.items as agent (keyOf(agent))}
          {@const id = keyOf(agent)}
          <li>
            <button
              type="button"
              class="agent-cast__card"
              aria-pressed={onSelect ? id === selectedId : undefined}
              onclick={() => onSelect?.(agent)}
              onpointerenter={() => (awake = id)}
              onpointerleave={() => awake === id && (awake = null)}
              onfocus={() => (awake = id)}
              onblur={() => awake === id && (awake = null)}
            >
              <span class="agent-cast__slot">
                <AgentAvatar
                  name={agent.name}
                  role={agent.role}
                  shape={agent.shape ?? 'clover'}
                  color={agent.color}
                  aria-hidden
                  {...avatarProps}
                  state={stateFor(id)}
                />
              </span>
              <span class="agent-cast__meta">
                <span class="agent-cast__name">{agent.name}</span>
                {#if showRole && agent.role}
                  <span class="agent-cast__role">{agent.role}</span>
                {/if}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

<style>
  .agent-cast {
    width: 100%;
    color: var(--color-foreground, #18181b);
  }
  .agent-cast__section + .agent-cast__section {
    margin-top: 2rem;
  }
  .agent-cast__heading {
    margin: 0 0 0.75rem;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: -0.015em;
  }
  .agent-cast__grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fill, minmax(var(--agent-cast-min, 8.5rem), 1fr));
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .agent-cast__card {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    padding: 0;
    text-align: left;
    background: var(--color-card, #fff);
    border: 1px solid var(--color-border, #e4e4e7);
    border-radius: 0.75rem;
    cursor: pointer;
    transition:
      border-color var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
      transform var(--duration-quick, 150ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
  }
  @media (prefers-reduced-motion: reduce) {
    .agent-cast__card {
      transition: border-color var(--duration-quick, 150ms) linear;
    }
    .agent-cast__card:active {
      transform: none;
    }
  }
  @media (hover: hover) and (pointer: fine) {
    .agent-cast__card:hover {
      border-color: color-mix(in oklab, var(--color-foreground, #18181b) 25%, transparent);
    }
  }
  .agent-cast__card:active {
    transform: scale(0.985);
  }
  .agent-cast__card:focus-visible {
    outline: 2px solid var(--color-ring, #6366f1);
    outline-offset: 2px;
  }
  .agent-cast__card[aria-pressed='true'] {
    border-color: var(--color-accent, #6366f1);
    box-shadow: 0 0 0 1px var(--color-accent, #6366f1);
  }
  /* Room above the head, so a hop or a hat never meets the card's edge. */
  .agent-cast__slot {
    display: block;
    width: 100%;
    padding: 0.5rem 0.5rem 0;
  }
  .agent-cast__meta {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.625rem;
  }
  .agent-cast__name {
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.2;
  }
  .agent-cast__role {
    font-size: 0.75rem;
    line-height: 1.3;
    color: var(--color-muted-foreground, #71717a);
  }
</style>
