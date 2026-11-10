import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it, vi } from "vite-plus/test";
import StarRatingInput from "#src/components/star-rating-input/star-rating-input.svelte";

function render(props: Record<string, unknown> = {}) {
  const onchange = vi.fn();
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(StarRatingInput, { target, props: { value: 0, onchange, ...props } });
  flushSync();
  const stars = target.querySelector<HTMLElement>(".stars");
  if (!stars) throw new Error("StarRatingInput rendered no stars");
  const key = (k: string) => {
    stars.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    flushSync();
  };
  return {
    stars,
    onchange,
    key,
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

// The 10 Nov audit: arrows did nothing, zero was out of reach, and a read-only name left out the value.
describe("StarRatingInput keyboard", () => {
  it("is one slider from 0 to max that arrows step through", () => {
    const { stars, onchange, key, done } = render({ value: 2 });
    expect(stars.getAttribute("role")).toBe("slider");
    expect(stars.tabIndex).toBe(0);
    expect(stars.getAttribute("aria-valuemin")).toBe("0");
    expect(stars.getAttribute("aria-valuemax")).toBe("5");
    key("ArrowRight");
    expect(stars.getAttribute("aria-valuenow")).toBe("3");
    key("ArrowLeft");
    key("ArrowDown");
    expect(stars.getAttribute("aria-valuenow")).toBe("1");
    expect(onchange.mock.calls.map(([v]) => v)).toEqual([3, 2, 1]);
    done();
  });

  it("clears to zero with Home, and End goes to max", () => {
    const { stars, onchange, key, done } = render({ value: 4 });
    key("Home");
    expect(stars.getAttribute("aria-valuenow")).toBe("0");
    expect(stars.getAttribute("aria-valuetext")).toBe("No rating");
    expect(onchange).toHaveBeenLastCalledWith(0);
    key("End");
    expect(stars.getAttribute("aria-valuenow")).toBe("5");
    done();
  });

  it("clears to zero when the only lit star is clicked again", () => {
    const { stars, onchange, done } = render({ value: 1 });
    stars.querySelector<HTMLElement>("[data-value='1']")?.click();
    flushSync();
    expect(stars.getAttribute("aria-valuenow")).toBe("0");
    expect(onchange).toHaveBeenLastCalledWith(0);
    done();
  });

  it("reads the value and its label as the value text", () => {
    const labels = ["Poor", "Fair", "Good", "Very good", "Excellent"];
    const { stars, key, done } = render({ value: 3, labels, ariaLabel: "Rate the delivery" });
    expect(stars.getAttribute("aria-label")).toBe("Rate the delivery");
    expect(stars.getAttribute("aria-valuetext")).toBe("3 of 5 stars, Good");
    key("4");
    expect(stars.getAttribute("aria-valuetext")).toBe("4 of 5 stars, Very good");
    done();
  });

  it("ignores keys while disabled and leaves the Tab order", () => {
    const { stars, onchange, key, done } = render({ value: 2, disabled: true });
    expect(stars.tabIndex).toBe(-1);
    expect(stars.getAttribute("aria-disabled")).toBe("true");
    key("ArrowRight");
    expect(onchange).not.toHaveBeenCalled();
    done();
  });

  it("names a read-only rating with its value", () => {
    const { stars, done } = render({ value: 3, readonly: true });
    expect(stars.getAttribute("role")).toBe("img");
    expect(stars.getAttribute("aria-label")).toBe("Rating, 3 of 5 stars");
    done();
  });
});
