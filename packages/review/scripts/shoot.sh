#!/bin/zsh
# Usage: scripts/shoot.sh <name> <url> <width> <height>. Screenshots through ego-browser at a set viewport.
OUT="$(cd "$(dirname "$0")/.." && pwd)/screenshots"
ego-browser nodejs -e "
const task = await taskSpace('review shots');
const page = task.page('p1');
await page.cdp('Emulation.setDeviceMetricsOverride', { width: $3, height: $4, deviceScaleFactor: 1, mobile: $3 < 500 });
await page.goto('about:blank');
await page.goto('$2', { waitUntil: 'domcontentloaded', timeout: 20000 });
await new Promise(r => setTimeout(r, 2200));
await page.screenshot({ path: '$OUT/$1.png' });
"
