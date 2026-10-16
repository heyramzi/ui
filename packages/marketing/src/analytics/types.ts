export type EventData = Record<string, string | number | boolean>;

export type RevenueData = {
  revenue: number;
  currency: string;
} & EventData;

export type UmamiConfig = {
  websiteId: string;
  hostUrl?: string;
  domains?: string[];
};

declare global {
  interface Window {
    umami?: {
      track: {
        (): void;
        (event: string): void;
        (event: string, data: Record<string, unknown>): void;
        (fn: (props: Record<string, unknown>) => Record<string, unknown>): void;
      };
      identify?: (data: Record<string, unknown>) => void;
    };
  }
}
