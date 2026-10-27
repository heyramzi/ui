#!/usr/bin/env bash
# Releases from the Mac; CI only forwards the tarball to npmjs. The pack reads the working tree, so
# ONLY="ui" releases that package alone, holding back any with another session's work.
set -euo pipefail
cd "$(dirname "$0")/.."

DRY_RUN="${DRY_RUN:-0}"
TODAY=$(date +%Y-%m-%d)
NOTES_DIR=$(mktemp -d)

# component -> package dir. tasks, charts, slides, the editor, onboarding and the canvas ship
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
# half-done edits. Release from a clean checkout instead: git worktree add ../.ui-release origin/main.
dirty=$(printf '%s' "$plan" | while read -r component dir version next bump first_release; do
  if [ "$bump" != "first" ] && [ -n "$(git status --porcelain -- "$dir")" ]; then echo "$dir"; fi
done)
if [ -n "$dirty" ]; then
  echo "release: uncommitted changes in $(echo $dirty). Run it from a clean worktree of origin/main." >&2
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

# Run the push gate before the bump: a rejected push after it leaves a local
# release commit, and a rerun then reads the new version as never tagged.
if [ -x .git/hooks/pre-push ]; then
  .git/hooks/pre-push origin "$(git remote get-url origin)" </dev/null
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
  if [ -z "$feats" ] && [ -z "$fixes" ]; then
    feats="* initial publish from this repo"
  fi
  {
    echo "## [$next](https://github.com/heyramzi/ui/compare/$component-v$version...$component-v$next) ($TODAY)"
    echo ""
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
  } > "$NOTES_DIR/$component.md"
  node -e "
    const fs = require('fs');
    const p = './$dir/CHANGELOG.md';
    let cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '# Changelog\n';
    if (!cur.endsWith('\n')) cur += '\n';
    fs.writeFileSync(p, cur + '\n' + fs.readFileSync('$NOTES_DIR/$component.md', 'utf8'));
  "
done

# Only the files this script wrote: other sessions leave uncommitted or staged work in packages/.
release_files=()
while read -r component dir version next bump first_release; do
  [ -n "$dir" ] || continue
  release_files+=("$dir/package.json" "$dir/CHANGELOG.md")
done <<< "$plan"
git add -- "${release_files[@]}"
targets=$(printf '%s' "$plan" | while read -r component dir version next bump first_release; do printf '%s-v%s, ' "$component" "$next"; done)
targets=${targets%, }
git commit -m "chore: release ${targets}" -- "${release_files[@]}"
# HEAD:main, so a release from a detached clean worktree pushes too.
git push origin HEAD:main

# This repo's .npmrc maps the @heyramzi scope, and pnpm 12 lets that beat --registry, so pack
# once into $2 and npm-publish the tarball from outside the repo.
publish_github() {
  local tgz
  (cd "$1" && pnpm pack --pack-destination "$2" >/dev/null)
  tgz=$(ls "$2"/*.tgz)
  (cd "$2" && npm publish "$tgz" --access public \
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

# npmjs gets the same tarball from CI: it rides on the GitHub release, and publish-npmjs.yml
# publishes it with npm trusted publishing, so no npm token lives on this Mac. The build can't run
# in CI because it calls vibe-kit's build-dist.mjs, and vibe-kit is private.
printf '%s' "$plan" | while read -r component dir version next bump first_release; do
  tag="$component-v$next"
  out=$(mktemp -d)
  git tag "$tag"
  git push origin "$tag"
  pack_rewritten "$dir" "$out"
  gh release create "$tag" "$out"/*.tgz --repo heyramzi/ui --title "$tag" \
    --notes-file "$NOTES_DIR/$component.md"
  rm -rf "${out:?}"
done

rm -rf "$NOTES_DIR"
# The site's nav shows the ui version, so every release ships it too.
(cd site && pnpm run deploy)

echo "release: done."
