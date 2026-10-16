import { type Component, getContext, setContext } from "svelte";

export const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: string;
    icon?: Component;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

export type TooltipSeriesItem = {
  key: string;
  label: string;
  value: unknown;
  color: string | undefined;
  visible: boolean;
  config: unknown;
};

export function getPayloadConfigFromPayload(
  config: ChartConfig,
  item: TooltipSeriesItem,
  key: string,
) {
  if (typeof item !== "object" || item === null) return undefined;

  let configLabelKey: string = key;

  if (item.key === key) {
    configLabelKey = item.key;
  } else if (item.label === key) {
    configLabelKey = item.label;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config];
}

type ChartContextValue = {
  config: ChartConfig;
};

const chartContextKey = Symbol("chart-context");

export function setChartContext(value: ChartContextValue) {
  return setContext(chartContextKey, value);
}

export function useChart() {
  return getContext<ChartContextValue>(chartContextKey);
}
