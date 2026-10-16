export type TestimonialCaption = {
  src: string;
  srclang: string;
  label: string;
};

export type GetCaption = (videoUrl: string) => TestimonialCaption | null;
