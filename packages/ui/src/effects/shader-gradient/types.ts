export interface ShaderGradientProps {
  class?: string;
  /** Warm stop. Any CSS color, including `var(--token)`. Read at the left edge of the plane. */
  color1?: string;
  /** Middle stop. Read at the right edge of the plane. */
  color2?: string;
  /** Cool stop. Mixed in by the noise displacement, so it rides the crests and troughs. */
  color3?: string;
  /** Painted behind the mesh. The mesh covers the frame at the default camera, so it only shows at extreme angles. */
  bgColor?: string;
  /** false freezes the field at `uTime`. Forced false when the visitor asks for reduced motion. */
  animate?: boolean;
  /** Ambient light. 1 is flat, above 1 lifts the whole field. */
  brightness?: number;
  /** Camera azimuth in degrees. */
  cAzimuthAngle?: number;
  /** Camera polar angle in degrees. */
  cPolarAngle?: number;
  /** Camera distance from the origin. */
  cDistance?: number;
  /** Vertical field of view in degrees. */
  fov?: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  /** Mesh rotation in degrees, applied in XYZ order. */
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  /** Noise density. Higher packs more folds into the same plane. */
  uDensity?: number;
  /** Noise travel speed. */
  uSpeed?: number;
  /** Displacement amplitude. Drives how far color3 pushes into the mix. */
  uStrength?: number;
  /** Starting time offset in seconds. Two instances with different offsets never sit on the same frame. */
  uTime?: number;
  /** Halftone dot screen over the render. This is the upstream `grain` switch. */
  grain?: boolean;
  /** Halftone dot radius in device pixels. */
  grainRadius?: number;
  /** Render scale. 1 matches upstream and is enough for a gradient this smooth. */
  pixelDensity?: number;
}

/** Everything the renderer needs, with colors already resolved to 0..1 RGB triplets. */
export interface ShaderGradientUniforms {
  color1: [number, number, number];
  color2: [number, number, number];
  color3: [number, number, number];
  bgColor: [number, number, number];
  brightness: number;
  cAzimuthAngle: number;
  cPolarAngle: number;
  cDistance: number;
  fov: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  uDensity: number;
  uSpeed: number;
  uStrength: number;
  grain: boolean;
  grainRadius: number;
}
