import type { Component } from "svelte";
import type { SVGAttributes } from "svelte/elements";

export type IconWeight = "bold" | "duotone" | "fill" | "light" | "thin" | "regular";

type IconBaseProps = {
  color?: string;
  size?: number | string;
  weight?: IconWeight;
  mirrored?: boolean;
};

// WHY structural: it matches phosphor-svelte v2 `IconProps` and v3
// `IconComponentProps` without importing either. This package peers v2, the apps run v3.
export type PhosphorIcon = Component<
  Omit<SVGAttributes<SVGSVGElement>, keyof IconBaseProps> & IconBaseProps
>;
