/** Every string the package renders. Pass a partial `labels` prop to translate. */
export type DeckLabels = {
  deck: string;
  deckRole: string;
  slideRole: string;
  previous: string;
  next: string;
  fullscreen: string;
  overview: string;
  presenter: string;
  progress: string;
  slide: (n: number, of: number) => string;
  upcoming: string;
  current: string;
  notes: string;
  noNotes: string;
  endOfDeck: string;
  timer: string;
  startTimer: string;
  pauseTimer: string;
  resetTimer: string;
  unknownType: (type: string) => string;
};

export const defaultLabels: DeckLabels = {
  deck: "Slide deck",
  deckRole: "presentation",
  slideRole: "slide",
  previous: "Previous slide",
  next: "Next slide",
  fullscreen: "Toggle fullscreen",
  overview: "Slide overview",
  presenter: "Open presenter view",
  progress: "Deck progress",
  slide: (n, of) => `Slide ${n} of ${of}`,
  upcoming: "Next",
  current: "Now",
  notes: "Notes",
  noNotes: "No notes for this slide.",
  endOfDeck: "End of deck.",
  timer: "Elapsed time",
  startTimer: "Start timer",
  pauseTimer: "Pause timer",
  resetTimer: "Reset timer",
  unknownType: (type) => `Unknown slide type: ${type}`,
};

export const resolveLabels = (labels?: Partial<DeckLabels>): DeckLabels => ({
  ...defaultLabels,
  ...labels,
});
