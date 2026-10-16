#!/usr/bin/env bash
# Local release for the private ui repo. Hosted runners are off (private minutes
# are billed), so releases run from the Mac, the same way vibe-kit's release.sh
# starts them — except this script does the whole job, because there is no CI to
# hand off to:
#   pnpm release            # publish every package with changes since its last tag
#   DRY_RUN=1 pnpm release  # print the plan, change nothing
#   BUMP="ui=major" pnpm release  # force a bump the commit types don't show
#
# For each package with commits since its last <component>-v<version> tag, this
# bumps the version from the conventional-commit types (feat -> minor,
# feat!/BREAKING CHANGE -> major, anything else -> patch), writes the
# CHANGELOG.md entry, commits the bumps,
# tags <component>-v<version>, creates the GitHub release and publishes to
# npmjs and GitHub Packages. Both tokens come from ~/.npmrc.
set -euo pipefail
cd "$(dirname "$0")/.."

DRY_RUN="${DRY_RUN:-0}"
TODAY=$(date +%Y-%m-%d)
NOTES_DIR=$(mktemp -d)

# component -> package dir. board, draw, slides and review are private workspace packages.
COMPONENTS="ui packages/ui
marketing packages/marketing
agents packages/agents"

plan=""
while read -r component dir; do
  [ -n "$component" ] || continue
  version=$(node -p "require('./$dir/package.json').version")
  tag="$component-v$version"
  if git rev-parse "$tag" >/dev/null 2>&1; then
    range="$tag..HEAD"
    first_release=0
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

  bump="patch"
  if printf '%s\n' "$subjects" | grep -qE '^[a-z]+(\(.+\))?!:|BREAKING CHANGE'; then
    bump="major"
  elif printf '%s\n' "$subjects" | grep -qE '^feat(\(.+\))?:'; then
    bump="minor"
  fi
  # A package with no tag yet has never published from here: least it can
  # take is a minor, so a move reads as a feature, never a patch.
  if [ "$first_release" = "1" ] && [ "$bump" = "patch" ]; then
    bump="minor"
  fi
  if [ "$untracked" = "1" ]; then
    bump="minor"
  fi
  # A removal committed as refactor: reads as a patch, and every app's ^range
  # would install it. BUMP="ui=major marketing=major" says what the log can't.
  for override in ${BUMP:-}; do
    if [ "${override%%=*}" = "$component" ]; then
      bump="${override#*=}"
    fi
  done
  next=$(node -e "
    const [M, m, p] = '$version'.split('.').map(Number);
    const b = '$bump';
    console.log(b === 'major' ? (M + 1) + '.0.0' : b === 'minor' ? M + '.' + (m + 1) + '.0' : M + '.' + m + '.' + (p + 1));
  ")
  plan="$plan$component $dir $version $next $bump $first_release
"
done <<< "$COMPONENTS"

if [ -z "$plan" ]; then
  echo "release: nothing changed since the last tags."
  exit 0
fi

echo "release plan:"
printf '%s' "$plan" | while read -r component dir version next bump first_release; do
  echo "  $component: $version -> $next ($bump)"
done

if [ "$DRY_RUN" = "1" ]; then
  echo "release: dry run, stopping."
  exit 0
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
git push origin main

# npmjs is the public install. GitHub Packages stays because every Studio app maps the whole
# @heyramzi scope there for the private packages. This repo's .npmrc maps the scope too, and
# pnpm 12 lets that beat --registry, so pack once and npm-publish the tarball from outside the repo.
publish_both() {
  local out tgz
  out=$(mktemp -d)
  (cd "$1" && pnpm pack --pack-destination "$out" >/dev/null)
  tgz=$(ls "$out"/*.tgz)
  for registry in https://registry.npmjs.org/ https://npm.pkg.github.com/; do
    (cd "$out" && npm publish "$tgz" --access public \
      --registry="$registry" "--@heyramzi:registry=$registry")
  done
  rm -rf "${out:?}"
}

printf '%s' "$plan" | while read -r component dir version next bump first_release; do
  tag="$component-v$next"
  git tag "$tag"
  git push origin "$tag"
  gh release create "$tag" --repo heyramzi/ui --title "$tag" --notes-file "$NOTES_DIR/$component.md"
  if [ "$component" = "ui" ]; then
    # Published code cannot keep #src self-imports: Vite cannot resolve a
    # package's own # imports inside node_modules. Rewrite in place for the
    # publish, then restore the tree.
    node packages/ui/scripts/relative-imports.mjs
    publish_both "$dir"
    git checkout -- packages/ui/src packages/ui/scripts
  else
    publish_both "$dir"
  fi
done

rm -rf "$NOTES_DIR"
echo "release: done."
