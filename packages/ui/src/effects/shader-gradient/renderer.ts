import {
  HALFTONE_FRAGMENT_SHADER,
  MESH_FRAGMENT_SHADER,
  MESH_VERTEX_SHADER,
  QUAD_VERTEX_SHADER,
} from "#src/effects/shader-gradient/shaders.js";
import type { ShaderGradientUniforms } from "#src/effects/shader-gradient/types.js";

/** Upstream builds `planeGeometry(10, 10, 1, 192)`: one cell across, 192 down. */
const PLANE_SIZE = 10;
const PLANE_SEGMENTS = 192;

const DEG_TO_RAD = Math.PI / 180;

/** Per-channel screen angles, in the order `PostProcessing.tsx` assigns them. */
const HALFTONE_ROTATION = {
  r: Math.PI / 12,
  g: (Math.PI / 12) * 3,
  b: (Math.PI / 12) * 2,
};
const HALFTONE_SCATTER = 1;

/** Widest half-frame, in world units, the sheet is known to cover at every phase. */
const MAX_VISIBLE_HALF_WIDTH = 2.4;

/**
 * Widest angle, in degrees, between the view axis and a ray to the corner of the frame.
 */

/*
 * This is what keeps the sheet from hiding part of itself: see the framing note in `render`.
 */
const MAX_CORNER_RAY_DEGREES = 10;

export interface ShaderGradientRenderer {
  setSize(width: number, height: number): void;
  render(uniforms: ShaderGradientUniforms, time: number): void;
  destroy(): void;
}

/**
 * A strip of quads one cell wide, exactly upstream's `planeGeometry(10, 10, 1, 192)`.
 */

/*
 * Only the y axis is subdivided, which is what gives the sheet its long unbroken folds: across a row the fold is one straight interpolation between the two edges,
 */

/*
 * with nothing in between to bend it.
 */
function createPlane() {
  const positions = new Float32Array((PLANE_SEGMENTS + 1) * 2 * 3);
  const indices = new Uint16Array(PLANE_SEGMENTS * 6);
  const half = PLANE_SIZE / 2;
  const segment = PLANE_SIZE / PLANE_SEGMENTS;

  for (let iy = 0; iy <= PLANE_SEGMENTS; iy++) {
    const y = -(iy * segment - half);
    const offset = iy * 6;
    positions[offset] = -half;
    positions[offset + 1] = y;
    positions[offset + 2] = 0;
    positions[offset + 3] = half;
    positions[offset + 4] = y;
    positions[offset + 5] = 0;
  }

  for (let iy = 0; iy < PLANE_SEGMENTS; iy++) {
    const a = iy * 2;
    const b = (iy + 1) * 2;
    const c = (iy + 1) * 2 + 1;
    const d = iy * 2 + 1;
    const offset = iy * 6;
    indices[offset] = a;
    indices[offset + 1] = b;
    indices[offset + 2] = d;
    indices[offset + 3] = b;
    indices[offset + 4] = c;
    indices[offset + 5] = d;
  }

  return { positions, indices };
}

function perspective(fovDegrees: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan((fovDegrees * DEG_TO_RAD) / 2);
  const range = 1 / (near - far);
  // prettier-ignore
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * range, -1,
    0, 0, 2 * far * near * range, 0,
  ]);
}

/** View matrix for a camera sitting on a sphere around the origin, looking at it. */
function orbitView(distance: number, polarDegrees: number, azimuthDegrees: number) {
  const polar = polarDegrees * DEG_TO_RAD;
  const azimuth = azimuthDegrees * DEG_TO_RAD;
  const eye = [
    distance * Math.sin(polar) * Math.sin(azimuth),
    distance * Math.cos(polar),
    distance * Math.sin(polar) * Math.cos(azimuth),
  ];

  // Camera basis, target fixed at the origin so `eye` doubles as the forward axis.
  let zx = eye[0];
  let zy = eye[1];
  let zz = eye[2];
  const zLength = Math.hypot(zx, zy, zz) || 1;
  zx /= zLength;
  zy /= zLength;
  zz /= zLength;

  // up is (0, 1, 0), so cross(up, z) reduces to this.
  let xx = zz;
  let xy = 0;
  let xz = -zx;
  const xLength = Math.hypot(xx, xy, xz) || 1;
  xx /= xLength;
  xy /= xLength;
  xz /= xLength;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  // prettier-ignore
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

/** Translation times an XYZ-ordered euler rotation, matching three's `Euler` default. */
function modelMatrix(
  position: [number, number, number],
  rotationDegrees: [number, number, number],
) {
  const a = Math.cos(rotationDegrees[0] * DEG_TO_RAD);
  const b = Math.sin(rotationDegrees[0] * DEG_TO_RAD);
  const c = Math.cos(rotationDegrees[1] * DEG_TO_RAD);
  const d = Math.sin(rotationDegrees[1] * DEG_TO_RAD);
  const e = Math.cos(rotationDegrees[2] * DEG_TO_RAD);
  const f = Math.sin(rotationDegrees[2] * DEG_TO_RAD);

  const ae = a * e;
  const af = a * f;
  const be = b * e;
  const bf = b * f;

  // prettier-ignore
  return new Float32Array([
    c * e, af + be * d, bf - ae * d, 0,
    -c * f, ae - bf * d, be + af * d, 0,
    d, -b * c, a * c, 0,
    position[0], position[1], position[2], 1,
  ]);
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("shader-gradient: could not create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`shader-gradient: shader failed to compile. ${log}`);
  }

  return shader;
}

function link(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("shader-gradient: could not create program");

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`shader-gradient: program failed to link. ${log}`);
  }

  return program;
}

function uniformLocations(gl: WebGLRenderingContext, program: WebGLProgram, names: string[]) {
  const locations: Record<string, WebGLUniformLocation | null> = {};
  for (const name of names) locations[name] = gl.getUniformLocation(program, name);
  return locations;
}

/**
 * Returns null when the browser has no WebGL, so the caller can fall back to a plain
 * background instead of throwing during hydration.
 */
export function createShaderGradientRenderer(
  canvas: HTMLCanvasElement,
): ShaderGradientRenderer | null {
  const gl = (canvas.getContext("webgl2", { antialias: true, alpha: false }) ??
    canvas.getContext("webgl", { antialias: true, alpha: false })) as WebGLRenderingContext | null;
  if (!gl) return null;

  const plane = createPlane();

  const meshProgram = link(gl, MESH_VERTEX_SHADER, MESH_FRAGMENT_SHADER);
  const meshUniforms = uniformLocations(gl, meshProgram, [
    "uProjectionMatrix",
    "uViewMatrix",
    "uModelMatrix",
    "uTime",
    "uSpeed",
    "uNoiseDensity",
    "uNoiseStrength",
    "uC1",
    "uC2",
    "uC3",
    "uBrightness",
    "uFoldRange",
  ]);
  const meshPositionAttribute = gl.getAttribLocation(meshProgram, "position");

  const halftoneProgram = link(gl, QUAD_VERTEX_SHADER, HALFTONE_FRAGMENT_SHADER);
  const halftoneUniforms = uniformLocations(gl, halftoneProgram, [
    "tDiffuse",
    "uRadius",
    "uRotateR",
    "uRotateG",
    "uRotateB",
    "uScatter",
    "uWidth",
    "uHeight",
  ]);
  const halftonePositionAttribute = gl.getAttribLocation(halftoneProgram, "position");

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, plane.positions, gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, plane.indices, gl.STATIC_DRAW);

  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  // Offscreen target for the halftone pass. Skipped entirely when grain is off.
  const targetTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const framebuffer = gl.createFramebuffer();

  let width = 1;
  let height = 1;

  const setSize = (nextWidth: number, nextHeight: number) => {
    width = Math.max(1, Math.floor(nextWidth));
    height = Math.max(1, Math.floor(nextHeight));
    canvas.width = width;
    canvas.height = height;

    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const render = (uniforms: ShaderGradientUniforms, time: number) => {
    const aspect = width / height;

    /*
     * Framing, in two parts: how much of the sheet to show, and how long a lens to show it with. The caller's `fov` and `cDistance` set the first.
     */

    /*
     * The second is not the caller's to set, and this is why.
     */

    /*
     * The sheet is a height field: one segment across, 192 down, displaced along its own normal only.
     */

    /*
     * Its folds are steep, past 70 degrees at the preset strength, and a surface that steep hides part of itself as soon as the view rays open far enough to
     */

    /*
     * look along a fold. What comes back is a hard straight edge with a different colour on each side, because the sheet is ruled across its width,
     */

    /*
     * so the line where it turns out of sight is one of those straight generators, and because the fragment colour rides the fold depth,
     */

    /*
     * so the two sides of it sit at different depths and read as two different colours meeting.
     */

    /*
     * It arrives in a corner, where the rays open widest, and it comes and goes with the drift. Nothing about it looks like a fold; it looks like a tear.
     */

    /*
     * So the lens length is set by the frame, not by the caller: push the camera back until no ray to a corner opens more than MAX_CORNER_RAY_DEGREES,
     */

    /*
     * then pick the field of view that puts the same half-frame back.
     */

    /*
     * The visible size is unchanged, at every aspect and for every caller, and the only thing that goes is the perspective inside it,
     */

    /*
     * which at these settings is a fold that pumps toward the camera rather than anything the composition needs.
     */

    /*
     * Measured over 8 frame shapes from 0.55 to 3.2, both presets, 50 phases of the drift: 84 of those 800 frames carried an edge over 1.5 levels per pixel with
     */

    /*
     * the rays uncapped, the worst 8.3.
     */

    /*
     * At 14 degrees none of them did, and at 10 the worst frame sits at 0.75, which is the eight-bit floor of a smooth field.
     */

    /*
     * Below 5 degrees nothing improves, so this is not a number to keep lowering.
     */

    /*
     * `MAX_VISIBLE_HALF_WIDTH` still caps how much of the sheet a wide frame reaches for, because the sheet does run out: it is ten units across and the noise pushes parts of
     */

    /*
     * it away, so past roughly a 1.8 frame an uncapped view would outrun it and show the clear colour behind its edge.
     */

    /*
     * Widening the sheet instead would need a seam, which draws a hard line of its own.
     */
    const halfHeight = Math.min(
      Math.tan((uniforms.fov * DEG_TO_RAD) / 2) * uniforms.cDistance,
      MAX_VISIBLE_HALF_WIDTH / aspect,
    );
    const cornerRadius = Math.hypot(halfHeight * aspect, halfHeight);
    const distance = Math.max(
      uniforms.cDistance,
      cornerRadius / Math.tan(MAX_CORNER_RAY_DEGREES * DEG_TO_RAD),
    );
    const fov = (2 * Math.atan(halfHeight / distance)) / DEG_TO_RAD;

    gl.bindFramebuffer(gl.FRAMEBUFFER, uniforms.grain ? framebuffer : null);
    gl.viewport(0, 0, width, height);
    gl.clearColor(uniforms.bgColor[0], uniforms.bgColor[1], uniforms.bgColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(meshProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(meshPositionAttribute);
    gl.vertexAttribPointer(meshPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.uniformMatrix4fv(meshUniforms.uProjectionMatrix, false, perspective(fov, aspect, 0.1, 1000));
    gl.uniformMatrix4fv(
      meshUniforms.uViewMatrix,
      false,
      orbitView(distance, uniforms.cPolarAngle, uniforms.cAzimuthAngle),
    );
    gl.uniformMatrix4fv(
      meshUniforms.uModelMatrix,
      false,
      modelMatrix(
        [uniforms.positionX, uniforms.positionY, uniforms.positionZ],
        [uniforms.rotationX, uniforms.rotationY, uniforms.rotationZ],
      ),
    );
    gl.uniform1f(meshUniforms.uTime, time);
    gl.uniform1f(meshUniforms.uSpeed, uniforms.uSpeed);
    gl.uniform1f(meshUniforms.uNoiseDensity, uniforms.uDensity);
    gl.uniform1f(meshUniforms.uNoiseStrength, uniforms.uStrength);
    gl.uniform3fv(meshUniforms.uC1, uniforms.color1);
    gl.uniform3fv(meshUniforms.uC2, uniforms.color2);
    gl.uniform3fv(meshUniforms.uC3, uniforms.color3);
    gl.uniform1f(meshUniforms.uBrightness, uniforms.brightness);
    // The fold reaches 0.75 x cnoise x strength, and classic Perlin tops out near 1.1.

    // Slightly under that keeps the crests and troughs at the stops rather than short of them.
    gl.uniform1f(meshUniforms.uFoldRange, 0.75 * uniforms.uStrength);

    gl.drawElements(gl.TRIANGLES, plane.indices.length, gl.UNSIGNED_SHORT, 0);

    if (!uniforms.grain) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);

    gl.useProgram(halftoneProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(halftonePositionAttribute);
    gl.vertexAttribPointer(halftonePositionAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    gl.uniform1i(halftoneUniforms.tDiffuse, 0);
    gl.uniform1f(halftoneUniforms.uRadius, uniforms.grainRadius);
    gl.uniform1f(halftoneUniforms.uRotateR, HALFTONE_ROTATION.r);
    gl.uniform1f(halftoneUniforms.uRotateG, HALFTONE_ROTATION.g);
    gl.uniform1f(halftoneUniforms.uRotateB, HALFTONE_ROTATION.b);
    gl.uniform1f(halftoneUniforms.uScatter, HALFTONE_SCATTER);
    gl.uniform1f(halftoneUniforms.uWidth, width);
    gl.uniform1f(halftoneUniforms.uHeight, height);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const destroy = () => {
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(indexBuffer);
    gl.deleteBuffer(quadBuffer);
    gl.deleteTexture(targetTexture);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteProgram(meshProgram);
    gl.deleteProgram(halftoneProgram);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };

  return { setSize, render, destroy };
}
