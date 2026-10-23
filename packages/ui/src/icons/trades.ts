/**
 * Trade icon map. Tabler covers the domain Lucide and Phosphor miss.
 */

/*
 * Lucide/Phosphor gap audit (Sept 2026) against the 14 trade pills in the "NOT SURE? TAP WHAT YOU DO" strip. Lucide has `hammer`, `wrench`, `hard-hat`, `bolt`, `brick-wall`,
 */

/*
 * `building`, `car`, but no `trowel`, no tiling grid, no `window` cleaning `spray/squeegee`, no `crane`, no dedicated `handyman` toolset. Phosphor has `hammer`, `wrench`, `hard-hat`, `paint-roller`, and also no `trowel`.
 */

/*
 * Tabler 3.46 (6184 icons, MIT) has all 14 at a consistent 2px stroke on 24×24: droplet/pipe, bolt, home (roof), tools, key, window,
 */

/*
 * car-garage, hammer / wave-saw-tool, helmet, trowel, grid-dots, leaf, car, crane. Svelte 5 port is ` @tabler/icons-svelte-runes` (runes, not the Svelte 4 ` @tabler/icons-svelte`).
 */

import {
  IconBolt,
  IconCar,
  IconCarGarage,
  IconCrane,
  IconDroplet,
  IconGridDots,
  IconHammer,
  IconHelmet,
  IconHome,
  IconKey,
  IconLeaf,
  IconTools,
  IconTrowel,
  IconWindow,
} from "@tabler/icons-svelte-runes";
import type { Component } from "svelte";

export type TradeSlug =
  | "plumbers"
  | "electricians"
  | "roofers"
  | "handymen"
  | "locksmiths"
  | "window-cleaners"
  | "garages"
  | "carpenters"
  | "builders"
  | "plasterers"
  | "tilers"
  | "gardeners"
  | "mobile-mechanics"
  | "construction-companies";

export const tradeIconMap: Record<TradeSlug, Component> = {
  plumbers: IconDroplet,
  electricians: IconBolt,
  roofers: IconHome,
  handymen: IconTools,
  locksmiths: IconKey,
  "window-cleaners": IconWindow,
  garages: IconCarGarage,
  carpenters: IconHammer,
  builders: IconHelmet,
  plasterers: IconTrowel,
  tilers: IconGridDots,
  gardeners: IconLeaf,
  "mobile-mechanics": IconCar,
  "construction-companies": IconCrane,
};

export const tradeLabels: Record<TradeSlug, string> = {
  plumbers: "PLUMBERS",
  electricians: "ELECTRICIANS",
  roofers: "ROOFERS",
  handymen: "HANDYMEN",
  locksmiths: "LOCKSMITHS",
  "window-cleaners": "WINDOW CLEANERS",
  garages: "GARAGES",
  carpenters: "CARPENTERS",
  builders: "BUILDERS",
  plasterers: "PLASTERERS",
  tilers: "TILERS",
  gardeners: "GARDENERS",
  "mobile-mechanics": "MOBILE MECHANICS",
  "construction-companies": "CONSTRUCTION COMPANIES",
};

export const tradeSlugs: TradeSlug[] = Object.keys(tradeIconMap) as TradeSlug[];
