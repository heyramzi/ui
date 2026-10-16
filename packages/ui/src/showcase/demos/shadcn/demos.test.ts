// The demos are upstream's and arrive by script, so nothing reviews them before
// they land. This is the gate: every one of them mounts and draws something.
import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import Harness from "#src/showcase/demos/shadcn/demo-harness.svelte";
import { SHADCN_DEMOS } from "#src/showcase/demos/shadcn/index.js";

describe("shadcn demos", () => {
  for (const demo of SHADCN_DEMOS) {
    it(`${demo.name} renders`, () => {
      const target = document.createElement("div");
      document.body.appendChild(target);
      const app = mount(Harness, { target, props: { Comp: demo.Comp } });
      flushSync();
      expect(target.innerHTML.length).toBeGreaterThan(0);
      void unmount(app);
      target.remove();
    });
  }
});
