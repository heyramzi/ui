#!/bin/zsh
# Usage: scripts/shoot.sh <name> <url> <width> <height>. Screenshots through Orca at a set viewport.
# Orca's tab only paints while it's on screen, so the tab opens focused and comes to the front
# before the shot. The tab is closed on every exit, failures included.
set -eu
if (( $# != 4 )); then
  echo "usage: scripts/shoot.sh <name> <url> <width> <height>" >&2
  exit 64
fi
OUT="$(cd "$(dirname "$0")/.." && pwd)/screenshots"
mkdir -p "$OUT"
command -v orca >/dev/null || { echo "shoot.sh: the orca CLI isn't on PATH. Open Orca once." >&2; exit 1; }

PAGE=$(orca tab create --url about:blank --focus --json | jq -r '.result.browserPageId // empty')
[[ -n "$PAGE" ]] || { echo "shoot.sh: orca tab create opened no tab. Is Orca running? (orca status)" >&2; exit 1; }
trap 'orca tab close --page "$PAGE" >/dev/null 2>&1 || true' EXIT

MOBILE=()
(( $3 < 500 )) && MOBILE=(--mobile)
orca goto --page "$PAGE" --url "$2" >/dev/null
orca wait --page "$PAGE" --load domcontentloaded --timeout 20000 >/dev/null
# After the goto: a viewport set on about:blank is dropped by the navigation.
orca viewport --page "$PAGE" --width "$3" --height "$4" --scale 1 $MOBILE >/dev/null
sleep 2.2
orca tab switch --page "$PAGE" >/dev/null
# `orca screenshot` saves CSS pixels, so the PNG is <width>x<height>, as deviceScaleFactor 1 was.
SHOT=$(orca screenshot --page "$PAGE" --format png --json | jq -r '.result.path // empty')
[[ -s "$SHOT" ]] || { echo "shoot.sh: Orca returned no screenshot for $2" >&2; exit 1; }
mv "$SHOT" "$OUT/$1.png"
echo "$OUT/$1.png"
