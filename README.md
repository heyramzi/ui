# heyramzi/ui

Svelte 5 components for our product teams. SvelteKit first, no React ports.

**Website and live gallery: [ui.heyramzi.com](https://ui.heyramzi.com)**. Every component runs there, with its source one click away.

| Package | What it is |
| --- | --- |
| `@heyramzi/ui` | The kit on [ui.heyramzi.com](https://ui.heyramzi.com): tokens and theming, shadcn primitives, effects, charts on [LayerChart](https://layerchart.com), and blocks (chat, agents, work, editor, onboarding, slides, canvas) at subpaths such as `@heyramzi/ui/charts` and `@heyramzi/ui/work` |
| `@heyramzi/marketing` | Brand tokens and testimonial surfaces |
| `@heyramzi/review` | The review page, mounted anywhere |

Run the site: `pnpm install && pnpm --filter site dev`.

We build these for our own apps first. Issues and pull requests are welcome, but there's no support promise and majors move fast.

The shadcn primitives in `@heyramzi/ui` start from [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte) (MIT).

## License

[MIT](LICENSE)

## Releasing

Releases run from the Mac, for `ui`, `marketing` and `review`. Charts, tasks (now `work`), slides and the agents moved into `@heyramzi/ui` as subpaths.

Release steps:

1. Commit with [Conventional Commits](https://www.conventionalcommits.org): `feat(tasks): ...`, `fix(ui): ...`. A `feat` bumps the minor, a `fix` the patch, and `feat!` the major.
2. Push to `main`, then run `pnpm release` (or `DRY_RUN=1 pnpm release` to preview). For each package with changes since its last tag, the script bumps the version from the commit types, writes the `CHANGELOG.md` entry, commits the bumps, tags `<name>-v<version>`, creates the GitHub release and publishes to npmjs and to GitHub Packages. Both tokens come from `~/.npmrc`.

The commit that moves the charts out of `ui` has to read `feat(charts)!: ...` (the `!` is what the script sees; a `BREAKING CHANGE` footer isn't), so `ui` goes to the next major and `charts` starts at 1.0.0. To force it, run `BUMP="ui=major charts=major" pnpm release`.

Install from npm:

```
pnpm add @heyramzi/ui
```

Our own apps map the whole `@heyramzi` scope to GitHub Packages for private packages, so they keep installing these from there. Same versions, both registries.

The website ships to ui.heyramzi.com on Cloudflare at the end of every `pnpm release`, so the version in its nav is the one on npm. By hand: `cd site && pnpm run deploy`. It's public: the Worker only serves the built assets.
