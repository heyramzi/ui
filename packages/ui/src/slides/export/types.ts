// The slice of Playwright the export helpers touch, declared here so the package
// takes no Playwright dependency and any installed version fits.

export interface Size {
  width: number;
  height: number;
}

export type WaitUntil = "load" | "domcontentloaded" | "networkidle";

export interface ResponseLike {
  ok(): boolean;
  status(): number;
}

export interface LocatorLike {
  first(): LocatorLike;
  nth(index: number): LocatorLike;
  count(): Promise<number>;
  waitFor(options?: { state?: "visible"; timeout?: number }): Promise<void>;
  screenshot(options?: { path?: string; type?: "png" }): Promise<Uint8Array>;
}

export interface PageLike {
  goto(
    url: string,
    options?: { waitUntil?: WaitUntil; timeout?: number },
  ): Promise<ResponseLike | null>;
  setContent(html: string, options?: { waitUntil?: WaitUntil; timeout?: number }): Promise<void>;
  addStyleTag(options: { content: string }): Promise<unknown>;
  evaluate<R>(pageFunction: () => R | Promise<R>): Promise<R>;
  waitForTimeout(ms: number): Promise<void>;
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<unknown>;
  locator(selector: string): LocatorLike;
  screenshot(options?: { type?: "png"; fullPage?: boolean }): Promise<Uint8Array>;
  pdf(options: {
    path?: string;
    width?: string;
    height?: string;
    printBackground?: boolean;
    preferCSSPageSize?: boolean;
    pageRanges?: string;
  }): Promise<Uint8Array>;
  url(): string;
  close(): Promise<void>;
}

export interface BrowserLike {
  newPage(options?: { viewport?: Size; deviceScaleFactor?: number }): Promise<PageLike>;
}
