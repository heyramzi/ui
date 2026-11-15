import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import InfoList from "#src/record/info-list.svelte";

describe("InfoList", () => {
  // A host can fill InfoRow.href itself, so the list checks the scheme at the anchor too.
  it("draws a javascript: href as plain text and keeps an https one a link", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const app = mount(InfoList, {
      target,
      props: {
        rows: [
          { label: "Website", value: "click me", href: "javascript:alert(document.domain)" },
          { label: "Docs", value: "example.com", href: "https://example.com/" },
        ],
      },
    });
    flushSync();
    const hrefs = [...target.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["https://example.com/"]);
    expect(target.textContent).toContain("click me");
    void unmount(app);
    target.remove();
  });
});
