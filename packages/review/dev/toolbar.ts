/** A slim strip of dev switches, drawn outside the review page. */
export function mountToolbar(current: string): void {
  const bar = document.createElement("div");
  bar.id = "dev-toolbar";
  bar.style.cssText =
    "position:fixed;z-index:999;left:50%;bottom:8px;translate:-50% 0;display:flex;gap:6px;padding:4px 6px;border-radius:8px;background:#000c;color:#fff;font:11px system-ui;opacity:.35";
  bar.onmouseenter = () => (bar.style.opacity = "1");
  bar.onmouseleave = () => (bar.style.opacity = ".35");
  const button = (label: string, run: () => void) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = "font:inherit;padding:2px 6px";
    b.onclick = run;
    bar.append(b);
  };
  const go = (patch: Record<string, string>) => {
    const next = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    location.search = next.toString();
  };
  void fetch("/__dev/fixtures")
    .then((r) => r.json())
    .then((ids: string[]) => {
      for (const id of ids) button(id === current ? `[${id}]` : id, () => go({ id }));
    });
  button("light", () => go({ theme: "light" }));
  button("dark", () => go({ theme: "dark" }));
  button("stop stream", () => void fetch("/__dev/events/stop"));
  button("resume stream", () => void fetch("/__dev/events/start"));
  document.body.append(bar);
}
