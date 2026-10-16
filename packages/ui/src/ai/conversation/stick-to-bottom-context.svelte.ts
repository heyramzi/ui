import { setContext, getContext } from "svelte";

const STICK_TO_BOTTOM_CONTEXT_KEY = Symbol("stick-to-bottom-context");

const SCROLL_THRESHOLD_PX = 200;

export class StickToBottomContext {
  #element: HTMLElement | null = $state(null);
  #isAtBottom = $state(true);
  #userHasScrolled = $state(false);
  #resizeObserver: ResizeObserver | null = null;
  #mutationObserver: MutationObserver | null = null;
  #intersectionObserver: IntersectionObserver | null = null;
  #sentinel: HTMLElement | null = null;

  isAtBottom = $derived(this.#isAtBottom);

  setElement(element: HTMLElement) {
    this.#cleanup();
    this.#element = element;
    if (element) this.#setupObservers();
  }

  scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (!this.#element) return;
    this.#userHasScrolled = false;
    this.#element.scrollTo({ top: this.#element.scrollHeight, behavior });
  };

  destroy() {
    this.#cleanup();
    this.#element = null;
  }

  #handleScroll = () => {
    if (!this.#element) return;
    const { scrollTop, scrollHeight, clientHeight } = this.#element;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD_PX;
    this.#isAtBottom = isAtBottom;
    if (!isAtBottom) {
      this.#userHasScrolled = true;
    } else if (this.#userHasScrolled) {
      this.#userHasScrolled = false;
    }
  };

  #setupObservers() {
    if (!this.#element) return;

    this.#sentinel = document.createElement("div");
    this.#sentinel.style.height = "1px";
    this.#sentinel.style.width = "100%";
    this.#sentinel.style.pointerEvents = "none";
    this.#sentinel.style.opacity = "0";
    this.#sentinel.setAttribute("data-stick-to-bottom-sentinel", "");
    this.#element.appendChild(this.#sentinel);

    this.#intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          this.#isAtBottom = true;
          this.#userHasScrolled = false;
        }
      },
      { threshold: 0, root: this.#element },
    );
    this.#intersectionObserver.observe(this.#sentinel);

    this.#element.addEventListener("scroll", this.#handleScroll, { passive: true });

    this.#resizeObserver = new ResizeObserver(() => {
      this.#checkPosition();
      if (this.#isAtBottom && !this.#userHasScrolled) {
        this.scrollToBottom("auto");
      }
    });
    this.#resizeObserver.observe(this.#element);

    this.#mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        const shouldAutoScroll = this.#isAtBottom && !this.#userHasScrolled;
        this.#checkPosition();
        if (shouldAutoScroll) this.scrollToBottom("smooth");
      });
    });
    this.#mutationObserver.observe(this.#element, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    this.#checkPosition();
  }

  #checkPosition() {
    if (!this.#element) return;
    const { scrollTop, scrollHeight, clientHeight } = this.#element;
    this.#isAtBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD_PX;
  }

  #cleanup() {
    this.#resizeObserver?.disconnect();
    this.#mutationObserver?.disconnect();
    this.#intersectionObserver?.disconnect();
    if (this.#element) {
      this.#element.removeEventListener("scroll", this.#handleScroll);
    }
    if (this.#sentinel && this.#element?.contains(this.#sentinel)) {
      this.#element.removeChild(this.#sentinel);
    }
    this.#resizeObserver = null;
    this.#mutationObserver = null;
    this.#intersectionObserver = null;
    this.#sentinel = null;
  }
}

export function setStickToBottomContext(): StickToBottomContext {
  const context = new StickToBottomContext();
  setContext(STICK_TO_BOTTOM_CONTEXT_KEY, context);
  return context;
}

export function getStickToBottomContext(): StickToBottomContext {
  const context = getContext<StickToBottomContext>(STICK_TO_BOTTOM_CONTEXT_KEY);
  if (!context) {
    throw new Error("Conversation parts must be used inside a <Conversation>.");
  }
  return context;
}
