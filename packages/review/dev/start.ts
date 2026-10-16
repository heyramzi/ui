import { mountStartChoice } from "#src/index.js";

const params = new URLSearchParams(location.search);
const raw = params.get("features");
let off = false;
try {
  off = JSON.parse(raw ?? "{}").openscreen === true;
} catch {
  off = false;
}

// The page learns the gate either from a stubbed `/features` or from this prop, so a test can pick.
mountStartChoice(document.getElementById("start") as HTMLElement, {
  say: "Start a new video called My first video, from this Descript project: <paste the link>",
  ...(raw === null ? {} : { features: { openscreen: off, openscreenInstalled: false } }),
  onFeatures: (features) => {
    if (features.openscreen) document.body.dataset.openscreen = "1";
    else delete document.body.dataset.openscreen;
  },
});
