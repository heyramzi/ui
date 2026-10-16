# heyramzi/ui

Svelte 5 components for our product teams. SvelteKit first, no React ports.

**Website and live gallery: [ui.heyramzi.com](https://ui.heyramzi.com)**. Every component runs there, with its source one click away.

| Package | What it is |
| --- | --- |
| `@heyramzi/ui` | Charts, shadcn primitives, effects, animations, chat and AI surfaces, and bot avatars at `@heyramzi/ui/agents` (inspired by [bot-avatars](https://github.com/jakubantalik/bot-avatars)) |
| `@heyramzi/tasks` | One set of tasks as a drag-and-drop board, a grouped list or a gantt timeline, plus status badges, dots and icons from one config. Was `@heyramzi/board` |
| `@heyramzi/marketing` | Brand tokens and testimonial surfaces |
| `@heyramzi/review` | The review page, mounted anywhere |
| `@heyramzi/slides` | Keyboard and swipe slide decks, with a print stylesheet |

Run the site: `pnpm install && pnpm --filter site dev`.

We build these for our own apps first. Issues and pull requests are welcome, but there's no support promise and majors move fast.

The shadcn primitives in `@heyramzi/ui` start from [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte) (MIT).

## License

[MIT](LICENSE)

## Releasing

Releases run from the Mac, for `ui`, `tasks` and `marketing` only. `slides` and `review` aren't published yet: use them from a clone. `@heyramzi/agents` moved into `@heyramzi/ui/agents`.

Release steps:

1. Commit with [Conventional Commits](https://www.conventionalcommits.org): `feat(tasks): ...`, `fix(ui): ...`. A `feat` bumps the minor, a `fix` the patch, and `feat!` the major.
2. Push to `main`, then run `pnpm release` (or `DRY_RUN=1 pnpm release` to preview). For each package with changes since its last tag, the script bumps the version from the commit types, writes the `CHANGELOG.md` entry, commits the bumps, tags `<name>-v<version>`, creates the GitHub release and publishes to npmjs and to GitHub Packages. Both tokens come from `~/.npmrc`.

Install from npm:

```
pnpm add @heyramzi/ui
```

Our own apps map the whole `@heyramzi` scope to GitHub Packages for private packages, so they keep installing these from there. Same versions, both registries.

The website ships to ui.heyramzi.com on Cloudflare with `cd site && pnpm exec wrangler deploy`. It's public: the Worker only serves the built assets.
