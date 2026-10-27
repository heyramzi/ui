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

1. Commit with [Conventional Commits](https://www.conventionalcommits.org): `feat(work): ...`, `fix(ui): ...`. A `feat` or a breaking change bumps the minor, anything else the patch. Only a `Release-As: 3.0.0` footer cuts a major. A removal committed as `refactor:` would ship as a patch, so say so with `BUMP="ui=minor" pnpm release`.
2. Push to `main`, then run `pnpm release` (or `DRY_RUN=1 pnpm release` to preview). For each package with changes since its last tag, the script bumps the version, writes the `CHANGELOG.md` entry, commits the bumps, tags `<name>-v<version>`, publishes to GitHub Packages and creates the GitHub release with the packed tarball attached.
3. The release starts `.github/workflows/publish-npmjs.yml`, which publishes that same tarball to npmjs with npm trusted publishing. No npm token is involved. The GitHub Packages token is the one in `~/.npmrc`.

Install from npm:

```
pnpm add @heyramzi/ui
```

Our own apps map the whole `@heyramzi` scope to GitHub Packages for private packages, so they keep installing these from there. Same versions, both registries.

The website ships to ui.heyramzi.com on Cloudflare at the end of every `pnpm release`, so the version in its nav is the one on npm. By hand: `cd site && pnpm run deploy`. It's public: the Worker only serves the built assets.
