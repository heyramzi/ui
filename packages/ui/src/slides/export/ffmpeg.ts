// Encode frames to an mp4 with the ffmpeg on the machine. The package ships no
// binary; pass `ffmpeg` to name one that is not on PATH.

import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

/** Runs ffmpeg and resolves when it exits 0; the error carries the tail of its stderr. */
export function runFfmpeg(args: string[], ffmpeg = "ffmpeg"): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) =>
      reject(
        new Error(
          `${ffmpeg} could not be started (${error.message}). Video export needs ffmpeg on PATH, or pass its path.`,
        ),
      ),
    );
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${ffmpeg} exited ${code}:\n${stderr.slice(-1500)}`)),
    );
  });
}

export interface EncodeOptions {
  fps: number;
  /** x264 constant rate factor; lower is bigger and cleaner. Default 23. */
  crf?: number;
  /** x264 speed preset. Default `slow`. */
  preset?: string;
  /** The printf pattern the frames are numbered with. Default `%04d.png`. */
  pattern?: string;
  ffmpeg?: string;
}

/** The ffmpeg arguments for a silent yuv420p H.264 mp4 from a numbered image sequence. */
export function encodeArgs(dir: string, outFile: string, options: EncodeOptions): string[] {
  return [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-framerate",
    String(options.fps),
    "-i",
    path.join(dir, options.pattern ?? "%04d.png"),
    "-an",
    "-vf",
    "format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    options.preset ?? "slow",
    "-crf",
    String(options.crf ?? 23),
    "-movflags",
    "+faststart",
    outFile,
  ];
}

/** Encodes a folder of numbered frames. There is no audio stream at all. */
export async function encodeFrames(
  dir: string,
  outFile: string,
  options: EncodeOptions,
): Promise<void> {
  await mkdir(path.dirname(outFile), { recursive: true });
  await runFfmpeg(encodeArgs(dir, outFile, options), options.ffmpeg);
}

export interface LoopFrame {
  /** Zero-based frame number. */
  index: number;
  /** Position in the cycle, in [0, 1). */
  t: number;
  /** Where this frame must be written, as a PNG. */
  file: string;
}

export interface LoopOptions extends Omit<EncodeOptions, "fps" | "pattern"> {
  fps?: number;
  seconds?: number;
  /** Photograph the frame at `t`; called once per frame, in order. */
  drawFrame(frame: LoopFrame): Promise<void>;
}

/** Frames for a loop of this length: whole frames only, never fewer than one. */
export function loopFrameCount(seconds: number, fps: number): number {
  return Math.max(1, Math.round(seconds * fps));
}

/**
 * Renders a seamless loop: asks `drawFrame` for t = 0, 1/n, ... (n-1)/n and
 * encodes the result.
 *
 * `t` never reaches 1, so the last frame is one step short of the first and
 * the cut back to frame zero is the same step as every other. Driving all
 * motion off one t is what makes the seam exact by construction. A captured
 * CSS animation loops only when its last frame happens to land on its first.
 */
export async function renderLoop(
  outFile: string,
  options: LoopOptions,
): Promise<{ file: string; frames: number; seconds: number }> {
  const fps = options.fps ?? 30;
  const seconds = options.seconds ?? 2.5;
  const frames = loopFrameCount(seconds, fps);
  const work = `${outFile}.frames`;
  await mkdir(work, { recursive: true });
  try {
    for (let index = 0; index < frames; index++) {
      await options.drawFrame({
        index,
        t: index / frames,
        file: path.join(work, `${String(index).padStart(4, "0")}.png`),
      });
    }
    await encodeFrames(work, outFile, { ...options, fps });
  } finally {
    await rm(work, { recursive: true, force: true });
  }
  return { file: outFile, frames, seconds };
}
