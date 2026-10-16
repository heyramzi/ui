# @heyramzi/agents

Bot avatars and a cast grid for Svelte 5. An agent is a name, a role, a shape and a colour. The avatar draws an eyes-only face on a soft body, with no box around it, and animates idle turns, blinks and jumps.

## Install

Copy `src/` into your project. The package has no dependencies beyond Svelte 5.

```bash
pnpm add @heyramzi/agents
```

## Usage

```svelte
<script>
  import { AgentAvatar, AgentCast } from '@heyramzi/agents';

  const cast = [
    { id: 'ada', name: 'Ada', role: 'Researcher', shape: 'clover', color: '#41C4FF' },
    { id: 'bo', name: 'Bo', role: 'Analyst', shape: 'flower' }
  ];
</script>

<div style="width: 6rem;">
  <AgentAvatar name="Ada" role="Researcher" shape="clover" color="#41C4FF" />
</div>

<AgentCast agents={cast} onSelect={(agent) => console.log(agent.name)} />
```

## AgentAvatar

`name`, `role`, `shape` and `color` are the plain props. The face is eyes only, the ink is `#1E1A33`, and the body carries no border or background. With no `size`, the avatar fills 75% of its slot, which leaves an idle jump room so it never clips. Give the slot a width and a square aspect ratio.

Every prop from the underlying bot engine is available too: `state` (`default`, `working`, `sleeping`), `shading` (`fabric` by default, plus `plastic`, `crisp`, `smooth`, `flat`), `paused`, `speed`, `theme`, `turn`, the fur controls, the jump controls, hats, glasses, headphones and a bow tie. `size` is a pixel number when you want to fix it.

## AgentCast

`agents` is a list of `{ id?, name, role?, shape?, color?, group? }`. Cards render in a responsive grid. Add `group` to any agent and the cast splits into headed sections. `selectedId` marks the current card, `onSelect(agent)` fires on a pick, and `avatarProps` forwards extra options to every avatar.

```svelte
<AgentCast
  agents={cast}
  selectedId={active}
  minColumn="10rem"
  showRole
  avatarProps={{ state: 'working', theme: 'light' }}
  onSelect={(agent) => (active = agent.id)}
/>
```

The cast grid reads Tailwind v4 style tokens when they are present: `--color-foreground`, `--color-card`, `--color-border`, `--color-muted-foreground`, `--color-accent` and `--color-ring`. Without them it falls back to neutral defaults, so it works on its own.

## Themes

`theme="light"` or `"dark"` fixes the surface the avatar is lit against. `"auto"` (the default) reads an ancestor `data-theme` attribute or a `dark` / `light` class, then falls back to the system preference.

## Demo

`src/demo.svelte` is the page the site imports. It shows a large working avatar and a grouped cast you can pick from.

## Credit

Inspired by Jakub Antalik's bot avatars in [Libraries.dev](https://github.com/Jakubantalik/Libraries.dev) (MIT). The vendored engine under `src/vendor/` ships its own `LICENSE`.
