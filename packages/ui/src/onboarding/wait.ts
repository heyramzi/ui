const find = (selector: string) => document.querySelector(selector);

/** Resolves with the element once the selector matches, or null after `timeoutMs` or an abort. */
export function waitForElement(
	selector: string,
	timeoutMs: number,
	signal?: AbortSignal,
): Promise<Element | null> {
	return new Promise((resolve) => {
		const now = find(selector);
		if (now) return resolve(now);
		if (signal?.aborted) return resolve(null);

		const finish = (el: Element | null) => {
			observer.disconnect();
			clearTimeout(timer);
			signal?.removeEventListener("abort", onAbort);
			resolve(el);
		};
		const onAbort = () => finish(null);
		const observer = new MutationObserver(() => {
			const el = find(selector);
			if (el) finish(el);
		});
		const timer = setTimeout(() => finish(find(selector)), timeoutMs);
		observer.observe(document.documentElement, { childList: true, subtree: true });
		signal?.addEventListener("abort", onAbort);
	});
}
