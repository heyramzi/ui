/** Throw from an adapter to answer with a status, e.g. 404 for a video that isn't there. */
export class ReviewError extends Error {
  readonly status: number;
  constructor(message: string, status = 404) {
    super(message);
    this.name = "ReviewError";
    this.status = status;
  }
}
