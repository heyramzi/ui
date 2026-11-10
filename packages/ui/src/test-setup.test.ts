import { MediaQuery } from "svelte/reactivity";
import { expect, it } from "vite-plus/test";
it("has matchMedia before any import runs", () => {
  expect(new MediaQuery("(min-width: 1px)").current).toBe(false);
});
