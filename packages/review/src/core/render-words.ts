/** What a render is, in the words a person uses: the preview video, or the final. */
export type RenderNoun = "video" | "final";

/** Every render state, worded once. The cover on the frame and the Render final button both read from here. */
export const renderWords = {
  /** `ahead` left out says only that it's waiting, for a space with no room for the count. */
  queued: (noun: RenderNoun, ahead?: number): string => {
    if (ahead === 0) return `Your ${noun} is next in line`;
    if (ahead === undefined) return `Your ${noun} is in line`;
    return `Your ${noun} is in line, ${ahead} ${ahead === 1 ? "video" : "videos"} ahead of it`;
  },
  making: (noun: RenderNoun, updating = false): string =>
    `${updating ? "Updating" : "Making"} your ${noun}`,
};
