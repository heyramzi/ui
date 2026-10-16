/**
 * Day windows a strip offers: seven, thirty, ninety, the three every dataset
 * has. A page may add an option its data carries; labels translate at the
 * call site.
 */
export const DAY_WINDOWS = [7, 30, 90] as const;

export type DayWindow = (typeof DAY_WINDOWS)[number];
