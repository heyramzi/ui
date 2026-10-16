import { tryCatch } from "@heyramzi/utils";
import type { BorderBeamSize } from "#src/effects/border-beam/presets.js";

interface PropertyRegistration {
  name: string;
  syntax: "<angle>" | "<number>";
  initialValue: string;
  inherits: boolean;
}

interface CssPropertyRegistry {
  registerProperty?: (registration: PropertyRegistration) => void;
}

/**
 * WHY this exists at all, when generateCss already emits the same @property rules: Chrome ignores an @property rule that sits inside a shadow root,
 */

/*
 * so a beam rendered in one has no registration.
 */

/*
 * Unregistered, the angle cannot be interpolated and, worse, every mask that reads it is invalid at computed-value time, which resolves the mask to none and floods the whole element instead
 */

/*
 * of drawing a border. This call registers on the document, which is why the ids are unique per instance.
 */
export function registerBorderBeamProperties(id: string, size: BorderBeamSize): void {
  const registry = globalThis.CSS as CssPropertyRegistry | undefined;
  if (typeof registry?.registerProperty !== "function") return;

  for (const registration of getBorderBeamPropertyRegistrations(id, size)) {
    tryCatch(() => registry.registerProperty?.(registration));
  }
}

function getBorderBeamPropertyRegistrations(
  id: string,
  size: BorderBeamSize,
): PropertyRegistration[] {
  if (size === "line") {
    return [
      numberProperty(`--beam-x-${id}`, "0"),
      numberProperty(`--beam-w-${id}`, "1"),
      numberProperty(`--beam-h-${id}`, "1"),
      numberProperty(`--beam-spike-${id}`, "1"),
      numberProperty(`--beam-spike2-${id}`, "1"),
      numberProperty(`--beam-edge-${id}`, "1"),
      numberProperty(`--beam-opacity-${id}`, "0"),
    ];
  }

  return [
    {
      name: `--beam-angle-${id}`,
      syntax: "<angle>",
      initialValue: "0deg",
      inherits: true,
    },
    numberProperty(`--beam-opacity-${id}`, "0"),
  ];
}

function numberProperty(name: string, initialValue: string): PropertyRegistration {
  return {
    name,
    syntax: "<number>",
    initialValue,
    inherits: true,
  };
}
