/**
 * GLSL ported from ruucm/shadergradient (`shaders/defaults/plane`), rewritten for plain WebGL.
 */

/*
 * Upstream runs the same math through a three.js MeshPhysicalMaterial, but its canvas is configured `linear: true, flat: true` (no sRGB encode, no tone mapping) and its only light is `ambientLight`
 */

/*
 * at `brightness * PI`. With no directional light and no environment map, every specular term of that material is zero and the whole PBR path collapses to
 */

/*
 * irradiance * BRDF_Lambert(diffuse * (1 minus metalness)) = (brightness * PI) * (1 / PI) * (base * 0.8) = brightness * 0.8 * base
 */

/*
 * which is the one multiply in the fragment shader below.
 */

/*
 * That is why this component carries no `reflection`, `envPreset` or `lightType` prop: upstream reads them, and at these settings none of them can change a pixel.
 */

/** Classic 3D Perlin noise, from glsl-noise/periodic/3d, exactly as upstream vendors it. */
const CLASSIC_NOISE_3D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}
`;

export const MESH_VERTEX_SHADER = /* glsl */ `
precision highp float;

attribute vec3 position;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform float uTime;
uniform float uSpeed;
uniform float uNoiseDensity;
uniform float uNoiseStrength;

varying vec3 vPos;

${CLASSIC_NOISE_3D}

void main() {
  float t = uTime * uSpeed;

  // The plane's normal is a constant (0, 0, 1), so the whole mesh folds along z only.
  vec3 noisePos = 0.43 * position * uNoiseDensity;
  float distortion = 0.75 * cnoise(noisePos + t);
  vec3 pos = position + vec3(0.0, 0.0, 1.0) * distortion * uNoiseStrength;

  vPos = pos;
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(pos, 1.0);
}
`;

export const MESH_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uBrightness;
uniform float uFoldRange;

varying vec3 vPos;

void main() {
  // Left to right sweep between the first two stops.
  vec3 base = mix(uC1, uC2, smoothstep(-3.0, 3.0, vPos.x));

  // The third stop rides the fold depth, over the range the fold actually reaches.
  //
  // WHY this is a smoothstep and not upstream's raw mix of the stop against vPos.z: vPos.z
  // is a world coordinate, not a ratio, and at the preset strength it swings about
  // three units. mix does not clamp, so that reads as a mix factor of -3 to 3 and
  // throws the colour far outside the gamut, where every channel meets 0 or 1 and
  // stops. Each of those meetings is a straight hard edge across the gradient, and
  // they are what draws the diagonal lines. Upstream gets away with it because its
  // stops are pale: a pastel pushed three times past itself is still roughly a
  // colour. A palette with real chroma in it, which is the point of using brand
  // colours, hits the wall almost at once.
  //
  // Mapping the fold across its own range keeps every pixel inside the gamut, so the
  // field stays smooth wherever the stops are taken from. The trade is the blown out
  // highlight upstream gets for free; the answer to that is a brighter third stop,
  // which is a decision the caller can see and make.
  vec3 color = mix(base, uC3, smoothstep(-uFoldRange, uFoldRange, vPos.z));

  // Ambient-only lighting, metalness 0.2. See the note at the top of this file.
  gl_FragColor = vec4(color * uBrightness * 0.8, 1.0);
}
`;

export const QUAD_VERTEX_SHADER = /* glsl */ `
precision highp float;

attribute vec2 position;

varying vec2 vUV;
varying vec2 vPosition;

void main() {
  vUV = position * 0.5 + 0.5;
  vPosition = position;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * RGB halftone, ported from three's HalftoneShader as upstream configures it: dot shape, scatter 1, linear blending at 1 (so the dots replace the source rather than blend with it) and
 */

/*
 * the per-channel rotations from `PostProcessing.tsx`.
 */

/*
 * Upstream's `getSample` averages nine taps spread over `radius * 0.0`, meaning nine taps of the same texel.
 */

/*
 * This keeps one tap, which is the same value for a twelfth of the bandwidth.
 */
export const HALFTONE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

#define PI2 6.28318531

uniform sampler2D tDiffuse;
uniform float uRadius;
uniform float uRotateR;
uniform float uRotateG;
uniform float uRotateB;
uniform float uScatter;
uniform float uWidth;
uniform float uHeight;

varying vec2 vUV;
varying vec2 vPosition;

struct Cell {
  vec2 p1;
  vec2 p2;
  vec2 p3;
  vec2 p4;
};

float hypot(float x, float y) { return sqrt(x * x + y * y); }

float rand(vec2 seed) {
  return fract(sin(dot(seed.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 getSample(vec2 point) {
  return texture2D(tDiffuse, vec2(point.x / uWidth, point.y / uHeight));
}

float distanceToDotRadius(float channel, vec2 coord, vec2 p, float radMax) {
  float dist = hypot(coord.x - p.x, coord.y - p.y);
  float rad = pow(abs(channel), 1.125) * radMax;
  return rad - dist;
}

Cell getReferenceCell(vec2 p, vec2 origin, float gridAngle, float step_) {
  Cell c;

  vec2 n = vec2(cos(gridAngle), sin(gridAngle));
  float threshold = step_ * 0.5;
  float dotNormal = n.x * (p.x - origin.x) + n.y * (p.y - origin.y);
  float dotLine = -n.y * (p.x - origin.x) + n.x * (p.y - origin.y);
  vec2 offset = vec2(n.x * dotNormal, n.y * dotNormal);
  float offsetNormal = mod(hypot(offset.x, offset.y), step_);
  float normalDir = (dotNormal < 0.0) ? 1.0 : -1.0;
  float normalScale = ((offsetNormal < threshold) ? -offsetNormal : step_ - offsetNormal) * normalDir;
  float offsetLine = mod(hypot((p.x - offset.x) - origin.x, (p.y - offset.y) - origin.y), step_);
  float lineDir = (dotLine < 0.0) ? 1.0 : -1.0;
  float lineScale = ((offsetLine < threshold) ? -offsetLine : step_ - offsetLine) * lineDir;

  c.p1.x = p.x - n.x * normalScale + n.y * lineScale;
  c.p1.y = p.y - n.y * normalScale - n.x * lineScale;

  if (uScatter != 0.0) {
    float offMag = uScatter * threshold * 0.5;
    float offAngle = rand(vec2(floor(c.p1.x), floor(c.p1.y))) * PI2;
    c.p1.x += cos(offAngle) * offMag;
    c.p1.y += sin(offAngle) * offMag;
  }

  float normalStep = normalDir * ((offsetNormal < threshold) ? step_ : -step_);
  float lineStep = lineDir * ((offsetLine < threshold) ? step_ : -step_);
  c.p2.x = c.p1.x - n.x * normalStep;
  c.p2.y = c.p1.y - n.y * normalStep;
  c.p3.x = c.p1.x + n.y * lineStep;
  c.p3.y = c.p1.y - n.x * lineStep;
  c.p4.x = c.p1.x - n.x * normalStep + n.y * lineStep;
  c.p4.y = c.p1.y - n.y * normalStep - n.x * lineStep;

  return c;
}

float getDotColour(Cell c, vec2 p, vec3 channel, float aa) {
  // Selected by dot product rather than by component index, because GLSL ES 1.00 leaves
  // dynamic component indexing to the driver and some of them refuse to compile it.
  vec4 channels = vec4(
    dot(getSample(c.p1).rgb, channel),
    dot(getSample(c.p2).rgb, channel),
    dot(getSample(c.p3).rgb, channel),
    dot(getSample(c.p4).rgb, channel)
  );

  float d1 = distanceToDotRadius(channels.x, c.p1, p, uRadius);
  float d2 = distanceToDotRadius(channels.y, c.p2, p, uRadius);
  float d3 = distanceToDotRadius(channels.z, c.p3, p, uRadius);
  float d4 = distanceToDotRadius(channels.w, c.p4, p, uRadius);

  float res = (d1 > 0.0) ? clamp(d1 / aa, 0.0, 1.0) : 0.0;
  res += (d2 > 0.0) ? clamp(d2 / aa, 0.0, 1.0) : 0.0;
  res += (d3 > 0.0) ? clamp(d3 / aa, 0.0, 1.0) : 0.0;
  res += (d4 > 0.0) ? clamp(d4 / aa, 0.0, 1.0) : 0.0;

  return clamp(res, 0.0, 1.0);
}

void main() {
  // Subtracting vPosition is upstream's nudge that keeps the dot grid off the
  // frame edge, where a partial cell reads as a black border.
  vec2 p = vec2(vUV.x * uWidth, vUV.y * uHeight) - vPosition * 3.0;
  vec2 origin = vec2(0.0);
  float aa = (uRadius < 2.5) ? uRadius * 0.5 : 1.25;

  Cell cellR = getReferenceCell(p, origin, uRotateR, uRadius);
  Cell cellG = getReferenceCell(p, origin, uRotateG, uRadius);
  Cell cellB = getReferenceCell(p, origin, uRotateB, uRadius);

  float r = getDotColour(cellR, p, vec3(1.0, 0.0, 0.0), aa);
  float g = getDotColour(cellG, p, vec3(0.0, 1.0, 0.0), aa);
  float b = getDotColour(cellB, p, vec3(0.0, 0.0, 1.0), aa);

  // A channel that is black in the source stays black, so the dots never lighten
  // an unlit part of the frame.
  vec4 source = texture2D(tDiffuse, vUV);
  r = (source.r == 0.0) ? 0.0 : r;
  g = (source.g == 0.0) ? 0.0 : g;
  b = (source.b == 0.0) ? 0.0 : b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
`;
