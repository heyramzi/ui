#!/usr/bin/env bash
# Releases from the Mac to GitHub Packages and npmjs. The pack reads the working tree, so
# ONLY="ui" releases that package alone, holding back any with another session's work.
set -euo pipefail
cd "$(dirname "$0")/.."

# prepack builds with ../vibe-kit, so a checkout outside ~/Studio tags and pushes, then packs nothing.
if [ ! -d ../vibe-kit ]; then
  echo "release: no ../vibe-kit beside this checkout. Use a worktree under ~/Studio: git worktree add ../.ui-release-\$\$ origin/main" >&2
  exit 1
fi

DRY_RUN="${DRY_RUN:-0}"
TODAY=$(date +%Y-%m-%d)
NOTES_DIR=$(mktemp -d)

# component -> package dir. work, charts, slides, the editor, onboarding and the canvas ship
# inside ui as subpaths.
COMPONENTS="ui packages/ui
marketing packages/marketing
review packages/review"

plan=""
while read -r component dir; do
  [ -n "$component" ] || continue
  if [ -n "${ONLY:-}" ] && [[ " $ONLY " != *" $component "* ]]; then
    continue
  fi
  version=$(node -p "require('./$dir/package.json').version")
  tag="$component-v$version"
  if git rev-parse "$tag" >/dev/null 2>&1; then
    range="$tag..HEAD"
    first_release=0
  elif [ -n "$(git tag -l "$component-v*")" ]; then
    echo "release: $component has tags but none for $version. Put $tag on the release commit first." >&2
    exit 1
  else
    range="HEAD"
    first_release=1
  fi
  subjects=$(git log "$range" --format=%s -- "$dir" || true)
  untracked=0
  if [ -z "$subjects" ] && [ "$first_release" = "1" ] && [ -n "$(git status --porcelain -- "$dir")" ]; then
    # Never committed here, so no log range sees it: first publish from this repo.
    untracked=1
  fi
  if [ -z "$subjects" ] && [ "$untracked" = "0" ]; then
    continue
  fi

  # A breaking change is a minor too: only a Release-As footer cuts a major.
  bump="patch"
  if printf '%s\n' "$subjects" | grep -qE '^[a-z]+(\(.+\))?!:|BREAKING CHANGE|^feat(\(.+\))?:'; then
    bump="minor"
  fi
  # A removal committed as refactor: reads as a patch, and every app's ^range
  # would install it. BUMP="ui=minor" says what the log can't.
  for override in ${BUMP:-}; do
    if [ "${override%%=*}" = "$component" ]; then
      bump="${override#*=}"
    fi
  done
  if [ "$bump" != "patch" ] && [ "$bump" != "minor" ]; then
    echo "release: $component bump '$bump' is not allowed. Only a Release-As: X.0.0 footer cuts a major." >&2
    exit 1
  fi
  release_as=$(git log "$range" --format=%B -- "$dir" | sed -n 's/^[Rr]elease-[Aa]s: *\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\) *$/\1/p' | head -1)
  next=$(node -e "
    const [M, m, p] = '$version'.split('.').map(Number);
    const b = '$bump';
    console.log(b === 'minor' ? M + '.' + (m + 1) + '.0' : M + '.' + m + '.' + (p + 1));
  ")
  if [ -n "$release_as" ]; then
    next="$release_as"
    bump="release-as"
  fi
  # A removed export path breaks every app that imports it, so it ships only in a major.
  if [ "$first_release" = "0" ]; then
    removed=$(git show "$tag:$dir/package.json" | node -e "
      const before = Object.keys(JSON.parse(require('fs').readFileSync(0, 'utf8')).exports ?? {});
      const after = new Set(Object.keys(require('./$dir/package.json').exports ?? {}));
      console.log(before.filter((key) => !after.has(key)).join(' '));
    ")
    if [ -n "$removed" ] && [ "${next%%.*}" = "${version%%.*}" ]; then
      echo "release: $component $next drops export paths that $version had: $removed" >&2
      echo "release: that's a breaking change. Cut a major with a Release-As: $(( ${version%%.*} + 1 )).0.0 footer on a commit in $dir." >&2
      exit 1
    fi
  fi
  # A package's first publish is 1.0.0, whatever its commits say.
  if [ "$first_release" = "1" ] || [ "$untracked" = "1" ]; then
    next="1.0.0"
    bump="first"
  fi
  plan="$plan$component $dir $version $next $bump $first_release
"
done <<< "$COMPONENTS"

if [ -z "$plan" ]; then
  echo "release: nothing changed since the last tags."
  exit 0
fi

# The pack reads the working tree, so a package with uncommitted work would ship another session's
# half-done edits. Release from your own clean worktree: a shared name gets removed by the next session.
dirty=$(printf '%s' "$plan" | while read -r component dir version next bump first_release; do
  if [ "$bump" != "first" ] && [ -n "$(git status --porcelain -- "$dir")" ]; then echo "$dir"; fi
done)
if [ -n "$dirty" ]; then
  echo "release: uncommitted changes in $(echo $dirty). Run it from your own clean worktree: git worktree add ../.ui-release-\$\$ origin/main" >&2
  exit 1
fi

echo "release plan:"
printf '%s' "$plan" | while read -r component dir version next bump first_release; do
  echo "  $component: $version -> $next ($bump)"
done

if [ "$DRY_RUN" = "1" ]; then
  echo "release: dry run, stopping."
  exit 0
fi

# Gate before the bump: a failure after it leaves a local release commit, and a rerun then reads
# the new version as never tagged. SKIP_VERIFY=1 is for a rerun that already passed.
if [ "${SKIP_VERIFY:-0}" = "1" ]; then
  echo "release: SKIP_VERIFY=1, not running pnpm verify or the gallery suite." >&2
else
  FULL_CHECK=1 pnpm verify
  # Every site page in both widths and themes: console errors and axe. Pixels compare in CI only.
  FULL_CHECK=1 pnpm test:gallery
fi

printf '%s' "$plan" | while read -r component dir version next bump first_release; do
  node -e "
    const fs = require('fs');
    const p = './$dir/package.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.version = '$next';
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  "
  if [ "$first_release" = "1" ]; then
    log_range="HEAD"
  else
    log_range="$component-v$version..HEAD"
  fi
  feats=$(git log "$log_range" --format='* %s' -- "$dir" | grep -E '^\* feat' || true)
  fixes=$(git log "$log_range" --format='* %s' -- "$dir" | grep -E '^\* fix' || true)
  perfs=$(git log "$log_range" --format='* %s' -- "$dir" | grep -E '^\* perf' || true)
  others=""
  # A patch of only perf, refactor or chore commits isn't a first publish: 2.22.1 nearly said so.
  if [ -z "$feats" ] && [ -z "$fixes" ] && [ -z "$perfs" ]; then
    if [ "$first_release" = "1" ]; then
      feats="* initial publish from this repo"
    else
      others=$(git log "$log_range" --format='* %s' -- "$dir")
    fi
  fi
  {
    echo "## [$next](https://github.com/heyramzi/ui/compare/$component-v$version...$component-v$next) ($TODAY)"
    echo ""
    # Hand-written notes for this release (breaking changes, the codemod) sit in NEXT.md until it ships.
    if [ -f "$dir/NEXT.md" ]; then
      cat "$dir/NEXT.md"
      echo ""
    fi
    if [ -n "$feats" ]; then
      echo "### Features"
      echo ""
      printf '%s\n' "$feats"
      echo ""
    fi
    if [ -n "$fixes" ]; then
      echo "### Bug Fixes"
      echo ""
      printf '%s\n' "$fixes"
      echo ""
    fi
    if [ -n "$perfs" ]; then
      echo "### Performance"
      echo ""
      printf '%s\n' "$perfs"
      echo ""
    fi
    if [ -n "$others" ]; then
      echo "### Changes"
      echo ""
      printf '%s\n' "$others"
      echo ""
    fi
  } > "$NOTES_DIR/$component.md"
  node -e "
    const fs = require('fs');
    const p = './$dir/CHANGELOG.md';
    const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '# Changelog\n';
    const notes = fs.readFileSync('$NOTES_DIR/$component.md', 'utf8').trimEnd();
    // Newest first: the entry goes above the first release heading, never at the end.
    const at = cur.search(/^## /m);
    const head = (at === -1 ? cur : cur.slice(0, at)).trimEnd();
    const rest = at === -1 ? '' : '\n\n' + cur.slice(at);
    fs.writeFileSync(p, head + '\n\n' + notes + '\n' + rest);
  "
  rm -f "$dir/NEXT.md"
done

# Only the files this script wrote: other sessions leave uncommitted or staged work in packages/.
release_files=()
while read -r component dir version next bump first_release; do
  [ -n "$dir" ] || continue
  release_files+=("$dir/package.json" "$dir/CHANGELOG.md")
  # Staging the path records NEXT.md's removal when this release used one.
  if git ls-files --error-unmatch "$dir/NEXT.md" >/dev/null 2>&1; then
    release_files+=("$dir/NEXT.md")
  fi
done <<< "$plan"
git add -- "${release_files[@]}"
targets=$(printf '%s' "$plan" | while read -r component dir version next bump first_release; do printf '%s-v%s, ' "$component" "$next"; done)
targets=${targets%, }
git commit -m "chore: release ${targets}" -- "${release_files[@]}"
# HEAD:main, so a release from a detached clean worktree pushes too.
git push origin HEAD:main

# This repo's .npmrc maps the @heyramzi scope, and pnpm 12 lets that beat --registry, so pack
# once into $2 and npm-publish the tarball from outside the repo.
# Publishes with the gh token: ~/.npmrc's GitHub Packages token lacks write:packages and got a
# 403 on 2.15.0 (2 Nov 2026). A 0600 npmrc in the pack folder keeps it off the command line.
publish_github() {
  local tgz rc="$2/.npmrc-publish"
  (cd "$1" && pnpm pack --pack-destination "$2" >/dev/null)
  tgz=$(ls "$2"/*.tgz)
  (umask 077 && printf '//npm.pkg.github.com/:_authToken=%s\n' "$(gh auth token)" > "$rc")
  (cd "$2" && NPM_CONFIG_USERCONFIG="$rc" npm publish "$tgz" --access public \
    --registry=https://npm.pkg.github.com/ "--@heyramzi:registry=https://npm.pkg.github.com/")
}

# Vite can't resolve a package's own #src imports inside node_modules, so rewrite them for the
# pack and restore only the touched files, keeping other sessions' edits.
pack_rewritten() {
  local backup status=0
  backup=$(mktemp -d)
  node scripts/relative-imports.mjs "$backup" "$1"
  publish_github "$1" "$2" || status=$?
  node scripts/relative-imports.mjs --restore "$backup"
  rm -rf "${backup:?}"
  return "$status"
}

# npmjs gets the same tarball from this Mac, with the npm token `heyramzi-publish` in ~/.npmrc
# (write on @heyramzi, bypasses 2FA, expires 7 Jan 2027). Until 10 Nov 2026 a hosted workflow
# published it with npm trusted publishing, but GitHub refuses hosted jobs on this account and npm
# trusts no self-hosted runner. A version already on npmjs is skipped, so a rerun is safe.
# NPMJS_DRY_RUN=1 makes it a dry run. </dev/null: npm in a `while read` loop eats its stdin.
publish_npmjs() {
  local tgz=$1 id npmjs=https://registry.npmjs.org/
  id=$(tar -xOzf "$tgz" package/package.json | node -p 'const j = JSON.parse(require("fs").readFileSync(0, "utf8")); j.name + "@" + j.version')
  # The scope flag too: without it the repo's .npmrc sends the lookup to GitHub Packages, which
  # just got this version, so 3.3.0 and 3.3.1 read "already on npmjs" and were never sent there.
  if [ -z "${NPMJS_DRY_RUN:-}" ] && npm view "$id" version --registry="$npmjs" "--@heyramzi:registry=$npmjs" </dev/null >/dev/null 2>&1; then
    echo "$id already on npmjs"
    return
  fi
  (cd "$(dirname "$tgz")" && npm publish "$tgz" ${NPMJS_DRY_RUN:+--dry-run} --access public \
    --registry="$npmjs" "--@heyramzi:registry=$npmjs" </dev/null) || {
    echo "release: npmjs refused $id. Check \`npm whoami --registry=$npmjs\` and the token's expiry (\`npm token list\`), then rerun: npm publish <tarball from the $id GitHub release> --access public --registry=$npmjs" >&2
    return 1
  }
}

# The build can't run in CI because it calls vibe-kit's build-dist.mjs, and vibe-kit is private.
printf '%s' "$plan" | while read -r component dir version next bump first_release; do
  tag="$component-v$next"
  out=$(mktemp -d)
  git tag "$tag"
  git push origin "$tag"
  pack_rewritten "$dir" "$out"
  gh release create "$tag" "$out"/*.tgz --repo heyramzi/ui --title "$tag" \
    --notes-file "$NOTES_DIR/$component.md"
  publish_npmjs "$(ls "$out"/*.tgz)"
  rm -rf "${out:?}"
done

rm -rf "$NOTES_DIR"
# The site's nav shows the ui version, so every release ships it too.
(cd site && pnpm run deploy)

echo "release: done."
