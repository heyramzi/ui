/** The app's one horizontal gutter. */

// WHY a token: the tab strip said `px-4 md:px-6` and page bodies `p-4`, so from
// `md` up the nav sat 8px right of the content. Same fact typed twice.

// The content edge won: sixty page bodies against one strip. Anything lining up
// with the page body names this instead of retyping a padding.
export const pageGutterClass = "px-4";
