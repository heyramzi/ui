import { MediaQuery } from "svelte/reactivity";

// WHY 1024, not 768: this picks rail or drawer, and the question is width left
// for content. A 256px rail on an 834px iPad leaves 578px, which is too narrow.
const DEFAULT_MOBILE_BREAKPOINT = 1024;

export class IsMobile extends MediaQuery {
  constructor(breakpoint: number = DEFAULT_MOBILE_BREAKPOINT) {
    super(`max-width: ${breakpoint - 1}px`);
  }
}
