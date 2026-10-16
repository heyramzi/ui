export type CollectionLayout = "grid" | "carousel" | "compact" | "highlight";

export type CollectionStat = {
  number: string;
  labelEn: string;
  labelFr: string;
};

export type PublicTestimonial = {
  id: string;
  authorName: string;
  authorRole: string | null;
  authorCompany: string | null;
  authorPhotoUrl: string | null;
  content: string;
  /** Curated pull-quote for surfaces with room for a line or two. Null when unset. */
  excerpt: string | null;
  rating: number | null;
  videoUrl: string | null;
  locale: "en" | "fr";
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
};

export type PublicCollectionResponse = {
  collection: {
    id: string;
    name: string;
    layout: CollectionLayout;
    isPublic: boolean;
    stats: CollectionStat[];
  };
  testimonials: PublicTestimonial[];
};
